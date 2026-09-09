import { createContext, useState, useContext, useEffect } from "react";
import { getUserPermissions } from "../api/permissions";

const UserContext = createContext();

// Sistema de eventos personalizado para cambios en localStorage
const storageChangeEvent = new EventTarget();

// Función para notificar cambios en localStorage
export function notifyStorageChange() {
  storageChangeEvent.dispatchEvent(new Event("change"));
}

/**
 * Proveedor de contexto de usuario
 * Gestiona: usuario, rol, permisos y estado de carga
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Leer INMEDIATAMENTE del localStorage, SIN reintentos, SIN delays
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        const email = localStorage.getItem("user_email");
        const roleId = localStorage.getItem("roleId");
        const organizationId = localStorage.getItem("organizationId");

        if (token && userId && email) {
          const userData = {
            id: parseInt(userId),
            email,
            roleId: roleId ? parseInt(roleId) : null,
            organizationId: organizationId ? parseInt(organizationId) : null,
          };
          setUser(userData);

          // Cargar permisos del usuario ASINCRONAMENTE en el background
          if (roleId) {
            try {
              const userPerms = await getUserPermissions();
              setPermissions(userPerms);
            } catch (err) {
              console.error("Error loading permissions:", err);
            }
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // Escuchar cambios en localStorage INCLUYENDO la misma pestaña
    const handleStorageChange = () => {
      loadUserData();
    };

    // Escuchar evento personalizado (cambios en ESTA pestaña)
    storageChangeEvent.addEventListener("change", handleStorageChange);

    // También escuchar storage event (cambios en OTRAS pestañas)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      storageChangeEvent.removeEventListener("change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /**
   * Función para refrescar los permisos (útil después de cambios)
   */
  const refreshPermissions = async () => {
    try {
      const userPerms = await getUserPermissions();
      setPermissions(userPerms);
    } catch (err) {
      console.error("Error refreshing permissions:", err);
    }
  };

  /**
   * Función para cerrar sesión
   */
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("roleId");
    setUser(null);
    setPermissions([]);
  };

  const value = {
    user,
    permissions,
    isLoading,
    error,
    refreshPermissions,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook para usar el contexto de usuario
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe ser usado dentro de UserProvider");
  }
  return context;
}
