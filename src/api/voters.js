import { API_URL, getAuthHeaders, apiCall } from "./config";

export async function getVoters(page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes");
}

export async function getVotersByCandidate(candidateId, page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/by-candidate/${candidateId}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes del candidato");
}

export async function getVotersByLeader(leaderId, page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/by-leader/${leaderId}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes del líder");
}

export async function getVoterByIdentification(identification) {
  try {
    const result = await apiCall(`${API_URL}/voters/by-identification/${identification}`, {
      headers: getAuthHeaders(),
    }, "obtener votante");
    
    // Si el resultado es null o no tiene id, no es un votante válido
    if (!result || !result.id) {
      return null;
    }
    
    return result;
  } catch (error) {
    // Si no existe el votante o hay error, retornar null
    // No lanzar el error para que la validación sea silenciosa
    return null;
  }
}

export async function searchVoterByIdentification(identification) {
  try {
    const result = await apiCall(`${API_URL}/voters/search/by-identification/${identification}`, {
      headers: getAuthHeaders(),
    }, "buscar votante por identificación");
    
    return result;
  } catch (error) {
    // Si hay error, retornar objeto con status not_found
    return {
      status: 'not_found',
      message: error.message || 'Error al buscar el votante',
    };
  }
}

export async function searchVoterByIdentificationForDiaD(identification) {
  try {
    const result = await apiCall(`${API_URL}/voters/by-identification-diad/${identification}`, {
      headers: getAuthHeaders(),
    }, "buscar votante por identificación para Día D");
    
    return result;
  } catch (error) {
    // Si hay error, retornar objeto con status not_found
    return {
      status: 'not_found',
      message: error.message || 'Error al buscar el votante',
    };
  }
}

export async function createVoter(voter) {
  return apiCall(`${API_URL}/voters`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(voter),
  }, "crear votante");
}

export async function updateVoter(voterId, voter) {
  return apiCall(`${API_URL}/voters/${voterId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(voter),
  }, "actualizar votante");
}

export async function deleteVoter(voterId) {
  return apiCall(`${API_URL}/voters/${voterId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }, "eliminar votante");
}

export async function getAssignedCandidates(voterId) {
  try {
    return await apiCall(`${API_URL}/voters/${voterId}/assign-candidate`, {
      headers: getAuthHeaders(),
    }, "obtener candidatos asignados");
  } catch (error) {
    // Si no hay candidatos asignados, retornar array vacío
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function assignCandidatesToVoter(voterId, candidateIds, leaderId) {
  return apiCall(`${API_URL}/voters/${voterId}/assign-candidate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      candidate_ids: candidateIds,
      leader_id: leaderId,
    }),
  }, "asignar candidatos al votante");
}

export async function updateAssignedCandidates(voterId, candidateIds, leaderId) {
  return apiCall(`${API_URL}/voters/${voterId}/assign-candidate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      candidate_ids: candidateIds,
      leader_id: leaderId,
    }),
  }, "actualizar candidatos asignados");
}
export async function getAllVotersWithAssignments(roleId, candidateId, leaderId) {
  const params = new URLSearchParams();
  if (roleId) params.append('roleId', roleId);
  if (candidateId) params.append('candidateId', candidateId);
  if (leaderId) params.append('leaderId', leaderId);
  
  return apiCall(`${API_URL}/voters/search/all-with-assignments?${params.toString()}`, {
    headers: getAuthHeaders(),
  }, "obtener todos los votantes con asignaciones");
}

export async function getVotersWithAssignments(page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes con asignaciones");
}

export async function getVotersByCandidateWithAssignments(candidateId, page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/by-candidate/${candidateId}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes del candidato con asignaciones");
}

export async function getVotersByLeaderWithAssignments(leaderId, page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/by-leader/${leaderId}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes del líder con asignaciones");
}

export async function getVotingStats() {
  return apiCall(`${API_URL}/voters/stats`, {
    headers: getAuthHeaders(),
  }, "obtener estadísticas de votación");
}

export async function registerVote(identification) {
  return apiCall(`${API_URL}/voters/register-vote`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ identification }),
  }, "registrar voto");
}

export async function unregisterVote(identification) {
  return apiCall(`${API_URL}/voters/unregister-vote`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ identification }),
  }, "eliminar voto");
}

export async function getRegisteredVoters(page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/list/registered?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes que ya votaron");
}

export async function getPendingVoters(page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/list/pending?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "obtener votantes pendientes");
}

export async function searchVotersByNameOrIdentification(search, page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/search/by-name-or-identification?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "buscar votantes por nombre o identificación");
}

export async function searchVotersByTrackingFilter(status, identification, page = 1, limit = 20) {
  return apiCall(`${API_URL}/voters/list/search-by-tracking-filter?status=${status}&identification=${encodeURIComponent(identification)}&page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  }, "buscar votantes por filtro de seguimiento");
}