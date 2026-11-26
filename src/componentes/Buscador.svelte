<!-- Propio de esta demo. Escrito desde cero como componente. -->
<script lang="ts">
  // Buscador: un campo de búsqueda con su etiqueta (solo para lectores de pantalla) y, si hay algo escrito, un botón para borrarlo.
  // Se actualiza en el lugar: el `input` no se vuelve a crear cuando cambia `valor` ni cuando cambia la lista de al lado, así que escribir no hace perder el foco.
  // Es un campo de la pantalla, no del estado: avisa lo escrito con `alEscribir` y la pantalla lo devuelve en `valor` (puede recortarlo o normalizarlo).
  import Boton from "./Boton.svelte";
  import Icono from "./Icono.svelte";

  let {
    id,
    etiqueta,
    marcador = "",
    valor,
    largoMaximo = 60,
    etiquetaDeBorrar,
    alEscribir,
  }: {
    /** `id` del campo (`busca-cmp`, `busca-cli`): el destino del foco de «Borrar la búsqueda». */
    id: string;
    /** Nombre del campo para lectores de pantalla («Buscar por cliente o número de comprobante»). El campo no lleva un rótulo visible. */
    etiqueta: string;
    /** Ayuda dentro del campo vacío («Cliente o número»). No reemplaza a `etiqueta`. */
    marcador?: string;
    /** Lo escrito. */
    valor: string;
    largoMaximo?: number;
    /** Nombre del botón que borra lo escrito. Sin esto no hay botón. */
    etiquetaDeBorrar?: string;
    alEscribir: (valor: string) => void;
  } = $props();

  let campo: HTMLInputElement | undefined = $state();

  function borrar(): void {
    alEscribir("");
    campo?.focus();
  }
</script>

<div class="buscador" role="search">
  <div class="campo">
    <span class="lupa"><Icono nombre="buscar" /></span>
    <label class="solo-lectores" for={id}>{etiqueta}</label>
    <input
      bind:this={campo}
      {id}
      type="search"
      value={valor}
      placeholder={marcador}
      maxlength={largoMaximo}
      autocomplete="off"
      spellcheck="false"
      data-foco={id}
      oninput={(e) => alEscribir(e.currentTarget.value)}
    />
    {#if etiquetaDeBorrar !== undefined && valor !== ""}
      <span class="borrar"><Boton variante="icono" icono="cerrar" etiqueta={etiquetaDeBorrar} onclick={borrar} data-foco="{id}-borrar" /></span>
    {/if}
  </div>
</div>

<style>
  .buscador {
    display: flex;
    min-width: 0;
  }
  .campo {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
    min-height: var(--alto-tactil);
    padding: 0 0 0 0.75rem;
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    background: var(--c-superficie);
  }
  .campo:has(input:focus-visible) {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }
  .lupa {
    display: inline-flex;
    flex: none;
    color: var(--c-texto-2);
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: 2.5rem;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: none;
    outline: none;
    /* La del navegador (la «x» chica) se cambia por el botón de 44 px. */
    appearance: none;
    -webkit-appearance: none;
  }
  input::placeholder {
    color: var(--c-texto-3);
    opacity: 1;
  }
  input::-webkit-search-cancel-button,
  input::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }
  /* El botón de 44 px entra en el borde del campo sin agrandarlo. */
  .borrar {
    display: inline-flex;
    flex: none;
    margin: -1.5px -1.5px -1.5px 0;
  }

  @media (forced-colors: active) {
    .campo:has(input:focus-visible) {
      outline-color: Highlight;
    }
  }
</style>
