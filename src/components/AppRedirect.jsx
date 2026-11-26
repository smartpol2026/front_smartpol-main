import { Navigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
import { useUser } from "../context/UserContext";

/**
 * Redirección inicial según permisos del usuario.
 * Superadmin no usa Mi mesa ni Tablero.
 */
export default function AppRedirect() {
  const { can } = usePermission();
  const { user, permissions, isLoading } = useUser();
  const isSuperadmin = user?.roleId === 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (can("dashboard:read")) {
    return <Navigate to="dashboard" replace />;
  }
  if (!isSuperadmin && can("control-board:read")) {
    return <Navigate to="tablero-control" replace />;
  }
  if (!isSuperadmin && can("my-table:read")) {
    return <Navigate to="mi-mesa" replace />;
  }
  if (can("voting:access")) {
    return <Navigate to="dia-d/registro" replace />;
  }
  if (can("voters:read")) {
    return <Navigate to="votantes" replace />;
  }

  return <Navigate to="/forbidden" replace />;
}
