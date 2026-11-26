// Arma un `Datos` mínimo a mano para los fixtures de docs/diseno.md, sección 5.5 (docs/plan.md, paso 2.4).
// Numera, calcula IVA y total con M2 y el vencimiento con C4 usando las mismas funciones del dominio (`numerarComprobantes`,
// `numerarRecibos`): lo que prueba que los fixtures son datos válidos es el validador (C2, C3, R1, R3), no esta función.
import { congelar } from "../../src/lib/datos/congelar.ts";
import { armarCuit } from "../../src/lib/datos/cuit.ts";
import { numerarComprobantes, numerarRecibos } from "../../src/lib/dominio/comprobantes.ts";
import type { BorradorDeComprobante, BorradorDeRecibo } from "../../src/lib/dominio/comprobantes.ts";
import { centavos } from "../../src/lib/dominio/dinero.ts";
import type { Centavos } from "../../src/lib/dominio/dinero.ts";
import type { Cliente, Datos, FechaCivil, Medio, Servicio, TipoCmp } from "../../src/lib/dominio/tipos.ts";

/** Pesos → centavos. Solo para escribir los casos de las tablas (pesos enteros, o con la fracción exacta de un peso). */
export function pesos(n: number): Centavos {
  return centavos(n * 100);
}

/** Un CUIT ficticio con dígito verificador válido: el primero de la serie 30-99000xxx que tiene verificador. */
function cuitFicticio(semilla: number): string {
  for (let base = 99_000_000 + semilla * 10; ; base++) {
    const cuit = armarCuit("30", String(base));
    if (cuit !== null) return cuit;
  }
}

// Los 13 clientes de docs/diseno.md, 5.1 (razón social inventada y plazo). El perfil de pago es del generador y no está acá.
const TABLA_5_1: readonly [string, string, Cliente["plazoDias"]][] = [
  ["C01", "Operadora Piedra Lunar Demo S.A.", 45],
  ["C02", "Operadora Arroyo Escondido Demo S.A.", 60],
  ["C03", "Minera Cordón Azul Demo S.A.", 30],
  ["C04", "Constructora Valle Hondo Demo S.R.L.", 30],
  ["C05", "Contratista Los Algarrobos Demo S.A.", 30],
  ["C06", "Obras Cumbre Demo S.A.", 45],
  ["C07", "Montajes Sierra Chica Demo S.R.L.", 30],
  ["C08", "Transportes Altiplano Demo S.A.", 15],
  ["C09", "Perforaciones del Oeste Demo S.A.", 60],
  ["C10", "Servicios Cerro Plata Demo S.R.L.", 30],
  ["C11", "Camiones del Norte Demo S.A.", 30],
  ["C12", "Ingeniería Paso Largo Demo S.R.L.", 45],
  ["C13", "Estructuras Río Seco Demo S.R.L.", 30],
];

export const CLIENTES_DE_PRUEBA: readonly Cliente[] = TABLA_5_1.map(([id, razonSocial, plazoDias], i) => ({
  id,
  razonSocial,
  cuit: cuitFicticio(i + 1),
  plazoDias,
}));

export interface ComprobanteDeFixture {
  /** Alias del caso (por ejemplo «T09-F»): sirve para asociar y para pedir el id con `id(clave)`. */
  clave: string;
  /** Factura (1) por defecto. */
  tipo?: TipoCmp;
  cliente: string;
  emision: FechaCivil;
  neto: Centavos;
  servicio?: Servicio;
  /** Clave de la factura asociada (NC, y ND si corresponde). */
  asociadoA?: string;
}

export interface ReciboDeFixture {
  /** Si falta, se le da una clave propia (`recibo-1`, `recibo-2`…). */
  clave?: string;
  cliente: string;
  fecha: FechaCivil;
  /** El medio es `transferencia` si no se dice otro. */
  medios: { medio?: Medio; importe: Centavos }[];
  /** `comprobante` es la clave de un comprobante del mismo fixture. Sin imputaciones, todo es a cuenta. */
  imputaciones?: { comprobante: string; importe: Centavos }[];
}

export interface Armado {
  datos: Datos;
  /** El id de un comprobante o de un recibo según su clave. Lanza, nombrando la clave, si no existe. */
  id: (clave: string) => string;
}

export function armarDatos(o: {
  comprobantes?: readonly ComprobanteDeFixture[];
  recibos?: readonly ReciboDeFixture[];
  clientes?: readonly Cliente[];
  desde?: FechaCivil;
  hasta?: FechaCivil;
}): Armado {
  const clientes = [...(o.clientes ?? CLIENTES_DE_PRUEBA)];
  const puntoVenta = 3;
  const borradoresC: BorradorDeComprobante[] = (o.comprobantes ?? []).map((c) => ({
    clave: c.clave,
    tipo: c.tipo ?? 1,
    clienteId: c.cliente,
    emision: c.emision,
    servicio: c.servicio ?? "alquiler-4x4",
    neto: c.neto,
    asociadoA: c.asociadoA ?? null,
  }));
  const borradoresR: BorradorDeRecibo[] = (o.recibos ?? []).map((r, i) => ({
    clave: r.clave ?? `recibo-${i + 1}`,
    clienteId: r.cliente,
    fecha: r.fecha,
    medios: r.medios.map((m) => ({ medio: m.medio ?? "transferencia", importe: m.importe })),
    imputaciones: (r.imputaciones ?? []).map((x) => ({ comprobante: x.comprobante, importe: x.importe })),
  }));
  const comprobantes = numerarComprobantes(borradoresC, clientes, puntoVenta);
  const recibos = numerarRecibos(borradoresR, comprobantes.idPorClave, puntoVenta);
  const ids = new Map([...comprobantes.idPorClave, ...recibos.idPorClave]);
  return {
    // Congelados, como los de la demo: un test que quiera datos distintos arma otro objeto (con un spread), no cambia el que armó.
    datos: congelar({
      version: 1,
      semilla: 0,
      desde: o.desde ?? "2025-01-01",
      hasta: o.hasta ?? "2026-10-31",
      empresa: { nombre: "Logística Andina Demo S.A.", cuit: armarCuit("30", "99000003") ?? "", puntoVenta },
      clientes,
      comprobantes: comprobantes.comprobantes,
      recibos: recibos.recibos,
    } satisfies Datos),
    id: (clave) => {
      const id = ids.get(clave);
      if (id === undefined) throw new Error(`No hay ningún comprobante ni recibo con la clave «${clave}».`);
      return id;
    },
  };
}
