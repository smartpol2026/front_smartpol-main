import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getCampaignsWithPagination,
  deleteCampaign,
  updateCampaign,
} from "../api/campaigns";
import { usePermission } from "../hooks/usePermission";
import { useAlert } from "../hooks/useAlert";
import Pagination from "../components/Pagination";
import AddButton from "../components/AddButton";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Campanas() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();

  const [currentUser, setCurrentUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: true,
  });

  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    const user_email = localStorage.getItem("user_email");
    const organizationId = localStorage.getItem("organizationId");
    const roleId = localStorage.getItem("roleId");
    const organizationName = localStorage.getItem("organizationName");

    if (user_id) {
      const user = {
        id: parseInt(user_id),
        email: user_email,
        organizationId: parseInt(organizationId),
        roleId: parseInt(roleId),
        organizationName,
      };

      setCurrentUser(user);
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
    }
  }, []);

  const fetchCampaigns = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getCampaignsWithPagination(
        page,
        itemsPerPage,
        searchTerm,
      );

      if (!data || !data.data) {
        setCampaigns([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }

      const campaignsData = Array.isArray(data.data) ? data.data : [];

      // No filtrar el frontend si el usuario es super admin (roleId = 1)
      // El backend ya maneja el filtrado apropiadamente
      let filteredData = campaignsData;

      setCampaigns(filteredData);
      setCurrentPage(data.page || page);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("No se pudieron cargar las campañas");
      setCampaigns([]);
      alert.apiError(err, "No se pudieron cargar las campañas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && currentUser) {
      fetchCampaigns(1, "");
    }
  }, [isInitialized, currentUser?.id]);

  useEffect(() => {
    if (isInitialized && currentUser && (currentPage > 1 || search)) {
      fetchCampaigns(currentPage, search);
    }
  }, [currentPage, search, isInitialized, currentUser?.id]);

  useEffect(() => {
    if (location.state?.refresh) {
      setCurrentPage(1);
      setSearch("");
      fetchCampaigns(1, "");
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, navigate, location.pathname]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      startDate: campaign.startDate ? campaign.startDate.split("T")[0] : "",
      endDate: campaign.endDate ? campaign.endDate.split("T")[0] : "",
      status: campaign.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (campaignId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar esta campaña?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteCampaign(campaignId);
      alert.success("Campaña eliminada exitosamente");
      fetchCampaigns(currentPage, search);
    } catch (err) {
      console.error("Error deleting campaign:", err);
      alert.apiError(err, "Error al eliminar campaña");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert.error("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    try {
      await updateCampaign(editingCampaign.id, formData);
      setShowModal(false);
      setEditingCampaign(null);
      alert.success("Campaña actualizada exitosamente");
      fetchCampaigns(currentPage, search);
    } catch (err) {
      console.error("Error updating campaign:", err);
      alert.apiError(err, "Error al actualizar campaña");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const filteredCampaigns = campaigns || [];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Campañas</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión de campañas políticas registradas en la plataforma
            {currentUser?.organizationId && (
              <span className="block text-xs mt-1">
                Organización: {currentUser?.organizationName} (ID:{" "}
                {currentUser?.organizationId})
              </span>
            )}
          </p>
        </div>

        <AddButton
          label="Agregar campaña"
          onClick={() => navigate("/app/crear-campanas")}
          disabled={!can("campaigns:manage") && !can("campaigns:create")}
          title={
            !can("campaigns:manage") && !can("campaigns:create")
              ? "No tienes permiso para crear campañas"
              : ""
          }
        />
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {showModal && editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Editar Campaña
              </h3>
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
                  Nombre *
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
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Finalización *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center">
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

      {loading && (
        <div className="bg-white p-6 rounded-xl shadow-sm text-gray-500 text-center">
          Cargando campañas...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {!loading && filteredCampaigns.length === 0 && !error && (
        <div className="bg-white p-6 rounded-xl text-gray-500 text-center">
          No se encontraron campañas
        </div>
      )}

      {!loading && filteredCampaigns.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {[
                    "Nombre",
                    "Organización",
                    "Inicio",
                    "Fin",
                    "Estado",
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
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {campaign.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {campaign.organization?.name || "No asignada"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {campaign.startDate
                        ? new Date(campaign.startDate).toLocaleDateString(
                            "es-ES",
                          )
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {campaign.endDate
                        ? new Date(campaign.endDate).toLocaleDateString("es-ES")
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          campaign.status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {campaign.status ? "Activa" : "Inactiva"}
                      </span>
                    </td>

                    <td className="px-6 py-4 flex gap-4">
                      {(can("campaigns:manage") || can("campaigns:update")) && (
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="text-gray-400 hover:text-orange-500 transition"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {(can("campaigns:manage") || can("campaigns:delete")) && (
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                      {!can("campaigns:manage") &&
                        !can("campaigns:update") &&
                        !can("campaigns:delete") && (
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

      {!loading && filteredCampaigns.length > 0 && (
        <div className="md:hidden space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <div className="font-bold text-gray-900 text-lg mb-2">
                {campaign.name}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-semibold text-gray-900">
                    Organización:
                  </span>{" "}
                  {campaign.organization?.name || "No asignada"}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Inicio:</span>{" "}
                  {campaign.startDate
                    ? new Date(campaign.startDate).toLocaleDateString("es-ES")
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Fin:</span>{" "}
                  {campaign.endDate
                    ? new Date(campaign.endDate).toLocaleDateString("es-ES")
                    : "-"}
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      campaign.status
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {campaign.status ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t">
                {can("campaigns:update") && (
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 flex-1 justify-center py-2 rounded-lg hover:bg-orange-50 transition"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {can("campaigns:delete") && (
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 flex-1 justify-center py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </>
  );
}
