import React, { useState, useEffect } from "react";
import {
  getVotingStats,
  getVotersWithAssignments,
  getRegisteredVoters,
  getPendingVoters,
  searchVotersByTrackingFilter,
} from "../api/voters";
import { getVotingBooths } from "../api/votingbooths";
import { getDepartments } from "../api/departments";
import Pagination from "./Pagination";
import { useAlert } from "../hooks/useAlert";
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { exportTrackingToExcel } from "../utils/exportToExcel";
import "../styles/dashboard-animations.css";

export default function VotersTrackingTable({
  refreshTrigger,
  initialFilter = "expected",
}) {
  const { alert } = useAlert();
  const [stats, setStats] = useState({
    expected: 0,
    registered: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [voters, setVoters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const [boothsMap, setBoothsMap] = useState({});
  const [voterCandidates, setVoterCandidates] = useState({});
  const [voterLeaders, setVoterLeaders] = useState({});
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [departmentsMap, setDepartmentsMap] = useState({});
  const ITEMS_PER_PAGE = 20;

  // Cargar estadísticas
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

  // Cargar centros de votación y departamentos
  useEffect(() => {
    const loadBooths = async () => {
      try {
        const [booths, departments] = await Promise.all([
          getVotingBooths(),
          getDepartments(),
        ]);

        const boothsMapTemp = {};
        booths.forEach((booth) => {
          boothsMapTemp[booth.id] = booth;
        });
        setBoothsMap(boothsMapTemp);

        const deptMapTemp = {};
        departments.forEach((dept) => {
          deptMapTemp[dept.id] = dept;
        });
        setDepartmentsMap(deptMapTemp);
      } catch (err) {
        console.error("Error loading voting booths and departments:", err);
      }
    };

    loadBooths();
    loadStats();
  }, []);

  // Actualizar el filtro cuando initialFilter cambie opcionalmente
  useEffect(() => {
    if (initialFilter && initialFilter !== activeFilter) {
      setActiveFilter(initialFilter);
      setCurrentPage(1);
    }
  }, [initialFilter]);

  // Resetear página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Actualizar estadísticas cada segundo
  useEffect(() => {
    const interval = setInterval(loadStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Responder a actualizaciones externas
  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsRefreshing(true);
      loadStats().finally(() => setIsRefreshing(false));
      // Resetear a la primera página para refrescar los datos
      setCurrentPage(1);
    }
  }, [refreshTrigger]);

  // Cargar votantes según el filtro activo
  useEffect(() => {
    const fetchVoters = async () => {
      setLoadingVoters(true);
      try {
        let data;
        let response;

        // Si hay un término de búsqueda, usar la búsqueda server-side
        if (searchTerm.trim()) {
          response = await searchVotersByTrackingFilter(
            activeFilter,
            searchTerm.trim(),
            currentPage,
            ITEMS_PER_PAGE,
          );
          data = {
            data: response.data,
            page: response.pagination?.page || currentPage,
            pages: response.pagination?.pages || 1,
            total: response.pagination?.total || 0,
          };
        } else {
          // Si no hay búsqueda, cargar normalmente según el filtro
          switch (activeFilter) {
            case "registered":
              response = await getRegisteredVoters(currentPage, ITEMS_PER_PAGE);
              data = {
                data: response.data,
                page: response.pagination?.page || currentPage,
                pages: response.pagination?.pages || 1,
                total: response.pagination?.total || 0,
              };
              break;
            case "pending":
              response = await getPendingVoters(currentPage, ITEMS_PER_PAGE);
              data = {
                data: response.data,
                page: response.pagination?.page || currentPage,
                pages: response.pagination?.pages || 1,
                total: response.pagination?.total || 0,
              };
              break;
            case "expected":
            default:
              data = await getVotersWithAssignments(
                currentPage,
                ITEMS_PER_PAGE,
              );
              break;
          }
        }

        setVoters(data.data);
        setCurrentPage(data.page);
        setTotalPages(data.pages);
        setTotalVoters(data.total);

        // Extraer candidatos y líderes
        const candidatesMap = {};
        const leadersMap = {};

        data.data.forEach((voter) => {
          if (voter.candidates && voter.candidates.length > 0) {
            candidatesMap[voter.id] = voter.candidates
              .map((c) => c.name)
              .filter(Boolean);
          }

          if (voter.leaders && voter.leaders.length > 0) {
            leadersMap[voter.id] = voter.leaders[0].name;
          }
        });

        setVoterCandidates(candidatesMap);
        setVoterLeaders(leadersMap);
      } catch (err) {
        alert("Error al cargar los votantes", "error");
        console.error("Error loading voters:", err);
      } finally {
        setLoadingVoters(false);
      }
    };

    fetchVoters();
  }, [activeFilter, currentPage, searchTerm, refreshTrigger]);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const getPercentage = (part, total) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  const registeredPercentage = getPercentage(stats.registered, stats.expected);
  const pendingPercentage = getPercentage(stats.pending, stats.expected);

  const enrichVoterData = (voter) => {
    let enriched = { ...voter };
    if (voter.votingBoothId && boothsMap[voter.votingBoothId]) {
      enriched.votingBooth = boothsMap[voter.votingBoothId];
    }
    // Enriquecer con departamento y municipio
    if (voter.departmentId && departmentsMap[voter.departmentId]) {
      enriched.department = departmentsMap[voter.departmentId];
    }
    if (voter.municipalityId && voter.departmentId) {
      const dept = departmentsMap[voter.departmentId];
      if (dept && dept.municipalities && Array.isArray(dept.municipalities)) {
        const mun = dept.municipalities.find(
          (m) => m.id === voter.municipalityId,
        );
        if (mun) {
          enriched.municipality = mun;
        }
      }
    }
    return enriched;
  };

  // Función para obtener todos los datos según el filtro actual con paginación
  const getAllVotersForExport = async () => {
    try {
      const allVoters = [];
      const pageSize = 100; // Máximo permitido por el backend
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        let response;

        switch (activeFilter) {
          case "registered":
            response = await getRegisteredVoters(page, pageSize);
            break;
          case "pending":
            response = await getPendingVoters(page, pageSize);
            break;
          case "expected":
          default:
            response = await getVotersWithAssignments(page, pageSize);
            break;
        }

        if (response.data && response.data.length > 0) {
          allVoters.push(...response.data);
          page++;

          // Si la página actual tiene menos de pageSize registros, no hay más páginas
          if (response.data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // Enriquecer los datos con información de departamentos y municipios
      const enrichedData = allVoters.map(enrichVoterData);
      return enrichedData;
    } catch (error) {
      console.error("Error al obtener datos para exportación:", error);
      alert("Error al obtener datos para exportación");
      setIsExporting(false);
      throw error;
    }
  };

  // Función para manejar la exportación
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);

      const votersData = await getAllVotersForExport();
      await exportTrackingToExcel(votersData, activeFilter);
    } catch (error) {
      console.error("Error en exportación:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredVoters = voters.map(enrichVoterData);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 flex items-center justify-center min-h-56 border border-blue-100">
        <div className="text-center">
          <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-700 font-medium">
            Cargando información de seguimiento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Expected Votes Counter */}
        <button
          onClick={() => handleFilterClick("expected")}
          className={`metric-card metric-card-entrance metric-card-gradient rounded-lg shadow-sm p-6 border-2 transition-all cursor-pointer ${
            activeFilter === "expected"
              ? "bg-green-50 border-green-400"
              : "bg-white border-gray-200 hover:border-green-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-3xl sm:text-4xl font-bold text-green-600">
                {stats.expected.toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                Votos Esperados
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </button>

        {/* Registered Votes Counter */}
        <button
          onClick={() => handleFilterClick("registered")}
          className={`metric-card metric-card-entrance metric-card-gradient rounded-lg shadow-sm p-6 border-2 transition-all cursor-pointer ${
            activeFilter === "registered"
              ? "bg-green-50 border-green-400"
              : "bg-white border-gray-200 hover:border-green-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-3xl sm:text-4xl font-bold text-green-600">
                {stats.registered.toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                Votos Registrados
              </p>
              <p className="text-green-600 text-xs font-semibold mt-1">
                {registeredPercentage}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </button>

        {/* Pending Votes Counter */}
        <button
          onClick={() => handleFilterClick("pending")}
          className={`metric-card metric-card-entrance metric-card-gradient rounded-lg shadow-sm p-6 border-2 transition-all cursor-pointer ${
            activeFilter === "pending"
              ? "bg-orange-50 border-orange-400"
              : "bg-white border-gray-200 hover:border-orange-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-3xl sm:text-4xl font-bold text-orange-500">
                {stats.pending.toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-2">
                Votos Pendientes
              </p>
              <p className="text-orange-500 text-xs font-semibold mt-1">
                {pendingPercentage}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
        <input
          type="text"
          placeholder="Buscar por cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Header con título y botón de exportación */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Seguimiento de Votantes
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeFilter === "registered"
                ? "Votantes que ya han votado"
                : activeFilter === "pending"
                  ? "Votantes pendientes de votación"
                  : "Votantes esperados del padrón"}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={
                loadingVoters || filteredVoters.length === 0 || isExporting
              }
              title={
                loadingVoters || filteredVoters.length === 0
                  ? "No hay datos para exportar"
                  : isExporting
                    ? "Generando archivo..."
                    : "Exportar a Excel"
              }
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-md transition flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base ${
                !loadingVoters && filteredVoters.length > 0 && !isExporting
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : isExporting
                    ? "bg-orange-500 text-white cursor-wait opacity-70"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isExporting ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Generando...
                </>
              ) : (
                <>
                  <span>📊</span> Exportar
                  <span className="text-xs">▼</span>
                </>
              )}
            </button>

            {showExportMenu &&
              !isExporting &&
              !loadingVoters &&
              filteredVoters.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={handleExport}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 text-sm"
                  >
                    <span>📈</span> Exportar a Excel
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* Loading State */}
        {loadingVoters && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <ArrowPathIcon className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Cargando votantes...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loadingVoters && filteredVoters.length === 0 && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No hay votantes para mostrar
              </p>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        {!loadingVoters && filteredVoters.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    {["Identificación", "Nombre", "Centro de Votación"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-700 text-left"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredVoters.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-800">
                        {v.identification || "No registrado"}
                      </td>

                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-900">
                        {v.firstName} {v.lastName}
                      </td>

                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-700">
                        {v.votingBooth?.name && v.votingTableId
                          ? `${v.votingBooth.name} - ${v.votingTableId}`
                          : v.votingBooth?.name || "No registrado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3 sm:space-y-4 p-4">
              {filteredVoters.map((v) => (
                <div
                  key={v.id}
                  className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200"
                >
                  <div className="font-bold text-gray-900 text-base sm:text-lg">
                    {v.firstName} {v.lastName}
                  </div>

                  <div className="text-xs sm:text-sm text-gray-700 mt-3 space-y-2">
                    <div>
                      <b>Identificación:</b>{" "}
                      {v.identification || "No registrado"}
                    </div>
                    <div>
                      <b>Centro de Votación:</b>{" "}
                      {v.votingBooth?.name && v.votingTableId
                        ? `${v.votingBooth.name} - ${v.votingTableId}`
                        : v.votingBooth?.name || "No registrado"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loadingVoters && filteredVoters.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalVoters}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
    </div>
  );
}
