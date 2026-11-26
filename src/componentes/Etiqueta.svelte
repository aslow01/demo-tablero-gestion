<!-- Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/componentes/Etiqueta.svelte.
     Cambios: se sacó la variante `texto` (solo «Puede salir» de la Demo 2); la marca es opcional: el ícono, o la `muestra` de color del tramo
     (las etiquetas de tramo la llevan en lugar del ícono, y el tipo de comprobante, «Factura A», no lleva ninguna). -->
<script lang="ts">
  // 5.7 Etiqueta de estado: rectángulo con marca de forma distinta y texto. El color nunca va solo.
  // Los colores salen del tono (`data-tono`, definido en base.css). El texto va como contenido: <Etiqueta ...>Cancelado</Etiqueta>.
  // Marca: `icono` (una forma del sprite) o `muestra` (un cuadradito del color del tramo, siempre junto al nombre escrito del tramo). Sin ninguna, solo texto.
  import type { Snippet } from "svelte";
  import Icono from "./Icono.svelte";
  import type { NombreIcono, NumeroDeTramo, Tono } from "./tipos.ts";

  let {
    tono,
    icono,
    muestra,
    children,
  }: {
    tono: Tono;
    icono?: NombreIcono;
    muestra?: NumeroDeTramo;
    children: Snippet;
  } = $props();
</script>

<span class="etiqueta" data-tono={tono}>
  {#if muestra !== undefined}<span class="muestra" data-tramo={muestra} aria-hidden="true"></span>{:else if icono !== undefined}<Icono nombre={icono} />{/if}{@render children()}
</span>

<style>
  .etiqueta {
    --icono-tam: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 1.5rem;
    padding: 0.125rem 0.5rem;
    /* El borde es transparente: solo se ve en colores forzados, donde el fondo desaparece. */
    border: 1px solid transparent;
    border-radius: var(--r-1);
    background: var(--tono-f);
    color: var(--tono-t);
    font-size: var(--t-chico);
    font-weight: 650;
    line-height: 1.3;
    vertical-align: middle;
    /* Las columnas se dimensionan para que la etiqueta entre en un renglón; con el texto agrandado (1.4.4) baja de renglón en lugar de empujar la página. */
    max-width: 100%;
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

  @media (forced-colors: active) {
    .muestra {
      forced-color-adjust: none;
      outline: 1px solid CanvasText;
    }
  }
</style>
