// Tipos del dominio (docs/diseno.md, sección 4).

import type { Centavos } from "./dinero.ts";

/** 'AAAA-MM-DD', siempre validada con `parsearFechaCivil`. */
export type FechaCivil = string;

export interface Empresa {
  nombre: string;
  cuit: string;
  puntoVenta: number;
}

export interface Cliente {
  /** 'C01' a 'C13'. */
  id: string;
  /** Inventada, con "Demo". */
  razonSocial: string;
  /** Ficticio, con dígito verificador válido. */
  cuit: string;
  plazoDias: 15 | 30 | 45 | 60;
}

/** Factura A (1), Nota de débito A (2) y Nota de crédito A (3), con los códigos de ARCA. */
export type TipoCmp = 1 | 2 | 3;

export type Servicio = "alquiler-4x4" | "traslado-personal" | "flete-liviano" | "horas-espera" | "km-excedentes";

export interface Comprobante {
  /** '1-0003-00000123': tipo, punto de venta de 4 dígitos y número de 8 dígitos. */
  id: string;
  tipo: TipoCmp;
  puntoVenta: number;
  numero: number;
  clienteId: string;
  emision: FechaCivil;
  /** Emisión + plazo del cliente (C4); en una NC, la emisión. */
  vencimiento: FechaCivil;
  /** Uno por comprobante; la NC y la ND llevan el de la factura asociada. */
  servicio: Servicio;
  /** Siempre positivos (neto ≥ 1): el signo lo da el tipo (C1). */
  neto: Centavos;
  iva: Centavos;
  total: Centavos;
  /** NC: id de la factura (obligatorio). ND: id de la factura o `null`. */
  asociadoA: string | null;
}

export type Medio = "transferencia" | "cheque" | "retencion-iibb" | "retencion-ganancias" | "retencion-iva";

export interface Recibo {
  /** 'R-0003-00000045'. */
  id: string;
  clienteId: string;
  fecha: FechaCivil;
  /** Importes ≥ 1. */
  medios: { medio: Medio; importe: Centavos }[];
  /** Importes ≥ 1. A cuenta = Σ medios − Σ imputaciones (derivado, ≥ 0; R1). */
  imputaciones: { comprobanteId: string; importe: Centavos }[];
}

export interface Datos {
  version: 1;
  semilla: number;
  /** 2025-01-01. */
  desde: FechaCivil;
  /** 2026-10-31. */
  hasta: FechaCivil;
  empresa: Empresa;
  clientes: Cliente[];
  comprobantes: Comprobante[];
  recibos: Recibo[];
}

// ---------------------------------------------------------------------------------------------------------------------------
// Medidas (4.2): toda cifra del tablero es una `Medida`, base del «¿De dónde sale este número?».
// ---------------------------------------------------------------------------------------------------------------------------

/** Con qué se cuenta una cifra (M5): neto sin IVA, total con IVA o solo el IVA. */
export type Base = "sin-iva" | "con-iva" | "iva";

/** Las 15 claves del catálogo (4.2) y `mora-otros`, que existe solo con más de 5 deudores (M4). */
export type ClaveDeMedida =
  | "facturacion-mes"
  | "facturado-con-iva-mes"
  | "iva-mes"
  | "cobranza-mes"
  | "retenciones-mes"
  | "saldo"
  | "mora"
  | "tramo-no-vencido"
  | "tramo-1-30"
  | "tramo-31-60"
  | "tramo-61-90"
  | "tramo-mas-90"
  | "pagos-a-cuenta"
  | "saldos-a-favor"
  | "saldo-neto"
  | "mora-otros";

/** Qué comprobante o recibo origina una partida: la partida enlaza a él. */
export interface RefDePartida {
  tipo: "comprobante" | "recibo";
  id: string;
}

export interface Partida {
  ref: RefDePartida;
  /** Cliente del comprobante o del recibo: agrupa la tabla «Por cliente» (4.3). */
  clienteId: string;
  /** Emisión del comprobante o fecha del recibo. */
  fecha: FechaCivil;
  /** Firmado. */
  importe: Centavos;
  /** Solo en las medidas de saldo: días de atraso al corte (S3); el tramo sale de `tramoDe` (A1). */
  atraso?: number;
  /** Detalle en palabras, armado por `textos.ts`. */
  nota?: string;
}

/** Filtros de una medida (4.3): un cliente, y un mes `AAAA-MM` (solo en las medidas del mes). */
export interface FiltroDeMedida {
  clienteId?: string;
  mes?: string;
}

export interface Medida {
  clave: ClaveDeMedida;
  titulo: string;
  base: Base;
  /** Una frase en lenguaje llano armada con los números del corte. */
  formula: string;
  /** Camino por agregación (4.2.1). */
  valor: Centavos;
  /** Camino por listado (4.2.1); `controlar` los compara (D2). */
  partidas: Partida[];
  filtro: FiltroDeMedida;
}
