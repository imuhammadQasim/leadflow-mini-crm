# LeadFlow API (Part B)

Node.js + Express + MongoDB REST API for the LeadFlow Mini CRM. Receives leads from the
WordPress plugin, serves the React dashboard and Angular insights view, and owns all lead
business logic (validation, duplicate prevention, Lead Score).

## Setup

```bash
cd api
npm install
cp .env.example .env   # then fill in real values
npm run dev             # nodemon, or `npm start` for a plain node run
```

Requires a running MongoDB instance reachable at `MONGODB_URI`. On first start, if no
`AdminUser` exists yet, one is created automatically from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`.env` — log in with those credentials against `POST /api/auth/login`.

## Architecture

```
src/
  config/       env-driven DB connection + shared option lists (statuses, services, budgets, sources)
  models/       Mongoose schemas (Lead, AdminUser)
  middleware/   JWT auth, WordPress shared-secret auth, validation runner, error handler
  validators/   express-validator rule chains per route
  controllers/  request handlers / business logic
  routes/       Express routers, mounted in app.js
  utils/        ApiError, asyncHandler, Lead Score calculator, admin seeding
```

Two different auth mechanisms protect two different audiences:
- **JWT (`Authorization: Bearer <token>`)** protects the private CRM endpoints
  (`/api/leads/*`, `/api/stats`) used by the React/Angular dashboards.
- **Shared secret (`x-api-key` header)** protects `POST /api/public/leads`, the endpoint the
  WordPress plugin calls. WordPress has no admin session to present a JWT, so it instead
  sends a static secret configured in both the WP admin settings screen and this API's `.env`.

## Endpoints

| Method | Path                | Auth        | Purpose                                   |
|--------|---------------------|-------------|--------------------------------------------|
| POST   | /api/auth/login      | none        | Admin login, returns JWT                  |
| POST   | /api/public/leads    | x-api-key   | WordPress plugin submits a new lead       |
| GET    | /api/leads           | JWT         | List/search/filter leads (`status`, `q`, `page`, `limit`) |
| POST   | /api/leads           | JWT         | Create a lead manually (dashboard)        |
| GET    | /api/leads/:id        | JWT         | Get one lead                              |
| PATCH  | /api/leads/:id        | JWT         | Update a lead (status change, edits)      |
| DELETE | /api/leads/:id        | JWT         | Delete a lead                             |
| GET    | /api/stats            | JWT         | Total leads, counts by status, top 5 by Lead Score |
| GET    | /health               | none        | Liveness check                            |

## Duplicate-prevention rule

A new lead is rejected with `409 Conflict` if a lead with the **same email address OR the
same phone number** (digits-only comparison, so formatting differences don't matter) was
created in the **last 24 hours**. See `Lead.findRecentDuplicate` in `src/models/Lead.js`.

Reasoning: the realistic source of "obvious" duplicates here is a visitor double-clicking
submit, or the WordPress plugin retrying a sync after a slow/failed API response — not a
returning customer. A 24-hour window catches those retries while still letting a genuine
returning visitor submit a new enquiry later without being permanently blocked. Either email
or phone matching is treated as sufficient, since both independently identify "the same
person," and requiring both would miss cases like a typo in one field between two rapid
submissions.

## Lead Score rules (0-100, custom)

The score is **calculated by backend logic for WordPress-submitted leads** (the primary,
required flow per the Logic Challenge) via `src/utils/leadScore.js`, and stored on the lead
document. For leads an **admin creates manually from the dashboard**, the admin enters the
score directly instead — `calculateLeadScore()` is intentionally not called on that path
(see `createLead` in `src/controllers/leadController.js`), since a staff member adding a lead
by hand typically already knows how they'd prioritize it. `PATCH /api/leads/:id` also accepts
`leadScore` so an admin can adjust it later on any lead.

Scoring reasoning (used for the WordPress intake path) is in `leadScore.js`'s comments; summary:

- **Budget range** — up to 40 points (biggest single factor: caps potential deal size)
- **Service requested** — up to 15 points (higher-ticket services score higher)
- **Message quality** — up to 15 points (message length as a proxy for a thought-out brief)
- **Phone provided** — up to 10 points (a callable lead is more actionable immediately)
- **Source** — up to 15 points (referral/organic assumed to convert better than paid/social)
- **Business email bonus** — up to 5 points (non-freemail domain suggests a company inquiry)

Weights sum to 100. This is a deliberately simple, explainable heuristic — not a statistical
model — designed to be replaced with data-driven weights once real conversion outcomes exist.

## Known limitations / what I'd improve with more time

- No refresh-token flow — the JWT simply expires after `JWT_EXPIRES_IN` and the admin has to
  log in again.
- No rate limiting on `/api/public/leads` or `/api/auth/login` (would add `express-rate-limit`).
- Duplicate check is a simple recent-window lookup rather than fuzzy matching (e.g. catching
  typo'd emails); fine for "obvious" duplicates as scoped, not for near-duplicates.
- No automated test suite included given the time box; the validation/controller split was
  chosen partly to keep the code easy to unit test later.
- Pagination on `GET /api/leads` is basic offset-based (`page`/`limit`); fine at this scale,
  would move to cursor-based pagination if lead volume grew large.
