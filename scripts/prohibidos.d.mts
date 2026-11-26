// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/prohibidos.d.mts.
// Cambios: sin `marcaPendienteDeConfirmar`.
// Tipos de `prohibidos.mjs` (para que los tests en TypeScript lo importen con `strict`).
/** Un término ya normalizado y partido en palabras (`["quentaro", "brisa", "norte"]`). */
export type Termino = readonly string[];
export const ARCHIVO_LOCAL: string;
export function normalizar(texto: string): string;
export function tokenizar(texto: string): string[];
export function terminosDeJson(contenido: string): Termino[];
export function contieneProhibido(texto: string, terminos: readonly Termino[]): boolean;
export function correosNoPermitidos(texto: string): string[];
