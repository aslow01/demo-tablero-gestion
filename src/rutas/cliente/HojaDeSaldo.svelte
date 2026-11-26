<!-- Primera hoja de la ficha del cliente: sus comprobantes con saldo, por vencimiento, con el total (que es su saldo), la etiqueta del tramo de cada uno y, al pie, la leyenda de las siglas del talón. -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { FilaDeSaldoDelCliente, VistaCliente } from "../../lib/vistas/cliente.ts";
  import EtiquetaDeTramo from "../../componentes/EtiquetaDeTramo.svelte";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import LeyendaDeSiglas from "../../componentes/LeyendaDeSiglas.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import Vacio from "../../componentes/Vacio.svelte";
  import { TEXTO_CLIENTE, TEXTO_MARCO, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import TalonDe from "./TalonDe.svelte";

  let {
    app,
    vista,
    volvioA,
  }: {
    app: AplicacionLista;
    vista: VistaCliente;
    /** El comprobante que se miró justo antes de volver a esta ficha (se marca la fila), o `null`. */
    volvioA: string | null;
  } = $props();

  const corte = $derived(vista.corte);
  const filas = $derived(vista.comprobantesConSaldo.filas);

  const columnas: ColumnaDeTabla<FilaDeSaldoDelCliente>[] = [
    { id: "comprobante", titulo: TEXTO_TABLA.comprobante, papel: "principal" },
    { id: "emision", titulo: TEXTO_TABLA.emision, cifras: true, opcional: true },
    { id: "vencimiento", titulo: TEXTO_TABLA.vencimiento, cifras: true, papel: "secundaria" },
    { id: "total", titulo: TEXTO_TABLA.total, numerica: true, opcional: true },
    { id: "saldo", titulo: TEXTO_TABLA.saldo, numerica: true, importe: (f) => f.saldo },
    { id: "atraso", titulo: TEXTO_TABLA.atraso, numerica: true, opcional: true, textoEnLinea: (f) => (f.atraso >= 1 ? TEXTO_TABLA.dias(f.atraso) : ""), enLineaEn: "tramo" },
    { id: "tramo", titulo: TEXTO_TABLA.tramo, papel: "etiqueta" },
  ];

  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_CLIENTE.total,
    celdas: { saldo: { texto: formatearImporte(vista.comprobantesConSaldo.total.importe), centavos: vista.comprobantesConSaldo.total.importe, medida: claveDeMedida(vista.comprobantesConSaldo.total.medida, corte) } },
  });
</script>

{#snippet celda(f: FilaDeSaldoDelCliente, c: ColumnaDeTabla<FilaDeSaldoDelCliente>)}
  {#if c.id === "comprobante"}
    <TalonDe {app} id={f.comprobanteId} tipo={f.tipo} viaja />
  {:else if c.id === "emision"}
    {formatearFecha(f.emision)}
  {:else if c.id === "vencimiento"}
    {formatearFecha(f.vencimiento)}
  {:else if c.id === "total"}
    {formatearImporte(f.total)}
  {:else if c.id === "saldo"}
    {formatearImporte(f.saldo)}
  {:else if c.id === "atraso"}
    {f.atraso >= 1 ? TEXTO_TABLA.dias(f.atraso) : TEXTO_TABLA.sinAtraso}
  {:else if c.id === "tramo"}
    <EtiquetaDeTramo tramo={f.tramo} />
  {/if}
{/snippet}

<Tabla
  titulo={TEXTO_CLIENTE.solapaComprobantes}
  {columnas}
  {filas}
  clave={(f) => f.comprobanteId}
  {celda}
  {total}
  elegida={volvioA}
  textoDeElegida={`(${TEXTO_MARCO.ultimaFilaAbierta})`}
>
  {#snippet vacia()}
    <Vacio texto={TEXTO_CLIENTE.vacioDeComprobantes(corte)} conMargen />
  {/snippet}
</Tabla>
{#if filas.length > 0}<LeyendaDeSiglas />{/if}
