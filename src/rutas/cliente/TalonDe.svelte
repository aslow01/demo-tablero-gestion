<!-- Talón de un comprobante de los datos: la sigla («FA»), el nombre largo para lectores de pantalla y el código. Con `enlace` lleva a su pantalla. -->
<script lang="ts">
  import { ROTULO_DE_TIPO, SIGLA_DE_TIPO } from "../../lib/dominio/textos.ts";
  import type { TipoCmp } from "../../lib/dominio/tipos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { codigoDeComprobante } from "../../lib/vistas/rotulos.ts";
  import Talon from "../../componentes/Talon.svelte";

  let {
    app,
    id,
    tipo,
    enlace = true,
    grande = false,
    viaja = false,
  }: {
    app: AplicacionLista;
    id: string;
    tipo: TipoCmp;
    /** `false`: es un dato (el título de la pantalla), no un enlace. */
    enlace?: boolean;
    grande?: boolean;
    /** El talón es un origen o un destino del movimiento entre pantallas (`data-viaja`). */
    viaja?: boolean;
  } = $props();

  const href = $derived(enlace ? app.direccion.enlace({ tipo: "comprobante", comprobanteId: id }) : undefined);
</script>

<Talon tipoCorto={SIGLA_DE_TIPO[tipo]} tipoLargo={ROTULO_DE_TIPO[tipo]} numero={codigoDeComprobante(id)} {href} {grande} {viaja} />
