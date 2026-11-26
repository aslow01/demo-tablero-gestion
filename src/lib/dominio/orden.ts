// Orden por defecto de las partidas de un desglose (docs/diseno-ui.md, 5.9.2 y 6.4). Puro: recibe la lista y devuelve otra.
// `partidasDe` entrega las partidas por fecha, que es el orden del camino por listado; este módulo es el orden que ve quien lee la tabla.
// Ordenar no toca importes ni cantidad: el cierre al centavo no depende del orden.

import { comparar } from "./comprobantes.ts";
import type { ClaveDeMedida, Partida } from "./tipos.ts";

/** Las medidas de saldo (5.9.2): las que traen `partida.atraso` en sus comprobantes (4.3). */
const CLAVES_DE_SALDO: readonly ClaveDeMedida[] = ["saldo", "mora", "mora-otros", "tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90", "saldo-neto"];

export function esMedidaDeSaldo(clave: ClaveDeMedida): boolean {
  return CLAVES_DE_SALDO.includes(clave);
}

/** Los cuatro criterios que ofrece el desglose (5.9.2): `atraso` solo en las medidas de saldo. */
export type CriterioDeOrden = "atraso" | "importe" | "fecha" | "referencia";

/** Los criterios que ofrece el desglose de una medida, en el orden del selector: `atraso` va último y solo en las medidas de saldo. */
export function criteriosDeOrden(clave: ClaveDeMedida): CriterioDeOrden[] {
  return esMedidaDeSaldo(clave) ? ["importe", "fecha", "referencia", "atraso"] : ["importe", "fecha", "referencia"];
}

/** Por atraso en las medidas de saldo (la pregunta de cobranzas: «¿desde cuándo me deben?»); por importe en las demás. */
export function ordenPorDefecto(clave: ClaveDeMedida): CriterioDeOrden {
  return esMedidaDeSaldo(clave) ? "atraso" : "importe";
}

/** Mayor importe primero (firmado: una nota de crédito queda al final). */
function porImporte(a: Partida, b: Partida): number {
  return a.importe === b.importe ? 0 : a.importe > b.importe ? -1 : 1;
}

/** El desempate final, para que el orden no dependa del de entrada: fecha más vieja, comprobantes antes que recibos, id. */
function porFechaYReferencia(a: Partida, b: Partida): number {
  const grupo = (p: Partida): number => (p.ref.tipo === "comprobante" ? 0 : 1);
  return comparar(a.fecha, b.fecha) || grupo(a) - grupo(b) || comparar(a.ref.id, b.ref.id);
}

/** Mayor atraso primero; las partidas sin atraso (los pagos a cuenta de `saldo-neto`) después de todas las que lo tienen. Un atraso de 0 o negativo cuenta. */
function porAtraso(a: Partida, b: Partida): number {
  if (a.atraso === undefined || b.atraso === undefined) return a.atraso === b.atraso ? 0 : a.atraso === undefined ? 1 : -1;
  return a.atraso === b.atraso ? 0 : a.atraso > b.atraso ? -1 : 1;
}

/** El comparador de cada criterio. Todos terminan en `porFechaYReferencia`: el resultado no depende del orden de entrada. */
const COMPARADORES: Readonly<Record<CriterioDeOrden, (a: Partida, b: Partida) => number>> = {
  atraso: (a, b) => porAtraso(a, b) || porImporte(a, b) || porFechaYReferencia(a, b),
  importe: (a, b) => porImporte(a, b) || porFechaYReferencia(a, b),
  fecha: porFechaYReferencia,
  referencia: (a, b) => comparar(a.ref.id, b.ref.id) || porFechaYReferencia(a, b),
};

/**
 * `atraso`: atraso mayor primero; en el empate, importe mayor; las partidas sin atraso, al final y por importe (5.9.2).
 * `importe`: importe mayor primero; en el empate, la fecha más vieja primero.
 * `fecha`: la fecha más vieja primero; el mismo día, comprobantes antes que recibos y por referencia.
 * `referencia`: el id de menor a mayor.
 * Lo que sigue empatando se desempata por fecha, tipo y referencia. Devuelve una lista nueva.
 */
export function ordenarPartidas(partidas: readonly Partida[], criterio: CriterioDeOrden): Partida[] {
  return [...partidas].sort(COMPARADORES[criterio]);
}
