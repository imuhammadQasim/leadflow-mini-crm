<?php
/**
 * Runs only when the plugin is deleted from the Plugins screen (not on
 * plain deactivation - see leadflow-connector.php for why). Removes the
 * leads table and settings so uninstalling doesn't leave orphaned data.
 *
 * WP_UNINSTALL_PLUGIN is only defined when WordPress itself loads this
 * file as part of a real uninstall - this guard stops the file doing
 * anything if it's ever requested directly.
 */
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

$table_name = $wpdb->prefix . 'leadflow_leads';
$wpdb->query( "DROP TABLE IF EXISTS {$table_name}" ); // phpcs:ignore -- table name is not user input.

delete_option( 'leadflow_connector_api_url' );
delete_option( 'leadflow_connector_api_secret' );
delete_option( 'leadflow_connector_db_version' );
