import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { login as loginRequest } from "../api/authApi";
import { UNAUTHORIZED_EVENT } from "../api/client";
import { getToken, setToken, clearToken } from "../lib/tokenStorage";

export function AuthProvider({ children }) {
  // Trust a token already in localStorage on load - there's no /auth/me
  // endpoint to verify it against, so "has a token" is treated as "logged
  // in" until a request actually comes back 401 (handled below).
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));

  useEffect(() => {
    function handleUnauthorized() {
      clearToken();
      setAdmin(null);
      setIsAuthenticated(false);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginRequest(email, password);
    setToken(data.token);
    setAdmin(data.admin);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
