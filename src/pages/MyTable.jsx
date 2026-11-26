import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  createMyTableNovelty,
  createMyTableReport,
  getMyTable,
} from "../api/election-day";
import { useAlert } from "../hooks/useAlert";
import { usePermission } from "../hooks/usePermission";
import { useUser } from "../context/UserContext";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const REPORT_STATUSES = [
  { value: "apertura", label: "Apertura" },
  { value: "en_operacion", label: "En operación" },
  { value: "cierre", label: "Cierre" },
  { value: "operativo", label: "Operativo" },
  { value: "sin_novedad", label: "Sin novedad" },
];

const SEVERITIES = [
  { value: "critica", label: "Crítica" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

const severityClass = {
  critica: "bg-red-100 text-red-700",
  alta: "bg-orange-100 text-orange-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-emerald-100 text-emerald-700",
};

const reportStatusClass = {
  apertura: "bg-sky-100 text-sky-700",
  en_operacion: "bg-amber-100 text-amber-700",
  operativo: "bg-emerald-100 text-emerald-700",
  sin_novedad: "bg-teal-100 text-teal-700",
  cierre: "bg-violet-100 text-violet-700",
  sin_reporte: "bg-gray-100 text-gray-700",
};

const PREVIEW_LIMIT_REPORTS = 4;
const PREVIEW_LIMIT_NOVELTIES = 3;
const MODAL_PAGE_SIZE = 10;

function formatReportStatus(status) {
  return (
    REPORT_STATUSES.find((item) => item.value === status)?.label ||
    String(status || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatReportTime(report) {
  const createdAt = report.createdAt || report.created_at;
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function getReportDate(report) {
  const value = report?.createdAt || report?.created_at;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLatestReport(reports, fallbackReport) {
  return reports.reduce((latest, report) => {
    const reportDate = getReportDate(report);
    if (!reportDate) return latest;
    if (!latest || reportDate > getReportDate(latest)) return report;
    return latest;
  }, fallbackReport || null);
}

function formatMinutesAgo(report) {
  const date = getReportDate(report);
  if (!date) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  return minutes < 1
    ? "Hace menos de un minuto"
    : `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

function ReportItem({ report }) {
  const reportTime = formatReportTime(report);
  const reportDateTime = report.createdAt || report.created_at;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-gray-900">
          {formatReportStatus(report.status)}
        </p>
        {reportTime && (
          <time
            className="shrink-0 text-xs text-gray-500"
            dateTime={reportDateTime}
          >
            {reportTime}
          </time>
        )}
      </div>
      {report.estimatedParticipation != null && (
        <p className="text-sm text-gray-600">
          Participación: {report.estimatedParticipation}%
        </p>
      )}
      {report.observations && (
        <p className="text-sm text-gray-600 mt-1">{report.observations}</p>
      )}
    </div>
  );
}

function NoveltyItem({ novelty }) {
  const noveltyTime = formatReportTime(novelty);

  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {novelty.title}
          </p>
        </div>
        <span
          className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
            severityClass[novelty.severity] || "bg-gray-100 text-gray-700"
          }`}
        >
          {novelty.severity}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{novelty.description}</p>
      {noveltyTime && (
        <time
          className="block text-xs text-gray-500 mt-2"
          dateTime={novelty.createdAt || novelty.created_at}
        >
          {noveltyTime}
        </time>
      )}
    </div>
  );
}

function PaginatedListModal({
  open,
  title,
  items,
  page,
  onPageChange,
  onClose,
  renderItem,
  emptyMessage,
}) {
  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(items.length / MODAL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * MODAL_PAGE_SIZE;
  const pageItems = items.slice(start, start + MODAL_PAGE_SIZE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
          {pageItems.length === 0 ? (
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          ) : (
            pageItems.map((item, index) => (
              <div key={item.id ?? `${start + index}`}>
                {renderItem(item)}
              </div>
            ))
          )}
        </div>

        {items.length > MODAL_PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
            <p className="text-sm text-gray-500">
              Página {currentPage} de {totalPages} · {items.length} en total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="app-btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className="app-btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTable() {
  const alert = useAlert();
  const { can } = usePermission();
  const { user } = useUser();
  const evidenceInputRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [savingNovelty, setSavingNovelty] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("reporte");
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [noveltiesModalOpen, setNoveltiesModalOpen] = useState(false);
  const [reportsModalPage, setReportsModalPage] = useState(1);
  const [noveltiesModalPage, setNoveltiesModalPage] = useState(1);

  const [reportForm, setReportForm] = useState({
    status: "en_operacion",
    estimatedParticipation: "",
    observations: "",
    evidenceFile: null,
  });

  const [noveltyForm, setNoveltyForm] = useState({
    severity: "media",
    title: "",
    description: "",
  });

  const canReport = can("my-table:report");
  const canCreateNovelty = can("novelties:create");
  const canReadNovelties = can("novelties:read");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyTable();
      setData(response);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          "No tienes una mesa asignada. Solicita al administrador que te asigne puesto y mesa.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "No se pudo cargar la información de tu mesa",
        );
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.roleId === 1) return;
    loadData();
  }, [user?.roleId]);

  useEffect(() => {
    if (!canReport && canCreateNovelty) {
      setActiveFormTab("novedades");
    }
  }, [canReport, canCreateNovelty]);

  const reports = useMemo(
    () => (Array.isArray(data?.reports) ? data.reports : []),
    [data?.reports],
  );
  const novelties = useMemo(
    () => (Array.isArray(data?.novelties) ? data.novelties : []),
    [data?.novelties],
  );
  const previewReports = reports.slice(0, PREVIEW_LIMIT_REPORTS);
  const previewNovelties = novelties.slice(0, PREVIEW_LIMIT_NOVELTIES);
  const openingReport = reports.find((report) => report.status === "apertura");
  const latestReport = getLatestReport(reports, data?.latestReport);
  const estimatedParticipation = latestReport?.estimatedParticipation;
  const highNovelties = novelties.filter(
    (novelty) => novelty.severity === "alta",
  ).length;
  const criticalNovelties = novelties.filter(
    (novelty) => novelty.severity === "critica",
  ).length;
  const showFormPanel = canReport || canCreateNovelty;

  if (user?.roleId === 1) {
    return <Navigate to="/forbidden" replace />;
  }

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    if (!canReport) {
      alert.warning("No tienes permiso para enviar reportes");
      return;
    }

    setSavingReport(true);
    try {
      const payload = {
        status: reportForm.status,
        estimatedParticipation: reportForm.estimatedParticipation
          ? Number(reportForm.estimatedParticipation)
          : undefined,
        observations: reportForm.observations || undefined,
      };

      await createMyTableReport(payload, reportForm.evidenceFile || null);
      alert.success("Reporte enviado correctamente");
      setReportForm({
        status: "en_operacion",
        estimatedParticipation: "",
        observations: "",
        evidenceFile: null,
      });
      if (evidenceInputRef.current) evidenceInputRef.current.value = "";
      loadData();
    } catch (err) {
      alert.apiError(err, "No se pudo enviar el reporte");
    } finally {
      setSavingReport(false);
    }
  };

  const handleNoveltySubmit = async (event) => {
    event.preventDefault();
    if (!canCreateNovelty) {
      alert.warning("No tienes permiso para crear novedades");
      return;
    }
    if (!noveltyForm.title.trim() || !noveltyForm.description.trim()) {
      alert.warning("Completa título y descripción de la novedad");
      return;
    }

    setSavingNovelty(true);
    try {
      await createMyTableNovelty({
        severity: noveltyForm.severity,
        title: noveltyForm.title.trim(),
        description: noveltyForm.description.trim(),
      });
      alert.success("Novedad registrada");
      setNoveltyForm({ severity: "media", title: "", description: "" });
      loadData();
    } catch (err) {
      alert.apiError(err, "No se pudo crear la novedad");
    } finally {
      setSavingNovelty(false);
    }
  };

  if (loading) {
    return (
      <div className="app-card p-8 text-center text-gray-600">
        Cargando mi mesa...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">Mi mesa</h1>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col gap-6">
      <div>
        <div className="relative pl-9">
          <CalendarDaysIcon
            className="absolute left-0 top-1/2 h-7 w-7 -translate-y-1/2 text-brand-500"
            aria-hidden="true"
          />
          <h1 className="page-title">Mi mesa</h1>
          <div className="flex items-center justify-between gap-4 mt-2">
            <p className="text-gray-600 text-base min-w-0 truncate">
              Puesto: {data?.votingBoothName || "-"} - Mesa{" "}
              {data?.tableNumber ?? "-"} - {data?.municipalityName || "-"}
            </p>
            <span
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ${
                reportStatusClass[data?.currentStatus] ||
                "bg-gray-100 text-gray-700"
              }`}
            >
              {formatReportStatus(data?.currentStatus || "sin_reporte")}
            </span>
          </div>
          {data?.latestReport?.observations && (
            <p className="text-base text-gray-600 mt-2">
              Último reporte: {data.latestReport.observations}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          {
            label: "Campaña",
            value: data?.campaignName || "-",
            icon: FlagIcon,
          },
          {
            label: "Apertura",
            value: formatReportTime(openingReport) || "-",
            icon: ClockIcon,
            secondary: "Registrada",
            secondaryClass: "text-emerald-600",
          },
          {
            label: "Último reporte",
            value: formatReportTime(latestReport) || "-",
            secondary: formatMinutesAgo(latestReport),
            icon: CheckCircleIcon,
          },
          {
            label: "Participación estimada",
            value:
              estimatedParticipation != null
                ? `${estimatedParticipation}%`
                : "-",
            icon: ChartBarIcon,
          },
          {
            label: "Novedades",
            value: novelties.length,
            secondary: `Altas: ${highNovelties} · Críticas: ${criticalNovelties}`,
            secondaryClass: "text-red-600",
            icon: ExclamationTriangleIcon,
          },
        ].map(({ label, value, secondary, secondaryClass, icon: Icon }) => (
          <div
            key={label}
            className="app-card min-w-0 p-5"
          >
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {Icon && <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />}
              {label}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-2">{value}</p>
            {secondary && (
              <p className={`text-xs mt-1 ${secondaryClass || "text-gray-500"}`}>
                {secondary}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 items-stretch min-h-[34rem]">
        {showFormPanel && (
          <div className="app-card flex flex-col h-full min-h-[34rem]">
            <div className="flex border-b border-gray-100 px-2 pt-2">
              {canReport && (
                <button
                  type="button"
                  onClick={() => setActiveFormTab("reporte")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                    activeFormTab === "reporte"
                      ? "border-brand-500 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Reporte
                </button>
              )}
              {canCreateNovelty && (
                <button
                  type="button"
                  onClick={() => setActiveFormTab("novedades")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                    activeFormTab === "novedades"
                      ? "border-brand-500 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Novedades
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col p-6 min-h-0">
              {activeFormTab === "reporte" && canReport && (
                <form
                  onSubmit={handleReportSubmit}
                  className="flex flex-col flex-1 gap-4 min-h-0"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={reportForm.status}
                      onChange={(e) =>
                        setReportForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="app-input"
                    >
                      {REPORT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participación estimada (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={reportForm.estimatedParticipation}
                      onChange={(e) =>
                        setReportForm((prev) => ({
                          ...prev,
                          estimatedParticipation: e.target.value,
                        }))
                      }
                      className="app-input"
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={reportForm.observations}
                      onChange={(e) =>
                        setReportForm((prev) => ({
                          ...prev,
                          observations: e.target.value,
                        }))
                      }
                      className="app-input flex-1 min-h-[120px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjuntar evidencia (foto/video)
                    </label>
                    <input
                      ref={evidenceInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) =>
                        setReportForm((prev) => ({
                          ...prev,
                          evidenceFile: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        className="app-btn-ghost justify-center"
                      >
                        <PaperClipIcon className="w-5 h-5 text-brand-500" />
                        {reportForm.evidenceFile
                          ? "Cambiar archivo"
                          : "Cargar archivo"}
                      </button>
                      <p className="text-sm text-gray-500 truncate">
                        {reportForm.evidenceFile
                          ? reportForm.evidenceFile.name
                          : "Ningún archivo seleccionado"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingReport}
                    className="app-btn-primary mt-auto w-full"
                  >
                    {savingReport ? "Enviando..." : "Enviar reporte"}
                  </button>
                </form>
              )}

              {activeFormTab === "novedades" && canCreateNovelty && (
                <form
                  onSubmit={handleNoveltySubmit}
                  className="flex flex-col flex-1 gap-4 min-h-0"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severidad
                    </label>
                    <select
                      value={noveltyForm.severity}
                      onChange={(e) =>
                        setNoveltyForm((prev) => ({
                          ...prev,
                          severity: e.target.value,
                        }))
                      }
                      className="app-input"
                    >
                      {SEVERITIES.map((severity) => (
                        <option key={severity.value} value={severity.value}>
                          {severity.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={noveltyForm.title}
                      onChange={(e) =>
                        setNoveltyForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="app-input"
                      required
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={noveltyForm.description}
                      onChange={(e) =>
                        setNoveltyForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="app-input flex-1 min-h-[160px] resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingNovelty}
                    className="app-btn-primary mt-auto w-full"
                  >
                    {savingNovelty ? "Guardando..." : "Registrar novedad"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 h-full min-h-[34rem]">
          <div className="app-card flex flex-col flex-1 min-h-0 p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Últimos reportes
              </h2>
              {reports.length > PREVIEW_LIMIT_REPORTS && (
                <button
                  type="button"
                  onClick={() => {
                    setReportsModalPage(1);
                    setReportsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
                  aria-label="Ver todos los reportes"
                  title="Ver todos"
                >
                  <span className="hidden sm:inline">Ver todos</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {reports.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay reportes</p>
            ) : (
              <div className="space-y-3 overflow-y-auto min-h-0">
                {previewReports.map((report, index) => (
                  <ReportItem key={report.id || index} report={report} />
                ))}
              </div>
            )}
          </div>

          {canReadNovelties && (
            <div className="app-card flex flex-col flex-1 min-h-0 p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Novedades de mi mesa
                </h2>
                {novelties.length > PREVIEW_LIMIT_NOVELTIES && (
                  <button
                    type="button"
                    onClick={() => {
                      setNoveltiesModalPage(1);
                      setNoveltiesModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
                    aria-label="Ver todas las novedades"
                    title="Ver todos"
                  >
                    <span className="hidden sm:inline">Ver todos</span>
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              {novelties.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Sin novedades registradas
                </p>
              ) : (
                <div className="space-y-3 overflow-y-auto min-h-0">
                  {previewNovelties.map((novelty, index) => (
                    <NoveltyItem
                      key={novelty.id || index}
                      novelty={novelty}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PaginatedListModal
        open={reportsModalOpen}
        title="Historial de reportes"
        items={reports}
        page={reportsModalPage}
        onPageChange={setReportsModalPage}
        onClose={() => setReportsModalOpen(false)}
        emptyMessage="Aún no hay reportes"
        renderItem={(report) => <ReportItem report={report} />}
      />

      <PaginatedListModal
        open={noveltiesModalOpen}
        title="Novedades registradas"
        items={novelties}
        page={noveltiesModalPage}
        onPageChange={setNoveltiesModalPage}
        onClose={() => setNoveltiesModalOpen(false)}
        emptyMessage="Sin novedades registradas"
        renderItem={(novelty) => <NoveltyItem novelty={novelty} />}
      />
    </div>
  );
}
