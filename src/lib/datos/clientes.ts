// Los 13 clientes de la empresa ficticia (docs/diseno.md, 5.1): razón social inventada, plazo, perfil de pago (una constante del generador, no un dato
// de `Datos`) y el CUIT ficticio, que sale del azar. Todo es inventado; los nombres llevan «Demo» (G4).

import { armarCuit } from "./cuit.ts";
import type { Azar } from "./azar.ts";
import { PUNTO_DE_VENTA } from "./constantes.ts";
import type { Cliente, Empresa, FechaCivil } from "../dominio/tipos.ts";

/** Cómo paga cada cliente: el corrimiento del cobro sobre el vencimiento sale de acá (5.2). */
export type Perfil = "puntual" | "con-retenciones" | "lento" | "moroso" | "con-nc";

export interface ClienteBase {
  id: string;
  razonSocial: string;
  plazoDias: Cliente["plazoDias"];
  perfil: Perfil;
  /** Cuánto se multiplican los importes del relleno: los tres más grandes (C01, C02, C03) facturan 2 o 3 veces más (5.1). */
  escala: 1 | 2 | 3;
  /** Un cliente que se fue: no hay relleno desde esa fecha (C09, 5.2). */
  sinRellenoDesde?: FechaCivil;
}

/** La tabla de 5.1, en orden de id. */
export const CLIENTES_BASE: readonly ClienteBase[] = [
  { id: "C01", razonSocial: "Operadora Piedra Lunar Demo S.A.", plazoDias: 45, perfil: "puntual", escala: 3 },
  { id: "C02", razonSocial: "Operadora Arroyo Escondido Demo S.A.", plazoDias: 60, perfil: "con-retenciones", escala: 3 },
  { id: "C03", razonSocial: "Minera Cordón Azul Demo S.A.", plazoDias: 30, perfil: "lento", escala: 2 },
  { id: "C04", razonSocial: "Constructora Valle Hondo Demo S.R.L.", plazoDias: 30, perfil: "puntual", escala: 1 },
  { id: "C05", razonSocial: "Contratista Los Algarrobos Demo S.A.", plazoDias: 30, perfil: "moroso", escala: 1 },
  { id: "C06", razonSocial: "Obras Cumbre Demo S.A.", plazoDias: 45, perfil: "con-nc", escala: 1 },
  { id: "C07", razonSocial: "Montajes Sierra Chica Demo S.R.L.", plazoDias: 30, perfil: "lento", escala: 1 },
  { id: "C08", razonSocial: "Transportes Altiplano Demo S.A.", plazoDias: 15, perfil: "puntual", escala: 1 },
  { id: "C09", razonSocial: "Perforaciones del Oeste Demo S.A.", plazoDias: 60, perfil: "puntual", escala: 1, sinRellenoDesde: "2026-08-01" },
  { id: "C10", razonSocial: "Servicios Cerro Plata Demo S.R.L.", plazoDias: 30, perfil: "lento", escala: 1 },
  { id: "C11", razonSocial: "Camiones del Norte Demo S.A.", plazoDias: 30, perfil: "lento", escala: 1 },
  { id: "C12", razonSocial: "Ingeniería Paso Largo Demo S.R.L.", plazoDias: 45, perfil: "puntual", escala: 1 },
  { id: "C13", razonSocial: "Estructuras Río Seco Demo S.R.L.", plazoDias: 30, perfil: "puntual", escala: 1 },
];

/** CUIT ficticio de prefijo 30 con una base de ocho dígitos; si esa base no tiene dígito verificador, se pasa a la siguiente (5.1). */
export function cuitDesdeBase(base8: number): string {
  for (let base = base8; base <= 99_999_999; base++) {
    const cuit = armarCuit("30", String(base).padStart(8, "0"));
    if (cuit !== null) return cuit;
  }
  throw new Error(`No hay un CUIT válido a partir de la base ${base8}.`);
}

/** Base de ocho dígitos de la empresa: la misma que usa la Demo 2 (`armarCuit("30", "99000003")`, docs/diseno.md, sección 2). */
export const BASE_DE_EMPRESA = 99_000_003;

/**
 * Rango de las bases de los clientes: el mismo bloque 99 de la empresa, por encima de ella para no pisarla. Tomar la base de todo el espacio
 * (10.000.000 a 99.999.999) haría probable que alguna cayera en una franja con empresas reales. **No está comprobado que este bloque esté libre**:
 * es un criterio de menor riesgo, no una garantía; conviene consultar a mano los 14 CUIT antes de publicar.
 */
export const BASE_DE_CLIENTES_DESDE = 99_100_000;
export const BASE_DE_CLIENTES_HASTA = 99_999_999;

/**
 * Los clientes de `Datos`. Los CUIT son lo **primero** que usa el azar: un sorteo por cliente, en orden de id (el orden de las llamadas es parte
 * del contrato de la semilla, 5.2). `entero(a, b)` consume un solo sorteo sea cual sea el rango: acotarlo no mueve el resto del generador.
 */
export function armarClientes(azar: Azar): Cliente[] {
  return CLIENTES_BASE.map((c) => ({
    id: c.id,
    razonSocial: c.razonSocial,
    cuit: cuitDesdeBase(azar.entero(BASE_DE_CLIENTES_DESDE, BASE_DE_CLIENTES_HASTA)),
    plazoDias: c.plazoDias,
  }));
}

/** La empresa. Su CUIT es fijo (no usa el azar): ficticio, con dígito verificador válido. */
export function crearEmpresa(): Empresa {
  return { nombre: "Logística Andina Demo S.A.", cuit: cuitDesdeBase(BASE_DE_EMPRESA), puntoVenta: PUNTO_DE_VENTA };
}
