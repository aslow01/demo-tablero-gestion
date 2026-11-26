// Antigüedad de saldos (docs/diseno.md, 6.5): A1, tramos excluyentes sobre los días de atraso de S3.

import type { ClaveDeMedida } from "./tipos.ts";

export type Tramo = "no-vencido" | "1-30" | "31-60" | "61-90" | "mas-90";

export interface LimitesDeTramo {
  clave: Tramo;
  /** Días de atraso, incluido. */
  minimo: number;
  /** Días de atraso, incluido. */
  maximo: number;
}

/** Los tramos de A1 con sus límites, en orden. `agregados.ts` los usa para armar la ventana de vencimiento de cada tramo (4.2.1). */
export const TRAMOS: readonly LimitesDeTramo[] = [
  { clave: "no-vencido", minimo: Number.NEGATIVE_INFINITY, maximo: 0 },
  { clave: "1-30", minimo: 1, maximo: 30 },
  { clave: "31-60", minimo: 31, maximo: 60 },
  { clave: "61-90", minimo: 61, maximo: 90 },
  { clave: "mas-90", minimo: 91, maximo: Number.POSITIVE_INFINITY },
];

/** La clave de la medida del catálogo (4.2) de cada tramo. */
export const CLAVE_DE_MEDIDA_DEL_TRAMO: Readonly<Record<Tramo, ClaveDeMedida>> = {
  "no-vencido": "tramo-no-vencido",
  "1-30": "tramo-1-30",
  "31-60": "tramo-31-60",
  "61-90": "tramo-61-90",
  "mas-90": "tramo-mas-90",
};

/** A1: el tramo de un atraso en días (entero, con signo): d ≤ 0 no vencido, 1–30, 31–60, 61–90 y d ≥ 91 más de 90. */
export function tramoDe(atraso: number): Tramo {
  if (!Number.isInteger(atraso)) throw new Error(`Los días de atraso tienen que ser un entero (llegó ${atraso}).`);
  if (atraso <= 0) return "no-vencido";
  if (atraso <= 30) return "1-30";
  if (atraso <= 60) return "31-60";
  if (atraso <= 90) return "61-90";
  return "mas-90";
}
