<!-- La aplicación: crea el estado una sola vez (datos de ejemplo, dirección, memoria de la vista y verificación del cierre) y dibuja el marco. Si los datos de ejemplo
     no pasan las validaciones, no hay marco ni cálculo: solo la pantalla de error al iniciar. -->
<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import Marco from "./componentes/marco/Marco.svelte";
  import { crearAplicacion } from "./lib/estado/aplicacion.svelte.ts";
  import { movimientoDelNavegador } from "./lib/estado/transicion.ts";
  import { ubicacionDelNavegador } from "./lib/estado/ubicacion.ts";
  import ErrorDeInicio from "./rutas/ErrorDeInicio.svelte";

  // El movimiento entre pantallas (docs/diseno-ui.md, 3.6): el estado de la dirección le pasa cada cambio de pantalla (no de corte) y, para que el nombre
  // de un comprobante o de un cliente viaje de la tabla al título, se escuchan los clics en esos enlaces.
  const movimiento = movimientoDelNavegador(tick);
  const app = crearAplicacion(ubicacionDelNavegador(), { alCambiarVista: movimiento.alCambiarVista });

  onMount(() => movimiento.escuchar());
  onDestroy(() => {
    if (app.estado === "ok") app.destruir();
  });
</script>

{#if app.estado === "ok"}
  <Marco {app} />
{:else}
  <main class="contenedor" id="principal" tabindex="-1">
    <ErrorDeInicio mensaje={app.mensaje} />
  </main>
{/if}

<style>
  main {
    padding-block: var(--e-5);
  }
</style>
