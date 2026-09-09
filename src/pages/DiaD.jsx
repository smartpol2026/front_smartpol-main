import React, { useState } from "react";
import VoterSearchAndRegister from "../components/VoterSearchAndRegister";
import VotingStatsCounters from "../components/VotingStatsCounters";
import VotersTrackingTable from "../components/VotersTrackingTable";
import AnalysisFilters from "../components/AnalysisFilters";
import AnalysisTable from "../components/AnalysisTable";

export default function DiaD() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("registro");
  const [trackingFilter, setTrackingFilter] = useState("expected");
  const [analysisFilters, setAnalysisFilters] = useState({});

  const handleVoteAction = () => {
    // Incrementar el trigger para forzar actualización en VotingStatsCounters
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFilterSelect = (filter) => {
    setTrackingFilter(filter);
    setActiveTab("seguimiento");
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Día D</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("registro")}
              className={`py-4 px-2 font-semibold text-lg transition-colors duration-200 ${
                activeTab === "registro"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Registro
            </button>
            <button
              onClick={() => setActiveTab("seguimiento")}
              className={`py-4 px-2 font-semibold text-lg transition-colors duration-200 ${
                activeTab === "seguimiento"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Seguimiento
            </button>
            <button
              onClick={() => setActiveTab("analisis")}
              className={`py-4 px-2 font-semibold text-lg transition-colors duration-200 ${
                activeTab === "analisis"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Análisis
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="w-full">
        {/* Tab Content */}
        {activeTab === "registro" && (
          <>
            {/* Stats Section */}
            <div className="mb-4">
              <VotingStatsCounters
                refreshTrigger={refreshTrigger}
                onFilterSelect={handleFilterSelect}
              />
            </div>

            {/* Search Section */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-7 lg:p-9 border border-gray-100">
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
                  Busca al votante por su número de cédula y registra su voto de
                  forma segura
                </p>
                {/* Search Component */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100">
                  <VoterSearchAndRegister onVoteRegistered={handleVoteAction} />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "seguimiento" && (
          <VotersTrackingTable
            refreshTrigger={refreshTrigger}
            initialFilter={trackingFilter}
          />
        )}

        {activeTab === "analisis" && (
          <div>
            {/* Filtros Section */}
            <div className="mb-6">
              <AnalysisFilters onFiltersChange={setAnalysisFilters} />
            </div>

            {/* Tabla Section */}
            <AnalysisTable filters={analysisFilters} />
          </div>
        )}
      </div>
    </>
  );
}
