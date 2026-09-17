<?php
/**
 * Admin > LeadFlow Leads. Expects $leads (array of row objects from
 * LeadFlow_Connector_DB::get_leads()) to be set by the calling method.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap">
	<h1 class="wp-heading-inline">LeadFlow Leads</h1>
	<a href="<?php echo esc_url( admin_url( 'admin.php?page=leadflow-connector-settings' ) ); ?>" class="page-title-action">Settings</a>
	<hr class="wp-header-end" />

	<?php if ( isset( $_GET['leadflow_retried'] ) ) : ?>
		<div class="notice notice-info is-dismissible">
			<p>Sync retried for lead #<?php echo (int) $_GET['leadflow_retried']; ?> - see its status below.</p>
		</div>
	<?php endif; ?>

	<?php if ( empty( $leads ) ) : ?>
		<p>No leads yet. Leads submitted through the <code>[leadflow_form]</code> shortcode will show up here.</p>
	<?php else : ?>
		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th>Name</th>
					<th>Contact</th>
					<th>Service</th>
					<th>Budget</th>
					<th>Message</th>
					<th>Sync Status</th>
					<th>Received</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $leads as $lead ) : ?>
					<tr>
						<td><?php echo esc_html( $lead->name ); ?></td>
						<td>
							<?php echo esc_html( $lead->email ); ?><br />
							<?php echo esc_html( $lead->phone ); ?>
						</td>
						<td><?php echo esc_html( $lead->service ); ?></td>
						<td><?php echo esc_html( LeadFlow_Connector_DB::BUDGET_RANGES[ $lead->budget_range ] ?? $lead->budget_range ); ?></td>
						<td><?php echo esc_html( wp_trim_words( $lead->message, 12 ) ); ?></td>
						<td>
							<?php if ( 'synced' === $lead->sync_status ) : ?>
								<span style="color:#1e6b34;font-weight:600;">&#10003; Synced</span>
							<?php elseif ( 'failed' === $lead->sync_status ) : ?>
								<span style="color:#d63638;font-weight:600;">&#10007; Failed</span>
							<?php else : ?>
								<span style="color:#996800;font-weight:600;">&#8987; Pending</span>
							<?php endif; ?>
							<?php if ( ! empty( $lead->sync_message ) ) : ?>
								<br /><small><?php echo esc_html( $lead->sync_message ); ?></small>
							<?php endif; ?>
						</td>
						<td><?php echo esc_html( mysql2date( 'M j, Y g:i a', $lead->created_at ) ); ?></td>
						<td>
							<?php if ( 'synced' !== $lead->sync_status ) : ?>
								<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
									<input type="hidden" name="action" value="leadflow_retry_sync" />
									<input type="hidden" name="lead_id" value="<?php echo esc_attr( $lead->id ); ?>" />
									<?php wp_nonce_field( 'leadflow_retry_sync_' . $lead->id ); ?>
									<button type="submit" class="button button-small">Retry sync</button>
								</form>
							<?php else : ?>
								&mdash;
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	<?php endif; ?>
</div>
