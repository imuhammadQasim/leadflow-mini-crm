# LeadFlow Mini CRM

A full-stack lead-management system for a fictional digital agency. A visitor submits a lead
through a WordPress form → the lead is sent to a Node.js/Express API → stored in MongoDB →
managed from a React CRM dashboard, with a small Angular "Lead Insights" view as an
adaptability exercise.

## Tech Stack

- **WordPress / PHP** — lead capture form + admin sync-status screen
- **Node.js / Express / MongoDB (Mongoose)** — REST API, JWT auth, Lead Score, duplicate prevention
- **React (Vite) / Tailwind** — primary CRM dashboard
- **Angular (standalone)** — small "Lead Insights" view
- **JWT** — authentication across the API, React, and Angular

## Project Structure

```text
leadflow-mini-crm/
│
├── wordpress-plugin/      # WordPress "LeadFlow Connector" plugin (Part A)
├── api/                   # Node.js + Express + MongoDB API (Part B)
├── react-dashboard/       # React CRM Dashboard (Part C)
├── angular-insights/      # Angular Lead Insights view (Part D)
├── README.md              # this file
├── AI-USAGE.md
└── .gitignore
```

Each folder has its own `README.md` with full setup/architecture detail for that part — this
file is the top-level overview the assessment asks for.

## Quick Setup

Start these in order (each needs the previous one running to be useful end-to-end):

1. **API** (`api/`) — needs a MongoDB instance.
   ```bash
   cd api && npm install && cp .env.example .env   # fill in .env
   npm run dev   # http://localhost:5000
   ```
   An admin user is auto-seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` on first boot.

2. **React dashboard** (`react-dashboard/`)
   ```bash
   cd react-dashboard && npm install && cp .env.example .env
   npm run dev   # http://localhost:5173
   ```

3. **Angular Lead Insights** (`angular-insights/`)
   ```bash
   cd angular-insights && npm install
   npm start   # http://localhost:4200
   ```

4. **WordPress plugin** (`wordpress-plugin/`) — requires an actual WordPress install (this
   isn't a standalone Node/npm app). See
   [wordpress-plugin/LEARNING-GUIDE.md](wordpress-plugin/LEARNING-GUIDE.md) for a full,
   no-PHP-experience-needed walkthrough, or the short version:
   - Copy the folder into `wp-content/plugins/leadflow-connector/`, activate it.
   - Set **API Base URL** + **API Secret** under *LeadFlow Leads → Settings* (must match the
     API's `.env`).
   - Add `[leadflow_form]` to any page.

## Architecture Overview

```
WordPress [leadflow_form] ──POST (x-api-key)──▶  Node/Express API  ──Mongoose──▶  MongoDB
                                                        ▲   ▲
                                    JWT auth ───────────┘   └─────────── JWT auth
                                        │                                    │
                                React CRM Dashboard              Angular Lead Insights
```

- WordPress saves every lead **locally first** (a custom `wp_leadflow_leads` table — see
  [wordpress-plugin/README.md](wordpress-plugin/README.md) for why a table was chosen over a
  custom post type), then syncs it to the API. A sync failure never loses the lead — it's
  retryable from the WordPress admin screen.
- The API is the single source of truth: it owns the Lead model, auth, validation, Lead Score,
  and duplicate prevention. Both frontends only ever talk to it, never to MongoDB directly.
- React (Part C) is the primary/full CRM UI. Angular (Part D) is a small, intentionally minimal
  second consumer of the same API, to demonstrate adaptability — see its README for how its
  auth was deliberately simplified.

## Important Technical Decisions

- **Custom DB table over a custom post type** for WordPress-side lead storage — leads are
  structured/transactional, not editorial content. Full reasoning:
  [wordpress-plugin/README.md](wordpress-plugin/README.md).
- **Two different auth mechanisms on the API**: JWT for the dashboards (`Authorization: Bearer`),
  and a shared `x-api-key` secret for the WordPress → API sync (WordPress has no admin
  session to present a JWT). Details: [api/README.md](api/README.md).
- **Lead Score is backend-calculated for WordPress-submitted leads** (satisfying the Logic
  Challenge's "calculated by backend logic" requirement on the real intake path), but
  **admin-entered** for leads created manually from the React dashboard — an admin adding a
  lead by hand already knows how they'd prioritize it. See `api/src/controllers/leadController.js`
  and `react-dashboard/src/components/leads/LeadFormModal.jsx`.
- **Creativity feature**: a Table ⇄ Kanban toggle in the React dashboard, moving leads between
  statuses via the same `PATCH` endpoint the detail view uses (not drag-and-drop, so it stays
  usable on mobile/tablet). Details: [react-dashboard/README.md](react-dashboard/README.md).

## Lead Score Rules (0–100, custom, backend-calculated)

Applied to WordPress-submitted leads in `api/src/utils/leadScore.js`. Six weighted signals,
summing to 100:

| Signal | Max points | Why |
|---|---|---|
| Budget range | 40 | Biggest factor — caps potential deal size |
| Service requested | 15 | Some services are higher-ticket for the agency |
| Message quality (length) | 15 | Proxy for a thought-out brief |
| Phone provided | 10 | A callable lead is actionable immediately |
| Source | 15 | Referral/organic assumed to convert better than paid/social |
| Business email domain | 5 | Non-freemail suggests a company inquiry |

Full per-signal reasoning is documented inline in that file. This is a deliberately simple,
explainable heuristic — not copied from any known formula — meant to be replaced with
data-driven weights once real conversion outcomes exist.

## Duplicate-Prevention Rule

A new lead is rejected with `409 Conflict` if a lead with the **same email OR the same phone
number** (compared digit-only, so formatting doesn't matter) was created in the **last 24
hours** (`Lead.findRecentDuplicate` in `api/src/models/Lead.js`). This targets the realistic
"obvious duplicate" case — a double-submitted form, or WordPress retrying a sync after a slow
API response — without permanently blocking a genuine returning visitor.

## Known Limitations / What I'd Improve With More Time

- No automated test suite anywhere in the stack, given the time-boxed scope.
- WordPress plugin has no spam protection beyond its nonce (no honeypot/reCAPTCHA).
- React dashboard has no `/auth/me` endpoint, so the admin's email is briefly blank after a
  hard refresh (the JWT itself is still valid and the session stays logged in).
- Angular's auth is intentionally minimal (in-memory token only, no interceptor/guard) — fine
  for its single-page scope, documented in `angular-insights/README.md`.
- No rate limiting on the public API intake or login endpoints.
- Pagination throughout is basic offset-based (`page`/`limit`), fine at this data scale.

Each part's own README has a more detailed, part-specific limitations list.
