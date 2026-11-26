<!-- Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/componentes/Panel.svelte.
     Cambios: la lógica no cambió (comentarios y ejemplos que nombraban cosas de la Demo 2 se reescribieron). Aspecto:
     una sola superficie (la barra de título y la de estado ya no tienen fondo propio, solo una línea), radio de 8 px, sombra mínima, título en la condensada,
     sin el realce del borde al tener el foco adentro; se suma `relleno` (interior a ras para tablas y listas). Sin plegar y sin franja de color, como pide docs/diseno-ui.md 5.5. -->
<script lang="ts">
  // 5.5 Panel: barra de título (identifica) · herramientas (actúan, opcionales) · interior · barra de estado (informa).
  // Sin plegar y sin `overflow: hidden` (cortaría los anillos de foco). El marco nunca cambia de color por el estado de los datos.
  //
  // - `titulo` es un h2 con tabindex="-1": la pantalla que abre un diálogo lo pasa como `focoDestino` del diálogo para que el foco
  //   vuelva ahí si el botón que lo abrió desapareció (5.14; el diálogo solo conoce el h1 de la página). Su id se puede fijar con `id`.
  // - `estado` es el texto de la barra de estado (role="status"). La región existe siempre, vacía mide 0 y el mensaje
  //   no desaparece solo: lo reemplaza la acción siguiente.
  //   Para que un lector de pantalla lo diga, el texto entra a la región unos 80 ms después de pedirlo (nunca nace junto con ella) y, si ya
  //   había uno, se vacía antes: así también se anuncia el segundo mensaje igual al primero. `repetir` es cualquier valor que
  //   cambie cada vez que la pantalla emite un mensaje (aunque el texto sea el mismo). La barra no se achica entre uno y otro.
  // - `contenidoEstado` (opcional) pone en su lugar un contenido fijo con un control adentro:
  //   al no ser un mensaje que cambia, esa barra no es `role="status"`.
  // - El interior es un contenedor de consultas (`interior`) para que las tablas cambien de disposición por su ancho.
  import type { Snippet } from "svelte";
  import { textoAnunciado } from "./anuncio.svelte.ts";
  import Icono from "./Icono.svelte";
  import type { NombreIcono } from "./tipos.ts";

  let {
    titulo,
    id,
    icono,
    meta = "",
    estado = "",
    repetir,
    contenidoEstado,
    herramientas,
    controles,
    relleno = "normal",
    children,
  }: {
    titulo: string;
    id?: string;
    icono?: NombreIcono;
    /** Dato breve, a la derecha del título: "13 clientes". */
    meta?: string;
    estado?: string;
    /** Cambia cada vez que se emite un mensaje, aunque el texto sea el mismo (así se vuelve a anunciar). */
    repetir?: unknown;
    contenidoEstado?: Snippet;
    herramientas?: Snippet;
    controles?: Snippet;
    /** `ninguno`: el interior llega hasta los bordes del panel (tablas, listas de enlaces, gráficos con su propio margen). */
    relleno?: "normal" | "ninguno";
    children: Snippet;
  } = $props();

  const uid = $props.id();
  const idTitulo = $derived(id ?? `${uid}-titulo`);

  const anunciado = textoAnunciado(() => ({ texto: estado, repetir }));
</script>

<section class="panel" aria-labelledby={idTitulo}>
  <div class="barra" class:con-icono={icono !== undefined}>
    {#if icono !== undefined}
      <span class="icono-titulo"><Icono nombre={icono} /></span>
    {/if}
    <h2 id={idTitulo} tabindex="-1">{titulo}</h2>
    {#if meta !== ""}
      <span class="meta">{meta}</span>
    {/if}
    {#if controles !== undefined}
      <div class="controles">{@render controles()}</div>
    {/if}
  </div>
  {#if herramientas !== undefined}
    <div class="herramientas">{@render herramientas()}</div>
  {/if}
  <div class="interior" class:sin-relleno={relleno === "ninguno"}>{@render children()}</div>
  {#if contenidoEstado !== undefined}
    <div class="estado">{@render contenidoEstado()}</div>
  {:else}
    <div class="estado" class:vacio={estado === ""} role="status"><span>{anunciado.valor}</span></div>
  {/if}
</section>

<style>
  .panel {
    container: panel / inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
    box-shadow: var(--s-1);
  }

  /* ---------- Barra de título ---------- */
  .barra {
    --sangria: 0rem; /* el dato que baja a su renglón se alinea con el título: con ícono, queda corrido su ancho */
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem var(--e-3);
    min-height: 3rem;
    padding: 0.625rem var(--e-4);
    border-bottom: 1px solid var(--c-borde);
  }
  .barra.con-icono {
    --sangria: calc(1.5rem + var(--e-3));
  }
  .icono-titulo {
    --icono-tam: 1.5rem;
    display: inline-flex;
    flex: none;
    color: var(--c-tinta);
  }
  h2 {
    flex: 0 1 auto;
    min-width: 0;
    font-size: var(--t-grande);
    line-height: 1.2;
  }
  .meta {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
  }
  .controles {
    display: flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    margin-left: auto;
  }
  /* Contenedor angosto: el dato baja a un renglón propio, alineado con el título. */
  @container panel (max-width: 23.99rem) {
    .meta {
      order: 2;
      flex: 1 0 100%;
      padding-left: var(--sangria);
    }
  }

  /* ---------- Herramientas (filtros, búsqueda, orden) ----------
     Una columna; con el panel ancho, las dos primeras cosas van lado a lado (filtros a la izquierda, búsqueda a la derecha). */
  .herramientas {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.625rem;
    padding: var(--e-3) var(--e-4);
    border-bottom: 1px solid var(--c-borde);
  }
  @container panel (min-width: 56rem) {
    .herramientas {
      grid-template-columns: minmax(0, 1fr) minmax(13.75rem, 20rem);
      align-items: center;
    }
  }

  /* ---------- Interior ---------- */
  .interior {
    container: interior / inline-size;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
    padding: var(--e-4);
  }
  .interior.sin-relleno {
    gap: 0;
    padding: 0;
  }

  /* ---------- Barra de estado ----------
     Siempre en el DOM (las regiones role="status" tienen que existir antes del texto). Vacía mide 0. */
  .estado {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-4);
    padding: var(--e-2) var(--e-4);
    border-top: 1px solid var(--c-borde);
    font-size: var(--t-chico);
    line-height: 1.4;
    color: var(--c-texto-2);
  }
  .estado.vacio {
    padding-block: 0;
    border-top-width: 0;
  }
</style>