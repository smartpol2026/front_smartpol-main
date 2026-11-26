import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import Logo from "../assets/logo.png";
import { useUser } from "../context/UserContext";
import { usePermission } from "../hooks/usePermission";
import { XMarkIcon } from "@heroicons/react/24/outline";

function navItemClass(active) {
  return `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
    active
      ? "bg-white text-brand-600 shadow-soft"
      : "text-white/90 hover:bg-white/15 hover:text-white"
  }`;
}

function subItemClass(active) {
  return `flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
    active
      ? "bg-white text-brand-600 shadow-soft"
      : "text-white/80 hover:bg-white/15 hover:text-white"
  }`;
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useUser();
  const { can, canAny } = usePermission();
  const [expandedMenu, setExpandedMenu] = useState(() => {
    if (location.pathname.startsWith("/app/reportes")) return "reportes";
    if (
      location.pathname.startsWith("/app/dia-d") ||
      location.pathname.startsWith("/app/tablero-control")
    ) {
      return "dia-d";
    }
    if (
      [
        "/app/digitadores",
        "/app/candidatos",
        "/app/lideres",
        "/app/asignar-candidatos",
        "/app/organizaciones",
        "/app/campanas",
        "/app/administradores",
        "/app/especiales",
        "/app/directores-campana",
        "/app/crear-directores-campana",
        "/app/testigos-electorales",
        "/app/crear-testigos-electorales",
      ].some((path) => location.pathname.startsWith(path))
    ) {
      return "gestion";
    }
    return null;
  });
  const isActive = (path) => location.pathname.startsWith(path);
  const isExactOrChild = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  const canSeeDashboard = can("dashboard:read");
  const canSeeVotantes = can("voters:read");
  const canSeeOrganizaciones = canAny([
    "organizations:manage",
    "organizations:create",
    "organizations:update",
    "organizations:delete",
  ]);
  const canSeeCampanas = canAny([
    "campaigns:manage",
    "campaigns:create",
    "campaigns:update",
    "campaigns:delete",
  ]);
  const canSeeCandidatos = canAny([
    "candidates:manage",
    "candidates:create",
    "candidates:update",
    "candidates:delete",
  ]);
  const canSeeLideres = canAny([
    "leaders:manage",
    "leaders:create",
    "leaders:update",
    "leaders:delete",
  ]);
  const canSeeDigitadores =
    user?.roleId !== 3 &&
    canAny(["users:manage", "users:create", "users:update", "users:delete"]);
  const canManageCampaignUsers =
    user?.roleId === 1 || user?.roleId === 2;
  const canSeeAdministradores = user?.roleId === 1;
  const canSeeEspeciales =
    user?.roleId !== 3 &&
    canAny(["users:manage", "users:create", "users:update", "users:delete"]);
  const canSeeAsignarCandidatos = canAny([
    "candidates:manage",
    "candidates:create",
    "candidates:update",
    "candidates:delete",
  ]);
  const isSuperadmin = user?.roleId === 1;
  const canSeeReportes = can("reports:read");
  const canSeeDiaD = can("voting:access");
  // Superadmin no debe ver estas vistas operativas
  const canSeeControlBoard = !isSuperadmin && can("control-board:read");
  const canSeeMyTable = !isSuperadmin && can("my-table:read");
  const showActiveCampaign = isActive("/app/mi-mesa");
  const activeCampaignName = user?.campaigns?.[0]?.name || "Sin campaña";
  const canSeeAdminPermisos = can("permissions:manage");
  const canSeeGestion =
    canManageCampaignUsers ||
    canAny([
      "organizations:manage",
      "organizations:create",
      "organizations:update",
      "organizations:delete",
      "campaigns:manage",
      "campaigns:create",
      "campaigns:update",
      "campaigns:delete",
      "candidates:manage",
      "candidates:create",
      "candidates:update",
      "candidates:delete",
      "leaders:manage",
      "leaders:create",
      "leaders:update",
      "leaders:delete",
      "users:manage",
      "users:create",
      "users:update",
      "users:delete",
    ]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-50 transition-opacity lg:hidden
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
      />

      <aside
        className={`
          sidebar-shell fixed lg:static inset-y-0 left-0 z-[60]
          h-screen h-[100dvh] self-stretch
          overflow-hidden
          bg-gradient-to-b from-brand-500 to-brand-600
          flex flex-col
          ${
            isOpen
              ? "w-64 translate-x-0 opacity-100 shadow-sidebar"
              : "w-64 -translate-x-full opacity-0 pointer-events-none lg:w-0 lg:translate-x-0 lg:opacity-100 lg:pointer-events-none lg:shadow-none"
          }
        `}
        aria-hidden={!isOpen}
      >
        <div
          className={`sidebar-panel relative w-64 min-w-[16rem] h-full min-h-0 overflow-y-auto flex flex-col ${
            isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 lg:opacity-0"
          }`}
        >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-1 z-10 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center justify-center px-5 pt-12 pb-7">
          <div className="bg-white rounded-2xl px-4 py-3 shadow-soft w-full flex items-center justify-center">
            <img src={Logo} alt="SmartPol" className="h-10 w-auto object-contain" />
          </div>
          <span className="text-xs text-white/75 mt-3 font-medium tracking-wide">
            Panel de administración
          </span>
        </div>

        <nav className="flex-1 px-3 pb-6">
          <ul className="space-y-1.5">
            {canSeeDashboard && (
              <li>
                <Link
                  to="/app/dashboard"
                  onClick={handleLinkClick}
                  className={navItemClass(
                    isActive("/app/dashboard") || location.pathname === "/app",
                  )}
                >
                  <span className="ml-1">Dashboard</span>
                </Link>
              </li>
            )}

            {canSeeVotantes && (
              <li>
                <Link
                  to="/app/votantes"
                  onClick={handleLinkClick}
                  className={navItemClass(isActive("/app/votantes"))}
                >
                  <span className="ml-1">Votantes</span>
                </Link>
              </li>
            )}

            {canSeeGestion && (
              <li>
                <button
                  onClick={() =>
                    setExpandedMenu(
                      expandedMenu === "gestion" ? null : "gestion",
                    )
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    expandedMenu === "gestion"
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <span className="ml-1">Gestión</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expandedMenu === "gestion" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedMenu === "gestion" && (
                  <ul className="space-y-1 mt-1.5 pl-2">
                    {canSeeOrganizaciones && (
                      <li>
                        <Link
                          to="/app/organizaciones"
                          onClick={handleLinkClick}
                          className={subItemClass(isActive("/app/organizaciones"))}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Organizaciones</span>
                        </Link>
                      </li>
                    )}
                    {canSeeCampanas && (
                      <li>
                        <Link
                          to="/app/campanas"
                          onClick={handleLinkClick}
                          className={subItemClass(isActive("/app/campanas"))}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Campañas</span>
                        </Link>
                      </li>
                    )}
                    {canSeeCandidatos && (
                      <li>
                        <Link
                          to="/app/candidatos"
                          onClick={handleLinkClick}
                          className={subItemClass(isActive("/app/candidatos"))}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Candidatos</span>
                        </Link>
                      </li>
                    )}
                    {canSeeLideres && (
                      <li>
                        <Link
                          to="/app/lideres"
                          onClick={handleLinkClick}
                          className={subItemClass(isActive("/app/lideres"))}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Líderes</span>
                        </Link>
                      </li>
                    )}
                    {canSeeDigitadores && (
                      <li>
                        <Link
                          to="/app/digitadores"
                          onClick={handleLinkClick}
                          className={subItemClass(isActive("/app/digitadores"))}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Digitadores</span>
                        </Link>
                      </li>
                    )}
                    {canManageCampaignUsers && (
                      <li>
                        <Link
                          to="/app/directores-campana"
                          onClick={handleLinkClick}
                          className={subItemClass(
                            isActive("/app/directores-campana") ||
                              isActive("/app/crear-directores-campana"),
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Directores de campaña</span>
                        </Link>
                      </li>
                    )}
                    {canManageCampaignUsers && (
                      <li>
                        <Link
                          to="/app/testigos-electorales"
                          onClick={handleLinkClick}
                          className={subItemClass(
                            isActive("/app/testigos-electorales") ||
                              isActive("/app/crear-testigos-electorales"),
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Testigos electorales</span>
                        </Link>
                      </li>
                    )}
                    {canSeeAdministradores && (
                      <li>
                        <Link
                          to="/app/administradores"
                          onClick={handleLinkClick}
                          className={subItemClass(
                            isActive("/app/administradores"),
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Administradores</span>
                        </Link>
                      </li>
                    )}
                    {canSeeEspeciales && (
                      <li>
                        <Link
                          to="/app/especiales"
                          onClick={handleLinkClick}
                          className={subItemClass(isActive("/app/especiales"))}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Usuarios Especiales</span>
                        </Link>
                      </li>
                    )}
                    {canSeeAsignarCandidatos && (
                      <li>
                        <Link
                          to="/app/asignar-candidatos"
                          onClick={handleLinkClick}
                          className={subItemClass(
                            isActive("/app/asignar-candidatos"),
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Asignar Candidatos</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            )}

            {canSeeReportes && (
              <li>
                <button
                  onClick={() =>
                    setExpandedMenu(
                      expandedMenu === "reportes" ? null : "reportes",
                    )
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    expandedMenu === "reportes"
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <span className="ml-1">Reportes</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expandedMenu === "reportes" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedMenu === "reportes" && (
                  <ul className="space-y-1 mt-1.5 pl-2">
                    <li>
                      <Link
                        to="/app/reportes"
                        onClick={handleLinkClick}
                        className={subItemClass(
                          location.pathname === "/app/reportes" &&
                            !location.search,
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                        <span>Reporte por votantes</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/app/reportes/candidatos"
                        onClick={handleLinkClick}
                        className={subItemClass(
                          location.pathname === "/app/reportes/candidatos",
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                        <span>Reporte por candidatos</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/app/reportes/lideres"
                        onClick={handleLinkClick}
                        className={subItemClass(
                          location.pathname === "/app/reportes/lideres",
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                        <span>Reporte por líderes</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/app/reportes/partidos"
                        onClick={handleLinkClick}
                        className={subItemClass(
                          location.pathname === "/app/reportes/partidos",
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                        <span>Reporte por partido</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/app/reportes/estado-politico"
                        onClick={handleLinkClick}
                        className={subItemClass(
                          location.pathname ===
                            "/app/reportes/estado-politico",
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                        <span>Reporte por estado político</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}

            {(canSeeDiaD || canSeeControlBoard) && (
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMenu(expandedMenu === "dia-d" ? null : "dia-d")
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    expandedMenu === "dia-d" ||
                    isActive("/app/dia-d") ||
                    isActive("/app/tablero-control")
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <span className="ml-1">Día D</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expandedMenu === "dia-d" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedMenu === "dia-d" && (
                  <ul className="space-y-1 mt-1.5 pl-2">
                    {canSeeControlBoard && (
                      <li>
                        <Link
                          to="/app/tablero-control"
                          onClick={handleLinkClick}
                          className={subItemClass(
                            isActive("/app/tablero-control"),
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                          <span>Tablero de control</span>
                        </Link>
                      </li>
                    )}
                    {canSeeDiaD && (
                      <>
                        <li>
                          <Link
                            to="/app/dia-d/registro"
                            onClick={handleLinkClick}
                            className={subItemClass(
                              isExactOrChild("/app/dia-d/registro") ||
                                location.pathname === "/app/dia-d",
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                            <span>Registro</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/app/dia-d/seguimiento"
                            onClick={handleLinkClick}
                            className={subItemClass(
                              isExactOrChild("/app/dia-d/seguimiento"),
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                            <span>Seguimiento</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/app/dia-d/analisis"
                            onClick={handleLinkClick}
                            className={subItemClass(
                              isExactOrChild("/app/dia-d/analisis"),
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-70" />
                            <span>Análisis</span>
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </li>
            )}

            {canSeeMyTable && (
              <li>
                <Link
                  to="/app/mi-mesa"
                  onClick={handleLinkClick}
                  className={navItemClass(isActive("/app/mi-mesa"))}
                >
                  <span className="ml-1">Mi mesa</span>
                </Link>
              </li>
            )}

            {canSeeAdminPermisos && (
              <li>
                <Link
                  to="/app/admin-permisos"
                  onClick={handleLinkClick}
                  className={navItemClass(isActive("/app/admin-permisos"))}
                >
                  <span className="ml-1">Admin Permisos</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="px-4 pb-5">
          {showActiveCampaign && (
            <div className="mb-3 rounded-2xl border border-emerald-200/30 bg-white/15 px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                  Campaña activa
                </p>
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-white" title={activeCampaignName}>
                {activeCampaignName}
              </p>
            </div>
          )}
          <div className="rounded-2xl bg-white/12 border border-white/15 px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
              SmartPol
            </p>
            <p className="text-xs text-white/80 mt-1">
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}
