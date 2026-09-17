import apiClient from "./client";

export function getStats() {
  return apiClient.get("/stats");
}
