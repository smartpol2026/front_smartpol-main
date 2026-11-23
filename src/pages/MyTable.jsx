import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  createMyTableNovelty,
  createMyTableReport,
  getMyTable,
} from "../api/election-day";
import { useAlert } from "../hooks/useAlert";
import { usePermission } from "../hooks/usePermission";
import { useUser } from "../context/UserContext";

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

export default function MyTable() {
  const alert = useAlert();
  const { can } = usePermission();
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [savingNovelty, setSavingNovelty] = useState(false);

  const [reportForm, setReportForm] = useState({
    status: "en_operacion",
    estimatedParticipation: "",
    observations: "",
    evidenceUrl: "",
  });

  const [noveltyForm, setNoveltyForm] = useState({
    severity: "media",
    title: "",
    description: "",
  });

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

  if (user?.roleId === 1) {
    return <Navigate to="/forbidden" replace />;
  }

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    if (!can("my-table:report")) {
      alert.warning("No tienes permiso para enviar reportes");
      return;
    }

    setSavingReport(true);
    try {
      await createMyTableReport({
        status: reportForm.status,
        estimatedParticipation: reportForm.estimatedParticipation
          ? Number(reportForm.estimatedParticipation)
          : undefined,
        observations: reportForm.observations || undefined,
        evidenceUrl: reportForm.evidenceUrl || undefined,
      });
      alert.success("Reporte enviado correctamente");
      setReportForm({
        status: "en_operacion",
        estimatedParticipation: "",
        observations: "",
        evidenceUrl: "",
      });
      loadData();
    } catch (err) {
      alert.apiError(err, "No se pudo enviar el reporte");
    } finally {
      setSavingReport(false);
    }
  };

  const handleNoveltySubmit = async (event) => {
    event.preventDefault();
    if (!can("novelties:create")) {
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
    return <div className="app-card p-8 text-center text-gray-600">Cargando mi mesa...</div>;
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

  const reports = Array.isArray(data?.reports) ? data.reports : [];
  const novelties = Array.isArray(data?.novelties) ? data.novelties : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Mi mesa</h1>
        <p className="text-gray-500 text-sm mt-2">
          Reportes y novedades de tu mesa asignada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ["Campaña", data?.campaignName || "-"],
          ["Puesto", data?.votingBoothName || "-"],
          ["Mesa", data?.tableNumber ?? "-"],
          ["Municipio", data?.municipalityName || "-"],
        ].map(([label, value]) => (
          <div key={label} className="app-card p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {label}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="app-card p-5">
        <p className="text-sm text-gray-500">Estado actual</p>
        <p className="text-xl font-bold text-brand-600 mt-1">
          {data?.currentStatus || "sin_reporte"}
        </p>
        {data?.latestReport?.observations && (
          <p className="text-sm text-gray-600 mt-2">
            Último reporte: {data.latestReport.observations}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {can("my-table:report") && (
          <form onSubmit={handleReportSubmit} className="app-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Enviar reporte</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={reportForm.status}
                onChange={(e) =>
                  setReportForm((prev) => ({ ...prev, status: e.target.value }))
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
            <div>
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
                className="app-input min-h-[90px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de evidencia (opcional)
              </label>
              <input
                type="url"
                value={reportForm.evidenceUrl}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    evidenceUrl: e.target.value,
                  }))
                }
                className="app-input"
                placeholder="https://..."
              />
            </div>
            <button type="submit" disabled={savingReport} className="app-btn-primary">
              {savingReport ? "Enviando..." : "Enviar reporte"}
            </button>
          </form>
        )}

        {can("novelties:create") && (
          <form onSubmit={handleNoveltySubmit} className="app-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Crear novedad</h2>
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
                  setNoveltyForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="app-input"
                required
              />
            </div>
            <div>
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
                className="app-input min-h-[90px]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={savingNovelty}
              className="app-btn-primary"
            >
              {savingNovelty ? "Guardando..." : "Registrar novedad"}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="app-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historial de reportes
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay reportes</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reports.map((report, index) => (
                <div
                  key={report.id || index}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <p className="font-semibold text-gray-900">{report.status}</p>
                  {report.estimatedParticipation != null && (
                    <p className="text-sm text-gray-600">
                      Participación: {report.estimatedParticipation}%
                    </p>
                  )}
                  {report.observations && (
                    <p className="text-sm text-gray-600 mt-1">
                      {report.observations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {can("novelties:read") && (
          <div className="app-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Novedades
            </h2>
            {novelties.length === 0 ? (
              <p className="text-sm text-gray-500">Sin novedades registradas</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {novelties.map((novelty, index) => (
                  <div
                    key={novelty.id || index}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {novelty.title}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          severityClass[novelty.severity] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {novelty.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {novelty.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
