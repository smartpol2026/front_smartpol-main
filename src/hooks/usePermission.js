import { useUser } from '../context/UserContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../api/permissions';

/**
 * Hook para verificar permisos del usuario
 * @returns {Object} Métodos para verificar permisos
 */
export function usePermission() {
  const { permissions } = useUser();

  return {
    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} permission - El permiso a verificar (ej: 'voters:read')
     * @returns {boolean}
     */
    can: (permission) => hasPermission(permission, permissions),

    /**
     * Verifica si el usuario tiene alguno de los permisos listados
     * @param {string[]} permissions - Array de permisos a verificar
     * @returns {boolean}
     */
    canAny: (perms) => hasAnyPermission(perms, permissions),

    /**
     * Verifica si el usuario tiene todos los permisos listados
     * @param {string[]} permissions - Array de permisos a verificar
     * @returns {boolean}
     */
    canAll: (perms) => hasAllPermissions(perms, permissions),

    /**
     * Obtiene todos los permisos del usuario
     * @returns {string[]}
     */
    getPermissions: () => permissions,
  };
}
