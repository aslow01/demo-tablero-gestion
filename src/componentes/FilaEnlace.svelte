<!-- Propio de esta demo. En el celular reemplaza a un panel entero que no entra (el gráfico de 12 meses del Resumen). -->
<script lang="ts">
  // Fila-enlace: un solo enlace grande con un título, una línea de apoyo opcional y un chevron. Navega (es un <a>): no actúa.
  // - `tarjeta` (por defecto): lleva la superficie y el borde de un panel, para ir suelta en la página. `plana`: sin superficie, para apilar varias dentro de un panel sin relleno.
  // - Todo el renglón es el enlace (objetivo de 56 px de alto); el nombre accesible es el título y la línea de apoyo juntos.
  // - Con el texto muy agrandado (contenedor de menos de 17rem) el chevron baja a su renglón, a la derecha: el texto conserva todo el ancho y no se parte ninguna palabra.
  // - Recibe los textos por propiedades; los atributos que no conoce (`data-*`, `aria-*`, `rel`) pasan al <a>.
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import Icono from "./Icono.svelte";
  import type { NombreIcono } from "./tipos.ts";

  let {
    href,
    titulo,
    detalle,
    icono = "chevron",
    variante = "tarjeta",
    ...resto
  }: Omit<HTMLAnchorAttributes, "class" | "style" | "children" | "href"> & {
    href: string;
    /** Lo que dice el enlace: «Facturado y cobrado, últimos 12 meses». */
    titulo: string;
    /** Línea de apoyo bajo el título: «Octubre de 2026: facturado $ … · cobrado $ …». */
    detalle?: string;
    icono?: NombreIcono;
    variante?: "tarjeta" | "plana";
  } = $props();
</script>

<div class="caja">
  <a {...resto} {href} class="fila-enlace" data-variante={variante}>
    <span class="textos">
      <span class="titulo">{titulo}</span>
      {#if detalle !== undefined && detalle !== ""}<span class="detalle">{detalle}</span>{/if}
    </span>
    <Icono nombre={icono} />
  </a>
</div>

<style>
  .caja {
    container: fila / inline-size;
    min-width: 0;
  }
  .fila-enlace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--e-3);
    min-height: 3.5rem;
    padding: 0.875rem var(--e-4);
    color: var(--c-texto);
    font-weight: 650;
    line-height: 1.35;
    text-decoration: none;
  }
  .fila-enlace[data-variante="tarjeta"] {
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
    box-shadow: var(--s-1);
  }
  @media (hover: hover) {
    .fila-enlace:hover {
      background: var(--c-superficie-2);
    }
  }
  .textos {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .detalle {
    font-size: var(--t-chico);
    font-weight: 400;
    color: var(--c-texto-2);
  }
  .fila-enlace :global(.icono) {
    color: var(--c-texto-2);
  }
  /* El anillo de foco no se corta contra el borde del panel que lo contiene. */
  .fila-enlace[data-variante="plana"]:focus-visible {
    outline-offset: -3px;
  }

  @container fila (max-width: 17rem) {
    .fila-enlace {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--e-1);
      padding-inline: var(--e-3);
    }
    .fila-enlace :global(.icono) {
      justify-self: end;
    }
  }

  @media (forced-colors: active) {
    .fila-enlace[data-variante="tarjeta"] {
      border-color: CanvasText;
    }
  }
</style>
