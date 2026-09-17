import apiClient from "./client";

// skipAuth: true because there's no token yet at login time, and we don't
// want a stale/expired token from a previous session attached to this call.
export function login(email, password) {
  return apiClient.post("/auth/login", { email, password }, { skipAuth: true });
}
