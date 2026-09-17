<?php
/**
 * Storage layer for leads: table creation + a handful of CRUD helpers used
 * by the shortcode handler and the admin screens.
 *
 * WHY A CUSTOM TABLE INSTEAD OF A CUSTOM POST TYPE:
 * Leads here are structured transactional records (name/email/phone/service/
 * budget/message + a sync status), not editorial "content" - they don't
 * need WP's post editor, revisions, taxonomies, or front-end templating. A
 * CPT would store every field as a separate row in wp_postmeta (one lead =
 * 1 wp_posts row + ~8 wp_postmeta rows), which makes filtering/sorting the
 * admin list by e.g. sync_status or email slower (meta queries + joins) and
 * bloats the meta table as volume grows. A dedicated table stores every
 * field as a real, indexed, typed column in one row, so the admin list
 * screen is a single plain SELECT with a WHERE/ORDER BY - simple and fast.
 * The trade-off (documented in the README) is losing WP's built-in list-
 * table/search/REST integration for free - acceptable here since the admin
 * screen this assessment asks for has to be hand-built either way.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class LeadFlow_Connector_DB {

	/**
	 * These values are intentionally identical to the enums the Node API
	 * validates against (api/src/config/leadOptions.js SERVICES /
	 * BUDGET_RANGES) - the form has to submit exactly one of these strings
	 * or the API's express-validator will reject the sync with a 400.
	 * Keep the two lists in sync manually if either side changes.
	 */
	const SERVICES = array(
		'Web Development',
		'Branding',
		'Digital Marketing',
		'SEO',
		'Consulting',
		'Other',
	);

	const BUDGET_RANGES = array(
		'under_1k'  => 'Under $1,000',
		'1k_5k'     => '$1,000 - $5,000',
		'5k_10k'    => '$5,000 - $10,000',
		'10k_25k'   => '$10,000 - $25,000',
		'25k_plus'  => '$25,000+',
	);

	/**
	 * Returns the prefixed table name (e.g. wp_leadflow_leads). Never
	 * hardcode the "wp_" prefix directly - a site's table prefix can be
	 * anything, $wpdb knows the real one.
	 */
	public static function table_name() {
		global $wpdb;
		return $wpdb->prefix . 'leadflow_leads';
	}

	/**
	 * Creates (or updates) the leads table. Called on activation, and safe
	 * to call again later if the schema changes - dbDelta() diffs the SQL
	 * against what already exists instead of blindly dropping/recreating.
	 */
	public static function create_table() {
		global $wpdb;

		$table_name      = self::table_name();
		$charset_collate = $wpdb->get_charset_collate();

		// dbDelta() is picky about formatting: two spaces after PRIMARY KEY,
		// each field on its own line, no trailing commas on the last field.
		$sql = "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			name VARCHAR(120) NOT NULL,
			email VARCHAR(190) NOT NULL,
			phone VARCHAR(30) NOT NULL,
			service VARCHAR(60) NOT NULL,
			budget_range VARCHAR(30) NOT NULL,
			message TEXT NOT NULL,
			source VARCHAR(30) NOT NULL DEFAULT 'website',
			sync_status VARCHAR(20) NOT NULL DEFAULT 'pending',
			sync_message TEXT NULL,
			api_lead_id VARCHAR(60) NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY email (email),
			KEY sync_status (sync_status),
			KEY created_at (created_at)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Inserts a new lead row. Expects already-sanitized data (sanitization
	 * happens in the shortcode handler, right where the raw $_POST is read -
	 * this method just persists whatever it's given).
	 *
	 * @return int|false Newly inserted row ID, or false on DB error.
	 */
	public static function insert_lead( $data ) {
		global $wpdb;

		$now = current_time( 'mysql' );

		$inserted = $wpdb->insert(
			self::table_name(),
			array(
				'name'         => $data['name'],
				'email'        => $data['email'],
				'phone'        => $data['phone'],
				'service'      => $data['service'],
				'budget_range' => $data['budget_range'],
				'message'      => $data['message'],
				'source'       => $data['source'],
				'sync_status'  => 'pending',
				'created_at'   => $now,
				'updated_at'   => $now,
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		if ( false === $inserted ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Updates a lead's sync outcome after an API sync attempt (initial
	 * submit or an admin-triggered retry).
	 */
	public static function update_sync_result( $lead_id, $status, $message, $api_lead_id = null ) {
		global $wpdb;

		$wpdb->update(
			self::table_name(),
			array(
				'sync_status'  => $status,
				'sync_message' => $message,
				'api_lead_id'  => $api_lead_id,
				'updated_at'   => current_time( 'mysql' ),
			),
			array( 'id' => $lead_id ),
			array( '%s', '%s', '%s', '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Fetches a single lead row by ID.
	 */
	public static function get_lead( $lead_id ) {
		global $wpdb;
		$table = self::table_name();
		return $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $lead_id )
		);
	}

	/**
	 * Fetches leads for the admin list screen, newest first.
	 */
	public static function get_leads( $limit = 100 ) {
		global $wpdb;
		$table = self::table_name();
		return $wpdb->get_results(
			$wpdb->prepare( "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d", $limit )
		);
	}
}
