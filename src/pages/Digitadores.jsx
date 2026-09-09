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

export default function Digitadores() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();

  const [currentUser, setCurrentUser] = useState(null);
  const [digitadores, setDigitadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingDigitador, setEditingDigitador] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ✅ Cargar usuario del localStorage
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
    }

    setIsInitialized(true);
  }, []);

  // ✅ Cargar digitadores con paginación
  const fetchDigitadores = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsersByRoleWithPagination(
        5,
        page,
        itemsPerPage,
        searchTerm,
      );

      // ✅ FILTRAR en FRONTEND por organizationId solo si es admin de organización
      let digitadorList = Array.isArray(data.data) ? data.data : [];

      if (currentUser?.roleId === 2 && currentUser?.organizationId) {
        digitadorList = digitadorList.filter(
          (digitador) =>
            digitador.organizationId === currentUser.organizationId,
        );
      }

      setDigitadores(digitadorList);
      setCurrentPage(data.page || page);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || digitadorList.length);
    } catch (err) {
      setError("No se pudieron cargar los digitadores");
      alert.apiError(err, "No se pudieron cargar los digitadores");
    } finally {
      setLoading(false);
    }
  };

  // ✅ EFECTO PRINCIPAL: Cargar digitadores cuando está todo listo
  useEffect(() => {
    if (!isInitialized) return;
    fetchDigitadores(currentPage, search);
  }, [currentPage, search, currentUser?.organizationId, isInitialized]);

  // ✅ Refrescar cuando se llega desde la creación
  useEffect(() => {
    if (location.state?.refresh && isInitialized && currentUser) {
      setCurrentPage(1);
      setSearch("");
      fetchDigitadores(1, "");
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, isInitialized, currentUser?.id]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (digitador) => {
    setEditingDigitador(digitador);
    setFormData({
      email: digitador.email,
      password: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (digitadorId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar este digitador?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteUser(digitadorId);
      alert.success("Digitador eliminado exitosamente");
      setTimeout(() => {
        fetchDigitadores(currentPage, search);
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar digitador");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingDigitador) return;

    // Validaciones básicas
    if (!formData.email) {
      alert.warning("El email es requerido", "Campo incompleto");
      return;
    }

    try {
      const updateData = { email: formData.email };

      // Solo actualizar contraseña si se proporciona una nueva
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

      await updateUser(editingDigitador.id, updateData);
      setShowModal(false);
      setEditingDigitador(null);
      alert.success("Digitador actualizado exitosamente");
      fetchDigitadores(currentPage, search);
    } catch (err) {
      alert.apiError(err, "Error al actualizar digitador");
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

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Digitadores</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión de digitadores registrados en tu organización
          </p>
        </div>

        <AddButton
          label="Agregar digitador"
          onClick={() => navigate("/app/crear-digitadores")}
          disabled={!can("users:manage") && !can("users:create")}
          title={
            !can("users:manage") && !can("users:create")
              ? "No tienes permiso para crear digitadores"
              : ""
          }
        />
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando digitadores...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : digitadores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">
            {search
              ? "No se encontraron digitadores"
              : "No hay digitadores registrados"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {digitadores.map((digitador) => (
                  <tr
                    key={digitador.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {digitador.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(digitador)}
                        disabled={!can("users:manage") && !can("users:update")}
                        title={
                          !can("users:manage") && !can("users:update")
                            ? "No tienes permiso para editar"
                            : ""
                        }
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition mr-2 ${
                          can("users:manage") || can("users:update")
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(digitador.id)}
                        disabled={!can("users:manage") && !can("users:delete")}
                        title={
                          !can("users:manage") && !can("users:delete")
                            ? "No tienes permiso para eliminar"
                            : ""
                        }
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                          can("users:manage") || can("users:delete")
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <TrashIcon className="w-4 h-4" />
                        Eliminar
                      </button>
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

      {/* Modal de edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Digitador
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDigitador(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres si se proporciona
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDigitador(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
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
