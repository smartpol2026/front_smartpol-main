import { API_URL, getAuthHeaders, apiCall } from "./config";

export async function getPoliticalStatuses() {
  return apiCall(`${API_URL}/political-statuses`, {
    headers: getAuthHeaders(),
  }, "obtener estados políticos");
}
