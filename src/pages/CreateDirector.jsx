import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createUser } from "../api/users";
import { getAllOrganizations } from "../api/organizations";
import {
  getAllCampaigns,
  getCampaignsByOrganization,
} from "../api/campaigns";
import { useUser } from "../context/UserContext";
import { useAlert } from "../hooks/useAlert";
import { ValidationRules, validateForm } from "../utils/errorHandler";

const ROLE_SUPERADMIN = 1;
const ROLE_CAMPAIGN_ADMIN = 2;
const ROLE_DIRECTOR = 7;

export default function CreateDirector() {
  const navigate = useNavigate();
  const alert = useAlert();
  const { user, isLoading: isLoadingUser } = useUser();

  const [organizations, setOrganizations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    organizationId: "",
    campaignId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isSuperadmin = user?.roleId === ROLE_SUPERADMIN;
  const isCampaignAdmin = user?.roleId === ROLE_CAMPAIGN_ADMIN;
  const canCreate = isSuperadmin || isCampaignAdmin;

  useEffect(() => {
    if (isCampaignAdmin && user?.organizationId) {
      setFormData((prev) => ({
        ...prev,
        organizationId: String(user.organizationId),
      }));
    }
  }, [isCampaignAdmin, user?.organizationId]);

  useEffect(() => {
    if (!isSuperadmin) return;
    const loadOrganizations = async () => {
      setLoadingOrganizations(true);
      try {
        const response = await getAllOrganizations();
        setOrganizations(Array.isArray(response) ? response : response?.data || []);
      } catch {
        setOrganizations([]);
      } finally {
        setLoadingOrganizations(false);
      }
    };
    loadOrganizations();
  }, [isSuperadmin]);

  useEffect(() => {
    const organizationId = formData.organizationId;
    if (!organizationId && !isCampaignAdmin) {
      setCampaigns([]);
      return;
    }

    const loadCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        let list = [];
        if (organizationId) {
          const response = await getCampaignsByOrganization(organizationId);
          list = Array.isArray(response) ? response : response?.data || [];
        } else if (isSuperadmin) {
          list = await getAllCampaigns();
        }
        setCampaigns(list);
      } catch {
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, [formData.organizationId, isCampaignAdmin, isSuperadmin]);

  if (isLoadingUser) {
    return <div className="app-card p-6 text-gray-600">Cargando...</div>;
  }

  if (!canCreate) {
    return <Navigate to="/forbidden" replace />;
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "organizationId") next.campaignId = "";
      return next;
    });
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const getCreationError = (error) => {
    const status = error.response?.status;
    const serverMessage = String(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "",
    ).toLowerCase();

    if (status === 403) return "No tienes permisos para crear este usuario.";
    if (
      status === 409 ||
      ((serverMessage.includes("correo") || serverMessage.includes("email")) &&
        (serverMessage.includes("existe") ||
          serverMessage.includes("registrado") ||
          serverMessage.includes("duplicate")))
    ) {
      return "El correo ingresado ya está registrado.";
    }
    if (
      (status === 400 || status === 404 || status === 422) &&
      (serverMessage.includes("rol") || serverMessage.includes("role"))
    ) {
      return "El rol seleccionado no existe o no está disponible.";
    }
    if (
      status === 400 &&
      (serverMessage.includes("campaña") ||
        serverMessage.includes("campaign") ||
        serverMessage.includes("campaignids"))
    ) {
      return "Debes asignar exactamente una campaña.";
    }

    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "No se pudo crear el director."
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { isValid, errors } = validateForm(formData, {
      email: [ValidationRules.required, ValidationRules.email],
      password: [ValidationRules.required, ValidationRules.minLength(8)],
      confirmPassword: [ValidationRules.required, ValidationRules.passwordMatch],
    });

    if (!formData.organizationId) errors.organizationId = "Selecciona una organización";
    if (!formData.campaignId) errors.campaignId = "Selecciona una campaña";

    if (!isValid || errors.organizationId || errors.campaignId) {
      setFormErrors(errors);
      alert.warning("Completa correctamente todos los campos requeridos", "Validación");
      return;
    }

    setLoading(true);
    try {
      await createUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roleId: ROLE_DIRECTOR,
        organizationId: Number(formData.organizationId),
        campaignIds: [Number(formData.campaignId)],
      });

      alert.success("Director de campaña creado exitosamente", "¡Éxito!");
      navigate("/app/directores-campana", { state: { refresh: true } });
    } catch (error) {
      alert.error(getCreationError(error), "Error al crear el director");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Crear director de campaña</h1>
          <p className="mt-2 text-gray-600">
            Registra un director asociado a exactamente una campaña
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/directores-campana")}
          className="app-btn-ghost"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Volver
        </button>
      </div>

      <div className="app-card max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="border-b border-gray-100 pb-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Organización y campaña
            </h2>

            {isSuperadmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organización <span className="text-red-500">*</span>
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  disabled={loadingOrganizations}
                  className={`app-input ${formErrors.organizationId ? "border-red-500" : ""}`}
                >
                  <option value="">
                    {loadingOrganizations ? "Cargando..." : "Selecciona una organización"}
                  </option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
                {formErrors.organizationId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.organizationId}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                Se usará automáticamente la organización del admin de campaña.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaña <span className="text-red-500">*</span>
              </label>
              <select
                name="campaignId"
                value={formData.campaignId}
                onChange={handleInputChange}
                disabled={loadingCampaigns || (!formData.organizationId && isSuperadmin)}
                className={`app-input ${formErrors.campaignId ? "border-red-500" : ""}`}
              >
                <option value="">
                  {loadingCampaigns ? "Cargando campañas..." : "Selecciona una campaña"}
                </option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {formErrors.campaignId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.campaignId}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de acceso</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`app-input ${formErrors.email ? "border-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`app-input ${formErrors.password ? "border-red-500" : ""}`}
              />
              <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`app-input ${formErrors.confirmPassword ? "border-red-500" : ""}`}
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit" disabled={loading} className="app-btn-primary flex-1">
              {loading ? "Creando..." : "Crear director de campaña"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/directores-campana")}
              className="app-btn-ghost flex-1"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
