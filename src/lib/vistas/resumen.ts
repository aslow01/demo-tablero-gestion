// Modelo de vista del Resumen (docs/diseno-ui.md, 6.1): la mora al corte, el saldo y la regla de tramos, el movimiento del mes,
// los deudores (cinco mayores y «Otros»), lo que hay para revisar (pagos a cuenta y saldos a favor) y la serie de doce meses. Todo sale de medidas
// controladas (D2) y de las funciones de dinero del dominio (M3 y M4): este módulo no hace aritmética propia.
// También vive acá `reglaDeTramos`, que comparten Resumen, Comprobantes y Cliente.

import { CLAVE_DE_MEDIDA_DEL_TRAMO, TRAMOS, tramoDe } from "../dominio/antiguedad.ts";
import type { Tramo } from "../dominio/antiguedad.ts";
import { porcentaje, porcentajes, rankingConOtros, sumarLista } from "../dominio/dinero.ts";
import type { Centavos, Milesimas } from "../dominio/dinero.ts";
import { mesDelCorte } from "../dominio/corte.ts";
import { medidaControlada } from "../dominio/medidas.ts";
import type { Datos, FechaCivil, Partida } from "../dominio/tipos.ts";
import { vistaMeses } from "./meses.ts";
import type { VistaMeses } from "./meses.ts";
import { cifraDe } from "./tipos.ts";
import type { CifraDeMedida, FilaDeTramo, ReglaDeTramos, RefDeMedida } from "./tipos.ts";

/**
 * La clave con que «Otros» entra al reparto de porcentajes (M3): solo desempata, nunca se muestra. Con restos e importes iguales, «Otros» ordena
 * entre los clientes por este nombre.
 */
const CLAVE_DE_OTROS_EN_EL_REPARTO = "Otros";

// ---------------------------------------------------------------------------------------------------------------------------
// La regla de tramos
// ---------------------------------------------------------------------------------------------------------------------------

/**
 * La antigüedad del saldo a cobrar (A1) de la empresa o de un cliente: una `medidaControlada` por tramo y los porcentajes de M3 (mayor resto, suman 1000).
 * Los cinco importes suman el saldo (X1). Lanza si el cliente no existe.
 */
export function reglaDeTramos(datos: Datos, corte: FechaCivil, clienteId?: string): ReglaDeTramos {
  const filtro = clienteId === undefined ? {} : { clienteId };
  const medidas = TRAMOS.map((t) => ({ tramo: t.clave, medida: medidaControlada(datos, corte, CLAVE_DE_MEDIDA_DEL_TRAMO[t.clave], filtro) }));
  const milesimas = porcentajes(medidas.map((x) => ({ nombre: x.tramo, importe: x.medida.valor })));
  const filas = medidas.map((x, i): FilaDeTramo => ({ tramo: x.tramo, cifra: cifraDe(x.medida), milesimas: milesimas[i] ?? null, cantidad: x.medida.partidas.length }));
  const total = sumarLista(medidas.map((x) => x.medida.valor));
  const regla: ReglaDeTramos = { filas, total, vacia: total === 0 };
  if (clienteId !== undefined) regla.clienteId = clienteId;
  return regla;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Deudores
// ---------------------------------------------------------------------------------------------------------------------------

export interface FilaDeDeudor {
  clienteId: string;
  /** La razón social (dato del cliente, no un texto de la interfaz). */
  nombre: string;
  /** La mora de ese cliente: su cifra abre `mora` filtrada por él. */
  mora: CifraDeMedida;
  /** M3 sobre la mora total (con «Otros» como una fila más); `null` si la mora es 0. */
  milesimas: Milesimas | null;
  /** Los días del comprobante más atrasado del cliente. */
  diasDelMasAtrasado: number;
  /** El tramo de A1 de esos días. */
  tramoMasAntiguo: Tramo;
  /** Cuántos comprobantes vencidos tiene. */
  comprobantes: number;
}

/** La fila «Otros» (M4): los clientes con mora que no están entre los cinco mayores, por resta; sin cliente que abrir (el desglose los lista). */
export interface FilaDeOtros {
  /** Cuántos clientes son (con uno, la pantalla dice «Otros (1 cliente)»). */
  clientes: number;
  comprobantes: number;
  /** `mora-otros`. */
  mora: CifraDeMedida;
  milesimas: Milesimas | null;
}

export interface Deudores {
  /** Los cinco mayores deudores (o menos), del mayor al menor; el empate, por razón social (`es-AR`). */
  filas: FilaDeDeudor[];
  /** Solo existe con más de cinco clientes con mora (M4). */
  otros: FilaDeOtros | null;
  /** El total de la tabla: es la mora. */
  total: Centavos;
  /** Cuántos clientes tienen mora (los cinco y los de «Otros»). */
  clientes: number;
}

interface DeudaVencida {
  clienteId: string;
  nombre: string;
  importe: Centavos;
  dias: number;
  comprobantes: number;
}

/** La mora agrupada por cliente, con el atraso del más viejo (las partidas de `mora` traen `atraso`). */
function moraPorCliente(partidas: readonly Partida[], nombres: ReadonlyMap<string, string>): DeudaVencida[] {
  const grupos = new Map<string, { importes: Centavos[]; dias: number }>();
  for (const p of partidas) {
    if (p.atraso === undefined) throw new Error(`Error interno: la partida de mora ${p.ref.id} no trae los días de atraso.`);
    const g = grupos.get(p.clienteId) ?? { importes: [], dias: p.atraso };
    g.importes.push(p.importe);
    g.dias = Math.max(g.dias, p.atraso);
    grupos.set(p.clienteId, g);
  }
  return [...grupos.entries()].map(([clienteId, g]) => ({ clienteId, nombre: nombres.get(clienteId) ?? clienteId, importe: sumarLista(g.importes), dias: g.dias, comprobantes: g.importes.length }));
}

function deudoresDe(datos: Datos, mora: { partidas: Partida[] }): Deudores {
  const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
  const filas = moraPorCliente(mora.partidas, nombres);
  const { mostrados, otros, total } = rankingConOtros(filas);
  const reparto = porcentajes([...mostrados.map((f) => ({ nombre: f.nombre, importe: f.importe })), ...(otros === null ? [] : [{ nombre: CLAVE_DE_OTROS_EN_EL_REPARTO, importe: otros.importe }])]);
  const deudores: FilaDeDeudor[] = mostrados.map((f, i) => ({
    clienteId: f.clienteId,
    nombre: f.nombre,
    mora: { medida: { clave: "mora", clienteId: f.clienteId }, importe: f.importe },
    milesimas: reparto[i] ?? null,
    diasDelMasAtrasado: f.dias,
    tramoMasAntiguo: tramoDe(f.dias),
    comprobantes: f.comprobantes,
  }));
  const filaOtros: FilaDeOtros | null =
    otros === null
      ? null
      : {
          clientes: otros.filas.length,
          comprobantes: otros.filas.reduce((n, f) => n + f.comprobantes, 0),
          mora: { medida: { clave: "mora-otros" }, importe: otros.importe },
          milesimas: reparto[mostrados.length] ?? null,
        };
  return { filas: deudores, otros: filaOtros, total, clientes: filas.length };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Para revisar: pagos a cuenta sin imputar y saldos a favor
// ---------------------------------------------------------------------------------------------------------------------------

export interface FilaDeACuenta {
  clienteId: string;
  nombre: string;
  /** El recibo que dejó plata sin imputar. */
  reciboId: string;
  fecha: FechaCivil;
  /** Lo que ese recibo dejó sin imputar. */
  importe: Centavos;
  /** Adónde lleva el importe: el desglose del cliente. `null` si el cliente tiene más de un recibo así y el importe no es todo lo que ese desglose suma (no se enlaza algo que no coincide). */
  desglose: RefDeMedida | null;
}

export interface GrupoDeACuenta {
  filas: FilaDeACuenta[];
  /** La medida entera (`pagos-a-cuenta` o `saldos-a-favor`): el total de la tabla. */
  total: CifraDeMedida;
}

export interface ParaRevisar {
  pagosACuenta: GrupoDeACuenta;
  saldosAFavor: GrupoDeACuenta;
  /** Cuántas filas hay entre las dos tablas. */
  cantidad: number;
}

function grupoDeACuenta(datos: Datos, corte: FechaCivil, clave: "pagos-a-cuenta" | "saldos-a-favor"): GrupoDeACuenta {
  const m = medidaControlada(datos, corte, clave);
  const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
  const porCliente = new Map<string, number>();
  for (const p of m.partidas) porCliente.set(p.clienteId, (porCliente.get(p.clienteId) ?? 0) + 1);
  const filas = m.partidas.map(
    (p): FilaDeACuenta => ({
      clienteId: p.clienteId,
      nombre: nombres.get(p.clienteId) ?? p.clienteId,
      reciboId: p.ref.id,
      fecha: p.fecha,
      importe: p.importe,
      desglose: porCliente.get(p.clienteId) === 1 ? { clave, clienteId: p.clienteId } : null,
    }),
  );
  return { filas, total: cifraDe(m) };
}

// ---------------------------------------------------------------------------------------------------------------------------
// El Resumen
// ---------------------------------------------------------------------------------------------------------------------------

/** El movimiento del mes del corte: lo facturado sin IVA, lo cobrado y, de lo cobrado, las retenciones. */
export interface MovimientoDelMes {
  mes: string;
  facturacion: CifraDeMedida;
  /** Comprobantes del mes (las notas de crédito también cuentan: son partidas de la facturación). */
  comprobantes: number;
  cobranza: CifraDeMedida;
  recibos: number;
  retenciones: CifraDeMedida;
}

export interface VistaResumen {
  corte: FechaCivil;
  /** La mora (la cifra grande): abre `mora`. */
  mora: CifraDeMedida;
  /** El saldo a cobrar con IVA. */
  saldo: CifraDeMedida;
  /** M3: qué parte del saldo está en mora; `null` si no hay saldo. */
  moraSobreSaldo: Milesimas | null;
  /** Cuántos clientes tienen mora. */
  clientesEnMora: number;
  regla: ReglaDeTramos;
  movimiento: MovimientoDelMes;
  deudores: Deudores;
  paraRevisar: ParaRevisar;
  /** Los doce meses (gráfico y tabla); el último, el del corte, es el que muestra la fila de «Facturado y cobrado» del celular. */
  meses: VistaMeses;
}

export function vistaResumen(datos: Datos, corte: FechaCivil): VistaResumen {
  const mora = medidaControlada(datos, corte, "mora");
  const saldo = medidaControlada(datos, corte, "saldo");
  const facturacion = medidaControlada(datos, corte, "facturacion-mes");
  const cobranza = medidaControlada(datos, corte, "cobranza-mes");
  const retenciones = medidaControlada(datos, corte, "retenciones-mes");
  const deudores = deudoresDe(datos, mora);
  const pagosACuenta = grupoDeACuenta(datos, corte, "pagos-a-cuenta");
  const saldosAFavor = grupoDeACuenta(datos, corte, "saldos-a-favor");
  return {
    corte,
    mora: cifraDe(mora),
    saldo: cifraDe(saldo),
    moraSobreSaldo: porcentaje(mora.valor, saldo.valor),
    clientesEnMora: deudores.clientes,
    regla: reglaDeTramos(datos, corte),
    movimiento: {
      mes: mesDelCorte(corte),
      facturacion: cifraDe(facturacion),
      comprobantes: facturacion.partidas.length,
      cobranza: cifraDe(cobranza),
      recibos: cobranza.partidas.length,
      retenciones: cifraDe(retenciones),
    },
    deudores,
    paraRevisar: { pagosACuenta, saldosAFavor, cantidad: pagosACuenta.filas.length + saldosAFavor.filas.length },
    meses: vistaMeses(datos, corte),
  };
}
