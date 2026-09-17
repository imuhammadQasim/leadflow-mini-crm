# LeadFlow Connector (Part A)

WordPress plugin: a `[leadflow_form]` lead capture shortcode, local storage of submissions,
and a sync to the LeadFlow Node.js API (Part B), with a wp-admin screen to review sync status
and retry failures.

> New to PHP/WordPress? See **[LEARNING-GUIDE.md](LEARNING-GUIDE.md)** for a plain-English
> walkthrough of what each file does and how to install/test this on a real WordPress site.

## Setup

1. Copy (or symlink) the `wordpress-plugin/` folder into `wp-content/plugins/leadflow-connector/`
   on a local WordPress install.
2. Activate **LeadFlow Connector** from Plugins in wp-admin (this creates the `wp_leadflow_leads` table).
3. Go to **LeadFlow Leads > Settings** and set:
   - **API Base URL** - the Node API's base, e.g. `http://localhost:5000/api` (no trailing slash, no `/public/leads` - the plugin appends that itself).
   - **API Secret** - must match `WORDPRESS_API_SECRET` in the API's `.env` (see [api/.env.example](../api/.env.example)).
4. Add the shortcode `[leadflow_form]` to any page or post.
5. Submitted leads (and their sync status) appear under **LeadFlow Leads** in wp-admin.

No secrets or URLs are hardcoded anywhere in the plugin - both live in the WordPress options
table via the Settings page above.

## Folder structure

```
wordpress-plugin/
├── leadflow-connector.php        # Plugin header, activation/deactivation hooks, bootstraps the classes below
├── uninstall.php                 # Drops the leads table + settings, but only on Delete (not Deactivate)
├── includes/
│   ├── class-leadflow-db.php     # Table creation (dbDelta) + CRUD helpers + the Service/Budget option lists
│   ├── class-leadflow-api-sync.php  # wp_remote_post() call to the Node API, writes sync result back to the row
│   └── class-leadflow-shortcode.php # [leadflow_form] rendering + AJAX submit handler (nonce, sanitize, validate)
├── admin/
│   ├── class-leadflow-admin.php  # wp-admin menu, Settings API registration, retry-sync handler
│   └── views/
│       ├── leads-list.php        # Leads table with sync status + per-row "Retry sync"
│       └── settings-page.php     # API Base URL / API Secret form
└── public/
    ├── css/leadflow-form.css     # Responsive form styling
    └── js/leadflow-form.js       # Client-side validation + AJAX submit (progressive enhancement)
```

## Why a custom database table instead of a custom post type

Leads are structured, transactional records (name/email/phone/service/budget/message plus a
sync status) - not editorial "content." They don't need WordPress's post editor, revisions,
taxonomies, or front-end templating. Storing them as a custom post type would put every field
in `wp_postmeta` as separate rows (one lead = 1 `wp_posts` row + ~7 `wp_postmeta` rows), which
makes the admin list's filtering/sorting (e.g. by `sync_status`) slower - meta queries need
joins, where a dedicated table is a single plain `SELECT ... WHERE ... ORDER BY`.

A custom table (`wp_leadflow_leads`, created via `dbDelta()` on activation - see
`LeadFlow_Connector_DB::create_table()`) stores every field as a real, indexed, typed column
in one row. The trade-off, and a real one: a custom table gets none of WordPress's built-in
list-table/search/REST scaffolding for free, so the admin screen had to be hand-built - but
that screen is a requirement either way, so it wasn't extra work in this case.

## How the form submission flow works

1. `[leadflow_form]` renders a plain HTML form (no jQuery) and enqueues `leadflow-form.js`,
   which intercepts the submit, does basic client-side checks (required fields, email shape,
   phone digit count), and `fetch()`s the result to `admin-ajax.php` as
   `action=leadflow_submit_lead` plus a nonce.
2. `LeadFlow_Connector_Shortcode::handle_submit()` (hooked on both `wp_ajax_leadflow_submit_lead`
   and `wp_ajax_nopriv_leadflow_submit_lead`, since site visitors are normally logged out)
   verifies the nonce with `check_ajax_referer()`, sanitizes every field
   (`sanitize_text_field`/`sanitize_email`/`sanitize_textarea_field`), then re-validates
   everything server-side - client-side validation is a UX nicety only, never trusted on its
   own, since a request can be sent to `admin-ajax.php` directly.
3. The lead is saved to `wp_leadflow_leads` **first**, before any API call - a submission is
   never lost just because the Node API happens to be down.
4. `LeadFlow_Connector_API_Sync::sync_lead()` then `wp_remote_post()`s the lead to
   `{API Base URL}/public/leads` with the `x-api-key` header, and writes the outcome
   (`synced`/`failed` + a message) back onto the row. The visitor's own response only depends
   on step 3 succeeding - a sync failure doesn't block or alarm them, it just leaves the row
   for an admin to retry.
5. On the **LeadFlow Leads** admin screen, any non-`synced` row has a "Retry sync" button
   (`admin-post.php?action=leadflow_retry_sync`, capability-gated to `manage_options`, with a
   per-lead nonce) that re-runs step 4 against the same stored row.

## Security notes

- **Nonces**: the form's AJAX submit uses a nonce scoped to the `leadflow_submit_lead` action
  (`check_ajax_referer`); each "Retry sync" link uses a nonce scoped to that specific lead ID
  (`leadflow_retry_sync_{id}`) so one retry link can't be replayed against a different lead.
- **Sanitization/escaping**: every `$_POST` value is sanitized before it's used or stored;
  every value echoed into the admin screens is escaped (`esc_html`/`esc_attr`/`esc_url`) at
  output time, not just sanitized at input time.
- **Capability checks**: both admin pages and the retry-sync handler require `manage_options`.
- **No hardcoded secrets**: the API URL and secret are only ever read via `get_option()`, set
  through the Settings page (registered via the WordPress Settings API, which itself handles
  its own nonce/capability checks).
- **Service/Budget Range whitelisting**: submitted `service`/`budget_range` values are checked
  against a fixed list (`LeadFlow_Connector_DB::SERVICES`/`BUDGET_RANGES`) rather than accepted
  as arbitrary text - these lists are kept identical to the enums the Node API validates
  against, so a synced lead can't fail API validation just from a mismatched option value.

## Known limitations / what I'd improve with more time

- No spam protection beyond the nonce (no honeypot/reCAPTCHA) - fine for this assessment's
  scope, would add one before using this on a public site.
- The leads list shows the latest 200 rows with no pagination/search yet - the primary lead
  management UI is the React dashboard (Part B/C); this screen is meant for reviewing
  submission/sync health, not day-to-day lead work.
- No bulk "retry all failed" action - retries are one row at a time.
- `wp_remote_post()` uses a 15s timeout; a slow/unreachable API delays the visitor's form
  response by up to that long. A production version would queue the sync (e.g. WP-Cron) so the
  visitor never waits on it at all.
