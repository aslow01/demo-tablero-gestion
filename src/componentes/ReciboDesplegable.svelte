<!-- Propio de esta demo (docs/diseno-ui.md, 5.9.4). -->
<script lang="ts" module>
  /** Un renglón del detalle de un recibo: «Medios», «Imputado a», «A cuenta»… Con `texto` basta; si el valor lleva enlaces o etiquetas, lo dibuja el snippet `valor`. */
  export interface FilaDeDetalleDeRecibo {
    clave: string;
    rotulo: string;
    texto?: string;
  }
</script>

<script lang="ts">
  // 5.9.4 Recibo desplegable (dentro de una tabla o de una lista): un recibo no tiene vista propia, su número es un botón que muestra el detalle en su lugar.
  // - `button` con `aria-expanded`; cuando está abierto, `aria-controls` apunta al detalle (`#det-{id}`). Al abrir, el foco se queda en el botón.
  // - El detalle se agrega y se quita del DOM (no `hidden` con animación de alto). No navega ni cambia la dirección.
  // - En una tabla, el detalle va en una fila propia debajo de la del botón: la pantalla usa la pieza dos veces, con el mismo `abierto` (`bind:abierto`):
  //   `parte="boton"` en la celda del movimiento y `parte="detalle"` dentro de la celda con `colspan` de la fila siguiente. Sin tabla, `parte="completo"` (por defecto)
  //   dibuja el botón y, debajo, el detalle.
  // - No arma ningún texto ni lee el estado: el prefijo para lectores («Recibo »), los rótulos de los renglones y sus valores llegan por propiedades.
  import type { Snippet } from "svelte";
  import Icono from "./Icono.svelte";

  let {
    id,
    prefijo,
    abierto = $bindable(false),
    parte = "completo",
    filas,
    valor,
  }: {
    /** El número del recibo, tal como se muestra («R-0003-00000045»). Arma el `id` del detalle (`det-{id}`). */
    id: string;
    /** Texto solo para lectores de pantalla, antes del número: «Recibo ». */
    prefijo: string;
    abierto?: boolean;
    parte?: "completo" | "boton" | "detalle";
    /** Los renglones del detalle, en orden. */
    filas: readonly FilaDeDetalleDeRecibo[];
    /** Contenido de un renglón cuando no alcanza con texto (talones que enlazan, una etiqueta «Revisar imputación»). */
    valor?: Snippet<[FilaDeDetalleDeRecibo]>;
  } = $props();

  const idDetalle = $derived(`det-${id}`);
</script>

<div class="recibo">
  {#if parte !== "detalle"}
    <button
      type="button"
      class="boton-recibo"
      aria-expanded={abierto}
      aria-controls={abierto ? idDetalle : undefined}
      data-accion="recibo"
      data-recibo={id}
      data-foco="rec-{id}"
      onclick={() => (abierto = !abierto)}
    >
      <Icono nombre="chevron" /><span class="solo-lectores">{prefijo}</span><span class="codigo">{id}</span>
    </button>
  {/if}
  {#if parte !== "boton" && abierto}
    <div class="detalle" id={idDetalle}>
      <dl>
        {#each filas as fila (fila.clave)}
          <dt>{fila.rotulo}</dt>
          <dd>{#if valor !== undefined}{@render valor(fila)}{:else}{fila.texto ?? ""}{/if}</dd>
        {/each}
      </dl>
    </div>
  {/if}
</div>

<style>
  .recibo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-1);
    min-width: 0;
  }

  /* ---------- Botón: el número en monoespaciada, subrayado fino; el chevron gira al abrir ---------- */
  .boton-recibo {
    --icono-tam: 1rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-1);
    max-width: 100%;
    min-height: var(--alto-tactil);
    padding: 0 var(--e-2) 0 var(--e-1);
    margin-left: calc(var(--e-1) * -1);
    border: 0;
    border-radius: var(--r-1);
    background: none;
    color: var(--c-texto);
    font-size: var(--t-tabla);
    line-height: 1.3;
    text-align: left;
    cursor: pointer;
  }
  .boton-recibo .codigo {
    font-weight: 600;
    overflow-wrap: anywhere;
    text-decoration: underline 1px var(--c-borde-fuerte);
    text-underline-offset: 3px;
  }
  @media (hover: hover) {
    .boton-recibo:hover {
      background: var(--c-superficie-2);
    }
    .boton-recibo:hover .codigo {
      text-decoration-color: var(--c-enlace);
      text-decoration-thickness: 2px;
    }
  }
  .boton-recibo :global(.icono) {
    color: var(--c-texto-2);
    transition: transform var(--m-rapido) var(--m-curva);
  }
  .boton-recibo[aria-expanded="true"] :global(.icono) {
    transform: rotate(90deg);
  }

  /* ---------- Detalle: sobre el fondo de la página, más chico que la tabla; rótulo y valor en dos columnas (en una sola si no hay lugar) ---------- */
  .detalle {
    container: detalle / inline-size;
    width: 100%;
    min-width: 0;
    padding: var(--e-3) var(--e-4);
    border-radius: var(--r-1);
    background: var(--c-fondo);
    font-size: var(--t-chico);
    line-height: 1.45;
  }
  dl {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--e-1) var(--e-3);
    max-width: 47.5rem;
  }
  dt {
    font-weight: 650;
    color: var(--c-texto-2);
  }
  dd {
    min-width: 0;
    margin: 0;
    color: var(--c-texto);
    overflow-wrap: break-word;
  }
  @container detalle (max-width: 22rem) {
    dl {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    dd {
      margin-bottom: var(--e-2);
    }
  }
</style>
