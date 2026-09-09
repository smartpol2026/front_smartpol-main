import { API_URL, getAuthHeaders, apiCall } from './config';

export async function createUser(userData) {
  return apiCall(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  }, 'crear usuario');
}

export async function getUsers() {
  return apiCall(`${API_URL}/users`, {
    headers: getAuthHeaders(),
  }, 'obtener usuarios');
}

export async function getUsersByRole(roleId) {
  return apiCall(`${API_URL}/users?roleId=${roleId}`, {
    headers: getAuthHeaders(),
  }, 'obtener usuarios por rol');
}

export async function getUsersByRoleWithPagination(roleId, page = 1, limit = 10, search = '') {
  const params = new URLSearchParams({
    roleId,
    page,
    limit,
  });
  if (search) {
    params.append('search', search);
  }
  return apiCall(`${API_URL}/users?${params.toString()}`, {
    headers: getAuthHeaders(),
  }, 'obtener usuarios por rol con paginación');
}

export async function getUserById(id) {
  return apiCall(`${API_URL}/users/${id}`, {
    headers: getAuthHeaders(),
  }, 'obtener usuario');
}

export async function updateUser(id, userData) {
  return apiCall(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  }, 'actualizar usuario');
}

export async function deleteUser(id) {
  return apiCall(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }, 'eliminar usuario');
}

export async function changeOwnPassword(newPassword) {
  return apiCall(`${API_URL}/users/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword }),
  }, 'cambiar contraseña');
}
