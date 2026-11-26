// Modelo de vista del Desglose, «¿de dónde sale este número?» (docs/diseno-ui.md, 6.4): una medida del catálogo con su valor y sus
// partidas, agrupadas «por cliente» o en lista (con orden), o vacía. Es la pantalla donde se ve que cada total es la suma de sus partidas: el `importe` es el
// `valor` de la medida y las filas lo suman al centavo (D2: `medidaControlada` lo comprueba antes de entregar nada).
// El detalle de cada partida llega estructurado (tipo de comprobante y servicio, medios de cobro, retenciones, días de atraso): los textos los arma `textos.ts`.

import { tramoDe } from "../dominio/antiguedad.ts";
import type { Tramo } from "../dominio/antiguedad.ts";
import { MEDIOS_DE_RETENCION, esClaveDelMes } from "../dominio/claves.ts";
import { sumarLista } from "../dominio/dinero.ts";
import type { Centavos, Milesimas } from "../dominio/dinero.ts";
import { medidaControlada, porCliente } from "../dominio/medidas.ts";
import { criteriosDeOrden, ordenPorDefecto, ordenarPartidas } from "../dominio/orden.ts";
import type { CriterioDeOrden } from "../dominio/orden.ts";
import type { Base, ClaveDeMedida, Datos, FechaCivil, Medio, Partida, Servicio, TipoCmp } from "../dominio/tipos.ts";
import { comprobantePorId, reciboPorId } from "./comprobante.ts";
import { referenciaDeMedida } from "./tipos.ts";
import type { CifraDeMedida, RefDeMedida } from "./tipos.ts";

/** Lo que dice la dirección de un desglose: `#/desglose/{clave}[?cliente=][&mes=][&agrupar=no]`, y el orden que eligió quien mira la lista. */
export interface ConsultaDeDesglose {
  clave: ClaveDeMedida;
  clienteId?: string;
  /** `AAAA-MM`; solo cuenta en las cinco medidas del mes. */
  mes?: string;
  /** `no`: la lista de partidas sin agrupar por cliente (la interfaz no lo ofrece; vale por dirección). */
  agrupar?: "no";
  /** El orden elegido; uno que esa medida no ofrece se cambia por el de por defecto. */
  orden?: CriterioDeOrden;
}

/** Qué más se sabe de una partida, según de qué medida es. Es lo que va en la columna «Detalle». */
export type DetalleDePartida =
  /** Una factura, nota de débito o de crédito emitida en el mes (facturación, facturado con IVA, IVA). */
  | { tipo: "comprobante-del-mes"; tipoDeComprobante: TipoCmp; servicio: Servicio }
  /** Un comprobante con saldo: sus días de atraso (S3) y su tramo (A1) y cuándo vence. */
  | { tipo: "saldo"; atraso: number; tramo: Tramo; vencimiento: FechaCivil }
  /** Un recibo de la cobranza del mes: con qué medios se pagó, en el orden del recibo. */
  | { tipo: "cobranza"; medios: Medio[] }
  /** Un recibo con retenciones: cuánto de cada una. */
  | { tipo: "retenciones"; retenciones: { medio: Medio; importe: Centavos }[] }
  /** Lo cobrado sin imputar de un recibo; en el saldo neto resta. */
  | { tipo: "a-cuenta"; resta: boolean };

export interface FilaDePartida {
  ref: { tipo: "comprobante" | "recibo"; id: string };
  clienteId: string;
  /** La razón social (dato del cliente). */
  nombreDelCliente: string;
  fecha: FechaCivil;
  /** Firmado: una nota de crédito o un pago a cuenta del saldo neto restan. */
  importe: Centavos;
  detalle: DetalleDePartida;
}

export interface FilaDeDesglosePorCliente {
  clienteId: string;
  nombre: string;
  /** Cuántas partidas tiene el cliente. */
  cantidad: number;
  /** Su parte, que abre el desglose de la misma medida para ese cliente (la del mes si es del mes; en `mora-otros`, la mora del cliente). */
  importe: CifraDeMedida;
  /** M3 sobre el total; `null` en todas las filas si algún subtotal es negativo o el total no es mayor que 0. */
  milesimas: Milesimas | null;
}

interface BaseDelDesglose {
  corte: FechaCivil;
  /** La medida con su cliente y su mes ya resueltos (el mes del corte si la dirección no lo traía). */
  medida: RefDeMedida;
  clave: ClaveDeMedida;
  base: Base;
  /** El valor de la medida: el número que se abrió. */
  importe: Centavos;
  /** El mes `AAAA-MM`; solo en las medidas del mes. */
  mes: string | null;
  clienteId: string | null;
  nombreDelCliente: string | null;
  /** Qué son las partidas: comprobantes o recibos (el saldo neto trae las dos cosas y cuenta como comprobantes). */
  origen: "comprobantes" | "recibos";
  cantidadDePartidas: number;
}

export type VistaDesglose =
  | (BaseDelDesglose & { modo: "vacio" })
  | (BaseDelDesglose & { modo: "por-cliente"; filas: FilaDeDesglosePorCliente[] })
  | (BaseDelDesglose & {
      modo: "partidas";
      /** Ordenadas con `orden.criterio`. */
      partidas: FilaDePartida[];
      /** El criterio que rige y los que se ofrecen (`atraso` solo en las medidas de saldo). */
      orden: { criterio: CriterioDeOrden; opciones: CriterioDeOrden[] };
    });

const CLAVES_CON_RECIBOS: readonly ClaveDeMedida[] = ["cobranza-mes", "retenciones-mes", "pagos-a-cuenta", "saldos-a-favor"];

function detalleDe(datos: Datos, clave: ClaveDeMedida, p: Partida): DetalleDePartida {
  if (p.ref.tipo === "recibo") {
    const r = reciboPorId(datos, p.ref.id);
    if (r === undefined) throw new Error(`Error interno: la partida es del recibo ${p.ref.id}, que no está en los datos.`);
    if (clave === "cobranza-mes") return { tipo: "cobranza", medios: r.medios.map((m) => m.medio) };
    if (clave === "retenciones-mes") {
      const retenciones = MEDIOS_DE_RETENCION.flatMap((medio) => {
        const importes = r.medios.filter((m) => m.medio === medio).map((m) => m.importe);
        return importes.length === 0 ? [] : [{ medio, importe: sumarLista(importes) }];
      });
      return { tipo: "retenciones", retenciones };
    }
    return { tipo: "a-cuenta", resta: clave === "saldo-neto" };
  }
  const c = comprobantePorId(datos, p.ref.id);
  if (c === undefined) throw new Error(`Error interno: la partida es del comprobante ${p.ref.id}, que no está en los datos.`);
  if (esClaveDelMes(clave)) return { tipo: "comprobante-del-mes", tipoDeComprobante: c.tipo, servicio: c.servicio };
  if (p.atraso === undefined) throw new Error(`Error interno: la partida de saldo ${p.ref.id} no trae los días de atraso.`);
  return { tipo: "saldo", atraso: p.atraso, tramo: tramoDe(p.atraso), vencimiento: c.vencimiento };
}

/** La vista del desglose de una medida al corte. Lanza con una clave, un cliente o un mes inválidos, o con `mora-otros` si no existe: el enrutador ya los filtra. */
export function vistaDesglose(datos: Datos, corte: FechaCivil, consulta: ConsultaDeDesglose): VistaDesglose {
  const { clave } = consulta;
  const filtro: { clienteId?: string; mes?: string } = {};
  if (consulta.clienteId !== undefined) filtro.clienteId = consulta.clienteId;
  if (consulta.mes !== undefined) filtro.mes = consulta.mes;
  const m = medidaControlada(datos, corte, clave, filtro);
  const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
  const nombreDe = (id: string): string => nombres.get(id) ?? id;

  const base: BaseDelDesglose = {
    corte,
    medida: referenciaDeMedida(m),
    clave,
    base: m.base,
    importe: m.valor,
    mes: m.filtro.mes ?? null,
    clienteId: m.filtro.clienteId ?? null,
    nombreDelCliente: m.filtro.clienteId === undefined ? null : nombreDe(m.filtro.clienteId),
    origen: CLAVES_CON_RECIBOS.includes(clave) ? "recibos" : "comprobantes",
    cantidadDePartidas: m.partidas.length,
  };

  if (m.partidas.length === 0) return { ...base, modo: "vacio" };

  const variosClientes = new Set(m.partidas.map((p) => p.clienteId)).size > 1;
  if (m.filtro.clienteId === undefined && consulta.agrupar !== "no" && variosClientes) {
    // El subtotal de cada cliente abre la misma medida para él; la excepción es «Otros», cuya parte de cada cliente es su mora entera.
    const destino: ClaveDeMedida = clave === "mora-otros" ? "mora" : clave;
    const filas = porCliente(m, datos).map(
      (f): FilaDeDesglosePorCliente => ({
        clienteId: f.clienteId,
        nombre: f.razonSocial,
        cantidad: f.cantidad,
        importe: { medida: m.filtro.mes === undefined ? { clave: destino, clienteId: f.clienteId } : { clave: destino, clienteId: f.clienteId, mes: m.filtro.mes }, importe: f.subtotal },
        milesimas: f.milesimas,
      }),
    );
    return { ...base, modo: "por-cliente", filas };
  }

  const opciones = criteriosDeOrden(clave);
  const criterio = consulta.orden !== undefined && opciones.includes(consulta.orden) ? consulta.orden : ordenPorDefecto(clave);
  const partidas = ordenarPartidas(m.partidas, criterio).map(
    (p): FilaDePartida => ({ ref: { tipo: p.ref.tipo, id: p.ref.id }, clienteId: p.clienteId, nombreDelCliente: nombreDe(p.clienteId), fecha: p.fecha, importe: p.importe, detalle: detalleDe(datos, clave, p) }),
  );
  return { ...base, modo: "partidas", partidas, orden: { criterio, opciones } };
}
