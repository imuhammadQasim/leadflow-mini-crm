# LeadFlow React Dashboard (Part C)

React + Vite CRM dashboard for the LeadFlow Mini CRM. Logs in against the Node API's JWT
endpoint and manages leads: view/search/filter, view details, change status, create leads
manually, and see the Lead Score.

## Setup

```bash
cd react-dashboard
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your running API (Part B)
npm run dev
```

Requires the [api](../api) service (Part B) running and reachable at `VITE_API_BASE_URL`
(default `http://localhost:5000/api`), including its seeded admin user to log in with.

## Architecture

```
src/
  api/          thin fetch wrappers per resource (client.js has the shared request/auth/error logic)
  context/      React Context objects + Provider components (Auth, Toast)
  hooks/        useAuth/useToast (context consumers) + useLeads/useStats (data fetching) + useDebouncedValue
  components/
    layout/     AppLayout (header/logout), ProtectedRoute (redirects to /login if not authenticated)
    common/     Modal, ConfirmDialog, LoadingSpinner, EmptyState, ErrorBanner - generic, reused everywhere
    leads/      Everything lead-specific: table, Kanban board, filters, stat cards, badges, forms
  pages/        LoginPage, DashboardPage (composes everything above)
  constants/    Lead option lists mirrored from the API (statuses, services, budget ranges, sources)
  utils/        Display formatters (dates, budget labels, score tier)
```

**State management**: `AuthContext` (token/admin, backed by localStorage) and `ToastContext`
(global success/error notifications) are the only global state - both are cross-cutting
concerns used from many unrelated components, which is what Context is for. Leads and stats
data is **not** in a global store: `useLeads`/`useStats` are plain hooks that own their own
fetch/loading/error state locally inside `DashboardPage`, since nothing else in the app needs
that data. This avoids a global store that only one page would ever read from.

**Auth flow**: `POST /api/auth/login` returns a JWT, stored in `localStorage`. Every
subsequent request attaches `Authorization: Bearer <token>` (see `api/client.js`). If any
request comes back `401` (expired/invalid token), the client clears the token and fires a
`leadflow:unauthorized` window event; `AuthProvider` listens for it and logs the user out,
which `ProtectedRoute` turns into a redirect to `/login`.

**Lead Score display**: shown as a colored badge (`LeadScoreBadge`) with a Hot/Warm/Cold tier
on top of the raw 0-100 number, purely a UI grouping (`utils/formatters.js`
`getScoreTier`) - it doesn't affect the stored score. On the manual "Add lead" form, the score
is an admin-entered field rather than auto-calculated; see the comment at the top of
`LeadFormModal.jsx` for why (matches the API's `createLead` controller, which only
auto-calculates the score for WordPress-submitted leads).

## Creativity feature: Kanban view

A **Table ⇄ Kanban toggle** above the leads list. Kanban groups the currently-loaded leads
into one column per status (client-side `Array.filter`, no extra API call) and lets you move
a lead to a different status from a `<select>` on its card - not native HTML5 drag-and-drop,
deliberately, since drag-and-drop has no built-in touch support and the dashboard has to stay
usable on tablet. Moving a card calls the exact same `PATCH /api/leads/:id` the status
dropdown in the detail view uses, so there's no separate "move card" code path to maintain.
See the comment at the top of `KanbanBoard.jsx`.

## Loading / empty / error states

Every API-backed section (stat cards, leads table, Kanban board) independently renders one of:
a spinner (`LoadingSpinner`), an error banner with a Retry button (`ErrorBanner`), an empty
state with contextual copy (`EmptyState` - different message when filters are active vs. no
leads exist at all), or the real content. Form submissions (login, create lead, status/score
changes, delete) show inline field errors from the API's `400` validation response, a `409`
duplicate-lead message, and a disabled/"Saving..." button state while in flight; a success or
error toast confirms the result of most non-navigational actions.

## Known limitations / what I'd improve with more time

- No `/auth/me` endpoint on the API, so after a hard page refresh the admin's email isn't
  known until the next login (the JWT itself is still trusted from localStorage, so the user
  stays logged in - only the displayed email is briefly blank).
- Kanban view only shows the leads on the current page/filter (same data as the table), not
  the entire database - fine at this scale, would need a "load all for board view" mode for a
  much larger lead volume.
- No automated tests, given the time box.
- Pagination is basic Previous/Next, matching the API's offset-based pagination.
