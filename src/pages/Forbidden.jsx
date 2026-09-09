import { useNavigate } from "react-router-dom";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { usePermission } from "../hooks/usePermission";

export default function Forbidden() {
  const navigate = useNavigate();
  const { can } = usePermission();

  const handleGoToDashboard = () => {
    // Si tiene acceso a dashboard, ir a dashboard
    if (can("dashboard:read")) {
      navigate("/app/dashboard");
    } else {
      // Si no tiene acceso, ir a votantes (página alternativa)
      navigate("/app/votantes");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <LockClosedIcon className="h-8 w-8 text-red-600" />
        </div>

        {/* Contenido */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h1>
        <p className="text-xl text-gray-600 mb-2">Error 403</p>

        <p className="text-gray-500 mb-8 text-base leading-relaxed">
          No tienes permisos para acceder a esta página. Si crees que esto es un
          error, contacta con el administrador del sistema.
        </p>

        {/* Información adicional */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">
            ¿Qué puedes hacer?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Regresa a la página de inicio</li>
            <li>✓ Solicita acceso al administrador</li>
            <li>✓ Verifica tus permisos en tu perfil</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Ir al Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Volver Atrás
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-8">
          Si el problema persiste, por favor contacta a soporte@smartpol.com
        </p>
      </div>
    </div>
  );
}
