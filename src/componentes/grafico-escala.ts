// Geometría del gráfico de 12 meses (docs/diseno-ui.md, 5.10): escala del eje, posición de cada barra y rótulos de mes.
// Funciones puras, sin DOM ni Svelte: `GraficoMeses.svelte` solo las llama y dibuja lo que devuelven.
// Los importes llegan en centavos enteros (`Centavos` es un `number`); acá solo se mide y se posiciona, nunca se suma dinero. Los píxeles sí
// son decimales. Ninguna cifra del gráfico está escrita acá: todo sale de los datos que recibe.

/** Lugares del eje: el gráfico siempre tiene 12 lugares de mes, aunque haya menos meses con datos (se alinean a la derecha). */
export const MESES_EN_EJE = 12;

/** El paso más chico del eje: 10 000 pesos (10^6 centavos). Evita un eje de centavos si todo es casi 0. */
const PASO_MINIMO = 1_000_000;
/** Un millón de pesos en centavos: la unidad del eje (el subtítulo dice «en millones de pesos»). */
const MILLON = 100_000_000;
/** Como mucho 4 intervalos (5 marcas) entre el mínimo y el máximo del eje. */
const MAX_INTERVALOS = 4;
/** Letra (en veces su tamaño) que tiene que caber en el ancho de un grupo para escribir el mes abreviado en lugar de la inicial. */
const FACTOR_DE_INICIAL = 2.25;
/** Letra sola (la inicial) más un respiro: lo que tiene que caber en el grupo para escribir cada mes. */
const FACTOR_DE_LETRA_SOLA = 1.2;

export interface Escala {
  /** Salto entre marcas, en centavos (1, 2 o 5 × 10^n). */
  paso: number;
  /** Valor de la marca más baja (0 si no hay negativos; si los hay, el múltiplo del paso siguiente por debajo). */
  minimo: number;
  /** Valor de la marca más alta (siempre múltiplo del paso y ≥ 1 paso). */
  maximo: number;
  /** Todas las marcas, de menor a mayor; incluye siempre el 0. */
  marcas: number[];
}

/**
 * Eje de importes: empieza en 0 (o más abajo si hay negativos), con marcas «redondas» (1, 2 o 5 × 10^n) y entre 3 y 5 marcas (2 a 4
 * intervalos). Elige el paso más chico que deja el máximo y el mínimo dentro de 4 intervalos. Sin datos o todo en 0: de 0 a 1 (millón), para que el
 * eje nunca tenga alto 0.
 */
export function escalaDeImportes(valores: readonly number[]): Escala {
  let alto = 0;
  let bajo = 0;
  for (const v of valores) {
    if (v > alto) alto = v;
    if (v < bajo) bajo = v;
  }
  if (alto === 0 && bajo === 0) return armar(MILLON, 1, 0);
  for (let exponente = Math.log10(PASO_MINIMO); exponente <= 15; exponente++) {
    for (const base of [1, 2, 5]) {
      const paso = base * 10 ** exponente;
      const arriba = Math.max(1, Math.ceil(alto / paso));
      const abajo = Math.ceil(-bajo / paso);
      if (arriba + abajo <= MAX_INTERVALOS) return armar(paso, arriba, abajo);
    }
  }
  // Inalcanzable con importes dentro del tope de `Centavos` (10^12); por si llega algo fuera de rango.
  return armar(10 ** 16, 1, 0);
}

function armar(paso: number, arriba: number, abajo: number): Escala {
  const marcas: number[] = [];
  for (let i = -abajo; i <= arriba; i++) marcas.push(i * paso === 0 ? 0 : i * paso);
  return { paso, minimo: abajo === 0 ? 0 : -abajo * paso, maximo: arriba * paso, marcas };
}

/** Rótulo de una marca en millones de pesos, sin «$» ni «M» (la unidad está en el subtítulo): «0», «5», «0,5», «−2». Enteros, sin coma flotante. */
export function rotuloDeMarca(centavos: number): string {
  if (centavos === 0) return "0";
  const negativo = centavos < 0;
  const absoluto = Math.abs(centavos);
  const enteros = Math.floor(absoluto / MILLON);
  const resto = absoluto - enteros * MILLON;
  // Hasta 8 decimales: el resto es múltiplo de 10^6 (el paso mínimo), o sea, a lo sumo 2 decimales; se recortan los ceros del final.
  const decimales = resto === 0 ? "" : `,${String(resto).padStart(8, "0").replace(/0+$/, "")}`;
  return `${negativo ? "−" : ""}${enteros}${decimales}`;
}

const MES_ABREVIADO: readonly string[] = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** `2026-10` → «oct», o «O» si el grupo es angosto (5.10: nunca rótulos inclinados). Lanza si no es `AAAA-MM`. */
export function rotuloDeMes(mes: string, inicial: boolean): string {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mes);
  if (m === null) throw new Error(`El mes «${mes}» no tiene el formato AAAA-MM.`);
  const nombre = MES_ABREVIADO[Number.parseInt(m[2] as string, 10) - 1] as string;
  return inicial ? (nombre.charAt(0).toUpperCase()) : nombre;
}

/** ¿El grupo es tan angosto que el mes va con su inicial? (ancho del grupo < 2,25 veces el tamaño de la letra). */
export function usarInicial(anchoDeGrupo: number, tamanoDeLetra: number): boolean {
  return anchoDeGrupo < FACTOR_DE_INICIAL * tamanoDeLetra;
}

/**
 * Cada cuántos meses se escribe un rótulo: 1 si hasta la inicial cabe en el grupo (1,2 veces la letra), 2 o 3 si ni siquiera (texto muy agrandado: 200 % a 360 px).
 * Se cuenta desde el último mes hacia atrás (el más nuevo siempre se escribe). Nunca se superponen ni se inclinan los rótulos (5.10, 9).
 */
export function pasoDeRotulos(anchoDeGrupo: number, tamanoDeLetra: number): number {
  for (const paso of [1, 2, 3]) if (anchoDeGrupo * paso >= FACTOR_DE_LETRA_SOLA * tamanoDeLetra) return paso;
  return 4;
}

/** ¿Se escribe el rótulo del mes `indice` de `total` con ese paso? */
export function rotuloVisible(indice: number, total: number, paso: number): boolean {
  return (total - 1 - indice) % paso === 0;
}

/**
 * Qué años se escriben debajo del eje: los que tienen `conAnio` y no se pisan con otro (el rótulo mide `anchoDeAnio`). Si dos chocan, queda el más nuevo.
 * `centros[i]` es el centro del grupo `i` y `conAnio[i]` dice si le toca un año.
 */
export function aniosVisibles(centros: readonly number[], conAnio: readonly boolean[], anchoDeAnio: number): boolean[] {
  const visibles = conAnio.map(() => false);
  let ultimo = Number.POSITIVE_INFINITY;
  for (let i = centros.length - 1; i >= 0; i--) {
    if (conAnio[i] !== true) continue;
    const centro = centros[i] as number;
    if (ultimo - centro >= anchoDeAnio) {
      visibles[i] = true;
      ultimo = centro;
    } else if (ultimo === Number.POSITIVE_INFINITY) {
      visibles[i] = true;
      ultimo = centro;
    }
  }
  return visibles;
}

export interface BarraDibujada {
  /** Índice del mes entre los recibidos (0 = el más viejo). */
  mes: number;
  /** Índice de la serie (0 = facturado, a la izquierda). */
  serie: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface MarcaDibujada {
  valor: number;
  y: number;
  texto: string;
  /** `true` solo en la marca del 0 (línea más marcada). */
  cero: boolean;
}

export interface GrupoDibujado {
  mes: number;
  /** Borde izquierdo del grupo. */
  x: number;
  /** Centro del grupo. */
  centro: number;
  /** Primer mes de un año o primer mes que se dibuja (lleva el año debajo). */
  conAnio: boolean;
}

export interface Medidas {
  /** Ancho del SVG en píxeles (el del contenedor). */
  ancho: number;
  /** Alto del SVG en píxeles. */
  alto: number;
  izquierda: number;
  derecha: number;
  superior: number;
  inferior: number;
}

export interface Disposicion {
  escala: Escala;
  /** Ordenada de la línea de 0. */
  y0: number;
  /** Borde superior e inferior del área de barras. */
  arriba: number;
  abajo: number;
  /** Ancho de un lugar de mes (el ancho útil ÷ 12). */
  ancho: number;
  grupos: GrupoDibujado[];
  barras: BarraDibujada[];
  marcas: MarcaDibujada[];
}

/** Fracción del grupo que ocupa cada barra: 38 % con dos series, 60 % con una (5.10). */
function fraccionDeBarra(series: number): number {
  return series === 1 ? 0.6 : 0.38;
}

const SEPARACION_ENTRE_BARRAS = 2;

/**
 * Posición de todo lo que se dibuja. `valores[i][j]` es el importe del mes `i` (de más viejo a más nuevo, hasta 12) en la serie `j`, en centavos.
 * Los meses ocupan los últimos lugares del eje (`MESES_EN_EJE - meses.length` libres a la izquierda): con menos de 12 no se estiran.
 * - El eje empieza en 0; un valor negativo hace que baje hasta la marca redonda siguiente y su barra cuelga de la línea de 0.
 * - Un valor distinto de 0 que mediría menos de 1 px se dibuja de 1 px. Un valor 0 no dibuja barra.
 */
export function disponerGrafico(valores: readonly (readonly number[])[], meses: readonly string[], medidas: Medidas): Disposicion {
  if (valores.length !== meses.length) throw new Error(`Hay ${valores.length} meses de valores y ${meses.length} de rótulos.`);
  if (valores.length > MESES_EN_EJE) throw new Error(`El gráfico dibuja hasta ${MESES_EN_EJE} meses (llegaron ${valores.length}).`);
  const series = valores.reduce((m, fila) => Math.max(m, fila.length), 0);
  if (series < 1 || series > 2) throw new Error(`El gráfico dibuja una o dos series (llegaron ${series}).`);
  for (const fila of valores) if (fila.length !== series) throw new Error("Todos los meses tienen que traer la misma cantidad de series.");

  const escala = escalaDeImportes(valores.flat());
  const arriba = medidas.superior;
  const abajo = Math.max(arriba + 1, medidas.alto - medidas.inferior);
  const util = Math.max(0, medidas.ancho - medidas.izquierda - medidas.derecha);
  const ancho = util / MESES_EN_EJE;
  const rango = escala.maximo - escala.minimo;
  const aY = (valor: number): number => arriba + ((escala.maximo - valor) / rango) * (abajo - arriba);
  const y0 = aY(0);

  const libres = MESES_EN_EJE - valores.length;
  const anchoBarra = ancho * fraccionDeBarra(series);
  const anchoUsado = anchoBarra * series + SEPARACION_ENTRE_BARRAS * (series - 1);
  const sangria = (ancho - anchoUsado) / 2;

  const grupos: GrupoDibujado[] = [];
  const barras: BarraDibujada[] = [];
  valores.forEach((fila, i) => {
    const x = medidas.izquierda + (libres + i) * ancho;
    const mes = meses[i] as string;
    grupos.push({ mes: i, x, centro: x + ancho / 2, conAnio: i === 0 || mes.endsWith("-01") });
    fila.forEach((valor, j) => {
      if (valor === 0) return;
      const yValor = aY(valor);
      let y = Math.min(y0, yValor);
      let alto = Math.abs(yValor - y0);
      if (alto < 1) {
        alto = 1;
        // Con menos de 1 px de alto la barra sigue naciendo en la línea de 0: positiva, hacia arriba; negativa, hacia abajo.
        y = valor > 0 ? y0 - 1 : y0;
      }
      barras.push({ mes: i, serie: j, x: x + sangria + j * (anchoBarra + SEPARACION_ENTRE_BARRAS), y, ancho: anchoBarra, alto });
    });
  });

  const marcas = escala.marcas.map((valor) => ({ valor, y: aY(valor), texto: rotuloDeMarca(valor), cero: valor === 0 }));
  return { escala, y0, arriba, abajo, ancho, grupos, barras, marcas };
}
