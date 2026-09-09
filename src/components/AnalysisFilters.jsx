import React, { useState, useEffect } from "react";
import { getDepartments, getMunicipalities } from "../api/departments";
import { getVotingBooths } from "../api/votingbooths";

export default function AnalysisFilters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    departmentId: "",
    municipalityId: "",
    votingBoothId: "",
    votingTableId: "",
  });

  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [votingBooths, setVotingBooths] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [departmentsData, boothsData] = await Promise.all([
          getDepartments(),
          getVotingBooths(),
        ]);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        setVotingBooths(Array.isArray(boothsData) ? boothsData : []);
      } catch (error) {
        console.error("Error loading filter options:", error);
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
    if (filters.departmentId) {
      loadMunicipalitiesData(filters.departmentId);
    } else {
      setMunicipalities([]);
      setFilters((prev) => ({
        ...prev,
        municipalityId: "",
        votingBoothId: "",
        votingTableId: "",
      }));
    }
  }, [filters.departmentId]);

  // Cargar puestos de votación cuando cambia el municipio
  useEffect(() => {
    if (filters.municipalityId) {
      const filtered = votingBooths.filter(
        (booth) => booth.municipalityId === parseInt(filters.municipalityId),
      );
      setFilteredBooths(filtered);
    } else {
      setFilteredBooths([]);
      setFilters((prev) => ({ ...prev, votingBoothId: "", votingTableId: "" }));
    }
  }, [filters.municipalityId, votingBooths]);

  // Generar mesas cuando cambia el puesto de votación
  useEffect(() => {
    if (filters.votingBoothId) {
      const selectedBooth = filteredBooths.find(
        (booth) => booth.id === parseInt(filters.votingBoothId),
      );
      if (selectedBooth && selectedBooth.mesas) {
        const mesasArray = Array.from(
          { length: selectedBooth.mesas },
          (_, i) => ({
            number: i + 1,
            label: `Mesa ${i + 1}`,
          }),
        );
        setMesas(mesasArray);
      } else {
        setMesas([]);
      }
    } else {
      setMesas([]);
      setFilters((prev) => ({ ...prev, votingTableId: "" }));
    }
  }, [filters.votingBoothId, filteredBooths]);

  const loadMunicipalitiesData = async (departmentId) => {
    try {
      const municipalitiesData = await getMunicipalities(departmentId);
      setMunicipalities(
        Array.isArray(municipalitiesData) ? municipalitiesData : [],
      );
    } catch (error) {
      console.error("Error loading municipalities:", error);
      setMunicipalities([]);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };

    if (key === "departmentId" && value !== filters.departmentId) {
      newFilters.municipalityId = "";
      newFilters.votingBoothId = "";
      newFilters.votingTableId = "";
    }

    if (key === "municipalityId" && value !== filters.municipalityId) {
      newFilters.votingBoothId = "";
      newFilters.votingTableId = "";
    }

    if (key === "votingBoothId" && value !== filters.votingBoothId) {
      newFilters.votingTableId = "";
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      departmentId: "",
      municipalityId: "",
      votingBoothId: "",
      votingTableId: "",
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-gray-500">Cargando filtros...</p>
      </div>
    );
  }

  const getDepartmentName = (id) => {
    return departments.find((d) => d.id === parseInt(id))?.name || "";
  };

  const getMunicipalityName = (id) => {
    return municipalities.find((m) => m.id === parseInt(id))?.name || "";
  };

  const getVotingBoothName = (id) => {
    return votingBooths.find((b) => b.id === parseInt(id))?.name || "";
  };

  return (
    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
        Filtros Dinámicos
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {/* Departamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento
          </label>
          <select
            value={filters.departmentId}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Todos los departamentos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
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
            disabled={!filters.departmentId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
          >
            <option value="">
              {!filters.departmentId
                ? "Selecciona un departamento primero"
                : "Todos los municipios"}
            </option>
            {municipalities.map((mun) => (
              <option key={mun.id} value={mun.id}>
                {mun.name}
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
            disabled={!filters.municipalityId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
          >
            <option value="">
              {!filters.municipalityId
                ? "Selecciona un municipio primero"
                : "Todos los puestos"}
            </option>
            {filteredBooths.map((booth) => (
              <option key={booth.id} value={booth.id}>
                {booth.name}
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
            disabled={!filters.votingBoothId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
          >
            <option value="">
              {!filters.votingBoothId
                ? "Selecciona un puesto primero"
                : "Todas las mesas"}
            </option>
            {mesas.map((mesa) => (
              <option key={mesa.number} value={mesa.number}>
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

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={clearFilters}
          className="w-full sm:w-auto px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-md transition-colors duration-200"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
