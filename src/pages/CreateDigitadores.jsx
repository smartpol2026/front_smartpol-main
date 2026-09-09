import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createUser } from "../api/users";
import { useAlert } from "../hooks/useAlert";
import { ValidationRules, validateForm } from "../utils/errorHandler";

export default function CreateDigitadores() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validationRules = {
    email: [ValidationRules.required, ValidationRules.email],
    password: [ValidationRules.required, ValidationRules.minLength(8)],
    confirmPassword: [ValidationRules.required, ValidationRules.passwordMatch],
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateForm(formData, validationRules);

    if (!isValid) {
      setFormErrors(errors);
      alert.warning(
        "Por favor completa correctamente todos los campos requeridos",
        "Validación",
      );
      return;
    }

    setLoading(true);

    try {
      // ✅ Obtener organizationId del usuario autenticado
      const organizationId = parseInt(
        localStorage.getItem("organizationId") || "0"
      );

      // Crear usuario con roleId 5 (Digitador) y organizationId heredado
      const userResponse = await createUser({
        email: formData.email,
        password: formData.password,
        roleId: 5,
        organizationId, // ✅ HEREDAR organizationId del usuario autenticado
      });

      if (!userResponse.id) {
        throw new Error("Error al crear el usuario");
      }

      alert.success("El digitador ha sido creado exitosamente", "¡Éxito!");

      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
      });
      setFormErrors({});

      setTimeout(() => {
        navigate("/app/digitadores", { state: { refresh: true } });
      }, 2000);
    } catch (err) {
      alert.apiError(err, "Error al crear el digitador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Digitador</h1>
          <p className="mt-2 text-gray-600">
            Completa el formulario para registrar un nuevo digitador
          </p>
        </div>
        <button
          onClick={() => navigate("/app/digitadores")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* SECCIÓN 1: DATOS DE ACCESO */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Datos de Acceso
            </h2>

            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="digitador@example.com"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${
                  formErrors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 ${
                  formErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {loading ? "Creando..." : "Crear Digitador"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/digitadores")}
              className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}