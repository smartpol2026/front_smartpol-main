import React, { useState, useEffect } from "react";
import {
  getVotingStats,
  getRegisteredVoters,
  getPendingVoters,
} from "../api/voters";
import { useAlert } from "../hooks/useAlert";
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import "../styles/dashboard-animations.css";

export default function VotingStatsCounters({
  refreshTrigger,
  onFilterSelect,
}) {
  const [stats, setStats] = useState({
    expected: 0,
    registered: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({ data: [], pagination: {} });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const { alert } = useAlert();

  const loadStats = async () => {
    try {
      const data = await getVotingStats();
      setStats(data);
    } catch (error) {
      alert("Error al cargar estadísticas de votación", "error");
      console.error("Error loading voting stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Responder a actualizaciones externas (cuando se registra o elimina un voto)
  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsRefreshing(true);
      loadStats().finally(() => setIsRefreshing(false));
    }
  }, [refreshTrigger]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  const openVotersList = async (type) => {
    setModalType(type);
    setModalPage(1);
    setModalLoading(true);
    setModalOpen(true);

    try {
      const data =
        type === "registered"
          ? await getRegisteredVoters(1, 20)
          : await getPendingVoters(1, 20);
      setModalData(data);
    } catch (error) {
      alert("Error al cargar la lista de votantes", "error");
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const loadMoreVoters = async (page) => {
    setModalLoading(true);
    try {
      const data =
        modalType === "registered"
          ? await getRegisteredVoters(page, 20)
          : await getPendingVoters(page, 20);
      setModalData(data);
      setModalPage(page);
    } catch (error) {
      alert("Error al cargar más votantes", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const getPercentage = (part, total) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  const registeredPercentage = getPercentage(stats.registered, stats.expected);
  const pendingPercentage = getPercentage(stats.pending, stats.expected);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 flex items-center justify-center min-h-56 border border-blue-100">
        <div className="text-center">
          <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-700 font-medium">
            Cargando estadísticas en vivo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Expected Votes Counter */}
        <button
          onClick={() => onFilterSelect && onFilterSelect("expected")}
          disabled={!onFilterSelect}
          className="metric-card metric-card-entrance metric-card-gradient bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all disabled:cursor-default"
        >
          <div className="flex items-start justify-between text-left">
            <div className="flex-1">
              <p
                className={`text-3xl sm:text-4xl font-bold ${loading ? "metric-loading" : "number-update"} text-green-600`}
              >
                {loading ? (
                  <span className="fade-in-out">...</span>
                ) : (
                  stats.expected.toLocaleString()
                )}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                Votos Esperados
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {loading ? "Actualizando..." : "Actualizado en tiempo real"}
            </span>
          </div>
        </button>

        {/* Registered Votes Counter */}
        <button
          onClick={() => onFilterSelect && onFilterSelect("registered")}
          disabled={!onFilterSelect}
          className="metric-card metric-card-entrance metric-card-gradient bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all disabled:cursor-default"
        >
          <div className="flex items-start justify-between text-left">
            <div className="flex-1">
              <p
                className={`text-3xl sm:text-4xl font-bold ${loading ? "metric-loading" : "number-update"} text-green-600`}
              >
                {loading ? (
                  <span className="fade-in-out">...</span>
                ) : (
                  stats.registered.toLocaleString()
                )}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                Votos Registrados
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {loading ? "Actualizando..." : "Actualizado en tiempo real"}
            </span>
          </div>
        </button>

        {/* Pending Votes Counter */}
        <button
          onClick={() => onFilterSelect && onFilterSelect("pending")}
          disabled={!onFilterSelect}
          className="metric-card metric-card-entrance metric-card-gradient bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all disabled:cursor-default"
        >
          <div className="flex items-start justify-between text-left">
            <div className="flex-1">
              <p
                className={`text-3xl sm:text-4xl font-bold ${loading ? "metric-loading" : "number-update"} text-orange-500`}
              >
                {loading ? (
                  <span className="fade-in-out">...</span>
                ) : (
                  stats.pending.toLocaleString()
                )}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                Votos Pendientes
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {loading ? "Actualizando..." : "Actualizado en tiempo real"}
            </span>
          </div>
        </button>
      </div>

      {/* Modal de Lista de Votantes */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 sm:px-8 py-6 sm:py-7 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {modalType === "registered" ? (
                  <>
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Votantes Registrados
                    </h3>
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-6 h-6 text-orange-600" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Votantes Pendientes
                    </h3>
                  </>
                )}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-white rounded-lg transition text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {modalLoading && (
                <div className="flex justify-center items-center min-h-64">
                  <div className="text-center">
                    <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      Cargando votantes...
                    </p>
                  </div>
                </div>
              )}

              {!modalLoading && modalData.data.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium">
                    No hay votantes para mostrar
                  </p>
                </div>
              )}

              {!modalLoading && modalData.data.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  {modalData.data.map((voter) => (
                    <div
                      key={voter.id}
                      className={`flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all ${
                        modalType === "registered"
                          ? "bg-green-50 border-green-200 hover:border-green-400"
                          : "bg-orange-50 border-orange-200 hover:border-orange-400"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg flex-shrink-0 ${
                          modalType === "registered"
                            ? "bg-green-100"
                            : "bg-orange-100"
                        }`}
                      >
                        {modalType === "registered" ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        ) : (
                          <ClockIcon className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {voter.firstName} {voter.lastName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          📋 Cédula:{" "}
                          <span className="font-mono font-semibold">
                            {voter.identification}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {voter.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          📅{" "}
                          {new Date(voter.createdAt).toLocaleDateString(
                            "es-ES",
                          )}{" "}
                          -{" "}
                          {new Date(voter.createdAt).toLocaleTimeString(
                            "es-ES",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer - Pagination */}
            {!modalLoading && modalData.pagination?.pages > 1 && (
              <div className="px-6 sm:px-8 py-5 sm:py-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center gap-4 flex-wrap">
                <p className="text-sm text-gray-600 font-medium">
                  Página{" "}
                  <span className="font-bold text-gray-900">{modalPage}</span>{" "}
                  de{" "}
                  <span className="font-bold text-gray-900">
                    {modalData.pagination.pages}
                  </span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => loadMoreVoters(modalPage - 1)}
                    disabled={modalPage === 1}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => loadMoreVoters(modalPage + 1)}
                    disabled={modalPage === modalData.pagination.pages}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg disabled:cursor-not-allowed transition"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
