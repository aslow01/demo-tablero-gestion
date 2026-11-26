<!-- Panel «Facturación, últimos 12 meses» de la ficha del cliente: gráfico de su facturación sin IVA y, debajo, los mismos meses como tabla (cada importe se abre en su desglose). -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { FacturacionDelCliente } from "../../lib/vistas/meses.ts";
  import { etiquetaDelGraficoDelCliente } from "../../lib/vistas/rotulos.ts";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import GraficoMeses from "../../componentes/GraficoMeses.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import type { MesDelGrafico, SerieDelGrafico, TablaDelGrafico } from "../../componentes/tipos-graficos.ts";
  import { TEXTO_CLIENTE, TEXTO_GRAFICO, TEXTO_MESES } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./enlaces.ts";

  let { app, facturacion, corte }: { app: AplicacionLista; facturacion: FacturacionDelCliente; corte: string } = $props();

  const series: SerieDelGrafico[] = [{ rotulo: TEXTO_GRAFICO.serieFacturacionSinIva, clase: "facturado" }];
  const meses = $derived<MesDelGrafico[]>(facturacion.meses.map((m) => ({ mes: m.mes, valores: [m.facturacion.importe] })));
  const titulo = $derived(TEXTO_CLIENTE.facturacion(facturacion.meses.length));
  const tabla = $derived<TablaDelGrafico>({
    titulo,
    columnas: [TEXTO_MESES.facturacionSinIva],
    claves: ["fa"],
    filas: facturacion.meses.map((m) => ({ mes: m.mes, importes: [m.facturacion.importe] })),
    total: { rotulo: TEXTO_MESES.totalDeLosMeses(facturacion.meses.length), importes: [facturacion.total] },
  });
  /** Qué cifra es la celda de un mes: su facturación sin IVA, de este cliente. */
  const referenciaDe = (mes: string) => facturacion.meses.find((m) => m.mes === mes)?.facturacion;
</script>

<Panel {titulo} id="t-facc">
  <GraficoMeses
    subtitulo={TEXTO_GRAFICO.leyendaDelCliente}
    {series}
    {meses}
    mesDeCorte={facturacion.mesDelCorte}
    ariaLabel={etiquetaDelGraficoDelCliente(facturacion)}
    avisoDesde={facturacion.completa ? undefined : TEXTO_GRAFICO.hayDatosDesde(facturacion.desde)}
    {tabla}
    textoDeTabla={TEXTO_GRAFICO.verLosMesesComoTabla(facturacion.meses.length)}
  >
    {#snippet celda({ mes, importe })}
      {@const cifra = referenciaDe(mes)}
      {#if cifra !== undefined}
        <CifraEnlace href={app.direccion.enlace(rutaDeDesglose(cifra.medida))} {importe} ref={cifra.medida} {corte} nombre={nombreDeCifra(app.datos, cifra.medida, corte)} />
      {/if}
    {/snippet}
  </GraficoMeses>
</Panel>
