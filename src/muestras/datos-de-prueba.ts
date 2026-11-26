// SOLO DESARROLLO: datos de prueba para la página de muestras de los gráficos (`muestras.html`). No son los de la semilla ni de ningún cliente:
// son números inventados para estirar los componentes (un valor negativo, un tramo en 0, pocos meses, importes chicos, una proporción extrema).
import { centavos, formatearImporte, porcentajes, sumarLista } from "../lib/dominio/dinero.ts";
import type { Centavos } from "../lib/dominio/dinero.ts";
import { ROTULO_DE_TRAMO, nombreDelMes } from "../lib/dominio/textos.ts";
import type { Tramo } from "../lib/dominio/antiguedad.ts";
import type { MesDelGrafico, SerieDelGrafico, TablaDelGrafico, TramoDeRegla } from "../componentes/tipos-graficos.ts";

/** Millones de pesos → centavos enteros. */
const millones = (n: number): Centavos => centavos(Math.round(n * 100_000_000));

const MESES_DOCE = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
const MESES_CINCO = MESES_DOCE.slice(7);

const mayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

// ---------- Gráfico 1: facturado y cobrado, 12 meses, dos series ----------
const facturado = [6.2, 7.1, 5.8, 6.9, 7.4, 8.0, 7.7, 8.3, 8.9, 9.4, 10.1, 11.6];
const cobrado = [5.5, 6.3, 6.1, 5.9, 6.6, 7.2, 7.9, 7.4, 8.1, 8.8, 9.2, 8.3];

export const seriesFacturadoCobrado: SerieDelGrafico[] = [
  { rotulo: "Facturado (con IVA)", clase: "facturado" },
  { rotulo: "Cobrado", clase: "cobrado" },
];
export const mesesFacturadoCobrado: MesDelGrafico[] = MESES_DOCE.map((mes, i) => ({ mes, valores: [millones(facturado[i] ?? 0), millones(cobrado[i] ?? 0)] }));

function tablaFacturadoCobrado(): TablaDelGrafico {
  const filas = mesesFacturadoCobrado.map((m) => {
    const [conIva = centavos(0), cobro = centavos(0)] = m.valores;
    const sinIva = centavos(Math.round(conIva / 1.21));
    const retenciones = centavos(Math.round(cobro * 0.03));
    return { mes: m.mes, importes: [sinIva, conIva, cobro, retenciones] };
  });
  const columnas = ["Facturación sin IVA", "Facturado con IVA", "Cobrado", "De lo cual, retenciones"];
  return {
    titulo: "Facturado y cobrado por mes",
    columnas,
    filas,
    total: { rotulo: "Total de los 12 meses", importes: columnas.map((_, c) => sumarLista(filas.map((f) => f.importes[c] ?? centavos(0)))) },
  };
}
export const tablaFacturadoCobradoDePrueba = tablaFacturadoCobrado();

// ---------- Gráfico 2: facturación de un cliente, una serie, con un valor negativo y un mes en 0 ----------
const delCliente = [1.2, 0.9, 1.6, 0, 2.1, 1.4, -0.7, 1.8, 2.4, 1.9, 2.8, 3.1];
export const serieDelCliente: SerieDelGrafico[] = [{ rotulo: "Facturación sin IVA", clase: "facturado" }];
export const mesesDelCliente: MesDelGrafico[] = MESES_DOCE.map((mes, i) => ({ mes, valores: [millones(delCliente[i] ?? 0)] }));
export const tablaDelCliente: TablaDelGrafico = {
  titulo: "Facturación sin IVA del cliente por mes",
  columnas: ["Facturación sin IVA"],
  filas: mesesDelCliente.map((m) => ({ mes: m.mes, importes: [...m.valores] })),
  total: { rotulo: "Total de los 12 meses", importes: [sumarLista(mesesDelCliente.map((m) => m.valores[0] ?? centavos(0)))] },
};

// ---------- Gráfico 3: cinco meses, importes menores a un millón ----------
const chicosFacturado = [0.21, 0.34, 0.18, 0.42, 0.37];
const chicosCobrado = [0.15, 0.3, 0.22, 0.31, 0.12];
export const mesesChicos: MesDelGrafico[] = MESES_CINCO.map((mes, i) => ({ mes, valores: [millones(chicosFacturado[i] ?? 0), millones(chicosCobrado[i] ?? 0)] }));
export const tablaChicos: TablaDelGrafico = {
  titulo: "Facturado y cobrado por mes (pocos meses)",
  columnas: ["Facturado con IVA", "Cobrado"],
  filas: mesesChicos.map((m) => ({ mes: m.mes, importes: [...m.valores] })),
  total: {
    rotulo: "Total de los 5 meses",
    importes: [0, 1].map((c) => sumarLista(mesesChicos.map((m) => m.valores[c] ?? centavos(0)))),
  },
};

/** Resumen para lectores de pantalla: en la aplicación lo arma la lógica; acá, una versión mínima para probar el `aria-label`. */
export function resumenDelGrafico(titulo: string, meses: readonly MesDelGrafico[], series: readonly SerieDelGrafico[]): string {
  const ultimo = meses[meses.length - 1];
  if (ultimo === undefined) return titulo;
  const partes = series.map((s, i) => `${s.rotulo} ${formatearImporte(ultimo.valores[i] ?? centavos(0))}`).join(", ");
  return `${titulo}, de ${nombreDelMes((meses[0] ?? ultimo).mes)} a ${nombreDelMes(ultimo.mes)}. ${mayuscula(nombreDelMes(ultimo.mes))}: ${partes}. Los valores de todos los meses están en la tabla siguiente.`;
}

export function renglonDeCorte(meses: readonly MesDelGrafico[], series: readonly SerieDelGrafico[]): string {
  const ultimo = meses[meses.length - 1];
  if (ultimo === undefined) return "";
  return `${mayuscula(nombreDelMes(ultimo.mes))}: ${series.map((s, i) => `${s.rotulo} ${formatearImporte(ultimo.valores[i] ?? centavos(0))}`).join(" · ")}`;
}

// ---------- Regla de tramos ----------
const ORDEN: readonly Tramo[] = ["no-vencido", "1-30", "31-60", "61-90", "mas-90"];

/** Arma los cinco tramos con sus porcentajes de M3 (suman 100,0 %). `importes` en pesos, en el orden de los tramos. */
export function tramosDePrueba(pesos: readonly [number, number, number, number, number]): TramoDeRegla[] {
  const importes = pesos.map((p) => centavos(p * 100));
  const pct = porcentajes(importes.map((importe, i) => ({ nombre: ORDEN[i] ?? "", importe })));
  return ORDEN.map((clave, i) => ({ clave, importe: importes[i] ?? centavos(0), porcentaje: pct[i] ?? null }));
}

export function resumenDeRegla(tramos: readonly TramoDeRegla[]): string {
  return `Saldo a cobrar según días de atraso: ${tramos.map((t) => `${ROTULO_DE_TRAMO[t.clave].toLowerCase()} ${formatearImporte(t.importe)}`).join("; ")}.`;
}

/** Con un tramo en 0 (el 61–90 de la semilla publicada está en 0: así se ve). */
export const tramosConUnoEnCero = tramosDePrueba([2_450_000, 810_000, 1_330_000, 0, 605_000]);
export const tramosCompletos = tramosDePrueba([3_100_000, 940_000, 760_000, 420_000, 605_000]);
/** Un tramo de $ 1 al lado de millones: se ve igual (3 px de mínimo). */
export const tramosExtremos = tramosDePrueba([9_800_000, 1, 0, 0, 1_200_000]);
export const tramosSinSaldo = tramosDePrueba([0, 0, 0, 0, 0]);
