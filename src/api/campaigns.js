import { API_URL, getAuthHeaders, apiCall } from "./config";

export async function getCampaigns() {
  // Obtener campañas del usuario autenticado
  return apiCall(`${API_URL}/campaigns/me/my-campaigns`, {
    headers: getAuthHeaders(),
  }, "obtener mis campañas");
}

export async function getAllCampaigns() {
  // Obtener todas las campañas cargando todas las páginas
  try {
    let allCampaigns = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const data = await apiCall(`${API_URL}/campaigns?page=${page}&limit=100`, {
        headers: getAuthHeaders(),
      }, "obtener campañas página " + page);

      // Manejar respuesta paginada
      if (data?.data && Array.isArray(data.data)) {
        allCampaigns = [...allCampaigns, ...data.data];
      } else if (Array.isArray(data)) {
        allCampaigns = [...allCampaigns, ...data];
      }

      // Verificar si hay más páginas
      if (data?.pages && page >= data.pages) {
        hasMorePages = false;
      } else if (!data?.pages && (!data?.data || data.data.length === 0)) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    return allCampaigns;
  } catch (error) {
    console.error("Error loading all campaigns:", error);
    throw error;
  }
}

export async function getUserCampaignsWithPagination(page = 1, limit = 10, search = '') {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    
    // ✅ Usar el endpoint que filtra automáticamente por organización del usuario
    const response = await apiCall(`${API_URL}/campaigns?${params.toString()}`, {
      headers: getAuthHeaders(),
    }, "obtener campañas con paginación");

    // Validar que la respuesta tenga la estructura correcta
    if (!response) {
      return {
        data: [],
        page: page,
        pages: 1,
        total: 0
      };
    }

    // Si el backend retorna un array directamente, formatearlo
    if (Array.isArray(response)) {
      return {
        data: response,
        page: page,
        pages: 1,
        total: response.length
      };
    }

    // Si el backend retorna un objeto con estructura paginada
    return {
      data: Array.isArray(response.data) ? response.data : [],
      page: response.page || page,
      pages: response.pages || 1,
      total: response.total || 0
    };
  } catch (error) {
    console.error("Error in getUserCampaignsWithPagination:", error);
    throw error;
  }
}

export async function getCampaignsWithPagination(page = 1, limit = 10, search = '') {
  // ✅ Ahora esta función es un alias de getUserCampaignsWithPagination para mantener compatibilidad
  return getUserCampaignsWithPagination(page, limit, search);
}

export async function getCampaignById(campaignId) {
  return apiCall(`${API_URL}/campaigns/${campaignId}`, {
    headers: getAuthHeaders(),
  }, "obtener campaña");
}

export async function getCampaignsByOrganization(organizationId) {
  return apiCall(`${API_URL}/campaigns/organization/${organizationId}`, {
    headers: getAuthHeaders(),
  }, "obtener campañas de la organización");
}

export async function getCampaignCandidates(campaignId) {
  return apiCall(`${API_URL}/campaigns/${campaignId}/candidates`, {
    headers: getAuthHeaders(),
  }, "obtener candidatos de la campaña");
}

export async function getCampaignLeaders(campaignId) {
  return apiCall(`${API_URL}/campaigns/${campaignId}/leaders`, {
    headers: getAuthHeaders(),
  }, "obtener líderes de la campaña");
}

export async function createCampaign(campaign) {
  return apiCall(`${API_URL}/campaigns`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(campaign),
  }, "crear campaña");
}

export async function updateCampaign(campaignId, campaign) {
  return apiCall(`${API_URL}/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(campaign),
  }, "actualizar campaña");
}

export async function deleteCampaign(campaignId) {
  return apiCall(`${API_URL}/campaigns/${campaignId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }, "eliminar campaña");
}

export async function assignUserToCampaign(campaignId, userId) {
  return apiCall(`${API_URL}/campaigns/${campaignId}/users/${userId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  }, "asignar usuario a campaña");
}

export async function removeUserFromCampaign(campaignId, userId) {
  return apiCall(`${API_URL}/campaigns/${campaignId}/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }, "remover usuario de campaña");
}