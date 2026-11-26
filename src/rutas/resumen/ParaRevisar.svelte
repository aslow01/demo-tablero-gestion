<!-- Para revisar: lo cobrado sin imputar que conviene mirar, en dos tablas (pagos a cuenta de clientes con deuda, saldos a favor de clientes sin deuda).
     La pantalla no dibuja este panel si no hay ninguna fila. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaResumen } from "../../lib/vistas/resumen.ts";
  import Panel from "../../componentes/Panel.svelte";
  import { TEXTO_RESUMEN } from "../../componentes/textos-marco.ts";
  import GrupoDeACuenta from "./GrupoDeACuenta.svelte";

  let { app, v }: { app: AplicacionLista; v: VistaResumen } = $props();
</script>

<Panel titulo={TEXTO_RESUMEN.paraRevisar} meta={TEXTO_RESUMEN.recibos(v.paraRevisar.cantidad)} relleno="ninguno">
  {#if v.paraRevisar.pagosACuenta.filas.length > 0}
    <GrupoDeACuenta {app} grupo={v.paraRevisar.pagosACuenta} tipo="pagos" corte={v.corte} />
  {/if}
  {#if v.paraRevisar.saldosAFavor.filas.length > 0}
    <GrupoDeACuenta {app} grupo={v.paraRevisar.saldosAFavor} tipo="saldos" corte={v.corte} />
  {/if}
</Panel>
