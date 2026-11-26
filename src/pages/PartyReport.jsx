import { getPartyReport, getPartyReportForExport } from "../api/reports";
import { getCandidateParties } from "../api/candidates";
import SummaryReportPage from "../components/SummaryReportPage";
import {
  SUMMARY_COUNT_COLUMNS,
  normalizeSummaryRow,
} from "../utils/summaryReports";

const INITIAL_FILTERS = { party: "" };
const OPTION_REQUESTS = {
  parties: async () => {
    const response = await getCandidateParties();
    const data = Array.isArray(response) ? response : response.data || [];
    const names = data.map((party) =>
      typeof party === "string" ? party : party.party || party.name,
    );
    return [...new Set(names.filter(Boolean))]
      .sort((first, second) => first.localeCompare(second, "es"))
      .map((name) => ({ id: name, name }));
  },
};
const COLUMNS = [
  { header: "Partido", key: "party", width: 30 },
  ...SUMMARY_COUNT_COLUMNS,
];
const FIELDS = [
  {
    key: "party",
    label: "Partido",
    optionsKey: "parties",
    emptyLabel: "Todos los partidos",
  },
];

export default function PartyReport() {
  return (
    <SummaryReportPage
      title="Reporte por partido"
      description="Consulta y exporta inscritos, reportados y pendientes por partido."
      initialFilters={INITIAL_FILTERS}
      fields={FIELDS}
      optionRequests={OPTION_REQUESTS}
      request={getPartyReport}
      exportRequest={getPartyReportForExport}
      normalizeRow={normalizeSummaryRow}
      columns={COLUMNS}
      fileName="Reporte_Partidos"
      pageLimit={100}
      nameKey="party"
    />
  );
}
