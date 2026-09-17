# LeadFlow Lead Insights (Part D — Angular Adaptability Task)

A single standalone Angular page, `LeadInsightsComponent`, that consumes the LeadFlow Node API
(Part B) and shows: total leads, counts by status, and the top 5 leads by Lead Score.

This is intentionally the smallest part of the project (per the assessment: ~45-60 minutes,
5/100 points, "do not over-engineer") — one component, no routing, no state management
library, no services layer beyond Angular's own `HttpClient`.

## Setup

```bash
cd angular-insights
npm install
npm start          # ng serve, http://localhost:4200
```

Requires the [api](../api) service (Part B) running (default assumed at
`http://localhost:5000/api` — see the constant `API_BASE_URL` at the top of
`src/app/lead-insights/lead-insights.component.ts`; edit it if your API runs elsewhere). No
`.env.example` is included for this part — there's no secret to configure, see "Simplified
auth" below for why the API URL is just a plain constant instead.

Log in on the page with the same admin credentials seeded by the API (`ADMIN_EMAIL`/
`ADMIN_PASSWORD` in `api/.env`).

## How it works

`LeadInsightsComponent` (`src/app/lead-insights/`) is the only real piece of this app —
`AppComponent` just renders `<app-lead-insights>`. It:

1. Shows a login form that calls `POST /api/auth/login` (the exact same endpoint the React
   dashboard uses) and keeps the returned JWT in a component field.
2. Once logged in, calls `GET /api/stats` with that token and renders the response - which
   already returns everything this page needs in one call: `total`, `byStatus` (counts per
   status), and `topLeadsByScore` (the API sorts and limits this to 5 server-side, so there's
   no client-side sorting/filtering to write here).
3. Shows loading/error states around that call, with a Retry button, and a Refresh button once
   loaded.

## Simplified authentication — what and why

This page reuses the **real** JWT login (same endpoint, same credentials, same bcrypt/JWT
logic on the API side as Part B/C) — nothing about the API's actual security is faked or
bypassed. What's simplified is only how the **Angular side** handles the token, compared to a
full app:

- No route guard (there's only one route/page here — nothing to guard).
- No HTTP interceptor attaching the token automatically — the one API call that needs it
  attaches the `Authorization` header manually.
- No token persistence — the JWT lives only in the component's own field, in memory. A page
  refresh logs you out again; there's no `localStorage`/refresh-token handling.

This is acceptable for this specific page because it's a single, read-only, internal insights
view built to demonstrate Angular adaptability within a ~45-60 minute budget — not a
production surface. A larger Angular app would factor this into a shared `AuthService` + HTTP
interceptor (exactly the shape the React dashboard's `AuthContext`/`api/client.js` already
take in Part C) rather than repeat it per-page.

## Known limitations / what I'd improve with more time

- API base URL is a hardcoded constant rather than an `environment.ts` file - fine for one
  file, would move to proper Angular environments if this grew past a single page.
- No unit tests (project was scaffolded with `--minimal`, skipping the default test setup) -
  consistent with the assessment's guidance not to over-invest in this section.
