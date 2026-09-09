import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function PrivateRoute({ children }) {
  const { user, isLoading } = useUser();

  // Mostrar loading mientras se cargan los datos
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

  // Si no hay usuario autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si hay usuario, renderizar los hijos
  return children;
}
