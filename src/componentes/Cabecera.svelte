<!-- Encabezado de toda pantalla: una línea previa opcional, el `h1` y la bajada. El `h1` lleva `tabindex="-1"`: el marco le pasa el foco al cambiar
     de pantalla. El título es un texto o un fragmento (el talón del comprobante, el nombre del cliente con su ficha). Un solo componente para las ocho pantallas y las fichas,
     para no repetir el marcado y los estilos. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    previo,
    titulo,
    bajada,
    viaja = false,
  }: {
    /** Texto chico sobre el título («¿De dónde sale este número?», la razón social en un comprobante emitido después del corte). */
    previo?: string;
    titulo: string | Snippet;
    /** La bajada, como fragmento (puede llevar enlaces y cifras) o como texto. Sin ella no se dibuja el renglón. */
    bajada?: string | Snippet;
    /** El título es el destino del nombre que viaja de la tabla (`data-viaja`; lo usa el movimiento entre pantallas). */
    viaja?: boolean;
  } = $props();
</script>

<div class="cab">
  {#if previo !== undefined}<p class="previo">{previo}</p>{/if}
  <h1 tabindex="-1" data-viaja={viaja ? "" : undefined}>{#if typeof titulo === "string"}{titulo}{:else}{@render titulo()}{/if}</h1>
  {#if bajada !== undefined}<p class="bajada">{#if typeof bajada === "string"}{bajada}{:else}{@render bajada()}{/if}</p>{/if}
</div>

<style>
  .cab {
    margin: var(--e-2) 0 var(--e-4);
  }
  .previo {
    margin-bottom: var(--e-1);
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 650;
  }
  .bajada {
    max-width: 72ch;
    margin-top: 0.375rem;
    color: var(--c-texto-2);
    font-size: var(--t-medio);
  }
  /* El enlace de la bajada (el cliente) es texto firme con subrayado fino, como los nombres de las tablas. */
  .bajada :global(a:not([class])) {
    color: var(--c-texto);
    font-weight: 650;
    text-decoration: underline 1px var(--c-borde-fuerte);
    text-underline-offset: 3px;
  }
  @media (hover: hover) {
    .bajada :global(a:not([class]):hover) {
      text-decoration-color: var(--c-enlace);
      text-decoration-thickness: 2px;
    }
  }
</style>
