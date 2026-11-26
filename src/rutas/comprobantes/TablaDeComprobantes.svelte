<!-- La tabla de la sección Comprobantes: un comprobante con saldo por fila, del más atrasado al menos, con su total.
     Tabla completa, tabla sin las columnas opcionales o tarjetas según el ancho de la propia tabla (lo decide `Tabla`). Recibe el modelo de vista ya calculado:
     no calcula ninguna cifra (el total es la suma de las filas que se ven, y vale lo mismo que la medida entera cuando no hay búsqueda). -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import { ROTULO_DE_TIPO, SIGLA_DE_TIPO } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { codigoDeComprobante, sugerenciaDeBusquedaDeComprobantes, vacioDeLaListaDeComprobantes } from "../../lib/vistas/rotulos.ts";
  import type { FilaDeComprobante, VistaComprobantes } from "../../lib/vistas/comprobantes.ts";
  import Boton from "../../componentes/Boton.svelte";
  import LeyendaDeSiglas from "../../componentes/LeyendaDeSiglas.svelte";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { CeldaDeTotal, ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import Talon from "../../componentes/Talon.svelte";
  import { TEXTO_COMPROBANTES, TEXTO_MARCO, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import Vacio from "../../componentes/Vacio.svelte";
  import EtiquetaDeTramo from "../../componentes/EtiquetaDeTramo.svelte";

  let { app, vista, alBorrarBusqueda }: { app: AplicacionLista; vista: VistaComprobantes; alBorrarBusqueda: () => void } = $props();

  const columnas: ColumnaDeTabla<FilaDeComprobante>[] = [
    { id: "comprobante", titulo: TEXTO_TABLA.comprobante, papel: "principal" },
    { id: "cliente", titulo: TEXTO_TABLA.cliente, papel: "principal" },
    { id: "emision", titulo: TEXTO_TABLA.emision, cifras: true, opcional: true },
    { id: "vencimiento", titulo: TEXTO_TABLA.vencimiento, cifras: true, papel: "secundaria" },
    { id: "saldo", titulo: TEXTO_TABLA.saldo, numerica: true, importe: (f) => f.saldo },
    {
      id: "atraso",
      titulo: TEXTO_TABLA.atraso,
      numerica: true,
      opcional: true,
      textoEnLinea: (f) => (f.atraso >= 1 ? TEXTO_TABLA.dias(f.atraso) : ""),
      enLineaEn: "tramo",
    },
    { id: "tramo", titulo: TEXTO_TABLA.tramo, papel: "etiqueta" },
  ];

  /** La celda del total: el importe, los centavos y, si es una medida entera, de cuál (`data-m`). */
  function celdaDeTotal(): CeldaDeTotal {
    const celda: CeldaDeTotal = { texto: formatearImporte(vista.total.importe), centavos: vista.total.importe };
    if (vista.total.medida !== null) celda.medida = claveDeMedida(vista.total.medida, vista.corte);
    return celda;
  }
  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_TABLA.totalDeComprobantes(vista.filas.length),
    cubre: 2,
    celdas: { saldo: celdaDeTotal() },
  });

  const elegida = $derived(app.memoria.filaElegidaEn(app.direccion.ruta)?.comprobanteId ?? null);
  const sugerencia = $derived(sugerenciaDeBusquedaDeComprobantes(app.datos, vista.corte));
</script>

{#snippet celda(f: FilaDeComprobante, c: ColumnaDeTabla<FilaDeComprobante>)}
  {#if c.id === "comprobante"}
    <span class="talon-de-fila"
      ><Talon
        tipoCorto={SIGLA_DE_TIPO[f.tipo]}
        tipoLargo={ROTULO_DE_TIPO[f.tipo]}
        numero={codigoDeComprobante(f.comprobanteId)}
        href={app.direccion.enlace({ tipo: "comprobante", comprobanteId: f.comprobanteId })}
        viaja
      /></span
    >
  {:else if c.id === "cliente"}
    <a href={app.direccion.enlace({ tipo: "cliente", clienteId: f.clienteId })}>{f.nombreDelCliente}</a>
  {:else if c.id === "emision"}
    {formatearFecha(f.emision)}
  {:else if c.id === "vencimiento"}
    <!-- En tarjetas la fecha va sola en su renglón y su rótulo se lee; en la tabla el encabezado ya lo dice. -->
    <span class="rotulo-de-tarjeta">{TEXTO_TABLA.vencimiento}:{" "}</span>{formatearFecha(f.vencimiento)}
  {:else if c.id === "saldo"}
    {formatearImporte(f.saldo)}
  {:else if c.id === "atraso"}
    {f.atraso >= 1 ? TEXTO_TABLA.dias(f.atraso) : TEXTO_TABLA.sinAtraso}
  {:else if c.id === "tramo"}
    <EtiquetaDeTramo tramo={f.tramo} />
  {/if}
{/snippet}

<Tabla
  titulo={TEXTO_COMPROBANTES.titulo(vista.corte)}
  {columnas}
  filas={vista.filas}
  clave={(f) => f.comprobanteId}
  {celda}
  {total}
  {elegida}
  textoDeElegida="({TEXTO_MARCO.ultimaFilaAbierta})"
  tarjetasDesde={43.5}
>
  {#snippet vacia()}
    <Vacio conMargen texto={vacioDeLaListaDeComprobantes(vista)} detalle={vista.conBusqueda && sugerencia !== null ? sugerencia : undefined}>
      {#snippet accion()}
        {#if vista.conBusqueda}<Boton variante="secundario" onclick={alBorrarBusqueda}>{TEXTO_TABLA.borrarBusqueda}</Boton>{/if}
      {/snippet}
    </Vacio>
  {/snippet}
</Tabla>
{#if vista.filas.length > 0}<LeyendaDeSiglas />{/if}

<style>
  /* El rótulo de la fecha solo se ve en tarjetas (la tabla tiene su encabezado: `Tabla` pasa a tarjetas por debajo de su `tarjetasDesde`: es el contenedor `tarjetas`). */
  .rotulo-de-tarjeta {
    display: none;
  }
  @container tarjetas (width < 37.5rem) {
    .rotulo-de-tarjeta {
      display: inline;
    }
  }
  /* En la tabla completa el número del talón no se parte. En la mediana (sin Emisión ni Atraso) no hay lugar para todo y baja de renglón en el guion, antes de
     que la tabla se desplace dentro de su caja; en tarjetas, con el texto muy agrandado, también. */
  @container tabla (width >= 56.25rem) {
    .talon-de-fila :global(.talon) {
      white-space: nowrap;
    }
  }
</style>
