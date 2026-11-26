<!-- Pantalla de error al iniciar: los datos de ejemplo no se pudieron preparar (o una pantalla falló por algo que no es un cálculo). No hay dirección ni cifras: solo
     qué pasó, el detalle y recargar. Se ve en la galería (`muestras.html`) y cuando los datos de ejemplo no pasan las validaciones. -->
<script lang="ts">
  import Boton from "../componentes/Boton.svelte";
  import Icono from "../componentes/Icono.svelte";
  import { TEXTO_ERRORES } from "../componentes/textos-marco.ts";

  let { mensaje }: { mensaje: string } = $props();
</script>

<div class="error">
  <span class="marca"><Icono nombre="vencido" /></span>
  <div class="texto">
    <h1 tabindex="-1">{TEXTO_ERRORES.falloAlIniciar.titulo}</h1>
    <p>{TEXTO_ERRORES.falloAlIniciar.cuerpo}</p>
    <p class="detalle">{TEXTO_ERRORES.falloAlIniciar.detalle(mensaje)}</p>
  </div>
  <div class="acciones">
    <Boton onclick={() => window.location.reload()}>{TEXTO_ERRORES.falloAlIniciar.recargar}</Boton>
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
  .acciones {
    grid-column: 2;
    margin-top: 0.875rem;
  }
</style>
