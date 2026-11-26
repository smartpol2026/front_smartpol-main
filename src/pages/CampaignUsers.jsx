import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  deleteUser,
  getUsersByRoleWithPagination,
  updateUser,
} from "../api/users";
import {
  getAllCampaigns,
  getCampaignsByOrganization,
} from "../api/campaigns";
import { getVotingBooths } from "../api/votingbooths";
import AddButton from "../components/AddButton";
import Pagination from "../components/Pagination";
import { useUser } from "../context/UserContext";
import { useAlert } from "../hooks/useAlert";
import { usePermission } from "../hooks/usePermission";

const ROLE_SUPERADMIN = 1;
const ROLE_CAMPAIGN_ADMIN = 2;
const ROLE_DIRECTOR = 7;
const ROLE_WITNESS = 8;

/**
 * Backend: user.campaigns = [{ id, name, ... }]
 */
function getPrimaryCampaign(userItem = {}) {
  if (!Array.isArray(userItem.campaigns) || userItem.campaigns.length === 0) {
    return null;
  }
  return userItem.campaigns[0];
}

/**
 * Backend: user.tableAssignment = { votingBoothName, tableNumber, municipalityName, ... } | null
 */
function formatTableAssignment(assignment) {
  if (!assignment) return "Sin mesa";
  const booth = assignment.votingBoothName || "Puesto";
  const table =
    assignment.tableNumber != null ? `Mesa ${assignment.tableNumber}` : "";
  const place = assignment.municipalityName
    ? ` · ${assignment.municipalityName}`
    : "";
  return [booth, table].filter(Boolean).join(" · ") + place;
}

/**
 * Listado/edición de usuarios de campaña.
 * @param {"director"|"witness"} userType
 */
export default function CampaignUsers({ userType = "director" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();
  const { can } = usePermission();
  const { user, isLoading: isLoadingUser } = useUser();

  const isWitness = userType === "witness";
  const roleId = isWitness ? ROLE_WITNESS : ROLE_DIRECTOR;
  const listPath = isWitness
    ? "/app/testigos-electorales"
    : "/app/directores-campana";
  const createPath = isWitness
    ? "/app/crear-testigos-electorales"
    : "/app/crear-directores-campana";
  const title = isWitness ? "Testigos electorales" : "Directores de campaña";
  const entityLabel = isWitness ? "testigo" : "director";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [booths, setBooths] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    campaignId: "",
    votingBoothId: "",
    tableNumber: "",
  });

  const canManage =
    user?.roleId === ROLE_SUPERADMIN || user?.roleId === ROLE_CAMPAIGN_ADMIN;

  const selectedBooth = useMemo(
    () =>
      booths.find((booth) => String(booth.id) === String(formData.votingBoothId)),
    [booths, formData.votingBoothId],
  );

  const tableOptions = useMemo(() => {
    const total = Number(selectedBooth?.mesas || 0);
    const options = total
      ? Array.from({ length: total }, (_, index) => index + 1)
      : [];
    const current = Number(formData.tableNumber);
    if (current && !options.includes(current)) {
      options.push(current);
      options.sort((a, b) => a - b);
    }
    return options;
  }, [selectedBooth, formData.tableNumber]);

  const fetchUsers = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsersByRoleWithPagination(
        roleId,
        page,
        itemsPerPage,
        searchTerm,
      );

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      setUsers(list);
      setCurrentPage(Number(data?.page) || page);
      setTotalPages(
        Number(data?.pages) ||
          Math.max(1, Math.ceil(list.length / itemsPerPage)),
      );
      setTotalItems(Number(data?.total) || list.length);
    } catch (err) {
      setError(`No se pudieron cargar los ${title.toLowerCase()}`);
      alert.apiError(err, `No se pudieron cargar los ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage || isLoadingUser) return;
    fetchUsers(currentPage, search);
  }, [canManage, isLoadingUser, currentPage, search, roleId, user?.organizationId]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchUsers(1, "");
      navigate(listPath, { replace: true });
    }
  }, [location.state?.refresh]);

  useEffect(() => {
    if (!showModal) return;

    const loadOptions = async () => {
      try {
        let campaignList = [];
        if (user?.roleId === ROLE_CAMPAIGN_ADMIN && user?.organizationId) {
          const response = await getCampaignsByOrganization(user.organizationId);
          campaignList = Array.isArray(response) ? response : response?.data || [];
        } else {
          campaignList = await getAllCampaigns();
        }
        setCampaigns(campaignList);

        if (isWitness) {
          const boothResponse = await getVotingBooths();
          setBooths(
            Array.isArray(boothResponse)
              ? boothResponse
              : boothResponse?.data || [],
          );
        }
      } catch {
        setCampaigns([]);
        setBooths([]);
      }
    };

    loadOptions();
  }, [showModal, user, isWitness]);

  if (isLoadingUser) {
    return <div className="app-card p-6 text-gray-600">Cargando...</div>;
  }

  if (!canManage) {
    return <Navigate to="/forbidden" replace />;
  }

  const getUserCampaignId = (item) => {
    const campaign = getPrimaryCampaign(item);
    return campaign?.id != null ? String(campaign.id) : "";
  };

  const getUserCampaignName = (item) => {
    const campaign = getPrimaryCampaign(item);
    return campaign?.name || "Sin campaña";
  };

  const handleEdit = (item) => {
    const assignment = item.tableAssignment;
    setEditingUser(item);
    setFormData({
      email: item.email || "",
      password: "",
      campaignId: getUserCampaignId(item),
      votingBoothId:
        assignment?.votingBoothId != null
          ? String(assignment.votingBoothId)
          : "",
      tableNumber:
        assignment?.tableNumber != null ? String(assignment.tableNumber) : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    const result = await alert.confirm(
      `¿Eliminar este ${entityLabel}?`,
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteUser(userId);
      alert.success(`${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} eliminado`);
      fetchUsers(currentPage, search);
    } catch (err) {
      alert.apiError(err, `Error al eliminar ${entityLabel}`);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingUser) return;

    if (!formData.email) {
      alert.warning("El email es requerido");
      return;
    }
    if (!formData.campaignId) {
      alert.warning("Debes asignar exactamente una campaña");
      return;
    }

    if (isWitness) {
      if (!formData.votingBoothId || !formData.tableNumber) {
        alert.warning("El testigo debe tener puesto y mesa asignados");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        campaignIds: [Number(formData.campaignId)],
      };

      if (formData.password.trim()) {
        if (formData.password.trim().length < 8) {
          alert.warning("La contraseña debe tener al menos 8 caracteres");
          setSaving(false);
          return;
        }
        payload.password = formData.password.trim();
      }

      // Cambio de mesa: solo Superadmin / Admin de campaña (esta vista ya está restringida)
      if (isWitness) {
        payload.votingBoothId = Number(formData.votingBoothId);
        payload.tableNumber = Number(formData.tableNumber);
      }

      await updateUser(editingUser.id, payload);

      alert.success("Usuario actualizado");
      setShowModal(false);
      setEditingUser(null);
      fetchUsers(currentPage, search);
    } catch (err) {
      alert.apiError(err, "Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión de {title.toLowerCase()}
          </p>
        </div>
        <AddButton
          label={`Agregar ${entityLabel}`}
          onClick={() => navigate(createPath)}
          disabled={!can("users:manage") && !can("users:create")}
        />
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="app-input w-full sm:w-96 shadow-soft"
        />
      </div>

      {loading ? (
        <div className="app-card p-8 text-center text-gray-600">Cargando...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="app-card p-8 text-center text-gray-500">
          No hay {title.toLowerCase()} registrados
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F9FC] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Campaña
                  </th>
                  {isWitness && (
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Mesa asignada
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getUserCampaignName(item)}
                    </td>
                    {isWitness && (
                      <td className="px-6 py-4 text-gray-700">
                        {formatTableAssignment(item.tableAssignment)}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-card max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar {entityLabel}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="app-input"
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaña
                </label>
                <select
                  value={formData.campaignId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      campaignId: e.target.value,
                      votingBoothId: "",
                      tableNumber: "",
                    }))
                  }
                  className="app-input"
                  required
                >
                  <option value="">Selecciona una campaña</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              {isWitness && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puesto de votación
                    </label>
                    <select
                      value={formData.votingBoothId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          votingBoothId: e.target.value,
                          tableNumber: "",
                        }))
                      }
                      className="app-input"
                      required
                    >
                      <option value="">Selecciona un puesto</option>
                      {booths.map((booth) => (
                        <option key={booth.id} value={booth.id}>
                          {booth.name}
                          {booth.mesas ? ` (${booth.mesas} mesas)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesa
                    </label>
                    <select
                      value={formData.tableNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tableNumber: e.target.value,
                        }))
                      }
                      className="app-input"
                      required
                    >
                      <option value="">Selecciona una mesa</option>
                      {tableOptions.map((table) => (
                        <option key={table} value={table}>
                          Mesa {table}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="app-btn-primary flex-1"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="app-btn-ghost flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
