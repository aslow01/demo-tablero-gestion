// Pesos enteros a centavos, para escribir los importes de los datos de ejemplo (docs/diseno.md, 5.1 y 5.3: «en pesos enteros»).
import { centavos } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";

/** `pesos(1_000)` son 100.000 centavos. Lanza si no es un entero (la demo no trabaja con fracciones de peso en los importes de ejemplo). */
export function pesos(n: number): Centavos {
  if (!Number.isInteger(n)) throw new Error(`Los importes de ejemplo son en pesos enteros (llegó ${n}).`);
  return centavos(n * 100);
}
