<!-- Meses: el gráfico grande de facturado con IVA frente a cobrado y, debajo, los mismos doce meses en tabla con los cinco importes.
     Dibuja el modelo de vista `vistaMeses`: no calcula ninguna cifra. -->
<script lang="ts">
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import { vistaMeses } from "../lib/vistas/meses.ts";
  import Cabecera from "../componentes/Cabecera.svelte";
  import GraficoMeses from "../componentes/GraficoMeses.svelte";
  import Panel from "../componentes/Panel.svelte";
  import { TEXTO_GRAFICO, TEXTO_MESES } from "../componentes/textos-marco.ts";
  import TablaDeMeses from "./meses/TablaDeMeses.svelte";
  import { SERIES_DEL_GRAFICO, ariaLabelDelGrafico, avisoDesde, mesesDelGrafico, renglonResaltado } from "./resumen/meses-en-pantalla.ts";

  let { app }: { app: AplicacionLista } = $props();

  const corte = $derived(app.direccion.corte);
  const v = $derived(vistaMeses(app.datos, corte));
  const primero = $derived(v.meses[0]?.mes ?? v.mesDelCorte);
</script>

<Cabecera titulo={TEXTO_MESES.titulo(primero, v.mesDelCorte)} bajada={TEXTO_MESES.bajada} />

<div class="pila">
  <Panel titulo={TEXTO_MESES.panelDelGrafico}>
    <GraficoMeses
      alto="alto"
      subtitulo={TEXTO_GRAFICO.leyendaDeLaEmpresa}
      series={SERIES_DEL_GRAFICO}
      meses={mesesDelGrafico(v)}
      mesDeCorte={v.mesDelCorte}
      ariaLabel={ariaLabelDelGrafico(v)}
      renglonDeCorte={renglonResaltado(v)}
      avisoDesde={avisoDesde(v)}
    />
  </Panel>
  <Panel titulo={TEXTO_MESES.panelDeLaTabla} meta={TEXTO_MESES.marcaDelCorte} relleno="ninguno">
    <TablaDeMeses {app} {v} />
  </Panel>
</div>

<style>
  .pila {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
  }
</style>
