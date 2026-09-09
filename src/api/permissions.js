import { API_URL } from './config';

/**
 * Obtiene los permisos del usuario autenticado
 * @returns {Promise<string[]>} Array de permisos
 */
export async function getUserPermissions() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/auth/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Token expired or invalid');
      }
      throw new Error('Error fetching permissions');
    }

    const data = await response.json();
    return data.permissions || [];
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - El permiso a verificar (ej: 'voters:read')
 * @param {string[]} userPermissions - Array de permisos del usuario
 * @returns {boolean}
 */
export function hasPermission(permission, userPermissions = []) {
  return userPermissions.includes(permission);
}

/**
 * Verifica si el usuario tiene alguno de los permisos listados
 * @param {string[]} permissions - Array de permisos a verificar
 * @param {string[]} userPermissions - Array de permisos del usuario
 * @returns {boolean}
 */
export function hasAnyPermission(permissions, userPermissions = []) {
  return permissions.some(perm => userPermissions.includes(perm));
}

/**
 * Verifica si el usuario tiene todos los permisos listados
 * @param {string[]} permissions - Array de permisos a verificar
 * @param {string[]} userPermissions - Array de permisos del usuario
 * @returns {boolean}
 */
export function hasAllPermissions(permissions, userPermissions = []) {
  return permissions.every(perm => userPermissions.includes(perm));
}
