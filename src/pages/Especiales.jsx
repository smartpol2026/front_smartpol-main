import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getUsersByRoleWithPagination,
  deleteUser,
  updateUser,
} from "../api/users";
import { usePermission } from "../hooks/usePermission";
import { useAlert } from "../hooks/useAlert";
import Pagination from "../components/Pagination";
import AddButton from "../components/AddButton";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Especiales() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();
  const [especiales, setEspeciales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingEspecial, setEditingEspecial] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Cargar usuarios especiales (roleId: 6) con paginación
  const fetchEspeciales = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsersByRoleWithPagination(
        6,
        page,
        itemsPerPage,
        searchTerm,
      );
      setEspeciales(Array.isArray(data.data) ? data.data : []);
      setCurrentPage(data.page);
      setTotalPages(data.pages);
      setTotalItems(data.total);
    } catch (err) {
      setError("No se pudieron cargar los usuarios especiales");
      alert.apiError(err, "No se pudieron cargar los usuarios especiales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEspeciales(currentPage, search);
  }, [currentPage, search]);

  // Refrescar cuando se llega desde la creación
  useEffect(() => {
    if (location.state?.refresh) {
      setCurrentPage(1);
      setSearch("");
      fetchEspeciales(1, "");
    }
  }, [location]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (especial) => {
    setEditingEspecial(especial);
    setFormData({
      email: especial.email,
      password: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (especialId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar este usuario especial?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteUser(especialId);
      alert.success("Usuario especial eliminado exitosamente");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar usuario especial");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingEspecial) return;

    if (!formData.email) {
      alert.warning("El email es requerido", "Campo incompleto");
      return;
    }

    try {
      const updateData = { email: formData.email };

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

      await updateUser(editingEspecial.id, updateData);
      setShowModal(false);
      setEditingEspecial(null);
      alert.success("Usuario especial actualizado exitosamente");
      fetchEspeciales(currentPage, search);
    } catch (err) {
      alert.apiError(err, "Error al actualizar usuario especial");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Usuarios Especiales</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestiona los usuarios especiales del sistema
          </p>
        </div>

        <AddButton
          label="Agregar Usuario Especial"
          onClick={() => navigate("/app/crear-especiales")}
          disabled={!can("users:manage") && !can("users:create")}
          title={
            !can("users:manage") && !can("users:create")
              ? "No tienes permiso para crear usuarios especiales"
              : ""
          }
        />
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {/* Tabla de usuarios especiales */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : especiales.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No hay usuarios especiales registrados
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {especiales.map((especial) => (
                <tr key={especial.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {especial.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(especial.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {(can("users:manage") || can("users:update")) && (
                      <button
                        onClick={() => handleEdit(especial)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                    )}
                    {(can("users:manage") || can("users:delete")) && (
                      <button
                        onClick={() => handleDelete(especial.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {!loading && especiales.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Usuario Especial
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Dejar en blanco para no cambiar"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
