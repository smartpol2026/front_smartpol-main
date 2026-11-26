import { useState, useEffect } from "react";
import {
  getVoterReport,
  getVoterReportForExport,
} from "../api/reports";
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
  const [aggregations, setAggregations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
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
      } catch {
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

    let active = true;
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        // Si el usuario es candidato o líder, agregar automáticamente su ID al filtro
        const filtersToApply = { ...filters };
        if (user?.roleId === 3 && candidateId) {
          filtersToApply.candidateId = candidateId;
        } else if (user?.roleId === 4 && leaderId) {
          filtersToApply.leaderId = leaderId;
        }

        const response = await getVoterReport({
          ...filtersToApply,
          page: currentPage,
          limit: 50,
        });
        if (!active) return;

        setVoters(response.data || []);
        setAggregations(response.aggregations || null);
        setPagination({
          page: response.page || currentPage,
          limit: response.limit || 50,
          total: response.total ?? 0,
        });
      } catch (error) {
        if (!active) return;
        console.error("Error loading report:", error);
        setError(error.message || "Error al cargar el reporte");
        setVoters([]);
        setAggregations(null);
        setPagination(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadReport();
    return () => { active = false; };
  }, [filters, currentPage, candidateId, loadingCandidateId, leaderId, loadingLeaderId, user?.roleId]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset a página 1
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleExportRequest = async () => {
    try {
      const filtersToExport = { ...filters };
      if (user?.roleId === 3 && candidateId) {
        filtersToExport.candidateId = candidateId;
      } else if (user?.roleId === 4 && leaderId) {
        filtersToExport.leaderId = leaderId;
      }

      // Obtener TODOS los datos sin paginación para la exportación
      const response = await getVoterReportForExport(filtersToExport);
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
            <h1 className="page-title">
              Informe General de Votantes
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Visualiza, analiza y exporta la información de votantes registrada en SMARTPOL
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
              <p className="font-semibold">Error al cargar los datos</p>
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Filtros Dinámicos */}
          <ReportFilters
            onFiltersChange={handleFiltersChange}
            aggregations={aggregations}
            currentFilters={filters}
          />

          {/* Contadores Interactivos */}
          {aggregations && !error && (
            <AggregationCounters
              aggregations={aggregations}
              onCounterClick={handleCounterClick}
            />
          )}

          {/* Tabla de Votantes */}
          {!error && (
            <VotersTable
              voters={voters}
              loading={loading}
              pagination={pagination}
              currentPageProp={currentPage}
              onPageChange={handlePageChange}
              onExportRequest={handleExportRequest}
              exportPermission="reports:read"
              fileName="Informe_Votantes"
            />
          )}
        </div>
      </div>
    </ProtectedComponent>
  );
}
