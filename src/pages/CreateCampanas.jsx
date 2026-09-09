import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign, getAllCampaigns } from "../api/campaigns";
import { getAllOrganizations } from "../api/organizations";
import { useAlert } from "../hooks/useAlert";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const ROLE_SUPER_ADMIN = 1;
const ROLE_ORG_ADMIN = 2;

export default function CreateCampanas() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [currentUser, setCurrentUser] = useState(null);
  const [organizationName, setOrganizationName] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: true,
    organizationId: "",
    userIds: [], // Nuevo: para asignar usuarios
  });

  // Obtener usuario al montar el componente
  useEffect(() => {
    try {
      const userId = localStorage.getItem("user_id");
      const userEmail = localStorage.getItem("user_email");
      const roleId = localStorage.getItem("roleId");
      const organizationId = localStorage.getItem("organizationId");
      const orgName = localStorage.getItem("organizationName");

      if (userId) {
        const user = {
          id: parseInt(userId),
          email: userEmail,
          roleId: parseInt(roleId),
          organizationId: organizationId ? parseInt(organizationId) : null,
        };
        console.log("Usuario construido:", user);
        setCurrentUser(user);

        // Si es admin de organización (roleId === 2)
        if (parseInt(roleId) === ROLE_ORG_ADMIN) {
          setOrganizationName(orgName || "Organización");
          if (organizationId) {
            setFormData((prev) => ({
              ...prev,
              organizationId: parseInt(organizationId),
            }));
          }
          setLoadingOrgs(false);
        }
      } else {
        console.log("No hay user_id en localStorage");
        setCurrentUser({});
        setLoadingOrgs(false);
      }
    } catch (err) {
      console.error("Error al obtener usuario:", err);
      alert.error("Error al cargar información del usuario");
      setLoadingOrgs(false);
    }
  }, []);

  // Cargar organizaciones solo si es super admin
  useEffect(() => {
    if (currentUser && parseInt(currentUser.roleId) === ROLE_SUPER_ADMIN) {
      loadOrganizations();
    }
  }, [currentUser]);

  const loadOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      let orgsData = null;
      try {
        orgsData = await getAllOrganizations();
      } catch (err) {
        console.warn("Usando campañas como fallback...");
        const campaigns = await getAllCampaigns();
        const uniqueOrgs = new Map();
        if (Array.isArray(campaigns)) {
          campaigns.forEach((campaign) => {
            if (campaign.organization && campaign.organization.id) {
              uniqueOrgs.set(campaign.organization.id, campaign.organization);
            }
          });
        }
        orgsData = Array.from(uniqueOrgs.values());
      }

      const orgsArray = Array.isArray(orgsData)
        ? orgsData
        : orgsData?.data || [];
      console.log("Organizaciones cargadas:", orgsArray);
      setOrganizations(orgsArray);

      if (orgsArray.length > 0) {
        setFormData((prev) => ({
          ...prev,
          organizationId: orgsArray[0].id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar organizaciones:", err);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "organizationId"
            ? parseInt(value) || ""
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert.error("El nombre de la campaña es obligatorio");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert.error("Las fechas son obligatorias");
      return;
    }

    if (
      parseInt(currentUser.roleId) === ROLE_SUPER_ADMIN &&
      !formData.organizationId
    ) {
      alert.error("Debes seleccionar una organización");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (startDate >= endDate) {
      alert.error("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      // Asignar organización según el rol
      if (parseInt(currentUser.roleId) === ROLE_ORG_ADMIN) {
        const orgId = localStorage.getItem("organizationId");
        if (orgId) {
          dataToSend.organizationId = parseInt(orgId);
        }
      } else if (parseInt(currentUser.roleId) === ROLE_SUPER_ADMIN) {
        dataToSend.organizationId = formData.organizationId;
      }

      // Agregar usuarios si existen
      if (formData.userIds && formData.userIds.length > 0) {
        dataToSend.userIds = formData.userIds;
      }

      console.log("Datos a enviar:", dataToSend);
      const response = await createCampaign(dataToSend);
      console.log("Respuesta del servidor:", response);

      alert.success("Campaña creada exitosamente");

      setTimeout(() => {
        navigate("/app/campanas", { state: { refresh: true } });
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      let errorMsg = "Error al crear la campaña";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      alert.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/app/campanas");
  };

  if (currentUser === null || loadingOrgs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="text-center text-gray-500">Cargando información...</div>
      </div>
    );
  }

  const isSuperAdmin = parseInt(currentUser.roleId) === ROLE_SUPER_ADMIN;
  const isOrgAdmin = parseInt(currentUser.roleId) === ROLE_ORG_ADMIN;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-gray-200 transition"
          title="Volver"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="page-title">Crear Nueva Campaña</h2>
          <p className="text-gray-500 text-sm mt-1">
            Completa el formulario para registrar una nueva campaña política
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8"
        >
          {isOrgAdmin && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Organización Asignada
              </label>
              <p className="text-sm text-gray-700 font-medium">
                {organizationName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                La campaña se creará automáticamente en tu organización.
              </p>
            </div>
          )}

          {isSuperAdmin && organizations.length > 0 && (
            <div className="mb-6">
              <label
                htmlFor="organizationId"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Organización *
              </label>
              <select
                id="organizationId"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
                required
              >
                <option value="">Selecciona una organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isSuperAdmin && organizations.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> No hay organizaciones disponibles.
              </p>
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Nombre de la Campaña *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: Campaña Electoral 2024"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
              required
            />
          </div>

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
              placeholder="Describe los detalles de esta campaña..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Fecha de Finalización *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div className="mb-8 flex items-center">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={formData.status}
              onChange={handleInputChange}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <label htmlFor="status" className="ml-2 text-sm text-gray-700">
              Campaña activa
            </label>
          </div>

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
              disabled={loading || (isSuperAdmin && organizations.length === 0)}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg text-white transition ${
                loading || (isSuperAdmin && organizations.length === 0)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 shadow-md"
              }`}
            >
              {loading ? "Creando..." : "Crear Campaña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
