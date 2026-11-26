// Modelo de vista de un cliente (docs/diseno-ui.md, 6.2): su posición al corte (saldo, mora, lo cobrado sin imputar y el saldo
// neto), su regla de tramos, su facturación de doce meses y las tres hojas: comprobantes con saldo, recibos y cuenta corriente. La posición y la cuenta
// corriente son el camino por listado de `corte.ts` (D3, X4 las contrasta con las medidas); el saldo y la mora, `medidaControlada`.

import { tramoDe } from "../dominio/antiguedad.ts";
import type { Tramo } from "../dominio/antiguedad.ts";
import { comparar } from "../dominio/comprobantes.ts";
import { aCuentaDelRecibo, cuentaDelCliente, existeAlCorte, posicionDelCliente } from "../dominio/corte.ts";
import { negar, porcentaje, sumar, sumarLista } from "../dominio/dinero.ts";
import type { Centavos, Milesimas } from "../dominio/dinero.ts";
import { medidaControlada } from "../dominio/medidas.ts";
import type { Cliente, Datos, FechaCivil, Medio, Servicio, TipoCmp } from "../dominio/tipos.ts";
import { comprobantePorId } from "./comprobante.ts";
import { facturacionDelCliente } from "./meses.ts";
import type { FacturacionDelCliente } from "./meses.ts";
import { reglaDeTramos } from "./resumen.ts";
import { cifraDe } from "./tipos.ts";
import type { CifraDeMedida, ReglaDeTramos } from "./tipos.ts";

export interface FilaDeSaldoDelCliente {
  comprobanteId: string;
  tipo: TipoCmp;
  emision: FechaCivil;
  vencimiento: FechaCivil;
  total: Centavos;
  /** Lo que falta cobrar al corte. */
  saldo: Centavos;
  atraso: number;
  tramo: Tramo;
}

export interface FilaDeReciboDelCliente {
  reciboId: string;
  fecha: FechaCivil;
  medios: { medio: Medio; importe: Centavos }[];
  imputado: Centavos;
  /** Lo que quedó sin imputar (0 o más). */
  aCuenta: Centavos;
}

/** De dónde sale un movimiento de la cuenta corriente: un comprobante (con su tipo y servicio) o un recibo. */
export type OrigenDeMovimiento = { clase: "comprobante"; id: string; tipo: TipoCmp; servicio: Servicio } | { clase: "recibo"; id: string };

export interface FilaDeCuentaCorriente {
  fecha: FechaCivil;
  origen: OrigenDeMovimiento;
  /** Factura y nota de débito suman su total. */
  debe: Centavos;
  /** Una nota de crédito resta su total; un recibo, la suma de todos sus medios. */
  haber: Centavos;
  /** El saldo corrido tras este movimiento. */
  saldo: Centavos;
}

export interface MovimientoPosterior {
  fecha: FechaCivil;
  origen: OrigenDeMovimiento;
  debe: Centavos;
  haber: Centavos;
}

export interface VistaCliente {
  corte: FechaCivil;
  cliente: { id: string; nombre: string; cuit: string; plazoDias: Cliente["plazoDias"] };
  saldo: CifraDeMedida;
  mora: CifraDeMedida;
  /** M3: qué parte de su saldo está en mora; `null` si no tiene saldo. */
  moraSobreSaldo: Milesimas | null;
  /**
   * Lo cobrado sin imputar (R4), si lo hay: «pagos a cuenta» si todavía debe (y entonces hay que revisar la imputación) o «saldo a favor» si no debe nada.
   * Trae el saldo neto, con el que termina la cuenta corriente.
   */
  sinImputar: { tipo: "pagos-a-cuenta" | "saldos-a-favor"; importe: CifraDeMedida; saldoNeto: CifraDeMedida } | null;
  regla: ReglaDeTramos;
  facturacion: FacturacionDelCliente;
  /** Hoja «Comprobantes con saldo»: por vencimiento. `total` es el saldo del cliente y las filas lo suman. */
  comprobantesConSaldo: { filas: FilaDeSaldoDelCliente[]; total: CifraDeMedida };
  /** Hoja «Recibos»: el más nuevo primero. */
  recibos: { filas: FilaDeReciboDelCliente[]; totales: { imputado: Centavos; aCuenta: Centavos } };
  /** Hoja «Cuenta corriente»: cronológica; el saldo final es el saldo neto (D3). Los posteriores al corte se muestran aparte y no cuentan (S1). */
  cuentaCorriente: { movimientos: FilaDeCuentaCorriente[]; saldoFinal: CifraDeMedida; posteriores: MovimientoPosterior[] };
}

function origenDe(datos: Datos, ref: { tipo: "comprobante" | "recibo"; id: string }): OrigenDeMovimiento {
  if (ref.tipo === "recibo") return { clase: "recibo", id: ref.id };
  const c = comprobantePorId(datos, ref.id);
  if (c === undefined) throw new Error(`Error interno: el movimiento es del comprobante ${ref.id}, que no está en los datos.`);
  return { clase: "comprobante", id: c.id, tipo: c.tipo, servicio: c.servicio };
}

/** Los movimientos de la cuenta corriente que pasan del corte, en el mismo orden que los que existen: fecha, comprobantes antes que recibos, id. */
function posterioresAlCorte(datos: Datos, clienteId: string, corte: FechaCivil): MovimientoPosterior[] {
  const cero = sumar();
  const hechos = [
    ...datos.comprobantes
      .filter((c) => c.clienteId === clienteId && !existeAlCorte(c, corte))
      .map((c) => ({ grupo: 0, ref: { tipo: "comprobante" as const, id: c.id }, fecha: c.emision, debe: c.tipo === 3 ? cero : c.total, haber: c.tipo === 3 ? c.total : cero })),
    ...datos.recibos
      .filter((r) => r.clienteId === clienteId && !existeAlCorte(r, corte))
      .map((r) => ({ grupo: 1, ref: { tipo: "recibo" as const, id: r.id }, fecha: r.fecha, debe: cero, haber: sumarLista(r.medios.map((m) => m.importe)) })),
  ].sort((a, b) => comparar(a.fecha, b.fecha) || a.grupo - b.grupo || comparar(a.ref.id, b.ref.id));
  return hechos.map((h) => ({ fecha: h.fecha, origen: origenDe(datos, h.ref), debe: h.debe, haber: h.haber }));
}

/** La vista de un cliente al corte. Lanza si el cliente no existe. */
export function vistaCliente(datos: Datos, corte: FechaCivil, clienteId: string): VistaCliente {
  const cliente = datos.clientes.find((c) => c.id === clienteId);
  if (cliente === undefined) throw new Error(`No hay ningún cliente con el id ${clienteId}.`);
  const filtro = { clienteId };
  const saldo = medidaControlada(datos, corte, "saldo", filtro);
  const mora = medidaControlada(datos, corte, "mora", filtro);
  const posicion = posicionDelCliente(datos, clienteId, corte);
  const cuenta = cuentaDelCliente(datos, clienteId, corte);

  const sinImputar: VistaCliente["sinImputar"] =
    posicion.aCuenta === 0
      ? null
      : {
          tipo: posicion.saldo > 0 ? "pagos-a-cuenta" : "saldos-a-favor",
          importe: { medida: { clave: posicion.saldo > 0 ? "pagos-a-cuenta" : "saldos-a-favor", clienteId }, importe: posicion.saldo > 0 ? posicion.pagosACuenta : posicion.saldosAFavor },
          saldoNeto: { medida: { clave: "saldo-neto", clienteId }, importe: posicion.saldoNeto },
        };

  const filasDeSaldo = saldo.partidas
    .map((p): FilaDeSaldoDelCliente => {
      const c = comprobantePorId(datos, p.ref.id);
      if (c === undefined || p.atraso === undefined) throw new Error(`Error interno: la partida ${p.ref.id} no es de un comprobante con saldo.`);
      return { comprobanteId: c.id, tipo: c.tipo, emision: c.emision, vencimiento: c.vencimiento, total: c.total, saldo: p.importe, atraso: p.atraso, tramo: tramoDe(p.atraso) };
    })
    .sort((a, b) => comparar(a.vencimiento, b.vencimiento) || comparar(a.comprobanteId, b.comprobanteId));

  const filasDeRecibos = datos.recibos
    .filter((r) => r.clienteId === clienteId && existeAlCorte(r, corte))
    .sort((a, b) => comparar(b.fecha, a.fecha) || comparar(b.id, a.id))
    .map((r): FilaDeReciboDelCliente => ({ reciboId: r.id, fecha: r.fecha, medios: r.medios.map((m) => ({ medio: m.medio, importe: m.importe })), imputado: sumarLista(r.imputaciones.map((i) => i.importe)), aCuenta: aCuentaDelRecibo(r) }));

  const movimientos = cuenta.movimientos.map((m): FilaDeCuentaCorriente => ({
    fecha: m.fecha,
    origen: origenDe(datos, m.ref),
    debe: m.importe > 0 ? m.importe : sumar(),
    haber: m.importe < 0 ? negar(m.importe) : sumar(),
    saldo: m.saldoAcumulado,
  }));

  return {
    corte,
    cliente: { id: cliente.id, nombre: cliente.razonSocial, cuit: cliente.cuit, plazoDias: cliente.plazoDias },
    saldo: cifraDe(saldo),
    mora: cifraDe(mora),
    moraSobreSaldo: porcentaje(mora.valor, saldo.valor),
    sinImputar,
    regla: reglaDeTramos(datos, corte, clienteId),
    facturacion: facturacionDelCliente(datos, corte, clienteId),
    comprobantesConSaldo: { filas: filasDeSaldo, total: cifraDe(saldo) },
    recibos: { filas: filasDeRecibos, totales: { imputado: sumarLista(filasDeRecibos.map((f) => f.imputado)), aCuenta: sumarLista(filasDeRecibos.map((f) => f.aCuenta)) } },
    cuentaCorriente: { movimientos, saldoFinal: { medida: { clave: "saldo-neto", clienteId }, importe: cuenta.saldoFinal }, posteriores: posterioresAlCorte(datos, clienteId, corte) },
  };
}
