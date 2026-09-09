import { API_URL, getAuthHeaders, apiCall } from './config';

/**
 * Obtiene todos los usuarios con sus roles
 */
export async function getUsers() {
  return apiCall(`${API_URL}/permissions/users`, {
    method: 'GET',
    headers: getAuthHeaders(),
  }, 'obtener usuarios');
}

/**
 * Obtiene todos los roles
 */
export async function getRoles() {
  return apiCall(`${API_URL}/permissions/roles`, {
    method: 'GET',
    headers: getAuthHeaders(),
  }, 'obtener roles');
}

/**
 * Obtiene todos los permisos disponibles
 */
export async function getAllPermissions() {
  return apiCall(`${API_URL}/permissions/all`, {
    method: 'GET',
    headers: getAuthHeaders(),
  }, 'obtener permisos');
}

/**
 * Obtiene los permisos de un rol específico
 */
export async function getRolePermissions(roleId) {
  return apiCall(`${API_URL}/permissions/roles/${roleId}/permissions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  }, 'obtener permisos del rol');
}

/**
 * Obtiene los permisos personalizados de un usuario
 */
export async function getUserCustomPermissions(userId) {
  return apiCall(`${API_URL}/permissions/users/${userId}/custom-permissions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  }, 'obtener permisos del usuario');
}

/**
 * Asigna un permiso a un rol
 */
export async function assignPermissionToRole(roleId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/roles/${roleId}/permissions/${permissionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error al asignar permiso: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in assignPermissionToRole:', error);
    throw error;
  }
}

/**
 * Revoca un permiso de un rol
 */
export async function revokePermissionFromRole(roleId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error al revocar permiso: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in revokePermissionFromRole:', error);
    throw error;
  }
}

/**
 * Otorga un permiso personalizado a un usuario
 */
export async function grantPermissionToUser(userId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/users/${userId}/permissions/${permissionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error al otorgar permiso: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in grantPermissionToUser:', error);
    throw error;
  }
}

/**
 * Revoca un permiso personalizado de un usuario
 */
export async function revokePermissionFromUser(userId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/users/${userId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error al revocar permiso: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in revokePermissionFromUser:', error);
    throw error;
  }
}

/**
 * Establece un permiso de usuario como otorgado (granted: true)
 * Usado para otorgar permisos adicionales que el usuario no tiene por rol
 */
export async function grantUserPermission(userId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/users/${userId}/permissions/${permissionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ granted: true }),
    });
    if (!response.ok) {
      throw new Error(`Error al otorgar permiso: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in grantUserPermission:', error);
    throw error;
  }
}

/**
 * Revoca un permiso heredado del rol (granted: false)
 * Usado para denegar permisos que el usuario tiene por rol
 */
export async function revokeUserRolePermission(userId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/users/${userId}/permissions/${permissionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ granted: false }),
    });
    if (!response.ok) {
      throw new Error(`Error al revocar permiso de rol: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in revokeUserRolePermission:', error);
    throw error;
  }
}

/**
 * Elimina un permiso personalizado de un usuario (limpia la excepción)
 */
export async function deleteUserPermission(userId, permissionId) {
  try {
    const response = await fetch(`${API_URL}/permissions/users/${userId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error al eliminar permiso: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in deleteUserPermission:', error);
    throw error;
  }
}

/**
 * Obtiene permisos agrupados por recurso
 */
export async function getPermissionsByResource() {
  try {
    const response = await fetch(`${API_URL}/permissions/by-resource`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error al obtener permisos: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getPermissionsByResource:', error);
    throw error;
  }
}
