<!-- Tercera hoja de la ficha del cliente: su cuenta corriente al corte (fecha, movimiento, debe, haber y saldo corrido) y, aparte, lo que pasó después de la fecha de corte,
     que se muestra pero no cuenta para ningún saldo. «Ir al saldo» lleva el foco a la última fila (el saldo con el que termina la cuenta). -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaCliente } from "../../lib/vistas/cliente.ts";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import Icono from "../../componentes/Icono.svelte";
  import type { TotalDeTabla } from "../../componentes/Tabla.svelte";
  import Vacio from "../../componentes/Vacio.svelte";
  import { TEXTO_CLIENTE, TEXTO_ETIQUETAS } from "../../componentes/textos-marco.ts";
  import { filasDeCuentaCorriente } from "./movimientos.ts";
  import TablaDeMovimientos from "./TablaDeMovimientos.svelte";

  let { app, vista }: { app: AplicacionLista; vista: VistaCliente } = $props();

  const corte = $derived(vista.corte);
  const cuenta = $derived(vista.cuentaCorriente);
  const filas = $derived(filasDeCuentaCorriente(cuenta.movimientos, "m"));
  const posteriores = $derived(filasDeCuentaCorriente(cuenta.posteriores, "p"));

  /** El id del saldo final: destino de «Ir al saldo». */
  const ID_DEL_SALDO = "saldo-final";
  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_CLIENTE.saldoAl(corte),
    cubre: 4,
    id: ID_DEL_SALDO,
    celdas: { saldo: { texto: formatearImporte(cuenta.saldoFinal.importe), centavos: cuenta.saldoFinal.importe, medida: claveDeMedida(cuenta.saldoFinal.medida, corte), formula: "debe-haber" } },
  });

  // No cambia la dirección: lleva el foco (y la vista) al saldo. Sin script, el `href` es un ancla que la aplicación ignora.
  function irAlSaldo(evento: MouseEvent): void {
    evento.preventDefault();
    const destino = document.getElementById(ID_DEL_SALDO);
    if (destino === null) return;
    destino.scrollIntoView({ block: "center" });
    destino.focus({ preventScroll: true });
  }
</script>

{#if filas.length === 0}
  <Vacio texto={TEXTO_CLIENTE.vacioDeMovimientos(corte)} detalle={TEXTO_CLIENTE.probarOtroCierre} conMargen />
{:else}
  <p class="ir-saldo">
    <a class="enlace-flecha" href="#{ID_DEL_SALDO}" data-accion="ir-saldo" onclick={irAlSaldo}>{TEXTO_CLIENTE.irAlSaldo(corte)}<Icono nombre="flecha" /></a>
  </p>
  <TablaDeMovimientos {app} titulo={TEXTO_CLIENTE.solapaCuentaCorriente} {filas} conCifras {total} />
{/if}
{#if posteriores.length > 0}
  <TablaDeMovimientos {app} titulo={TEXTO_ETIQUETAS.despuesDelCorte} filas={posteriores} conCifras={false} variante="posteriores">
    {#snippet encabezado()}
      <Etiqueta tono="neutro" icono="reloj">{TEXTO_ETIQUETAS.despuesDelCorte}</Etiqueta> <span class="aclaracion">{TEXTO_ETIQUETAS.noCuentanParaElSaldo(corte)}</span>
    {/snippet}
  </TablaDeMovimientos>
{/if}

<style>
  .ir-saldo {
    padding: var(--e-1) var(--e-4) 0;
  }
  .enlace-flecha {
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
  .enlace-flecha :global(.icono) {
    transition: transform var(--m-rapido) var(--m-curva);
  }
  @media (hover: hover) {
    .enlace-flecha:hover {
      text-decoration: underline;
    }
    .enlace-flecha:hover :global(.icono) {
      transform: translateX(2px);
    }
  }
  .aclaracion {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
  }
</style>
