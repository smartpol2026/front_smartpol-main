import { usePermission } from "../hooks/usePermission";
import { useUser } from "../context/UserContext";
import Forbidden from "../pages/Forbidden";

/**
 * Ruta protegida por permisos
 *
 * @param {Object} props
 * @param {string|string[]} props.requiredPermission - Permiso(s) requerido(s)
 * @param {boolean} props.requireAll - Si true, requiere TODOS los permisos; si false, requiere AL MENOS UNO (default: false)
 * @param {React.ReactNode} props.children - Componente a renderizar si tiene permiso
 *
 * @example
 * // Requerir un permiso
 * <PermissionRoute requiredPermission="candidates:read">
 *   <Candidatos />
 * </PermissionRoute>
 *
 * @example
 * // Requerir cualquiera de varios permisos
 * <PermissionRoute requiredPermission={['candidates:read', 'candidates:create']}>
 *   <Candidatos />
 * </PermissionRoute>
 *
 * @example
 * // Requerir TODOS los permisos especificados
 * <PermissionRoute requiredPermission={['candidates:read', 'candidates:update']} requireAll>
 *   <EditCandidates />
 * </PermissionRoute>
 */
export default function PermissionRoute({
  requiredPermission,
  requireAll = false,
  children,
}) {
  const { user, isLoading } = useUser();
  const { can, canAll, canAny } = usePermission();

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
  const permissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  // Verificar permisos
  let hasAccess;
  if (permissions.length === 1) {
    hasAccess = can(permissions[0]);
  } else if (requireAll) {
    hasAccess = canAll(permissions);
  } else {
    hasAccess = canAny(permissions);
  }

  // Si no tiene permisos, mostrar página de acceso denegado
  if (!hasAccess) {
    return <Forbidden />;
  }

  // Si tiene permisos, renderizar el componente
  return children;
}
