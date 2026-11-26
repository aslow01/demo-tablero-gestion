<!-- Desglose «Partidas»: la lista de comprobantes o recibos que suman el número, con el orden a elección y el total (que es el número que se abrió).
     El orden elegido se recuerda por medida (`app.memoria`) y se anuncia en la barra de estado del panel. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import type { CriterioDeOrden } from "../../lib/dominio/orden.ts";
  import {
    CRITERIOS_DE_ORDEN,
    NOTA_DE_COBRADO_SIN_IMPUTAR,
    cantidadDe,
    notaDeCobranza,
    notaDeComprobanteDelMes,
    notaDeRetenciones,
    notaDeSaldo,
    ordenadoPor,
  } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { DetalleDePartida, FilaDePartida, VistaDesglose } from "../../lib/vistas/desglose.ts";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import EtiquetaDeTramo from "../../componentes/EtiquetaDeTramo.svelte";
  import LeyendaDeSiglas from "../../componentes/LeyendaDeSiglas.svelte";
  import OrdenarPor from "../../componentes/OrdenarPor.svelte";
  import type { OpcionDeOrden } from "../../componentes/OrdenarPor.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_DESGLOSE, TEXTO_MARCO } from "../../componentes/textos-marco.ts";
  import ReciboDeLaTabla from "../cliente/ReciboDeLaTabla.svelte";
  import ReferenciaDePartida from "./ReferenciaDePartida.svelte";

  let { app, vista }: { app: AplicacionLista; vista: Extract<VistaDesglose, { modo: "partidas" }> } = $props();

  const corte = $derived(app.direccion.corte);
  // Si el desglose ya es de un cliente, la columna «Cliente» sobra.
  const conCliente = $derived(vista.clienteId === null);

  // `imp` es el id de la columna del importe y de su total (`data-col` y `data-total`: contrato de marcado).
  const columnas = $derived<ColumnaDeTabla<FilaDePartida>[]>([
    { id: "ref", titulo: TEXTO_DESGLOSE.referencia, papel: "principal" },
    ...(conCliente ? [{ id: "cliente", titulo: TEXTO_DESGLOSE.cliente, papel: "principal" as const }] : []),
    { id: "fecha", titulo: TEXTO_DESGLOSE.fecha, cifras: true, papel: "secundaria" },
    { id: "detalle", titulo: TEXTO_DESGLOSE.detalle, papel: "secundaria" },
    { id: "imp", titulo: TEXTO_DESGLOSE.importe, numerica: true, importe: (f) => f.importe },
  ]);

  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_DESGLOSE.totalDePartidas(vista.partidas.length),
    // El rótulo cubre todas las columnas menos la del importe.
    cubre: columnas.length - 1,
    celdas: { imp: { texto: formatearImporte(vista.importe), centavos: vista.importe, medida: claveDeMedida(vista.medida, corte) } },
  });

  const clave = (f: FilaDePartida): string => `${f.ref.tipo}:${f.ref.id}`;

  // Qué recibos están abiertos, por clave de fila: el botón vive en la celda y el detalle en la fila de debajo (`Tabla`); sobrevive a reordenar.
  let abiertos = $state<Record<string, boolean>>({});

  /** La fila a la que se vuelve desde la pantalla de un comprobante. */
  const elegida = $derived.by(() => {
    const id = app.memoria.filaElegidaEn(app.direccion.ruta)?.comprobanteId;
    return id === undefined ? null : `comprobante:${id}`;
  });

  function textoDeDetalle(d: DetalleDePartida): string {
    switch (d.tipo) {
      case "comprobante-del-mes":
        return notaDeComprobanteDelMes(d.tipoDeComprobante, d.servicio);
      case "saldo":
        return notaDeSaldo(d.atraso, d.vencimiento);
      case "cobranza":
        return notaDeCobranza(d.medios);
      case "retenciones":
        return notaDeRetenciones(d.retenciones);
      case "a-cuenta":
        return d.resta ? NOTA_DE_COBRADO_SIN_IMPUTAR : "";
    }
  }

  // ---------- Orden ----------
  const opcionesDeOrden = $derived(vista.orden.opciones.map((o): OpcionDeOrden<CriterioDeOrden> => ({ valor: o, texto: CRITERIOS_DE_ORDEN[o].opcion })));
  // El mensaje entra a la barra de estado del panel (`role="status"`) solo cuando la persona elige un orden; `repeticiones` hace que se anuncie también el mismo dos veces.
  let anunciado = $state("");
  let repeticiones = $state(0);

  function alElegirOrden(criterio: CriterioDeOrden): void {
    app.memoria.elegirOrden(vista.clave, criterio);
    anunciado = ordenadoPor(criterio);
    repeticiones += 1;
  }

  // Al cambiar de cierre el mensaje de orden ya no corresponde a lo que se ve.
  $effect(() => {
    void corte;
    untrack(() => (anunciado = ""));
  });
</script>

<Panel titulo={TEXTO_DESGLOSE.partidas} meta={cantidadDe(vista.partidas.length, "partida", "partidas")} relleno="ninguno" estado={anunciado} repetir={repeticiones}>
  {#snippet controles()}
    <OrdenarPor etiqueta={TEXTO_DESGLOSE.ordenarPor} opciones={opcionesDeOrden} valor={vista.orden.criterio} alElegir={alElegirOrden} dato={vista.clave} />
  {/snippet}

  <Tabla
    titulo={TEXTO_DESGLOSE.partidas}
    {columnas}
    filas={vista.partidas}
    {clave}
    {celda}
    {total}
    {elegida}
    textoDeElegida={`(${TEXTO_MARCO.ultimaFilaAbierta})`}
    filaDeDetalle={detalle}
    abierta={(f) => f.ref.tipo === "recibo" && abiertos[clave(f)] === true}
  />
  {#if vista.origen === "comprobantes"}<LeyendaDeSiglas />{/if}
</Panel>

{#snippet detalle(f: FilaDePartida)}
  {#if f.ref.tipo === "recibo"}<ReciboDeLaTabla {app} id={f.ref.id} parte="detalle" abierto />{/if}
{/snippet}

{#snippet celda(f: FilaDePartida, c: ColumnaDeTabla<FilaDePartida>)}
  {#if c.id === "ref"}
    <ReferenciaDePartida {app} fila={f} bind:abierto={() => abiertos[clave(f)] ?? false, (v) => (abiertos[clave(f)] = v)} />
  {:else if c.id === "cliente"}
    <a href={app.direccion.enlace({ tipo: "cliente", clienteId: f.clienteId })} data-viaja>{f.nombreDelCliente}</a>
  {:else if c.id === "fecha"}
    {formatearFecha(f.fecha)}
  {:else if c.id === "detalle"}
    {textoDeDetalle(f.detalle)}{#if f.detalle.tipo === "saldo"}
      {" "}<EtiquetaDeTramo tramo={f.detalle.tramo} />{/if}
  {:else if c.id === "imp"}
    {formatearImporte(f.importe)}
  {/if}
{/snippet}
