import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getLeadersWithPagination,
  getLeadersByCandidateWithPagination,
  updateLeader,
  deleteLeader,
} from "../api/leaders";
import { getCandidateByUserId } from "../api/candidates";
import { getAllCampaigns } from "../api/campaigns";
import { usePermission } from "../hooks/usePermission";
import { useAlert } from "../hooks/useAlert";
import Pagination from "../components/Pagination";
import AddButton from "../components/AddButton";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function Lideres() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();

  const [currentUser, setCurrentUser] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingLeader, setEditingLeader] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [candidateId, setCandidateId] = useState(null);
  const [loadingCandidateId, setLoadingCandidateId] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    municipality: "",
    phone: "",
    campaignId: "",
  });

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

      if (user.roleId === 3) {
        setLoadingCandidateId(true);
        loadCandidateData(user.id);
      } else {
        setLoadingCandidateId(false);
      }
    }

    setIsInitialized(true);
  }, []);

  const loadCandidateData = async (userId) => {
    try {
      const candidate = await getCandidateByUserId(userId);
      if (candidate?.id) {
        setCandidateId(candidate.id);
      } else {
        setError("No se pudo obtener tu información de candidato");
      }
    } catch (err) {
      setError("Error al cargar datos del candidato");
    } finally {
      setLoadingCandidateId(false);
    }
  };

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getAllCampaigns();
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (err) {
        // Error silencioso
      }
    };

    loadCampaigns();
  }, []);

  const fetchLeaders = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      let data;

      if (currentUser?.roleId === 3) {
        if (!candidateId || isNaN(candidateId)) {
          throw new Error("No se pudo cargar tu candidateId");
        }
        data = await getLeadersByCandidateWithPagination(
          candidateId,
          page,
          itemsPerPage,
          searchTerm,
        );
      } else {
        data = await getLeadersWithPagination(page, itemsPerPage, searchTerm);
      }

      let leadersList = Array.isArray(data.data) ? data.data : [];

      if (currentUser?.roleId === 2 && currentUser?.organizationId) {
        leadersList = leadersList.filter(
          (leader) =>
            leader.user?.organizationId === currentUser.organizationId,
        );
      }

      setLeaders(leadersList);
      setCurrentPage(data.page || page);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || leadersList.length);
    } catch (err) {
      const errorMsg = err.message || "No se pudieron cargar los líderes";
      setError(errorMsg);
      alert.apiError(err, "Error al cargar líderes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    if (currentUser?.roleId === 3 && loadingCandidateId) {
      setLoading(true);
      return;
    }

    if (currentUser?.roleId === 3 && (!candidateId || isNaN(candidateId))) {
      setLoading(false);
      setError("No se pudo cargar tu información de candidato");
      return;
    }

    fetchLeaders(currentPage, search);
  }, [
    currentPage,
    search,
    candidateId,
    loadingCandidateId,
    currentUser?.roleId,
    isInitialized,
  ]);

  useEffect(() => {
    if (location.state?.refresh && isInitialized && currentUser) {
      if (currentUser.roleId === 3) {
        if (!loadingCandidateId && candidateId && !isNaN(candidateId)) {
          setCurrentPage(1);
          setSearch("");
          fetchLeaders(1, "");
        }
      } else {
        setCurrentPage(1);
        setSearch("");
        fetchLeaders(1, "");
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, isInitialized, currentUser?.id]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (leader) => {
    setEditingLeader(leader);
    setFormData({
      name: leader.name,
      document: leader.document,
      municipality: leader.municipality,
      phone: leader.phone,
      campaignId: leader.campaignId || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (leaderId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar este líder?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteLeader(leaderId);
      alert.success("Líder eliminado exitosamente");
      setTimeout(() => {
        fetchLeaders(currentPage, search);
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar líder");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingLeader) return;

    try {
      const updateData = {
        name: formData.name,
        document: formData.document,
        municipality: formData.municipality,
        phone: formData.phone,
        ...(formData.campaignId && {
          campaignId: parseInt(formData.campaignId),
        }),
      };

      // Solo agregar contraseña si se proporciona una nueva
      if (formData.password && formData.password.trim()) {
        if (formData.password.length < 6) {
          alert.warning(
            "La contraseña debe tener al menos 6 caracteres",
            "Contraseña débil",
          );
          return;
        }
        updateData.password = formData.password;
      }

      await updateLeader(editingLeader.id, updateData);
      setShowModal(false);
      setEditingLeader(null);
      alert.success("Líder actualizado exitosamente");
      fetchLeaders(currentPage, search);
    } catch (err) {
      alert.apiError(err, "Error al actualizar líder");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getCampaignName = (campaignId) => {
    if (!campaignId) return "Sin asignar";
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign ? campaign.name : "Campaña desconocida";
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Líderes</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            {currentUser?.roleId === 3
              ? "Tus líderes comunitarios asignados"
              : "Gestión de líderes comunitarios registrados en tu organización"}
          </p>
        </div>

        {currentUser?.roleId !== 3 && (
          <AddButton
            label="Agregar líder"
            onClick={() => navigate("/app/crear-lideres")}
            disabled={!can("leaders:manage") && !can("leaders:create")}
            title={
              !can("leaders:manage") && !can("leaders:create")
                ? "No tienes permiso para crear líderes"
                : ""
            }
          />
        )}
      </div>

      {/* Buscador */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por nombre, documento o municipio..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {/* Modal de edición */}
      {showModal && editingLeader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Editar Líder</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento
                </label>
                <input
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipio
                </label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaña
                </label>
                <select
                  name="campaignId"
                  value={formData.campaignId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
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
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres si se proporciona
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estados */}
      {loading && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          ⏳ Cargando líderes...
        </div>
      )}

      {error && (
        <div className="bg-white p-6 rounded-xl text-red-600">❌ {error}</div>
      )}

      {!loading && !error && leaders.length === 0 && (
        <div className="bg-white p-6 rounded-xl text-gray-500">
          {search
            ? "No se encontraron resultados"
            : "No hay líderes registrados"}
        </div>
      )}

      {/* ===== TABLA DESKTOP ===== */}
      {!loading && !error && leaders.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {[
                    "Nombre",
                    "Documento",
                    "Municipio",
                    "Teléfono",
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
                {leaders.map((leader) => (
                  <tr
                    key={leader.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {leader.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {leader.document || "No registrado"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {leader.municipality || "No registrado"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {leader.phone || "No registrado"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getCampaignName(leader.campaignId)}
                      </span>
                    </td>

                    <td className="px-6 py-4 flex gap-4">
                      {(can("leaders:manage") || can("leaders:update")) && (
                        <button
                          onClick={() => handleEdit(leader)}
                          className="text-gray-400 hover:text-orange-500 transition"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {(can("leaders:manage") || can("leaders:delete")) && (
                        <button
                          onClick={() => handleDelete(leader.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                      {!can("leaders:manage") &&
                        !can("leaders:update") &&
                        !can("leaders:delete") && (
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

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* ===== MOBILE ===== */}
      {!loading && !error && leaders.length > 0 && (
        <div className="md:hidden space-y-4">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <div className="font-bold text-gray-900 text-lg mb-2">
                {leader.name}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {leader.document && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      Documento:
                    </span>{" "}
                    {leader.document}
                  </div>
                )}
                {leader.municipality && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      Municipio:
                    </span>{" "}
                    {leader.municipality}
                  </div>
                )}
                {leader.phone && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      Teléfono:
                    </span>{" "}
                    {leader.phone}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-900">Campaña:</span>{" "}
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {getCampaignName(leader.campaignId)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t">
                {can("leaders:update") && (
                  <button
                    onClick={() => handleEdit(leader)}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 flex-1 justify-center py-2 rounded-lg hover:bg-orange-50 transition"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {can("leaders:delete") && (
                  <button
                    onClick={() => handleDelete(leader.id)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 flex-1 justify-center py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
