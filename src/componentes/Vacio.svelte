<!-- Propio de esta demo. -->
<script lang="ts">
  // Estado vacío: una regla de cinco casilleros con borde de guiones (la regla de tramos, sin nada que repartir), la frase y, si hace falta, una segunda línea y una acción
  // («Borrar la búsqueda»). No es una región viva: si el vacío aparece por una acción de la persona, lo anuncia la barra de estado del panel o `#estado-lista`.
  //
  // - Va dentro de un panel. Con `conMargen` se separa del borde (un panel con `relleno="ninguno"`); sin él llena el interior (un panel con relleno normal).
  import type { Snippet } from "svelte";

  let {
    texto,
    detalle,
    accion,
    conMargen = false,
  }: {
    /** La frase principal: «No hay saldo a cobrar al 31/10/2026.» */
    texto: string;
    /** Segunda línea, más suave. */
    detalle?: string;
    /** Un control para salir del vacío (botón o enlace). */
    accion?: Snippet;
    conMargen?: boolean;
  } = $props();
</script>

<div class="vacio" class:con-margen={conMargen}>
  <span class="regla-vacia" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
  <p class="texto">{texto}</p>
  {#if detalle !== undefined && detalle !== ""}<p class="detalle">{detalle}</p>{/if}
  {#if accion !== undefined}{@render accion()}{/if}
</div>

<style>
  .vacio {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.625rem;
    min-width: 0;
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
  .vacio.con-margen {
    margin: var(--e-4);
  }
  .regla-vacia {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    width: min(7.5rem, 100%);
    height: 0.875rem;
  }
  .regla-vacia i {
    border: 1.5px dashed var(--c-borde-fuerte);
  }
  .texto {
    font-size: var(--t-cuerpo);
    color: var(--c-texto);
  }
  .detalle {
    font-size: var(--t-medio);
    color: var(--c-texto-2);
  }

  @media (forced-colors: active) {
    .vacio,
    .regla-vacia i {
      border-color: CanvasText;
    }
  }
</style>
