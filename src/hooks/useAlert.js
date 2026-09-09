import Swal from 'sweetalert2';

// Estilos personalizados para SweetAlert2
const customStyles = `
  .swal2-confirm,
  .swal2-cancel {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
    cursor: pointer !important;
  }
  
  .swal2-confirm {
    background-color: #F97316 !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 10px 20px !important;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3) !important;
    border: none !important;
    border-radius: 4px !important;
    transition: all 0.3s ease !important;
  }
  
  .swal2-confirm:hover {
    background-color: #EA580C !important;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4) !important;
    transform: translateY(-2px) !important;
  }
  
  .swal2-confirm:active {
    transform: translateY(0) !important;
  }
  
  .swal2-cancel {
    background-color: #6B7280 !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 10px 20px !important;
    box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3) !important;
    border: none !important;
    border-radius: 4px !important;
    transition: all 0.3s ease !important;
    margin-left: 10px !important;
  }
  
  .swal2-cancel:hover {
    background-color: #4B5563 !important;
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4) !important;
    transform: translateY(-2px) !important;
  }
  
  .swal2-cancel:active {
    transform: translateY(0) !important;
  }
  
  .swal2-actions {
    display: flex !important;
    justify-content: center !important;
    gap: 10px !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  .swal2-title {
    font-size: 1.5rem !important;
    font-weight: 700 !important;
  }
  
  .swal2-html-container {
    font-size: 1rem !important;
  }
`;

// Inyectar estilos personalizados
if (document.head && !document.querySelector('#swal-custom-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'swal-custom-styles';
  styleEl.textContent = customStyles;
  document.head.appendChild(styleEl);
}

/**
 * Hook personalizado para manejar alertas con SweetAlert2
 * Proporciona métodos para mostrar diferentes tipos de alertas
 */
export function useAlert() {
  return {
    /**
     * Alerta de éxito
     * @param {string} message - Mensaje de la alerta
     * @param {string} title - Título de la alerta
     */
    success: (message = 'Operación completada', title = '¡Éxito!') => {
      return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonColor: '#F97316',
        confirmButtonText: 'Aceptar',
        buttonsStyling: true,
        allowOutsideClick: false,
      });
    },

    /**
     * Alerta de error
     * @param {string} message - Mensaje de error
     * @param {string} title - Título de la alerta
     */
    error: (message = 'Ocurrió un error', title = 'Error') => {
      return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Aceptar',
        buttonsStyling: true,
        allowOutsideClick: false,
      });
    },

    /**
     * Alerta de advertencia
     * @param {string} message - Mensaje de advertencia
     * @param {string} title - Título de la alerta
     */
    warning: (message = 'Por favor revisa', title = 'Advertencia') => {
      return Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonColor: '#F97316',
        confirmButtonText: 'Aceptar',
        buttonsStyling: true,
        allowOutsideClick: false,
      });
    },

    /**
     * Alerta de información
     * @param {string} message - Mensaje informativo
     * @param {string} title - Título de la alerta
     */
    info: (message = 'Información', title = 'Información') => {
      return Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonColor: '#F97316',
        confirmButtonText: 'Aceptar',
        buttonsStyling: true,
        allowOutsideClick: false,
      });
    },

    /**
     * Alerta de confirmación
     * @param {string} message - Mensaje de confirmación
     * @param {string} title - Título de la alerta
     * @param {string} confirmText - Texto del botón de confirmación
     * @param {string} cancelText - Texto del botón de cancelación
     */
    confirm: (
      message = '¿Estás seguro?',
      title = 'Confirmar',
      confirmText = 'Sí, continuar',
      cancelText = 'Cancelar'
    ) => {
      return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonColor: '#F97316',
        cancelButtonColor: '#6B7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        buttonsStyling: true,
        reverseButtons: false,
        allowOutsideClick: false,
        allowEscapeKey: true,
        didRender: (popup) => {
          // Asegurar que los botones sean siempre visibles
          const confirmBtn = popup.querySelector('.swal2-confirm');
          const cancelBtn = popup.querySelector('.swal2-cancel');
          const buttonsContainer = popup.querySelector('.swal2-actions');
          
          if (confirmBtn) {
            confirmBtn.style.visibility = 'visible';
            confirmBtn.style.opacity = '1';
            confirmBtn.style.display = 'inline-block';
          }
          if (cancelBtn) {
            cancelBtn.style.visibility = 'visible';
            cancelBtn.style.opacity = '1';
            cancelBtn.style.display = 'inline-block';
          }
          if (buttonsContainer) {
            buttonsContainer.style.visibility = 'visible';
            buttonsContainer.style.opacity = '1';
          }
        },
      });
    },

    /**
     * Alerta de carga/espera
     * @param {string} message - Mensaje a mostrar
     * @param {string} title - Título de la alerta
     */
    loading: (message = 'Procesando...', title = 'Espera') => {
      return Swal.fire({
        title: title,
        text: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    },

    /**
     * Cierra la alerta actual
     */
    close: () => {
      Swal.close();
    },

    /**
     * Alerta de error específico del servidor
     * Parsea el error y muestra el mensaje más apropiado
     */
    apiError: (error, defaultMessage = 'Error al procesar la solicitud') => {
      let message = defaultMessage;
      let title = 'Error';

      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        const status = error.response.status;
        const data = error.response.data;

        // Mapear códigos HTTP comunes
        switch (status) {
          case 400:
            title = 'Solicitud Inválida';
            message = data?.message || 'Los datos enviados son inválidos';
            break;
          case 401:
            title = 'No Autorizado';
            message = data?.message || 'Necesitas iniciar sesión';
            break;
          case 403:
            title = 'Acceso Denegado';
            message = data?.message || 'No tienes permiso para realizar esta acción';
            break;
          case 404:
            title = 'No Encontrado';
            message = data?.message || 'El recurso que buscas no existe';
            break;
          case 409:
            title = 'Conflicto';
            message = data?.message || 'Ya existe un registro con estos datos';
            break;
          case 422:
            title = 'Datos Inválidos';
            message = data?.message || data?.error || 'Hay problemas con los datos ingresados';
            break;
          case 500:
            title = 'Error del Servidor';
            message = data?.message || 'Hubo un error en el servidor';
            break;
          default:
            message = data?.message || message;
        }
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta
        title = 'Error de Conexión';
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        // Error en la creación de la solicitud
        message = error.message || defaultMessage;
      }

      return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Aceptar',
        buttonsStyling: true,
        allowOutsideClick: false,
      });
    },

    /**
     * Alerta unificada que acepta tipo de alerta dinámico
     * @param {string} message - Mensaje de la alerta
     * @param {string} type - Tipo de alerta: 'success', 'error', 'warning', 'info'
     * @param {string} title - Título de la alerta (opcional)
     */
    alert: (message, type = 'info', title = '') => {
      const titles = {
        success: '¡Éxito!',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información',
      };

      const icons = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info',
      };

      const colors = {
        success: '#16A34A',
        error: '#EF4444',
        warning: '#F97316',
        info: '#3B82F6',
      };

      const alertTitle = title || titles[type] || 'Información';
      const icon = icons[type] || 'info';
      const color = colors[type] || '#3B82F6';

      return Swal.fire({
        icon: icon,
        title: alertTitle,
        text: message,
        confirmButtonColor: color,
        confirmButtonText: 'Aceptar',
        buttonsStyling: true,
        allowOutsideClick: false,
      });
    },
  };
}
