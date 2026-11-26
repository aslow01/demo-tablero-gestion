<!-- Ficha de un cliente (`#/cliente/{id}`): su posición al corte (saldo, mora, lo cobrado sin imputar, regla de tramos), su facturación de doce meses y, en solapas, sus
     comprobantes con saldo, sus recibos y su cuenta corriente.
     Los datos salen de `vistaCliente` (modelo de vista); los textos, de `textos-marco.ts` y `dominio/textos.ts`. Esta pantalla no calcula ni escribe cifras. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { formatearCuit } from "../lib/datos/cuit.ts";
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import type { RutaNavegable } from "../lib/estado/enrutador.ts";
  import { SOLAPAS_DE_CLIENTE } from "../lib/estado/memoria-de-vista.svelte.ts";
  import type { SolapaDeCliente } from "../lib/estado/memoria-de-vista.svelte.ts";
  import { vistaCliente } from "../lib/vistas/cliente.ts";
  import Solapas from "../componentes/Solapas.svelte";
  import type { Solapa } from "../componentes/Solapas.svelte";
  import { TEXTO_CLIENTE } from "../componentes/textos-marco.ts";
  import Cabecera from "../componentes/Cabecera.svelte";
  import FacturacionDelCliente from "./cliente/FacturacionDelCliente.svelte";
  import HojaDeCuenta from "./cliente/HojaDeCuenta.svelte";
  import HojaDeRecibos from "./cliente/HojaDeRecibos.svelte";
  import HojaDeSaldo from "./cliente/HojaDeSaldo.svelte";
  import PosicionDelCliente from "./cliente/PosicionDelCliente.svelte";

  type Ruta = Extract<RutaNavegable, { tipo: "cliente" }>;
  let { app, ruta }: { app: AplicacionLista; ruta: Ruta } = $props();

  // El enrutador ya comprobó que el cliente existe.
  const corte = $derived(app.direccion.corte);
  const vista = $derived(vistaCliente(app.datos, corte, ruta.clienteId));

  // El comprobante que se miró justo antes de volver a esta ficha queda marcado en su tabla. Se lee una sola vez, antes de que esta pantalla ocupe la «fila elegida».
  const volvioA = untrack(() => {
    const fila = app.memoria.filaElegidaEn(ruta);
    return fila?.clienteId === ruta.clienteId && fila.comprobanteId !== undefined ? fila.comprobanteId : null;
  });
  // Esta ficha pasa a ser la «fila elegida» de la pantalla desde la que se abrió (la anterior del recorrido; con un enlace directo no hay ninguna).
  $effect(() => {
    const clienteId = ruta.clienteId;
    app.memoria.elegirFila({ clienteId }, untrack(() => app.direccion.anterior));
  });

  const actual = $derived(app.memoria.solapaDe(ruta.clienteId));
  const solapas = $derived<Solapa[]>([
    {
      id: "saldo",
      texto: TEXTO_CLIENTE.solapaComprobantes,
      cantidad: vista.comprobantesConSaldo.filas.length,
      cantidadDicha: TEXTO_CLIENTE.cantidadDeSolapa.comprobantes(vista.comprobantesConSaldo.filas.length),
    },
    { id: "recibos", texto: TEXTO_CLIENTE.solapaRecibos, cantidad: vista.recibos.filas.length, cantidadDicha: TEXTO_CLIENTE.cantidadDeSolapa.recibos(vista.recibos.filas.length) },
    {
      id: "cuenta",
      texto: TEXTO_CLIENTE.solapaCuentaCorriente,
      cantidad: vista.cuentaCorriente.movimientos.length,
      cantidadDicha: TEXTO_CLIENTE.cantidadDeSolapa.movimientos(vista.cuentaCorriente.movimientos.length),
    },
  ]);

  function elegir(id: string): void {
    const solapa = SOLAPAS_DE_CLIENTE.find((s): s is SolapaDeCliente => s === id);
    if (solapa !== undefined) app.memoria.elegirSolapa(ruta.clienteId, solapa);
  }
</script>

<Cabecera viaja>
  {#snippet titulo()}{vista.cliente.nombre}{/snippet}
  {#snippet bajada()}{TEXTO_CLIENTE.bajada(formatearCuit(vista.cliente.cuit), vista.cliente.plazoDias, corte)}{/snippet}
</Cabecera>

<div class="pila">
  <div class="dos-col">
    <PosicionDelCliente {app} {vista} />
    <FacturacionDelCliente {app} facturacion={vista.facturacion} {corte} />
  </div>

  <Solapas etiqueta={TEXTO_CLIENTE.detalleDelCliente} {solapas} {actual} alElegir={elegir} idPanel="hoja-cli">
    {#if actual === "saldo"}
      <HojaDeSaldo {app} {vista} {volvioA} />
    {:else if actual === "recibos"}
      <HojaDeRecibos {app} {vista} />
    {:else}
      <HojaDeCuenta {app} {vista} />
    {/if}
  </Solapas>
</div>

<style>
  .pila {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
    min-width: 0;
  }
  .dos-col {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  /* Posición a la izquierda (siete partes) y facturación a la derecha (cinco), cuando hay lugar para las dos. */
  @media (min-width: 64rem) {
    .dos-col {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      align-items: start;
    }
  }
</style>
