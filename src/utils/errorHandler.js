/**
 * Reglas de validación para formularios
 */
export const ValidationRules = {
  required: {
    validate: (value) => value && value.trim() !== '',
    message: 'Este campo es requerido',
  },
  
  email: {
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: 'Ingresa un email válido',
  },
  
  minLength: (length) => ({
    validate: (value) => value && value.length >= length,
    message: `Mínimo ${length} caracteres`,
  }),
  
  maxLength: (length) => ({
    validate: (value) => !value || value.length <= length,
    message: `Máximo ${length} caracteres`,
  }),
  
  passwordMatch: {
    validate: (value, formData) => value === formData.password,
    message: 'Las contraseñas no coinciden',
  },
  
  number: {
    validate: (value) => !isNaN(value) && value !== '',
    message: 'Debe ser un número válido',
  },
  
  minValue: (min) => ({
    validate: (value) => !isNaN(value) && Number(value) >= min,
    message: `El valor mínimo es ${min}`,
  }),
  
  maxValue: (max) => ({
    validate: (value) => !isNaN(value) && Number(value) <= max,
    message: `El valor máximo es ${max}`,
  }),
};

/**
 * Valida un formulario contra un conjunto de reglas
 * @param {Object} formData - Datos del formulario a validar
 * @param {Object} rules - Reglas de validación por campo
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateForm(formData, rules) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const value = formData[fieldName];
    
    // Si no hay reglas, continúa
    if (!fieldRules) continue;

    // Convertir regla única a array
    const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

    for (const rule of rulesArray) {
      const validates = rule.validate(value, formData);
      
      if (!validates) {
        errors[fieldName] = rule.message;
        isValid = false;
        break; // Detener en el primer error de este campo
      }
    }
  }

  return { isValid, errors };
}

/**
 * Extrae el mensaje de error más apropiado según el tipo de error
 * @param {Error|Object} error - El error a procesar
 * @param {string} defaultMessage - Mensaje por defecto
 * @returns {string} Mensaje de error procesado
 */
export function getErrorMessage(error, defaultMessage = 'Error al procesar la solicitud') {
  // Si es una respuesta con estructura de error
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Si es un error con estructura de validación
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Si es un mensaje simple
  if (error.message) {
    return error.message;
  }
  
  // Mensaje por defecto
  return defaultMessage;
}

/**
 * Determina si un error es de validación del servidor
 * @param {Error|Object} error - El error a verificar
 * @returns {boolean}
 */
export function isValidationError(error) {
  return error.response?.status === 422 || error.response?.status === 400;
}

/**
 * Determina si un error es de duplicación (conflicto)
 * @param {Error|Object} error - El error a verificar
 * @returns {boolean}
 */
export function isDuplicationError(error) {
  return error.response?.status === 409;
}

/**
 * Determina si un error es de autorización
 * @param {Error|Object} error - El error a verificar
 * @returns {boolean}
 */
export function isAuthorizationError(error) {
  return error.response?.status === 403 || error.response?.status === 401;
}

/**
 * Determina si un error es de conexión
 * @param {Error|Object} error - El error a verificar
 * @returns {boolean}
 */
export function isConnectionError(error) {
  return !error.response && !error.message?.includes('Network');
}

/**
 * Procesa errores de formulario del servidor
 * @param {Object} error - El error con validaciones del servidor
 * @returns {Object} Errores organizados por campo
 */
export function getFieldErrors(error) {
  const fieldErrors = {};
  
  if (error.response?.data?.errors) {
    // Estructura: { field1: 'error message', field2: 'error message' }
    Object.assign(fieldErrors, error.response.data.errors);
  } else if (error.response?.data?.message) {
    // Si no hay errores específicos, crear un error general
    fieldErrors.general = error.response.data.message;
  }
  
  return fieldErrors;
}
