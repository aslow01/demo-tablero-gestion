<!-- Propio de esta demo. Escrito desde cero como componente. -->
<script lang="ts" module>
  // Tabla de datos con tres disposiciones que elige el ANCHO DE LA PROPIA TABLA (consulta de contenedor, no el de la pantalla):
  //   1. tabla completa            contenedor >= 56,25 rem
  //   2. tabla sin columnas `opcional` (su texto pasa a `textoEnLinea` de otra columna)   entre `tarjetasDesde` y 56,25 rem; los encabezados pueden partirse entre palabras
  //   3. tarjetas: cada fila es una tarjeta y cada importe lleva su rótulo visible          < `tarjetasDesde` (37,5 rem si la pantalla no dice otra cosa)
  // Los umbrales están en rem: con el texto agrandado la tabla pasa antes a tarjetas, que es lo que se quiere.
  // `tarjetasDesde`: cada tabla necesita un ancho mínimo propio para su disposición compacta (columnas y datos distintos): la de Comprobantes mide 694 px y la de Deudores 600.
  // Con un umbral único desbordaban Comprobantes, Clientes, Meses y la cuenta corriente entre unos 650 y 800 px de pantalla; con uno alto, Deudores pasaba a tarjetas a 1280 px.
  // Cómo se hace sin JavaScript: el umbral de las tarjetas se mide en un contenedor interno (`marco`, llamado `tarjetas`) al que se le resta `tarjetasDesde - 37,5` rem de
  // relleno, y la tabla se estira sobre ese relleno para ocupar toda la caja. Así el ancho de verdad no cambia, solo cuándo se pasa a tarjetas. Las pantallas que ajustan una celda
  // para tarjetas usan `@container tarjetas (width < 37.5rem)`: es la misma condición, la de esta tabla.
  //
  // Una fila puede tener una FILA DE DETALLE debajo (un recibo que se abre): `filaDeDetalle` dibuja su contenido y `abierta` dice si está abierta. El estado es de la pantalla,
  // que lo guarda por la clave de la fila: así sobrevive a reordenar y a filtrar.
  //
  // El componente no sabe de qué es la tabla: recibe columnas, filas y una pieza (`celda`) que dibuja el contenido de cada celda.
  // Así la pantalla decide qué enlaces, etiquetas y cifras van adentro (CifraEnlace, Talon, Etiqueta…) y cómo se formatean los importes.

  export interface ColumnaDeTabla<F> {
    /** Identifica la columna: `data-col` de sus celdas de importe y de su total, y clave de `total.celdas`. */
    id: string;
    /** Encabezado de la columna y, en tarjetas, el rótulo del importe. */
    titulo: string;
    /** Importe o cantidad: a la derecha, sin partir y con cifras tabulares. En tarjetas lleva su rótulo (`titulo`) a la izquierda. */
    numerica?: boolean;
    /** Texto con cifras tabulares sin alinear a la derecha (fechas). */
    cifras?: boolean;
    /**
     * Qué es la columna dentro de una tarjeta. `principal`: el nombre (la primera de ellas es el encabezado de fila, `th scope="row"`);
     * `secundaria`: línea de apoyo, más chica; `etiqueta`: estado o tramo, sin partir; `ancha`: ocupa todo el renglón.
     */
    papel?: "principal" | "secundaria" | "etiqueta" | "ancha";
    /** Se oculta por debajo de 56 rem de contenedor y en tarjetas. Su texto puede seguir visible dentro de otra columna (`textoEnLinea`). */
    opcional?: boolean;
    /** Se oculta solo en tarjetas. */
    soloTabla?: boolean;
    /** Si devuelve un número, la celda lleva `data-col` y `data-c` (centavos): es lo que cruza la prueba de cifras. `null`: celda sin cifra. */
    importe?: (fila: F) => number | null;
    /** Texto corto que se ve junto al contenido de la columna `enLineaEn` cuando esta columna está oculta (`"61 días"`). Vacío: nada. */
    textoEnLinea?: (fila: F) => string;
    enLineaEn?: string;
  }

  export interface CeldaDeTotal {
    /** El importe ya formateado. */
    texto: string;
    /** Los centavos del total (`data-c`). */
    centavos: number;
    /** Qué medida es, si el total es una medida entera (`data-m`); sin esto es solo la suma de las filas que se ven. */
    medida?: string;
    /** `data-formula`: cómo se obtiene (por ejemplo `debe-haber`). */
    formula?: string;
  }

  export interface TotalDeTabla {
    /** «Total (13 clientes)». Es el encabezado de la fila. */
    rotulo: string;
    /** Cuántas columnas ocupa el rótulo (por defecto 1). Tienen que ser columnas que no se ocultan. */
    cubre?: number;
    /** `id` del rótulo: destino de «Ir al saldo» (la fila recibe el foco por programa, `tabindex="-1"`). */
    id?: string;
    /** Total por columna (clave: `ColumnaDeTabla.id`). Las columnas sin total quedan vacías. */
    celdas: Record<string, CeldaDeTotal>;
  }

  // Cuando la tabla pasa a tarjetas deja de ser `display: table` y varios lectores de pantalla pierden la estructura: los roles van explícitos.
  const ROL = {
    tabla: { role: "table" },
    grupo: { role: "rowgroup" },
    fila: { role: "row" },
    encabezado: { role: "columnheader" },
    encabezadoDeFila: { role: "rowheader" },
    celda: { role: "cell" },
  } as const;
</script>

<script lang="ts" generics="F">
  import type { Snippet } from "svelte";

  let {
    titulo,
    tituloVisible = false,
    encabezado,
    columnas,
    filas,
    clave,
    celda,
    total,
    elegida = null,
    textoDeElegida = "",
    variante = "normal",
    vacia,
    filaDeDetalle,
    abierta,
    tarjetasDesde = 37.5,
  }: {
    /** Nombre de la tabla (el `caption`): obligatorio. Se lee siempre; se ve solo con `tituloVisible`. */
    titulo: string;
    tituloVisible?: boolean;
    /** Reemplaza al título visible (una etiqueta y una frase, por ejemplo). Si se pasa, el `caption` se ve con este contenido. */
    encabezado?: Snippet;
    columnas: ColumnaDeTabla<F>[];
    filas: F[];
    /** Identifica cada fila: el DOM de una fila que sigue estando se conserva al filtrar o buscar. */
    clave: (fila: F) => string;
    /** Dibuja el contenido de una celda. */
    celda: Snippet<[F, ColumnaDeTabla<F>]>;
    total?: TotalDeTabla;
    /** Clave de la fila a la que se vuelve (resaltada). */
    elegida?: string | null;
    /** Texto solo para lectores de pantalla que acompaña a la fila elegida («(abierto recién)»). */
    textoDeElegida?: string;
    /** `posteriores`: filas más bajas y apagadas (lo que ocurre después de la fecha de corte; clase `posteriores`). */
    variante?: "normal" | "posteriores";
    /** Se muestra en lugar de la tabla cuando no hay filas (la pantalla pone un `Vacio`). Sin esto se dibuja la tabla sin filas. */
    vacia?: Snippet;
    /** Contenido de la fila de detalle de una fila (ocupa todas las columnas, debajo de ella). Solo se dibuja si `abierta` devuelve `true` para esa fila. */
    filaDeDetalle?: Snippet<[F]>;
    /** ¿Está abierto el detalle de esta fila? Lo decide la pantalla (el botón que lo abre vive en una celda y comparte ese estado). */
    abierta?: (fila: F) => boolean;
    /** Ancho de la tabla (en rem) por debajo del cual cada fila pasa a ser una tarjeta. Por defecto 37,5; lo sube una tabla cuya disposición compacta necesita más lugar. */
    tarjetasDesde?: number;
  } = $props();

  const columnaDeEncabezado = $derived(columnas.find((c) => c.papel === "principal")?.id);
  const cubre = $derived(Math.max(1, total?.cubre ?? 1));
  /** Lo que se le suma al umbral de las tarjetas, en rem (nunca baja de 37,5: es el piso de la especificación). */
  const extra = $derived(Math.max(0, tarjetasDesde - 37.5));
  const cantidadDeTotales = $derived(total ? Object.keys(total.celdas).length : 0);
</script>

<!-- Sin espacios entre los bloques: una celda sin contenido tiene que quedar sin ningún nodo de texto, para que `td:empty` la reconozca (en tarjetas se oculta). -->
{#snippet interior(fila: F, c: ColumnaDeTabla<F>, conAviso: boolean)}{@render celda(fila, c)}{#if conAviso && textoDeElegida !== ""}<span class="solo-lectores"> {textoDeElegida}</span>{/if}{#each columnas as otra (otra.id)}{#if otra.enLineaEn === c.id}{@const texto = otra.textoEnLinea?.(fila) ?? ""}{#if texto !== ""}<span class="en-linea">{texto}</span>{/if}{/if}{/each}{/snippet}

{#if filas.length === 0 && vacia !== undefined}
  {@render vacia()}
{:else}
  <div class="caja" style:--tarjetas-extra="{extra}rem">
    <div class="marco">
    <table class:posteriores={variante === "posteriores"} {...ROL.tabla}>
      <caption class:solo-lectores={!tituloVisible && encabezado === undefined} class:libre={encabezado !== undefined}>
        {#if encabezado !== undefined}{@render encabezado()}{:else}{titulo}{/if}
      </caption>
      <thead {...ROL.grupo}>
        <tr {...ROL.fila}>
          {#each columnas as c (c.id)}
            <th
              scope="col"
              {...ROL.encabezado}
              class:numerica={c.numerica}
              class:opcional={c.opcional}
              class:solo-tabla={c.soloTabla}>{c.titulo}</th
            >
          {/each}
        </tr>
      </thead>
      <tbody {...ROL.grupo}>
        {#each filas as fila (clave(fila))}
          {@const k = clave(fila)}
          {@const esElegida = k === elegida}
          {@const conDetalle = filaDeDetalle !== undefined && abierta?.(fila) === true}
          <tr {...ROL.fila} class:elegida={esElegida} class:con-detalle={conDetalle} data-fila={k}>
            {#each columnas as c (c.id)}
              {@const cifra = c.importe?.(fila) ?? null}
              {#if c.id === columnaDeEncabezado}
                <th
                  scope="row"
                  {...ROL.encabezadoDeFila}
                  class="principal"
                  class:opcional={c.opcional}
                  class:solo-tabla={c.soloTabla}>{@render interior(fila, c, esElegida)}</th
                >
              {:else}
                <td
                  {...ROL.celda}
                  class:numerica={c.numerica}
                  class:cifras={c.cifras}
                  class:principal={c.papel === "principal"}
                  class:secundaria={c.papel === "secundaria"}
                  class:etiqueta={c.papel === "etiqueta"}
                  class:ancha={c.papel === "ancha"}
                  class:opcional={c.opcional}
                  class:solo-tabla={c.soloTabla}
                  data-etiqueta={c.numerica ? c.titulo : undefined}
                  data-col={cifra !== null ? c.id : undefined}
                  data-c={cifra ?? undefined}>{@render interior(fila, c, false)}</td
                >
              {/if}
            {/each}
          </tr>
          {#if conDetalle && filaDeDetalle !== undefined}
            <tr {...ROL.fila} class="detalle" data-detalle-de={k}>
              <td {...ROL.celda} colspan={columnas.length}>{@render filaDeDetalle(fila)}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
      {#if total !== undefined}
        <tfoot {...ROL.grupo}>
          <tr {...ROL.fila} class:varios={cantidadDeTotales > 1}>
            <th
              scope="row"
              {...ROL.encabezadoDeFila}
              colspan={cubre > 1 ? cubre : undefined}
              id={total.id}
              tabindex={total.id !== undefined ? -1 : undefined}>{total.rotulo}</th
            >
            {#each columnas.slice(cubre) as c (c.id)}
              {@const t = total.celdas[c.id]}
              {#if t !== undefined}
                <td
                  {...ROL.celda}
                  class="numerica"
                  class:opcional={c.opcional}
                  class:solo-tabla={c.soloTabla}
                  data-etiqueta={c.titulo}
                  data-total={c.id}
                  data-c={t.centavos}
                  data-m={t.medida}
                  data-formula={t.formula}>{t.texto}</td
                >
              {:else}
                <td {...ROL.celda} class="sin-total" class:opcional={c.opcional} class:solo-tabla={c.soloTabla}></td>
              {/if}
            {/each}
          </tr>
        </tfoot>
      {/if}
    </table>
    </div>
  </div>
{/if}

<style>
  .caja {
    container: tabla / inline-size;
    min-width: 0;
    /* Red de seguridad: un dato que no se puede partir (una cadena larga sin espacios) desplaza la tabla en su caja en lugar de ensanchar la página. */
    overflow-x: auto;
  }
  /* El umbral de las tarjetas se mide acá, con el relleno que le resta `tarjetasDesde` a la derecha; la tabla se estira sobre ese relleno. */
  .marco {
    container: tarjetas / inline-size;
    padding-right: var(--tarjetas-extra, 0rem);
  }
  table {
    width: calc(100% + var(--tarjetas-extra, 0rem));
    margin-right: calc(var(--tarjetas-extra, 0rem) * -1);
    border-collapse: collapse;
    font-size: var(--t-tabla);
  }

  /* ---------- Título ---------- */
  caption {
    padding: 0.75rem var(--e-4) 0.375rem;
    text-align: left;
    font-size: var(--t-rotulo);
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  caption:global(.solo-lectores) {
    padding: 0;
  }
  /* El encabezado que arma la pantalla (una etiqueta y una frase) se ve como texto común, no como rótulo en mayúsculas. */
  caption.libre {
    font-size: var(--t-chico);
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
  }

  /* ---------- Celdas ---------- */
  th,
  td {
    padding: 0.5625rem 0.75rem;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--c-borde);
  }
  /* El borde de la tabla es el del panel: la primera y la última celda se sangran como el resto del panel. */
  :where(th:first-child, td:first-child) {
    padding-left: var(--e-4);
  }
  :where(th:last-child, td:last-child) {
    padding-right: var(--e-4);
  }
  /* El encabezado de fila es una `th`, pero se ve como una celda más. */
  tbody th {
    font-weight: inherit;
  }

  thead th {
    padding-block: 0.5rem;
    background: var(--c-superficie-2);
    color: var(--c-texto-2);
    font-size: var(--t-rotulo);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  tbody tr {
    transition: background-color var(--m-rapido) linear;
  }
  @media (hover: hover) {
    tbody tr:not(.detalle):hover {
      background: color-mix(in srgb, var(--c-superficie-2) 55%, var(--c-superficie));
    }
  }

  /* Importes y cantidades: la condensada de los títulos con cifras tabulares (las de la de texto son demasiado anchas). */
  td.numerica,
  td.cifras {
    font-family: var(--t-familia-cifra);
    font-stretch: var(--t-ancho-seccion);
    font-variant-numeric: tabular-nums lining-nums;
    letter-spacing: 0.01em;
  }
  td.numerica {
    font-size: var(--t-medio);
    font-weight: var(--t-peso-cifra);
  }
  .numerica {
    text-align: right;
  }
  /* Un importe no se parte; el encabezado de su columna sí puede (entre palabras) cuando la tabla es compacta: por eso el `nowrap` es solo de las celdas. */
  td.numerica {
    white-space: nowrap;
  }
  td.cifras {
    white-space: nowrap;
  }
  td.cifras:not(.numerica) {
    font-weight: 460;
  }
  td.etiqueta {
    white-space: nowrap;
  }
  /* Un código (número de comprobante o de recibo) no se parte en la tabla. */
  td :global(.codigo),
  th :global(.codigo) {
    white-space: nowrap;
  }

  /* Nombre: un enlace sencillo se ve como texto firme y subrayado fino (las piezas con su propio aspecto, como el talón o la cifra-enlace, no). */
  .principal :global(a:not([class*="talon"]):not([class*="cifra"])) {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem; /* objetivo de 24 px (2.5.8); el margen negativo devuelve a la fila lo que suma, así su altura no cambia */
    max-width: 100%;
    margin-block: -0.125rem;
    color: var(--c-texto);
    font-weight: 650;
    text-decoration: underline 1px var(--c-borde-fuerte);
    text-underline-offset: 3px;
  }
  @media (hover: hover) {
    .principal :global(a:not([class*="talon"]):not([class*="cifra"]):hover) {
      text-decoration-color: var(--c-enlace);
      text-decoration-thickness: 2px;
    }
  }
  /* Ayudas de contenido que la pantalla puede poner dentro de una celda. */
  td :global(.sec),
  th :global(.sec) {
    display: block;
    margin-top: 0.125rem;
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 400;
  }
  td :global(.suave) {
    color: var(--c-texto-3);
  }
  .en-linea {
    display: none;
  }

  /* ---------- Fila de detalle (un recibo abierto): todo el ancho, sobre el fondo de la página, pegada a su fila ---------- */
  tr.con-detalle > :is(th, td) {
    border-bottom-color: transparent;
  }
  tr.detalle > td {
    padding: 0 var(--e-4) var(--e-3);
    background: var(--c-fondo);
  }
  @media (hover: hover) {
    tbody tr.detalle:hover {
      background: none;
    }
  }

  /* ---------- Fila elegida (a la que se vuelve) ---------- */
  tr.elegida {
    background: var(--c-acento-suave);
  }
  tr.elegida > :first-child {
    box-shadow: inset 4px 0 0 var(--c-tinta);
  }
  @media (hover: hover) {
    tbody tr.elegida:hover {
      background: var(--c-acento-suave);
    }
  }

  /* ---------- Fila de total ---------- */
  tfoot th,
  tfoot td {
    border-top: 1.5px solid var(--c-borde-fuerte);
    border-bottom: 0;
    background: var(--c-superficie);
    font-weight: 750;
  }
  tfoot th {
    font-size: var(--t-rotulo);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-texto-2);
  }
  tfoot td.numerica {
    font-weight: 750;
  }
  tfoot th:focus-visible {
    outline-offset: -3px;
  }

  /* ---------- Después de la fecha de corte: más bajas y apagadas, no deshabilitadas ---------- */
  table.posteriores {
    margin-top: var(--e-2);
  }
  table.posteriores tbody tr {
    background: var(--c-fondo);
  }
  table.posteriores td,
  table.posteriores tbody th {
    color: var(--c-texto-2);
  }

  /* ---------- Contenedor mediano: sin las columnas opcionales ---------- */
  @container tabla (width < 56.25rem) {
    .opcional {
      display: none !important;
    }
    /* Sin las columnas opcionales y con los encabezados partidos entre palabras (nunca dentro de una) entran todas las tablas desde el umbral de las tarjetas. */
    thead th {
      white-space: normal;
    }
    .en-linea {
      display: inline;
      margin-left: 0.375rem;
      color: var(--c-texto-2);
      font-size: var(--t-chico);
      font-weight: 400;
    }
  }

  /* ---------- Contenedor angosto: tarjetas ---------- */
  @container tarjetas (width < 37.5rem) {
    table,
    tbody,
    tfoot {
      display: block;
    }
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    caption {
      display: block;
    }
    tr {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.25rem;
      padding: 0.75rem var(--e-4);
      border-bottom: 1px solid var(--c-borde);
    }
    tr th,
    tr td {
      display: block;
      padding: 0;
      border: 0;
    }
    .principal,
    .secundaria {
      overflow-wrap: anywhere;
    }
    .secundaria {
      color: var(--c-texto-2);
      font-size: var(--t-chico);
    }
    td.cifras,
    td.etiqueta,
    td :global(.codigo),
    th :global(.codigo) {
      white-space: normal;
    }
    /* Las etiquetas de una celda se acomodan en más de un renglón si no entran (texto agrandado). */
    td.etiqueta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--e-1) var(--e-2);
    }
    /* Importe: rótulo a la izquierda, cifra a la derecha. Con el texto agrandado no caben en un renglón: la cifra baja, sigue a la derecha y no se parte. */
    td.numerica {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: baseline;
      gap: 0 var(--e-3);
    }
    td.numerica::before {
      margin-right: auto;
      content: attr(data-etiqueta);
      color: var(--c-texto-2);
      font-family: var(--t-familia);
      font-stretch: normal;
      font-size: var(--t-chico);
      font-weight: 600;
      white-space: normal;
    }
    td:empty,
    .solo-tabla,
    .opcional {
      display: none !important;
    }
    .en-linea {
      display: inline;
    }
    /* Total: el rótulo y la cifra en un renglón; con más de un total, uno por renglón y con su rótulo. */
    tfoot tr {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: baseline;
      gap: 0 var(--e-3);
      padding: 0.75rem var(--e-4) 0.875rem;
      border-top: 1.5px solid var(--c-borde-fuerte);
      border-bottom: 0;
    }
    tfoot tr th,
    tfoot tr td {
      border-top: 0;
    }
    tfoot tr th {
      margin-right: auto;
    }
    tfoot td.numerica {
      display: block;
      font-size: var(--t-cuerpo);
    }
    tfoot tr.varios td.numerica {
      font-size: var(--t-medio);
    }
    tfoot td.numerica::before {
      display: none;
    }
    tfoot td.sin-total {
      display: none;
    }
    tfoot tr.varios {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
    }
    tfoot tr.varios td.numerica {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: baseline;
      gap: 0 var(--e-3);
    }
    tfoot tr.varios td.numerica::before {
      display: block;
    }
    tfoot tr.varios th {
      margin-right: 0;
    }
    tr.elegida {
      box-shadow: inset 4px 0 0 var(--c-tinta);
    }
    tr.elegida > :first-child {
      box-shadow: none;
    }
    /* El detalle de una tarjeta es la continuación de la tarjeta: sin su propia línea de arriba ni relleno doble. */
    tr.con-detalle {
      padding-bottom: 0.25rem;
      border-bottom-color: transparent;
    }
    tr.detalle {
      display: block;
      padding: 0 0 var(--e-1);
    }
    tr.detalle > td {
      padding: 0 var(--e-4) var(--e-3);
    }
  }

  @media (forced-colors: active) {
    tr.elegida {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }
</style>
