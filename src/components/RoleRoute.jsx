import { useUser } from "../context/UserContext";
import Forbidden from "../pages/Forbidden";

/**
 * Ruta protegida por rol de usuario
 *
 * @param {Object} props
 * @param {number|number[]} props.requiredRole - Role ID(s) requerido(s)
 * @param {React.ReactNode} props.children - Componente a renderizar si tiene el rol
 *
 * @example
 * // Requerir un rol específico
 * <RoleRoute requiredRole={2}>
 *   <AdminPanel />
 * </RoleRoute>
 *
 * @example
 * // Requerir cualquiera de varios roles
 * <RoleRoute requiredRole={[1, 2]}>
 *   <AdminSection />
 * </RoleRoute>
 */
export default function RoleRoute({ requiredRole, children }) {
  const { user, isLoading } = useUser();

  // Mostrar loading mientras se cargan datos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado
  if (!user) {
    return <Forbidden />;
  }

  // Normalizar a array
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // Verificar si el usuario tiene uno de los roles requeridos
  const hasRole = roles.includes(user.roleId);

  // Si no tiene el rol, mostrar página de acceso denegado
  if (!hasRole) {
    return <Forbidden />;
  }

  // Si tiene el rol, renderizar el componente
  return children;
}
