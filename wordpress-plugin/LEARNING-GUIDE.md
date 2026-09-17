# LeadFlow Connector — Plain-English Guide

For someone with no PHP/WordPress background. Explains what each file does and how to
actually run this to see it working.

## Do you need to install this on a WordPress site to test it?

**Yes.** This is not like the Node/React code, which you can run standalone with `npm run dev`.
A WordPress plugin is just PHP files that do nothing on their own — they only run *inside* a
live WordPress installation (WordPress itself is what loads and executes them). There's no way
to preview it in a browser without a real WordPress site behind it.

Fastest way to get one for testing, no server-buying required:

1. Install **[LocalWP](https://localwp.com/)** (free, one-click local WordPress installer — most
   common tool for this) or use XAMPP/MAMP + a manual WordPress download.
2. Create a new local site (LocalWP does this in a couple of clicks).
3. Copy the whole `wordpress-plugin` folder into that site's
   `wp-content/plugins/` folder, and rename it `leadflow-connector`.
4. In wp-admin → **Plugins**, find "LeadFlow Connector" and click **Activate**.
5. Follow the "How to test it end-to-end" section below.

## WordPress vocabulary used in this code

| Term | What it means here |
|---|---|
| **Hook** | A named moment WordPress lets you "plug into" (e.g. "when the plugin is activated," "when this page's menu is being built"). `add_action('some_hook', 'your_function')` means "run my function when that moment happens." |
| **Shortcode** | A bracket tag like `[leadflow_form]` that a WordPress editor can type into a page; WordPress replaces it with whatever HTML your function returns. |
| **wp-admin** | The `/wp-admin` dashboard area where site admins log in and manage things — where our "Leads" and "Settings" screens live. |
| **Nonce** | A one-time random token WordPress generates and checks, to prove a form submission actually came from your own site's page (not a forged request from elsewhere). Think of it as an anti-forgery ticket. |
| **Sanitize** | Cleaning user-typed input before saving it (e.g. stripping stray HTML tags) so bad input can't corrupt data or run malicious code. |
| **Escape** | Cleaning data right before *displaying* it back in HTML, so nothing a user typed can break the page or inject a script. |
| **`$wpdb`** | WordPress's built-in helper object for running database queries safely. |

## What each file does

```
wordpress-plugin/
├── leadflow-connector.php        ← START HERE. The plugin's entry point.
├── uninstall.php
├── includes/
│   ├── class-leadflow-db.php
│   ├── class-leadflow-api-sync.php
│   └── class-leadflow-shortcode.php
├── admin/
│   ├── class-leadflow-admin.php
│   └── views/
│       ├── leads-list.php
│       └── settings-page.php
└── public/
    ├── css/leadflow-form.css
    └── js/leadflow-form.js
```

**`leadflow-connector.php`** — The main file WordPress actually loads first (the comment block
at the top with "Plugin Name: LeadFlow Connector" is what makes WordPress recognize this
folder as a plugin at all). It pulls in all the other PHP files, and sets up two things:
what happens when you **activate** the plugin (creates the database table) and what happens
when it **starts running on every page load** (turns on the form + admin screens).

**`includes/class-leadflow-db.php`** — Everything about *storing* leads. Creates the
database table (`wp_leadflow_leads`) the first time the plugin is activated, and has simple
functions to save a new lead, update one, and fetch leads back out. Also holds the exact list
of allowed "Service" and "Budget Range" options (these must match the Node API's list, or
syncing will fail).

**`includes/class-leadflow-api-sync.php`** — Sends one lead to your Node.js API over the
internet (`wp_remote_post` = WordPress's version of a `fetch()`/HTTP request). Reads the API
URL and secret from Settings, sends the lead as JSON, and records whether it worked.

**`includes/class-leadflow-shortcode.php`** — Builds the actual `[leadflow_form]` form you'd
paste into a page, and handles what happens when someone submits it: checks the security
token (nonce), cleans and validates every field, saves it to the database, then calls the
sync file above.

**`admin/class-leadflow-admin.php`** — Adds the "LeadFlow Leads" menu item you'll see in the
left sidebar of wp-admin, with its two pages (Leads, Settings), and handles the "Retry sync"
button click.

**`admin/views/leads-list.php`** — Just the HTML template for the Leads page (a table of
submitted leads + their sync status). Not logic — this only draws what
`class-leadflow-admin.php` hands it.

**`admin/views/settings-page.php`** — HTML template for the Settings page: two text boxes
(API URL, API Secret) that save into WordPress's own settings storage.

**`public/css/leadflow-form.css`** / **`public/js/leadflow-form.js`** — Normal CSS and
JavaScript, no WordPress-specific magic. The JS adds instant validation and submits the form
without reloading the page (in the background, over `fetch()`).

**`uninstall.php`** — Only runs if you click "Delete" on the plugin (not just deactivate) —
cleans up the database table and settings so nothing is left behind.

## How to test it end-to-end

1. Activate the plugin (see install steps above).
2. In wp-admin, go to **LeadFlow Leads → Settings**. Enter:
   - **API Base URL**: wherever your Node API is running, e.g. `http://localhost:5000/api`
   - **API Secret**: same value as `WORDPRESS_API_SECRET` in the API's `.env` file
   - Click **Save Settings**.
3. Make sure the Node API (`api/`) is actually running (`npm run dev` in that folder) and
   connected to MongoDB — otherwise the sync step will fail (the lead still saves in
   WordPress either way, it just won't reach the CRM).
4. Create a new Page in WordPress, type `[leadflow_form]` in it, and publish/view it.
5. Fill out and submit the form on the live page.
6. Go back to wp-admin → **LeadFlow Leads**. You should see your submission, with a green
   "Synced" status if the API call worked, or red "Failed" (with a reason) if not — with a
   **Retry sync** button to try again after fixing the settings/API.
7. Check the React dashboard (or MongoDB directly) — the lead should now appear there too.
