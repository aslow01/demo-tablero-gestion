// Los casos plantados de la semilla publicada (docs/diseno.md, 5.3): comprobantes y recibos **literales**, que no usan el azar, con un alias estable.
// Son los que el visitante ve en el recorrido y en «Cómo se calcula». El generador los agrega **después** del relleno, en el orden de la tabla.
// Los resultados por comprobante de estos casos no dependen de la semilla (el relleno nunca los toca); los de conjunto (mora, tramos, rankings), sí.
// Todos los cobros son por transferencia salvo que se diga otra cosa; el IVA, el total y el vencimiento los calcula la numeración (M2, C4).

import type { BorradorDeComprobante, BorradorDeRecibo } from "../dominio/comprobantes.ts";
import { pesos } from "./pesos.ts";

/** Una factura de los casos: servicio fijo, sin asociación. */
function factura(clave: string, clienteId: string, emision: string, neto: number): BorradorDeComprobante {
  return { clave, tipo: 1, clienteId, emision, servicio: "alquiler-4x4", neto: pesos(neto), asociadoA: null };
}

/** Un recibo de los casos: `transferencia` por defecto. */
function recibo(clave: string, clienteId: string, fecha: string, medios: readonly (readonly [BorradorDeRecibo["medios"][number]["medio"], number])[], imputaciones: readonly (readonly [string, number])[]): BorradorDeRecibo {
  return {
    clave,
    clienteId,
    fecha,
    medios: medios.map(([medio, importe]) => ({ medio, importe: pesos(importe) })),
    imputaciones: imputaciones.map(([comprobante, importe]) => ({ comprobante, importe: pesos(importe) })),
  };
}

/** Los comprobantes de la tabla de 5.3, en su orden. */
export const COMPROBANTES_PLANTADOS: readonly BorradorDeComprobante[] = [
  // T02: factura cobrada en 3 pagos, el segundo y el tercero después del vencimiento (S2, S6).
  factura("T02-F", "C03", "2026-07-10", 1_000_000),
  // T04: vence exactamente el 31/10/2026 (S3).
  factura("T04-F", "C01", "2026-09-16", 250_000),
  // T05: cobro del 03/11/2026, posterior al calendario (S1).
  factura("T05-F", "C05", "2026-09-25", 300_000),
  // T07: sobrepago de C09 (R4).
  factura("T07-F", "C09", "2026-06-15", 200_000),
  // T08: cancelada con transferencia y retenciones (R2).
  factura("T08-F", "C02", "2026-02-14", 1_000_000),
  // T12-d91 y T17: el comprobante del recorrido de 2 minutos, con una NC parcial.
  factura("T12-d91", "C05", "2026-07-02", 900_000),
  { clave: "T17-NC", tipo: 3, clienteId: "C05", emision: "2026-07-20", servicio: "alquiler-4x4", neto: pesos(100_000), asociadoA: "T12-d91" },
];

/** Los recibos de la tabla de 5.3, en su orden. */
export const RECIBOS_PLANTADOS: readonly BorradorDeRecibo[] = [
  recibo("T02-R1", "C03", "2026-07-31", [["transferencia", 400_000]], [["T02-F", 400_000]]),
  recibo("T02-R2", "C03", "2026-09-15", [["transferencia", 400_000]], [["T02-F", 400_000]]),
  recibo("T02-R3", "C03", "2026-10-12", [["transferencia", 410_000]], [["T02-F", 410_000]]),
  recibo("T05-R", "C05", "2026-11-03", [["transferencia", 363_000]], [["T05-F", 363_000]]),
  // T06: pago a cuenta sin imputar de C07 (R4).
  recibo("T06-R", "C07", "2026-10-20", [["transferencia", 50_000]], []),
  recibo("T07-R", "C09", "2026-08-10", [["transferencia", 300_000]], [["T07-F", 242_000]]),
  recibo("T08-R", "C02", "2026-04-30", [["transferencia", 1_170_000], ["retencion-iibb", 25_000], ["retencion-ganancias", 15_000]], [["T08-F", 1_210_000]]),
  recibo("T17-R1", "C05", "2026-08-12", [["transferencia", 234_000], ["retencion-iibb", 5_000], ["retencion-ganancias", 3_000]], [["T12-d91", 242_000]]),
  recibo("T17-R2", "C05", "2026-10-14", [["transferencia", 121_000]], [["T12-d91", 121_000]]),
];

/** Los alias de los comprobantes plantados, en el orden de la tabla. */
export const ALIAS_DE_COMPROBANTES = COMPROBANTES_PLANTADOS.map((c) => c.clave);

/** Los alias de los recibos plantados, en el orden de la tabla. */
export const ALIAS_DE_RECIBOS = RECIBOS_PLANTADOS.map((r) => r.clave);

/** Alias → id de cada plantado (los ids dependen de la numeración, o sea del relleno de la semilla). El generador lo devuelve junto con los datos. */
export type Plantados = Readonly<Record<string, string>>;
