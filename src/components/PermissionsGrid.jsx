import { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

/**
 * Componente para gestionar permisos de un rol o usuario
 * @param {Object} props
 * @param {string} props.type - 'role' o 'user'
 * @param {number} props.targetId - ID del rol o usuario
 * @param {string} props.targetName - Nombre del rol o usuario (para display)
 * @param {Array} props.allPermissions - Array de todos los permisos disponibles
 * @param {Array} props.assignedPermissions - Array de permisos actualmente asignados o user_permissions para usuarios
 * @param {Array} props.rolePermissions - Array de permisos heredados del rol (solo para usuarios)
 * @param {Function} props.onAssign - Callback para asignar permiso (roles)
 * @param {Function} props.onRevoke - Callback para revocar permiso (roles)
 * @param {Function} props.onToggle - Callback para toggle de permiso (usuarios)
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.error - Mensaje de error
 */
export default function PermissionsGrid({
  type = "role",
  targetId,
  targetName,
  allPermissions = [],
  assignedPermissions = [],
  rolePermissions = [],
  onAssign,
  onRevoke,
  onToggle,
  loading = false,
  error = null,
}) {
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState({});
  const [loadingManage, setLoadingManage] = useState({});

  useEffect(() => {
    // Agrupar permisos por recurso
    const grouped = {};
    allPermissions.forEach((perm) => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    setGroupedPermissions(grouped);
  }, [allPermissions]);

  // Obtener los permisos CRUD de un recurso (create, read, update, delete)
  const getCrudPermissionsForResource = (resource) => {
    if (!groupedPermissions[resource]) return [];
    return groupedPermissions[resource].filter((p) =>
      ["create", "read", "update", "delete"].includes(p.action.toLowerCase()),
    );
  };

  // Verificar si todos los permisos CRUD están activos para un recurso
  const areAllCrudActive = (resource) => {
    const crudPerms = getCrudPermissionsForResource(resource);
    if (crudPerms.length === 0) return false;

    return crudPerms.every((perm) => isPermissionAssigned(perm.id));
  };

  // Manejar el toggle de "manage" para activar/desactivar todos los CRUD
  const handleManageToggle = async (resource, isCurrentlyActive) => {
    const resourceKey = `manage-${resource}`;
    setLoadingManage((prev) => ({ ...prev, [resourceKey]: true }));

    try {
      const crudPerms = getCrudPermissionsForResource(resource);

      if (isCurrentlyActive) {
        // Desactivar todos los CRUD
        for (const perm of crudPerms) {
          const isAssigned = isPermissionAssigned(perm.id);
          const isFromRole = isPermissionFromRole(perm.id);
          const isCustom = isPermissionCustom(perm.id);
          const isRevoked = isPermissionRevoked(perm.id);

          if (isAssigned || isRevoked) {
            await handleTogglePermission(
              perm.id,
              isAssigned || isRevoked,
              isFromRole,
              isCustom,
              isRevoked,
            );
          }
        }
      } else {
        // Activar todos los CRUD
        for (const perm of crudPerms) {
          const isAssigned = isPermissionAssigned(perm.id);
          const isFromRole = isPermissionFromRole(perm.id);
          const isCustom = isPermissionCustom(perm.id);
          const isRevoked = isPermissionRevoked(perm.id);

          if (!isAssigned && !isRevoked) {
            await handleTogglePermission(
              perm.id,
              isAssigned || isRevoked,
              isFromRole,
              isCustom,
              isRevoked,
            );
          }
        }
      }
    } catch (err) {
      console.error("Error toggling manage permissions:", err);
    } finally {
      setLoadingManage((prev) => ({ ...prev, [resourceKey]: false }));
    }
  };

  const getUserPermissionStatus = (permissionId) => {
    // Para usuarios, buscar en assignedPermissions (que son user_permissions completos)
    if (type === "user" && Array.isArray(assignedPermissions)) {
      const userPerm = assignedPermissions.find(
        (p) => p.permission?.id === permissionId,
      );
      return userPerm;
    }
    return null;
  };

  const isPermissionAssigned = (permissionId) => {
    if (type === "user") {
      // Para usuarios, verificar granted status
      const userPerm = getUserPermissionStatus(permissionId);
      if (userPerm) {
        return userPerm.granted;
      }
      // Si no hay user_permission pero está en el rol, está heredado
      return rolePermissions.some((p) => p.id === permissionId);
    } else {
      // Para roles, usar la lógica simple
      return assignedPermissions.some((p) => p.id === permissionId);
    }
  };

  const isPermissionFromRole = (permissionId) => {
    // Solo aplica a usuarios, no a roles
    if (type !== "user") return false;
    // Es del rol si existe en rolePermissions y NO hay user_permission que lo niegue
    const userPerm = getUserPermissionStatus(permissionId);
    const isInRole = rolePermissions.some((p) => p.id === permissionId);

    // Si no hay override personalizado, y está en el rol, es heredado
    if (!userPerm && isInRole) {
      return true;
    }

    // Si hay override pero está otorgado, también lo consideramos como heredado base
    if (userPerm && userPerm.granted && isInRole) {
      return true;
    }

    return false;
  };

  const isPermissionCustom = (permissionId) => {
    // Solo aplica a usuarios
    if (type !== "user") return false;
    // Un permiso es personalizado si hay un user_permission con granted=true y NO viene del rol
    const userPerm = getUserPermissionStatus(permissionId);
    const isInRole = rolePermissions.some((p) => p.id === permissionId);

    return userPerm && userPerm.granted && !isInRole;
  };

  const isPermissionRevoked = (permissionId) => {
    // Solo aplica a usuarios
    if (type !== "user") return false;
    // Un permiso está revocado si hay user_permission con granted=false
    const userPerm = getUserPermissionStatus(permissionId);
    return userPerm && !userPerm.granted;
  };

  const handleTogglePermission = async (
    permissionId,
    isAssigned,
    isFromRole,
    isCustom,
    isRevoked,
  ) => {
    setLoadingPermissions((prev) => ({ ...prev, [permissionId]: true }));

    try {
      if (type === "user") {
        // Para usuarios, usar el callback onToggle con más información
        await onToggle(permissionId, isFromRole, isRevoked, isCustom);
      } else {
        // Para roles, usar la lógica simple anterior
        if (isAssigned) {
          await onRevoke(permissionId);
        } else {
          await onAssign(permissionId);
        }
      }
    } catch (err) {
      console.error("Error toggling permission:", err);
    } finally {
      setLoadingPermissions((prev) => ({ ...prev, [permissionId]: false }));
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 py-6 border-b-2 border-orange-200 bg-gradient-to-r from-orange-600 to-amber-600">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6" />
          Permisos de {type === "role" ? "Rol" : "Usuario"}: {targetName}
        </h3>
      </div>

      {error && (
        <div className="mx-8 mt-4 rounded-lg bg-red-50 p-4 border-2 border-red-200">
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      )}

      <div className="px-6 py-4 space-y-8">
        {Object.entries(groupedPermissions).length === 0 ? (
          <p className="text-center text-gray-500">
            No hay permisos disponibles
          </p>
        ) : (
          Object.entries(groupedPermissions).map(([resource, permissions]) => {
            const allCrudActive = areAllCrudActive(resource);
            const crudPerms = getCrudPermissionsForResource(resource);
            const manageBtnLoading = loadingManage[`manage-${resource}`];

            return (
              <div
                key={resource}
                className="border border-orange-200 rounded-xl p-6 bg-gradient-to-br from-white to-orange-50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 capitalize">
                    <ShieldCheckIcon className="h-6 w-6 text-orange-600" />
                    {resource}
                  </h4>
                  {crudPerms.length > 0 && (
                    <button
                      onClick={() =>
                        handleManageToggle(resource, allCrudActive)
                      }
                      disabled={loading || manageBtnLoading}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        allCrudActive
                          ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      } ${
                        (loading || manageBtnLoading) &&
                        "opacity-50 cursor-not-allowed"
                      }`}
                      title={
                        allCrudActive
                          ? "Desactivar todos los CRUD"
                          : "Activar todos los CRUD"
                      }
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Manage
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {permissions
                    .filter((p) => p.action.toLowerCase() !== "manage")
                    .map((perm) => {
                      const isAssigned = isPermissionAssigned(perm.id);
                      const isFromRole = isPermissionFromRole(perm.id);
                      const isCustom = isPermissionCustom(perm.id);
                      const isRevoked = isPermissionRevoked(perm.id);
                      const isLoadingPerm = loadingPermissions[perm.id];
                      const isCrudPerm = crudPerms.some(
                        (p) => p.id === perm.id,
                      );

                      // Determinar estilo según el tipo de permiso
                      let borderColor =
                        "border-gray-300 bg-white hover:border-gray-400";
                      let iconColor = "text-gray-300";
                      let label = "Sin asignar";
                      let badgeColor = "bg-gray-100 text-gray-700";

                      if (type === "role") {
                        // Para roles: solo dos estados - asignado o no asignado
                        if (isAssigned) {
                          borderColor = "border-orange-600 bg-orange-100";
                          iconColor = "text-orange-700";
                          label = "Asignado";
                          badgeColor =
                            "bg-orange-200 text-orange-900 font-bold";
                        }
                      } else {
                        // Para usuarios: cuatro estados
                        if (isRevoked) {
                          // Permiso del rol pero revocado
                          borderColor = "border-red-500 bg-red-50";
                          iconColor = "text-red-600";
                          label = "Revocado del rol";
                          badgeColor = "bg-red-100 text-red-700";
                        } else if (isFromRole) {
                          borderColor = "border-orange-600 bg-orange-100";
                          iconColor = "text-orange-700";
                          label = "Heredado del rol";
                          badgeColor =
                            "bg-orange-200 text-orange-900 font-bold";
                        } else if (isCustom) {
                          borderColor = "border-purple-600 bg-purple-100";
                          iconColor = "text-purple-700";
                          label = "Personalizado";
                          badgeColor =
                            "bg-purple-200 text-purple-900 font-bold";
                        }
                      }

                      return (
                        <button
                          key={perm.id}
                          onClick={() =>
                            handleTogglePermission(
                              perm.id,
                              isAssigned || isRevoked,
                              isFromRole,
                              isCustom,
                              isRevoked,
                            )
                          }
                          disabled={loading || isLoadingPerm}
                          className={`relative p-4 rounded-lg border-2 text-left transition-all ${borderColor} ${
                            (loading || isLoadingPerm) &&
                            "opacity-50 cursor-not-allowed"
                          } ${isCrudPerm && "ring-2 ring-orange-300"} hover:shadow-lg`}
                          title={perm.description || perm.name}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 capitalize text-base">
                                {perm.action}
                              </div>
                              {perm.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {perm.description}
                                </div>
                              )}
                              {(isAssigned || isRevoked) && (
                                <div
                                  className={`text-xs font-semibold mt-2 px-2 py-1 rounded w-fit ${badgeColor}`}
                                >
                                  {label}
                                </div>
                              )}
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              {isAssigned || isRevoked ? (
                                <CheckIcon className={`h-6 w-6 ${iconColor}`} />
                              ) : (
                                <div className="h-6 w-6 border-2 border-gray-300 rounded" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
