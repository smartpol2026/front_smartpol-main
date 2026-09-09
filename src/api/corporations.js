import { API_URL, getAuthHeaders, apiCall } from './config';

export async function getCorporations() {
  return apiCall(`${API_URL}/corporations`, {
    headers: getAuthHeaders(),
  }, 'obtener corporaciones');
}

export async function getCorporationById(id) {
  return apiCall(`${API_URL}/corporations/${id}`, {
    headers: getAuthHeaders(),
  }, 'obtener corporación');
}

export async function createCorporation(data) {
  return apiCall(`${API_URL}/corporations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }, 'crear corporación');
}

export async function updateCorporation(id, data) {
  return apiCall(`${API_URL}/corporations/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }, 'actualizar corporación');
}

export async function deleteCorporation(id) {
  return apiCall(`${API_URL}/corporations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }, 'eliminar corporación');
}
