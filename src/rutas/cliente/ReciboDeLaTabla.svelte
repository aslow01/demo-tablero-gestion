<!-- Un recibo dentro de una tabla (ficha del cliente, comprobante y desglose): su número es un botón (`parte="boton"`, en la celda, con la nota «Cobro parcial» al lado) y el detalle
     es la fila que `Tabla` dibuja debajo, a todo el ancho (`parte="detalle"`, en el snippet `filaDeDetalle`). Las dos partes comparten el estado abierto, que guarda la pantalla por la
     clave de la fila. Un recibo no tiene pantalla propia. Datos del recibo: `detalleDeRecibo` (modelo de vista); los textos salen de `TEXTO_RECIBO` y de `dominio/textos.ts`. -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { ROTULO_DE_MEDIO } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { detalleDeRecibo } from "../../lib/vistas/comprobante.ts";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import ReciboDesplegable from "../../componentes/ReciboDesplegable.svelte";
  import type { FilaDeDetalleDeRecibo } from "../../componentes/ReciboDesplegable.svelte";
  import { TEXTO_ETIQUETAS, TEXTO_RECIBO } from "../../componentes/textos-marco.ts";
  import TalonDe from "./TalonDe.svelte";

  let {
    app,
    id,
    nota,
    parte = "boton",
    abierto = $bindable(false),
  }: {
    app: AplicacionLista;
    /** El id del recibo (`R-0003-00000045`). */
    id: string;
    /** Lo que es el movimiento, al lado del botón: «Cobro», «Cobro parcial». */
    nota?: string;
    /** `boton`: el número y la nota (va en la celda). `detalle`: el detalle abierto (va en la fila de detalle de la tabla). */
    parte?: "boton" | "detalle";
    /** Con `parte="boton"` es el estado del botón (se enlaza con `bind:abierto`); la parte `detalle` solo existe mientras está abierto. */
    abierto?: boolean;
  } = $props();

  const detalle = $derived(detalleDeRecibo(app.datos, id));
  const filas = $derived<FilaDeDetalleDeRecibo[]>([
    { clave: "recibo", rotulo: TEXTO_RECIBO.nombre, texto: TEXTO_RECIBO.totalDelRecibo(formatearImporte(detalle.total), detalle.fecha) },
    { clave: "medios", rotulo: TEXTO_RECIBO.medios, texto: detalle.medios.map((m) => `${ROTULO_DE_MEDIO[m.medio]} ${formatearImporte(m.importe)}`).join(" · ") },
    { clave: "imputado", rotulo: TEXTO_RECIBO.imputadoA },
    { clave: "a-cuenta", rotulo: TEXTO_RECIBO.aCuenta },
  ]);
  const prefijo = `${TEXTO_RECIBO.nombre} `;
</script>

{#if parte === "boton"}
  <span class="linea">
    <ReciboDesplegable {id} {prefijo} bind:abierto parte="boton" {filas} />
    {#if nota !== undefined}<span class="nota">{nota}</span>{/if}
  </span>
{:else}
  <ReciboDesplegable {id} {prefijo} abierto={true} parte="detalle" {filas}>
    {#snippet valor(fila)}
      {#if fila.clave === "imputado"}
        {#if detalle.imputaciones.length === 0}
          {TEXTO_RECIBO.ningunComprobante}
        {:else}
          {#each detalle.imputaciones as imputacion, k (imputacion.comprobante.id)}
            {#if k > 0}{" · "}{/if}<TalonDe {app} id={imputacion.comprobante.id} tipo={imputacion.comprobante.tipo} /> <span class="num">{formatearImporte(imputacion.importe)}</span>
          {/each}
        {/if}
      {:else if fila.clave === "a-cuenta"}
        <span class="num">{formatearImporte(detalle.aCuenta)}</span>
        {#if detalle.aCuenta > 0}<Etiqueta tono="revisar" icono="alerta">{TEXTO_ETIQUETAS.revisarImputacion}</Etiqueta>{/if}
      {:else}
        {fila.texto}
      {/if}
    {/snippet}
  </ReciboDesplegable>
{/if}

<style>
  .linea {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--e-2);
    min-width: 0;
  }
  /* El número del recibo no se parte para dejarle lugar a la nota: es la nota la que baja de renglón. */
  .linea :global(.recibo) {
    flex: 0 1 auto;
    max-width: 100%;
  }
  .linea :global(.boton-recibo .codigo) {
    overflow-wrap: normal;
    white-space: nowrap;
  }
  .nota {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 400;
  }
</style>
