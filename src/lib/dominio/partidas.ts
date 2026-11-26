// Camino por listado (docs/diseno.md, 4.2.1): las `partidas` de cada medida. Recorre comprobante por comprobante (saldo de S2, atraso de S3,
// tramo de A1) y recibo por recibo (a cuenta). Es el primer cálculo independiente de cada cifra; `agregados.ts` es el otro, y `controlar`
// (medidas.ts) los compara. Una partida enlaza a su comprobante o recibo, lleva el cliente, la fecha y el importe firmado (4.3).

import { CLAVE_DE_MEDIDA_DEL_TRAMO, tramoDe } from "./antiguedad.ts";
import { comparar, importeFirmado, mesDeEmision } from "./comprobantes.ts";
import type { CampoImporte } from "./comprobantes.ts";
import { esClaveDelMes, esRetencion, MEDIOS_DE_RETENCION } from "./claves.ts";
import type { ClaveDelMes } from "./claves.ts";
import { aCuentaDelRecibo, existeAlCorte, saldosAlCorte } from "./corte.ts";
import type { SaldoDeComprobante } from "./corte.ts";
import { centavos, negar, rankingConOtros, sumar, sumarLista } from "./dinero.ts";
import type { Centavos } from "./dinero.ts";
import { notaDeRetenciones, notaDeSaldo } from "./textos.ts";
import type { ClaveDeMedida, Comprobante, Datos, FechaCivil, FiltroDeMedida, Partida, Recibo } from "./tipos.ts";

/** De dónde salen los saldos de los comprobantes. Por defecto, `saldosAlCorte`; los tests de mutación de D2 le pasan uno roto a propósito. */
export type ProveedorDeSaldos = (datos: Datos, corte: FechaCivil) => readonly SaldoDeComprobante[];

const CERO = centavos(0);

const CAMPO_DEL_MES: Readonly<Record<"facturacion-mes" | "facturado-con-iva-mes" | "iva-mes", CampoImporte>> = {
  "facturacion-mes": "neto",
  "facturado-con-iva-mes": "total",
  "iva-mes": "iva",
};

/** Comprobantes antes que recibos, y por fecha y por id: el orden de las partidas es siempre el mismo. */
function ordenar(partidas: Partida[]): Partida[] {
  const grupo = (p: Partida): number => (p.ref.tipo === "comprobante" ? 0 : 1);
  return partidas.sort((a, b) => comparar(a.fecha, b.fecha) || grupo(a) - grupo(b) || comparar(a.ref.id, b.ref.id));
}

function deSaldo(s: SaldoDeComprobante): Partida {
  const c = s.comprobante;
  return { ref: { tipo: "comprobante", id: c.id }, clienteId: c.clienteId, fecha: c.emision, importe: s.saldo, atraso: s.atraso, nota: notaDeSaldo(s.atraso, c.vencimiento) };
}

function deComprobante(c: Comprobante, importe: Centavos): Partida {
  return { ref: { tipo: "comprobante", id: c.id }, clienteId: c.clienteId, fecha: c.emision, importe };
}

function deRecibo(r: Recibo, importe: Centavos, nota?: string): Partida {
  const partida: Partida = { ref: { tipo: "recibo", id: r.id }, clienteId: r.clienteId, fecha: r.fecha, importe };
  if (nota !== undefined) partida.nota = nota;
  return partida;
}

function partidasDelMes(datos: Datos, corte: FechaCivil, clave: ClaveDelMes, filtro: FiltroDeMedida): Partida[] {
  const mes = filtro.mes ?? corte.slice(0, 7);
  const delCliente = (clienteId: string): boolean => filtro.clienteId === undefined || clienteId === filtro.clienteId;
  if (clave === "cobranza-mes" || clave === "retenciones-mes") {
    const partidas: Partida[] = [];
    for (const r of datos.recibos) {
      if (r.fecha.slice(0, 7) !== mes || !existeAlCorte(r, corte) || !delCliente(r.clienteId)) continue;
      if (clave === "cobranza-mes") {
        partidas.push(deRecibo(r, sumarLista(r.medios.map((m) => m.importe))));
        continue;
      }
      const retenciones = MEDIOS_DE_RETENCION.flatMap((medio) => {
        const importes = r.medios.filter((m) => m.medio === medio).map((m) => m.importe);
        return importes.length === 0 ? [] : [{ medio, importe: sumarLista(importes) }];
      });
      const total = sumarLista(r.medios.filter((m) => esRetencion(m.medio)).map((m) => m.importe));
      if (retenciones.length > 0) partidas.push(deRecibo(r, total, notaDeRetenciones(retenciones)));
    }
    return partidas;
  }
  const campo = CAMPO_DEL_MES[clave];
  return datos.comprobantes
    .filter((c) => mesDeEmision(c) === mes && existeAlCorte(c, corte) && delCliente(c.clienteId))
    .map((c) => deComprobante(c, importeFirmado(c, campo)));
}

/** Las partidas de saldo (S > 0) de los comprobantes que cumplan `condicion`, del cliente del filtro si lo hay. */
function partidasDeSaldo(saldos: readonly SaldoDeComprobante[], filtro: FiltroDeMedida, condicion: (s: SaldoDeComprobante) => boolean): Partida[] {
  return saldos
    .filter((s) => s.saldo > 0 && condicion(s) && (filtro.clienteId === undefined || s.comprobante.clienteId === filtro.clienteId))
    .map(deSaldo);
}

/** `S` por cliente (Σ saldos de sus comprobantes), con el saldo que da el proveedor. */
function deudaPorCliente(saldos: readonly SaldoDeComprobante[]): Map<string, Centavos> {
  const deuda = new Map<string, Centavos>();
  for (const s of saldos) deuda.set(s.comprobante.clienteId, sumar(deuda.get(s.comprobante.clienteId) ?? CERO, s.saldo));
  return deuda;
}

/** Recibos que existen al corte con a cuenta > 0, del cliente del filtro si lo hay; `clienteCuenta` decide si el cliente cuenta (R4). */
function partidasDeACuenta(datos: Datos, corte: FechaCivil, filtro: FiltroDeMedida, clienteCuenta: (clienteId: string) => boolean): Partida[] {
  const partidas: Partida[] = [];
  for (const r of datos.recibos) {
    if (!existeAlCorte(r, corte) || (filtro.clienteId !== undefined && r.clienteId !== filtro.clienteId) || !clienteCuenta(r.clienteId)) continue;
    const aCuenta = aCuentaDelRecibo(r);
    if (aCuenta > 0) partidas.push(deRecibo(r, aCuenta));
  }
  return partidas;
}

/**
 * Las partidas de una medida por listado. Las del mes usan el `mes` del filtro o el mes del corte (S7). `saldos` permite plantar un saldo
 * roto en los tests de mutación (D2); en uso normal es `saldosAlCorte`. `mora-otros` lanza si no hay más de 5 clientes con mora y no
 * admite filtro por cliente.
 */
export function partidasDe(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, filtro: FiltroDeMedida = {}, saldos: ProveedorDeSaldos = saldosAlCorte): Partida[] {
  if (esClaveDelMes(clave)) return ordenar(partidasDelMes(datos, corte, clave, filtro));
  const lista = saldos(datos, corte);
  switch (clave) {
    case "saldo":
      return ordenar(partidasDeSaldo(lista, filtro, () => true));
    case "mora":
      return ordenar(partidasDeSaldo(lista, filtro, (s) => s.atraso >= 1));
    case "tramo-no-vencido":
    case "tramo-1-30":
    case "tramo-31-60":
    case "tramo-61-90":
    case "tramo-mas-90":
      return ordenar(partidasDeSaldo(lista, filtro, (s) => CLAVE_DE_MEDIDA_DEL_TRAMO[tramoDe(s.atraso)] === clave));
    case "pagos-a-cuenta": {
      const deuda = deudaPorCliente(lista);
      return ordenar(partidasDeACuenta(datos, corte, filtro, (id) => (deuda.get(id) ?? 0) > 0));
    }
    case "saldos-a-favor": {
      const deuda = deudaPorCliente(lista);
      return ordenar(partidasDeACuenta(datos, corte, filtro, (id) => !((deuda.get(id) ?? 0) > 0)));
    }
    case "saldo-neto": {
      const aCuenta = partidasDeACuenta(datos, corte, filtro, () => true).map((p): Partida => ({ ...p, importe: negar(p.importe) }));
      return ordenar([...partidasDeSaldo(lista, filtro, () => true), ...aCuenta]);
    }
    case "mora-otros": {
      if (filtro.clienteId !== undefined) throw new Error("La medida mora-otros no admite filtro por cliente: es la mora de los clientes fuera de los cinco mayores deudores.");
      const mora = partidasDeSaldo(lista, {}, (s) => s.atraso >= 1);
      const porCliente = new Map<string, Centavos>();
      for (const p of mora) porCliente.set(p.clienteId, sumar(porCliente.get(p.clienteId) ?? CERO, p.importe));
      const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
      const filas = [...porCliente.entries()].map(([clienteId, importe]) => ({ clienteId, nombre: nombres.get(clienteId) ?? clienteId, importe }));
      const { otros } = rankingConOtros(filas);
      if (otros === null) throw new Error("La medida mora-otros no existe: hay 5 clientes con mora o menos (M4).");
      const fuera = new Set(otros.filas.map((f) => f.clienteId));
      return mora.filter((p) => fuera.has(p.clienteId));
    }
    default:
      throw new Error(`La clave «${String(clave)}» no es una medida del catálogo.`);
  }
}
