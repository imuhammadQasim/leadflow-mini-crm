<?php
/**
 * Handles pushing a locally-saved lead to the Node.js API. Used both right
 * after a visitor submits the form, and again when an admin clicks "Retry
 * sync" on a failed row.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class LeadFlow_Connector_API_Sync {

	/**
	 * Sends one lead to POST {api_url}/public/leads and writes the outcome
	 * back onto the local row (see LeadFlow_Connector_DB::update_sync_result).
	 *
	 * The lead is ALWAYS saved locally before this runs (see
	 * class-leadflow-shortcode.php) - a failed sync here never loses the
	 * submission, it just leaves sync_status = 'failed' for an admin to retry.
	 *
	 * @param object $lead Row from LeadFlow_Connector_DB::get_lead()/insert.
	 * @return array{success: bool, message: string} Outcome, for the caller to act on if needed.
	 */
	public static function sync_lead( $lead ) {
		$api_url    = trim( get_option( 'leadflow_connector_api_url', '' ) );
		$api_secret = get_option( 'leadflow_connector_api_secret', '' );

		if ( empty( $api_url ) || empty( $api_secret ) ) {
			$message = 'API URL or API secret is not configured (see LeadFlow Connector > Settings).';
			LeadFlow_Connector_DB::update_sync_result( $lead->id, 'failed', $message );
			return array( 'success' => false, 'message' => $message );
		}

		// The Node API's public intake route lives at POST {base}/public/leads
		// (see api/src/routes/publicRoutes.js in the Node project) - api_url
		// is expected to be the base, e.g. http://localhost:5000/api.
		$endpoint = rtrim( $api_url, '/' ) . '/public/leads';

		// Field names/casing here (camelCase budgetRange) match exactly what
		// api/src/validators/leadValidators.js expects in the request body.
		$payload = array(
			'name'        => $lead->name,
			'email'       => $lead->email,
			'phone'       => $lead->phone,
			'service'     => $lead->service,
			'budgetRange' => $lead->budget_range,
			'message'     => $lead->message,
			'source'      => $lead->source,
		);

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 15,
				'headers' => array(
					'Content-Type' => 'application/json',
					// Shared secret expected by verifyWordPressSecret middleware
					// on the API side - NOT a JWT, WordPress has no admin session.
					'x-api-key'    => $api_secret,
				),
				'body'    => wp_json_encode( $payload ),
			)
		);

		// wp_remote_post() never throws - a network-level failure (DNS,
		// timeout, connection refused) comes back as a WP_Error instead of
		// a normal response, so that has to be checked separately from a
		// non-2xx HTTP status.
		if ( is_wp_error( $response ) ) {
			$message = 'Network error contacting the API: ' . $response->get_error_message();
			LeadFlow_Connector_DB::update_sync_result( $lead->id, 'failed', $message );
			return array( 'success' => false, 'message' => $message );
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status_code >= 200 && $status_code < 300 && ! empty( $body['success'] ) ) {
			$api_lead_id = isset( $body['data']['_id'] ) ? sanitize_text_field( $body['data']['_id'] ) : null;
			$message     = 'Synced successfully.';
			LeadFlow_Connector_DB::update_sync_result( $lead->id, 'synced', $message, $api_lead_id );
			return array( 'success' => true, 'message' => $message );
		}

		// API responded, but rejected the lead (e.g. 400 validation, 401 bad
		// secret, 409 duplicate) - surface its own message when present,
		// since that's more useful to an admin than a generic failure.
		$api_message = ! empty( $body['message'] ) ? $body['message'] : 'Unexpected response from API (HTTP ' . $status_code . ').';
		LeadFlow_Connector_DB::update_sync_result( $lead->id, 'failed', $api_message );
		return array( 'success' => false, 'message' => $api_message );
	}
}
