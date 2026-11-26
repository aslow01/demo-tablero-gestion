// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/lib/datos/azar.ts.
// Cambios: ninguno de código; en el comentario, la referencia a docs/diseno.md pasa a la sección 5 (generador) de esta demo.
// Azar con semilla (mulberry32). El generador y el dominio no usan el azar del sistema (docs/diseno.md, sección 5).
// El orden de las llamadas es parte del contrato: si cambia, cambian los datos de ejemplo.

export interface Azar {
  /** Número en [0, 1). */
  siguiente(): number;
  /** Entero en [min, max], los dos incluidos. */
  entero(min: number, max: number): number;
  elegir<T>(lista: readonly T[]): T;
  /** `true` con probabilidad `p` (0 a 1). */
  probabilidad(p: number): boolean;
}

export function crearAzar(semilla: number): Azar {
  let estado = semilla | 0;
  const siguiente = (): number => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    siguiente,
    entero(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new Error(`Rango inválido: ${min} a ${max}`);
      return min + Math.floor(siguiente() * (max - min + 1));
    },
    elegir(lista) {
      if (lista.length === 0) throw new Error("No se puede elegir de una lista vacía");
      return lista[Math.floor(siguiente() * lista.length)] as (typeof lista)[number];
    },
    probabilidad(p) {
      return siguiente() < p;
    },
  };
}
