// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/lib/datos/cuit.ts.
// Cambios: ninguno.
// CUIT argentino: 11 dígitos, el último es el verificador (módulo 11, pesos 5,4,3,2,7,6,5,4,3,2).
// Código propio, reutilizado de la demo "Lector de facturas" (mismo autor).

const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Deja solo los dígitos de un texto o número. */
export function soloDigitos(valor: string | number): string {
  return String(valor).replace(/\D/g, "");
}

/**
 * Dígito verificador de los 10 primeros dígitos. Devuelve `null` si la base no
 * tiene 10 dígitos o si el resto da 1 (no existe dígito válido: no se acepta).
 */
export function digitoVerificador(base10: string): number | null {
  if (!/^\d{10}$/.test(base10)) return null;
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += Number(base10[i]) * (PESOS[i] as number);
  }
  const resto = suma % 11;
  if (resto === 0) return 0;
  if (resto === 1) return null;
  return 11 - resto;
}

/** `true` si el valor tiene 11 dígitos y el dígito verificador es correcto. */
export function cuitValido(valor: string | number): boolean {
  if (typeof valor === "number" && !Number.isSafeInteger(valor)) return false;
  const digitos = soloDigitos(valor);
  if (digitos.length !== 11) return false;
  const dv = digitoVerificador(digitos.slice(0, 10));
  return dv !== null && dv === Number(digitos[10]);
}

/** Muestra un CUIT como `30-12345678-9`. Si no tiene 11 dígitos, devuelve el texto tal cual. */
export function formatearCuit(valor: string | number): string {
  const digitos = soloDigitos(valor);
  if (digitos.length !== 11) return String(valor);
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}

/** Arma un CUIT válido a partir de un prefijo de 2 dígitos y 8 dígitos de base. `null` si no existe verificador. */
export function armarCuit(prefijo: string, base8: string): string | null {
  const base10 = `${prefijo}${base8}`;
  const dv = digitoVerificador(base10);
  return dv === null ? null : `${base10}${dv}`;
}
