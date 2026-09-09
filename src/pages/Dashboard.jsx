import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { ProtectedComponent } from "../components/ProtectedComponent";
import Forbidden from "./Forbidden";
import { GraficDoughnut } from "../components/GraficDoughnut";
import { VotersByCandidate } from "../components/VotersByCandidate";
import { VotersByParty } from "../components/VotersByParty";
import { useUser } from "../context/UserContext";
import { usePermission } from "../hooks/usePermission";
import {
  getVotersWithAssignments,
  getVotersByCandidateWithAssignments,
  getVotersByLeaderWithAssignments,
} from "../api/voters";
import {
  getCandidateByUserId,
  getCandidatesWithPagination,
  getVoterCountByCandidate,
  getVoterCountByParty,
} from "../api/candidates";
import { getLeaderByUserId, getLeadersWithPagination } from "../api/leaders";
import {
  UserGroupIcon,
  UserIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import "../styles/dashboard-animations.css";

export default function Dashboard() {
  const location = useLocation();
  const { user } = useUser();
  const { can } = usePermission();

  // Estados para conteos dinámicos
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalLeaders, setTotalLeaders] = useState(0);
  const [votesStats, setVotesStats] = useState({
    totalPendientes: 150,
    totalRegisteredVotes: 350,
  });
  const [candidateId, setCandidateId] = useState(null);
  const [leaderId, setLeaderId] = useState(null);
  const [loadingVoters, setLoadingVoters] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [votersByCandidate, setVotersByCandidate] = useState([]);
  const [loadingVotersByCandidate, setLoadingVotersByCandidate] =
    useState(false);
  const [votersByParty, setVotersByParty] = useState([]);
  const [loadingVotersByParty, setLoadingVotersByParty] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Cargar candidateId o leaderId según el rol
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Si es candidato, obtener su candidateId
        if (user.roleId === 3) {
          try {
            const candidate = await getCandidateByUserId(user.id);
            if (candidate?.id) {
              setCandidateId(candidate.id);
            }
          } catch (err) {
            console.error("Error loading candidate:", err);
          }
        }

        // Si es líder, obtener su leaderId
        if (user.roleId === 4) {
          try {
            const leader = await getLeaderByUserId(user.id);
            if (leader?.id) {
              setLeaderId(leader.id);
            }
          } catch (err) {
            console.error("Error loading leader:", err);
          }
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };

    loadData();
  }, [user]);

  // Cargar total de votantes dinámicamente
  useEffect(() => {
    const fetchVoterCount = async () => {
      setLoadingVoters(true);
      try {
        let data;

        // Obtener datos según el rol
        if (user?.roleId === 3 && candidateId) {
          // Candidato: obtener votantes del candidato
          data = await getVotersByCandidateWithAssignments(candidateId, 1, 1);
        } else if (user?.roleId === 4 && leaderId) {
          // Líder: obtener votantes del líder
          data = await getVotersByLeaderWithAssignments(leaderId, 1, 1);
        } else {
          // Admin de campaña (roleId=2) o digital: obtener votantes de su organización
          // El backend filtra automáticamente por organización según el rol del usuario
          data = await getVotersWithAssignments(1, 1);
        }

        if (data?.total !== undefined) {
          setTotalVoters(data.total);
        }
      } catch (err) {
        console.error("Error loading voter count:", err);
        setTotalVoters(0);
      } finally {
        setLoadingVoters(false);
      }
    };

    if (user) {
      // Esperar a que se cargue candidateId o leaderId si es necesario
      if (user.roleId === 3 && candidateId === null) return;
      if (user.roleId === 4 && leaderId === null) return;

      fetchVoterCount();
    }
  }, [user, candidateId, leaderId]);

  // Cargar total de candidatos dinámicamente
  useEffect(() => {
    const fetchCandidateCount = async () => {
      setLoadingCandidates(true);
      try {
        const data = await getCandidatesWithPagination(1, 1, "");

        if (data?.total !== undefined) {
          setTotalCandidates(data.total);
        }
      } catch (err) {
        console.error("Error loading candidate count:", err);
        setTotalCandidates(0);
      } finally {
        setLoadingCandidates(false);
      }
    };

    if (user) {
      fetchCandidateCount();
    }
  }, [user]);

  // Cargar total de líderes dinámicamente
  useEffect(() => {
    const fetchLeaderCount = async () => {
      setLoadingLeaders(true);
      try {
        const data = await getLeadersWithPagination(1, 1, "");

        if (data?.total !== undefined) {
          setTotalLeaders(data.total);
        }
      } catch (err) {
        console.error("Error loading leader count:", err);
        setTotalLeaders(0);
      } finally {
        setLoadingLeaders(false);
      }
    };

    if (user) {
      fetchLeaderCount();
    }
  }, [user]);

  // Cargar votantes por candidato - Solo para admin de organización (roleId=2)
  useEffect(() => {
    const fetchVotersByCandidate = async () => {
      setLoadingVotersByCandidate(true);
      try {
        const data = await getVoterCountByCandidate();
        setVotersByCandidate(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading voters by candidate:", err);
        setVotersByCandidate([]);
      } finally {
        setLoadingVotersByCandidate(false);
      }
    };

    // Solo cargar para admin de organización (roleId=2)
    if (user && user.roleId === 2) {
      fetchVotersByCandidate();
    }
  }, [user]);

  // Cargar votantes por partido - Solo para admin de organización (roleId=2)
  useEffect(() => {
    const fetchVotersByParty = async () => {
      setLoadingVotersByParty(true);
      try {
        const data = await getVoterCountByParty();
        setVotersByParty(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading voters by party:", err);
        setVotersByParty([]);
      } finally {
        setLoadingVotersByParty(false);
      }
    };

    // Solo cargar para admin de organización (roleId=2)
    if (user && user.roleId === 2) {
      fetchVotersByParty();
    }
  }, [user]);

  // Solo mostrar dashboard en /app/dashboard
  const isDashboardView = location.pathname === "/app/dashboard";

  // Cargar todos los datos cuando se navega al dashboard
  useEffect(() => {
    if (!isDashboardView || !user) return;

    const loadAllDashboardData = async () => {
      try {
        // Cargar votantes
        let votersData;
        if (user.roleId === 3 && candidateId) {
          votersData = await getVotersByCandidateWithAssignments(
            candidateId,
            1,
            1,
          );
        } else if (user.roleId === 4 && leaderId) {
          votersData = await getVotersByLeaderWithAssignments(leaderId, 1, 1);
        } else {
          votersData = await getVotersWithAssignments(1, 1);
        }
        if (votersData?.total !== undefined) {
          setTotalVoters(votersData.total);
        }

        // Cargar candidatos
        const candidatesData = await getCandidatesWithPagination(1, 1, "");
        if (candidatesData?.total !== undefined) {
          setTotalCandidates(candidatesData.total);
        }

        // Cargar líderes
        const leadersData = await getLeadersWithPagination(1, 1, "");
        if (leadersData?.total !== undefined) {
          setTotalLeaders(leadersData.total);
        }

        // Cargar votantes por candidato (solo para admin)
        if (user.roleId === 2) {
          const candidateVotersData = await getVoterCountByCandidate();
          setVotersByCandidate(
            Array.isArray(candidateVotersData) ? candidateVotersData : [],
          );
        }

        // Cargar votantes por partido (solo para admin)
        if (user.roleId === 2) {
          const partyVotersData = await getVoterCountByParty();
          setVotersByParty(
            Array.isArray(partyVotersData) ? partyVotersData : [],
          );
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };

    loadAllDashboardData();
  }, [isDashboardView, user, candidateId, leaderId]);

  // Recarga automática en tiempo real cada 5 segundos
  useEffect(() => {
    // Solo recargar si estamos en la vista del dashboard
    if (!isDashboardView) return;

    const interval = setInterval(async () => {
      setIsSyncing(true);
      try {
        // Recarga de votantes
        if (user) {
          let data;
          if (user.roleId === 3 && candidateId) {
            data = await getVotersByCandidateWithAssignments(candidateId, 1, 1);
          } else if (user.roleId === 4 && leaderId) {
            data = await getVotersByLeaderWithAssignments(leaderId, 1, 1);
          } else {
            data = await getVotersWithAssignments(1, 1);
          }
          if (data?.total !== undefined) {
            setTotalVoters(data.total);
          }
        }

        // Recarga de candidatos
        if (user) {
          const candidateData = await getCandidatesWithPagination(1, 1, "");
          if (candidateData?.total !== undefined) {
            setTotalCandidates(candidateData.total);
          }
        }

        // Recarga de líderes
        if (user) {
          const leaderData = await getLeadersWithPagination(1, 1, "");
          if (leaderData?.total !== undefined) {
            setTotalLeaders(leaderData.total);
          }
        }

        // Recarga de votantes por candidato (solo para admin de organización)
        if (user && user.roleId === 2) {
          const candidateVotersData = await getVoterCountByCandidate();
          setVotersByCandidate(
            Array.isArray(candidateVotersData) ? candidateVotersData : [],
          );
        }

        // Recarga de votantes por partido (solo para admin de organización)
        if (user && user.roleId === 2) {
          const partyVotersData = await getVoterCountByParty();
          setVotersByParty(
            Array.isArray(partyVotersData) ? partyVotersData : [],
          );
        }

        setLastSyncTime(new Date());
      } catch (err) {
        console.error("Error during auto-refresh:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 5000); // Recarga cada 5 segundos

    return () => clearInterval(interval);
  }, [user, candidateId, leaderId, isDashboardView]);

  return (
    <AppLayout>
      {/* Sección de estadísticas - Solo mostrar en /app/dashboard */}
      {isDashboardView && (
        <ProtectedComponent
          permission="dashboard:read"
          fallback={<Forbidden />}
        >
          <div>
            {/* ====== INDICADOR DE SINCRONIZACIÓN EN TIEMPO REAL ====== */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <h1 className="page-title">Dashboard</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {isSyncing ? (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full sync-dot"></div>
                      <span className="text-xs font-medium text-blue-600">
                        Sincronizando...
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        Actualizado hace{" "}
                        {Math.floor((new Date() - lastSyncTime) / 1000)}s
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ====== FILA 1: Cards de métricas ====== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Card Votantes - Solo si tiene permiso voters:read */}
              {can("voters:read") && (
                <div className="metric-card metric-card-entrance metric-card-gradient bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-3xl sm:text-4xl font-bold ${loadingVoters ? "metric-loading" : "number-update"} text-green-600`}
                      >
                        {loadingVoters ? (
                          <span className="fade-in-out">...</span>
                        ) : (
                          totalVoters.toLocaleString()
                        )}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                        Votantes
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <UserGroupIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {loadingVoters
                        ? "Actualizando..."
                        : "Actualizado en tiempo real"}
                    </span>
                  </div>
                </div>
              )}

              {/* Card Candidatos - Solo si tiene permiso candidates:read */}
              {can("candidates:read") && (
                <div className="metric-card metric-card-entrance metric-card-gradient bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-3xl sm:text-4xl font-bold ${loadingCandidates ? "metric-loading" : "number-update"} text-orange-500`}
                      >
                        {loadingCandidates ? (
                          <span className="fade-in-out">...</span>
                        ) : (
                          totalCandidates.toLocaleString()
                        )}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                        Candidatos
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <StarIcon className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {loadingCandidates
                        ? "Actualizando..."
                        : "Actualizado en tiempo real"}
                    </span>
                  </div>
                </div>
              )}

              {/* Card Líderes - Solo si tiene permiso leaders:read */}
              {can("leaders:read") && (
                <div className="metric-card metric-card-entrance metric-card-gradient bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-3xl sm:text-4xl font-bold ${loadingLeaders ? "metric-loading" : "number-update"} text-orange-500`}
                      >
                        {loadingLeaders ? (
                          <span className="fade-in-out">...</span>
                        ) : (
                          totalLeaders.toLocaleString()
                        )}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                        Líderes
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <UserIcon className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {loadingLeaders
                        ? "Actualizando..."
                        : "Actualizado en tiempo real"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ====== FILA 2A: Gráficos de Votantes (Partidos + Candidatos) ====== */}
            {user?.roleId === 2 && can("candidates:read") && (
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
                {/* Gráfico de Votantes por Partido */}
                <div className="flex-1 flex flex-col">
                  <VotersByParty
                    data={loadingVotersByParty ? [] : votersByParty}
                  />
                </div>

                {/* Gráfico de Votantes por Candidato */}
                <div className="flex-1 flex flex-col">
                  <VotersByCandidate
                    data={loadingVotersByCandidate ? [] : votersByCandidate}
                  />
                </div>
              </div>
            )}
          </div>
        </ProtectedComponent>
      )}

      {/* Contenido de las sub-páginas renderizadas por el Outlet */}
      <Outlet />
    </AppLayout>
  );
}
