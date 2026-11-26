<!-- Segunda hoja de la ficha del cliente: sus recibos al corte, el más nuevo primero, con lo imputado y lo que quedó a cuenta. El número del recibo abre su detalle en el lugar. -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import { ROTULO_DE_MEDIO } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { FilaDeReciboDelCliente, VistaCliente } from "../../lib/vistas/cliente.ts";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import Vacio from "../../componentes/Vacio.svelte";
  import { TEXTO_CLIENTE, TEXTO_ETIQUETAS, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import ReciboDeLaTabla from "./ReciboDeLaTabla.svelte";

  let { app, vista }: { app: AplicacionLista; vista: VistaCliente } = $props();

  const corte = $derived(vista.corte);
  const filas = $derived(vista.recibos.filas);

  const columnas: ColumnaDeTabla<FilaDeReciboDelCliente>[] = [
    { id: "recibo", titulo: TEXTO_TABLA.recibo, papel: "principal" },
    { id: "fecha", titulo: TEXTO_TABLA.fecha, cifras: true, papel: "secundaria" },
    { id: "medios", titulo: TEXTO_CLIENTE.medios, opcional: true },
    { id: "imp", titulo: TEXTO_CLIENTE.imputado, numerica: true, importe: (f) => f.imputado },
    { id: "ac", titulo: TEXTO_CLIENTE.aCuenta, numerica: true, importe: (f) => f.aCuenta },
  ];

  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_TABLA.totalDeRecibos(filas.length),
    cubre: 2,
    celdas: {
      imp: { texto: formatearImporte(vista.recibos.totales.imputado), centavos: vista.recibos.totales.imputado },
      ac: { texto: formatearImporte(vista.recibos.totales.aCuenta), centavos: vista.recibos.totales.aCuenta },
    },
  });

  // Qué recibos están abiertos, por clave de fila: el botón vive en la celda y el detalle en la fila de debajo (`Tabla`).
  let abiertos = $state<Record<string, boolean>>({});

  const mediosDe = (f: FilaDeReciboDelCliente): string => f.medios.map((m) => `${ROTULO_DE_MEDIO[m.medio]} ${formatearImporte(m.importe)}`).join(" · ");
</script>

{#snippet celda(f: FilaDeReciboDelCliente, c: ColumnaDeTabla<FilaDeReciboDelCliente>)}
  {#if c.id === "recibo"}
    <ReciboDeLaTabla {app} id={f.reciboId} bind:abierto={() => abiertos[f.reciboId] ?? false, (v) => (abiertos[f.reciboId] = v)} />
  {:else if c.id === "fecha"}
    {formatearFecha(f.fecha)}
  {:else if c.id === "medios"}
    {mediosDe(f)}
  {:else if c.id === "imp"}
    {formatearImporte(f.imputado)}
  {:else if c.id === "ac"}
    {formatearImporte(f.aCuenta)}
    {#if f.aCuenta > 0}<Etiqueta tono="revisar" icono="alerta">{TEXTO_ETIQUETAS.revisarImputacion}</Etiqueta>{/if}
  {/if}
{/snippet}

{#snippet detalle(f: FilaDeReciboDelCliente)}
  <ReciboDeLaTabla {app} id={f.reciboId} parte="detalle" abierto />
{/snippet}

<Tabla titulo={TEXTO_CLIENTE.solapaRecibos} {columnas} {filas} clave={(f) => f.reciboId} {celda} {total} filaDeDetalle={detalle} abierta={(f) => abiertos[f.reciboId] === true}>
  {#snippet vacia()}
    <Vacio texto={TEXTO_CLIENTE.vacioDeRecibos(corte)} conMargen />
  {/snippet}
</Tabla>
