import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

/**
 * Points at the same LeadFlow API built in Part B. A real multi-page app
 * would pull this from src/environments/environment.ts; this page is
 * intentionally a single small file (Part D of the assessment is scoped to
 * ~45-60 minutes and explicitly asks not to over-engineer it), so it's just
 * a constant here.
 */
const API_BASE_URL = 'http://localhost:5000/api';

const STATUS_ORDER = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'] as const;

interface LoginResponse {
  success: boolean;
  data: { token: string; admin: { id: string; email: string } };
}

interface LeadSummary {
  _id: string;
  name: string;
  email: string;
  leadScore: number;
  status: string;
}

interface StatsData {
  total: number;
  // Explicitly | undefined so the template's `?? 0` fallback isn't flagged
  // as dead code by the compiler - at runtime the API always returns all 5
  // status keys, but the type shouldn't just assume that.
  byStatus: Record<string, number | undefined>;
  topLeadsByScore: LeadSummary[];
}

interface StatsResponse {
  success: boolean;
  data: StatsData;
}

/**
 * SIMPLIFIED AUTH (documented per the assessment's Part D allowance):
 * This page reuses the real Part B JWT flow (POST /api/auth/login) - same
 * admin login as the React dashboard, no separate/fake auth - but skips
 * every piece of app-wide auth infrastructure a bigger app would have: no
 * route guard, no HTTP interceptor, no token refresh, and the token is kept
 * only in this component's own field (never written to localStorage, so a
 * page refresh just logs it out again). That's acceptable here because:
 *   1. This is one single, read-only, internal insights view, not a
 *      multi-page app where every route needs the same auth guard.
 *   2. The Node API's actual security (JWT verification, bcrypt password
 *      check) is already fully implemented in Part B and exercised for
 *      real here - this only simplifies how the *Angular side* carries the
 *      token around, not the API's own auth.
 *   3. The assessment explicitly scopes Part D to ~45-60 minutes and asks
 *      not to over-engineer it with extra architecture.
 */
@Component({
  selector: 'app-lead-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lead-insights.component.html',
  styleUrl: './lead-insights.component.css',
})
export class LeadInsightsComponent {
  readonly statusOrder = STATUS_ORDER;

  // Login form state.
  email = '';
  password = '';
  token = '';
  loginError = '';
  loggingIn = false;

  // Stats state.
  stats: StatsData | null = null;
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  login(): void {
    if (!this.email || !this.password) {
      this.loginError = 'Email and password are required.';
      return;
    }

    this.loggingIn = true;
    this.loginError = '';

    this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.token = res.data.token;
          this.loggingIn = false;
          this.password = ''; // no reason to keep it around once we have the token
          this.fetchStats();
        },
        error: (err: HttpErrorResponse) => {
          this.loggingIn = false;
          this.loginError = err.error?.message || 'Login failed. Check your credentials and API URL.';
        },
      });
  }

  /**
   * GET /api/stats already returns everything this page needs in one call:
   * total leads, counts by status, and the top 5 leads by Lead Score
   * (backend does the sorting/limiting - see api/src/controllers/statsController.js)
   * - so there's nothing left to sort/filter client-side.
   */
  fetchStats(): void {
    this.loading = true;
    this.error = '';

    this.http
      .get<StatsResponse>(`${API_BASE_URL}/stats`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      .subscribe({
        next: (res) => {
          this.stats = res.data;
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          if (err.status === 401) {
            // Token expired/invalid - simplest recovery for this small page
            // is just sending them back to the login form, not a silent retry.
            this.token = '';
            this.loginError = 'Session expired. Please log in again.';
          } else {
            this.error = err.error?.message || 'Failed to load statistics.';
          }
        },
      });
  }

  logout(): void {
    this.token = '';
    this.stats = null;
  }
}
