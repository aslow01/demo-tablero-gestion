// Comprobantes (docs/diseno.md, sección 6.2): C1 (signo), C2 (formato del id), C4 (vencimiento) y C5 (facturación del mes).
// Son funciones puras de los datos del comprobante. Ninguna sabe de fecha de corte: el recorte S1 («existe al corte») es de corte.ts.

import { calcularIva, negar, sumar, sumarLista } from "./dinero.ts";
import type { Centavos } from "./dinero.ts";
import { sumarDias } from "./fechas.ts";
import type { Cliente, Comprobante, FechaCivil, Medio, Recibo, Servicio, TipoCmp } from "./tipos.ts";

/** Qué importe del comprobante se pide: el neto, el IVA o el total. */
export type CampoImporte = "neto" | "iva" | "total";

/** Cuatro dígitos, de 1 a 9999. */
function cuatroDigitos(puntoVenta: number): string {
  if (!Number.isInteger(puntoVenta) || puntoVenta < 1 || puntoVenta > 9999) {
    throw new Error(`Punto de venta fuera de formato: ${puntoVenta} (de 1 a 9999).`);
  }
  return String(puntoVenta).padStart(4, "0");
}

/** Ocho dígitos, de 1 a 99.999.999. */
function ochoDigitos(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1 || numero > 99_999_999) {
    throw new Error(`Número de comprobante fuera de formato: ${numero} (de 1 a 99999999).`);
  }
  return String(numero).padStart(8, "0");
}

/** `1-0003-00000123`: tipo, punto de venta de 4 dígitos y número de 8 dígitos (C2). */
export function idComprobante(tipo: TipoCmp, puntoVenta: number, numero: number): string {
  return `${tipo}-${cuatroDigitos(puntoVenta)}-${ochoDigitos(numero)}`;
}

/** `R-0003-00000045` (C2). */
export function idRecibo(puntoVenta: number, numero: number): string {
  return `R-${cuatroDigitos(puntoVenta)}-${ochoDigitos(numero)}`;
}

/**
 * Inversa de `idRecibo`: el punto de venta y el número de `R-0003-00000045`, o `null` si el texto no tiene exactamente ese formato
 * (o si el punto de venta o el número serían 0, que `idRecibo` no produce). Es el único lugar del dominio que lee dígitos con `parseInt`
 * (la búsqueda de CI lo permite solo acá): `\d` de JavaScript es solo ASCII, así que `parseInt` nunca devuelve NaN, y no toca dinero.
 */
export function leerIdRecibo(id: string): { puntoVenta: number; numero: number } | null {
  const partes = /^R-(\d{4})-(\d{8})$/.exec(id);
  if (partes === null) return null;
  const puntoVenta = parseInt(partes[1] ?? "", 10);
  const numero = parseInt(partes[2] ?? "", 10);
  if (puntoVenta < 1 || numero < 1) return null;
  return { puntoVenta, numero };
}

/**
 * Vencimiento (C4): emisión + plazo del cliente en días corridos, sin correrlo por feriados ni fines de semana. En una NC es la
 * emisión (no tiene plazo). La ND tiene su propio vencimiento.
 */
export function vencimientoDe(tipo: TipoCmp, emision: FechaCivil, plazoDias: number): FechaCivil {
  if (!Number.isInteger(plazoDias) || plazoDias < 0) throw new Error(`El plazo del cliente tiene que ser un entero de días, de 0 o más (llegó ${plazoDias}).`);
  return tipo === 3 ? emision : sumarDias(emision, plazoDias);
}

/** Importe del comprobante con su signo (C1): factura y ND suman, NC resta. Los importes guardados son siempre positivos. */
export function importeFirmado(c: Comprobante, campo: CampoImporte): Centavos {
  return c.tipo === 3 ? negar(c[campo]) : c[campo];
}

/** `AAAA-MM`: el mes de la fecha de emisión (C5). */
export function mesDeEmision(c: Comprobante): string {
  return c.emision.slice(0, 7);
}

function validarMes(mes: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error(`El mes «${mes}» no tiene el formato AAAA-MM.`);
}

/** Los comprobantes emitidos en el mes `AAAA-MM`, en el orden en que vienen (C5). */
export function comprobantesDelMes(comprobantes: readonly Comprobante[], mes: string): Comprobante[] {
  validarMes(mes);
  return comprobantes.filter((c) => mesDeEmision(c) === mes);
}

/**
 * Facturación del mes (C5): neto sin IVA de facturas y ND, menos el de las NC, por fecha de emisión. Puede ser negativa y no se
 * recorta a 0. Con `clienteId`, solo los de ese cliente.
 */
export function facturacionDelMes(comprobantes: readonly Comprobante[], mes: string, clienteId?: string): Centavos {
  const delMes = comprobantesDelMes(comprobantes, mes).filter((c) => clienteId === undefined || c.clienteId === clienteId);
  return sumarLista(delMes.map((c) => importeFirmado(c, "neto")));
}

/** Los clientes con al menos un comprobante emitido en el mes (C5), sin repetir y por id, aunque su neto firmado sea 0 o negativo. */
export function clientesQueFacturaron(comprobantes: readonly Comprobante[], mes: string): string[] {
  return [...new Set(comprobantesDelMes(comprobantes, mes).map((c) => c.clienteId))].sort();
}

// ---------------------------------------------------------------------------------------------------------------------------
// Numeración (C2). Un borrador es un comprobante todavía sin número: lo arma a mano un fixture o lo produce el generador, y esta
// función es la única que lo numera, calcula IVA y total (M2) y vencimiento (C4). Las asociaciones entre comprobantes se escriben
// con una `clave` estable porque los ids recién existen después de numerar.
// ---------------------------------------------------------------------------------------------------------------------------

export interface BorradorDeComprobante {
  /** Nombre estable dentro del conjunto (el alias del caso, por ejemplo «T09-F»); no se guarda en el comprobante. */
  clave: string;
  tipo: TipoCmp;
  clienteId: string;
  emision: FechaCivil;
  servicio: Servicio;
  neto: Centavos;
  /** Clave de la factura asociada (obligatoria para una NC, opcional para una ND). */
  asociadoA: string | null;
}

export interface BorradorDeRecibo {
  clave: string;
  clienteId: string;
  fecha: FechaCivil;
  medios: { medio: Medio; importe: Centavos }[];
  /** `comprobante` es la clave del borrador del comprobante imputado. */
  imputaciones: { comprobante: string; importe: Centavos }[];
}

/** Orden de textos por código de unidad (sirve para ids y fechas `AAAA-MM-DD`); lo comparten la numeración y los validadores. */
export function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Lo que ya se validó antes tiene que estar; si no, es un error del programa y se dice, en vez de seguir con un valor inventado. */
function obtener<K, V>(mapa: ReadonlyMap<K, V>, clave: K, que: string): V {
  const valor = mapa.get(clave);
  if (valor === undefined) throw new Error(`Error interno: ${que} ${String(clave)} no está, aunque ya se había comprobado.`);
  return valor;
}

/**
 * Numera los comprobantes (C2): se ordenan por (fecha de emisión, id de cliente, orden de entrada = orden de generación) y cada
 * tipo se numera aparte desde 1, sin saltos. Devuelve la lista en el orden de numeración y el id de cada clave. Lanza, nombrando el
 * dato dañado, si una clave se repite, si el cliente no existe, si la factura asociada no existe o si el neto no es válido. Que una
 * NC tenga o no factura asociada no se decide acá: es del validador (C3).
 */
export function numerarComprobantes(
  borradores: readonly BorradorDeComprobante[],
  clientes: readonly Pick<Cliente, "id" | "plazoDias">[],
  puntoVenta: number,
): { comprobantes: Comprobante[]; idPorClave: Map<string, string> } {
  const plazos = new Map(clientes.map((c) => [c.id, c.plazoDias]));
  const claves = new Set<string>();
  for (const b of borradores) {
    if (claves.has(b.clave)) throw new Error(`La clave «${b.clave}» de comprobante está repetida.`);
    claves.add(b.clave);
  }
  for (const b of borradores) {
    if (!plazos.has(b.clienteId)) throw new Error(`El comprobante «${b.clave}» es de un cliente que no existe: ${b.clienteId}.`);
    if (b.asociadoA !== null && !claves.has(b.asociadoA)) throw new Error(`El comprobante «${b.clave}» está asociado a «${b.asociadoA}», que no existe.`);
  }
  // `sort` es estable (ES2019): lo que empata en fecha y cliente queda en el orden de entrada = orden de generación.
  const ordenados = [...borradores].sort((a, b) => comparar(a.emision, b.emision) || comparar(a.clienteId, b.clienteId));
  const proximo: Record<TipoCmp, number> = { 1: 1, 2: 1, 3: 1 };
  const idPorClave = new Map<string, string>();
  const numerados = ordenados.map((b) => {
    const numero = proximo[b.tipo];
    proximo[b.tipo] = numero + 1;
    const id = idComprobante(b.tipo, puntoVenta, numero);
    idPorClave.set(b.clave, id);
    return { b, numero, id };
  });
  const comprobantes = numerados.map(({ b, numero, id }): Comprobante => {
    const iva = calcularIva(b.neto);
    return {
      id,
      tipo: b.tipo,
      puntoVenta,
      numero,
      clienteId: b.clienteId,
      emision: b.emision,
      vencimiento: vencimientoDe(b.tipo, b.emision, obtener(plazos, b.clienteId, "el plazo del cliente")),
      servicio: b.servicio,
      neto: b.neto,
      iva,
      total: sumar(b.neto, iva),
      asociadoA: b.asociadoA === null ? null : obtener(idPorClave, b.asociadoA, "el id del comprobante asociado"),
    };
  });
  return { comprobantes, idPorClave };
}

/**
 * Numera los recibos (C2): se ordenan por (fecha, id de cliente, id **menor** de los comprobantes que imputan, o vacío si no imputan,
 * orden de entrada) y se numeran desde 1. El menor, y no el primero de la lista, para que el número no dependa del orden en que se
 * escribieron las imputaciones. `idsDeComprobantes` es el `idPorClave` de `numerarComprobantes`.
 */
export function numerarRecibos(
  borradores: readonly BorradorDeRecibo[],
  idsDeComprobantes: ReadonlyMap<string, string>,
  puntoVenta: number,
): { recibos: Recibo[]; idPorClave: Map<string, string> } {
  const claves = new Set<string>();
  const resueltos = borradores.map((b) => {
    if (claves.has(b.clave)) throw new Error(`La clave «${b.clave}» de recibo está repetida.`);
    claves.add(b.clave);
    const imputaciones = b.imputaciones.map((i) => {
      const comprobanteId = idsDeComprobantes.get(i.comprobante);
      if (comprobanteId === undefined) throw new Error(`El recibo «${b.clave}» imputa al comprobante «${i.comprobante}», que no existe.`);
      return { comprobanteId, importe: i.importe };
    });
    const menor = imputaciones.reduce<string>((m, i) => (m === "" || i.comprobanteId < m ? i.comprobanteId : m), "");
    return { b, imputaciones, menor };
  });
  // Estable: si todo empata, queda el orden de entrada = orden de generación.
  resueltos.sort((x, y) => comparar(x.b.fecha, y.b.fecha) || comparar(x.b.clienteId, y.b.clienteId) || comparar(x.menor, y.menor));
  const idPorClave = new Map<string, string>();
  const recibos = resueltos.map(({ b, imputaciones }, i): Recibo => {
    const id = idRecibo(puntoVenta, i + 1);
    idPorClave.set(b.clave, id);
    return { id, clienteId: b.clienteId, fecha: b.fecha, medios: b.medios.map((m) => ({ ...m })), imputaciones };
  });
  return { recibos, idPorClave };
}
