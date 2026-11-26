<!-- Barra del corte. En el celular es un renglón debajo de la barra de arriba (no es fija); en escritorio es la barra fija con las migas a la izquierda. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import Migas from "./Migas.svelte";
  import SelectorDeCorte from "./SelectorDeCorte.svelte";

  let { app }: { app: AplicacionLista } = $props();
</script>

<div class="barra" data-fijo="barra-de-corte">
  <Migas {app} />
  <SelectorDeCorte {app} />
</div>

<style>
  .barra {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-4);
    padding: 0.625rem var(--margen) 0.375rem;
  }
  @media (min-width: 64rem) {
    .barra {
      position: sticky;
      top: 0;
      z-index: 40;
      flex-wrap: nowrap;
      min-height: 3.75rem;
      padding: var(--e-2) var(--margen);
      background: var(--c-fondo);
      border-bottom: 1px solid var(--c-borde);
    }
  }
  /* Un celular apaisado no tiene alto para barras fijas. */
  @media (max-height: 31.25rem) {
    .barra {
      position: static;
    }
  }
</style>
