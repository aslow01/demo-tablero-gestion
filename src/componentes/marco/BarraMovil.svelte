<!-- Barra de arriba del celular y la tableta (hasta 64 rem): a la izquierda la marca o, si no es una de las cuatro pantallas de las pestañas, «Atrás» con el
     nombre de la pantalla a la que vuelve; a la derecha, «Cómo se calcula» (salvo que «Atrás» ya lleve a esa pantalla). Fija arriba. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import Icono from "../Icono.svelte";
  import { ofreceAyudaEnLaBarra } from "../../lib/estado/navegacion.ts";
  import { rotuloDeAtras } from "../../lib/vistas/rotulos.ts";
  import { TEXTO_MARCO } from "../textos-marco.ts";

  let { app }: { app: AplicacionLista } = $props();

  const atras = $derived(rotuloDeAtras(app.direccion.destinoDeAtras, app.datos, app.direccion.corte));
  const enComoSeCalcula = $derived(app.direccion.ruta.tipo === "como-se-calcula");
  // Si «Atrás» ya lleva a «Cómo se calcula» (se llegó desde uno de sus ejemplos), no se repite el botón al lado.
  const ofreceAyuda = $derived(ofreceAyudaEnLaBarra(app.direccion.esRaiz, app.direccion.destinoDeAtras));
</script>

<header class="barra" data-fijo="barra-movil">
  <div class="izquierda">
    {#if app.direccion.esRaiz}
      <a class="marca" href={app.direccion.enlace({ tipo: "resumen" })} aria-label={TEXTO_MARCO.marcaCortaAccesible}>
        <Icono nombre="marca" />
        <span>{TEXTO_MARCO.marcaCorta}</span>
        <span class="demo" aria-hidden="true">{TEXTO_MARCO.marcaDemoCorta}</span>
      </a>
    {:else}
      <button type="button" class="atras" aria-label={atras.accesible} onclick={() => app.direccion.atras()}>
        <Icono nombre="atras" />
        <span class="atras-texto" aria-hidden="true">{atras.visible}</span>
      </button>
    {/if}
  </div>
  {#if ofreceAyuda}
    <a class="ayuda" href={app.direccion.enlace({ tipo: "como-se-calcula" })} aria-current={enComoSeCalcula ? "page" : undefined}>
      <Icono nombre="ayuda" />
      <span>{TEXTO_MARCO.comoSeCalcula}</span>
    </a>
  {/if}
</header>

<style>
  .barra {
    container: barra / inline-size;
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
    min-height: var(--alto-barra);
    padding: 0 calc(var(--margen) - 0.375rem) 0 var(--margen);
    background: var(--c-fondo);
    border-bottom: 1px solid var(--c-borde);
  }
  @media (min-width: 64rem) {
    .barra {
      display: none;
    }
  }
  /* Un celular apaisado no tiene alto para barras fijas. */
  @media (max-height: 31.25rem) {
    .barra {
      position: static;
    }
  }
  /* Con el texto muy agrandado «Cómo se calcula» baja a su renglón en vez de aplastar a la marca o a «Atrás». */
  .izquierda {
    display: flex;
    flex: 1 1 8rem;
    align-items: center;
    min-width: 0;
  }

  .marca {
    --icono-tam: 1.5rem;
    display: inline-flex;
    flex-wrap: wrap; /* con el texto muy agrandado «Demo» baja a su renglón en vez de salirse de la pantalla */
    align-items: center;
    gap: 0 var(--e-2);
    min-width: 0;
    min-height: var(--alto-tactil);
    color: inherit;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-marca);
    font-size: 1.125rem;
    font-weight: 750;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .marca :global(.icono) {
    color: var(--c-tinta);
  }
  .demo {
    padding: 1px 6px;
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    color: var(--c-texto-2);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: var(--t-rotulo);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .atras {
    --icono-tam: 1.375rem;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-width: var(--alto-tactil);
    min-height: var(--alto-tactil);
    max-width: 100%;
    margin-left: -0.375rem;
    padding: 0 0.625rem 0 0.125rem;
    border: 0;
    border-radius: var(--r-1);
    background: none;
    color: var(--c-texto);
    font-size: var(--t-cuerpo);
    font-weight: 650;
    cursor: pointer;
  }
  @media (hover: hover) {
    .atras:hover {
      background: var(--c-superficie-2);
    }
  }
  /* Con el tamaño de siempre, un nombre largo se acorta con «…» (el nombre completo es el del botón para los lectores de pantalla y está en el título de la pantalla
     a la que se vuelve). Con el texto agrandado (la barra mide menos de 18 rem) el nombre baja de renglón y se lee entero (1.4.4). */
  .atras-texto {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @container barra (max-width: 18rem) {
    .atras-texto {
      overflow: visible;
      overflow-wrap: anywhere;
      line-height: 1.25;
      text-align: left;
      white-space: normal;
    }
  }

  .ayuda {
    --icono-tam: 1.125rem;
    display: inline-flex;
    flex: 0 1 auto;
    max-width: 100%;
    align-items: center;
    gap: 0.375rem;
    min-height: var(--alto-tactil);
    padding: var(--e-1) var(--e-3) var(--e-1) 0.625rem;
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-pildora);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: var(--t-tabla);
    font-weight: 650;
    line-height: 1.25;
    text-decoration: none;
    /* Con el texto muy agrandado el rótulo se parte en dos renglones en vez de salirse de la pantalla (1.4.4); con el tamaño de siempre es una sola línea. */
    overflow-wrap: anywhere;
  }
  @media (hover: hover) {
    .ayuda:hover {
      background: var(--c-superficie-2);
    }
  }
  .ayuda[aria-current] {
    border-color: var(--c-tinta);
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  @media (max-width: 23.75rem) {
    .ayuda {
      gap: var(--e-1);
      padding: var(--e-1) 0.625rem var(--e-1) var(--e-2);
      font-size: 0.84375rem;
    }
    .marca {
      gap: 0.375rem;
    }
  }
</style>
