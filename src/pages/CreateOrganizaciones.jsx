import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrganizationWithAdmin } from "../api/organizations";
import { useAlert } from "../hooks/useAlert";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateOrganizaciones() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
    adminRoleId: 2, // Role ID por defecto (admin de organización)
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.name.trim()) {
      alert.error("El nombre de la organización es obligatorio");
      return;
    }

    if (!formData.adminEmail.trim()) {
      alert.error("El email del administrador es obligatorio");
      return;
    }

    if (!formData.adminPassword) {
      alert.error("La contraseña del administrador es obligatoria");
      return;
    }

    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      alert.error("Las contraseñas no coinciden");
      return;
    }

    if (formData.adminPassword.length < 6) {
      alert.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminPassword: formData.adminPassword,
        adminRoleId: parseInt(formData.adminRoleId),
      };

      console.log("Datos a enviar:", dataToSend); // DEBUG

      await createOrganizationWithAdmin(dataToSend);
      alert.success("Organización y administrador creados exitosamente");

      setTimeout(() => {
        navigate("/app/organizaciones", { state: { refresh: true } });
      }, 1500);
    } catch (err) {
      console.error("Error completo:", err); // DEBUG
      alert.apiError(err, "Error al crear la organización");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/app/organizaciones");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-gray-200 transition"
          title="Volver"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="page-title">Crear Nueva Organización</h2>
          <p className="text-gray-500 text-sm mt-1">
            Crea una organización y asigna un administrador
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8"
        >
          {/* Nombre */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Nombre de la Organización *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: Partido Liberal"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
              required
            />
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe tu organización..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition resize-none"
            />
          </div>

          {/* Datos del Administrador */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Datos del Administrador
            </h3>

            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="adminEmail"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Email *
              </label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleInputChange}
                placeholder="admin@miorganizacion.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
                required
              />
            </div>

            {/* Contraseña */}
            <div className="mb-4">
              <label
                htmlFor="adminPassword"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Contraseña *
              </label>
              <input
                type="password"
                id="adminPassword"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
                required
              />
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label
                htmlFor="adminPasswordConfirm"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                id="adminPasswordConfirm"
                name="adminPasswordConfirm"
                value={formData.adminPasswordConfirm}
                onChange={handleInputChange}
                placeholder="Confirma tu contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
                required
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg text-white transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 shadow-md"
              }`}
            >
              {loading ? "Creando..." : "Crear Organización"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
