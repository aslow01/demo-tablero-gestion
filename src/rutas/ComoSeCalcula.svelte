<!-- Cómo se calcula: las reglas del tablero en palabras, con un índice y ejemplos de los mismos datos que enlazan a los comprobantes y a las pantallas reales.
     Es una página. Las cifras salen de `vistaComoSeCalcula` (constantes de la semilla publicada y
     dominio), nunca están escritas acá. -->
<script lang="ts">
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import { vistaComoSeCalcula } from "../lib/vistas/como-se-calcula.ts";
  import Cabecera from "../componentes/Cabecera.svelte";
  import { TEXTO_COMO_SE_CALCULA } from "../componentes/textos-como-se-calcula.ts";
  import Trozos from "./como-se-calcula/Trozos.svelte";

  let { app }: { app: AplicacionLista } = $props();

  const pagina = $derived(vistaComoSeCalcula(app.datos, app.plantados));

  /** El índice no cambia la dirección: lleva el foco y la vista al título de la sección (el ancla `#cc-…` no es una ruta de la aplicación). */
  function irALaSeccion(e: MouseEvent, id: string): void {
    e.preventDefault();
    const destino = document.getElementById(`cc-${id}`);
    if (destino === null) return;
    destino.scrollIntoView({ block: "start" });
    destino.focus({ preventScroll: true });
  }
</script>

<Cabecera titulo={pagina.titulo}>
  {#snippet bajada()}<Trozos {app} trozos={pagina.bajada} />{/snippet}
</Cabecera>

<section class="panel" aria-label={TEXTO_COMO_SE_CALCULA.reglas}>
  <nav aria-label={TEXTO_COMO_SE_CALCULA.indice}>
    <ul class="indice">
      {#each pagina.secciones as seccion (seccion.id)}
        <li><a href="#cc-{seccion.id}" data-accion="ir-seccion" data-seccion={seccion.id} onclick={(e) => irALaSeccion(e, seccion.id)}>{seccion.titulo}</a></li>
      {/each}
    </ul>
  </nav>
  {#each pagina.secciones as seccion (seccion.id)}
    <section class="regla" aria-labelledby="cc-{seccion.id}">
      <h2 id="cc-{seccion.id}" tabindex="-1">{seccion.titulo}</h2>
      {#each seccion.parrafos as parrafo, i (i)}
        <p><Trozos {app} trozos={parrafo} /></p>
      {/each}
      {#each seccion.ejemplos as ejemplo, i (i)}
        <p class="ejemplo"><span class="rotulo">{TEXTO_COMO_SE_CALCULA.rotuloDelEjemplo}</span><Trozos {app} trozos={ejemplo} /></p>
      {/each}
    </section>
  {/each}
</section>

<style>
  .panel {
    min-width: 0;
    max-width: 70ch;
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
    box-shadow: var(--s-1);
  }

  /* Índice: una pastilla por sección. */
  .indice {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: var(--e-3) var(--e-4);
    border-bottom: 1px solid var(--c-borde);
  }
  .indice a {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
    padding: 0 0.625rem;
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-pildora);
    color: var(--c-texto);
    font-size: var(--t-tabla);
    font-weight: 600;
    text-decoration: none;
  }
  @media (hover: hover) {
    .indice a:hover {
      background: var(--c-superficie-2);
    }
  }
  @media (min-width: 64rem) {
    .indice a {
      min-height: 2.25rem;
    }
  }

  /* Secciones de texto. */
  .regla {
    padding: var(--e-4);
    border-bottom: 1px solid var(--c-borde);
  }
  .regla:last-child {
    border-bottom: 0;
  }
  .regla h2 {
    margin-bottom: 0.375rem;
    font-size: var(--t-h2-largo);
    font-weight: var(--t-peso-titulo);
  }
  .regla p + p {
    margin-top: var(--e-2);
  }
  .ejemplo {
    padding: 0.625rem 0.75rem;
    border-radius: var(--r-1);
    background: var(--c-fondo);
    font-size: var(--t-medio);
  }
  .regla .ejemplo {
    margin-top: 0.625rem;
  }
  .ejemplo .rotulo {
    display: block;
    margin-bottom: 0.125rem;
  }
</style>
