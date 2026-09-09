import { API_URL, getAuthHeaders, apiCall } from './config';

export async function getVotingBooths() {
  const headers = getAuthHeaders();
  return apiCall(`${API_URL}/voting-booths`, {
    headers,
  }, 'obtener centros de votación');
}

export async function getVotingBoothById(boothId) {
  return apiCall(`${API_URL}/voting-booths/${boothId}`, {
    headers: getAuthHeaders(),
  }, 'obtener centro de votación');
}

export async function getBoothsByMunicipality(municipalityId) {
  return apiCall(`${API_URL}/voting-booths/by-municipality/${municipalityId}`, {
    headers: getAuthHeaders(),
  }, 'obtener centros de votación');
}

export async function createVotingBooth(booth) {
  return apiCall(`${API_URL}/voting-booths`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(booth),
  }, 'crear centro de votación');
}

export async function updateVotingBooth(boothId, booth) {
  return apiCall(`${API_URL}/voting-booths/${boothId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(booth),
  }, 'actualizar centro de votación');
}

export async function deleteVotingBooth(boothId) {
  return apiCall(`${API_URL}/voting-booths/${boothId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }, 'eliminar centro de votación');
}