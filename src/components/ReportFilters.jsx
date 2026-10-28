import { useState, useEffect, useMemo } from "react";
import { getAllLeaders } from "../api/leaders";
import { getAllCandidates } from "../api/candidates";
import { getDepartments, getMunicipalities } from "../api/departments";
import { getCorporations } from "../api/corporations";
import { getVotingBooths } from "../api/votingbooths";
import { getPoliticalStatuses } from "../api/political-statuses";

export default function ReportFilters({ onFiltersChange, aggregations = {}, currentFilters = {} }) {
  const filters = {
    gender: "",
    leaderId: "",
    corporationId: "",
    candidateId: "",
    politicalStatusId: "",
    departmentId: "",
    municipalityId: "",
    votingBoothId: "",
    votingTableId: "",
    ...currentFilters,
  };

  const [leaders, setLeaders] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [politicalStatuses, setPoliticalStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [votingBooths, setVotingBooths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [
          leadersData,
          candidatesData,
          corporationsData,
          politicalStatusesData,
          departmentsData,
          boothsData,
        ] = await Promise.all([
          getAllLeaders(),
          getAllCandidates(),
          getCorporations(),
          getPoliticalStatuses(),
          getDepartments(),
          getVotingBooths(),
        ]);
        setLeaders(Array.isArray(leadersData) ? leadersData : []);
        setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
        setCorporations(
          Array.isArray(corporationsData) ? corporationsData : [],
        );
        setPoliticalStatuses(
          Array.isArray(politicalStatusesData)
            ? politicalStatusesData
            : politicalStatusesData?.data || [],
        );
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        setVotingBooths(Array.isArray(boothsData) ? boothsData : []);
      } catch (error) {
        console.error("Error loading filter options:", error);
        setLeaders([]);
        setCandidates([]);
        setCorporations([]);
        setPoliticalStatuses([]);
        setDepartments([]);
        setVotingBooths([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = filters.departmentId ? await getMunicipalities(filters.departmentId) : [];
        if (active) setMunicipalities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading municipalities:", error);
        if (active) setMunicipalities([]);
      }
    };
    load();
    return () => { active = false; };
  }, [filters.departmentId]);

  // Filtrar puestos de votación cuando cambia el municipio
  const filteredBooths = useMemo(
    () => filters.municipalityId
      ? votingBooths.filter(
        (booth) => booth.municipalityId === parseInt(filters.municipalityId),
      )
      : [],
    [filters.municipalityId, votingBooths],
  );

  // Generar mesas cuando cambia el puesto de votación
  const mesas = useMemo(() => {
    if (filters.votingBoothId) {
      const selectedBooth = filteredBooths.find(
        (booth) => booth.id === parseInt(filters.votingBoothId),
      );
      if (selectedBooth && selectedBooth.mesas) {
        return Array.from(
          { length: selectedBooth.mesas },
          (_, i) => ({
            number: i + 1,
            label: `Mesa ${i + 1}`,
          }),
        );
      }
    }
    return [];
  }, [filters.votingBoothId, filteredBooths]);

  // Filtrar candidatos cuando cambia la corporación
  const filteredCandidates = useMemo(() => {
    if (filters.corporationId) {
      return candidates.filter((c) => {
        // Manejo seguro del objeto corporation
        const corporationId =
          typeof c.corporation === "object"
            ? c.corporation?.id
            : c.corporationId;
        return corporationId === parseInt(filters.corporationId);
      });
    }
    return candidates;
  }, [filters.corporationId, candidates]);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };

    // Si cambia el departamento, resetea el municipio y puesto de votación
    if (key === "departmentId" && value !== filters.departmentId) {
      newFilters.municipalityId = "";
      newFilters.votingBoothId = "";
      newFilters.votingTableId = "";
    }

    // Si cambia el municipio, resetea el puesto de votación
    if (key === "municipalityId" && value !== filters.municipalityId) {
      newFilters.votingBoothId = "";
      newFilters.votingTableId = "";
    }

    // Si cambia el puesto de votación, resetea la mesa
    if (key === "votingBoothId" && value !== filters.votingBoothId) {
      newFilters.votingTableId = "";
    }

    if (key === "corporationId" && value !== filters.corporationId) {
      newFilters.candidateId = "";
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      gender: "",
      leaderId: "",
      corporationId: "",
      candidateId: "",
      politicalStatusId: "",
      departmentId: "",
      municipalityId: "",
      votingBoothId: "",
      votingTableId: "",
    };
    onFiltersChange(emptyFilters);
  };

  if (loading) {
    return (
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow text-sm sm:text-base">
        <p className="text-gray-500">Cargando filtros...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow mb-4 sm:mb-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
        Filtros Dinámicos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Estado político */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado político
          </label>
          <select
            value={filters.politicalStatusId}
            onChange={(e) =>
              handleFilterChange("politicalStatusId", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados políticos</option>
            {politicalStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name || "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Género
          </label>
          <select
            value={filters.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
          {aggregations?.byGender && (
            <p className="text-xs text-gray-500 mt-1">
              Totales: {aggregations.byGender.length} opciones
            </p>
          )}
        </div>

        {/* Líder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Líder
          </label>
          <select
            value={filters.leaderId}
            onChange={(e) => handleFilterChange("leaderId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los líderes</option>
            {leaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.name || "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Corporación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corporación
          </label>
          <select
            value={filters.corporationId}
            onChange={(e) =>
              handleFilterChange("corporationId", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las corporaciones</option>
            {corporations.map((corp) => (
              <option key={corp.id} value={corp.id}>
                {corp.name || "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Candidato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Candidato
          </label>
          <select
            value={filters.candidateId}
            onChange={(e) => handleFilterChange("candidateId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los candidatos</option>
            {filteredCandidates.map((candidate) => {
              // Manejo seguro del objeto corporation
              const corporationName =
                typeof candidate.corporation === "object"
                  ? candidate.corporation?.name || "Sin partido"
                  : candidate.corporationName || "Sin partido";

              return (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name || "Sin nombre"} ({corporationName})
                </option>
              );
            })}
          </select>
        </div>

        {/* Departamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento
          </label>
          <select
            value={filters.departmentId}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los departamentos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name || "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Municipio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Municipio
          </label>
          <select
            value={filters.municipalityId}
            onChange={(e) =>
              handleFilterChange("municipalityId", e.target.value)
            }
            disabled={!filters.departmentId || municipalities.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Todos los municipios</option>
            {municipalities.map((mun) => (
              <option key={mun.id} value={mun.id}>
                {mun.name || "Sin nombre"}
              </option>
            ))}
          </select>
          {!filters.departmentId && (
            <p className="text-xs text-gray-400 mt-1">
              Selecciona un departamento primero
            </p>
          )}
        </div>

        {/* Puesto de Votación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puesto de Votación
          </label>
          <select
            value={filters.votingBoothId}
            onChange={(e) =>
              handleFilterChange("votingBoothId", e.target.value)
            }
            disabled={!filters.municipalityId || filteredBooths.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Todos los puestos</option>
            {filteredBooths.map((booth) => (
              <option key={booth.id} value={booth.id}>
                {booth.name || `Puesto ${booth.id}`}
              </option>
            ))}
          </select>
          {!filters.municipalityId && (
            <p className="text-xs text-gray-400 mt-1">
              Selecciona un municipio primero
            </p>
          )}
        </div>

        {/* Mesa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mesa
          </label>
          <select
            value={filters.votingTableId}
            onChange={(e) =>
              handleFilterChange("votingTableId", e.target.value)
            }
            disabled={!filters.votingBoothId || mesas.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Todas las mesas</option>
            {mesas.map((mesa) => (
              <option key={mesa.number} value={mesa.label}>
                {mesa.label}
              </option>
            ))}
          </select>
          {!filters.votingBoothId && (
            <p className="text-xs text-gray-400 mt-1">
              Selecciona un puesto primero
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={clearFilters}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2 bg-gray-300 text-gray-800 text-sm sm:text-base rounded-md hover:bg-gray-400 transition"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
