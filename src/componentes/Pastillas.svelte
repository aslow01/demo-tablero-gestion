<!-- Propio de esta demo. Escrito desde cero como componente. -->
<script lang="ts" module>
  import type { NumeroDeTramo } from "./tipos.ts";

  export interface PastillaItem {
    /** Identifica la opción (`todos`, `vencidos`, `1-30`…). Es la clave del DOM: la pastilla se conserva (y su foco) cuando cambia la elegida. */
    id: string;
    /** Lo que se lee: «En mora», «31 a 60 días». */
    texto: string;
    /** A dónde lleva (la dirección de la pantalla con este filtro). Una pastilla es un enlace: cambiar de filtro es una entrada del historial. */
    href: string;
    /** Cuántos elementos tiene el filtro. */
    cantidad?: number;
    /** El conteo dicho en palabras para lectores de pantalla («7 comprobantes»). Sin esto se lee solo el número. */
    cantidadDicha?: string;
    /** Muestra de color del tramo, siempre junto al nombre escrito del tramo. */
    tramo?: NumeroDeTramo;
  }
</script>

<script lang="ts">
  // Filtros en pastillas: una lista de enlaces dentro de un `nav`. La elegida lleva `aria-current="true"`.
  // Se actualiza en el lugar: las pastillas se identifican por `id`, así que al cambiar `actual` o los conteos el DOM se conserva y el foco no se mueve.
  // En pantallas angostas la fila se desplaza hacia el costado (con un desvanecido que avisa que hay más); el teclado la recorre con Tab.
  // La pastilla enfocada se trae a la vista: Chrome solo mueve la fila si la pastilla no se ve nada, y una que asoma a medias (o queda bajo el desvanecido) se quedaba así.
  function aLaVista(pastilla: HTMLElement): void {
    const fila = pastilla.closest("ul");
    // Una pastilla casi tan ancha como la fila (texto muy agrandado) no puede quedar entera junto al borde: se alinea al principio, que es donde empieza a leerse.
    const demasiadoAncha = fila !== null && pastilla.offsetWidth > fila.clientWidth * 0.8;
    pastilla.scrollIntoView({ block: "nearest", inline: demasiadoAncha ? "start" : "nearest" });
  }

  let {
    etiqueta,
    items,
    actual,
    prefijoDeFoco = "f",
    alElegir,
  }: {
    /** Nombre del `nav` («Filtrar por tramo»). */
    etiqueta: string;
    items: PastillaItem[];
    /** `id` de la elegida. */
    actual: string;
    /** Va en `data-foco` de cada pastilla: `{prefijo}-{id}`. */
    prefijoDeFoco?: string;
    /** Se llama al pulsar una pastilla, con el evento: la pantalla puede cancelarlo (`preventDefault`) si no quiere navegar. */
    alElegir?: (id: string, evento: MouseEvent) => void;
  } = $props();
</script>

<div class="caja">
  <nav aria-label={etiqueta}>
    <ul class="lista">
      {#each items as it (it.id)}
        <li>
          <a
            class="pastilla"
            href={it.href}
            data-foco="{prefijoDeFoco}-{it.id}"
            aria-current={it.id === actual ? "true" : undefined}
            onclick={(e) => alElegir?.(it.id, e)}
            onfocus={(e) => aLaVista(e.currentTarget)}
          >
            {#if it.tramo !== undefined}<span class="muestra" data-tramo={it.tramo} aria-hidden="true"></span>{/if}
            <span class="texto">{it.texto}</span>
            {#if it.cantidad !== undefined}
              <span class="n" aria-hidden={it.cantidadDicha !== undefined ? "true" : undefined}>{it.cantidad}</span>
              {#if it.cantidadDicha !== undefined}<span class="solo-lectores">, {it.cantidadDicha}</span>{/if}
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</div>

<style>
  .caja {
    position: relative;
    min-width: 0;
  }
  /* El relleno y el margen negativo dejan lugar al anillo de foco, que el desplazamiento recortaría. */
  .lista {
    /* Contenedor de los textos solo para lectores (`.solo-lectores`, absolutos) de cada pastilla: sin esto quedarían fuera de la fila que se desplaza y ensancharían el `body`. */
    position: relative;
    display: flex;
    gap: var(--e-2);
    padding: 0.375rem 0.25rem;
    margin: -0.375rem -0.25rem;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  /* Cada pastilla ocupa lo que su texto pide; solo si el texto es más largo que la fila entera (texto agrandado, pantalla angosta) pasa a más de un renglón. */
  li {
    flex: none;
    max-width: 100%;
  }

  /* Pantalla ancha: las pastillas que no entran bajan de renglón (nada queda escondido a la derecha, donde no habría desvanecido que lo avise). */
  @media (min-width: 64rem) {
    .lista {
      flex-wrap: wrap;
      padding: 0;
      margin: 0;
      overflow: visible;
    }
  }

  /* Pantalla angosta: la fila se desplaza. Desvanecido en el borde derecho: hay más pastillas; el relleno final deja que la última salga de debajo. */
  @media (max-width: 63.99rem) {
    .lista {
      padding-inline-end: min(1.75rem, 11%);
      /* Al traer una pastilla a la vista (`aLaVista`) queda fuera del desvanecido. El desvanecido y este margen no pasan del 10-12 % del ancho: con el texto muy agrandado
         una pastilla ocupa casi toda la fila y no puede quedar siempre fuera de él. */
      scroll-padding-inline: 0.25rem min(2rem, 12%);
    }
    .caja::after {
      content: "";
      position: absolute;
      top: 0;
      right: -0.25rem;
      bottom: 0;
      width: min(1.75rem, 10%);
      pointer-events: none;
      background: linear-gradient(to right, transparent, var(--c-superficie));
    }
  }

  .pastilla {
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding: 0.25rem 0.875rem;
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-pildora);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-size: var(--t-tabla);
    font-weight: 600;
    line-height: 1.25;
    text-decoration: none;
  }
  @media (hover: hover) {
    .pastilla:hover {
      background: var(--c-superficie-2);
    }
  }
  .n {
    flex: none;
    color: var(--c-texto-2);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .muestra {
    flex: none;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 2px;
    background: var(--c-tramo-0);
  }
  .muestra[data-tramo="1"] {
    background: var(--c-tramo-1);
  }
  .muestra[data-tramo="2"] {
    background: var(--c-tramo-2);
  }
  .muestra[data-tramo="3"] {
    background: var(--c-tramo-3);
  }
  .muestra[data-tramo="4"] {
    background: var(--c-tramo-4);
  }

  /* La elegida: relleno de tinta. El color no va solo: además lleva `aria-current` y es la única rellena. */
  .pastilla[aria-current] {
    background: var(--c-tinta);
    border-color: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  .pastilla[aria-current] .n {
    color: var(--c-sobre-tinta);
  }
  .pastilla[aria-current] .muestra {
    box-shadow: 0 0 0 2px var(--c-sobre-tinta);
  }

  @media (forced-colors: active) {
    .muestra {
      forced-color-adjust: none;
      outline: 1px solid CanvasText;
    }
    .pastilla[aria-current] {
      background: Highlight;
      border-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .pastilla[aria-current] .n {
      color: HighlightText;
    }
  }
</style>
