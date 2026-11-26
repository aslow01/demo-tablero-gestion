<!-- Propio de esta demo. Lista de datos de la cabecera del comprobante. -->
<script lang="ts" module>
  /** Una fila de la lista de datos: rótulo y valor. */
  export interface ParDeDatos {
    /** Distingue la fila si el rótulo se repite. Por defecto, el rótulo. */
    clave?: string;
    rotulo: string;
    /** Texto del valor. Sin él, se dibuja lo que devuelva `celda` (un enlace, un talón…). */
    valor?: string;
    /** Valor numérico (importe): a la derecha, en la tipografía de cifras, sin partirse. */
    numerico?: boolean;
    /** Fila de total: más firme y con una línea arriba. */
    total?: boolean;
  }
</script>

<script lang="ts">
  // Pares rótulo-valor: una lista de descripción (`<dl>`), rótulo a la izquierda y valor a la derecha. Con el contenedor angosto (o el texto agrandado) cada valor baja bajo su rótulo.
  // Los valores de texto llegan hechos; los que no son texto (el cliente como enlace, un talón de comprobante) se dibujan con `celda`.
  // Es un contenedor de consultas: necesita el ancho de su caja, así que no va en un hijo que se achique al contenido.
  import type { Snippet } from "svelte";

  let {
    filas,
    celda,
  }: {
    filas: readonly ParDeDatos[];
    /** El valor de las filas que no traen `valor`. */
    celda?: Snippet<[ParDeDatos]>;
  } = $props();
</script>

<div class="caja">
  <dl class="pares">
    {#each filas as fila (fila.clave ?? fila.rotulo)}
      <dt class:total={fila.total}>{fila.rotulo}</dt>
      <dd class:total={fila.total} class:n={fila.numerico}>{#if fila.valor !== undefined}{fila.valor}{:else if celda !== undefined}{@render celda(fila)}{/if}</dd>
    {/each}
  </dl>
</div>

<style>
  .caja {
    container: pares / inline-size;
    min-width: 0;
  }
  .pares {
    display: grid;
    grid-template-columns: minmax(7rem, auto) minmax(0, 1fr);
    font-size: var(--t-medio);
  }
  dt,
  dd {
    padding-block: var(--e-2);
    border-bottom: 1px solid var(--c-borde);
  }
  /* El rótulo se estira con la fila (así su línea inferior continúa la del valor aunque el valor ocupe dos renglones) y baja 2 px para quedar a la altura del texto del valor. */
  dt {
    padding-top: calc(var(--e-2) + 0.125rem);
    padding-right: var(--e-3);
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 650;
  }
  dd {
    min-width: 0;
  }
  dd.n {
    font-family: var(--t-familia-cifra);
    font-stretch: var(--t-ancho-seccion);
    font-weight: var(--t-peso-cifra);
    font-variant-numeric: tabular-nums lining-nums;
    letter-spacing: 0.01em;
    text-align: right;
    white-space: nowrap;
  }
  .total {
    border-top: 1.5px solid var(--c-borde-fuerte);
    font-weight: 750;
  }
  dt.total {
    color: var(--c-texto);
  }
  dt:last-of-type,
  dd:last-of-type {
    border-bottom: 0;
  }

  /* Angosto: el valor baja bajo su rótulo; la línea separa cada par, no cada renglón. */
  @container pares (max-width: 16.99rem) {
    .pares {
      grid-template-columns: minmax(0, 1fr);
    }
    dt {
      padding-top: var(--e-2);
      padding-bottom: 0;
      border-bottom: 0;
    }
    dd {
      padding-top: var(--e-1);
    }
    dd.n {
      text-align: left;
    }
    dt.total {
      border-top: 1.5px solid var(--c-borde-fuerte);
    }
    dd.total {
      border-top: 0;
    }
  }
</style>
