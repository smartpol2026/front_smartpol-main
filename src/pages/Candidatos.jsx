import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getCandidatesWithPagination,
  deleteCandidate,
  updateCandidate,
} from "../api/candidates";
import { getOrganizations } from "../api/organizations";
import { getCampaignsByOrganization } from "../api/campaigns";
import { updateUser } from "../api/users";
import { usePermission } from "../hooks/usePermission";
import { useAlert } from "../hooks/useAlert";
import Pagination from "../components/Pagination";
import AddButton from "../components/AddButton";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Candidatos() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();

  const [currentUser, setCurrentUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para organizaciones y campañas
  const [organizations, setOrganizations] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    party: "",
    number: "",
    organizationId: "",
    campaignId: "",
    password: "",
  });

  // Guardar organizationId original para comparar si cambió
  const [originalOrganizationId, setOriginalOrganizationId] = useState("");

  // Cargar usuario del localStorage
  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    const user_email = localStorage.getItem("user_email");
    const organizationId = localStorage.getItem("organizationId");
    const roleId = localStorage.getItem("roleId");

    if (user_id) {
      const user = {
        id: parseInt(user_id),
        email: user_email,
        organizationId: parseInt(organizationId),
        roleId: parseInt(roleId),
      };

      setCurrentUser(user);
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Cargar organizaciones
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("Error loading organizations:", err);
      }
    };

    if (isInitialized) {
      fetchOrganizations();
    }
  }, [isInitialized]);

  // Cargar campañas cuando cambia la organización seleccionada
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!formData.organizationId) {
        setFilteredCampaigns([]);
        return;
      }

      setLoadingCampaigns(true);
      try {
        const data = await getCampaignsByOrganization(formData.organizationId);
        setFilteredCampaigns(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("Error loading campaigns:", err);
        setFilteredCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [formData.organizationId]);

  // Cargar candidatos con paginación
  const fetchCandidates = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getCandidatesWithPagination(
        page,
        itemsPerPage,
        searchTerm,
      );

      let candidatesList = Array.isArray(data.data) ? data.data : [];

      // Filtrar candidatos si es admin de organización
      if (currentUser?.roleId === 2 && currentUser?.organizationId) {
        candidatesList = candidatesList.filter(
          (candidate) =>
            candidate.user?.organizationId === currentUser.organizationId,
        );
      }

      setCandidates(candidatesList);
      setCurrentPage(data.page || page);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || candidatesList.length);
    } catch (err) {
      setError("No se pudieron cargar los candidatos");
      alert.apiError(err, "No se pudieron cargar los candidatos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && currentUser) {
      fetchCandidates(currentPage, search);
    }
  }, [currentPage, search, isInitialized, currentUser?.id]);

  // Refrescar cuando se llega desde la creación
  useEffect(() => {
    if (location.state?.refresh) {
      setCurrentPage(1);
      setSearch("");
      fetchCandidates(1, "");
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, navigate, location.pathname]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    const orgId =
      candidate.user?.organizationId || candidate.organizationId || "";
    setOriginalOrganizationId(orgId);
    setFormData({
      name: candidate.name || "",
      party: candidate.party || "",
      number: candidate.number || "",
      organizationId: orgId,
      campaignId: candidate.campaignId || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (candidateId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar este candidato?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteCandidate(candidateId);
      alert.success("Candidato eliminado exitosamente");
      setTimeout(() => {
        fetchCandidates(currentPage, search);
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar candidato");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingCandidate) return;

    setSaving(true);
    try {
      // 1. Preparar datos para actualizar el candidato
      const candidateUpdateData = {
        name: formData.name,
        party: formData.party || null,
        number: formData.number ? parseInt(formData.number) : null,
      };

      // Agregar campaignId si se proporciona
      if (formData.campaignId) {
        candidateUpdateData.campaignId = parseInt(formData.campaignId);
      }

      // 2. Si cambió la organización, actualizar el usuario primero
      const organizationChanged =
        formData.organizationId &&
        String(formData.organizationId) !== String(originalOrganizationId);

      if (organizationChanged && editingCandidate.userId) {
        try {
          await updateUser(editingCandidate.userId, {
            organizationId: parseInt(formData.organizationId),
          });
        } catch (userErr) {
          console.error("Error updating user organization:", userErr);
          alert.apiError(
            userErr,
            "Error al actualizar la organización del usuario",
          );
          setSaving(false);
          return;
        }
      }

      // 3. Actualizar el candidato
      await updateCandidate(editingCandidate.id, candidateUpdateData);

      // 4. Si se proporciona contraseña, actualizar el usuario
      if (formData.password && formData.password.trim()) {
        if (formData.password.length < 6) {
          alert.warning(
            "La contraseña debe tener al menos 6 caracteres",
            "Contraseña débil",
          );
          setSaving(false);
          return;
        }

        if (editingCandidate.userId) {
          try {
            await updateUser(editingCandidate.userId, {
              password: formData.password,
            });
          } catch (passErr) {
            console.error("Error updating password:", passErr);
            // No bloquear si falla la contraseña, el candidato ya se actualizó
            alert.warning(
              "El candidato se actualizó pero hubo un error al cambiar la contraseña",
            );
          }
        }
      }

      setShowModal(false);
      setEditingCandidate(null);
      setOriginalOrganizationId("");
      alert.success("Candidato actualizado exitosamente");
      fetchCandidates(currentPage, search);
    } catch (err) {
      console.error("Error completo:", err);
      alert.apiError(err, "Error al actualizar candidato");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // Si cambia la organización, resetear la campaña
      if (name === "organizationId") {
        return {
          ...prev,
          [name]: value,
          campaignId: "",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Función para obtener nombre de organización
  const getOrganizationName = (candidate) => {
    if (candidate.user?.organization?.name) {
      return candidate.user.organization.name;
    }
    const orgId = candidate.user?.organizationId || candidate.organizationId;
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || "-";
  };

  // Función para obtener nombre de campaña
  const getCampaignName = (candidate) => {
    return candidate.campaign?.name || "-";
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Candidatos</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión de candidatos registrados en la plataforma
          </p>
        </div>

        <AddButton
          label="Agregar candidato"
          onClick={() => navigate("/app/crear-candidatos")}
          disabled={!can("candidates:manage") && !can("candidates:create")}
          title={
            !can("candidates:manage") && !can("candidates:create")
              ? "No tienes permiso para crear candidatos"
              : ""
          }
        />
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por nombre, partido o número..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {showModal && editingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Editar Candidato
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partido Político
                </label>
                <input
                  type="text"
                  name="party"
                  value={formData.party}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Candidato
                </label>
                <input
                  type="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={saving}
                />
              </div>

              {/* Campo de Organización */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organización
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={currentUser?.roleId === 2 || saving}
                >
                  <option value="">Seleccionar organización</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {currentUser?.roleId === 2 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Solo puedes gestionar candidatos de tu organización
                  </p>
                )}
                {currentUser?.roleId !== 2 &&
                  formData.organizationId &&
                  String(formData.organizationId) !==
                    String(originalOrganizationId) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Al cambiar la organización, se actualizará el usuario
                      asociado
                    </p>
                  )}
              </div>

              {/* Campo de Campaña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaña
                </label>
                <select
                  name="campaignId"
                  value={formData.campaignId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={
                    !formData.organizationId || loadingCampaigns || saving
                  }
                >
                  <option value="">
                    {loadingCampaigns
                      ? "Cargando campañas..."
                      : !formData.organizationId
                        ? "Selecciona una organización primero"
                        : "Seleccionar campaña"}
                  </option>
                  {filteredCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
                {!formData.organizationId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona una organización para ver las campañas
                    disponibles
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleInputChange}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres si se proporciona
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          Cargando candidatos...
        </div>
      )}

      {!loading && candidates.length === 0 && (
        <div className="bg-white p-6 rounded-xl text-gray-500">
          {search
            ? "No se encontraron resultados"
            : "No hay candidatos registrados"}
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {[
                    "Nombre",
                    "Partido",
                    "Número",
                    "Organización",
                    "Campaña",
                    "Acciones",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wide text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {candidate.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {candidate.party || "No registrado"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                      {candidate.number || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getOrganizationName(candidate)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getCampaignName(candidate)}
                    </td>

                    <td className="px-6 py-4 flex gap-4">
                      {(can("candidates:manage") ||
                        can("candidates:update")) && (
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="text-gray-400 hover:text-orange-500 transition"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {(can("candidates:manage") ||
                        can("candidates:delete")) && (
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                      {!can("candidates:manage") &&
                        !can("candidates:update") &&
                        !can("candidates:delete") && (
                          <span className="text-gray-300 text-sm">
                            Sin acceso
                          </span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <div className="md:hidden space-y-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <div className="font-bold text-gray-900 text-lg mb-2">
                {candidate.name}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {candidate.party && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      Partido:
                    </span>{" "}
                    {candidate.party}
                  </div>
                )}
                {candidate.number && (
                  <div>
                    <span className="font-semibold text-gray-900">Número:</span>{" "}
                    {candidate.number}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-900">
                    Organización:
                  </span>{" "}
                  {getOrganizationName(candidate)}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Campaña:</span>{" "}
                  {getCampaignName(candidate)}
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t">
                {(can("candidates:manage") || can("candidates:update")) && (
                  <button
                    onClick={() => handleEdit(candidate)}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 flex-1 justify-center py-2 rounded-lg hover:bg-orange-50 transition"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {(can("candidates:manage") || can("candidates:delete")) && (
                  <button
                    onClick={() => handleDelete(candidate.id)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 flex-1 justify-center py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
