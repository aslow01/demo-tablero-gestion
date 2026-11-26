// Las filas de las tablas de movimientos (cuenta corriente del cliente y movimientos de un comprobante): una sola forma de fila para las dos, armada con lo que
// entregan los modelos de vista. Sin cuentas: los importes y los saldos llegan hechos; acá solo se elige qué dibuja cada fila y qué nota lleva al lado.

import type { Centavos } from "../../lib/dominio/dinero.ts";
import { ROTULO_DE_SERVICIO } from "../../lib/dominio/textos.ts";
import type { FechaCivil, TipoCmp } from "../../lib/dominio/tipos.ts";
import type { FilaDeCuentaCorriente, MovimientoPosterior } from "../../lib/vistas/cliente.ts";
import type { MovimientoDeComprobante } from "../../lib/vistas/comprobante.ts";
import { TEXTO_CLIENTE, TEXTO_COMPROBANTE } from "../../componentes/textos-marco.ts";

/** Qué es el movimiento: un texto («Emisión»), un comprobante (talón y nota) o un recibo (botón desplegable y nota). */
export type QueEsElMovimiento =
  | { tipo: "texto"; texto: string }
  | { tipo: "comprobante"; id: string; tipoCmp: TipoCmp; nota: string }
  | { tipo: "recibo"; id: string; nota: string };

export interface FilaDeMovimiento {
  /** Distingue la fila dentro de su tabla (un mismo recibo o comprobante puede repetirse). */
  k: string;
  fecha: FechaCivil;
  que: QueEsElMovimiento;
  debe: Centavos;
  haber: Centavos;
  /** El saldo corrido; `null` en los movimientos posteriores al corte, que no cuentan. */
  saldo: Centavos | null;
}

/** Cuenta corriente de un cliente: los movimientos al corte (con su saldo corrido) o los posteriores (sin saldo). */
export function filasDeCuentaCorriente(movimientos: readonly (FilaDeCuentaCorriente | MovimientoPosterior)[], prefijo: string): FilaDeMovimiento[] {
  return movimientos.map((m, i): FilaDeMovimiento => {
    const que: QueEsElMovimiento =
      m.origen.clase === "recibo"
        ? { tipo: "recibo", id: m.origen.id, nota: TEXTO_CLIENTE.cobro }
        : { tipo: "comprobante", id: m.origen.id, tipoCmp: m.origen.tipo, nota: m.origen.tipo === 3 ? TEXTO_CLIENTE.notaDeCredito : ROTULO_DE_SERVICIO[m.origen.servicio] };
    return { k: `${prefijo}${i}`, fecha: m.fecha, que, debe: m.debe, haber: m.haber, saldo: "saldo" in m ? m.saldo : null };
  });
}

/** Movimientos de un comprobante: la emisión, las notas de crédito y los cobros (el cobro dice si fue parcial). */
export function filasDeComprobante(movimientos: readonly MovimientoDeComprobante[], prefijo: string): FilaDeMovimiento[] {
  return movimientos.map((m, i): FilaDeMovimiento => {
    let que: QueEsElMovimiento;
    if (m.clase === "emision") que = { tipo: "texto", texto: TEXTO_COMPROBANTE.emisionDelMovimiento };
    else if (m.clase === "nota-de-credito") que = { tipo: "comprobante", id: m.referencia, tipoCmp: 3, nota: TEXTO_COMPROBANTE.notaDeCredito };
    else que = { tipo: "recibo", id: m.referencia, nota: m.parcial ? TEXTO_COMPROBANTE.cobroParcial : TEXTO_COMPROBANTE.cobro };
    return { k: `${prefijo}${i}`, fecha: m.fecha, que, debe: m.debe, haber: m.haber, saldo: m.saldo };
  });
}
