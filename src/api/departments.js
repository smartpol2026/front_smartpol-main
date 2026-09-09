import { API_URL, getAuthHeaders, apiCall } from './config';

export async function getDepartments() {
  return apiCall(`${API_URL}/departments`, {
    headers: getAuthHeaders(),
  }, 'obtener departamentos');
}

export async function getMunicipalities(departmentId) {
  return apiCall(`${API_URL}/municipalities/by-department/${departmentId}`, {
    headers: getAuthHeaders(),
  }, 'obtener municipios');
}
