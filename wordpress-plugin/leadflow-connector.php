<?php
/**
 * Plugin Name: LeadFlow Connector
 * Description: Displays a lead capture form ([leadflow_form]), stores submissions in WordPress, and syncs them to the LeadFlow Node.js API.
 * Version: 1.0.0
 * Author: LeadFlow
 * License: GPL-2.0+
 * Text Domain: leadflow-connector
 */

// Block direct access to this file (someone requesting it straight from the
// browser instead of through WordPress) - a standard guard on every plugin file.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LEADFLOW_CONNECTOR_VERSION', '1.0.0' );
define( 'LEADFLOW_CONNECTOR_DB_VERSION', '1.0.0' ); // bumped when the table schema changes, so activation can re-run dbDelta().
define( 'LEADFLOW_CONNECTOR_DIR', plugin_dir_path( __FILE__ ) );
define( 'LEADFLOW_CONNECTOR_URL', plugin_dir_url( __FILE__ ) );

require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-db.php';
require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-api-sync.php';
require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-shortcode.php';
require_once LEADFLOW_CONNECTOR_DIR . 'admin/class-leadflow-admin.php';

/**
 * Runs once on activation: creates the custom leads table (see
 * includes/class-leadflow-db.php for why a table was chosen over a custom
 * post type). Safe to run on every activation - dbDelta() only creates
 * what's missing / alters what changed, it won't touch existing rows.
 */
function leadflow_connector_activate() {
	LeadFlow_Connector_DB::create_table();
	update_option( 'leadflow_connector_db_version', LEADFLOW_CONNECTOR_DB_VERSION );
}
register_activation_hook( __FILE__, 'leadflow_connector_activate' );

/**
 * Deactivation intentionally does NOT delete the leads table or settings -
 * deactivating a plugin is often temporary (e.g. troubleshooting a conflict),
 * so destroying lead data on deactivate would be surprising and destructive.
 * Actual cleanup only happens in uninstall.php, which WordPress only runs
 * when the plugin is deleted from the Plugins screen.
 */
function leadflow_connector_deactivate() {
	// Nothing to do - kept as an explicit no-op hook for clarity/future use.
}
register_deactivation_hook( __FILE__, 'leadflow_connector_deactivate' );

/**
 * Bootstraps the plugin's moving parts. Each class registers its own hooks
 * in its constructor, so this function just needs to instantiate them.
 */
function leadflow_connector_init() {
	new LeadFlow_Connector_Shortcode();

	if ( is_admin() ) {
		new LeadFlow_Connector_Admin();
	}
}
add_action( 'plugins_loaded', 'leadflow_connector_init' );
