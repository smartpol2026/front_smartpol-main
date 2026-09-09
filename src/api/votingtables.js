import { API_URL, getAuthHeaders, apiCall } from './config';

export async function getVotingTables() {
  return apiCall(`${API_URL}/voting-tables`, {
    headers: getAuthHeaders(),
  }, 'obtener mesas de votación');
}

export async function getVotingTableById(tableId) {
  return apiCall(`${API_URL}/voting-tables/${tableId}`, {
    headers: getAuthHeaders(),
  }, 'obtener mesa de votación');
}

export async function createVotingTable(table) {
  return apiCall(`${API_URL}/voting-tables`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(table),
  }, 'crear mesa de votación');
}

export async function updateVotingTable(tableId, table) {
  return apiCall(`${API_URL}/voting-tables/${tableId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(table),
  }, 'actualizar mesa de votación');
}

export async function deleteVotingTable(tableId) {
  return apiCall(`${API_URL}/voting-tables/${tableId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }, 'eliminar mesa de votación');
}

export async function getTablesByBooth(boothId) {
  return apiCall(`${API_URL}/voting-tables/by-booth/${boothId}`, {
    headers: getAuthHeaders(),
  }, 'obtener mesas del centro');
}