<!-- Propio de esta demo: las solapas de la ficha del cliente. Escrito desde cero como componente. -->
<script lang="ts" module>
  export interface Solapa {
    /** Identifica la solapa (`saldo`, `recibos`, `cuenta`). Su botón lleva el id `{prefijo}-{id}`. */
    id: string;
    texto: string;
    /** Cuántos elementos tiene lo que muestra. */
    cantidad?: number;
    /** El conteo dicho en palabras para lectores de pantalla («3 recibos»). Sin esto se lee solo el número. */
    cantidadDicha?: string;
  }
</script>

<script lang="ts">
  // Solapas: patrón de pestañas de ARIA (tablist, tab y tabpanel) con activación automática. La hoja de la solapa elegida va debajo, en `children`.
  //  - Tab entra a la solapa elegida y de ahí al contenido de la hoja (la hoja también recibe el foco); no recorre todas las solapas.
  //  - Flechas izquierda y derecha pasan a la anterior y a la siguiente (dan la vuelta); Inicio y Fin van a la primera y a la última.
  //  - El estado de cuál es la elegida es de la pantalla: acá solo se avisa con `alElegir`. Los botones se identifican por `id`, así que el foco
  //    sigue en la solapa cuando cambia `actual`.
  import type { Snippet } from "svelte";

  let {
    etiqueta,
    solapas,
    actual,
    alElegir,
    idPanel = "hoja",
    prefijoDeId = "sol",
    relleno = "ninguno",
    children,
  }: {
    /** Nombre de la lista de solapas («Detalle del cliente»). */
    etiqueta: string;
    solapas: Solapa[];
    /** `id` de la elegida. Si no coincide con ninguna, vale la primera. */
    actual: string;
    alElegir: (id: string) => void;
    /** `id` de la hoja (el `tabpanel`). */
    idPanel?: string;
    /** El botón de cada solapa es `{prefijo}-{id}`: `sol-saldo`. */
    prefijoDeId?: string;
    /** `ninguno`: el contenido llega hasta los bordes de la hoja (tablas). */
    relleno?: "normal" | "ninguno";
    children: Snippet;
  } = $props();

  const elegida = $derived(solapas.some((s) => s.id === actual) ? actual : (solapas[0]?.id ?? ""));
  const idDe = (id: string): string => `${prefijoDeId}-${id}`;

  let lista: HTMLDivElement | undefined = $state();

  function teclas(e: KeyboardEvent, indice: number): void {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const ultimo = solapas.length - 1;
    let destino: number;
    if (e.key === "ArrowRight") destino = indice === ultimo ? 0 : indice + 1;
    else if (e.key === "ArrowLeft") destino = indice === 0 ? ultimo : indice - 1;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = ultimo;
    else return;
    e.preventDefault();
    const siguiente = solapas[destino];
    if (siguiente === undefined) return;
    alElegir(siguiente.id);
    // El botón de destino ya existe (solo cambia su `tabindex`): se le da el foco sin esperar a que la pantalla actualice `actual`.
    (lista?.children[destino] as HTMLElement | undefined)?.focus();
  }

  // La fila se desplaza en pantallas angostas: la solapa elegida se deja a la vista (sin tocar el desplazamiento de la página).
  $effect(() => {
    const posicion = solapas.findIndex((s) => s.id === elegida);
    const caja = lista;
    if (caja === undefined || posicion < 0) return;
    const boton = caja.children[posicion] as HTMLElement | undefined;
    if (boton === undefined) return;
    // La fila es el `offsetParent` de sus botones (está posicionada): `offsetLeft` ya es relativo a ella.
    const izquierda = boton.offsetLeft;
    const derecha = izquierda + boton.offsetWidth;
    if (izquierda < caja.scrollLeft) caja.scrollLeft = izquierda;
    else if (derecha > caja.scrollLeft + caja.clientWidth) caja.scrollLeft = derecha - caja.clientWidth;
  });
</script>

<div class="solapas-caja">
  <div class="solapas" role="tablist" aria-label={etiqueta} bind:this={lista}>
    {#each solapas as s, i (s.id)}
      <button
        type="button"
        class="solapa"
        role="tab"
        id={idDe(s.id)}
        aria-selected={s.id === elegida}
        aria-controls={idPanel}
        tabindex={s.id === elegida ? 0 : -1}
        data-foco={idDe(s.id)}
        onclick={() => alElegir(s.id)}
        onkeydown={(e) => teclas(e, i)}
      >
        <span class="texto">{s.texto}</span>
        {#if s.cantidad !== undefined}
          <span class="n" aria-hidden={s.cantidadDicha !== undefined ? "true" : undefined}>{s.cantidad}</span>
          {#if s.cantidadDicha !== undefined}<span class="solo-lectores">, {s.cantidadDicha}</span>{/if}
        {/if}
      </button>
    {/each}
  </div>
  <div class="hoja" class:con-relleno={relleno === "normal"} role="tabpanel" id={idPanel} aria-labelledby={idDe(elegida)} tabindex="0">
    {@render children()}
  </div>
</div>

<style>
  .solapas-caja {
    position: relative;
    min-width: 0;
  }

  /* La fila de solapas se apoya en la hoja: su margen inferior de -1 px tapa el borde de la hoja bajo la solapa elegida. */
  .solapas {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 2px;
    padding: 0.25rem 0.125rem 0;
    margin: 0 -0.125rem -1px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .solapa {
    position: relative;
    flex: none;
    /* Una solapa no es más ancha que la fila: con un rótulo largo o el texto agrandado, el rótulo pasa a más de un renglón. */
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding: 0.25rem calc(0.625rem + var(--muesca)) 0.25rem 0.875rem;
    line-height: 1.15;
    text-align: left;
    border: 0;
    background: none;
    color: var(--c-texto-2);
    isolation: isolate;
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-titulo);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }
  /* El fondo es una forma con la esquina de arriba a la derecha cortada en diagonal (la muesca). */
  .solapa::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--c-superficie-2);
    border-radius: var(--r-2) 0 0 0;
    clip-path: polygon(0 0, calc(100% - var(--muesca)) 0, 100% 100%, 0 100%);
  }
  @media (hover: hover) {
    .solapa:hover {
      color: var(--c-texto);
    }
  }
  .solapa[aria-selected="true"] {
    color: var(--c-texto);
  }
  .solapa[aria-selected="true"]::before {
    background: var(--c-superficie);
    box-shadow: inset 1px 1px 0 var(--c-borde);
  }
  /* Línea de tinta arriba de la elegida: la forma y el texto más fuerte también la distinguen (no es solo color). */
  .solapa[aria-selected="true"]::after {
    content: "";
    position: absolute;
    left: 0.625rem;
    right: calc(var(--muesca) + 0.625rem);
    top: 0;
    height: 3px;
    background: var(--c-tinta);
  }
  .solapa:focus-visible {
    outline-offset: -3px;
  }
  .n {
    flex: none;
    display: inline-grid;
    place-items: center;
    min-width: 1.375rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    border-radius: var(--r-pildora);
    background: var(--c-superficie);
    color: var(--c-texto-2);
    font-family: var(--t-familia);
    font-stretch: normal;
    font-size: var(--t-rotulo);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .solapa[aria-selected="true"] .n {
    background: var(--c-texto-2);
    color: var(--c-superficie);
  }

  /* Hoja: es un panel (misma superficie, borde y radio), con la esquina de arriba a la izquierda recta donde nace la primera solapa. */
  .hoja {
    min-width: 0;
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: 0 var(--r-2) var(--r-2) var(--r-2);
    box-shadow: var(--s-1);
  }
  .hoja.con-relleno {
    padding: var(--e-4);
  }

  /* Pantallas angostas: desvanecido que avisa que hay más solapas; la última puede salir de debajo. */
  @media (max-width: 37.4375rem) {
    .solapas {
      padding-inline-end: 1.75rem;
    }
    .solapas-caja::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 1.75rem;
      height: calc(var(--alto-tactil) + 0.25rem);
      pointer-events: none;
      background: linear-gradient(to right, transparent, var(--c-fondo));
    }
    .solapa {
      padding-left: 0.625rem;
      font-size: var(--t-medio);
    }
  }

  @media (forced-colors: active) {
    .solapa[aria-selected="true"]::after {
      background: Highlight;
    }
  }
</style>
