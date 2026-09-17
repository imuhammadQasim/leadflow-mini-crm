import apiClient from "./client";

export function listLeads({ status, q, page = 1, limit = 20 } = {}) {
  return apiClient.get("/leads", { params: { status, q, page, limit } });
}

export function getLead(id) {
  return apiClient.get(`/leads/${id}`);
}

export function createLead(payload) {
  return apiClient.post("/leads", payload);
}

export function updateLead(id, payload) {
  return apiClient.patch(`/leads/${id}`, payload);
}

export function deleteLead(id) {
  return apiClient.delete(`/leads/${id}`);
}
