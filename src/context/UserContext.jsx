import { createContext, useState, useContext, useEffect } from "react";
import { getUserPermissions } from "../api/permissions";

const UserContext = createContext();

const storageChangeEvent = new EventTarget();

export function notifyStorageChange() {
  storageChangeEvent.dispatchEvent(new Event("change"));
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        const email = localStorage.getItem("user_email");
        const roleId = localStorage.getItem("roleId");
        const organizationId = localStorage.getItem("organizationId");
        const campaignIds = parseJsonArray(localStorage.getItem("campaignIds"));
        const campaigns = parseJsonArray(localStorage.getItem("campaigns"));

        if (token && userId && email) {
          const userData = {
            id: parseInt(userId),
            email,
            roleId: roleId ? parseInt(roleId) : null,
            organizationId: organizationId ? parseInt(organizationId) : null,
            campaignIds,
            campaigns,
          };
          setUser(userData);

          if (roleId) {
            try {
              const userPerms = await getUserPermissions();
              setPermissions(userPerms);
            } catch (err) {
              console.error("Error loading permissions:", err);
            }
          }
        } else {
          setUser(null);
          setPermissions([]);
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

    const handleStorageChange = () => {
      loadUserData();
    };

    storageChangeEvent.addEventListener("change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      storageChangeEvent.removeEventListener("change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const refreshPermissions = async () => {
    try {
      const userPerms = await getUserPermissions();
      setPermissions(userPerms);
    } catch (err) {
      console.error("Error refreshing permissions:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("roleId");
    localStorage.removeItem("organizationId");
    localStorage.removeItem("organizationName");
    localStorage.removeItem("campaignIds");
    localStorage.removeItem("campaigns");
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

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe ser usado dentro de UserProvider");
  }
  return context;
}
