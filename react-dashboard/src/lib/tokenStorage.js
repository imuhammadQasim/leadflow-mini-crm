// Small wrapper around localStorage so the JWT has one place it's read/written
// from, instead of "localStorage.getItem('token')" scattered across files.
const STORAGE_KEY = "leadflow_token";

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}
