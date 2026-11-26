<!-- Panel «Movimientos» de un comprobante: la emisión, las notas de crédito y los cobros, con el saldo corrido y el saldo al corte como total. Los movimientos posteriores a la fecha
     de corte van aparte, en una tabla apagada con su etiqueta: se muestran pero no cuentan. El número de un recibo abre su detalle en el lugar. -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaDeComprobanteVigente } from "../../lib/vistas/comprobante.ts";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import type { TotalDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_COMPROBANTE, TEXTO_ETIQUETAS } from "../../componentes/textos-marco.ts";
  import { filasDeComprobante } from "../cliente/movimientos.ts";
  import TablaDeMovimientos from "../cliente/TablaDeMovimientos.svelte";

  let { app, vista }: { app: AplicacionLista; vista: VistaDeComprobanteVigente } = $props();

  const filas = $derived(filasDeComprobante(vista.movimientos, "m"));
  const posteriores = $derived(filasDeComprobante(vista.posteriores, "p"));
  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_COMPROBANTE.saldoAl(vista.corte),
    cubre: 4,
    celdas: { saldo: { texto: formatearImporte(vista.situacion.saldo), centavos: vista.situacion.saldo, formula: "debe-haber" } },
  });
</script>

<Panel titulo={TEXTO_COMPROBANTE.movimientos} meta={TEXTO_COMPROBANTE.cantidadDeMovimientos(filas.length)} id="t-mov-c" relleno="ninguno">
  <TablaDeMovimientos {app} titulo={TEXTO_COMPROBANTE.movimientos} {filas} conCifras {total} />
  {#if posteriores.length > 0}
    <TablaDeMovimientos {app} titulo={TEXTO_ETIQUETAS.despuesDelCorte} filas={posteriores} conCifras={false} variante="posteriores">
      {#snippet encabezado()}
        <Etiqueta tono="neutro" icono="reloj">{TEXTO_ETIQUETAS.despuesDelCorte}</Etiqueta> <span class="aclaracion">{TEXTO_ETIQUETAS.noCuentanParaElSaldo(vista.corte)}</span>
      {/snippet}
    </TablaDeMovimientos>
  {/if}
</Panel>

<style>
  .aclaracion {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
  }
</style>
