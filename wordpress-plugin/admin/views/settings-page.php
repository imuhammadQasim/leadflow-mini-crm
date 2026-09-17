<?php
/**
 * Admin > LeadFlow Leads > Settings. The API URL and secret live in the
 * options table (via register_setting() in class-leadflow-admin.php), NOT
 * hardcoded anywhere in the plugin - this is the only place they're set.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$api_url    = get_option( 'leadflow_connector_api_url', '' );
$api_secret = get_option( 'leadflow_connector_api_secret', '' );
?>
<div class="wrap">
	<h1>LeadFlow Connector Settings</h1>
	<p>Configure the connection to your LeadFlow Node.js API. Leads are always saved in WordPress first regardless of these settings; they control whether/how the sync step runs.</p>

	<form method="post" action="options.php">
		<?php settings_fields( 'leadflow_connector_settings_group' ); ?>

		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><label for="leadflow_connector_api_url">API Base URL</label></th>
				<td>
					<input
						type="url"
						id="leadflow_connector_api_url"
						name="leadflow_connector_api_url"
						value="<?php echo esc_attr( $api_url ); ?>"
						class="regular-text"
						placeholder="http://localhost:5000/api"
					/>
					<p class="description">
						Base URL of the LeadFlow API, <strong>without</strong> a trailing slash and without <code>/public/leads</code> -
						the plugin appends that itself. Leads are POSTed to <code><?php echo esc_html( $api_url ? rtrim( $api_url, '/' ) : '{API Base URL}' ); ?>/public/leads</code>.
					</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="leadflow_connector_api_secret">API Secret</label></th>
				<td>
					<input
						type="password"
						id="leadflow_connector_api_secret"
						name="leadflow_connector_api_secret"
						value="<?php echo esc_attr( $api_secret ); ?>"
						class="regular-text"
						autocomplete="off"
					/>
					<p class="description">
						Sent as the <code>x-api-key</code> header on every sync request. Must match <code>WORDPRESS_API_SECRET</code> in the Node API's <code>.env</code> file.
					</p>
				</td>
			</tr>
		</table>

		<?php submit_button( 'Save Settings' ); ?>
	</form>
</div>
