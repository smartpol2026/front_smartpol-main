import { Navigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";
import { useUser } from "../context/UserContext";

/**
 * Componente que redirige inteligentemente según los permisos del usuario
 * - Si tiene permiso dashboard:read -> /app/dashboard
 * - Si no tiene permiso -> /app/votantes
 */
export default function AppRedirect() {
  const { can } = usePermission();
  const { permissions, isLoading } = useUser();

  // Mientras se cargan los permisos, mostrar loading
  if (isLoading || permissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  // Si tiene acceso a dashboard, redirigir a dashboard
  if (can("dashboard:read")) {
    return <Navigate to="dashboard" replace />;
  }

  // Si no tiene acceso a dashboard, redirigir a votantes
  return <Navigate to="votantes" replace />;
}
