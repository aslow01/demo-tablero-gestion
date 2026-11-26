<!-- Pantalla de error de una dirección: no existe, o el cliente, el comprobante o el desglose no existen. Dice qué pasó, por qué y qué hacer (ir al resumen).
     El texto sale del tipo de error y nunca repite lo que se escribió en la barra de direcciones. -->
<script lang="ts">
  import type { Ruta } from "../lib/estado/enrutador.ts";
  import Boton from "../componentes/Boton.svelte";
  import Icono from "../componentes/Icono.svelte";
  import { TEXTO_ERRORES } from "../componentes/textos-marco.ts";

  let { ruta, enlaceAlResumen }: { ruta: Extract<Ruta, { tipo: "inexistente" | "desconocida" }>; enlaceAlResumen: string } = $props();

  const texto = $derived.by(() => {
    if (ruta.tipo === "desconocida") return TEXTO_ERRORES.direccionDesconocida;
    switch (ruta.vista) {
      case "cliente":
        return TEXTO_ERRORES.clienteInexistente;
      case "comprobante":
        return TEXTO_ERRORES.comprobanteInexistente;
      case "desglose":
        return TEXTO_ERRORES.desgloseInexistente;
    }
  });
</script>

<div class="error">
  <span class="marca"><Icono nombre="vencido" /></span>
  <div class="texto">
    <h1 tabindex="-1">{texto.titulo}</h1>
    <p>{texto.cuerpo}</p>
  </div>
  <div class="acciones">
    <Boton href={enlaceAlResumen}>{TEXTO_ERRORES.irAlResumen}</Boton>
  </div>
</div>

<style>
  .error {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--e-1) 0.875rem;
    max-width: 45rem;
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
  .texto p {
    margin-top: 0.375rem;
    color: var(--c-texto-2);
  }
  .acciones {
    grid-column: 2;
    margin-top: 0.875rem;
  }
</style>
