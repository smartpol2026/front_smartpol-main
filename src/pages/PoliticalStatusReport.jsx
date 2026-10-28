import {
  getPoliticalStatusReport,
  getPoliticalStatusReportForExport,
} from "../api/reports";
import { getPoliticalStatuses } from "../api/political-statuses";
import SummaryReportPage from "../components/SummaryReportPage";
import { SUMMARY_COUNT_COLUMNS } from "../utils/summaryReports";

const INITIAL_FILTERS = { politicalStatusId: "" };

const OPTION_REQUESTS = {
  politicalStatuses: getPoliticalStatuses,
};

const COLUMNS = [
  { header: "Estado político", key: "name", width: 30 },
  ...SUMMARY_COUNT_COLUMNS,
];

const FIELDS = [
  {
    key: "politicalStatusId",
    label: "Estado político",
    optionsKey: "politicalStatuses",
    emptyLabel: "Todos los estados políticos",
  },
];

const normalizeRow = (row) => ({
  ...row,
  name: row.name || "Sin nombre",
  inscritos: Number(row.inscritos) || 0,
  reportados: Number(row.reportados) || 0,
  pendientes: Number(row.pendientes) || 0,
});

export default function PoliticalStatusReport() {
  return (
    <SummaryReportPage
      title="Reporte por estado político"
      description="Consulta y exporta inscritos, reportados y pendientes por estado político."
      initialFilters={INITIAL_FILTERS}
      fields={FIELDS}
      optionRequests={OPTION_REQUESTS}
      request={getPoliticalStatusReport}
      exportRequest={getPoliticalStatusReportForExport}
      normalizeRow={normalizeRow}
      columns={COLUMNS}
      fileName="Reporte_Estado_Politico"
      pageLimit={20}
      nameKey="name"
    />
  );
}
