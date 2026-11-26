<!-- Pantalla de error de cierre (D2 y D3): un control de cálculo no cierra al corte y la demo no muestra ninguna cifra de esa fecha. Con los datos de ejemplo no
     se llega acá: se ve en la galería (`muestras.html`) y cuando una pantalla lanza un `ErrorDeCierre` al dibujarse.
     El detalle dice qué dos cálculos no coinciden con `error.descripcion`, sin ninguna cifra (el `message` del error trae los importes y no se muestra nunca). -->
<script lang="ts">
  import type { ErrorDeCierre } from "../lib/dominio/medidas.ts";
  import type { FechaCivil } from "../lib/dominio/tipos.ts";
  import Icono from "../componentes/Icono.svelte";
  import { TEXTO_ERRORES } from "../componentes/textos-marco.ts";

  let { error, corte }: { error: ErrorDeCierre; corte: FechaCivil } = $props();
</script>

<div class="error">
  <span class="marca"><Icono nombre="vencido" /></span>
  <div class="texto">
    <h1 tabindex="-1">{TEXTO_ERRORES.controlQueFalla.titulo}</h1>
    <p>{TEXTO_ERRORES.controlQueFalla.cuerpo(corte)}</p>
    <p class="detalle">{TEXTO_ERRORES.controlQueFalla.detalle(error.descripcion)}</p>
  </div>
</div>

<style>
  .error {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--e-1) 0.875rem;
    max-width: 45rem;
    padding: var(--e-5) var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-left: 4px solid var(--c-diferencia-r);
    border-radius: var(--r-2);
  }
  .marca {
    --icono-tam: 1.5rem;
    margin-top: var(--e-1);
    color: var(--c-diferencia-t);
  }
  .texto p {
    margin-top: 0.375rem;
    color: var(--c-texto-2);
  }
  .detalle {
    font-size: var(--t-chico);
    overflow-wrap: anywhere;
  }
</style>
