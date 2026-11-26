// El generador de los datos de ejemplo (docs/diseno.md, 5.2). Es simple y busca que los datos se vean como los de una empresa real: cada cliente
// factura todos los meses y cobra con su atraso habitual. **No fuerza ningún resultado**: lo que dé, da. Los resultados de 5.4 se fijan para la
// semilla publicada (`esperado.ts`), no para toda semilla; lo que vale para cualquier semilla son los invariantes (D2, D3, A2, G2, G5).
//
// El orden de las llamadas al azar es parte del contrato (cambiarlo cambia la huella):
//   1. el CUIT de cada cliente, en orden de id (13 sorteos);
//   2. mes por mes y, dentro de cada mes, cliente por cliente en orden de id, el relleno de comprobantes: la cantidad (1 a 4) y, por cada factura,
//      el día del mes, el servicio (solo de la segunda en adelante: la primera es siempre el alquiler) y el importe en pesos;
//   3. por cada factura de relleno, en el orden de emisión (emisión, id de cliente, orden de generación), sus sorteos de cobro, siempre en este
//      orden y **aunque el resultado se descarte después**: (solo C06) si lleva NC, su porcentaje y sus días; el corrimiento del cobro; el medio.
// Los casos plantados no usan el azar y se agregan al final, en el orden de la tabla 5.3.

import { MEDIOS } from "../dominio/claves.ts";
import { numerarComprobantes, numerarRecibos } from "../dominio/comprobantes.ts";
import type { BorradorDeComprobante, BorradorDeRecibo } from "../dominio/comprobantes.ts";
import { calcularIva, centavos, restar, sumar } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";
import { diasDeMes, sumarDias, sumarMeses } from "../dominio/fechas.ts";
import type { Datos, FechaCivil, Medio, Servicio } from "../dominio/tipos.ts";
import { crearAzar } from "./azar.ts";
import { CLIENTES_BASE, armarClientes, crearEmpresa } from "./clientes.ts";
import type { ClienteBase, Perfil } from "./clientes.ts";
import { DESDE, HASTA, PUNTO_DE_VENTA, SEMILLA_PUBLICADA } from "./constantes.ts";
import { COMPROBANTES_PLANTADOS, RECIBOS_PLANTADOS } from "./plantados.ts";
import type { Plantados } from "./plantados.ts";

export interface Generado {
  datos: Datos;
  /** Alias de cada caso plantado (5.3) → su id en estos datos. Los ids dependen de la numeración, o sea del relleno de la semilla. */
  plantados: Plantados;
}

/** Neto del relleno de cada servicio, en pesos enteros (5.1). El del cliente se multiplica por su `escala`. */
const RANGO_DE_SERVICIO: Readonly<Record<Servicio, readonly [number, number]>> = {
  "alquiler-4x4": [600_000, 900_000],
  "traslado-personal": [120_000, 350_000],
  "flete-liviano": [60_000, 180_000],
  "horas-espera": [20_000, 80_000],
  "km-excedentes": [15_000, 90_000],
};

/** De dónde sale el servicio de la segunda factura del mes en adelante: en enero y febrero el traslado de personal pesa el triple (estacionalidad leve, 5.1). */
const SERVICIOS_EXTRA: readonly Servicio[] = ["traslado-personal", "flete-liviano", "horas-espera", "km-excedentes"];
const SERVICIOS_EXTRA_DE_VERANO: readonly Servicio[] = ["traslado-personal", "traslado-personal", "traslado-personal", "flete-liviano", "horas-espera", "km-excedentes"];

/** Corrimiento del cobro sobre el vencimiento, en días, por perfil (5.2). */
const CORRIMIENTO: Readonly<Record<Perfil, readonly [number, number]>> = {
  puntual: [-5, 0],
  lento: [10, 40],
  moroso: [45, 90],
  "con-retenciones": [0, 20],
  "con-nc": [0, 15],
};

/** Retenciones de C02, en milésimas del neto: IIBB 2,5 % y Ganancias 1,5 %. Son de ficción, no alícuotas vigentes de ninguna jurisdicción (5.1). */
const TASA_IIBB = 25;
const TASA_GANANCIAS = 15;

/** A veces el medio es cheque (que cancela a la fecha del recibo); el resto, transferencia. */
const PROBABILIDAD_DE_CHEQUE = 0.15;
/** Una de cada ocho facturas de relleno de C06 lleva una NC parcial. */
const PROBABILIDAD_DE_NC = 1 / 8;
const MAXIMO_POR_RECIBO = 3;

interface FacturaDeRelleno {
  clave: string;
  base: ClienteBase;
  emision: FechaCivil;
  servicio: Servicio;
  /** Neto en pesos enteros. */
  pesos: number;
  /** Orden de generación: desempata la emisión y el cliente. */
  orden: number;
}

interface Cobro {
  factura: FacturaDeRelleno;
  fecha: FechaCivil;
  medios: { medio: Medio; importe: Centavos }[];
}

/** Los cobros de un mismo cliente y fecha se reparten en recibos de hasta `maximo` comprobantes, en el orden de emisión (el cuarto va a otro recibo del mismo día). */
export function partirEnRecibos<T>(cobros: readonly T[], maximo: number = MAXIMO_POR_RECIBO): T[][] {
  if (!Number.isInteger(maximo) || maximo < 1) throw new Error(`El máximo de comprobantes por recibo tiene que ser un entero de 1 o más (llegó ${maximo}).`);
  const partes: T[][] = [];
  for (let desde = 0; desde < cobros.length; desde += maximo) partes.push(cobros.slice(desde, desde + maximo));
  return partes;
}

/** Los meses `AAAA-MM` del calendario fijo, de `DESDE` a `HASTA` (22). */
function mesesDelCalendario(): string[] {
  const meses: string[] = [];
  for (let mes = DESDE.slice(0, 7); mes <= HASTA.slice(0, 7); mes = sumarMeses(mes, 1)) meses.push(mes);
  return meses;
}

const totalDe = (neto: Centavos): Centavos => sumar(neto, calcularIva(neto));

/** Retención de una milésima parte `tasa` del neto, con el redondeo de M2: `(neto × tasa + 500) ÷ 1000`. */
function retencion(neto: Centavos, tasa: number): Centavos {
  const bruto = neto * tasa + 500;
  return centavos((bruto - (bruto % 1000)) / 1000);
}

/** El relleno de comprobantes (paso 2 del orden del azar). */
function rellenarFacturas(azar: ReturnType<typeof crearAzar>): FacturaDeRelleno[] {
  const facturas: FacturaDeRelleno[] = [];
  for (const mes of mesesDelCalendario()) {
    const extras = /-0[12]$/.test(mes) ? SERVICIOS_EXTRA_DE_VERANO : SERVICIOS_EXTRA;
    for (const base of CLIENTES_BASE) {
      if (base.sinRellenoDesde !== undefined && `${mes}-01` >= base.sinRellenoDesde) continue;
      const cantidad = azar.entero(1, 4);
      for (let i = 0; i < cantidad; i++) {
        const dia = azar.entero(1, diasDeMes(mes));
        const servicio = i === 0 ? "alquiler-4x4" : azar.elegir(extras);
        const [minimo, maximo] = RANGO_DE_SERVICIO[servicio];
        const pesos = azar.entero(minimo, maximo) * base.escala;
        facturas.push({ clave: `F${facturas.length + 1}`, base, emision: `${mes}-${String(dia).padStart(2, "0")}`, servicio, pesos, orden: facturas.length });
      }
    }
  }
  return facturas;
}

/**
 * Genera los datos de ejemplo para una semilla: relleno con su cobranza, y los casos plantados de 5.3 al final. Determinista: la misma
 * semilla da exactamente los mismos datos (G1).
 */
export function generar(semilla: number = SEMILLA_PUBLICADA): Generado {
  const azar = crearAzar(semilla);
  const clientes = armarClientes(azar);
  const facturas = rellenarFacturas(azar);

  const comprobantes: BorradorDeComprobante[] = facturas.map((f) => ({
    clave: f.clave,
    tipo: 1,
    clienteId: f.base.id,
    emision: f.emision,
    servicio: f.servicio,
    neto: centavos(f.pesos * 100),
    asociadoA: null,
  }));

  // Cobros: por cada factura de relleno, en el orden de emisión, con los mismos sorteos aunque el resultado se descarte.
  const enOrden = [...facturas].sort((a, b) => (a.emision < b.emision ? -1 : a.emision > b.emision ? 1 : a.base.id < b.base.id ? -1 : a.base.id > b.base.id ? 1 : a.orden - b.orden));
  const cobros: Cobro[] = [];
  for (const f of enOrden) {
    const neto = centavos(f.pesos * 100);
    let aCobrar = totalDe(neto);
    if (f.base.perfil === "con-nc") {
      const lleva = azar.probabilidad(PROBABILIDAD_DE_NC);
      if (lleva) {
        const porcentaje = azar.entero(10, 100);
        const dias = azar.entero(3, 25);
        const fechaNc = sumarDias(f.emision, dias);
        if (fechaNc <= HASTA) {
          const netoNc = centavos(f.pesos * porcentaje); // el porcentaje del neto, exacto: neto en centavos = pesos × 100
          comprobantes.push({ clave: `${f.clave}-NC`, tipo: 3, clienteId: f.base.id, emision: fechaNc, servicio: f.servicio, neto: netoNc, asociadoA: f.clave });
          aCobrar = restar(aCobrar, totalDe(netoNc));
        }
      }
    }
    const [minimo, maximo] = CORRIMIENTO[f.base.perfil];
    const corrimiento = azar.entero(minimo, maximo);
    const cheque = azar.probabilidad(PROBABILIDAD_DE_CHEQUE);
    if (aCobrar <= 0) continue; // una NC del 100 % anula la factura: no hay cobro ni recibo
    const vencimiento = sumarDias(f.emision, f.base.plazoDias);
    const calculada = sumarDias(vencimiento, corrimiento);
    // El máximo con la emisión que pide 5.2 hoy es defensivo: con el plazo mínimo (15) y el corrimiento mínimo (−5), `calculada` cae al menos 10 días
    // después de la emisión y la rama nunca se toma. Se deja por si cambia una tabla; ningún test puede ejercitarla con los valores actuales.
    const fecha = calculada < f.emision ? f.emision : calculada;
    if (fecha > HASTA) continue; // los datos terminan el 31/10: la factura figura impaga
    const principal: Medio = cheque ? "cheque" : "transferencia";
    if (f.base.perfil === "con-retenciones") {
      const iibb = retencion(neto, TASA_IIBB);
      const ganancias = retencion(neto, TASA_GANANCIAS);
      cobros.push({
        factura: f,
        fecha,
        medios: [
          { medio: principal, importe: restar(restar(aCobrar, iibb), ganancias) },
          { medio: "retencion-iibb", importe: iibb },
          { medio: "retencion-ganancias", importe: ganancias },
        ],
      });
    } else {
      cobros.push({ factura: f, fecha, medios: [{ medio: principal, importe: aCobrar }] });
    }
  }

  // Recibos: un recibo reúne los cobros de un mismo cliente y fecha, hasta 3 comprobantes en el orden de emisión.
  const grupos = new Map<string, Cobro[]>();
  for (const c of cobros) {
    const llave = `${c.factura.base.id}|${c.fecha}`;
    grupos.set(llave, [...(grupos.get(llave) ?? []), c]);
  }
  const recibos: BorradorDeRecibo[] = [];
  for (const grupo of grupos.values()) {
    for (const parte of partirEnRecibos(grupo)) {
      const primero = parte[0];
      if (primero === undefined) continue;
      const medios = MEDIOS.map((medio) => ({ medio, importe: parte.flatMap((c) => c.medios).filter((m) => m.medio === medio).reduce((s, m) => sumar(s, m.importe), centavos(0)) })).filter((m) => m.importe > 0);
      recibos.push({
        clave: `R${recibos.length + 1}`,
        clienteId: primero.factura.base.id,
        fecha: primero.fecha,
        medios,
        imputaciones: parte.map((c) => ({ comprobante: c.factura.clave, importe: c.medios.reduce((s, m) => sumar(s, m.importe), centavos(0)) })),
      });
    }
  }

  const numerados = numerarComprobantes([...comprobantes, ...COMPROBANTES_PLANTADOS], clientes, PUNTO_DE_VENTA);
  const numerosDeRecibos = numerarRecibos([...recibos, ...RECIBOS_PLANTADOS], numerados.idPorClave, PUNTO_DE_VENTA);
  const plantados: Record<string, string> = {};
  for (const c of COMPROBANTES_PLANTADOS) plantados[c.clave] = idDe(numerados.idPorClave, c.clave);
  for (const r of RECIBOS_PLANTADOS) plantados[r.clave] = idDe(numerosDeRecibos.idPorClave, r.clave);

  return {
    datos: { version: 1, semilla, desde: DESDE, hasta: HASTA, empresa: crearEmpresa(), clientes, comprobantes: numerados.comprobantes, recibos: numerosDeRecibos.recibos },
    plantados,
  };
}

function idDe(ids: ReadonlyMap<string, string>, clave: string): string {
  const id = ids.get(clave);
  if (id === undefined) throw new Error(`Error interno: el caso plantado ${clave} no recibió número.`);
  return id;
}
