import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getUsersByRoleWithPagination,
  deleteUser,
  updateUser,
} from "../api/users";
import { getOrganizations } from "../api/organizations";
import { usePermission } from "../hooks/usePermission";
import { useUser } from "../context/UserContext";
import { useAlert } from "../hooks/useAlert";
import Pagination from "../components/Pagination";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function Administradores() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();
  const { user } = useUser();

  const [currentUser, setCurrentUser] = useState(null);
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para organizaciones
  const [organizations, setOrganizations] = useState([]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    organizationId: "",
  });

  // ✅ Validar que solo el superadmin (roleId=1) pueda acceder
  useEffect(() => {
    if (user && user.roleId !== 1) {
      navigate("/app/forbidden");
    }
  }, [user, navigate]);

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

  // ✅ Cargar organizaciones
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

  // ✅ Cargar administradores con paginación
  const fetchAdministradores = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsersByRoleWithPagination(
        2,
        page,
        itemsPerPage,
        searchTerm,
      );

      // ✅ FILTRAR en FRONTEND por organizationId solo si es admin de organización
      let adminList = Array.isArray(data.data) ? data.data : [];

      if (currentUser?.roleId === 2 && currentUser?.organizationId) {
        adminList = adminList.filter(
          (admin) => admin.organizationId === currentUser.organizationId,
        );
      }

      setAdministradores(adminList);
      setCurrentPage(data.page || page);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || adminList.length);
    } catch (err) {
      setError("No se pudieron cargar los administradores");
      alert.apiError(err, "No se pudieron cargar los administradores");
    } finally {
      setLoading(false);
    }
  };

  // ✅ EFECTO PRINCIPAL: Cargar administradores cuando está todo listo
  useEffect(() => {
    if (!isInitialized) return;
    fetchAdministradores(currentPage, search);
  }, [currentPage, search, currentUser?.organizationId, isInitialized]);

  // ✅ Refrescar cuando se llega desde la creación
  useEffect(() => {
    if (location.state?.refresh && isInitialized && currentUser) {
      setCurrentPage(1);
      setSearch("");
      fetchAdministradores(1, "");
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, isInitialized, currentUser?.id]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      password: "",
      organizationId: admin.organizationId || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (adminId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar este administrador?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteUser(adminId);
      alert.success("Administrador eliminado exitosamente");
      setTimeout(() => {
        fetchAdministradores(currentPage, search);
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar administrador");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    // Validaciones básicas
    if (!formData.email) {
      alert.warning("El email es requerido", "Campo incompleto");
      return;
    }

    setSaving(true);
    try {
      const updateData = { email: formData.email };

      // Agregar organizationId si se seleccionó
      if (formData.organizationId) {
        updateData.organizationId = parseInt(formData.organizationId);
      }

      // Solo actualizar contraseña si se proporciona una nueva
      if (formData.password && formData.password.trim()) {
        if (formData.password.length < 6) {
          alert.warning(
            "La contraseña debe tener al menos 6 caracteres",
            "Contraseña débil",
          );
          setSaving(false);
          return;
        }
        updateData.password = formData.password;
      }

      await updateUser(editingAdmin.id, updateData);
      setShowModal(false);
      setEditingAdmin(null);
      alert.success("Administrador actualizado exitosamente");
      fetchAdministradores(currentPage, search);
    } catch (err) {
      alert.apiError(err, "Error al actualizar administrador");
    } finally {
      setSaving(false);
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

  // Función para obtener nombre de organización
  const getOrganizationName = (admin) => {
    if (admin.organization?.name) {
      return admin.organization.name;
    }
    const org = organizations.find((o) => o.id === admin.organizationId);
    return org?.name || "-";
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Administradores</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión de administradores registrados en tu organización
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando administradores...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : administradores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">
            {search
              ? "No se encontraron administradores"
              : "No hay administradores registrados"}
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
                    Organización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {administradores.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {getOrganizationName(admin)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(admin)}
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
                        onClick={() => handleDelete(admin.id)}
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

      {/* Vista móvil */}
      {!loading && administradores.length > 0 && (
        <div className="md:hidden space-y-4 mt-4">
          {administradores.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
            >
              <div className="font-bold text-gray-900 text-lg mb-2">
                {admin.email}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-semibold text-gray-900">
                    Organización:
                  </span>{" "}
                  {getOrganizationName(admin)}
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t">
                {(can("users:manage") || can("users:update")) && (
                  <button
                    onClick={() => handleEdit(admin)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 flex-1 justify-center py-2 rounded-lg hover:bg-blue-50 transition"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {(can("users:manage") || can("users:delete")) && (
                  <button
                    onClick={() => handleDelete(admin.id)}
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

      {/* Modal de edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Administrador
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAdmin(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  required
                  disabled={saving}
                />
              </div>

              {/* Campo de Organización */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organización
                </label>
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  disabled={saving}
                >
                  <option value="">Sin organización asignada</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona la organización a la que pertenece este
                  administrador
                </p>
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
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres si se proporciona
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAdmin(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                  disabled={saving}
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
