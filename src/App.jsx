import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Votantes from "./pages/Personas";
import Candidatos from "./pages/Candidatos";
import Lideres from "./pages/Lideres";
import Digitadores from "./pages/Digitadores";
import Administradores from "./pages/Administradores";
import Especiales from "./pages/Especiales";
import Reportes from "./pages/Reportes";
import CreateCandidates from "./pages/CreateCandidates";
import CreateLeaders from "./pages/CreateLeaders";
import CreateDigitadores from "./pages/CreateDigitadores";
import CreateEspeciales from "./pages/CreateEspeciales";
import AssignCandidates from "./pages/AssignCandidates";
import AdminPermissions from "./pages/AdminPermissions";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import PermissionRoute from "./components/PermissionRoute";
import Organizaciones from "./pages/Organizaciones";
import CreateOrganizaciones from "./pages/CreateOrganizaciones";
import Campanas from "./pages/Campanas";
import CreateCampanas from "./pages/CreateCampanas";
import DiaD from "./pages/DiaD";
import AppRedirect from "./components/AppRedirect";

/**
 * Página de login con redirección automática si ya hay sesión
 */
function LoginPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();

  useEffect(() => {
    // Si hay usuario y ya termina de cargar, redirigir a /app
    // Dejar que el componente AppRedirect maneje la lógica de permisos
    if (!isLoading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Mientras carga, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si hay usuario, mostrar loading mientras redirige
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  return <Login />;
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          {/* Ruta pública - con redirección automática */}
          <Route path="/" element={<LoginPage />} />

          {/* Rutas protegidas dentro de Dashboard */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            {/* Dashboard - Ruta principal /app/dashboard */}
            <Route path="dashboard" element={null} />

            {/* Votantes - Requiere permiso voters:read (solo lectura) */}
            <Route
              path="votantes"
              element={
                <PermissionRoute requiredPermission="voters:read">
                  <Votantes />
                </PermissionRoute>
              }
            />

            {/* Organizaciones - Requiere cualquier permiso de gestion */}
            <Route
              path="organizaciones"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "organizations:manage",
                    "organizations:create",
                    "organizations:update",
                    "organizations:delete",
                  ]}
                >
                  <Organizaciones />
                </PermissionRoute>
              }
            />

            {/* Crear Organizaciones - Requiere create o manage */}
            <Route
              path="crear-organizaciones"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "organizations:manage",
                    "organizations:create",
                  ]}
                >
                  <CreateOrganizaciones />
                </PermissionRoute>
              }
            />

            {/* Campanas - Requiere cualquier permiso de gestion */}
            <Route
              path="campanas"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "campaigns:manage",
                    "campaigns:create",
                    "campaigns:update",
                    "campaigns:delete",
                  ]}
                >
                  <Campanas />
                </PermissionRoute>
              }
            />

            {/* Crear Campanas - Requiere create o manage */}
            <Route
              path="crear-campanas"
              element={
                <PermissionRoute
                  requiredPermission={["campaigns:manage", "campaigns:create"]}
                >
                  <CreateCampanas />
                </PermissionRoute>
              }
            />

            {/* Candidatos - Requiere cualquier permiso de gestion */}
            <Route
              path="candidatos"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "candidates:manage",
                    "candidates:create",
                    "candidates:update",
                    "candidates:delete",
                  ]}
                >
                  <Candidatos />
                </PermissionRoute>
              }
            />

            {/* Lideres - Requiere cualquier permiso de gestion */}
            <Route
              path="lideres"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "leaders:manage",
                    "leaders:create",
                    "leaders:update",
                    "leaders:delete",
                  ]}
                >
                  <Lideres />
                </PermissionRoute>
              }
            />

            {/* Digitadores - Requiere cualquier permiso de gestion */}
            <Route
              path="digitadores"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "users:manage",
                    "users:create",
                    "users:update",
                    "users:delete",
                  ]}
                >
                  <Digitadores />
                </PermissionRoute>
              }
            />

            {/* Administradores - Requiere cualquier permiso de gestion */}
            <Route
              path="administradores"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "users:manage",
                    "users:create",
                    "users:update",
                    "users:delete",
                  ]}
                >
                  <Administradores />
                </PermissionRoute>
              }
            />

            {/* Usuarios Especiales - Requiere cualquier permiso de gestion */}
            <Route
              path="especiales"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "users:manage",
                    "users:create",
                    "users:update",
                    "users:delete",
                  ]}
                >
                  <Especiales />
                </PermissionRoute>
              }
            />

            {/* Crear Candidatos - Requiere create o manage */}
            <Route
              path="crear-candidatos"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "candidates:manage",
                    "candidates:create",
                  ]}
                >
                  <CreateCandidates />
                </PermissionRoute>
              }
            />

            {/* Crear Lideres - Requiere create o manage */}
            <Route
              path="crear-lideres"
              element={
                <PermissionRoute
                  requiredPermission={["leaders:manage", "leaders:create"]}
                >
                  <CreateLeaders />
                </PermissionRoute>
              }
            />

            {/* Crear Digitadores - Requiere create o manage */}
            <Route
              path="crear-digitadores"
              element={
                <PermissionRoute
                  requiredPermission={["users:manage", "users:create"]}
                >
                  <CreateDigitadores />
                </PermissionRoute>
              }
            />

            {/* Crear Usuarios Especiales - Requiere create o manage */}
            <Route
              path="crear-especiales"
              element={
                <PermissionRoute
                  requiredPermission={["users:manage", "users:create"]}
                >
                  <CreateEspeciales />
                </PermissionRoute>
              }
            />

            {/* Asignar Candidatos - Requiere manage, update, o delete */}
            <Route
              path="asignar-candidatos"
              element={
                <PermissionRoute
                  requiredPermission={[
                    "candidates:manage",
                    "candidates:update",
                    "candidates:delete",
                  ]}
                >
                  <AssignCandidates />
                </PermissionRoute>
              }
            />

            {/* Reportes - Requiere permiso reports:read (solo lectura) */}
            <Route
              path="reportes"
              element={
                <PermissionRoute requiredPermission="reports:read">
                  <Reportes />
                </PermissionRoute>
              }
            />

            {/* Día D - Panel de Votación - Requiere permiso voting:access */}
            <Route
              path="dia-d"
              element={
                <PermissionRoute requiredPermission="voting:access">
                  <DiaD />
                </PermissionRoute>
              }
            />

            {/* Admin Permisos - Requiere permiso permissions:manage (solo administradores) */}
            <Route
              path="admin-permisos"
              element={
                <PermissionRoute requiredPermission="permissions:manage">
                  <AdminPermissions />
                </PermissionRoute>
              }
            />

            {/* Ruta por defecto dentro de Dashboard - redirigir según permisos */}
            <Route index element={<AppRedirect />} />
          </Route>

          {/* Ruta de acceso denegado */}
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Ruta para página no encontrada - debe ser la última */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
