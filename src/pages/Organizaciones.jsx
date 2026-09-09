import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getOrganizationsWithPagination,
  deleteOrganization,
  updateOrganization,
} from "../api/organizations";
import { usePermission } from "../hooks/usePermission";
import { useAlert } from "../hooks/useAlert";
import Pagination from "../components/Pagination";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function Organizaciones() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Cargar organizaciones con paginación
  const fetchOrganizations = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getOrganizationsWithPagination(
        page,
        itemsPerPage,
        searchTerm,
      );
      setOrganizations(Array.isArray(data.data) ? data.data : []);
      setCurrentPage(data.page);
      setTotalPages(data.pages);
      setTotalItems(data.total);
    } catch (err) {
      setError("No se pudieron cargar las organizaciones");
      alert.apiError(err, "No se pudieron cargar las organizaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations(currentPage, search);
  }, [currentPage, search]);

  // Refrescar cuando se llega desde la creación
  useEffect(() => {
    if (location.state?.refresh) {
      setCurrentPage(1);
      setSearch("");
      fetchOrganizations(1, "");
    }
  }, [location]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1); // Reset a página 1 cuando cambia la búsqueda
  };

  const handleEdit = (organization) => {
    setEditingOrganization(organization);
    setFormData({
      name: organization.name,
      description: organization.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (organizationId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar esta organización?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteOrganization(organizationId);
      alert.success("Organización eliminada exitosamente");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar organización");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrganization) return;

    try {
      await updateOrganization(editingOrganization.id, formData);
      setShowModal(false);
      setEditingOrganization(null);
      alert.success("Organización actualizada exitosamente");
      fetchOrganizations(currentPage, search);
    } catch (err) {
      alert.apiError(err, "Error al actualizar organización");
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

  // No necesitamos filtrar localmente ya que el backend maneja la búsqueda
  const filteredOrganizations = organizations;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Organizaciones</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión de organizaciones registradas en la plataforma
          </p>
        </div>

        <button
          onClick={() => navigate("/app/crear-organizaciones")}
          disabled={
            !can("organizations:manage") && !can("organizations:create")
          }
          title={
            !can("organizations:manage") && !can("organizations:create")
              ? "No tienes permiso para crear organizaciones"
              : ""
          }
          className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-md transition ${
            can("organizations:manage") || can("organizations:create")
              ? "bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          Agregar organización
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {/* Modal de edición */}
      {showModal && editingOrganization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Editar Organización
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
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
          Cargando organizaciones...
        </div>
      )}

      {!loading && filteredOrganizations.length === 0 && (
        <div className="bg-white p-6 rounded-xl text-gray-500">
          No se encontraron resultados
        </div>
      )}

      {/* ===== TABLA DESKTOP ===== */}
      {!loading && filteredOrganizations.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {["Nombre", "Descripción", "Fecha Creación", "Acciones"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wide text-left"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredOrganizations.map((organization) => (
                  <tr
                    key={organization.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {organization.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {organization.description || "No registrado"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(organization.createdAt).toLocaleDateString(
                        "es-ES",
                      )}
                    </td>

                    <td className="px-6 py-4 flex gap-4">
                      {(can("organizations:manage") ||
                        can("organizations:update")) && (
                        <button
                          onClick={() => handleEdit(organization)}
                          className="text-gray-400 hover:text-orange-500 transition"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {(can("organizations:manage") ||
                        can("organizations:delete")) && (
                        <button
                          onClick={() => handleDelete(organization.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                      {!can("organizations:manage") &&
                        !can("organizations:update") &&
                        !can("organizations:delete") && (
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

          {/* Pagination - Reutilizando componente */}
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
      {!loading && (
        <div className="md:hidden space-y-4">
          {filteredOrganizations.map((organization) => (
            <div
              key={organization.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <div className="font-bold text-gray-900 text-lg mb-2">
                {organization.name}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {organization.description && (
                  <div>
                    <span className="font-semibold text-gray-900">
                      Descripción:
                    </span>{" "}
                    {organization.description}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-900">
                    Creada el:
                  </span>{" "}
                  {new Date(organization.createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t">
                {can("organizations:update") && (
                  <button
                    onClick={() => handleEdit(organization)}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 flex-1 justify-center py-2 rounded-lg hover:bg-orange-50"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {can("organizations:delete") && (
                  <button
                    onClick={() => handleDelete(organization.id)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 flex-1 justify-center py-2 rounded-lg hover:bg-red-50"
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
