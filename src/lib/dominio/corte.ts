// Fecha de corte, saldo y cuenta corriente (docs/diseno.md, 4.1 y 6.4): S1, S2, S3, S5, S6, S7 y R4. Todo es una función pura de
// `(datos, corte)`: el dominio no tiene reloj. Las funciones aceptan **cualquier fecha civil válida** como corte; solo
// `resolverCorte`, que lee la dirección, exige un cierre de mes del rango (S5).
//
// Este módulo es el camino por listado de 4.2.1 (el saldo de cada comprobante). `agregados.ts` NO lo importa.

import { comparar } from "./comprobantes.ts";
import { negar, restar, sumar, sumarLista } from "./dinero.ts";
import type { Centavos } from "./dinero.ts";
import { diasEntre, exigirCorte, sumarDias } from "./fechas.ts";
import { avisoDeCorteInvalido } from "./textos.ts";
import type { Comprobante, Datos, FechaCivil, Recibo } from "./tipos.ts";

// ---------------------------------------------------------------------------------------------------------------------------
// S5: la fecha de corte de la dirección
// ---------------------------------------------------------------------------------------------------------------------------

/** El último día del mes de una fecha civil válida (el cierre de ese mes). */
function cierreDelMes(fecha: FechaCivil): FechaCivil {
  let dia = fecha;
  while (sumarDias(dia, 1).slice(0, 7) === dia.slice(0, 7)) dia = sumarDias(dia, 1);
  return dia;
}

/** Los cierres de mes entre `desde` y `hasta` (los dos del conjunto de datos), en orden: 22 con el calendario fijo de la demo (S5). */
export function cierresDeMes(datos: Pick<Datos, "desde" | "hasta">): FechaCivil[] {
  const cierres: FechaCivil[] = [];
  let cierre = cierreDelMes(exigirCorte(datos.desde));
  while (cierre <= datos.hasta) {
    cierres.push(cierre);
    cierre = cierreDelMes(sumarDias(cierre, 1));
  }
  return cierres;
}

export interface CorteResuelto {
  corte: FechaCivil;
  /** El aviso de S5 si la dirección traía un corte inválido; `null` si no hay nada que avisar. */
  aviso: string | null;
}

/**
 * Corte de la dirección (S5). Ausente → el de por defecto (`hasta`) sin aviso. Válido es **un cierre de mes** entre el primero
 * del rango y `hasta`; cualquier otra cosa (una fecha que no existe, fuera de rango, que no es cierre de mes o repetida en la
 * dirección, que llega como lista con más de un valor) vuelve al corte por defecto con el aviso. Es la única función que exige
 * cierre de mes.
 */
export function resolverCorte(texto: string | readonly string[] | null | undefined, datos: Pick<Datos, "desde" | "hasta">): CorteResuelto {
  const porDefecto = datos.hasta;
  const valores = texto === null || texto === undefined ? [] : typeof texto === "string" ? [texto] : texto;
  if (valores.length === 0) return { corte: porDefecto, aviso: null };
  const unico = valores[0];
  if (valores.length === 1 && unico !== undefined && cierresDeMes(datos).includes(unico)) return { corte: unico, aviso: null };
  return { corte: porDefecto, aviso: avisoDeCorteInvalido(porDefecto) };
}

/** S7: el mes calendario que contiene el corte, `AAAA-MM`. */
export function mesDelCorte(corte: FechaCivil): string {
  return exigirCorte(corte).slice(0, 7);
}

// ---------------------------------------------------------------------------------------------------------------------------
// S1: existe al corte
// ---------------------------------------------------------------------------------------------------------------------------

/** S1: un comprobante con `emision ≤ corte` o un recibo con `fecha ≤ corte` existe para ese corte; lo posterior no existe en ningún cálculo. */
export function existeAlCorte(x: Comprobante | Recibo, corte: FechaCivil): boolean {
  const fecha = "emision" in x ? x.emision : x.fecha;
  return fecha <= corte;
}

// ---------------------------------------------------------------------------------------------------------------------------
// S2 y S3: saldo y atraso de cada comprobante
// ---------------------------------------------------------------------------------------------------------------------------

export interface SaldoDeComprobante {
  comprobante: Comprobante;
  /** S2: total − imputaciones que existen al corte − NC asociadas que existen al corte. */
  saldo: Centavos;
  /** S3: días entre el vencimiento y el corte; 0 o menos es no vencido. */
  atraso: number;
}

interface Indice {
  porId: Map<string, Comprobante>;
  /** Las imputaciones que recibió cada comprobante, con la fecha del recibo. */
  imputaciones: Map<string, { fecha: FechaCivil; importe: Centavos }[]>;
  /** Las NC asociadas a cada comprobante. */
  notasDeCredito: Map<string, Comprobante[]>;
  /** Saldos ya calculados, por corte. */
  saldosPorCorte: Map<FechaCivil, SaldoDeComprobante[]>;
}

// Los datos no cambian (son de solo lectura): el índice se arma una vez por conjunto y se descarta con él.
const INDICES = new WeakMap<Datos, Indice>();

function indiceDe(datos: Datos): Indice {
  const existente = INDICES.get(datos);
  if (existente !== undefined) return existente;
  const indice: Indice = { porId: new Map(), imputaciones: new Map(), notasDeCredito: new Map(), saldosPorCorte: new Map() };
  for (const c of datos.comprobantes) {
    if (!indice.porId.has(c.id)) indice.porId.set(c.id, c);
    if (c.tipo === 3 && c.asociadoA !== null) {
      const lista = indice.notasDeCredito.get(c.asociadoA) ?? [];
      lista.push(c);
      indice.notasDeCredito.set(c.asociadoA, lista);
    }
  }
  for (const r of datos.recibos) {
    for (const i of r.imputaciones) {
      const lista = indice.imputaciones.get(i.comprobanteId) ?? [];
      lista.push({ fecha: r.fecha, importe: i.importe });
      indice.imputaciones.set(i.comprobanteId, lista);
    }
  }
  INDICES.set(datos, indice);
  return indice;
}

function saldoDelComprobante(indice: Indice, c: Comprobante, corte: FechaCivil): Centavos {
  const cobrado = sumarLista((indice.imputaciones.get(c.id) ?? []).filter((i) => i.fecha <= corte).map((i) => i.importe));
  const acreditado = sumarLista((indice.notasDeCredito.get(c.id) ?? []).filter((nc) => nc.emision <= corte).map((nc) => nc.total));
  return restar(restar(c.total, cobrado), acreditado);
}

/** S3: días de atraso = días entre el vencimiento y el corte (con signo). Vencido si son 1 o más. */
export function atraso(c: Pick<Comprobante, "vencimiento">, corte: FechaCivil): number {
  return diasEntre(c.vencimiento, exigirCorte(corte));
}

/**
 * Saldo de cada factura y nota de débito que existe al corte (S1, S2), en el orden de los datos, con su atraso (S3). Una NC no tiene
 * saldo propio y no se lista. Incluye los saldos 0. El resultado se guarda para el mismo corte: no se debe modificar.
 */
export function saldosAlCorte(datos: Datos, corte: FechaCivil): readonly SaldoDeComprobante[] {
  exigirCorte(corte);
  const indice = indiceDe(datos);
  const guardado = indice.saldosPorCorte.get(corte);
  if (guardado !== undefined) return guardado;
  const lista = datos.comprobantes
    .filter((c) => c.tipo !== 3 && existeAlCorte(c, corte))
    .map((c): SaldoDeComprobante => ({ comprobante: c, saldo: saldoDelComprobante(indice, c, corte), atraso: atraso(c, corte) }));
  indice.saldosPorCorte.set(corte, lista);
  return lista;
}

/**
 * Saldo de un comprobante al corte (S2). Una NC no tiene saldo propio y un comprobante emitido después del corte no existe para
 * ese corte (S1): los dos dan 0. Lanza si el id no existe.
 */
export function saldoAlCorte(datos: Datos, comprobanteId: string, corte: FechaCivil): Centavos {
  exigirCorte(corte);
  const indice = indiceDe(datos);
  const c = indice.porId.get(comprobanteId);
  if (c === undefined) throw new Error(`No hay ningún comprobante con el id ${comprobanteId}.`);
  if (c.tipo === 3 || !existeAlCorte(c, corte)) return sumar();
  return saldoDelComprobante(indice, c, corte);
}

// ---------------------------------------------------------------------------------------------------------------------------
// R4 y cuenta corriente: la posición de un cliente
// ---------------------------------------------------------------------------------------------------------------------------

/** A cuenta de un recibo: Σ medios (retenciones incluidas, R2) − Σ imputaciones. Es ≥ 0 por R1. */
export function aCuentaDelRecibo(r: Recibo): Centavos {
  return restar(sumarLista(r.medios.map((m) => m.importe)), sumarLista(r.imputaciones.map((i) => i.importe)));
}

export interface PosicionDelCliente {
  /** `S`: Σ saldos de sus comprobantes (≥ 0). */
  saldo: Centavos;
  /** `A`: Σ a cuenta de sus recibos que existen al corte (≥ 0). */
  aCuenta: Centavos;
  /** `A` si `S > 0`: pago a cuenta sin imputar, entero aunque supere a `S` (R4). Si no, 0. */
  pagosACuenta: Centavos;
  /** `A` si `S` no es mayor que 0 (R4: el cliente no debe nada). Si no, 0. */
  saldosAFavor: Centavos;
  /** `S − A`: puede ser negativo; es lo que cierra la cuenta corriente (D3). */
  saldoNeto: Centavos;
}

function exigirCliente(datos: Datos, clienteId: string): void {
  if (!datos.clientes.some((c) => c.id === clienteId)) throw new Error(`No hay ningún cliente con el id ${clienteId}.`);
}

/**
 * Posición de un cliente al corte (4.1, R4): se decide **por el cliente**, nunca por el recibo, y el a cuenta no se parte. Con
 * `S > 0` todo `A` es «pago a cuenta sin imputar»; con `S = 0` (R4) es «saldo a favor». Un `S` negativo no puede darse en datos
 * válidos (C3 y R3); se lee como el cliente que no debe nada.
 */
export function posicionDelCliente(datos: Datos, clienteId: string, corte: FechaCivil): PosicionDelCliente {
  exigirCliente(datos, clienteId);
  const saldo = sumarLista(saldosAlCorte(datos, corte).filter((s) => s.comprobante.clienteId === clienteId).map((s) => s.saldo));
  const aCuenta = sumarLista(datos.recibos.filter((r) => r.clienteId === clienteId && existeAlCorte(r, corte)).map(aCuentaDelRecibo));
  const conSaldo = saldo > 0;
  return {
    saldo,
    aCuenta,
    pagosACuenta: conSaldo ? aCuenta : sumar(),
    saldosAFavor: conSaldo ? sumar() : aCuenta,
    saldoNeto: restar(saldo, aCuenta),
  };
}

export interface Movimiento {
  ref: { tipo: "comprobante" | "recibo"; id: string };
  clienteId: string;
  fecha: FechaCivil;
  /** Factura y ND suman su total; NC resta su total; un recibo resta la suma de todos sus medios. */
  importe: Centavos;
  saldoAcumulado: Centavos;
}

interface Hecho {
  /** 0 = comprobante, 1 = recibo: el mismo día, primero los comprobantes. */
  grupo: 0 | 1;
  ref: Movimiento["ref"];
  fecha: FechaCivil;
  importe: Centavos;
}

/**
 * Cuenta corriente del cliente (4.1): los movimientos que existen al corte, por fecha y, el mismo día, primero los comprobantes y
 * después los recibos, y dentro de cada grupo por id. `saldoFinal` es el saldo neto del cliente.
 */
export function cuentaDelCliente(datos: Datos, clienteId: string, corte: FechaCivil): { movimientos: Movimiento[]; saldoFinal: Centavos } {
  exigirCliente(datos, clienteId);
  exigirCorte(corte);
  const hechos: Hecho[] = [
    ...datos.comprobantes
      .filter((c) => c.clienteId === clienteId && existeAlCorte(c, corte))
      .map((c): Hecho => ({ grupo: 0, ref: { tipo: "comprobante", id: c.id }, fecha: c.emision, importe: c.tipo === 3 ? negar(c.total) : c.total })),
    ...datos.recibos
      .filter((r) => r.clienteId === clienteId && existeAlCorte(r, corte))
      .map((r): Hecho => ({ grupo: 1, ref: { tipo: "recibo", id: r.id }, fecha: r.fecha, importe: negar(sumarLista(r.medios.map((m) => m.importe))) })),
  ].sort((a, b) => comparar(a.fecha, b.fecha) || a.grupo - b.grupo || comparar(a.ref.id, b.ref.id));
  let acumulado: Centavos = sumar();
  const movimientos = hechos.map((h): Movimiento => {
    acumulado = sumar(acumulado, h.importe);
    return { ref: h.ref, clienteId, fecha: h.fecha, importe: h.importe, saldoAcumulado: acumulado };
  });
  return { movimientos, saldoFinal: acumulado };
}
