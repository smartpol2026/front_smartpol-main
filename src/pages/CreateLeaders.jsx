import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createUser } from "../api/users";
import { createLeader } from "../api/leaders";
import { getAllCampaigns, getCampaignsByOrganization } from "../api/campaigns";
import { getOrganizations } from "../api/organizations";
import { useAlert } from "../hooks/useAlert";
import { useUser } from "../context/UserContext";
import { ValidationRules, validateForm } from "../utils/errorHandler";

export default function CreateLeaders() {
  const navigate = useNavigate();
  const { user } = useUser();
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    document: "",
    municipality: "",
    phone: "",
    organizationId: "",
    campaignId: "",
  });

  const validationRules = {
    email: [ValidationRules.required, ValidationRules.email],
    password: [ValidationRules.required, ValidationRules.minLength(8)],
    confirmPassword: [ValidationRules.required, ValidationRules.passwordMatch],
    name: [ValidationRules.required, ValidationRules.minLength(3)],
    document: [ValidationRules.required, ValidationRules.minLength(5)],
    municipality: [ValidationRules.required],
    organizationId: [ValidationRules.required],
    campaignId: [ValidationRules.required],
  };

  // Cargar organizaciones al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const roleId = localStorage.getItem('roleId');
        const organizationId = localStorage.getItem('organizationId');

        setUserRole(parseInt(roleId));
        setCurrentOrganizationId(parseInt(organizationId));

        const organizationsData = await getOrganizations();

        const organizationsList = Array.isArray(organizationsData)
          ? organizationsData
          : Array.isArray(organizationsData?.data)
          ? organizationsData.data
          : [];

        setOrganizations(organizationsList);
        setCampaigns([]);

        // Si es admin de organización, preseleccionar su organización
        if (roleId === '2' && organizationId) {
          setFormData((prev) => ({
            ...prev,
            organizationId: organizationId,
          }));
        }
      } catch (err) {
        alert.error(
          err.message || "Error al cargar los datos",
          "Error al cargar",
        );
      } finally {
        setLoadingCampaigns(false);
      }
    };
    loadData();
  }, []);

  // Cargar campañas cuando se selecciona una organización
  useEffect(() => {
    const loadCampaigns = async () => {
      if (formData.organizationId) {
        try {
          const campaignsData = await getCampaignsByOrganization(formData.organizationId);
          setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
          // Resetear campaignId cuando cambia la organización
          setFormData((prev) => ({
            ...prev,
            campaignId: "",
          }));
        } catch (err) {
          console.error("Error al cargar campañas", err);
          setCampaigns([]);
        }
      } else {
        setCampaigns([]);
      }
    };
    loadCampaigns();
  }, [formData.organizationId]);

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
      // 1. Crear usuario con roleId 4 (Lider) y organizationId seleccionado
      const userResponse = await createUser({
        email: formData.email,
        password: formData.password,
        roleId: 4,
        organizationId: parseInt(formData.organizationId), // Usar organizationId seleccionado
      });

      if (!userResponse.id) {
        throw new Error("Error al crear el usuario");
      }

      console.log(
        "✅ Usuario líder creado con organizationId:",
        userResponse.organizationId,
      );

      // ✅ 2. Crear líder CON userId (requerido)
      const leaderData = {
        name: formData.name,
        document: formData.document,
        municipality: formData.municipality,
        phone: formData.phone,
        userId: userResponse.id, // ✅ REQUERIDO
        ...(formData.campaignId && { campaignId: parseInt(formData.campaignId) }),
      };

      await createLeader(leaderData);

      alert.success(
        `El líder ha sido creado exitosamente en la organización: ${user?.organizationName}`,
        "¡Éxito!",
      );

      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        document: "",
        municipality: "",
        phone: "",
        organizationId: "",
        campaignId: "",
      });
      setFormErrors({});

      setTimeout(() => {
        navigate("/app/lideres", { state: { refresh: true } });
      }, 2000);
    } catch (err) {
      alert.apiError(err, "Error al crear el líder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Líder</h1>
          <p className="mt-2 text-gray-600">
            Completa el formulario para registrar un nuevo líder comunitario en{" "}
            <strong>{user?.organizationName || "tu organización"}</strong>
          </p>
        </div>
        <button
          onClick={() => navigate("/app/lideres")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* SECCIÓN 1: DATOS DE USUARIO */}
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
                className={`
                  mt-1 block w-full rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2
                  ${formErrors.email ? "border-red-500 bg-red-50" : "border-gray-300"}
                `}
                placeholder="lider@example.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Contraseña y Confirmar */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
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
                  className={`
                    mt-1 block w-full rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2
                    ${formErrors.password ? "border-red-500 bg-red-50" : "border-gray-300"}
                  `}
                  placeholder="••••••••"
                  required
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.password}
                  </p>
                )}
              </div>

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
                  className={`
                    mt-1 block w-full rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2
                    ${formErrors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300"}
                  `}
                  placeholder="••••••••"
                  required
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DEL LÍDER */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Datos del Líder
            </h2>

            {/* Nombre y Documento */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`
                    mt-1 block w-full rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2
                    ${formErrors.name ? "border-red-500 bg-red-50" : "border-gray-300"}
                  `}
                  placeholder="María González"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="document"
                  className="block text-sm font-medium text-gray-700"
                >
                  Documento de Identidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="document"
                  id="document"
                  value={formData.document}
                  onChange={handleInputChange}
                  className={`
                    mt-1 block w-full rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2
                    ${formErrors.document ? "border-red-500 bg-red-50" : "border-gray-300"}
                  `}
                  placeholder="1234567890"
                  required
                />
                {formErrors.document && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.document}
                  </p>
                )}
              </div>
            </div>

            {/* Municipio y Teléfono */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-4">
              <div>
                <label
                  htmlFor="municipality"
                  className="block text-sm font-medium text-gray-700"
                >
                  Municipio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="municipality"
                  id="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className={`
                    mt-1 block w-full rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2
                    ${formErrors.municipality ? "border-red-500 bg-red-50" : "border-gray-300"}
                  `}
                  placeholder="Nombre del municipio"
                  required
                />
                {formErrors.municipality && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.municipality}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2"
                  placeholder="+57 300 1234567"
                />
              </div>
            </div>

            {/* Organización */}
            <div className="mb-4">
              <label
                htmlFor="organizationId"
                className="block text-sm font-medium text-gray-700"
              >
                Organización <span className="text-red-500">*</span>
              </label>
              <select
                name="organizationId"
                id="organizationId"
                value={formData.organizationId}
                onChange={handleInputChange}
                disabled={userRole === 2}
                className={`
                  mt-1 block w-full rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-3
                  ${formErrors.organizationId ? "border-red-500 bg-red-50" : "border-gray-300"}
                  ${userRole === 2 ? "bg-gray-100 cursor-not-allowed" : ""}
                `}
              >
                <option value="">Seleccionar organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {formErrors.organizationId && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.organizationId}
                </p>
              )}
            </div>

            {/* Campaña */}
            <div>
              <label
                htmlFor="campaignId"
                className="block text-sm font-medium text-gray-700"
              >
                Campaña <span className="text-red-500">*</span>
              </label>
              <select
                name="campaignId"
                id="campaignId"
                value={formData.campaignId}
                onChange={handleInputChange}
                disabled={!formData.organizationId || campaigns.length === 0}
                className={`
                  mt-1 block w-full rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-3
                  ${formErrors.campaignId ? "border-red-500 bg-red-50" : "border-gray-300"}
                  ${!formData.organizationId || campaigns.length === 0 ? "bg-gray-100 cursor-not-allowed" : ""}
                `}
              >
                <option value="">{!formData.organizationId ? "Selecciona una organización primero" : "Seleccionar campaña"}</option>
                {loadingCampaigns ? (
                  <option disabled>Cargando campañas...</option>
                ) : campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} {campaign.status ? "✓" : "✗"}
                    </option>
                  ))
                ) : (
                  <option disabled>No hay campañas disponibles</option>
                )}
              </select>
              {formErrors.campaignId && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.campaignId}
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/app/lideres")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingCampaigns}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Crear Líder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}