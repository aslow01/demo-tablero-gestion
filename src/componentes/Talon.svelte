<!-- Propio de esta demo. El tipo va en una caja gris y el número en la fuente monoespaciada de los títulos. -->
<script lang="ts">
  // Talón de comprobante: el tipo abreviado («FA») y el número («0003-00000562»), como en un talonario. Con `href` es un enlace al comprobante; sin él, un dato.
  //
  // - El tipo abreviado es solo de ojos (aria-hidden): los lectores de pantalla leen `tipoLargo` («Factura A 0003-00000562»). Los dos textos llegan por propiedades.
  // - `grande` es el talón del título de la pantalla del comprobante. `viaja` marca el talón que, en el movimiento entre pantallas, viaja de la tabla al título (`data-viaja`).
  // - Con el texto agrandado el número puede bajar de renglón después de un guion, nunca en medio de un grupo de dígitos.
  let {
    tipoCorto,
    tipoLargo,
    numero,
    href,
    grande = false,
    viaja = false,
  }: {
    /** «FA», «ND», «NC». */
    tipoCorto: string;
    /** «Factura A»: lo que dice el lector de pantalla antes del número. */
    tipoLargo: string;
    /** «0003-00000562». */
    numero: string;
    href?: string;
    grande?: boolean;
    viaja?: boolean;
  } = $props();
</script>

{#snippet cuerpo()}
  <span class="tl-tipo" aria-hidden="true" title={tipoLargo}>{tipoCorto}</span><span class="tl-num"><span class="solo-lectores">{tipoLargo}&nbsp;</span>{numero}</span>
{/snippet}

{#if href !== undefined}
  <a class="talon" class:grande {href} data-viaja={viaja ? "" : undefined}>{@render cuerpo()}</a>
{:else}
  <span class="talon" class:grande data-viaja={viaja ? "" : undefined}>{@render cuerpo()}</span>
{/if}

<style>
  .talon {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    min-height: 1.5rem; /* el talón enlace llega a 24 px (2.5.8); sin enlace es un dato y no lo necesita, pero queda igual en toda la tabla */
    max-width: 100%;
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-family: var(--t-mono);
    font-size: var(--t-tabla);
    font-weight: 600;
    line-height: 1.25;
    text-decoration: none;
  }
  .tl-tipo {
    flex: none;
    padding: 0.0625rem 0.3125rem;
    border-right: 1.5px solid var(--c-borde-fuerte);
    border-radius: calc(var(--r-1) - 1.5px) 0 0 calc(var(--r-1) - 1.5px);
    background: var(--c-superficie-2);
    color: var(--c-texto-2);
  }
  .tl-num {
    min-width: 0;
    padding: 0.0625rem 0.375rem;
    /* Si no entra, baja de renglón en el guion; solo si un grupo de dígitos tampoco entra se parte ahí (`overflow-wrap` del cuerpo): nunca queda texto fuera de la caja. */
  }

  .talon.grande {
    border-width: 2px;
    font-size: var(--t-h2-largo);
  }
  .grande .tl-tipo {
    padding: 0.125rem 0.625rem;
    border-right-width: 2px;
  }
  .grande .tl-num {
    padding: 0.125rem 0.625rem;
  }

  /* En una tabla, el margen negativo devuelve a la fila los 4 px que suma el mínimo de 24 px (la altura de las filas no cambia). */
  :global(:is(td, th)) .talon {
    margin-block: -0.125rem;
  }

  /* Enlace: el número va subrayado en azul; el área pulsable llega a 44 px de alto sin cambiar el de la caja. */
  a.talon::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block: min(0px, calc((var(--alto-tactil) - 100%) / -2));
  }
  a.talon .tl-num {
    text-decoration: underline;
    text-decoration-color: var(--c-enlace);
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  @media (hover: hover) {
    a.talon:hover {
      background: var(--c-acento-suave);
    }
    a.talon:hover .tl-num {
      text-decoration-thickness: 2px;
    }
  }
</style>
