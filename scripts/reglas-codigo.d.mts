// Tipos de `reglas-codigo.mjs` (para que los tests en TypeScript lo importen con `strict`).
export interface Regla {
  nombre: string;
  /** Qué rutas mira (ruta relativa con `/`). */
  donde: RegExp;
  /** Qué prohíbe, sobre cada línea. */
  patron?: RegExp;
  /** Alternativa a `patron`: función sobre la línea. */
  coincide?: (linea: string) => boolean;
  /** Rutas exactas que se exceptúan. */
  excepto: readonly string[];
}
export interface ArchivoLeido {
  ruta: string;
  texto: string;
}
export interface Hallazgo {
  ruta: string;
  linea: number;
  regla: string;
  texto: string;
}
export const REGLAS_DE_CODIGO: readonly Regla[];
export function hallazgosDe(archivos: readonly ArchivoLeido[], reglas: readonly Regla[]): Hallazgo[];
