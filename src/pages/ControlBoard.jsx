import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getCampaignNovelties,
  getControlBoard,
} from "../api/election-day";
import { useUser } from "../context/UserContext";
import { usePermission } from "../hooks/usePermission";

const severityClass = {
  critica: "bg-red-100 text-red-700 border-l-red-500",
  alta: "bg-orange-100 text-orange-700 border-l-orange-500",
  media: "bg-amber-100 text-amber-700 border-l-amber-500",
  baja: "bg-emerald-100 text-emerald-700 border-l-emerald-500",
};

export default function ControlBoard() {
  const { user } = useUser();
  const { can } = usePermission();
  const canReadNovelties = can("novelties:read");
  const [board, setBoard] = useState(null);
  const [novelties, setNovelties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.roleId === 1) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const campaignId = user?.campaignIds?.[0];
        const boardData = await getControlBoard(campaignId);
        setBoard(boardData);

        if (canReadNovelties) {
          try {
            const noveltyData = await getCampaignNovelties(campaignId);
            setNovelties(
              Array.isArray(noveltyData)
                ? noveltyData
                : noveltyData?.data || boardData?.recentNovelties || [],
            );
          } catch {
            setNovelties(boardData?.recentNovelties || []);
          }
        } else {
          setNovelties(boardData?.recentNovelties || []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "No se pudo cargar el tablero de control",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.campaignIds, user?.roleId, canReadNovelties]);

  if (user?.roleId === 1) {
    return <Navigate to="/forbidden" replace />;
  }

  if (loading) {
    return (
      <div className="app-card p-8 text-center text-gray-600">
        Cargando tablero de control...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">Tablero de control</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const kpis = board?.kpis || {};
  const tables = Array.isArray(board?.tables) ? board.tables : [];
  const noveltyStats = board?.noveltyStats || {};
  const recentNovelties =
    novelties.length > 0
      ? novelties
      : Array.isArray(board?.recentNovelties)
        ? board.recentNovelties
        : [];

  const kpiCards = [
    { label: "Puestos", value: kpis.puestos ?? kpis.booths ?? 0 },
    { label: "Mesas", value: kpis.mesas ?? kpis.tables ?? 0 },
    { label: "Aperturas", value: kpis.aperturas ?? kpis.openings ?? 0 },
    { label: "En operación", value: kpis.operacion ?? kpis.inOperation ?? 0 },
    { label: "Cierres", value: kpis.cierres ?? kpis.closings ?? 0 },
    { label: "Reportes", value: kpis.reportes ?? kpis.reports ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Tablero de control</h1>
        <p className="text-gray-500 text-sm mt-2">
          Seguimiento en tiempo real de la campaña asignada
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="app-card p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {kpi.label}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Number(kpi.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Detalle por mesa
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F9FC] border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Municipio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Puesto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Mesa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Testigo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Novedades
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Sin mesas reportadas
                    </td>
                  </tr>
                ) : (
                  tables.map((table, index) => (
                    <tr key={table.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {table.municipalityName || table.municipality || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {table.votingBoothName || table.boothName || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {table.tableNumber ?? table.mesa ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                          {table.status || table.currentStatus || "sin_reporte"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {table.witnessEmail ||
                          table.witnessName ||
                          table.witness ||
                          "-"}
                      </td>
                      <td className="px-4 py-3">
                        {table.noveltiesCount ??
                          table.noveltyCount ??
                          (Array.isArray(table.novelties)
                            ? table.novelties.length
                            : 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-card p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Novedades por severidad
            </h2>
            <div className="space-y-2">
              {["critica", "alta", "media", "baja"].map((severity) => (
                <div
                  key={severity}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-gray-700">{severity}</span>
                  <span className="font-bold text-gray-900">
                    {noveltyStats[severity] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Novedades recientes
            </h2>
            {recentNovelties.length === 0 ? (
              <p className="text-sm text-gray-500">Sin novedades recientes</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentNovelties.map((novelty, index) => (
                  <div
                    key={novelty.id || index}
                    className={`rounded-xl border border-l-4 p-3 ${
                      severityClass[novelty.severity] ||
                      "bg-gray-50 text-gray-700 border-l-gray-400"
                    }`}
                  >
                    <p className="font-semibold">{novelty.title}</p>
                    <p className="text-sm mt-1 opacity-90">
                      {novelty.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
