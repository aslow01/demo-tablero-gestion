<!-- La leyenda de las siglas del talón (FA, ND, NC) al pie de una tabla de comprobantes: la sigla sola no la entiende quien no es del oficio (cada sigla lleva además su nombre completo
     en el `title` del talón y para lectores de pantalla). La usan todas las tablas que muestran talones: Comprobantes, la ficha del cliente y el Desglose. -->
<script lang="ts">
  import { TEXTO_TABLA } from "./textos-marco.ts";
</script>

<p class="leyenda">{TEXTO_TABLA.leyendaDeSiglas}</p>

<style>
  .leyenda {
    padding: var(--e-3) var(--e-4);
    border-top: 1px solid var(--c-borde);
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    line-height: 1.4;
  }
</style>
