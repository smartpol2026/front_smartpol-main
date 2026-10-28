import { getLeaderReport, getLeaderReportForExport } from "../api/reports";
import { getAllCampaigns } from "../api/campaigns";
import { getAllLeaders } from "../api/leaders";
import SummaryReportPage from "../components/SummaryReportPage";
import {
  CAMPAIGN_REPORT_FIELD,
  SUMMARY_COUNT_COLUMNS,
  normalizeSummaryRow,
} from "../utils/summaryReports";

const INITIAL_FILTERS = { name: "", campaignId: "", municipality: "" };
const OPTION_REQUESTS = { leaders: getAllLeaders, campaigns: getAllCampaigns };
const COLUMNS = [
  { header: "Nombre", key: "name", width: 30 },
  { header: "Municipio", key: "municipality", width: 20 },
  ...SUMMARY_COUNT_COLUMNS,
];
const FIELDS = [
  {
    key: "name",
    label: "Nombre",
    optionsKey: "leaders",
    valueKey: "name",
    emptyLabel: "Todos los líderes",
  },
  CAMPAIGN_REPORT_FIELD,
  { key: "municipality", label: "Municipio", type: "text", placeholder: "Ej. OVEJAS" },
];

export default function LeaderReport() {
  return (
    <SummaryReportPage
      title="Reporte por líderes"
      description="Consulta y exporta inscritos, reportados y pendientes por líder."
      initialFilters={INITIAL_FILTERS}
      fields={FIELDS}
      optionRequests={OPTION_REQUESTS}
      request={getLeaderReport}
      exportRequest={getLeaderReportForExport}
      normalizeRow={normalizeSummaryRow}
      columns={COLUMNS}
      fileName="Reporte_Lideres"
    />
  );
}
