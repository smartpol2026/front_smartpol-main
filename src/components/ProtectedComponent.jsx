import { usePermission } from "../hooks/usePermission";

/**
 * Componente que renderiza contenido solo si el usuario tiene los permisos requeridos
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar
 * @param {string|string[]} props.permission - Permiso(s) requerido(s)
 * @param {boolean} props.requireAll - Si true, requiere TODOS los permisos; si false, requiere AL MENOS UNO
 * @param {React.ReactNode} props.fallback - Componente a renderizar si no tiene permisos (opcional)
 *
 * @example
 * // Renderizar solo si tiene permiso 'voters:read'
 * <ProtectedComponent permission="voters:read">
 *   <VotersTable />
 * </ProtectedComponent>
 *
 * @example
 * // Renderizar solo si tiene permisos 'voters:read' Y 'voters:update'
 * <ProtectedComponent permission={['voters:read', 'voters:update']} requireAll>
 *   <EditVoterForm />
 * </ProtectedComponent>
 *
 * @example
 * // Renderizar fallback si no tiene permisos
 * <ProtectedComponent
 *   permission="candidates:read"
 *   fallback={<div>No tienes acceso a esta sección</div>}
 * >
 *   <CandidatesTable />
 * </ProtectedComponent>
 */
export function ProtectedComponent({
  children,
  permission,
  requireAll = false,
  fallback = null,
}) {
  const { can, canAny, canAll } = usePermission();

  // Convertir string a array si es necesario
  const permissions = Array.isArray(permission) ? permission : [permission];

  // Verificar permisos
  let hasAccess;
  if (permissions.length === 1) {
    hasAccess = can(permissions[0]);
  } else if (requireAll) {
    hasAccess = canAll(permissions);
  } else {
    hasAccess = canAny(permissions);
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
}

/**
 * Componente para renderizar un elemento con atributos deshabilitados si no tiene permisos
 */
export function PermissionGated({
  children,
  permission,
  requireAll = false,
  disabledReason = "No tienes permisos para esta acción",
}) {
  const { can, canAny, canAll } = usePermission();

  // Convertir string a array si es necesario
  const permissions = Array.isArray(permission) ? permission : [permission];

  // Verificar permisos
  let hasAccess;
  if (permissions.length === 1) {
    hasAccess = can(permissions[0]);
  } else if (requireAll) {
    hasAccess = canAll(permissions);
  } else {
    hasAccess = canAny(permissions);
  }

  return (
    <div title={!hasAccess ? disabledReason : ""}>
      {children && typeof children === "function"
        ? children({ disabled: !hasAccess })
        : Array.isArray(children)
          ? children.map((child) =>
              child.props
                ? { ...child, props: { ...child.props, disabled: !hasAccess } }
                : child,
            )
          : children && children.props
            ? {
                ...children,
                props: { ...children.props, disabled: !hasAccess },
              }
            : children}
    </div>
  );
}
