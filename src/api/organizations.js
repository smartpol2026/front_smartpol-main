import { API_URL, getAuthHeaders, apiCall } from "./config";

export async function getOrganizations() {
  // Obtener todas las organizaciones sin paginación
  return apiCall(`${API_URL}/organizations?limit=10000`, {
    headers: getAuthHeaders(),
  }, "obtener organizaciones");
}

export async function getAllOrganizations() {
  // Obtener todas las organizaciones cargando todas las páginas
  try {
    let allOrganizations = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const data = await apiCall(`${API_URL}/organizations?page=${page}&limit=100`, {
        headers: getAuthHeaders(),
      }, "obtener organizaciones página " + page);

      if (Array.isArray(data?.data)) {
        allOrganizations = [...allOrganizations, ...data.data];
      } else if (Array.isArray(data)) {
        allOrganizations = [...allOrganizations, ...data];
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

    return allOrganizations;
  } catch (error) {
    console.error("Error loading all organizations:", error);
    throw error;
  }
}

export async function getOrganizationsWithPagination(page = 1, limit = 10, search = '') {
  const params = new URLSearchParams({
    page,
    limit,
  });
  if (search) {
    params.append('search', search);
  }
  
  const response = await apiCall(`${API_URL}/organizations?${params.toString()}`, {
    headers: getAuthHeaders(),
  }, "obtener organizaciones con paginación");

  // Si el backend retorna un array directamente, formatearlo
  if (Array.isArray(response)) {
    return {
      data: response,
      page: page,
      pages: 1,
      total: response.length
    };
  }

  // Si el backend retorna un objeto con estructura diferente
  return {
    data: response.data || response,
    page: response.page || page,
    pages: response.pages || 1,
    total: response.total || response.length || 0
  };
}

export async function getOrganizationById(organizationId) {
  return apiCall(`${API_URL}/organizations/${organizationId}`, {
    headers: getAuthHeaders(),
  }, "obtener organización");
}

export async function createOrganization(organization) {
  return apiCall(`${API_URL}/organizations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(organization),
  }, "crear organización");
}

// NUEVO: Crear organización con administrador
export async function createOrganizationWithAdmin(organizationData) {
  return apiCall(`${API_URL}/organizations/with-admin`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(organizationData),
  }, "crear organización con administrador");
}

export async function updateOrganization(organizationId, organization) {
  return apiCall(`${API_URL}/organizations/${organizationId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(organization),
  }, "actualizar organización");
}

export async function deleteOrganization(organizationId) {
  return apiCall(`${API_URL}/organizations/${organizationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }, "eliminar organización");
}