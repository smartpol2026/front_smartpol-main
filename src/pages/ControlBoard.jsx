import { createElement, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { io } from "socket.io-client";
import {
  getCampaignNovelties,
  getControlBoard,
} from "../api/election-day";
import { API_URL, getToken } from "../api/config";
import { useUser } from "../context/UserContext";
import { usePermission } from "../hooks/usePermission";
import MapColombia from "../components/mapColombia";
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  LockClosedIcon,
  LockOpenIcon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const severityClass = {
  critica: "bg-red-100 text-red-700 border-l-red-500",
  alta: "bg-orange-100 text-orange-700 border-l-orange-500",
  media: "bg-amber-100 text-amber-700 border-l-amber-500",
  baja: "bg-emerald-100 text-emerald-700 border-l-emerald-500",
};

ChartJS.register(ArcElement, Tooltip, Legend);

const centerTotalPlugin = {
  id: "centerTotal",
  beforeDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const firstArc = meta.data[0];
    if (!firstArc) return;

    const total = chart.config.options.plugins.centerTotal?.total ?? 0;
    ctx.save();
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Total", firstArc.x, firstArc.y - 12);
    ctx.font = "700 28px Inter, sans-serif";
    ctx.fillText(String(total), firstArc.x, firstArc.y + 14);
    ctx.restore();
  },
};

function formatReportTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatTableStatus(status) {
  return (
    {
      apertura: "Apertura",
      en_operacion: "En operación",
      operativo: "Operativo",
      cierre: "Cierre",
      sin_novedad: "Sin novedad",
      sin_reporte: "Sin reporte",
    }[status] ||
    String(status || "Sin reporte")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function RecentNoveltiesCard({
  recentNovelties,
  previewRecentNovelties,
  onShowAll,
}) {
  return (
    <div className="app-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Últimas novedades
        </h2>
        {recentNovelties.length > 4 && (
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Ver todas <span aria-hidden="true">›</span>
          </button>
        )}
      </div>
      {recentNovelties.length === 0 ? (
        <p className="text-sm text-gray-500">Sin novedades recientes</p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {previewRecentNovelties.map((novelty, index) => (
            <div
              key={novelty.id || index}
              className={`rounded-xl border border-l-4 p-3 ${
                severityClass[novelty.severity] ||
                "bg-gray-50 text-gray-700 border-l-gray-400"
              }`}
            >
              <p className="font-semibold">{novelty.title}</p>
              <p className="mt-1 text-sm opacity-90">{novelty.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ControlBoard() {
  const { user } = useUser();
  const { can } = usePermission();
  const canReadNovelties = can("novelties:read");
  const [board, setBoard] = useState(null);
  const [novelties, setNovelties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [showAllNovelties, setShowAllNovelties] = useState(false);
  const [tableSort, setTableSort] = useState({
    field: "",
    direction: "asc",
  });

  useEffect(() => {
    if (user?.roleId === 1) return;

    let disposed = false;
    let socket;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const campaignId = user?.campaignIds?.[0];
        if (!campaignId) {
          setError("No tienes una campaña asignada");
          return;
        }

        const boardData = await getControlBoard(campaignId);
        if (disposed) return;
        setBoard(boardData);

        if (canReadNovelties) {
          try {
            const noveltyData = await getCampaignNovelties(campaignId);
            if (disposed) return;
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

    const campaignId = user?.campaignIds?.[0];
    const token = getToken();
    if (campaignId && token) {
      const socketUrl =
        import.meta.env.VITE_ELECTION_DAY_WS_URL || `${API_URL}/election-day`;

      socket = io(socketUrl, {
        auth: {
          token,
          campaignId,
        },
        transports: ["websocket"],
      });

      const refreshFromEvent = () => {
        load();
      };

      socket.on("election-day.report.created", refreshFromEvent);
      socket.on("election-day.table.updated", refreshFromEvent);
      socket.on("election-day.novelty.created", refreshFromEvent);
    }

    return () => {
      disposed = true;
      socket?.off("election-day.report.created");
      socket?.off("election-day.table.updated");
      socket?.off("election-day.novelty.created");
      socket?.disconnect();
    };
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
  const severityLabels = ["critica", "alta", "media", "baja"];
  const severityNames = ["Crítica", "Alta", "Media", "Baja"];
  const severityColors = ["#ef4444", "#f97316", "#f59e0b", "#10b981"];
  const severityValues = severityLabels.map(
    (severity) => Number(noveltyStats[severity]) || 0,
  );
  const totalNovelties = severityValues.reduce(
    (total, value) => total + value,
    0,
  );
  const noveltyChartData = {
    labels: severityNames,
    datasets: [
      {
        data: severityValues,
        backgroundColor: severityColors,
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };
  const noveltyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      centerTotal: { total: totalNovelties },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.label}: ${context.parsed} novedad${
              context.parsed === 1 ? "" : "es"
            }`,
        },
      },
    },
  };
  const noveltyLegend = severityNames.map((label, index) => ({
    label,
    color: severityColors[index],
    value: severityValues[index],
  }));
  const recentNovelties =
    novelties.length > 0
      ? novelties
      : Array.isArray(board?.recentNovelties)
        ? board.recentNovelties
        : [];
  const previewRecentNovelties = recentNovelties.slice(0, 4);

  const visibleTables = (() => {
    const normalize = (value) => String(value || "").toLowerCase().trim();
    const normalizedSearch = normalize(tableSearch);

    const filtered = tables.filter(
      (table) => {
        if (!normalizedSearch) return true;

        return [
          table.municipalityName || table.municipality,
          table.votingBoothName || table.boothName,
          table.witnessEmail || table.witnessName || table.witness,
        ].some((value) => normalize(value).includes(normalizedSearch));
      },
    );

    if (!tableSort.field) return filtered;

    return [...filtered].sort((left, right) => {
      const getValue = (table) => {
        if (tableSort.field === "municipality") {
          return table.municipalityName || table.municipality || "";
        }
        if (tableSort.field === "booth") {
          return table.votingBoothName || table.boothName || "";
        }
        return table.noveltiesCount ?? table.noveltyCount ?? 0;
      };

      const leftValue = getValue(left);
      const rightValue = getValue(right);
      const comparison =
        typeof leftValue === "number" || typeof rightValue === "number"
          ? Number(leftValue) - Number(rightValue)
          : String(leftValue).localeCompare(String(rightValue), "es", {
              sensitivity: "base",
            });

      return tableSort.direction === "asc" ? comparison : -comparison;
    });
  })();

  const toggleTableSort = (field) => {
    setTableSort((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortIndicator = (field) =>
    tableSort.field === field
      ? tableSort.direction === "asc"
        ? "↑"
        : "↓"
      : "↕";

  const kpiCards = [
    {
      label: "Total de puestos",
      value: kpis.puestos ?? kpis.booths ?? 0,
      icon: BuildingOffice2Icon,
    },
    {
      label: "Total de mesas",
      value: kpis.mesas ?? kpis.tables ?? 0,
      icon: TableCellsIcon,
    },
    {
      label: "Mesas con apertura",
      value: kpis.mesasConApertura ?? kpis.aperturas ?? kpis.openings ?? 0,
      icon: LockOpenIcon,
    },
    {
      label: "Mesas en operación",
      value:
        kpis.mesasEnOperacion ?? kpis.operacion ?? kpis.inOperation ?? 0,
      icon: ArrowPathIcon,
    },
    {
      label: "Mesas con cierre",
      value: kpis.mesasConCierre ?? kpis.cierres ?? kpis.closings ?? 0,
      icon: LockClosedIcon,
    },
    {
      label: "Reportes recibidos",
      value: kpis.reportesRecibidos ?? kpis.reportes ?? kpis.reports ?? 0,
      icon: DocumentTextIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Tablero de control</h1>
        <p className="text-gray-500 text-sm mt-2">
          Monitoreo en tiempo real de la jornada electoral
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(({ label, value, icon }) => (
          <div key={label} className="app-card min-w-0 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {createElement(icon, {
                className: "h-5 w-5 shrink-0 text-brand-500",
                "aria-hidden": true,
              })}
              {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-3">
        <div className="relative z-0 min-w-0 xl:col-span-2">
          <MapColombia />
        </div>
        <div className="relative z-10 min-w-0 app-card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Estado de novedades
          </h2>
          <div className="flex min-h-0 flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="h-48 w-full max-w-[190px] shrink-0">
              <Doughnut
                data={noveltyChartData}
                options={noveltyChartOptions}
                plugins={[centerTotalPlugin]}
              />
            </div>
            <div className="w-full max-w-[150px] space-y-3">
              {noveltyLegend.map(({ label, color, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-center gap-2 text-gray-700">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Estados de puestos y mesas
            </h2>
          </div>
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <input
              type="search"
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              placeholder="Buscar por municipio, puesto o testigo"
              className="app-input bg-white"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F9FC] border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleTableSort("municipality")}
                      className="inline-flex items-center gap-1 hover:text-brand-600"
                    >
                      Municipio <span>{sortIndicator("municipality")}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleTableSort("booth")}
                      className="inline-flex items-center gap-1 hover:text-brand-600"
                    >
                      Puesto <span>{sortIndicator("booth")}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Mesa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Último reporte
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Testigo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleTableSort("novelties")}
                      className="inline-flex items-center gap-1 hover:text-brand-600"
                    >
                      Novedades <span>{sortIndicator("novelties")}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Sin mesas reportadas
                    </td>
                  </tr>
                ) : (
                  visibleTables.map((table, index) => (
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
                          {formatTableStatus(
                            table.status || table.currentStatus || "sin_reporte",
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatReportTime(table.lastReportAt)}
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
          <RecentNoveltiesCard
            recentNovelties={recentNovelties}
            previewRecentNovelties={previewRecentNovelties}
            onShowAll={() => setShowAllNovelties(true)}
          />
        </div>
      </div>

      {showAllNovelties && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar novedades"
            onClick={() => setShowAllNovelties(false)}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Últimas novedades
              </h2>
              <button
                type="button"
                onClick={() => setShowAllNovelties(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-5">
              {recentNovelties.map((novelty, index) => (
                <div
                  key={novelty.id || index}
                  className={`rounded-xl border border-l-4 p-3 ${
                    severityClass[novelty.severity] ||
                    "bg-gray-50 text-gray-700 border-l-gray-400"
                  }`}
                >
                  <p className="font-semibold">{novelty.title}</p>
                  <p className="mt-1 text-sm opacity-90">
                    {novelty.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
