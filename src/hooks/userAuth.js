import { useUser } from '../context/UserContext';

/**
 * Hook para acceder a la información del usuario autenticado
 * @returns {Object} Información del usuario actual
 */
export function useAuth() {
  const { user } = useUser();
  
  return {
    currentUser: user,
    isAuthenticated: !!user,
    userId: user?.id,
    organizationId: user?.organizationId,
    role: user?.role,
    permissions: user?.permissions,
  };
}