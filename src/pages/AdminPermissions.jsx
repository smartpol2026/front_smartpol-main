import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import {
  getRoles,
  getUsers,
  getAllPermissions,
  getRolePermissions,
  getUserCustomPermissions,
  assignPermissionToRole,
  revokePermissionFromRole,
  grantUserPermission,
  revokeUserRolePermission,
  deleteUserPermission,
} from "../api/roles-permissions";
import PermissionsGrid from "../components/PermissionsGrid";

export default function AdminPermissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Datos
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  // Estados de selección
  const [activeTab, setActiveTab] = useState("roles"); // 'roles' o 'users'
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRolePermissions, setUserRolePermissions] = useState([]); // Permisos heredados del rol del usuario

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [rolesData, usersData, permsData] = await Promise.all([
          getRoles(),
          getUsers(),
          getAllPermissions(),
        ]);

        setRoles(rolesData);
        setUsers(usersData);
        setAllPermissions(permsData);
      } catch (err) {
        setError("Error al cargar datos: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Cargar permisos del rol seleccionado
  useEffect(() => {
    const loadRolePermissions = async () => {
      if (!selectedRole) return;

      try {
        const perms = await getRolePermissions(selectedRole.id);
        setRolePermissions(perms);
      } catch (err) {
        console.error("Error loading role permissions:", err);
      }
    };

    loadRolePermissions();
  }, [selectedRole]);

  // Cargar permisos personalizados del usuario seleccionado
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!selectedUser) return;

      try {
        const perms = await getUserCustomPermissions(selectedUser.id);
        setUserPermissions(perms);

        // Cargar también los permisos del rol del usuario
        if (selectedUser.role) {
          const rolePerms = await getRolePermissions(selectedUser.role.id);
          setUserRolePermissions(rolePerms);
        }
      } catch (err) {
        console.error("Error loading user permissions:", err);
      }
    };

    loadUserPermissions();
  }, [selectedUser]);

  // Handlers para asignar/revocar permisos de rol
  const handleAssignRolePermission = async (permissionId) => {
    try {
      await assignPermissionToRole(selectedRole.id, permissionId);
      const updated = await getRolePermissions(selectedRole.id);
      setRolePermissions(updated);
    } catch (err) {
      setError("Error al asignar permiso: " + err.message);
    }
  };

  const handleRevokeRolePermission = async (permissionId) => {
    try {
      await revokePermissionFromRole(selectedRole.id, permissionId);
      const updated = await getRolePermissions(selectedRole.id);
      setRolePermissions(updated);
    } catch (err) {
      setError("Error al revocar permiso: " + err.message);
    }
  };

  // Handlers para asignar/revocar permisos de usuario
  const handleToggleUserPermission = async (
    permissionId,
    isFromRole,
    isRevocado,
    isCustom,
  ) => {
    try {
      let action;

      if (isFromRole && !isRevocado) {
        // Permiso heredado activo -> revocarlo (granted: false)
        action = revokeUserRolePermission(selectedUser.id, permissionId);
      } else if (isRevocado) {
        // Permiso revocado -> restaurarlo (DELETE)
        action = deleteUserPermission(selectedUser.id, permissionId);
      } else if (isCustom) {
        // Permiso personalizado activo -> removerlo (DELETE)
        action = deleteUserPermission(selectedUser.id, permissionId);
      } else {
        // Sin permiso -> otorgarlo (granted: true)
        action = grantUserPermission(selectedUser.id, permissionId);
      }

      await action;

      // Refrescar ambos - permisos personalizados Y permisos del rol
      const [updatedUserPerms, updatedRolePerms] = await Promise.all([
        getUserCustomPermissions(selectedUser.id),
        selectedUser.role
          ? getRolePermissions(selectedUser.role.id)
          : Promise.resolve([]),
      ]);

      setUserPermissions(updatedUserPerms);
      setUserRolePermissions(updatedRolePerms);
      setError(""); // Limpiar errores si el cambio fue exitoso
    } catch (err) {
      setError("Error al modificar permiso: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Administración de Permisos
                </h1>
                <p className="mt-2 text-gray-600">
                  Gestiona los permisos por rol y usuario de manera sencilla
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message con mejor estilo */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 border-2 border-red-200 shadow-sm">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tabs mejorados */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <button
              onClick={() => {
                setActiveTab("roles");
                setSelectedRole(null);
                setError("");
              }}
              className={`flex-1 py-5 px-6 text-center font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "roles"
                  ? "border-b-4 border-orange-600 text-orange-600 bg-orange-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <ShieldCheckIcon className="h-6 w-6" />
              Permisos por Rol
            </button>
            <button
              onClick={() => {
                setActiveTab("users");
                setSelectedUser(null);
                setError("");
              }}
              className={`flex-1 py-5 px-6 text-center font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "users"
                  ? "border-b-4 border-orange-600 text-orange-600 bg-orange-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <UserGroupIcon className="h-6 w-6" />
              Permisos por Usuario
            </button>
          </div>

          <div className="p-8">
            {/* Tab: Permisos por Rol */}
            {activeTab === "roles" && (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Seleccionar Rol
                  </label>
                  <select
                    value={selectedRole?.id || ""}
                    onChange={(e) => {
                      const role = roles.find(
                        (r) => r.id === parseInt(e.target.value),
                      );
                      setSelectedRole(role || null);
                    }}
                    className="w-full border-2 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 p-3 text-gray-900 font-medium transition-all"
                  >
                    <option value="">Seleccionar un rol...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}{" "}
                        {role.description && `- ${role.description}`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-5">
                      <p className="text-sm font-semibold text-orange-900 leading-relaxed">
                        <span className="font-bold text-orange-600">
                          💡 Tip:
                        </span>{" "}
                        Los permisos en{" "}
                        <span className="font-bold text-emerald-600">
                          color verde
                        </span>{" "}
                        están asignados a este rol. Haz clic en un permiso para
                        asignarlo o revocarlo. Usa el botón{" "}
                        <span className="font-bold text-orange-600">CRUD</span>{" "}
                        para activar/desactivar todos los permisos de una
                        sección.
                      </p>
                    </div>

                    <PermissionsGrid
                      type="role"
                      targetId={selectedRole.id}
                      targetName={selectedRole.name}
                      allPermissions={allPermissions}
                      assignedPermissions={rolePermissions}
                      onAssign={handleAssignRolePermission}
                      onRevoke={handleRevokeRolePermission}
                      loading={loading}
                      error={error}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab: Permisos por Usuario */}
            {activeTab === "users" && (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Seleccionar Usuario
                  </label>
                  <select
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const user = users.find(
                        (u) => u.id === parseInt(e.target.value),
                      );
                      setSelectedUser(user || null);
                    }}
                    className="w-full border-2 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 p-3 text-gray-900 font-medium transition-all"
                  >
                    <option value="">Seleccionar un usuario...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} {user.role && `(${user.role.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-5">
                      <p className="text-sm font-semibold text-orange-900 leading-relaxed">
                        <span className="font-bold text-orange-600">
                          💡 Tip:
                        </span>{" "}
                        Los permisos en{" "}
                        <span className="font-bold text-orange-600">
                          color naranja
                        </span>{" "}
                        son heredados del rol{" "}
                        <span className="font-bold">
                          {selectedUser.role?.name}
                        </span>
                        . Los en{" "}
                        <span className="font-bold text-purple-600">
                          color púrpura
                        </span>{" "}
                        son personalizaciones específicas. Los en{" "}
                        <span className="font-bold text-red-600">
                          color rojo
                        </span>{" "}
                        están revocados del rol.
                      </p>
                    </div>

                    <PermissionsGrid
                      type="user"
                      targetId={selectedUser.id}
                      targetName={selectedUser.email}
                      allPermissions={allPermissions}
                      assignedPermissions={userPermissions}
                      rolePermissions={userRolePermissions}
                      onToggle={handleToggleUserPermission}
                      loading={loading}
                      error={error}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
