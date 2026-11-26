import { API_URL, getAuthHeaders, getToken, apiCall } from "./config";

export async function assignWitnessTable(payload) {
  return apiCall(
    `${API_URL}/election-day/witness-assignments`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
    "asignar mesa al testigo",
  );
}

export async function updateWitnessAssignment(payload) {
  return apiCall(
    `${API_URL}/election-day/witness-assignments`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
    "actualizar mesa del testigo",
  );
}

export async function getMyTable() {
  return apiCall(
    `${API_URL}/election-day/my-table`,
    { headers: getAuthHeaders() },
    "obtener mi mesa",
  );
}

export async function createMyTableReport(payload, evidenceFile) {
  if (evidenceFile) {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    });
    formData.append("evidence", evidenceFile);

    const token = getToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    return apiCall(
      `${API_URL}/election-day/my-table/reports`,
      {
        method: "POST",
        headers,
        body: formData,
      },
      "enviar reporte de mesa",
    );
  }

  return apiCall(
    `${API_URL}/election-day/my-table/reports`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
    "enviar reporte de mesa",
  );
}

export async function createMyTableNovelty(payload) {
  return apiCall(
    `${API_URL}/election-day/my-table/novelties`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
    "crear novedad de mesa",
  );
}

export async function getControlBoard(campaignId) {
  const params = new URLSearchParams();
  if (campaignId) params.append("campaignId", String(campaignId));
  const query = params.toString() ? `?${params.toString()}` : "";

  return apiCall(
    `${API_URL}/election-day/control-board${query}`,
    { headers: getAuthHeaders() },
    "obtener tablero de control",
  );
}

export async function getCampaignNovelties(campaignId) {
  const params = new URLSearchParams();
  if (campaignId) params.append("campaignId", String(campaignId));
  const query = params.toString() ? `?${params.toString()}` : "";

  return apiCall(
    `${API_URL}/election-day/novelties${query}`,
    { headers: getAuthHeaders() },
    "obtener novedades de campaña",
  );
}

export async function getControlBoardMapPoints({
  departmentCode,
  municipalityCode,
} = {}) {
  const params = new URLSearchParams();
  if (departmentCode) params.append("departmentCode", String(departmentCode));
  if (municipalityCode) {
    params.append("municipalityCode", String(municipalityCode));
  }
  const query = params.toString() ? `?${params.toString()}` : "";

  return apiCall(
    `${API_URL}/control-board/map-points${query}`,
    { headers: getAuthHeaders() },
    "obtener puntos del mapa",
  );
}
