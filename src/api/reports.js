import { API_URL, getAuthHeaders, apiCall } from "./config";

async function getVoterDetailReport(filters, reportType) {
  const params = new URLSearchParams();
  
  // Agregar parámetros por defecto para paginación
  params.append("page", filters.page || 1);
  params.append("limit", filters.limit || 50);
  
  // Agregar filtros solo si tienen valor
  if (filters.gender) params.append("gender", filters.gender);
  if (filters.leaderId) params.append("leaderId", filters.leaderId);
  if (filters.corporationId) params.append("corporationId", filters.corporationId);
  if (filters.candidateId) params.append("candidateId", filters.candidateId);
  if (filters.politicalStatusId) params.append("politicalStatusId", filters.politicalStatusId);
  if (filters.departmentId) params.append("departmentId", filters.departmentId);
  if (filters.municipalityId) params.append("municipalityId", filters.municipalityId);
  if (filters.votingBoothId) params.append("votingBoothId", filters.votingBoothId);
  if (filters.votingTableId) params.append("votingTableId", filters.votingTableId);


  const url = `${API_URL}/voters/report/${reportType}?${params.toString()}`;
  
  return apiCall(url, {
    headers: getAuthHeaders(),
  }, "obtener reporte de votantes");
}

export function getVoterReport(filters = {}) {
  return getVoterDetailReport(filters, "general");
}

export function getVoterReportForExport(filters = {}) {
  return getSummaryReportForExport(getVoterReport, filters);
}

export async function getPoliticalStatusReport(filters = {}) {
  const params = new URLSearchParams();
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const limit = Math.min(
    Math.max(1, Number.parseInt(filters.limit, 10) || 20),
    500,
  );

  if (filters.politicalStatusId) {
    params.append("politicalStatusId", filters.politicalStatusId);
  }
  params.append("page", page);
  params.append("limit", limit);

  const url = `${API_URL}/voters/report/political-status?${params.toString()}`;

  return apiCall(
    url,
    { headers: getAuthHeaders() },
    "obtener reporte por estado político",
  );
}

export function getPoliticalStatusReportForExport(filters = {}) {
  return getSummaryReportForExport(getPoliticalStatusReport, filters, 500);
}

export async function getCandidateReport(filters = {}) {
  const params = new URLSearchParams();

  if (filters.corporationId) {
    params.append("corporationId", filters.corporationId);
  }
  if (filters.candidateId) {
    params.append("candidateId", filters.candidateId);
  }
  if (filters.campaignId) {
    params.append("campaignId", filters.campaignId);
  }
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString();
  const url = `${API_URL}/voters/report/candidates${query ? `?${query}` : ""}`;

  return apiCall(
    url,
    { headers: getAuthHeaders() },
    "obtener reporte por candidatos",
  );
}

async function getSummaryReportForExport(reportRequest, filters, maxLimit = 500) {
  const allData = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await reportRequest({
      ...filters,
      page,
      limit: maxLimit,
    });

    if (Array.isArray(response?.data)) {
      allData.push(...response.data);
    }

    totalPages = response?.pages || 1;
    page += 1;
  }

  return { data: allData };
}

export function getCandidateReportForExport(filters = {}) {
  return getSummaryReportForExport(getCandidateReport, filters);
}

export async function getLeaderReport(filters = {}) {
  const params = new URLSearchParams();

  if (filters.name) params.append("name", filters.name);
  if (filters.campaignId) params.append("campaignId", filters.campaignId);
  if (filters.municipalityId) {
    params.append("municipalityId", filters.municipalityId);
  }
  if (filters.departmentId) {
    params.append("departmentId", filters.departmentId);
  }
  if (filters.municipality) {
    params.append("municipality", filters.municipality);
  }
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString();
  const url = `${API_URL}/voters/report/leaders${query ? `?${query}` : ""}`;

  return apiCall(
    url,
    { headers: getAuthHeaders() },
    "obtener reporte por líderes",
  );
}

export function getLeaderReportForExport(filters = {}) {
  return getSummaryReportForExport(getLeaderReport, filters);
}

export async function getPartyReport(filters = {}) {
  const params = new URLSearchParams();

  if (filters.party) params.append("party", filters.party);
  if (filters.campaignId) params.append("campaignId", filters.campaignId);
  if (filters.corporationId) params.append("corporationId", filters.corporationId);
  params.append("page", filters.page || 1);
  params.append("limit", filters.limit || 100);

  return apiCall(
    `${API_URL}/voters/report/parties?${params.toString()}`,
    { headers: getAuthHeaders() },
    "obtener reporte por partido",
  );
}

export function getPartyReportForExport(filters = {}) {
  return getSummaryReportForExport(getPartyReport, filters);
}

export async function getAnalysisReport(filters = {}) {
  const params = new URLSearchParams();

  // Agregar filtros solo si tienen valor
  if (filters.departmentId) params.append("departmentId", filters.departmentId);
  if (filters.municipalityId) params.append("municipalityId", filters.municipalityId);
  if (filters.votingBoothId) params.append("votingBoothId", filters.votingBoothId);
  if (filters.votingTableId) params.append("votingTableId", filters.votingTableId);

  const url = `${API_URL}/voters/report/analysis?${params.toString()}`;

  return apiCall(url, {
    headers: getAuthHeaders(),
  }, "obtener reporte de análisis");
}
