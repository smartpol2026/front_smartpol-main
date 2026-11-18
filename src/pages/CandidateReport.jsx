import { getCandidateReport, getCandidateReportForExport } from "../api/reports";
import { getAllCandidates } from "../api/candidates";
import { getAllCampaigns } from "../api/campaigns";
import { getCorporations } from "../api/corporations";
import SummaryReportPage from "../components/SummaryReportPage";
import {
  CAMPAIGN_REPORT_FIELD,
  CORPORATION_REPORT_FIELD,
  SUMMARY_COUNT_COLUMNS,
  normalizeSummaryRow,
} from "../utils/summaryReports";

const INITIAL_FILTERS = { candidateId: "", corporationId: "", campaignId: "" };
const OPTION_REQUESTS = {
  candidates: getAllCandidates,
  campaigns: getAllCampaigns,
  corporations: getCorporations,
};
const COLUMNS = [
  { header: "Nombre", key: "name", width: 30 },
  ...SUMMARY_COUNT_COLUMNS,
];
const FIELDS = [
  {
    key: "candidateId",
    label: "Candidato",
    emptyLabel: "Todos los candidatos",
    getOptions: ({ candidates = [] }, filters) =>
      candidates.filter((candidate) => !filters.corporationId ||
        String(candidate.corporationId ?? candidate.corporation?.id) === String(filters.corporationId)),
  },
  { ...CORPORATION_REPORT_FIELD, resetFields: ["candidateId"] },
  CAMPAIGN_REPORT_FIELD,
];

export default function CandidateReport() {
  return (
    <SummaryReportPage
      title="Reporte por candidatos"
      description="Consulta y exporta los resultados agrupados por candidato."
      initialFilters={INITIAL_FILTERS}
      fields={FIELDS}
      optionRequests={OPTION_REQUESTS}
      request={getCandidateReport}
      exportRequest={getCandidateReportForExport}
      normalizeRow={normalizeSummaryRow}
      columns={COLUMNS}
      fileName="Reporte_Candidatos"
    />
  );
}
