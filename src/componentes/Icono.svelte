<!-- Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/componentes/Icono.svelte.
     Cambios: los íconos son rellenos (fill: currentColor), no de trazo; el tamaño por defecto es el de los íconos chicos. -->
<script lang="ts">
  // Un ícono del sprite de index.html. Decorativo: el texto que lo acompaña es el que se lee (aria-hidden).
  // El tamaño se cambia desde afuera con la propiedad --icono-tam (por defecto 1.125rem; 1.5rem para los de navegación).
  import type { NombreIcono } from "./tipos.ts";

  let { nombre }: { nombre: NombreIcono } = $props();
</script>

<svg class="icono" aria-hidden="true" focusable="false"><use href={`#i-${nombre}`} /></svg>

<style>
  .icono {
    flex: none;
    width: var(--icono-tam, 1.125rem);
    height: var(--icono-tam, 1.125rem);
    fill: currentColor;
    vertical-align: middle;
  }
</style>
