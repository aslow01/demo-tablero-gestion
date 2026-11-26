<!-- Panel «Datos del comprobante»: cliente, fechas, servicio, a qué factura se asocia o qué notas de crédito tiene, y neto, IVA y total. Una lista de datos (rótulo y valor). -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import { ROTULO_DE_SERVICIO } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { DatosDeComprobante } from "../../lib/vistas/comprobante.ts";
  import Panel from "../../componentes/Panel.svelte";
  import Pares from "../../componentes/Pares.svelte";
  import type { ParDeDatos } from "../../componentes/Pares.svelte";
  import { TEXTO_COMPROBANTE } from "../../componentes/textos-marco.ts";
  import TalonDe from "../cliente/TalonDe.svelte";

  let { app, datos }: { app: AplicacionLista; datos: DatosDeComprobante } = $props();

  const filas = $derived<ParDeDatos[]>([
    { clave: "cliente", rotulo: TEXTO_COMPROBANTE.cliente },
    { rotulo: TEXTO_COMPROBANTE.emision, valor: formatearFecha(datos.emision) },
    {
      rotulo: TEXTO_COMPROBANTE.vencimiento,
      valor: datos.tipo === 3 ? TEXTO_COMPROBANTE.vencimientoDeNota(datos.vencimiento) : TEXTO_COMPROBANTE.vencimientoConPlazo(datos.vencimiento, datos.plazoDias),
    },
    { rotulo: TEXTO_COMPROBANTE.servicio, valor: ROTULO_DE_SERVICIO[datos.servicio] },
    ...(datos.asociadaA === null ? [] : [{ clave: "asociada", rotulo: TEXTO_COMPROBANTE.asociadaA }]),
    ...(datos.notasDeCredito.length === 0 ? [] : [{ clave: "notas", rotulo: TEXTO_COMPROBANTE.notasDeCredito }]),
    { rotulo: TEXTO_COMPROBANTE.neto, valor: formatearImporte(datos.neto), numerico: true },
    { rotulo: TEXTO_COMPROBANTE.iva, valor: formatearImporte(datos.iva), numerico: true },
    { rotulo: TEXTO_COMPROBANTE.total, valor: formatearImporte(datos.total), numerico: true, total: true },
  ]);
</script>

{#snippet celda(fila: ParDeDatos)}
  {#if fila.clave === "cliente"}
    <a class="cliente" href={app.direccion.enlace({ tipo: "cliente", clienteId: datos.clienteId })} data-viaja>{datos.nombreDelCliente}</a>
  {:else if fila.clave === "asociada" && datos.asociadaA !== null}
    <TalonDe {app} id={datos.asociadaA.id} tipo={datos.asociadaA.tipo} />
  {:else if fila.clave === "notas"}
    <span class="talones">
      {#each datos.notasDeCredito as nota (nota.id)}<TalonDe {app} id={nota.id} tipo={nota.tipo} />{/each}
    </span>
  {/if}
{/snippet}

<Panel titulo={TEXTO_COMPROBANTE.datos} id="t-datos">
  <Pares {filas} {celda} />
</Panel>

<style>
  .talones {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
  }
  .cliente {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem; /* objetivo de 24 px (2.5.8) */
    max-width: 100%;
    color: var(--c-texto);
    font-weight: 650;
    text-decoration: underline 1px var(--c-borde-fuerte);
    text-underline-offset: 3px;
  }
  @media (hover: hover) {
    .cliente:hover {
      text-decoration-color: var(--c-enlace);
      text-decoration-thickness: 2px;
    }
  }
</style>
