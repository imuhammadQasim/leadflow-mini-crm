<?php
/**
 * Registers the [leadflow_form] shortcode and handles its submission via
 * WordPress's built-in AJAX system (admin-ajax.php). AJAX is used instead
 * of a plain form POST so the visitor gets an inline success/error message
 * without a full page reload, while still working the same for logged-in
 * and logged-out visitors (wp_ajax_ vs wp_ajax_nopriv_ hooks below).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class LeadFlow_Connector_Shortcode {

	// Action name shared between the JS fetch() call and the two AJAX hooks,
	// and used to scope the nonce so it can't be reused for a different action.
	const AJAX_ACTION = 'leadflow_submit_lead';

	public function __construct() {
		add_shortcode( 'leadflow_form', array( $this, 'render_form' ) );

		// wp_ajax_{action} fires for logged-in users, wp_ajax_nopriv_{action}
		// for everyone else. A public lead form needs both, or anonymous
		// site visitors (the normal case) would get a "0" / no-op response.
		add_action( 'wp_ajax_' . self::AJAX_ACTION, array( $this, 'handle_submit' ) );
		add_action( 'wp_ajax_nopriv_' . self::AJAX_ACTION, array( $this, 'handle_submit' ) );
	}

	/**
	 * Shortcode callback: [leadflow_form]. Enqueues the form's CSS/JS only
	 * on pages that actually use the shortcode, and outputs the markup.
	 */
	public function render_form() {
		wp_enqueue_style(
			'leadflow-form',
			LEADFLOW_CONNECTOR_URL . 'public/css/leadflow-form.css',
			array(),
			LEADFLOW_CONNECTOR_VERSION
		);

		wp_enqueue_script(
			'leadflow-form',
			LEADFLOW_CONNECTOR_URL . 'public/js/leadflow-form.js',
			array(), // no jQuery dependency - plain fetch() is enough here.
			LEADFLOW_CONNECTOR_VERSION,
			true
		);

		// Hands the JS the AJAX endpoint URL and a nonce. The nonce is
		// generated server-side (wp_create_nonce) and re-checked server-side
		// on submit (check_ajax_referer) - it proves the request came from
		// this page/session, not from a forged cross-site request.
		wp_localize_script(
			'leadflow-form',
			'leadflowFormData',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'action'  => self::AJAX_ACTION,
				'nonce'   => wp_create_nonce( self::AJAX_ACTION ),
			)
		);

		ob_start();
		?>
		<form id="leadflow-form" class="leadflow-form" novalidate>
			<div class="leadflow-form__row">
				<label for="leadflow-name">Name <span aria-hidden="true">*</span></label>
				<input type="text" id="leadflow-name" name="name" maxlength="120" required />
			</div>

			<div class="leadflow-form__row leadflow-form__row--half">
				<div>
					<label for="leadflow-email">Email <span aria-hidden="true">*</span></label>
					<input type="email" id="leadflow-email" name="email" required />
				</div>
				<div>
					<label for="leadflow-phone">Phone <span aria-hidden="true">*</span></label>
					<input type="tel" id="leadflow-phone" name="phone" required />
				</div>
			</div>

			<div class="leadflow-form__row leadflow-form__row--half">
				<div>
					<label for="leadflow-service">Service <span aria-hidden="true">*</span></label>
					<select id="leadflow-service" name="service" required>
						<option value="">Select a service&hellip;</option>
						<?php foreach ( LeadFlow_Connector_DB::SERVICES as $service ) : ?>
							<option value="<?php echo esc_attr( $service ); ?>"><?php echo esc_html( $service ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>
				<div>
					<label for="leadflow-budget">Budget Range <span aria-hidden="true">*</span></label>
					<select id="leadflow-budget" name="budget_range" required>
						<option value="">Select a range&hellip;</option>
						<?php foreach ( LeadFlow_Connector_DB::BUDGET_RANGES as $value => $label ) : ?>
							<option value="<?php echo esc_attr( $value ); ?>"><?php echo esc_html( $label ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>
			</div>

			<div class="leadflow-form__row">
				<label for="leadflow-message">Message <span aria-hidden="true">*</span></label>
				<textarea id="leadflow-message" name="message" rows="4" maxlength="2000" required></textarea>
			</div>

			<div class="leadflow-form__errors" role="alert" aria-live="polite"></div>

			<button type="submit" class="leadflow-form__submit">Send message</button>
		</form>
		<?php
		return ob_get_clean();
	}

	/**
	 * AJAX handler for the form. Always re-validates everything server-side
	 * even though the JS also validates client-side - client-side checks are
	 * only a UX nicety, never trustworthy on their own since a request can
	 * be sent directly to admin-ajax.php bypassing the browser entirely.
	 */
	public function handle_submit() {
		// check_ajax_referer's 3rd arg (false) makes it return false instead
		// of calling wp_die() on failure, so we can send a clean JSON error.
		if ( ! check_ajax_referer( self::AJAX_ACTION, 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => 'Security check failed. Please refresh the page and try again.' ) );
		}

		$errors = array();

		// sanitize_text_field/sanitize_email/sanitize_textarea_field strip
		// tags and control characters - this runs on every field before it
		// touches the database, regardless of what the validation below finds.
		$name         = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
		$email        = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
		$phone        = sanitize_text_field( wp_unslash( $_POST['phone'] ?? '' ) );
		$service      = sanitize_text_field( wp_unslash( $_POST['service'] ?? '' ) );
		$budget_range = sanitize_text_field( wp_unslash( $_POST['budget_range'] ?? '' ) );
		$message      = sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) );

		if ( '' === $name ) {
			$errors['name'] = 'Name is required.';
		} elseif ( mb_strlen( $name ) > 120 ) {
			$errors['name'] = 'Name is too long.';
		}

		if ( '' === $email || ! is_email( $email ) ) {
			$errors['email'] = 'A valid email address is required.';
		}

		// Loose but sane phone check: strip everything but digits, require
		// at least 7 - matches the same rule the Node API enforces.
		$phone_digits = preg_replace( '/\D/', '', $phone );
		if ( '' === $phone || strlen( $phone_digits ) < 7 ) {
			$errors['phone'] = 'A valid phone number is required.';
		}

		// service/budget_range must be one of the fixed option values, not
		// arbitrary text - otherwise the API would just reject the sync anyway.
		if ( ! in_array( $service, LeadFlow_Connector_DB::SERVICES, true ) ) {
			$errors['service'] = 'Please choose a valid service.';
		}

		if ( ! array_key_exists( $budget_range, LeadFlow_Connector_DB::BUDGET_RANGES ) ) {
			$errors['budget_range'] = 'Please choose a valid budget range.';
		}

		if ( '' === $message ) {
			$errors['message'] = 'Message is required.';
		} elseif ( mb_strlen( $message ) > 2000 ) {
			$errors['message'] = 'Message is too long.';
		}

		if ( ! empty( $errors ) ) {
			wp_send_json_error(
				array(
					'message' => 'Please fix the errors below.',
					'errors'  => $errors,
				)
			);
		}

		// Save to WordPress FIRST, before attempting the API sync - the
		// submission must never be lost just because the Node API is down.
		$lead_id = LeadFlow_Connector_DB::insert_lead(
			array(
				'name'         => $name,
				'email'        => $email,
				'phone'        => $phone,
				'service'      => $service,
				'budget_range' => $budget_range,
				'message'      => $message,
				'source'       => 'website',
			)
		);

		if ( false === $lead_id ) {
			wp_send_json_error( array( 'message' => 'Could not save your message. Please try again.' ) );
		}

		$lead = LeadFlow_Connector_DB::get_lead( $lead_id );
		// Sync result isn't surfaced to the visitor - their submission
		// already succeeded (it's saved in WordPress); a failed sync just
		// leaves this row for an admin to retry from the Leads screen.
		LeadFlow_Connector_API_Sync::sync_lead( $lead );

		wp_send_json_success( array( 'message' => "Thanks! We've received your message and will be in touch soon." ) );
	}
}
