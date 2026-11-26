<!-- Deudores: los cinco clientes con más mora y «Otros», con su parte de la mora, el tramo del comprobante más atrasado y el total (que es la mora). -->
<script lang="ts">
  import { formatearImporte, formatearPorcentaje } from "../../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { FilaDeDeudor, FilaDeOtros, VistaResumen } from "../../lib/vistas/resumen.ts";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Icono from "../../componentes/Icono.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla } from "../../componentes/Tabla.svelte";
  import Vacio from "../../componentes/Vacio.svelte";
  import { TEXTO_MARCO, TEXTO_RESUMEN, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./cifras.ts";
  import EtiquetaDeTramo from "../../componentes/EtiquetaDeTramo.svelte";

  let { app, v }: { app: AplicacionLista; v: VistaResumen } = $props();

  type Fila = { tipo: "cliente"; deudor: FilaDeDeudor } | { tipo: "otros"; otros: FilaDeOtros };

  const corte = $derived(v.corte);
  const d = $derived(v.deudores);
  const filas = $derived<Fila[]>([
    ...d.filas.map((deudor): Fila => ({ tipo: "cliente", deudor })),
    ...(d.otros === null ? [] : [{ tipo: "otros", otros: d.otros } satisfies Fila]),
  ]);
  const elegida = $derived(app.memoria.filaElegidaEn(app.direccion.ruta)?.clienteId ?? null);
  const milesimasDe = (f: Fila): number => (f.tipo === "cliente" ? f.deudor.milesimas : f.otros.milesimas) ?? 0;

  const columnas: ColumnaDeTabla<Fila>[] = [
    { id: "cliente", titulo: TEXTO_TABLA.cliente, papel: "principal" },
    { id: "mora", titulo: TEXTO_TABLA.enMora, numerica: true, importe: (f) => (f.tipo === "cliente" ? f.deudor.mora.importe : f.otros.mora.importe) },
    { id: "pct", titulo: TEXTO_RESUMEN.porcentajeDeLaMora, numerica: true },
    { id: "tramo", titulo: TEXTO_TABLA.tramoMasAntiguo, papel: "etiqueta" },
    {
      id: "dias",
      titulo: TEXTO_RESUMEN.diasDelMasAntiguo,
      numerica: true,
      opcional: true,
      enLineaEn: "tramo",
      textoEnLinea: (f) => (f.tipo === "cliente" ? TEXTO_TABLA.dias(f.deudor.diasDelMasAtrasado) : ""),
    },
  ];
</script>

{#snippet celda(f: Fila, c: ColumnaDeTabla<Fila>)}{#if c.id === "cliente"}{#if f.tipo === "cliente"}<a href={app.direccion.enlace({ tipo: "cliente", clienteId: f.deudor.clienteId })}>{f.deudor.nombre}</a>{:else}{TEXTO_RESUMEN.otros(f.otros.clientes)}{/if}{:else if c.id === "mora"}{#if f.tipo === "cliente"}<CifraEnlace href={app.direccion.enlace(rutaDeDesglose(f.deudor.mora.medida, false))} importe={f.deudor.mora.importe} ref={f.deudor.mora.medida} {corte} nombre={nombreDeCifra(f.deudor.mora.medida, corte, app.datos)} />{:else}<CifraEnlace href={app.direccion.enlace(rutaDeDesglose(f.otros.mora.medida, false))} importe={f.otros.mora.importe} ref={f.otros.mora.medida} {corte} nombre={nombreDeCifra(f.otros.mora.medida, corte, app.datos)} />{/if}{:else if c.id === "pct"}{formatearPorcentaje(f.tipo === "cliente" ? f.deudor.milesimas : f.otros.milesimas)}<span class="barra" aria-hidden="true"><i style:width="{milesimasDe(f) / 10}%"></i></span>{:else if c.id === "tramo"}{#if f.tipo === "cliente"}<EtiquetaDeTramo tramo={f.deudor.tramoMasAntiguo} />{/if}{:else if c.id === "dias"}{#if f.tipo === "cliente"}{TEXTO_TABLA.dias(f.deudor.diasDelMasAtrasado)}{/if}{/if}{/snippet}

<Panel titulo={TEXTO_RESUMEN.deudores} meta={d.clientes > 0 ? TEXTO_RESUMEN.deudoresEnMora(d.clientes) : ""} relleno="ninguno">
  {#if filas.length === 0}
    <Vacio texto={TEXTO_RESUMEN.sinMora(corte)} conMargen />
  {:else}
    <Tabla
      titulo={TEXTO_RESUMEN.deudores}
      {columnas}
      {filas}
      clave={(f) => (f.tipo === "cliente" ? f.deudor.clienteId : "otros")}
      {celda}
      {elegida}
      textoDeElegida={`(${TEXTO_MARCO.ultimaFilaAbierta})`}
      total={{
        rotulo: TEXTO_RESUMEN.totalEnMora,
        celdas: { mora: { texto: formatearImporte(d.total), centavos: d.total, medida: claveDeMedida({ clave: "mora" }, corte) } },
      }}
    />
  {/if}
  {#snippet contenidoEstado()}
    <a class="ver" href={app.direccion.enlace({ tipo: "clientes" })}>{TEXTO_RESUMEN.verLosClientes(app.datos.clientes.length)}<Icono nombre="flecha" /></a>
  {/snippet}
</Panel>

<style>
  .barra {
    display: inline-block;
    width: 3.5rem;
    height: 0.375rem;
    margin-left: var(--e-2);
    vertical-align: 2px;
    background: var(--c-superficie-2);
  }
  .barra i {
    display: block;
    height: 100%;
    background: var(--c-tinta);
  }
  .ver {
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
  .ver :global(.icono) {
    transition: transform var(--m-rapido) var(--m-curva);
  }
  @media (hover: hover) {
    .ver:hover {
      text-decoration: underline;
    }
    .ver:hover :global(.icono) {
      transform: translateX(2px);
    }
  }
  @container tarjetas (width < 37.5rem) {
    .barra {
      width: 2.5rem;
    }
  }
</style>
