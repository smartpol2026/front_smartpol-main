import { API_URL, getAuthHeaders, apiCall } from "./config";

export async function getCandidates() {
  return apiCall(`${API_URL}/candidates?limit=10000`, {
    headers: getAuthHeaders(),
  }, "obtener candidatos");
}

export async function getAllCandidates() {
  try {
    let allCandidates = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const data = await apiCall(`${API_URL}/candidates?page=${page}&limit=100`, {
        headers: getAuthHeaders(),
      }, "obtener candidatos página " + page);

      if (Array.isArray(data?.data)) {
        allCandidates = [...allCandidates, ...data.data];
      } else if (Array.isArray(data)) {
        allCandidates = [...allCandidates, ...data];
      }

      if (data?.pages && page >= data.pages) {
        hasMorePages = false;
      } else if (!data?.pages && (!data?.data || data.data.length < 100)) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    return allCandidates;
  } catch (error) {
    console.error("Error loading all candidates:", error);
    throw error;
  }
}

export async function getCandidatesWithPagination(page = 1, limit = 10, search = '') {
  const params = new URLSearchParams({
    page,
    limit,
  });
  if (search) {
    params.append('search', search);
  }
  return apiCall(`${API_URL}/candidates?${params.toString()}`, {
    headers: getAuthHeaders(),
  }, "obtener candidatos con paginación");
}

export async function getCandidateById(candidateId) {
  return apiCall(`${API_URL}/candidates/${candidateId}`, {
    headers: getAuthHeaders(),
  }, "obtener candidato");
}

export async function getCandidateByUserId(userId) {
  return apiCall(`${API_URL}/candidates/by-user/${userId}`, {
    headers: getAuthHeaders(),
  }, "obtener candidato por usuario");
}

export async function getCandidatesByCampaign(campaignId) {
  if (!campaignId || isNaN(campaignId)) {
    throw new Error('campaignId debe ser un número válido');
  }
  return apiCall(`${API_URL}/candidates/by-campaign/${campaignId}`, {
    headers: getAuthHeaders(),
  }, "obtener candidatos por campaña");
}

export async function createCandidate(candidate) {
  return apiCall(`${API_URL}/candidates`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(candidate),
  }, "crear candidato");
}

export async function updateCandidate(candidateId, candidate) {
  return apiCall(`${API_URL}/candidates/${candidateId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(candidate),
  }, "actualizar candidato");
}

export async function deleteCandidate(candidateId) {
  return apiCall(`${API_URL}/candidates/${candidateId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }, "eliminar candidato");
}

export async function getVoterCountByCandidate() {
  return apiCall(`${API_URL}/candidates/votes/by-candidate`, {
    headers: getAuthHeaders(),
  }, "obtener conteo de votantes por candidato");
}

export async function getVoterCountByParty() {
  return apiCall(`${API_URL}/candidates/votes/by-party`, {
    headers: getAuthHeaders(),
  }, "obtener conteo de votantes por partido");
}