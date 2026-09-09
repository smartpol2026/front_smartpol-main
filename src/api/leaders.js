import { API_URL, getAuthHeaders, apiCall } from './config';

export async function getLeaders() {
  // Obtener todos los líderes sin paginación (con límite alto)
  // Si el usuario es admin de campaña (roleId=2), el backend filtrará automáticamente por su organización
  return apiCall(`${API_URL}/leaders?limit=10000`, {
    headers: getAuthHeaders(),
  }, 'obtener líderes');
}

export async function getAllLeaders() {
  // Obtener todos los líderes cargando todas las páginas
  try {
    let allLeaders = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const data = await apiCall(`${API_URL}/leaders?page=${page}&limit=100`, {
        headers: getAuthHeaders(),
      }, 'obtener líderes página ' + page);

      if (Array.isArray(data?.data)) {
        allLeaders = [...allLeaders, ...data.data];
      } else if (Array.isArray(data)) {
        allLeaders = [...allLeaders, ...data];
      }

      // Verificar si hay más páginas
      if (data?.pages && page >= data.pages) {
        hasMorePages = false;
      } else if (!data?.pages && (!data?.data || data.data.length < 100)) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    return allLeaders;
  } catch (error) {
    console.error('Error loading all leaders:', error);
    throw error;
  }
}

export async function getLeadersWithPagination(page = 1, limit = 10, search = '') {
  const params = new URLSearchParams({
    page,
    limit,
  });
  if (search) {
    params.append('search', search);
  }
  return apiCall(`${API_URL}/leaders?${params.toString()}`, {
    headers: getAuthHeaders(),
  }, 'obtener líderes con paginación');
}

// ✅ ACTUALIZADO: Para candidatos con paginación
export async function getLeadersByCandidateWithPagination(
  candidateId,
  page = 1,
  limit = 10,
  search = '',
) {
  if (!candidateId || isNaN(candidateId)) {
    throw new Error('candidateId debe ser un número válido');
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) {
    params.append('search', search);
  }

  return apiCall(
    `${API_URL}/leaders/by-candidate/${Number(candidateId)}?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    },
    'obtener líderes del candidato con paginación',
  );
}

// ✅ NUEVO: Para admin/coordinador por campaña
export async function getLeadersByCampaignWithPagination(
  campaignId,
  page = 1,
  limit = 10,
  search = '',
) {
  if (!campaignId || isNaN(campaignId)) {
    throw new Error('campaignId debe ser un número válido');
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) {
    params.append('search', search);
  }

  return apiCall(
    `${API_URL}/leaders/by-campaign/${Number(campaignId)}?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    },
    'obtener líderes por campaña con paginación',
  );
}

// ✅ NUEVO: Sin paginación por si se necesita
export async function getLeadersByCampaign(campaignId) {
  if (!campaignId || isNaN(campaignId)) {
    throw new Error('campaignId debe ser un número válido');
  }

  return apiCall(
    `${API_URL}/leaders/by-campaign/${Number(campaignId)}`,
    {
      headers: getAuthHeaders(),
    },
    'obtener líderes por campaña',
  );
}

export async function getLeaderByUserId(userId) {
  return apiCall(`${API_URL}/leaders/by-user/${userId}`, {
    headers: getAuthHeaders(),
  }, 'obtener líder del usuario');
}

export async function getCandidatesByLeader(leaderId) {
  return apiCall(`${API_URL}/leaders/${leaderId}/candidates`, {
    headers: getAuthHeaders(),
  }, 'obtener candidatos');
}

export async function createLeader(leaderData) {
  return apiCall(`${API_URL}/leaders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(leaderData),
  }, 'crear líder');
}

export async function assignCandidatesToLeader(leaderId, candidateIds) {
  return apiCall(`${API_URL}/leaders/${leaderId}/assign-candidates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ candidateIds }),
  }, 'asignar candidatos');
}

export async function addCandidatesToLeader(leaderId, candidateIds) {
  return apiCall(`${API_URL}/leaders/${leaderId}/add-candidates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ candidateIds }),
  }, 'agregar candidatos');
}

export async function removeCandidatesFromLeader(leaderId, candidateIds) {
  return apiCall(`${API_URL}/leaders/${leaderId}/remove-candidates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ candidateIds }),
  }, 'remover candidatos');
}

export async function updateLeader(leaderId, leaderData) {
  return apiCall(`${API_URL}/leaders/${leaderId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(leaderData),
  }, 'actualizar líder');
}

export async function deleteLeader(leaderId) {
  return apiCall(`${API_URL}/leaders/${leaderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }, 'eliminar líder');
}