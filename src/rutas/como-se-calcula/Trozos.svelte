<!-- Un párrafo de «Cómo se calcula»: trozos de texto y enlaces a otras pantallas (cada ejemplo se mira a su fecha). Todo el texto va como texto, nunca como HTML. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { TrozoDeComoSeCalcula } from "../../lib/vistas/como-se-calcula.ts";

  let { app, trozos }: { app: AplicacionLista; trozos: readonly TrozoDeComoSeCalcula[] } = $props();
</script>

{#each trozos as trozo, i (i)}{#if trozo.tipo === "texto"}{trozo.texto}{:else}<a href={app.direccion.enlace(trozo.ruta, trozo.corte)}>{trozo.texto}</a>{/if}{/each}
