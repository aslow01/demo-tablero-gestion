<!-- La etiqueta de un tramo de antigüedad: la muestra de color del tramo y su nombre escrito (el color nunca va solo). Tono: gris (no vencido), ámbar (1 a 60 días),
     rojo (61 o más). La usan todas las pantallas que muestran un tramo (Resumen, Comprobantes, Clientes, Cliente, Comprobante y Desglose). -->
<script lang="ts">
  import type { Tramo } from "../lib/dominio/antiguedad.ts";
  import { ROTULO_DE_TRAMO } from "../lib/dominio/textos.ts";
  import Etiqueta from "./Etiqueta.svelte";
  import { numeroDeTramo, tonoDeTramo } from "./tramos.ts";

  let { tramo }: { tramo: Tramo } = $props();
</script>

<Etiqueta tono={tonoDeTramo(tramo)} muestra={numeroDeTramo(tramo)}>{ROTULO_DE_TRAMO[tramo]}</Etiqueta>
