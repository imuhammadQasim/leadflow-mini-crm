<?php
/**
 * Registers the wp-admin screens: a top-level "LeadFlow Leads" menu with
 * two pages - the leads list (with per-row retry-sync) and a settings page
 * for the API URL/secret. Both pages are gated behind manage_options, the
 * standard "site administrator" capability.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class LeadFlow_Connector_Admin {

	const RETRY_ACTION = 'leadflow_retry_sync';

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_post_' . self::RETRY_ACTION, array( $this, 'handle_retry_sync' ) );
	}

	public function register_menu() {
		add_menu_page(
			'LeadFlow Leads',
			'LeadFlow Leads',
			'manage_options',
			'leadflow-connector',
			array( $this, 'render_leads_page' ),
			'dashicons-email-alt2',
			26
		);

		add_submenu_page(
			'leadflow-connector',
			'Leads',
			'Leads',
			'manage_options',
			'leadflow-connector',
			array( $this, 'render_leads_page' )
		);

		add_submenu_page(
			'leadflow-connector',
			'LeadFlow Settings',
			'Settings',
			'manage_options',
			'leadflow-connector-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Registers the two settings fields (API URL + API secret) with the
	 * Settings API. Using register_setting()/settings_fields() instead of a
	 * hand-rolled form gets nonce handling, capability checks, and sanitize
	 * callbacks for free instead of reimplementing them.
	 */
	public function register_settings() {
		register_setting(
			'leadflow_connector_settings_group',
			'leadflow_connector_api_url',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
				'default'           => '',
			)
		);

		register_setting(
			'leadflow_connector_settings_group',
			'leadflow_connector_api_secret',
			array(
				'type'              => 'string',
				// Secrets shouldn't be tag-stripped/altered beyond trimming -
				// sanitize_text_field would also strip characters a real
				// secret could legitimately contain.
				'sanitize_callback' => 'trim',
				'default'           => '',
			)
		);
	}

	public function render_leads_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'You do not have permission to access this page.' );
		}
		$leads = LeadFlow_Connector_DB::get_leads( 200 );
		require LEADFLOW_CONNECTOR_DIR . 'admin/views/leads-list.php';
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'You do not have permission to access this page.' );
		}
		require LEADFLOW_CONNECTOR_DIR . 'admin/views/settings-page.php';
	}

	/**
	 * Handles the "Retry sync" button on a failed (or any) lead row.
	 * Registered on admin_post_{action}, so it only runs for logged-in
	 * users - admin_post_nopriv_ is deliberately NOT registered here,
	 * since only admins should ever trigger a retry.
	 */
	public function handle_retry_sync() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'You do not have permission to do this.' );
		}

		$lead_id = isset( $_POST['lead_id'] ) ? absint( $_POST['lead_id'] ) : 0;

		// Nonce is per-lead (includes the ID) so one retry link can't be
		// reused to retry a different row than the one it was generated for.
		check_admin_referer( self::RETRY_ACTION . '_' . $lead_id );

		$lead = $lead_id ? LeadFlow_Connector_DB::get_lead( $lead_id ) : null;

		if ( $lead ) {
			LeadFlow_Connector_API_Sync::sync_lead( $lead );
		}

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'             => 'leadflow-connector',
					'leadflow_retried' => $lead_id,
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
}
