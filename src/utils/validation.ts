
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  errorMessage: string;
}

export function validateLeadData(data: any): ValidationResult {
  const errors: string[] = [];

  // Si es una herramienta de Vodafone, usamos la validación específica
  if (data.nombre_completo || data.dni_nif_cif || data.cuenta_bancaria_iban) {
    return validateVodafoneData(data);
  }

  // Validación de Nombre
  if (!data.nombre || data.nombre.trim().length < 3) {
    errors.push("El nombre completo es obligatorio.");
  }

  // Validación de DNI (España)
  const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$|^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  if (data.dni && !dniRegex.test(data.dni.replace(/[\s-]/g, ''))) {
    errors.push("El DNI o NIE no tiene un formato válido.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorMessage: errors.join(" ")
  };
}

export function validateVodafoneData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.nombre_completo || data.nombre_completo.trim().length < 5) {
    errors.push("Falta el nombre completo del titular.");
  }

  if (!data.dni_nif_cif || data.dni_nif_cif.trim().length < 5) {
    errors.push("El DNI/CIF es obligatorio para el contrato.");
  }

  if (!data.pais || !['ESPAÑA', 'PAÍSES BAJOS'].includes(data.pais.toUpperCase())) {
    errors.push("El país debe ser ESPAÑA o PAÍSES BAJOS.");
  }

  if (!data.direccion_instalacion || data.direccion_instalacion.trim().length < 8) {
    errors.push("La dirección de instalación debe ser completa.");
  }

  if (!data.cuenta_bancaria_iban || !/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(data.cuenta_bancaria_iban.replace(/\s/g, ''))) {
    errors.push("El IBAN de la cuenta bancaria no es válido.");
  }

  if (!data.telefono_contacto) {
    errors.push("El teléfono de contacto es obligatorio.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorMessage: errors.join(" ")
  };
}

export function validateSipData(sip: any): Record<string, string> {
  const errors: Record<string, string> = {};

  if (sip.number && !/^\d{9,15}$/.test(sip.number.replace(/\s/g, ''))) {
    errors.number = "Número inválido (9-15 dígitos).";
  }

  if (sip.user && sip.user.length < 3) {
    errors.user = "Usuario demasiado corto.";
  }

  if (sip.server && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sip.server)) {
    errors.server = "Formato de servidor inválido (ej: sip.empresa.com).";
  }

  return errors;
}
