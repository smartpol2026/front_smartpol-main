import { useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <ExclamationTriangleIcon className="h-8 w-8 text-blue-600" />
        </div>

        {/* Contenido */}
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-2xl font-semibold text-gray-800 mb-2">
          Página No Encontrada
        </p>

        <p className="text-gray-500 mb-8 text-base leading-relaxed">
          La página que buscas no existe o ha sido movida. Verifica la URL e
          intenta nuevamente.
        </p>

        {/* Información adicional */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">
            Posibles razones:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• La URL es incorrecta</li>
            <li>• La página ha sido eliminada</li>
            <li>• El enlace está roto</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
          Si crees que debería existir esta página, contacta a
          soporte@smartpol.com
        </p>
      </div>
    </div>
  );
}
