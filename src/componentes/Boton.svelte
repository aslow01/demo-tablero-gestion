<!-- Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/componentes/Boton.svelte.
     Cambios: se sacaron la variante `peligro` y el estado `cargando` (docs/diseno-ui.md 5.1: la demo es de solo lectura y no tiene acciones en curso);
     borde de 1,5 px, radio de 4 px, texto de 15 px; `href` (botón-enlace: «Ir al resumen», «Verlo al 30/09/2026»,
     se dibuja como <a>); variante `icono-caja` (la caja con borde de las flechas ‹ › del selector de corte). -->
<script lang="ts">
  // 5.1 Botones: primario, secundario, texto e ícono. Un <button>; con `href` es un <a> que se ve igual (navega, no actúa).
  // No hay botón de peligro: la demo es de solo lectura.
  //
  // - Un solo primario visible por zona. El primario no se deshabilita: si no aplica, no se muestra.
  // - Variante `icono`: 44 × 44 de área, sin caja (cerrar un aviso). Variante `icono-caja`: 44 × 44 con borde (anterior y siguiente). Las dos llevan
  //   `etiqueta` (nombre accesible) en vez de texto; la `icono-caja` es la única que se deshabilita (en el primer y el último cierre).
  // - Un enlace no se deshabilita: si no aplica, no se muestra.
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import Icono from "./Icono.svelte";
  import type { NombreIcono } from "./tipos.ts";

  type Comun = {
    variante?: "primario" | "secundario" | "texto" | "icono" | "icono-caja";
    tamano?: "normal" | "grande";
    /** Ícono a la izquierda del texto; en las variantes de ícono es el único contenido. */
    icono?: NombreIcono;
    /** Nombre accesible del botón de ícono. */
    etiqueta?: string;
    children?: Snippet;
  };
  type ComoBoton = Comun & Omit<HTMLButtonAttributes, "children" | "class" | "style"> & { href?: undefined };
  type ComoEnlace = Comun & Omit<HTMLAnchorAttributes, "children" | "class" | "style"> & { href: string };

  let { variante = "primario", tamano = "normal", icono, etiqueta, href, children, ...resto }: ComoBoton | ComoEnlace = $props();

  const nombre = $derived(etiqueta ?? (resto as { "aria-label"?: string })["aria-label"]);
</script>

{#snippet contenido()}
  {#if icono !== undefined}<Icono nombre={icono} />{/if}
  {#if variante !== "icono" && variante !== "icono-caja"}{@render children?.()}{/if}
{/snippet}

{#if href !== undefined}
  <a {...resto as HTMLAnchorAttributes} {href} class="boton" data-variante={variante} data-tamano={tamano} aria-label={nombre}>{@render contenido()}</a>
{:else}
  <button
    {...resto as HTMLButtonAttributes}
    type={(resto as HTMLButtonAttributes).type ?? "button"}
    class="boton"
    data-variante={variante}
    data-tamano={tamano}
    aria-label={nombre}
  >
    {@render contenido()}
  </button>
{/if}

<style>
  .boton {
    --icono-tam: 1.125rem;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding: 0.375rem var(--e-4);
    border: 1.5px solid var(--c-tinta);
    border-radius: var(--r-1);
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
    font-size: var(--t-medio);
    font-weight: 650;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    /* Se puede partir en renglones: con el texto al 200 % un rótulo largo baja de renglón en lugar de salirse de la pantalla (1.4.4 y 1.4.10). */
    max-width: 100%;
    cursor: pointer;
    transition: background-color var(--m-rapido) linear;
  }
  .boton[data-tamano="grande"] {
    min-height: 3rem;
    padding: 0 var(--e-5);
    font-size: var(--t-grande);
  }
  .boton:active {
    transform: translateY(1px);
  }
  @media (hover: hover) {
    .boton:hover {
      background: var(--c-tinta-hover);
      border-color: var(--c-tinta-hover);
    }
  }

  /* Secundario */
  .boton[data-variante="secundario"] {
    background: var(--c-superficie);
    border-color: var(--c-borde-fuerte);
    color: var(--c-texto);
  }
  @media (hover: hover) {
    .boton[data-variante="secundario"]:hover {
      background: var(--c-superficie-2);
      border-color: var(--c-borde-fuerte);
    }
  }
  /* Deshabilitado: solo el secundario (siempre con una explicación visible al lado, que pone quien lo usa). */
  .boton[data-variante="secundario"]:disabled {
    background: var(--c-superficie-2);
    border-color: var(--c-borde);
    color: var(--c-texto-3);
    cursor: not-allowed;
  }

  /* Texto: sin fondo ni borde, color de enlace, subrayado de 1 px (2 px con el cursor encima). */
  .boton[data-variante="texto"] {
    /* Sin relleno horizontal, así empieza en la misma columna que el primario de arriba; el alto de 44 px lo da `min-height`. */
    padding-inline: 0;
    border-color: transparent;
    background: none;
    color: var(--c-enlace);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .boton[data-variante="texto"]:active {
    transform: none;
  }
  @media (hover: hover) {
    .boton[data-variante="texto"]:hover {
      background: none;
      border-color: transparent;
      text-decoration-thickness: 2px;
    }
  }

  /* Ícono: 44 × 44 de área, sin caja; al pasar el cursor se marca una caja de 2 rem. El anillo de foco rodea esa caja. */
  .boton[data-variante="icono"] {
    flex: none; /* en una barra con un título largo no se achica por debajo de 44 px */
    width: var(--alto-tactil);
    padding: 0;
    border-color: transparent;
    background: none;
    color: var(--c-texto-2);
  }
  .boton[data-variante="icono"]::before {
    content: "";
    position: absolute;
    inset: 0.375rem;
    border-radius: var(--r-1);
    transition: background-color var(--m-rapido) linear;
  }
  .boton[data-variante="icono"] > :global(.icono) {
    position: relative;
  }
  .boton[data-variante="icono"]:focus-visible {
    outline: none;
  }
  .boton[data-variante="icono"]:focus-visible::before {
    outline: 3px solid var(--c-foco);
    outline-offset: 1px;
  }
  @media (hover: hover) {
    .boton[data-variante="icono"]:hover {
      background: none;
      border-color: transparent;
      color: var(--c-texto);
    }
    .boton[data-variante="icono"]:hover::before {
      background: var(--c-ventana-control-hover);
    }
  }
  .boton[data-variante="icono"]:active {
    transform: none;
  }

  /* Ícono con caja: cuadrada de 44 px, con borde de control (anterior y siguiente del selector de corte). */
  .boton[data-variante="icono-caja"] {
    flex: none;
    width: var(--alto-tactil);
    padding: 0;
    border-color: var(--c-borde-fuerte);
    background: var(--c-superficie);
    color: var(--c-texto);
  }
  @media (hover: hover) {
    .boton[data-variante="icono-caja"]:hover:not(:disabled) {
      background: var(--c-superficie-2);
      border-color: var(--c-borde-fuerte);
    }
  }
  .boton[data-variante="icono-caja"]:disabled {
    background: var(--c-superficie-2);
    border-color: var(--c-borde);
    color: var(--c-texto-3);
    cursor: not-allowed;
  }
  .boton[data-variante="icono-caja"]:active {
    transform: none;
  }

  @media (forced-colors: active) {
    .boton[data-variante="icono"]:focus-visible::before {
      outline-color: Highlight;
    }
  }
</style>
