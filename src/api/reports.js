import { API_URL, getAuthHeaders, apiCall } from "./config";

export async function getVoterReport(filters = {}) {
  const params = new URLSearchParams();
  
  // Agregar parámetros por defecto para paginación
  params.append("page", filters.page || 1);
  params.append("limit", filters.limit || 50);
  
  // Agregar filtros solo si tienen valor
  if (filters.gender) params.append("gender", filters.gender);
  if (filters.leaderId) params.append("leaderId", filters.leaderId);
  if (filters.corporationId) params.append("corporationId", filters.corporationId);
  if (filters.candidateId) params.append("candidateId", filters.candidateId);
  if (filters.departmentId) params.append("departmentId", filters.departmentId);
  if (filters.municipalityId) params.append("municipalityId", filters.municipalityId);
  if (filters.votingBoothId) params.append("votingBoothId", filters.votingBoothId);
  if (filters.votingTableId) params.append("votingTableId", filters.votingTableId);

  const url = `${API_URL}/voters/report/general?${params.toString()}`;
  console.log("Fetching:", url); // Para debug
  
  return apiCall(url, {
    headers: getAuthHeaders(),
  }, "obtener reporte de votantes");
}

export async function getVoterReportForExport(filters = {}) {
  // Obtener todos los datos haciendo múltiples solicitudes si es necesario
  const MAX_LIMIT = 500; // Límite máximo permitido por el servidor
  let allData = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const params = new URLSearchParams();
    params.append("limit", MAX_LIMIT);
    params.append("page", currentPage);
    
    // Agregar filtros solo si tienen valor (mismos filtros que la vista paginada)
    if (filters.gender) params.append("gender", filters.gender);
    if (filters.leaderId) params.append("leaderId", filters.leaderId);
    if (filters.corporationId) params.append("corporationId", filters.corporationId);
    if (filters.candidateId) params.append("candidateId", filters.candidateId);
    if (filters.departmentId) params.append("departmentId", filters.departmentId);
    if (filters.municipalityId) params.append("municipalityId", filters.municipalityId);
    if (filters.votingBoothId) params.append("votingBoothId", filters.votingBoothId);
    if (filters.votingTableId) params.append("votingTableId", filters.votingTableId);

    const url = `${API_URL}/voters/report/general?${params.toString()}`;
    
    const response = await apiCall(url, {
      headers: getAuthHeaders(),
    }, "obtener reporte completo para exportación");

    if (response.data && Array.isArray(response.data)) {
      allData = allData.concat(response.data);
    }

    totalPages = response.pages || 1;
    currentPage++;
  }

  return { data: allData };
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
