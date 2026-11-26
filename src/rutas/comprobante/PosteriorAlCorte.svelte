<!-- Un comprobante que se emitió después de la fecha de corte: a esa fecha no existía. Dice qué pasó y ofrece verlo al cierre de su mes («Verlo al …») o ir a su cliente.
     Se ve como un aviso (franja y marca de «no está»); no es un error de la dirección: el comprobante existe, solo que más adelante. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaDeComprobantePosterior } from "../../lib/vistas/comprobante.ts";
  import Boton from "../../componentes/Boton.svelte";
  import Icono from "../../componentes/Icono.svelte";
  import { TEXTO_COMPROBANTE } from "../../componentes/textos-marco.ts";
  import TalonDe from "../cliente/TalonDe.svelte";

  let { app, vista }: { app: AplicacionLista; vista: VistaDeComprobantePosterior } = $props();

  const datos = $derived(vista.datos);
  const verloAl = $derived(app.direccion.enlace({ tipo: "comprobante", comprobanteId: datos.id }, vista.verAl));
  const irAlCliente = $derived(app.direccion.enlace({ tipo: "cliente", clienteId: datos.clienteId }));
</script>

<div class="aviso">
  <span class="marca"><Icono nombre="vencido" /></span>
  <div class="texto">
    <p class="previo">{datos.nombreDelCliente}</p>
    <h1 tabindex="-1" data-viaja><TalonDe {app} id={datos.id} tipo={datos.tipo} enlace={false} grande /></h1>
    <p class="cuerpo">{TEXTO_COMPROBANTE.emitidoDespuesDelCorte(datos.emision, vista.corte)}</p>
  </div>
  <div class="acciones">
    <Boton href={verloAl}>{TEXTO_COMPROBANTE.verloAl(vista.verAl)}</Boton>
    <Boton href={irAlCliente} variante="secundario">{TEXTO_COMPROBANTE.irAlCliente}</Boton>
  </div>
</div>

<style>
  .aviso {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--e-1) 0.875rem;
    max-width: 45rem;
    margin-top: var(--e-2);
    padding: var(--e-5) var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-left: 4px solid var(--c-diferencia-r);
    border-radius: var(--r-2);
  }
  .marca {
    --icono-tam: 1.5rem;
    margin-top: var(--e-1);
    color: var(--c-diferencia-t);
  }
  .texto {
    min-width: 0;
  }
  .previo {
    margin-bottom: var(--e-1);
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 650;
  }
  .cuerpo {
    margin-top: var(--e-3);
    color: var(--c-texto-2);
  }
  .acciones {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
    margin-top: 0.875rem;
  }
</style>
