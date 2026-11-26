<!-- Desglose: «¿de dónde sale este número?». El importe que se abrió, su fórmula en palabras y las partidas que lo suman, por cliente o en lista. Es la pantalla
     donde se ve que cada total es la suma de sus partidas al centavo. -->
<script lang="ts">
  import { formatearImporte } from "../lib/dominio/dinero.ts";
  import { formulaDeMedida, tipoDePartidas, tituloDeDesglose } from "../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import type { RutaNavegable } from "../lib/estado/enrutador.ts";
  import { vistaDesglose } from "../lib/vistas/desglose.ts";
  import type { ConsultaDeDesglose } from "../lib/vistas/desglose.ts";
  import Cabecera from "../componentes/Cabecera.svelte";
  import Cifra from "../componentes/Cifra.svelte";
  import Panel from "../componentes/Panel.svelte";
  import { TEXTO_DESGLOSE } from "../componentes/textos-marco.ts";
  import Vacio from "../componentes/Vacio.svelte";
  import Partidas from "./desglose/Partidas.svelte";
  import PorCliente from "./desglose/PorCliente.svelte";

  type Ruta = Extract<RutaNavegable, { tipo: "desglose" }>;
  let { app, ruta }: { app: AplicacionLista; ruta: Ruta } = $props();

  const corte = $derived(app.direccion.corte);

  // Si el modelo lanza un `ErrorDeCierre` (un control no cierra), sube al borde del marco, que muestra la pantalla de error de cierre.
  const vista = $derived.by(() => {
    const consulta: ConsultaDeDesglose = { clave: ruta.clave, orden: app.memoria.ordenDe(ruta.clave) };
    if (ruta.clienteId !== undefined) consulta.clienteId = ruta.clienteId;
    if (ruta.mes !== undefined) consulta.mes = ruta.mes;
    if (ruta.agrupar !== undefined) consulta.agrupar = ruta.agrupar;
    return vistaDesglose(app.datos, corte, consulta);
  });

  const mes = $derived(vista.mes ?? undefined);
  const titulo = $derived(tituloDeDesglose(vista.clave, corte, mes));
  /** Sin cliente y fuera de «Otros» el desglose no tiene bajada: no se dibuja el renglón. */
  const hayBajada = $derived(vista.clave === "mora-otros" || (vista.clienteId !== null && vista.nombreDelCliente !== null));
</script>

{#snippet elTitulo()}{titulo}{#if vista.nombreDelCliente !== null}{" · "}<span>{vista.nombreDelCliente}</span>{/if}{/snippet}
{#snippet laBajada()}
  {#if vista.clave === "mora-otros"}
    {TEXTO_DESGLOSE.bajadaDeOtros}
  {:else if vista.clienteId !== null && vista.nombreDelCliente !== null}
    {TEXTO_DESGLOSE.soloLos(tipoDePartidas(vista.clave))}
    <a href={app.direccion.enlace({ tipo: "cliente", clienteId: vista.clienteId })}>{vista.nombreDelCliente}</a>
    · {vista.mes !== null ? TEXTO_DESGLOSE.delMes(vista.mes) : TEXTO_DESGLOSE.alCorte(corte)}
  {/if}
{/snippet}
<Cabecera previo={TEXTO_DESGLOSE.previo} titulo={elTitulo} bajada={hayBajada ? laBajada : undefined} />

<p class="cifra-cab"><Cifra importe={vista.importe} tamano="cabecera" ref={vista.medida} {corte} /></p>

<div class="pila">
  <div class="formula">
    <p class="rotulo">{TEXTO_DESGLOSE.comoSeCalcula}</p>
    <p>{formulaDeMedida(vista.clave, corte, mes)}</p>
  </div>

  {#if vista.modo === "vacio"}
    <Panel titulo={TEXTO_DESGLOSE.partidas} relleno="ninguno">
      <Vacio texto={TEXTO_DESGLOSE.sinPartidas(formatearImporte(vista.importe))} conMargen />
    </Panel>
  {:else if vista.modo === "por-cliente"}
    <PorCliente {app} {vista} />
  {:else}
    <Partidas {app} {vista} />
  {/if}
</div>

<style>
  /* La cifra va pegada al título (sube un poco sobre el aire que deja la cabecera). */
  .cifra-cab {
    display: block;
    margin: -0.375rem 0 var(--e-4);
  }
  .pila {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
  }
  .formula {
    max-width: 72ch;
    padding: var(--e-3) var(--e-4);
    border-left: 4px solid var(--c-tinta);
    border-radius: 0 var(--r-2) var(--r-2) 0;
    background: var(--c-superficie);
    box-shadow: var(--s-1);
  }
  .formula .rotulo {
    margin-bottom: var(--e-1);
  }
</style>
