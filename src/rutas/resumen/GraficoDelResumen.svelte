<!-- Facturado y cobrado de los últimos 12 meses en el Resumen. En escritorio es el gráfico con su tabla («Ver los 12 meses como tabla»); en el celular y la
     tableta no entra en un panel, y en su lugar hay una sola fila que lleva a la sección Meses con el mes del corte. Los dos están siempre en el marcado; la consulta de medios muestra uno. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaResumen } from "../../lib/vistas/resumen.ts";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import FilaEnlace from "../../componentes/FilaEnlace.svelte";
  import GraficoMeses from "../../componentes/GraficoMeses.svelte";
  import Icono from "../../componentes/Icono.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import { TEXTO_GRAFICO, TEXTO_RESUMEN } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./cifras.ts";
  import {
    COLUMNAS_DE_MESES,
    SERIES_DEL_GRAFICO,
    ariaLabelDelGrafico,
    avisoDesde,
    mesesDelGrafico,
    renglonDelMesDelCorte,
    renglonResaltado,
    tablaDelGrafico,
  } from "./meses-en-pantalla.ts";

  let { app, v }: { app: AplicacionLista; v: VistaResumen } = $props();

  const corte = $derived(v.corte);
  const serie = $derived(v.meses);
  const hrefDeMeses = $derived(app.direccion.enlace({ tipo: "meses" }));
</script>

<div class="escritorio">
  <Panel titulo={TEXTO_RESUMEN.graficoTitulo(serie.meses.length)}>
    {#snippet controles()}
      <a class="abrir" href={hrefDeMeses}>{TEXTO_RESUMEN.abrirMeses}<Icono nombre="flecha" /></a>
    {/snippet}
    <GraficoMeses
      subtitulo={TEXTO_GRAFICO.leyendaDeLaEmpresa}
      series={SERIES_DEL_GRAFICO}
      meses={mesesDelGrafico(serie)}
      mesDeCorte={serie.mesDelCorte}
      ariaLabel={ariaLabelDelGrafico(serie)}
      renglonDeCorte={renglonResaltado(serie)}
      avisoDesde={avisoDesde(serie)}
      tabla={tablaDelGrafico(serie)}
      textoDeTabla={TEXTO_GRAFICO.verLosMesesComoTabla(serie.meses.length)}
    >
      {#snippet celda({ mes, columna, importe })}
        {@const ref = { clave: COLUMNAS_DE_MESES[columna]?.clave ?? "facturacion-mes", mes }}
        <CifraEnlace href={app.direccion.enlace(rutaDeDesglose(ref, true))} {importe} {ref} {corte} nombre={nombreDeCifra(ref, corte, app.datos)} />
      {/snippet}
    </GraficoMeses>
  </Panel>
</div>

<div class="movil">
  <FilaEnlace href={hrefDeMeses} titulo={TEXTO_RESUMEN.graficoTitulo(serie.meses.length)} detalle={renglonDelMesDelCorte(serie)} />
</div>

<style>
  .escritorio {
    display: none;
  }
  @media (min-width: 64rem) {
    .escritorio {
      display: block;
    }
    .movil {
      display: none;
    }
  }
  .abrir {
    --icono-tam: 1rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    min-height: var(--alto-tactil);
    color: var(--c-enlace);
    font-size: var(--t-medio);
    font-weight: 650;
    text-decoration: none;
  }
  .abrir :global(.icono) {
    transition: transform var(--m-rapido) var(--m-curva);
  }
  @media (hover: hover) {
    .abrir:hover {
      text-decoration: underline;
    }
    .abrir:hover :global(.icono) {
      transform: translateX(2px);
    }
  }
</style>
