<!-- Migas de pan: el camino hasta la pantalla. Solo en escritorio (desde 64 rem); en el celular lo hace el botón «Atrás» de la barra de arriba. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { migasDe } from "../../lib/estado/navegacion.ts";
  import { rotulosDeMigas } from "../../lib/vistas/rotulos.ts";
  import { TEXTO_MARCO } from "../textos-marco.ts";

  let { app }: { app: AplicacionLista } = $props();

  const pasos = $derived(rotulosDeMigas(migasDe(app.direccion.ruta, app.datos, app.direccion.corte), app.datos, app.direccion.corte));
</script>

<nav class="migas" aria-label={TEXTO_MARCO.migas}>
  <ol>
    {#each pasos as paso, i (i)}
      <li>
        {#if paso.destino !== null && !paso.actual}
          <a href={app.direccion.enlace(paso.destino)}>{paso.texto}</a>
        {:else}
          <span aria-current="page">{paso.texto}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .migas {
    display: none;
    min-width: 0;
    font-size: var(--t-tabla);
    color: var(--c-texto-2);
  }
  @media (min-width: 64rem) {
    .migas {
      display: block;
    }
  }
  ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
  }
  li {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  li + li::before {
    content: "/";
    margin-right: var(--e-2);
    color: var(--c-texto-3);
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    color: var(--c-texto-2);
    font-weight: 550;
  }
  [aria-current] {
    color: var(--c-texto);
    font-weight: 650;
  }
</style>
