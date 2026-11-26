<!-- Movimiento del mes del corte: lo facturado sin IVA y lo cobrado, con las retenciones de lo cobrado. Cada importe lleva a su desglose. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaResumen } from "../../lib/vistas/resumen.ts";
  import type { RefDeMedida } from "../../lib/vistas/tipos.ts";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import { TEXTO_RESUMEN } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./cifras.ts";

  let { app, v }: { app: AplicacionLista; v: VistaResumen } = $props();

  const corte = $derived(v.corte);
  const m = $derived(v.movimiento);
  const enlace = (ref: RefDeMedida): string => app.direccion.enlace(rutaDeDesglose(ref, false));
  const nombre = (ref: RefDeMedida): string => nombreDeCifra(ref, corte, app.datos);
</script>

<Panel titulo={TEXTO_RESUMEN.movimientoDelMes(m.mes)} relleno="ninguno">
  <div class="dos">
    <div class="bloque">
      <p class="rotulo">{TEXTO_RESUMEN.facturacionSinIva}</p>
      <div class="valor">
        <CifraEnlace href={enlace(m.facturacion.medida)} importe={m.facturacion.importe} ref={m.facturacion.medida} {corte} nombre={nombre(m.facturacion.medida)} tamano="cifra" />
      </div>
      <p class="sec">{TEXTO_RESUMEN.comprobantes(m.comprobantes)}</p>
    </div>
    <div class="bloque">
      <p class="rotulo">{TEXTO_RESUMEN.cobranza}</p>
      <div class="valor">
        <CifraEnlace href={enlace(m.cobranza.medida)} importe={m.cobranza.importe} ref={m.cobranza.medida} {corte} nombre={nombre(m.cobranza.medida)} tamano="cifra" />
      </div>
      <p class="sec">
        {TEXTO_RESUMEN.deLoCualRetenciones}
        <span class="retenciones"><CifraEnlace href={enlace(m.retenciones.medida)} importe={m.retenciones.importe} ref={m.retenciones.medida} {corte} nombre={nombre(m.retenciones.medida)} /></span>
      </p>
      <p class="sec">{TEXTO_RESUMEN.recibos(m.recibos)}</p>
    </div>
  </div>
</Panel>

<style>
  .dos {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .bloque {
    padding: 0.875rem var(--e-4);
  }
  .bloque + .bloque {
    border-top: 1px solid var(--c-borde);
  }
  .valor {
    margin-top: var(--e-1);
  }
  .sec {
    margin-top: var(--e-1);
    color: var(--c-texto-2);
    font-size: var(--t-medio);
  }
  .retenciones {
    --cifra-peso: 650;
    color: var(--c-texto);
  }

  /* Con lugar (el panel mide 30rem o más) los dos bloques van lado a lado; en la columna angosta del escritorio, uno sobre otro. */
  @container interior (min-width: 30rem) {
    .dos {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .bloque + .bloque {
      border-top: 0;
      border-left: 1px solid var(--c-borde);
    }
  }
</style>
