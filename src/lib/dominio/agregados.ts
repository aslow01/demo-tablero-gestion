// Camino por agregación (docs/diseno.md, 4.2.1): el `valor` de cada medida, sumando campos de los datos crudos («debe menos haber»),
// sin calcular el saldo de cada comprobante ni armar listas de partidas. Es el segundo cálculo independiente de cada cifra.
//
// Independencia (D2): este módulo NO importa `partidas.ts` ni `corte.ts` (el saldo por comprobante), ni nada que esté arriba en el árbol
// (`medidas.ts`, `controles.ts`); un test lo comprueba leyendo las importaciones. Lo único que comparte con el otro camino son las
// definiciones de 4.1 (qué existe al corte, qué es un tramo), que prueban los casos con números, no esta independencia.
//
// Idea: para un conjunto de comprobantes (los que vencen en una ventana de fechas), lo que se debe por cliente es
//   Σ total de facturas y ND − Σ total de NC − Σ imputaciones de recibos, todo lo que existe al corte;
// la NC y la imputación cuentan en la ventana de la factura (o ND) a la que van. Sin ventana, es el saldo del cliente (S).

import { TRAMOS } from "./antiguedad.ts";
import type { LimitesDeTramo } from "./antiguedad.ts";
import { esClaveDelMes, esRetencion } from "./claves.ts";
import type { ClaveDelMes } from "./claves.ts";
import { centavos, negar, rankingConOtros, restar, sumar } from "./dinero.ts";
import type { Centavos } from "./dinero.ts";
import { exigirCorte, sumarDias } from "./fechas.ts";
import type { ClaveDeMedida, Comprobante, Datos, FechaCivil, FiltroDeMedida } from "./tipos.ts";

/** Ventana de **vencimiento**, con los dos extremos incluidos; `null` es sin límite de ese lado. */
interface Ventana {
  desde: FechaCivil | null;
  hasta: FechaCivil | null;
}

const SIN_VENTANA: Ventana = { desde: null, hasta: null };

/**
 * Un atraso de `d` días es `corte − vencimiento = d`, o sea vencimiento = corte − d: el tramo [mínimo, máximo] días de atraso es la
 * ventana de vencimiento [corte − máximo, corte − mínimo] (A1).
 */
function ventanaDelTramo(corte: FechaCivil, t: LimitesDeTramo): Ventana {
  return {
    desde: t.maximo === Number.POSITIVE_INFINITY ? null : sumarDias(corte, -t.maximo),
    hasta: t.minimo === Number.NEGATIVE_INFINITY ? null : sumarDias(corte, -t.minimo),
  };
}

function enVentana(v: Ventana, vencimiento: FechaCivil | undefined): boolean {
  if (v.desde === null && v.hasta === null) return true;
  if (vencimiento === undefined) return false; // sin factura a la que mirar no se la puede ubicar en una ventana
  return (v.desde === null || vencimiento >= v.desde) && (v.hasta === null || vencimiento <= v.hasta);
}

// Los datos son de solo lectura: el mapa id → comprobante se arma una vez por conjunto.
const POR_ID = new WeakMap<Datos, Map<string, Comprobante>>();

function comprobantesPorId(datos: Datos): Map<string, Comprobante> {
  const guardado = POR_ID.get(datos);
  if (guardado !== undefined) return guardado;
  const mapa = new Map<string, Comprobante>();
  for (const c of datos.comprobantes) if (!mapa.has(c.id)) mapa.set(c.id, c);
  POR_ID.set(datos, mapa);
  return mapa;
}

const CERO = centavos(0);

function sumarPorCliente(mapa: Map<string, Centavos>, clienteId: string, importe: Centavos): void {
  mapa.set(clienteId, sumar(mapa.get(clienteId) ?? CERO, importe));
}

function total(mapa: ReadonlyMap<string, Centavos>): Centavos {
  let suma = CERO;
  for (const v of mapa.values()) suma = sumar(suma, v);
  return suma;
}

/** Lo que se debe por cliente de los comprobantes que vencen en la ventana (todo lo que existe al corte). Con `clienteId`, solo ese cliente. */
function deudaPorCliente(datos: Datos, corte: FechaCivil, ventana: Ventana, clienteId?: string): Map<string, Centavos> {
  const porId = comprobantesPorId(datos);
  const deuda = new Map<string, Centavos>();
  for (const c of datos.comprobantes) {
    if (c.emision > corte || (clienteId !== undefined && c.clienteId !== clienteId)) continue;
    if (c.tipo === 3) {
      const factura = c.asociadoA === null ? undefined : porId.get(c.asociadoA);
      if (enVentana(ventana, factura?.vencimiento)) sumarPorCliente(deuda, c.clienteId, negar(c.total));
    } else if (enVentana(ventana, c.vencimiento)) {
      sumarPorCliente(deuda, c.clienteId, c.total);
    }
  }
  for (const r of datos.recibos) {
    if (r.fecha > corte || (clienteId !== undefined && r.clienteId !== clienteId)) continue;
    for (const i of r.imputaciones) {
      if (enVentana(ventana, porId.get(i.comprobanteId)?.vencimiento)) sumarPorCliente(deuda, r.clienteId, negar(i.importe));
    }
  }
  return deuda;
}

/** Lo que se cobró y lo que se imputó, por cliente, en los recibos que existen al corte. */
function cobradoPorCliente(datos: Datos, corte: FechaCivil, clienteId?: string): Map<string, { medios: Centavos; imputado: Centavos }> {
  const cobrado = new Map<string, { medios: Centavos; imputado: Centavos }>();
  for (const r of datos.recibos) {
    if (r.fecha > corte || (clienteId !== undefined && r.clienteId !== clienteId)) continue;
    const actual = cobrado.get(r.clienteId) ?? { medios: CERO, imputado: CERO };
    for (const m of r.medios) actual.medios = sumar(actual.medios, m.importe);
    for (const i of r.imputaciones) actual.imputado = sumar(actual.imputado, i.importe);
    cobrado.set(r.clienteId, actual);
  }
  return cobrado;
}

type CampoDePosicion = "pagos-a-cuenta" | "saldos-a-favor" | "saldo-neto";

/**
 * Por cliente: `S` (lo que debe, sin ventana) y `A` (cobrado − imputado). Con `S > 0`, `A` es pago a cuenta sin imputar; si no, saldo a
 * favor (R4: se decide por el cliente y el a cuenta no se parte). El saldo neto es `S − A`. Se suma por cliente y después entre clientes.
 */
function posicionAgregada(datos: Datos, corte: FechaCivil, campo: CampoDePosicion, clienteId?: string): Centavos {
  const deuda = deudaPorCliente(datos, corte, SIN_VENTANA, clienteId);
  const cobrado = cobradoPorCliente(datos, corte, clienteId);
  let suma = CERO;
  for (const cliente of datos.clientes) {
    if (clienteId !== undefined && cliente.id !== clienteId) continue;
    const s = deuda.get(cliente.id) ?? CERO;
    const c = cobrado.get(cliente.id);
    const a = c === undefined ? CERO : restar(c.medios, c.imputado);
    if (campo === "saldo-neto") suma = sumar(suma, restar(s, a));
    else if (campo === "pagos-a-cuenta") suma = sumar(suma, s > 0 ? a : CERO);
    else suma = sumar(suma, s > 0 ? CERO : a);
  }
  return suma;
}

/**
 * Las medidas del mes sobre un rango de meses `AAAA-MM` (los dos incluidos) y lo que existe al corte. Con un solo mes es la medida del
 * mes (S7); con doce, el «año» contra el que X6 compara la suma de los doce meses.
 */
export function valorDelPeriodo(datos: Datos, corte: FechaCivil, clave: ClaveDelMes, desdeMes: string, hastaMes: string, clienteId?: string): Centavos {
  exigirCorte(corte);
  if (!esClaveDelMes(clave)) throw new Error(`La clave «${clave}» no es una de las medidas del mes.`);
  // Sin armar texto por cada comprobante: un día cualquiera de `AAAA-MM` está entre `AAAA-MM-01` y `AAAA-MM-31` al comparar como texto.
  const desde = `${desdeMes}-01`;
  const hasta = `${hastaMes}-31`;
  const enElPeriodo = (fecha: FechaCivil): boolean => fecha <= corte && fecha >= desde && fecha <= hasta;
  let suma = CERO;
  if (clave === "cobranza-mes" || clave === "retenciones-mes") {
    for (const r of datos.recibos) {
      if (!enElPeriodo(r.fecha) || (clienteId !== undefined && r.clienteId !== clienteId)) continue;
      for (const m of r.medios) if (clave === "cobranza-mes" || esRetencion(m.medio)) suma = sumar(suma, m.importe);
    }
    return suma;
  }
  for (const c of datos.comprobantes) {
    if (!enElPeriodo(c.emision) || (clienteId !== undefined && c.clienteId !== clienteId)) continue;
    const importe = clave === "facturacion-mes" ? c.neto : clave === "iva-mes" ? c.iva : c.total;
    suma = c.tipo === 3 ? restar(suma, importe) : sumar(suma, importe);
  }
  return suma;
}

/**
 * El `valor` de una medida por agregación. Las del mes usan el `mes` del filtro o, sin él, el mes del corte (S7). `mora-otros` lanza si
 * no hay más de 5 clientes con mora (la clave no existe, M4) y no admite filtro por cliente. No valida el filtro: eso lo hace `medidas.ts`.
 */
export function valorAgregado(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, filtro: FiltroDeMedida = {}): Centavos {
  exigirCorte(corte);
  if (esClaveDelMes(clave)) {
    const mes = filtro.mes ?? corte.slice(0, 7);
    return valorDelPeriodo(datos, corte, clave, mes, mes, filtro.clienteId);
  }
  switch (clave) {
    case "saldo":
      return total(deudaPorCliente(datos, corte, SIN_VENTANA, filtro.clienteId));
    case "mora":
      // Atraso ≥ 1 ⇔ vencimiento ≤ corte − 1.
      return total(deudaPorCliente(datos, corte, { desde: null, hasta: sumarDias(corte, -1) }, filtro.clienteId));
    case "tramo-no-vencido":
    case "tramo-1-30":
    case "tramo-31-60":
    case "tramo-61-90":
    case "tramo-mas-90": {
      const limites = TRAMOS.find((t) => `tramo-${t.clave}` === clave);
      if (limites === undefined) throw new Error(`No hay un tramo de antigüedad para la clave ${clave}.`);
      return total(deudaPorCliente(datos, corte, ventanaDelTramo(corte, limites), filtro.clienteId));
    }
    case "pagos-a-cuenta":
    case "saldos-a-favor":
    case "saldo-neto":
      return posicionAgregada(datos, corte, clave, filtro.clienteId);
    case "mora-otros": {
      if (filtro.clienteId !== undefined) throw new Error("La medida mora-otros no admite filtro por cliente: es la mora de los clientes fuera de los cinco mayores deudores.");
      const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
      const filas = [...deudaPorCliente(datos, corte, { desde: null, hasta: sumarDias(corte, -1) }).entries()]
        .filter(([, mora]) => mora > 0)
        .map(([id, importe]) => ({ nombre: nombres.get(id) ?? id, importe }));
      const { otros } = rankingConOtros(filas);
      if (otros === null) throw new Error("La medida mora-otros no existe: hay 5 clientes con mora o menos (M4).");
      return otros.importe;
    }
    default:
      throw new Error(`La clave «${String(clave)}» no es una medida del catálogo.`);
  }
}
