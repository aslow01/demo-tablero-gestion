<!-- Avisos de la dirección: el del corte inválido, el del mes inválido y el del cambio a «Otros» inexistente. Se cierran de a uno. -->
<script lang="ts">
  // La región `role="status"` está siempre en la página (vacía mide 0): así lo que llega con la página abierta se anuncia. Cada `Aviso` cierra con su propio nombre
  // (con dos a la vez, cada botón dice cuál cierra) y, al cerrarse, pasa el foco al aviso vecino o al `h1`.
  // Recibe los avisos y los modos de cerrarlos (y no la aplicación) para que se pueda ver en la galería con avisos de prueba.
  import { avisoDeOtrosInexistente } from "../../lib/dominio/textos.ts";
  import type { Redireccion } from "../../lib/estado/direccion.svelte.ts";
  import type { AvisoDeDireccion } from "../../lib/estado/enrutador.ts";
  import Aviso from "../Aviso.svelte";
  import { TEXTO_AVISOS, TEXTO_MARCO } from "../textos-marco.ts";

  let {
    avisos,
    redireccion = null,
    alCerrarAviso,
    alCerrarRedireccion,
  }: {
    avisos: readonly AvisoDeDireccion[];
    redireccion?: Redireccion | null;
    alCerrarAviso: (clase: AvisoDeDireccion["clase"]) => void;
    alCerrarRedireccion: () => void;
  } = $props();
</script>

<div class="avisos" class:con-avisos={avisos.length > 0 || redireccion !== null} id="avisos" role="status" aria-label={TEXTO_AVISOS.region}>
  {#each avisos as aviso (aviso.clase)}
    <Aviso
      tono="revisar"
      icono="alerta"
      alCerrar={() => alCerrarAviso(aviso.clase)}
      etiquetaDeCerrar={aviso.clase === "corte" ? TEXTO_MARCO.cerrarAvisoDeCorte : TEXTO_MARCO.cerrarAvisoDelMes}
    >
      <p>{aviso.texto}</p>
    </Aviso>
  {/each}
  {#if redireccion !== null}
    <Aviso tono="revisar" icono="alerta" alCerrar={alCerrarRedireccion} etiquetaDeCerrar={TEXTO_MARCO.cerrarAvisoDeOtros}>
      <p>{avisoDeOtrosInexistente(redireccion.corte)}</p>
    </Aviso>
  {/if}
</div>

<style>
  .avisos {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding-inline: var(--margen);
  }
  /* Sin avisos mide 0; con avisos, el aire de arriba separa de la barra del corte. */
  .con-avisos {
    padding-top: var(--e-2);
  }
  .avisos > :global(.aviso) {
    max-width: 80rem;
  }
</style>
