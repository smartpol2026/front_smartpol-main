import { API_URL } from './config';

export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Error en login');
    }

    const data = await response.json();
    
    // Guardar en localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user_id', data.id);
    localStorage.setItem('user_email', data.email);
    localStorage.setItem('roleId', data.roleId);
    localStorage.setItem('organizationId', data.organizationId || '');
    localStorage.setItem('organizationName', data.organizationName || ''); // Agregar esta línea

    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout() {
  // Limpiar localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  localStorage.removeItem('roleId');
  localStorage.removeItem('organizationId');
  localStorage.removeItem('organizationName'); // Agregar esta línea
}