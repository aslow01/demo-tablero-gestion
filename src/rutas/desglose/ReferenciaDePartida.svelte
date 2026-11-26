<!-- La referencia de una partida: el talón del comprobante (un enlace a su pantalla) o el recibo, que no tiene pantalla propia: su número es un botón y el detalle se abre en la
     fila de debajo de la tabla (`ReciboDeLaTabla`, igual que en la ficha del cliente y en el comprobante). El estado abierto es de la pantalla (por clave de fila): sobrevive a reordenar. -->
<script lang="ts">
  import { ROTULO_DE_TIPO, SIGLA_DE_TIPO } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { comprobantePorId } from "../../lib/vistas/comprobante.ts";
  import type { FilaDePartida } from "../../lib/vistas/desglose.ts";
  import { codigoDeComprobante } from "../../lib/vistas/rotulos.ts";
  import Talon from "../../componentes/Talon.svelte";
  import ReciboDeLaTabla from "../cliente/ReciboDeLaTabla.svelte";

  let { app, fila, abierto = $bindable(false) }: { app: AplicacionLista; fila: FilaDePartida; abierto?: boolean } = $props();

  const comprobante = $derived.by(() => {
    if (fila.ref.tipo !== "comprobante") return null;
    const c = comprobantePorId(app.datos, fila.ref.id);
    if (c === undefined) throw new Error(`Error interno: la partida es del comprobante ${fila.ref.id}, que no está en los datos.`);
    return c;
  });
</script>

{#if comprobante !== null}
  <Talon
    tipoCorto={SIGLA_DE_TIPO[comprobante.tipo]}
    tipoLargo={ROTULO_DE_TIPO[comprobante.tipo]}
    numero={codigoDeComprobante(comprobante.id)}
    href={app.direccion.enlace({ tipo: "comprobante", comprobanteId: comprobante.id })}
    viaja
  />
{:else if fila.ref.tipo === "recibo"}
  <ReciboDeLaTabla {app} id={fila.ref.id} bind:abierto />
{/if}
