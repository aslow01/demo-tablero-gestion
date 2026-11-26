// Lo que comparten el gráfico de 12 meses del Resumen y la página Meses: las cuatro columnas de importes (con su medida), la serie del gráfico, el renglón del mes
// del corte y la tabla equivalente. Todo sale de `VistaMeses` (`src/lib/vistas/meses.ts`): acá no hay aritmética ni textos propios.

import type { SerieDelGrafico, MesDelGrafico, RenglonDeCorte, TablaDelGrafico } from "../../componentes/tipos-graficos.ts";
import { TEXTO_GRAFICO, TEXTO_MESES, TEXTO_RESUMEN } from "../../componentes/textos-marco.ts";
import { formatearImporte } from "../../lib/dominio/dinero.ts";
import type { Centavos } from "../../lib/dominio/dinero.ts";
import { nombreDelMesCapitalizado } from "../../lib/dominio/textos.ts";
import type { ClaveDeMedida } from "../../lib/dominio/tipos.ts";
import type { MesDeLaEmpresa, VistaMeses } from "../../lib/vistas/meses.ts";
import { etiquetaDelGraficoDeMeses } from "../../lib/vistas/rotulos.ts";

/** Las cuatro columnas de importes de los meses, en el orden de la tabla: `id` es el `data-col`, `clave` la medida a la que lleva cada cifra. */
export const COLUMNAS_DE_MESES = [
  { id: "fa", clave: "facturacion-mes", titulo: TEXTO_MESES.facturacionSinIva },
  { id: "fi", clave: "facturado-con-iva-mes", titulo: TEXTO_MESES.facturadoConIva },
  { id: "co", clave: "cobranza-mes", titulo: TEXTO_MESES.cobrado },
  { id: "re", clave: "retenciones-mes", titulo: TEXTO_MESES.deLoCualRetenciones },
] as const satisfies readonly { id: string; clave: ClaveDeMedida; titulo: string }[];

export type IdDeColumnaDeMeses = (typeof COLUMNAS_DE_MESES)[number]["id"];

/** El importe de un mes en una columna. */
export function importeDelMes(m: MesDeLaEmpresa, columna: IdDeColumnaDeMeses): Centavos {
  switch (columna) {
    case "fa":
      return m.facturacion.importe;
    case "fi":
      return m.facturadoConIva.importe;
    case "co":
      return m.cobranza.importe;
    case "re":
      return m.retenciones.importe;
  }
}

/** Los cuatro importes de un mes, en el orden de `COLUMNAS_DE_MESES`. */
export function importesDelMes(m: MesDeLaEmpresa): Centavos[] {
  return COLUMNAS_DE_MESES.map((c) => importeDelMes(m, c.id));
}

/** El total de una columna (X6: la suma de sus doce meses). */
export function totalDeMeses(v: VistaMeses, columna: IdDeColumnaDeMeses): Centavos {
  switch (columna) {
    case "fa":
      return v.totales.facturacion;
    case "fi":
      return v.totales.facturadoConIva;
    case "co":
      return v.totales.cobranza;
    case "re":
      return v.totales.retenciones;
  }
}

/** Los cuatro totales, en el orden de `COLUMNAS_DE_MESES`. */
export function totalesDeMeses(v: VistaMeses): Centavos[] {
  return COLUMNAS_DE_MESES.map((c) => totalDeMeses(v, c.id));
}

/** «Mayo de 2026»: el rótulo de la fila de un mes. */
export const rotuloDeMes = nombreDelMesCapitalizado;

export const SERIES_DEL_GRAFICO: readonly SerieDelGrafico[] = [
  { rotulo: TEXTO_GRAFICO.serieFacturado, clase: "facturado" },
  { rotulo: TEXTO_GRAFICO.serieCobrado, clase: "cobrado" },
];

/** Los meses del gráfico: facturado con IVA y cobrado (la cobranza incluye el IVA). */
export function mesesDelGrafico(v: VistaMeses): MesDelGrafico[] {
  return v.meses.map((m) => ({ mes: m.mes, valores: [m.facturadoConIva.importe, m.cobranza.importe] }));
}

/** El `aria-label` del gráfico. */
export function ariaLabelDelGrafico(v: VistaMeses): string {
  return etiquetaDelGraficoDeMeses(v);
}

/** «Hay datos desde enero de 2025.» solo si hay menos de doce meses. */
export function avisoDesde(v: VistaMeses): string | undefined {
  return v.completa ? undefined : TEXTO_GRAFICO.hayDatosDesde(v.desde);
}

/** El renglón del mes del corte entero: «Octubre de 2026: facturado $ … · cobrado $ …». */
export function renglonDelMesDelCorte(v: VistaMeses): string {
  const ultimo = v.meses.at(-1);
  if (ultimo === undefined) throw new Error("Error interno: el gráfico de meses no tiene ningún mes.");
  return TEXTO_GRAFICO.renglonDelMes(ultimo.mes, formatearImporte(ultimo.facturadoConIva.importe), formatearImporte(ultimo.cobranza.importe));
}

/** El mismo renglón con el mes en negrita: el título («Octubre de 2026:») y el resto. */
export function renglonResaltado(v: VistaMeses): RenglonDeCorte {
  const texto = renglonDelMesDelCorte(v);
  const corte = texto.indexOf(": ");
  return corte < 0 ? texto : { titulo: texto.slice(0, corte + 1), texto: texto.slice(corte + 2) };
}

/** La tabla equivalente que el gráfico del Resumen lleva adentro («Ver los 12 meses como tabla»). */
export function tablaDelGrafico(v: VistaMeses): TablaDelGrafico {
  return {
    titulo: TEXTO_RESUMEN.graficoTitulo(v.meses.length),
    columnas: COLUMNAS_DE_MESES.map((c) => c.titulo),
    claves: COLUMNAS_DE_MESES.map((c) => c.id),
    filas: v.meses.map((m) => ({ mes: m.mes, rotulo: rotuloDeMes(m.mes), importes: importesDelMes(m) })),
    total: { rotulo: TEXTO_MESES.totalDeLosMeses(v.meses.length), importes: totalesDeMeses(v) },
  };
}
