<!-- Desglose «Por cliente»: una fila por cliente con cuántas partidas tiene, su parte del total (que abre el mismo desglose para él) y el porcentaje. El total de la
     tabla es el número que se abrió. -->
<script lang="ts">
  import { formatearImporte, formatearPorcentaje } from "../../lib/dominio/dinero.ts";
  import { cantidadDe, tituloCortoDeDesglose } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { FilaDeDesglosePorCliente, VistaDesglose } from "../../lib/vistas/desglose.ts";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_DESGLOSE, TEXTO_MARCO, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import { rutaDeDesglose } from "../cliente/enlaces.ts";

  let { app, vista }: { app: AplicacionLista; vista: Extract<VistaDesglose, { modo: "por-cliente" }> } = $props();

  const corte = $derived(app.direccion.corte);

  // `imp` es el id de la columna del importe y de su total (`data-col` y `data-total`: contrato de marcado).
  const columnas: ColumnaDeTabla<FilaDeDesglosePorCliente>[] = [
    { id: "cliente", titulo: TEXTO_DESGLOSE.cliente, papel: "principal" },
    { id: "partidas", titulo: TEXTO_DESGLOSE.cantidadDePartidas, numerica: true },
    { id: "imp", titulo: TEXTO_DESGLOSE.importe, numerica: true, importe: (f) => f.importe.importe },
    { id: "pct", titulo: TEXTO_DESGLOSE.porcentaje, numerica: true },
  ];

  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_DESGLOSE.totalPorCliente(vista.filas.length, vista.cantidadDePartidas),
    celdas: { imp: { texto: formatearImporte(vista.importe), centavos: vista.importe, medida: claveDeMedida(vista.medida, corte) } },
  });

  /** Es la fila a la que se vuelve desde la ficha de un cliente. */
  const elegida = $derived(app.memoria.filaElegidaEn(app.direccion.ruta)?.clienteId ?? null);
</script>

<Panel titulo={TEXTO_DESGLOSE.porCliente} meta={cantidadDe(vista.filas.length, "cliente", "clientes")} relleno="ninguno">
  <Tabla
    titulo={TEXTO_DESGLOSE.porCliente}
    {columnas}
    filas={vista.filas}
    clave={(f) => f.clienteId}
    {celda}
    {total}
    {elegida}
    textoDeElegida={`(${TEXTO_MARCO.ultimaFilaAbierta})`}
  />
</Panel>

{#snippet celda(f: FilaDeDesglosePorCliente, c: ColumnaDeTabla<FilaDeDesglosePorCliente>)}
  {#if c.id === "cliente"}
    <a href={app.direccion.enlace({ tipo: "cliente", clienteId: f.clienteId })} data-viaja>{f.nombre}</a>
  {:else if c.id === "partidas"}
    {f.cantidad}
  {:else if c.id === "imp"}
    <CifraEnlace
      href={app.direccion.enlace(rutaDeDesglose(f.importe.medida))}
      importe={f.importe.importe}
      ref={f.importe.medida}
      {corte}
      nombre={`${tituloCortoDeDesglose(f.importe.medida.clave, corte, f.importe.medida.mes)} de ${f.nombre}`}
    />
  {:else if c.id === "pct"}
    {#if f.milesimas === null}<span aria-hidden="true">{TEXTO_TABLA.sinPorcentaje}</span><span class="solo-lectores">{TEXTO_TABLA.sinPorcentajeDicho}</span>{:else}{formatearPorcentaje(f.milesimas)}{/if}
  {/if}
{/snippet}
