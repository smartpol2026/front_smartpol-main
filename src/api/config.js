// config.js
import { getErrorMessage } from '../utils/errorHandler';

export const API_URL = 'https://smartpol-v2-api.smartpol.com.co';

/**
 * Obtiene el token JWT del localStorage
 */
export function getToken() {
  return localStorage.getItem('access_token');
}

/**
 * Debug: Print all localStorage auth data
 */
export function debugAuthStorage() {
  // Debug function - logs removed in production
}

/**
 * Crea headers para las peticiones con autenticación
 */
export function getAuthHeaders(additionalHeaders = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Función auxiliar para realizar llamadas a la API con manejo de errores centralizado
 * @param {string} url - URL de la API
 * @param {Object} options - Opciones de fetch
 * @param {string} actionName - Nombre de la acción para mensajes
 * @returns {Promise}
 */
export async function apiCall(url, options = {}, actionName = 'request') {
  try {
    const response = await fetch(url, options);

    // Si la respuesta no es ok, lanzar error con detalles
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `Error al ${actionName}` };
      }

      const error = new Error(errorData.message || `Error al ${actionName}`);
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
    }

    // Manejar respuestas vacías (como 204 No Content o respuestas sin body)
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || !contentLength || contentLength === '0') {
      return { success: true };
    }

    // Intentar parsear como JSON, si falla retornar un objeto de éxito
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  } catch (error) {
    // Propagar el error con contexto
    throw error;
  }
}
