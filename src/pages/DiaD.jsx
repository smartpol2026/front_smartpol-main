import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import VoterSearchAndRegister from "../components/VoterSearchAndRegister";
import VotingStatsCounters from "../components/VotingStatsCounters";
import VotersTrackingTable from "../components/VotersTrackingTable";
import AnalysisFilters from "../components/AnalysisFilters";
import AnalysisTable from "../components/AnalysisTable";

const VALID_VIEWS = ["registro", "seguimiento", "analisis"];

const VIEW_TITLES = {
  registro: "Registro",
  seguimiento: "Seguimiento",
  analisis: "Análisis",
};

export default function DiaD() {
  const { view } = useParams();
  const navigate = useNavigate();
  const activeView = view || "registro";

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [trackingFilter, setTrackingFilter] = useState("expected");
  const [analysisFilters, setAnalysisFilters] = useState({});

  useEffect(() => {
    if (!view) {
      navigate("/app/dia-d/registro", { replace: true });
      return;
    }
    if (!VALID_VIEWS.includes(view)) {
      navigate("/app/dia-d/registro", { replace: true });
    }
  }, [view, navigate]);

  if (!view || !VALID_VIEWS.includes(view)) {
    return <Navigate to="/app/dia-d/registro" replace />;
  }

  const handleVoteAction = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFilterSelect = (filter) => {
    setTrackingFilter(filter);
    navigate("/app/dia-d/seguimiento");
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="page-title">Día D</h1>
        <p className="text-gray-500 text-sm mt-2">
          {VIEW_TITLES[activeView] || "Registro"}
        </p>
      </div>

      <div className="w-full">
        {activeView === "registro" && (
          <>
            <div className="mb-4">
              <VotingStatsCounters
                refreshTrigger={refreshTrigger}
                onFilterSelect={handleFilterSelect}
              />
            </div>

            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-7 lg:p-9 border border-gray-100">
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
                  Busca al votante por su número de cédula y registra su voto de
                  forma segura
                </p>
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100">
                  <VoterSearchAndRegister onVoteRegistered={handleVoteAction} />
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === "seguimiento" && (
          <VotersTrackingTable
            refreshTrigger={refreshTrigger}
            initialFilter={trackingFilter}
          />
        )}

        {activeView === "analisis" && (
          <div>
            <div className="mb-6">
              <AnalysisFilters onFiltersChange={setAnalysisFilters} />
            </div>
            <AnalysisTable filters={analysisFilters} />
          </div>
        )}
      </div>
    </>
  );
}
