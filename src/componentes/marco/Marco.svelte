<!-- El marco de la aplicación: «Ir al contenido», lateral (escritorio), barra de arriba (celular), barra del corte, avisos, la vista, el pie, las pestañas de
     abajo (celular) y la región de anuncio. Decide qué se muestra en `main`: la vista, o la pantalla de error de cierre si el cierre del corte no cierra. -->
<script lang="ts">
  // Reglas del marco:
  // - El foco va al `h1` y la página sube SOLO cuando cambia `direccion.vista` (la vista y su sujeto). Si cambia el corte, o lo que se escribe en un filtro o en
  //   una búsqueda, ni el foco ni el desplazamiento se mueven. Por eso `Vista` no lleva `{#key}` con la consulta: ahí el DOM se actualiza en el lugar y el foco sigue
  //   en la pastilla o en el campo.
  // - Con un cierre que no cierra (controles cruzados X1 a X6) no se dibuja ninguna vista: `ErrorDeCierre`. Lo mismo si una pantalla lanza un `ErrorDeCierre`
  //   al calcular (`<svelte:boundary>`). El borde se reinicia al cambiar de corte o de vista.
  import { tick, untrack } from "svelte";
  import { ErrorDeCierre } from "../../lib/dominio/medidas.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { cantidadParaRevisar } from "../../lib/vistas/clientes.ts";
  import { tituloDelDocumentoDeRuta } from "../../lib/vistas/rotulos.ts";
  import PantallaErrorDeCierre from "../../rutas/ErrorDeCierre.svelte";
  import ErrorDeInicio from "../../rutas/ErrorDeInicio.svelte";
  import Vista from "../../rutas/Vista.svelte";
  import AvisosDeDireccion from "./AvisosDeDireccion.svelte";
  import BarraDeCorte from "./BarraDeCorte.svelte";
  import BarraMovil from "./BarraMovil.svelte";
  import Lateral from "./Lateral.svelte";
  import PestanasInferiores from "./PestanasInferiores.svelte";
  import PieDeDatos from "./PieDeDatos.svelte";
  import RegionDeAnuncio from "./RegionDeAnuncio.svelte";
  import SaltarAlContenido from "./SaltarAlContenido.svelte";

  let { app }: { app: AplicacionLista } = $props();

  const cierre = $derived(app.cierre);
  const paraRevisar = $derived(cantidadParaRevisar(app.datos, app.direccion.corte));

  // Al cambiar de vista: arriba de todo y el foco al `h1`. No en la primera (el teclado empieza por «Ir al contenido»).
  let primeraVista = true;
  $effect(() => {
    void app.direccion.vista;
    if (primeraVista) {
      primeraVista = false;
      return;
    }
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>("#principal h1")?.focus({ preventScroll: true });
  });

  $effect(() => {
    document.title = tituloDelDocumentoDeRuta(app.direccion.ruta, app.datos, app.direccion.corte);
  });

  // El borde de errores: si una pantalla lanza al dibujarse, se muestra el error; al cambiar de corte o de vista se vuelve a intentar.
  let reiniciar: (() => void) | null = null;
  function alFallar(_error: unknown, reset: () => void): void {
    reiniciar = reset;
    void tick().then(() => document.querySelector<HTMLElement>("#principal h1")?.focus({ preventScroll: true }));
  }
  $effect(() => {
    void app.direccion.corte;
    void app.direccion.vista;
    untrack(() => {
      const volver = reiniciar;
      reiniciar = null;
      volver?.();
    });
  });
</script>

<SaltarAlContenido />

<div class="app">
  <Lateral {app} {paraRevisar} />
  <div class="marco">
    <BarraMovil {app} />
    <BarraDeCorte {app} />
    <AvisosDeDireccion
      avisos={app.direccion.avisos}
      redireccion={app.direccion.redireccion}
      alCerrarAviso={(clase) => app.direccion.cerrarAviso(clase)}
      alCerrarRedireccion={() => app.direccion.cerrarRedireccion()}
    />
    <main id="principal" tabindex="-1">
      <svelte:boundary onerror={alFallar}>
        {#if cierre.estado === "ok"}
          <Vista {app} />
        {:else}
          <PantallaErrorDeCierre error={cierre.error} corte={app.direccion.corte} />
        {/if}
        {#snippet failed(error)}
          {#if error instanceof ErrorDeCierre}
            <PantallaErrorDeCierre {error} corte={app.direccion.corte} />
          {:else}
            <ErrorDeInicio mensaje={error instanceof Error ? error.message : String(error)} />
          {/if}
        {/snippet}
      </svelte:boundary>
    </main>
    <PieDeDatos datos={app.datos} />
  </div>
</div>

<PestanasInferiores {app} {paraRevisar} />
<RegionDeAnuncio {app} />

<style>
  .app {
    min-height: 100dvh;
  }
  .marco {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 100dvh;
  }
  main {
    flex: 1;
    width: 100%;
    max-width: var(--ancho-max);
    padding: var(--e-2) var(--margen) 0;
  }
  @media (min-width: 64rem) {
    .app {
      display: grid;
      grid-template-columns: var(--ancho-lateral) minmax(0, 1fr);
    }
    main {
      padding-top: var(--e-4);
    }
    /* La barra del corte es fija en escritorio: el foco y los saltos a un ancla no quedan debajo de ella. */
    :global(html) {
      scroll-padding-top: 4.75rem;
    }
  }
</style>
