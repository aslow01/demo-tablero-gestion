<!-- Propio de esta demo (docs/diseno-ui.md, 5.10). Escrito desde cero para esta demo: SVG propio, sin biblioteca.
     Dos alturas (`alto` para la página Meses), tabla equivalente opcional (la página Meses la muestra aparte, en otro panel),
     renglón del mes de corte con el mes resaltado y fila del mes de corte marcada en la tabla. -->
<script lang="ts">
  // 5.10 Gráfico de barras de 12 meses, en SVG propio, con su tabla equivalente ("Ver los 12 meses como tabla", un `details` nativo).
  // Recibe todo por propiedades y no escribe ninguna cifra: ni los importes, ni los rótulos, ni las frases (el `aria-label` y el renglón del mes de
  // corte los arma la lógica). La geometría (escala del eje, posición de cada barra, rótulos de mes) está en `grafico-escala.ts`, con tests.
  // Accesible sin color: cada serie se distingue por su posición fija en el grupo (facturado a la izquierda, cobrado a la derecha), por el relleno (Facturado liso, Cobrado con trama
  // diagonal y ribete, también en la leyenda), por 2 px de aire entre las dos barras y por la leyenda escrita; los 12 valores están
  // en la tabla equivalente (en este componente o, si la pantalla ya la muestra aparte, en su propio panel) y el SVG tiene `role="img"` con un resumen.
  // CSP: el SVG se dibuja con atributos (`x`, `y`, `width`, `height`); nada de `style="…"`. El color de cada serie va por clase.
  import type { Snippet } from "svelte";
  import { formatearImporte } from "../lib/dominio/dinero.ts";
  import { nombreDelMes } from "../lib/dominio/textos.ts";
  import { aniosVisibles, disponerGrafico, pasoDeRotulos, rotuloDeMes, rotuloVisible, usarInicial } from "./grafico-escala.ts";
  import Icono from "./Icono.svelte";
  import type { AltoDelGrafico, CeldaDeImporte, MesDelGrafico, RenglonDeCorte, SerieDelGrafico, TablaDelGrafico } from "./tipos-graficos.ts";

  let {
    subtitulo,
    series,
    meses,
    mesDeCorte,
    ariaLabel,
    renglonDeCorte,
    avisoDesde,
    tabla,
    textoDeTabla,
    celda,
    alto = "normal",
  }: {
    /** Unidad y aclaración: "En millones de pesos, con IVA." */
    subtitulo: string;
    /** Una o dos series. */
    series: readonly SerieDelGrafico[];
    /** Hasta 12 meses; con menos, se dibujan los que hay, alineados a la derecha. */
    meses: readonly MesDelGrafico[];
    /** `AAAA-MM` del mes de corte: banda detrás y rótulo en negrita. Si no está entre los meses, no hay banda. */
    mesDeCorte: string;
    /** Resumen corto para lectores de pantalla (lo arma la lógica; no lleva los 24 importes). */
    ariaLabel: string;
    /** "Octubre de 2026: facturado $ … · cobrado $ …" (lo arma la lógica), o `{ titulo, texto }` para resaltar el mes. */
    renglonDeCorte?: RenglonDeCorte;
    /** "Hay datos desde enero de 2025." Solo con menos de 12 meses. */
    avisoDesde?: string;
    /** La tabla equivalente, dentro del componente. Sin ella no hay `details`: la pantalla muestra la tabla en otro lugar. */
    tabla?: TablaDelGrafico;
    /** Texto del `summary`; por defecto "Ver los N meses como tabla". */
    textoDeTabla?: string;
    /** Contenido de cada celda de importe de la tabla (por defecto, el importe formateado). */
    celda?: Snippet<[CeldaDeImporte]>;
    /** `alto` es el de la página Meses (el gráfico es lo principal). */
    alto?: AltoDelGrafico;
  } = $props();

  // Tamaños medidos: el SVG mide lo mismo que su envoltorio, en píxeles reales, para que el texto no se escale con el dibujo.
  // `rem` es el tamaño de la letra base en píxeles (una caja invisible de 1rem), así los márgenes acompañan al texto agrandado.
  // Cobrado se distingue de Facturado sin depender del color (1.4.1, 1.4.11): trama diagonal y ribete. Lado del mosaico de la trama y grosor del ribete, en píxeles.
  const TRAMA = 4;
  const RIBETE = 1.5;
  const uid = $props.id();

  let anchoLienzo = $state(0);
  let altoLienzo = $state(0);
  let rem = $state(16);

  const tamanoDeLetra = $derived(0.8125 * rem);
  const medidas = $derived({
    ancho: anchoLienzo,
    alto: altoLienzo,
    izquierda: 2.5 * rem,
    derecha: 0.25 * rem,
    superior: 0.5 * rem,
    inferior: 2.5 * rem,
  });
  const disposicion = $derived(
    disponerGrafico(
      meses.map((m) => m.valores),
      meses.map((m) => m.mes),
      medidas,
    ),
  );
  const inicial = $derived(usarInicial(disposicion.ancho, tamanoDeLetra));
  const paso = $derived(pasoDeRotulos(disposicion.ancho, tamanoDeLetra));
  const anios = $derived(
    aniosVisibles(
      disposicion.grupos.map((g) => g.centro),
      disposicion.grupos.map((g) => g.conAnio),
      2.6 * tamanoDeLetra,
    ),
  );
  const posicionDeCorte = $derived(meses.findIndex((m) => m.mes === mesDeCorte));
  const grupoDeCorte = $derived(posicionDeCorte < 0 ? undefined : disposicion.grupos[posicionDeCorte]);

  const resumen = $derived(textoDeTabla ?? (meses.length === 1 ? "Ver el mes como tabla" : `Ver los ${meses.length} meses como tabla`));
  const anioDe = (mes: string): string => mes.slice(0, 4);
  const renglon = $derived(typeof renglonDeCorte === "string" || renglonDeCorte === undefined ? { titulo: "", texto: renglonDeCorte ?? "" } : renglonDeCorte);
  /** El nombre del mes de una fila de la tabla, con mayúscula inicial (como se lee en una lista). */
  const nombreDeFila = (mes: string): string => {
    const nombre = nombreDelMes(mes);
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  };
</script>

<figure class="grafico">
  <figcaption>
    <p class="subtitulo">{subtitulo}</p>
    <ul class="leyenda">
      {#each series as serie (serie.clase)}
        <li><span class="muestra serie-{serie.clase}" aria-hidden="true"></span>{serie.rotulo}</li>
      {/each}
    </ul>
    {#if renglon.texto !== "" || renglon.titulo !== ""}
      <p class="corte">{#if renglon.titulo !== ""}<b>{renglon.titulo}</b>{" "}{/if}{renglon.texto}</p>
    {/if}
    {#if avisoDesde !== undefined && avisoDesde !== ""}
      <p class="nota">{avisoDesde}</p>
    {/if}
  </figcaption>

  <div class="lienzo" class:alto={alto === "alto"} bind:clientWidth={anchoLienzo} bind:clientHeight={altoLienzo}>
    <span class="sonda-rem" aria-hidden="true" bind:clientWidth={rem}></span>
    {#if anchoLienzo > 0 && altoLienzo > 0}
      <svg class="svg" width={anchoLienzo} height={altoLienzo} viewBox="0 0 {anchoLienzo} {altoLienzo}" role="img" aria-label={ariaLabel}>
        {#if grupoDeCorte !== undefined}
          <rect class="banda" x={grupoDeCorte.x} y={disposicion.arriba} width={disposicion.ancho} height={disposicion.abajo - disposicion.arriba} />
        {/if}
        {#each disposicion.marcas as marca (marca.valor)}
          <line class="grilla" class:cero={marca.cero} x1={medidas.izquierda} x2={anchoLienzo - medidas.derecha} y1={marca.y} y2={marca.y} />
        {/each}
        <defs>
          <pattern id="{uid}-trama" width={TRAMA} height={TRAMA} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line class="trama-linea" x1={TRAMA / 4} y1="0" x2={TRAMA / 4} y2={TRAMA} stroke-width={TRAMA / 2} />
          </pattern>
        </defs>
        {#each disposicion.barras as barra (`${barra.mes}-${barra.serie}`)}
          {#if series[barra.serie]?.clase === "cobrado" && barra.ancho > 2 * RIBETE + 1 && barra.alto > 2 * RIBETE + 1}
            <!-- Cobrado: trama y ribete. El ribete se dibuja hacia adentro de la barra para que los 2 px que la separan de Facturado sigan siendo 2 px. -->
            <rect
              class="barra trama"
              fill="url(#{uid}-trama)"
              x={barra.x + RIBETE / 2}
              y={barra.y + RIBETE / 2}
              width={barra.ancho - RIBETE}
              height={barra.alto - RIBETE}
            />
          {:else}
            <rect class="barra serie-{series[barra.serie]?.clase}" x={barra.x} y={barra.y} width={barra.ancho} height={barra.alto} />
          {/if}
        {/each}
        <g aria-hidden="true">
          {#each disposicion.marcas as marca (marca.valor)}
            <text class="rotulo-eje" x={medidas.izquierda - 0.5 * rem} y={marca.y} text-anchor="end" dominant-baseline="central">{marca.texto}</text>
          {/each}
          {#each disposicion.grupos as grupo (grupo.mes)}
            {@const mes = meses[grupo.mes]?.mes ?? ""}
            {#if rotuloVisible(grupo.mes, meses.length, paso)}
              <text class="rotulo-mes" class:de-corte={mes === mesDeCorte} x={grupo.centro} y={disposicion.abajo + 1.15 * rem} text-anchor="middle">{rotuloDeMes(mes, inicial)}</text>
            {/if}
            {#if anios[grupo.mes]}
              <text class="rotulo-anio" x={grupo.centro} y={disposicion.abajo + 2.15 * rem} text-anchor="middle">{anioDe(mes)}</text>
            {/if}
          {/each}
        </g>
      </svg>
    {/if}
  </div>

  {#if tabla !== undefined}
    <details class="ver-tabla">
      <summary><Icono nombre="chevron" /><span>{resumen}</span></summary>
      <div class="contenedor-tabla">
        <!-- Los roles explícitos son a propósito: en tarjetas (< 40rem) la tabla pasa a `display: block` y sin ellos los lectores de pantalla pierden la estructura (5.9). -->
        <!-- svelte-ignore a11y_no_redundant_roles -->
        <table role="table">
          <caption class="solo-lectores">{tabla.titulo}</caption>
          <!-- svelte-ignore a11y_no_redundant_roles -->
          <thead role="rowgroup">
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <tr role="row">
              <th role="columnheader" scope="col" class="rotulo">Mes</th>
              {#each tabla.columnas as columna (columna)}
                <th role="columnheader" scope="col" class="rotulo importe">{columna}</th>
              {/each}
            </tr>
          </thead>
          <!-- svelte-ignore a11y_no_redundant_roles -->
          <tbody role="rowgroup">
            {#each tabla.filas as fila (fila.mes)}
              <!-- svelte-ignore a11y_no_redundant_roles -->
              <tr role="row" class:elegida={fila.mes === mesDeCorte} aria-current={fila.mes === mesDeCorte ? "true" : undefined}>
                <th role="rowheader" scope="row" class="mes">{fila.rotulo ?? nombreDeFila(fila.mes)}</th>
                {#each fila.importes as importe, columna (columna)}
                  <td role="cell" class="importe num" data-etiqueta={tabla.columnas[columna]} data-col={tabla.claves?.[columna]} data-c={importe}>
                    {#if celda !== undefined}{@render celda({ mes: fila.mes, columna, importe })}{:else}{formatearImporte(importe)}{/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
          {#if tabla.total !== undefined}
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <tfoot role="rowgroup">
              <!-- svelte-ignore a11y_no_redundant_roles -->
              <tr role="row">
                <th role="rowheader" scope="row" class="mes">{tabla.total.rotulo}</th>
                {#each tabla.total.importes as importe, columna (columna)}
                  <td role="cell" class="importe num" data-etiqueta={tabla.columnas[columna]} data-total={tabla.claves?.[columna]} data-c={importe}>{formatearImporte(importe)}</td>
                {/each}
              </tr>
            </tfoot>
          {/if}
        </table>
      </div>
    </details>
  {/if}
</figure>

<style>
  .grafico {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
    margin: 0;
  }

  /* ---------- Subtítulo, leyenda y renglón del mes de corte (HTML, no SVG) ---------- */
  figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--e-1) var(--e-4);
  }
  .subtitulo {
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  .leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-1) var(--e-4);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto);
  }
  .leyenda li {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
  }
  .muestra {
    flex: none;
    box-sizing: border-box;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: var(--r-1);
  }
  /* La muestra de Cobrado repite la barra: trama diagonal y ribete (la leyenda no puede ser solo un cuadrito de color). */
  .muestra.serie-cobrado {
    border: 1.5px solid var(--c-serie-cobrado);
    background: repeating-linear-gradient(135deg, var(--c-serie-cobrado) 0 2px, transparent 2px 4px);
  }
  .corte {
    flex: 1 0 100%;
    margin-top: var(--e-1);
    font-size: var(--t-medio);
    line-height: 1.4;
    color: var(--c-texto);
  }
  .corte b {
    font-weight: 650;
  }
  figcaption .nota {
    flex: 1 0 100%;
  }

  /* ---------- Lienzo: 15rem (16.25rem desde 64rem); `alto`, el de la página Meses: 18.75rem (21.25rem) ---------- */
  .lienzo {
    position: relative;
    width: 100%;
    height: 15rem;
  }
  .lienzo.alto {
    height: 18.75rem;
  }
  @media (min-width: 64rem) {
    .lienzo {
      height: 16.25rem;
    }
    .lienzo.alto {
      height: 21.25rem;
    }
  }
  .sonda-rem {
    position: absolute;
    left: 0;
    top: 0;
    width: 1rem;
    height: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .svg {
    display: block;
    position: absolute;
    inset: 0;
    overflow: hidden;
    forced-color-adjust: none;
    font-family: var(--t-familia);
  }

  /* Colores por clase (nada de atributo `style`). Las barras no llevan radio, borde ni degradé. */
  .serie-facturado {
    fill: var(--c-serie-facturado);
    background: var(--c-serie-facturado);
  }
  .serie-cobrado {
    fill: var(--c-serie-cobrado);
    background: var(--c-serie-cobrado);
  }
  .banda {
    fill: var(--c-superficie-2);
  }
  .grilla {
    stroke: var(--c-borde);
    stroke-width: 1;
    shape-rendering: crispEdges;
  }
  .grilla.cero {
    stroke: var(--c-texto-2);
  }
  .barra {
    stroke: none;
  }
  /* Barra de Cobrado: el relleno es la trama (atributo `fill`); el ribete va en el color de la serie. */
  .barra.trama {
    stroke: var(--c-serie-cobrado);
    stroke-width: 1.5;
  }
  .trama-linea {
    stroke: var(--c-serie-cobrado);
  }
  .rotulo-eje,
  .rotulo-mes,
  .rotulo-anio {
    font-size: var(--t-chico);
    font-variant-numeric: tabular-nums lining-nums;
    fill: var(--c-texto-3);
  }
  .rotulo-mes.de-corte {
    font-weight: 600;
    fill: var(--c-texto);
  }

  /* ---------- Colores forzados: el SVG conserva sus colores de dato; líneas y rótulos pasan a los del sistema ---------- */
  @media (forced-colors: active) {
    .grilla,
    .grilla.cero {
      stroke: CanvasText;
    }
    .rotulo-eje,
    .rotulo-mes,
    .rotulo-anio,
    .rotulo-mes.de-corte {
      fill: CanvasText;
    }
    .banda {
      fill: Canvas;
      stroke: CanvasText;
    }
    .muestra,
    .barra {
      outline: 1px solid CanvasText;
      forced-color-adjust: none;
    }
    .barra,
    .barra.trama,
    .trama-linea {
      stroke: CanvasText;
    }
  }

  /* ---------- "Ver los 12 meses como tabla" ---------- */
  .ver-tabla {
    min-width: 0;
  }
  summary {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    width: fit-content;
    max-width: 100%;
    padding-right: var(--e-3);
    border-radius: var(--r-2);
    color: var(--c-acento);
    font-size: var(--t-tabla);
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  @media (hover: hover) {
    summary:hover {
      color: var(--c-acento-hover);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  summary :global(.icono) {
    transition: transform var(--m-rapido) var(--m-curva);
  }
  details[open] > summary :global(.icono) {
    transform: rotate(90deg);
  }

  /* ---------- Tabla equivalente: la misma estructura en tres anchos (5.9). Acá: tabla desde 40rem, tarjetas por debajo. ---------- */
  .contenedor-tabla {
    container: tabla / inline-size;
    min-width: 0;
    margin-top: var(--e-2);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-tabla);
    line-height: 1.4;
    background: var(--c-superficie);
  }
  th,
  td {
    padding: var(--e-2) var(--e-3);
    text-align: left;
    vertical-align: middle;
  }
  thead th {
    background: var(--c-superficie-2);
    color: var(--c-texto-2);
    overflow-wrap: normal;
    hyphens: manual;
    vertical-align: bottom;
  }
  tbody tr,
  tfoot tr {
    min-height: 2.75rem;
    border-bottom: 1px solid var(--c-borde);
  }
  @media (hover: hover) {
    tbody tr:hover {
      background: var(--c-superficie-2);
    }
  }
  tbody tr {
    height: 2.75rem;
  }
  /* El mes del corte: fondo de tinta suave y barra a la izquierda (además de `aria-current`, el color no va solo). */
  tbody tr.elegida,
  tbody tr.elegida:hover {
    background: var(--c-acento-suave);
    box-shadow: inset 4px 0 0 var(--c-tinta);
  }
  .mes {
    font-weight: 400;
    color: var(--c-texto);
  }
  .importe {
    text-align: right;
    white-space: nowrap;
  }
  thead .importe {
    white-space: normal;
  }
  tfoot tr {
    border-top: 1px solid var(--c-borde-fuerte);
    background: var(--c-superficie);
    height: 2.75rem;
  }
  tfoot .mes,
  tfoot td {
    font-weight: 600;
  }
  @media (forced-colors: active) {
    tfoot tr {
      border-top-color: CanvasText;
    }
  }

  /* Contenedor angosto: una tarjeta por mes. El rótulo de cada importe se ve a la izquierda (varias cifras sin rótulo no se distinguen); la cabecera queda solo para lectores. */
  @container tabla (max-width: 39.99rem) {
    table,
    tbody,
    tfoot {
      display: block;
    }
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    tbody tr,
    tfoot tr {
      display: block;
      height: auto;
      padding: var(--e-2) 0;
    }
    tbody th.mes,
    tfoot th.mes {
      display: block;
      padding-block: var(--e-1);
      font-weight: 600;
    }
    td.importe {
      display: flex;
      flex-wrap: wrap; /* con el texto muy agrandado el importe baja a su renglón en lugar de empujar la página (1.4.4, 1.4.10) */
      justify-content: flex-end;
      align-items: baseline;
      gap: var(--e-3);
      padding-block: var(--e-1);
      white-space: normal;
    }
    td.importe::before {
      content: attr(data-etiqueta);
      content: attr(data-etiqueta) / "";
      flex: 1 1 auto;
      color: var(--c-texto-2);
      font-size: var(--t-chico);
      text-align: left;
      white-space: normal;
    }
    td.importe > :global(*) {
      white-space: nowrap;
    }
  }
</style>
