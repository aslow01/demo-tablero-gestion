<!-- Tabla de movimientos (Fecha · Movimiento · Debe · Haber · Saldo): la cuenta corriente de un cliente y los movimientos de un comprobante. Con `conCifras` lleva `data-col`
     en el debe y el haber (la prueba de cifras los suma contra el total); sin él es la tabla de los movimientos posteriores al corte, que no cuentan para ningún saldo. -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { Snippet } from "svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import type { FilaDeMovimiento } from "./movimientos.ts";
  import ReciboDeLaTabla from "./ReciboDeLaTabla.svelte";
  import TalonDe from "./TalonDe.svelte";

  let {
    app,
    titulo,
    filas,
    conCifras,
    total,
    encabezado,
    variante = "normal",
  }: {
    app: AplicacionLista;
    /** El nombre de la tabla para lectores de pantalla (`caption`). */
    titulo: string;
    filas: FilaDeMovimiento[];
    conCifras: boolean;
    total?: TotalDeTabla;
    /** Lo que se ve como título de la tabla (la etiqueta de los posteriores al corte). */
    encabezado?: Snippet;
    variante?: "normal" | "posteriores";
  } = $props();

  // Qué recibos están abiertos, por clave de fila: el botón vive en la celda y el detalle en la fila de debajo (`Tabla`).
  let abiertos = $state<Record<string, boolean>>({});

  const columnas = $derived<ColumnaDeTabla<FilaDeMovimiento>[]>([
    { id: "fecha", titulo: TEXTO_TABLA.fecha, cifras: true, papel: "secundaria" },
    { id: "movimiento", titulo: TEXTO_TABLA.movimiento, papel: "principal" },
    { id: "debe", titulo: TEXTO_TABLA.debe, numerica: true, importe: (f) => (conCifras ? f.debe : null) },
    { id: "haber", titulo: TEXTO_TABLA.haber, numerica: true, importe: (f) => (conCifras ? f.haber : null) },
    { id: "saldo", titulo: TEXTO_TABLA.saldo, numerica: true },
  ]);
</script>

{#snippet celda(f: FilaDeMovimiento, c: ColumnaDeTabla<FilaDeMovimiento>)}
  {#if c.id === "fecha"}
    {formatearFecha(f.fecha)}
  {:else if c.id === "movimiento"}
    {#if f.que.tipo === "texto"}
      {f.que.texto}
    {:else if f.que.tipo === "comprobante"}
      <TalonDe {app} id={f.que.id} tipo={f.que.tipoCmp} viaja /> <span class="nota">{f.que.nota}</span>
    {:else}
      <ReciboDeLaTabla {app} id={f.que.id} nota={f.que.nota} bind:abierto={() => abiertos[f.k] ?? false, (v) => (abiertos[f.k] = v)} />
    {/if}
  {:else if c.id === "debe"}
    {#if f.debe > 0}{formatearImporte(f.debe)}{/if}
  {:else if c.id === "haber"}
    {#if f.haber > 0}{formatearImporte(f.haber)}{/if}
  {:else if c.id === "saldo"}
    {#if f.saldo !== null}{formatearImporte(f.saldo)}{/if}
  {/if}
{/snippet}

{#snippet detalle(f: FilaDeMovimiento)}
  {#if f.que.tipo === "recibo"}<ReciboDeLaTabla {app} id={f.que.id} parte="detalle" abierto />{/if}
{/snippet}

<Tabla {titulo} {columnas} {filas} clave={(f) => f.k} {celda} {total} {encabezado} {variante} tarjetasDesde={40} filaDeDetalle={detalle} abierta={(f) => f.que.tipo === "recibo" && abiertos[f.k] === true} />

<style>
  .nota {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 400;
  }
</style>
