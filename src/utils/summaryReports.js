export const SUMMARY_COUNT_COLUMNS = ["Inscritos", "Reportados", "Pendientes"].map(
  (header) => ({
    header,
    key: header.toLowerCase(),
    width: 14,
    format: (value) => value.toLocaleString(),
  }),
);

export const normalizeSummaryRow = (row) => ({
  ...row,
  name: row.name || "Sin nombre",
  party: row.party || "N/A",
  municipality: row.municipality || "N/A",
  inscritos: Number(row.inscritos) || 0,
  reportados: Number(row.reportados) || 0,
  pendientes: Number(row.pendientes) || 0,
});

export const CAMPAIGN_REPORT_FIELD = {
  key: "campaignId",
  label: "Campaña",
  optionsKey: "campaigns",
  emptyLabel: "Todas las campañas",
};

export const CORPORATION_REPORT_FIELD = {
  key: "corporationId",
  label: "Corporación",
  optionsKey: "corporations",
  emptyLabel: "Todas las corporaciones",
};
