import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { ProtectedComponent } from "../components/ProtectedComponent";
import Forbidden from "./Forbidden";
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

const REFRESH_INTERVAL_MS = 10000;

export default function Dashboard() {
  const location = useLocation();
  const { user } = useUser();
  const { can } = usePermission();

  const [totalVoters, setTotalVoters] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalLeaders, setTotalLeaders] = useState(0);
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

  const isDashboardView = location.pathname === "/app/dashboard";

  useEffect(() => {
    const loadRoleContext = async () => {
      if (!user) return;

      setCandidateId(null);
      setLeaderId(null);

      try {
        if (user.roleId === 3) {
          const candidate = await getCandidateByUserId(user.id);
          if (candidate?.id) {
            setCandidateId(candidate.id);
          }
        }

        if (user.roleId === 4) {
          const leader = await getLeaderByUserId(user.id);
          if (leader?.id) {
            setLeaderId(leader.id);
          }
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };

    loadRoleContext();
  }, [user]);

  useEffect(() => {
    if (!isDashboardView || !user) return;
    if (user.roleId === 3 && candidateId === null) return;
    if (user.roleId === 4 && leaderId === null) return;

    let cancelled = false;
    let inFlight = false;

    const loadDashboardData = async (isInitialLoad = false) => {
      if (cancelled || inFlight) return;
      inFlight = true;

      if (isInitialLoad) {
        setLoadingVoters(true);
        setLoadingCandidates(true);
        setLoadingLeaders(true);
        if (user.roleId === 2) {
          setLoadingVotersByCandidate(true);
          setLoadingVotersByParty(true);
        }
      } else {
        setIsSyncing(true);
      }

      try {
        const votersPromise =
          user.roleId === 3 && candidateId
            ? getVotersByCandidateWithAssignments(candidateId, 1, 1)
            : user.roleId === 4 && leaderId
              ? getVotersByLeaderWithAssignments(leaderId, 1, 1)
              : getVotersWithAssignments(1, 1);

        const requests = [
          votersPromise,
          getCandidatesWithPagination(1, 1, ""),
          getLeadersWithPagination(1, 1, ""),
        ];

        if (user.roleId === 2) {
          requests.push(getVoterCountByCandidate(), getVoterCountByParty());
        }

        const [
          votersData,
          candidatesData,
          leadersData,
          candidateVotersData,
          partyVotersData,
        ] = await Promise.all(requests);

        if (cancelled) return;

        setTotalVoters(votersData?.total ?? 0);
        setTotalCandidates(candidatesData?.total ?? 0);
        setTotalLeaders(leadersData?.total ?? 0);

        if (user.roleId === 2) {
          setVotersByCandidate(
            Array.isArray(candidateVotersData) ? candidateVotersData : [],
          );
          setVotersByParty(
            Array.isArray(partyVotersData) ? partyVotersData : [],
          );
        }

        setLastSyncTime(new Date());
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading dashboard data:", err);
          if (isInitialLoad) {
            setTotalVoters(0);
            setTotalCandidates(0);
            setTotalLeaders(0);
            setVotersByCandidate([]);
            setVotersByParty([]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingVoters(false);
          setLoadingCandidates(false);
          setLoadingLeaders(false);
          setLoadingVotersByCandidate(false);
          setLoadingVotersByParty(false);
          setIsSyncing(false);
        }
        inFlight = false;
      }
    };

    loadDashboardData(true);
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isDashboardView, user, candidateId, leaderId]);

  return (
    <AppLayout>
      {isDashboardView && (
        <ProtectedComponent
          permission="dashboard:read"
          fallback={<Forbidden />}
        >
          <div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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

            {user?.roleId === 2 && can("candidates:read") && (
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
                <div className="flex-1 flex flex-col">
                  <VotersByParty
                    data={loadingVotersByParty ? [] : votersByParty}
                  />
                </div>

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

      <Outlet />
    </AppLayout>
  );
}
