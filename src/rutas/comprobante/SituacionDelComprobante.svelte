<!-- Panel «Situación al …» de una factura o nota de débito que existe al corte: su saldo (cifra grande), los días de atraso con la etiqueta del tramo, el ubicador en la regla de
     días y una frase. Si no tiene saldo: «Cancelada» o «Anulada por nota de crédito», sin ubicador. -->
<script lang="ts">
  import { etiquetaDeCancelado, fraseDeSituacion, rotuloDelUbicador } from "../../lib/dominio/textos.ts";
  import type { VistaDeComprobanteVigente } from "../../lib/vistas/comprobante.ts";
  import Cifra from "../../componentes/Cifra.svelte";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import EtiquetaDeTramo from "../../componentes/EtiquetaDeTramo.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import Ubicador from "../../componentes/Ubicador.svelte";
  import { TEXTO_COMPROBANTE } from "../../componentes/textos-marco.ts";

  let { vista }: { vista: VistaDeComprobanteVigente } = $props();

  const situacion = $derived(vista.situacion);
  const frase = $derived(
    situacion.estado === "con-saldo"
      ? fraseDeSituacion({ estado: "con-saldo", atraso: situacion.atraso, vencimiento: vista.datos.vencimiento, huboCobros: situacion.conCobros })
      : fraseDeSituacion({ estado: "cancelado", fecha: situacion.fechaDelUltimoMovimiento, anulado: situacion.estado === "anulado" }),
  );
</script>

<Panel titulo={TEXTO_COMPROBANTE.situacion(vista.corte)} id="t-sit">
  <div class="situacion">
    <p class="rotulo">{TEXTO_COMPROBANTE.saldo}</p>
    <Cifra importe={situacion.saldo} tamano="grande" />
    <p class="linea">
      {#if situacion.estado === "con-saldo"}
        {#if situacion.atraso >= 1}<span>{TEXTO_COMPROBANTE.diasDeAtraso(situacion.atraso)}</span>{/if}
        <EtiquetaDeTramo tramo={situacion.tramo} />
      {:else if situacion.estado === "anulado"}
        <Etiqueta tono="neutro">{etiquetaDeCancelado(true)}</Etiqueta>
      {:else}
        <Etiqueta tono="ok" icono="check">{etiquetaDeCancelado(false)}</Etiqueta>
      {/if}
    </p>
    {#if situacion.estado === "con-saldo"}
      <div class="ubicador">
        <Ubicador
          tramo={situacion.ubicador.tramo}
          milesimas={situacion.ubicador.milesimas}
          borde={situacion.ubicador.borde}
          rotulo={rotuloDelUbicador(situacion.atraso)}
          unidad={TEXTO_COMPROBANTE.escalaDeDias}
        />
      </div>
    {/if}
    <p class="frase">{frase}</p>
  </div>
</Panel>

<style>
  .situacion {
    min-width: 0;
  }
  .rotulo {
    margin-bottom: var(--e-1);
  }
  .linea {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.625rem;
    margin-top: var(--e-2);
    font-size: var(--t-medio);
    font-weight: 600;
  }
  .ubicador {
    margin-top: var(--e-4);
  }
  .frase {
    max-width: 60ch;
    margin-top: var(--e-3);
    color: var(--c-texto-2);
    font-size: var(--t-medio);
  }
</style>
