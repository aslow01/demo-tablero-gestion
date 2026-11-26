<!-- Pantalla de un comprobante (`#/comprobante/{id}`): su situación al corte (saldo, atraso, tramo y ubicador), sus datos y sus movimientos con el saldo corrido. Tres formas:
     una factura o nota de débito que existe al corte; una nota de crédito (no tiene saldo propio: resta a su factura); y un comprobante emitido después del corte (no existía:
     ofrece verlo al cierre de su mes). Los datos salen de `vistaComprobante`; esta pantalla no calcula ni escribe cifras. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { formatearImporte } from "../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import type { RutaNavegable } from "../lib/estado/enrutador.ts";
  import { vistaComprobante } from "../lib/vistas/comprobante.ts";
  import Panel from "../componentes/Panel.svelte";
  import { TEXTO_COMPROBANTE, TEXTO_DESGLOSE } from "../componentes/textos-marco.ts";
  import Cabecera from "../componentes/Cabecera.svelte";
  import TalonDe from "./cliente/TalonDe.svelte";
  import DatosDelComprobante from "./comprobante/DatosDelComprobante.svelte";
  import MovimientosDelComprobante from "./comprobante/MovimientosDelComprobante.svelte";
  import PosteriorAlCorte from "./comprobante/PosteriorAlCorte.svelte";
  import SituacionDelComprobante from "./comprobante/SituacionDelComprobante.svelte";

  type Ruta = Extract<RutaNavegable, { tipo: "comprobante" }>;
  let { app, ruta }: { app: AplicacionLista; ruta: Ruta } = $props();

  // El enrutador ya comprobó que el comprobante existe.
  const corte = $derived(app.direccion.corte);
  const vista = $derived(vistaComprobante(app.datos, corte, ruta.comprobanteId));
  const clienteId = $derived(vista.datos.clienteId);

  // Pasa a ser la «fila elegida» de la pantalla desde la que se abrió (la anterior del recorrido): al volver ahí queda marcada.
  $effect(() => {
    app.memoria.elegirFila({ comprobanteId: ruta.comprobanteId, clienteId }, untrack(() => app.direccion.destinoDeAtras));
  });
</script>

{#if vista.clase === "posterior-al-corte"}
  <PosteriorAlCorte {app} {vista} />
{:else}
  <Cabecera viaja>
    {#snippet titulo()}<TalonDe {app} id={vista.datos.id} tipo={vista.datos.tipo} enlace={false} grande />{/snippet}
    {#snippet bajada()}<a href={app.direccion.enlace({ tipo: "cliente", clienteId })} data-viaja>{vista.datos.nombreDelCliente}</a> · {TEXTO_DESGLOSE.alCorte(corte)}{/snippet}
  </Cabecera>

  <div class="pila">
    {#if vista.clase === "nota-de-credito"}
      <div class="dos-col">
        <Panel titulo={TEXTO_COMPROBANTE.situacion(corte)} id="t-sit">
          <p class="frase">
            {TEXTO_COMPROBANTE.notaDeCreditoInicio(formatearImporte(vista.datos.total))}
            <TalonDe {app} id={vista.asociada.id} tipo={vista.asociada.tipo} />{TEXTO_COMPROBANTE.notaDeCreditoFin}
          </p>
        </Panel>
        <DatosDelComprobante {app} datos={vista.datos} />
      </div>
    {:else}
      <div class="dos-col">
        <SituacionDelComprobante {vista} />
        <DatosDelComprobante {app} datos={vista.datos} />
      </div>
      <MovimientosDelComprobante {app} {vista} />
    {/if}
  </div>
{/if}

<style>
  .pila {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
  }
  /* Una columna en el celular; dos iguales en la tableta; con el lateral (escritorio), la situación un poco más ancha que los datos. */
  .dos-col {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  @media (min-width: 48rem) {
    .dos-col {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
    }
  }
  @media (min-width: 64rem) {
    .dos-col {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    }
  }
  .frase {
    max-width: 60ch;
    font-size: var(--t-medio);
  }
</style>
