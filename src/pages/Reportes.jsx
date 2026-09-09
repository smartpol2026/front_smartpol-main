import React, { useState, useEffect } from "react";
import { getVoterReport, getVoterReportForExport } from "../api/reports";
import { getLeaderByUserId } from "../api/leaders";
import { getCandidateByUserId } from "../api/candidates";
import ReportFilters from "../components/ReportFilters";
import AggregationCounters from "../components/AggregationCounters";
import VotersTable from "../components/VotersTable";
import { ProtectedComponent } from "../components/ProtectedComponent";
import { useUser } from "../context/UserContext";

export default function Reportes() {
  const { user } = useUser();
  const [voters, setVoters] = useState([]);
  const [allVoters, setAllVoters] = useState([]); // Todos los votantes para búsqueda
  const [aggregations, setAggregations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [candidateId, setCandidateId] = useState(null);
  const [loadingCandidateId, setLoadingCandidateId] = useState(
    user?.roleId === 3,
  );
  const [leaderId, setLeaderId] = useState(null);
  const [loadingLeaderId, setLoadingLeaderId] = useState(user?.roleId === 4);

  // Cargar candidateId si el usuario es candidato, y leaderId si es líder
  useEffect(() => {
    const loadData = async () => {
      try {
        // Si es candidato, obtener su candidateId
        if (user?.roleId === 3) {
          try {
            const candidate = await getCandidateByUserId(user.id);
            if (candidate?.id) {
              setCandidateId(candidate.id);
            }
          } catch (err) {
            console.error("Error loading candidate:", err);
          } finally {
            setLoadingCandidateId(false);
          }
        } else {
          setCandidateId(null);
          setLoadingCandidateId(false);
        }

        // Si es líder, obtener su leaderId
        if (user?.roleId === 4) {
          try {
            const leader = await getLeaderByUserId(user.id);
            if (leader?.id) {
              setLeaderId(leader.id);
            }
          } catch (err) {
            console.error("Error loading leader:", err);
          } finally {
            setLoadingLeaderId(false);
          }
        } else {
          setLeaderId(null);
          setLoadingLeaderId(false);
        }
      } catch (err) {
        setLoadingCandidateId(false);
        setLoadingLeaderId(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    // Protección: si es candidato o líder pero aún está cargando sus IDs, no ejecutar
    if (user?.roleId === 3 && loadingCandidateId) {
      return;
    }
    if (user?.roleId === 3 && !candidateId) {
      return;
    }
    if (user?.roleId === 4 && loadingLeaderId) {
      return;
    }
    if (user?.roleId === 4 && !leaderId) {
      return;
    }

    loadReport(filters, currentPage);
  }, [
    filters,
    currentPage,
    candidateId,
    loadingCandidateId,
    leaderId,
    loadingLeaderId,
    user?.roleId,
  ]);

  const loadReport = async (currentFilters, page = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Si el usuario es candidato o líder, agregar automáticamente su ID al filtro
      let filtersToApply = { ...currentFilters };
      if (user?.roleId === 3 && candidateId) {
        filtersToApply.candidateId = candidateId;
      } else if (user?.roleId === 4 && leaderId) {
        filtersToApply.leaderId = leaderId;
      }

      const response = await getVoterReport({
        ...filtersToApply,
        page,
        limit: 50,
      });

      console.log("Reporte recibido:", response);
      console.log("Total de votantes:", response.total);
      console.log("Cantidad de datos:", response.data?.length);

      const data = response.data || [];
      setVoters(data);
      setAggregations(response.aggregations || null);

      // Asegurar que el total coincida con los datos reales
      const totalVoters = data.length > 0 ? response.total : 0;

      setPagination({
        page: response.page || 1,
        limit: response.limit || 50,
        total: totalVoters,
      });
    } catch (error) {
      console.error("Error loading report:", error);
      setError(error.message || "Error al cargar el reporte");
      setVoters([]);
      setAggregations(null);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAllVoters = async () => {
    setLoadingAll(true);
    try {
      // Si el usuario es candidato o líder, agregar automáticamente su ID al filtro
      let filtersToApply = { ...activeFilters };
      if (user?.roleId === 3 && candidateId) {
        filtersToApply.candidateId = candidateId;
      } else if (user?.roleId === 4 && leaderId) {
        filtersToApply.leaderId = leaderId;
      }

      const response = await getVoterReportForExport(filtersToApply);
      setAllVoters(response.data || []);
    } catch (error) {
      console.error("Error loading all voters for search:", error);
      setAllVoters([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setActiveFilters(newFilters);
    setCurrentPage(1); // Reset a página 1
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleExportRequest = async () => {
    try {
      // Obtener TODOS los datos sin paginación para la exportación
      const response = await getVoterReportForExport(activeFilters);
      return response.data || [];
    } catch (error) {
      console.error("Error al obtener datos para exportación:", error);
      throw error;
    }
  };

  const handleCounterClick = (filterType, value) => {
    let newFilters = { ...filters };

    if (filterType === "gender") {
      newFilters.gender = newFilters.gender === value ? "" : value;
    } else if (filterType === "leaderId") {
      newFilters.leaderId = newFilters.leaderId == value ? "" : value;
    } else if (filterType === "candidateId") {
      newFilters.candidateId = newFilters.candidateId == value ? "" : value;
    } else if (filterType === "location") {
      // Toggle location filter
      if (
        newFilters.departmentId == value.departmentId &&
        newFilters.municipalityId == value.municipalityId
      ) {
        delete newFilters.departmentId;
        delete newFilters.municipalityId;
      } else {
        newFilters.departmentId = value.departmentId;
        newFilters.municipalityId = value.municipalityId;
      }
    }

    setFilters(newFilters);
    setCurrentPage(1); // Reset a página 1
  };

  return (
    <ProtectedComponent
      permission="reports:read"
      fallback={
        <div className="p-4 sm:p-6 lg:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Acceso denegado
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            No tienes permiso para ver los reportes
          </p>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
        {/* Header */}
        <div>
          {/* Header */}
          <div>
            <h1 className="page-title">Informe General de Votantes</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Visualiza, analiza y exporta la información de votantes registrada
              en SMARTPOL
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
              <p className="font-semibold">Error al cargar los datos</p>
              <p className="text-xs sm:text-sm">{error}</p>
              <p className="text-xs mt-2 text-red-600">
                Verifica que el servidor backend esté ejecutándose en
                http://localhost:3000
              </p>
            </div>
          )}

          {/* Filtros Dinámicos */}
          {!error && (
            <ReportFilters
              onFiltersChange={handleFiltersChange}
              aggregations={aggregations}
            />
          )}

          {/* Contadores Interactivos */}
          {aggregations && !error && (
            <AggregationCounters
              aggregations={aggregations}
              onCounterClick={handleCounterClick}
            />
          )}

          {/* Filtros activos */}
          {Object.keys(activeFilters).length > 0 && !error && (
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">
                Filtros activos:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 sm:px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs sm:text-sm font-medium"
                  >
                    {key}:{" "}
                    {typeof value === "object" ? JSON.stringify(value) : value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de Votantes */}
          {!error && (
            <VotersTable
              voters={voters}
              filters={activeFilters}
              loading={loading}
              pagination={pagination}
              currentPageProp={currentPage}
              onPageChange={handlePageChange}
              onExportRequest={handleExportRequest}
            />
          )}
        </div>
      </div>
    </ProtectedComponent>
  );
}
