// Modelo de vista de un comprobante (docs/diseno-ui.md, 6.3): su situación al corte (saldo, atraso, tramo y ubicador), sus datos y
// sus movimientos (la emisión, las notas de crédito y los cobros, con el saldo corrido), y aparte los posteriores al corte, que se muestran pero no
// cuentan (S1). El saldo se acumula con los movimientos —un cálculo independiente de `saldoAlCorte`— y se compara con él antes de entregar nada (S2, D2):
// si difieren lanza `ErrorDeCierre`, como cualquier medida.
// También: los índices por id (comprobantes, recibos) que usan las demás vistas, y el detalle de un recibo, que la pantalla pide al desplegarlo.

import { tramoDe } from "../dominio/antiguedad.ts";
import type { Tramo } from "../dominio/antiguedad.ts";
import { comparar } from "../dominio/comprobantes.ts";
import { aCuentaDelRecibo, atraso as atrasoAlCorte, existeAlCorte, saldoAlCorte } from "../dominio/corte.ts";
import { restar, sumar, sumarLista } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";
import { ErrorDeCierre } from "../dominio/medidas.ts";
import type { Cliente, Comprobante, Datos, FechaCivil, Medio, Recibo, Servicio, TipoCmp } from "../dominio/tipos.ts";
import { ubicadorDe, ultimoDiaDelMes } from "./formato.ts";
import type { Ubicador } from "./formato.ts";
import type { RefDeComprobante } from "./tipos.ts";

// ---------------------------------------------------------------------------------------------------------------------------
// Índices por id
// ---------------------------------------------------------------------------------------------------------------------------

interface Indice {
  comprobantes: Map<string, Comprobante>;
  recibos: Map<string, Recibo>;
  clientes: Map<string, Cliente>;
  /** Los cobros que recibió cada comprobante: el recibo y cuánto le imputó. */
  cobros: Map<string, { recibo: Recibo; importe: Centavos }[]>;
  /** Las notas de crédito asociadas a cada comprobante. */
  notasDeCredito: Map<string, Comprobante[]>;
}

// Los datos no cambian (están congelados): el índice se arma una vez por conjunto y se descarta con él, como el de `corte.ts`.
const INDICES = new WeakMap<Datos, Indice>();

function indiceDe(datos: Datos): Indice {
  const existente = INDICES.get(datos);
  if (existente !== undefined) return existente;
  const indice: Indice = {
    comprobantes: new Map(datos.comprobantes.map((c) => [c.id, c])),
    recibos: new Map(datos.recibos.map((r) => [r.id, r])),
    clientes: new Map(datos.clientes.map((c) => [c.id, c])),
    cobros: new Map(),
    notasDeCredito: new Map(),
  };
  for (const c of datos.comprobantes) {
    if (c.tipo === 3 && c.asociadoA !== null) indice.notasDeCredito.set(c.asociadoA, [...(indice.notasDeCredito.get(c.asociadoA) ?? []), c]);
  }
  for (const r of datos.recibos) {
    for (const i of r.imputaciones) indice.cobros.set(i.comprobanteId, [...(indice.cobros.get(i.comprobanteId) ?? []), { recibo: r, importe: i.importe }]);
  }
  INDICES.set(datos, indice);
  return indice;
}

export function comprobantePorId(datos: Datos, id: string): Comprobante | undefined {
  return indiceDe(datos).comprobantes.get(id);
}

export function reciboPorId(datos: Datos, id: string): Recibo | undefined {
  return indiceDe(datos).recibos.get(id);
}

function exigirComprobante(indice: Indice, id: string): Comprobante {
  const c = indice.comprobantes.get(id);
  if (c === undefined) throw new Error(`No hay ningún comprobante con el id ${id}.`);
  return c;
}

function exigirCliente(indice: Indice, id: string): Cliente {
  const c = indice.clientes.get(id);
  if (c === undefined) throw new Error(`Error interno: el cliente ${id} no está en los datos.`);
  return c;
}

function referenciaDe(c: Comprobante): RefDeComprobante {
  return { id: c.id, tipo: c.tipo };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Recibos
// ---------------------------------------------------------------------------------------------------------------------------

export interface DetalleDeRecibo {
  id: string;
  clienteId: string;
  fecha: FechaCivil;
  /** La suma de todos los medios (las retenciones cuentan, R2). */
  total: Centavos;
  medios: { medio: Medio; importe: Centavos }[];
  imputaciones: { comprobante: RefDeComprobante; importe: Centavos }[];
  /** La suma de lo imputado. */
  imputado: Centavos;
  /** Lo que quedó sin imputar: `total − imputado` (R1, 0 o más). */
  aCuenta: Centavos;
}

/** Lo que muestra un recibo desplegado: sus medios, a qué comprobantes se imputó y cuánto quedó a cuenta. Lanza si el recibo no existe. */
export function detalleDeRecibo(datos: Datos, reciboId: string): DetalleDeRecibo {
  const indice = indiceDe(datos);
  const r = indice.recibos.get(reciboId);
  if (r === undefined) throw new Error(`No hay ningún recibo con el id ${reciboId}.`);
  return {
    id: r.id,
    clienteId: r.clienteId,
    fecha: r.fecha,
    total: sumarLista(r.medios.map((m) => m.importe)),
    medios: r.medios.map((m) => ({ medio: m.medio, importe: m.importe })),
    imputaciones: r.imputaciones.map((i) => ({ comprobante: referenciaDe(exigirComprobante(indice, i.comprobanteId)), importe: i.importe })),
    imputado: sumarLista(r.imputaciones.map((i) => i.importe)),
    aCuenta: aCuentaDelRecibo(r),
  };
}

// ---------------------------------------------------------------------------------------------------------------------------
// El comprobante
// ---------------------------------------------------------------------------------------------------------------------------

/** «Datos del comprobante»: lo mismo en las tres formas de la pantalla. */
export interface DatosDeComprobante {
  id: string;
  tipo: TipoCmp;
  clienteId: string;
  /** La razón social (dato del cliente). */
  nombreDelCliente: string;
  /** El plazo de pago del cliente: «vencimiento: plazo de N días». */
  plazoDias: number;
  emision: FechaCivil;
  vencimiento: FechaCivil;
  servicio: Servicio;
  neto: Centavos;
  iva: Centavos;
  total: Centavos;
  /** La factura a la que se asocia (una nota de crédito, o una de débito que lo diga). */
  asociadaA: RefDeComprobante | null;
  /** Las notas de crédito que existen al corte (S1: las posteriores no existen y se ven solo entre los movimientos posteriores). */
  notasDeCredito: RefDeComprobante[];
}

export interface MovimientoDeComprobante {
  fecha: FechaCivil;
  clase: "emision" | "nota-de-credito" | "cobro";
  /** Lo que se emitió o cobró: el id del propio comprobante, de la nota de crédito o del recibo. */
  referencia: string;
  /** La emisión suma su total. */
  debe: Centavos;
  /** Una nota de crédito resta su total; un cobro, lo que imputó a este comprobante. */
  haber: Centavos;
  /** Solo en un cobro: `true` si después de él todavía quedaba saldo (contando toda la historia): «Cobro parcial». */
  parcial: boolean;
  /** El saldo acumulado; `null` en los movimientos posteriores al corte, que no cuentan. */
  saldo: Centavos | null;
}

export type SituacionDelComprobante =
  | {
      estado: "con-saldo";
      saldo: Centavos;
      /** S3: días entre el vencimiento y el corte; 0 o menos es no vencido. */
      atraso: number;
      tramo: Tramo;
      ubicador: Ubicador;
      /** `true` si ya recibió algún cobro al corte: el atraso se cuenta desde el vencimiento original, no desde el último pago. */
      conCobros: boolean;
    }
  | {
      /** Saldo 0: `cancelado` con cobros o notas de crédito parciales; `anulado` si las notas de crédito cubren todo el total. */
      estado: "cancelado" | "anulado";
      saldo: Centavos;
      /** La fecha del último movimiento que existe al corte. */
      fechaDelUltimoMovimiento: FechaCivil;
    };

interface BaseDeVista {
  corte: FechaCivil;
  datos: DatosDeComprobante;
}

/** Se emitió después del corte: a esa fecha no existía. Ofrece verlo al cierre de su mes. */
export interface VistaDeComprobantePosterior extends BaseDeVista {
  clase: "posterior-al-corte";
  /** El último día del mes de emisión. */
  verAl: FechaCivil;
}

/** Una nota de crédito no tiene saldo propio: resta su total al de la factura que acredita. */
export interface VistaDeNotaDeCredito extends BaseDeVista {
  clase: "nota-de-credito";
  asociada: RefDeComprobante;
}

/** Una factura o nota de débito que existe al corte. */
export interface VistaDeComprobanteVigente extends BaseDeVista {
  clase: "comprobante";
  situacion: SituacionDelComprobante;
  /** Los movimientos que existen al corte, por fecha, con el saldo corrido; el último saldo es la situación. */
  movimientos: MovimientoDeComprobante[];
  /** Los posteriores al corte, sin saldo. */
  posteriores: MovimientoDeComprobante[];
}

export type VistaComprobante = VistaDeComprobantePosterior | VistaDeNotaDeCredito | VistaDeComprobanteVigente;

function datosDe(indice: Indice, c: Comprobante, corte: FechaCivil): DatosDeComprobante {
  const cliente = exigirCliente(indice, c.clienteId);
  return {
    id: c.id,
    tipo: c.tipo,
    clienteId: c.clienteId,
    nombreDelCliente: cliente.razonSocial,
    plazoDias: cliente.plazoDias,
    emision: c.emision,
    vencimiento: c.vencimiento,
    servicio: c.servicio,
    neto: c.neto,
    iva: c.iva,
    total: c.total,
    asociadaA: c.asociadoA === null ? null : referenciaDe(exigirComprobante(indice, c.asociadoA)),
    notasDeCredito: (indice.notasDeCredito.get(c.id) ?? []).filter((nc) => existeAlCorte(nc, corte)).map(referenciaDe),
  };
}

interface Hecho {
  /** El mismo día, primero la emisión y las notas de crédito (0) y después los cobros (1). */
  grupo: 0 | 1;
  clase: MovimientoDeComprobante["clase"];
  referencia: string;
  fecha: FechaCivil;
  debe: Centavos;
  haber: Centavos;
}

/** Toda la historia del comprobante, ordenada: por fecha, el mismo día emisión y notas de crédito antes que cobros, y por id. */
function hechosDe(indice: Indice, c: Comprobante): Hecho[] {
  const cero = sumar();
  return [
    { grupo: 0 as const, clase: "emision" as const, referencia: c.id, fecha: c.emision, debe: c.total, haber: cero },
    ...(indice.notasDeCredito.get(c.id) ?? []).map((nc) => ({ grupo: 0 as const, clase: "nota-de-credito" as const, referencia: nc.id, fecha: nc.emision, debe: cero, haber: nc.total })),
    ...(indice.cobros.get(c.id) ?? []).map((x) => ({ grupo: 1 as const, clase: "cobro" as const, referencia: x.recibo.id, fecha: x.recibo.fecha, debe: cero, haber: x.importe })),
  ].sort((a, b) => comparar(a.fecha, b.fecha) || a.grupo - b.grupo || comparar(a.referencia, b.referencia));
}

/**
 * La vista de un comprobante al corte. Lanza si el id no existe. Una nota de crédito o un comprobante emitido después del corte no traen movimientos
 * ni situación: el primero se explica por su factura, el segundo ofrece verlo al cierre de su mes.
 */
export function vistaComprobante(datos: Datos, corte: FechaCivil, comprobanteId: string): VistaComprobante {
  const indice = indiceDe(datos);
  const c = exigirComprobante(indice, comprobanteId);
  const base: BaseDeVista = { corte, datos: datosDe(indice, c, corte) };
  if (!existeAlCorte(c, corte)) return { ...base, clase: "posterior-al-corte", verAl: ultimoDiaDelMes(c.emision) };
  if (c.tipo === 3) {
    if (c.asociadoA === null) throw new Error(`Error interno: la nota de crédito ${c.id} no está asociada a ninguna factura.`);
    return { ...base, clase: "nota-de-credito", asociada: referenciaDe(exigirComprobante(indice, c.asociadoA)) };
  }

  // «Cobro parcial» mira toda la historia: si después de ese cobro todavía quedaba saldo, aunque lo cobrado después del corte lo cancele.
  let acumuladoTotal = sumar();
  let saldo = sumar();
  const movimientos: MovimientoDeComprobante[] = [];
  const posteriores: MovimientoDeComprobante[] = [];
  for (const h of hechosDe(indice, c)) {
    acumuladoTotal = restar(sumar(acumuladoTotal, h.debe), h.haber);
    const parcial = h.clase === "cobro" && acumuladoTotal > 0;
    if (h.fecha <= corte) {
      saldo = restar(sumar(saldo, h.debe), h.haber);
      movimientos.push({ fecha: h.fecha, clase: h.clase, referencia: h.referencia, debe: h.debe, haber: h.haber, parcial, saldo });
    } else {
      posteriores.push({ fecha: h.fecha, clase: h.clase, referencia: h.referencia, debe: h.debe, haber: h.haber, parcial, saldo: null });
    }
  }

  // D2 también acá: el saldo de los movimientos y el del dominio (S2, otro cálculo) tienen que coincidir al centavo, o el número no se muestra.
  const delDominio = saldoAlCorte(datos, c.id, corte);
  if (saldo !== delDominio) throw new ErrorDeCierre(`saldo de ${c.id}`, saldo, delDominio, "el saldo del dominio (S2)");

  let situacion: SituacionDelComprobante;
  if (saldo === 0) {
    const acreditado = sumarLista((indice.notasDeCredito.get(c.id) ?? []).filter((nc) => existeAlCorte(nc, corte)).map((nc) => nc.total));
    const ultimo = movimientos[movimientos.length - 1];
    situacion = { estado: acreditado > 0 && acreditado === c.total ? "anulado" : "cancelado", saldo, fechaDelUltimoMovimiento: ultimo?.fecha ?? c.emision };
  } else {
    const dias = atrasoAlCorte(c, corte);
    situacion = { estado: "con-saldo", saldo, atraso: dias, tramo: tramoDe(dias), ubicador: ubicadorDe(dias), conCobros: movimientos.some((m) => m.clase === "cobro") };
  }
  return { ...base, clase: "comprobante", situacion, movimientos, posteriores };
}
