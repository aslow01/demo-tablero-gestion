// Formato de los modelos de vista: helpers puros que la pantalla necesita y el dominio no da. Sin texto visible y sin aritmética de dinero nueva (M1):
// el importe se parte **leyendo** el texto de `formatearImporte`, no recalculándolo.

import { TRAMOS, tramoDe } from "../dominio/antiguedad.ts";
import type { Tramo } from "../dominio/antiguedad.ts";
import { formatearImporte } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";
import { diasDeMes } from "../dominio/fechas.ts";
import type { FechaCivil } from "../dominio/tipos.ts";
import { LARGO_MAXIMO_DE_BUSQUEDA } from "./tipos.ts";

// ---------------------------------------------------------------------------------------------------------------------------
// Importe en partes (la cifra grande: entero con miles y centavos más chicos)
// ---------------------------------------------------------------------------------------------------------------------------

export interface PartesDeImporte {
  negativo: boolean;
  /** Con los puntos de los miles: «1.234». La pantalla puede dejar partir la línea después de cada punto. */
  enteros: string;
  /** Siempre dos dígitos: «05». */
  centavos: string;
}

const FORMA_DEL_IMPORTE = /^(−)?\$ (\d{1,3}(?:\.\d{3})*),(\d{2})$/;

/** `$ 1.234,56` → `{ negativo: false, enteros: "1.234", centavos: "56" }`. Parte el texto de `formatearImporte`: no hay otra cuenta. */
export function partesDeImporte(importe: Centavos): PartesDeImporte {
  const texto = formatearImporte(importe);
  const partes = FORMA_DEL_IMPORTE.exec(texto);
  if (partes === null) throw new Error(`Error interno: el importe «${texto}» no tiene la forma de M1.`);
  return { negativo: partes[1] !== undefined, enteros: partes[2] ?? "", centavos: partes[3] ?? "" };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Ubicador: dónde cae un comprobante en la regla de tramos
// ---------------------------------------------------------------------------------------------------------------------------

/** El tramo de A1 → primer y último atraso que dibuja el ubicador (el primero y el último se recortan: 30 días antes del vencimiento y 6 meses después). */
const RANGO_DEL_UBICADOR: Readonly<Record<Tramo, readonly [number, number]>> = {
  "no-vencido": [-29, 0],
  "1-30": [1, 30],
  "31-60": [31, 60],
  "61-90": [61, 90],
  "mas-90": [91, 180],
};

/**
 * La posición de la marca del ubicador, en milésimas del ancho de la barra (0 a 999). La barra tiene cinco quintos, uno por tramo; dentro de su
 * quinto, la marca va en la mitad del día que le toca (un atraso de 0 y de 1 no se pisan). Un atraso fuera de −29 a 180 se recorta a ese rango.
 * Con enteros: no hay coma flotante en ninguna parte del camino.
 */
export function posicionEnRegla(atraso: number): number {
  const tramo = tramoDe(atraso);
  const indice = TRAMOS.findIndex((t) => t.clave === tramo);
  const [minimo, maximo] = RANGO_DEL_UBICADOR[tramo];
  const dia = Math.min(maximo, Math.max(minimo, atraso));
  const ancho = maximo - minimo + 1;
  // (indice + (dia − minimo + 1/2) / ancho) / 5, en milésimas: 1000 × (2·indice·ancho + 2·(dia − minimo) + 1) / (10 · ancho).
  const medios = 2 * indice * ancho + 2 * (dia - minimo) + 1;
  return Math.floor((100 * medios) / ancho);
}

export interface Ubicador {
  atraso: number;
  tramo: Tramo;
  /** `posicionEnRegla`. */
  milesimas: number;
  /** El rótulo de la marca se alinea hacia adentro cuando la marca está a menos del 12 % de un borde (si no, se saldría de la barra). */
  borde: "izquierdo" | "derecho" | null;
}

export function ubicadorDe(atraso: number): Ubicador {
  const milesimas = posicionEnRegla(atraso);
  return { atraso, tramo: tramoDe(atraso), milesimas, borde: milesimas < 120 ? "izquierdo" : milesimas > 880 ? "derecho" : null };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Búsqueda y fechas
// ---------------------------------------------------------------------------------------------------------------------------

/**
 * Lo escrito en un buscador, listo para comparar con `includes`: recortado a 60 caracteres (no parte un carácter por la mitad), sin espacios en los
 * costados, en minúsculas y sin tildes. Es texto: nunca se usa como expresión regular ni como HTML.
 */
export function normalizarBusqueda(texto: string): string {
  return normalizarTexto(Array.from(texto).slice(0, LARGO_MAXIMO_DE_BUSQUEDA).join(""));
}

/** Un texto de los datos (una razón social) en la misma forma que la búsqueda, para compararlos con `includes`: sin recortar. */
export function normalizarTexto(texto: string): string {
  return texto.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/** El último día del mes de una fecha civil válida: el cierre de ese mes (el destino de «Verlo al …»). */
export function ultimoDiaDelMes(fecha: FechaCivil): FechaCivil {
  const mes = fecha.slice(0, 7);
  return `${mes}-${String(diasDeMes(mes)).padStart(2, "0")}`;
}
