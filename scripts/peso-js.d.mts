// Tipos de `peso-js.mjs` (para que los tests en TypeScript lo importen con `strict`).
export interface ArchivoMedido {
  /** Ruta relativa a la carpeta medida, con `/`. */
  nombre: string;
  bytes: number;
  gzip: number;
}
export interface MedidaDeJs {
  archivos: ArchivoMedido[];
  /** La suma del gzip de cada archivo `.js`: lo que cuenta para el tope. */
  total: number;
  /** El gzip del CSS (informativo). */
  css: number;
}
export interface ArchivoLeido {
  nombre: string;
  contenido: Uint8Array;
}
export const TOPE_DE_JS: number;
export function pesoGzip(contenido: Uint8Array): number;
export function leerCarpeta(carpeta: string): ArchivoLeido[];
export function medirArchivos(entradas: readonly ArchivoLeido[]): MedidaDeJs;
export function evaluar(total: number, tope?: number): { dentro: boolean; margen: number };
export function formatearPeso(bytes: number): string;
