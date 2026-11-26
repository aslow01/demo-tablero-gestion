<!-- Barra de pestañas de abajo del celular y la tableta (hasta 64 rem): las cuatro secciones, con la insignia de los clientes para revisar. Fija abajo. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { SECCIONES } from "../../lib/estado/navegacion.ts";
  import { ROTULO_DE_SECCION } from "../../lib/vistas/rotulos.ts";
  import Icono from "../Icono.svelte";
  import { TEXTO_MARCO } from "../textos-marco.ts";

  let { app, paraRevisar }: { app: AplicacionLista; paraRevisar: number } = $props();
</script>

<nav class="pestanas" data-fijo="pestanas" aria-label={TEXTO_MARCO.navegacionDeSecciones}>
  <ul>
    {#each SECCIONES as seccion (seccion)}
      {@const conInsignia = seccion === "clientes" && paraRevisar > 0}
      <li>
        <a
          class="pestana"
          href={app.direccion.enlace({ tipo: seccion })}
          aria-current={app.direccion.seccion === seccion ? (app.direccion.esRaiz ? "page" : "true") : undefined}
        >
          <span class="caja">
            <Icono nombre={seccion} />
            {#if conInsignia}<span class="insignia" aria-hidden="true">{paraRevisar}</span>{/if}
          </span>
          <span class="texto">{ROTULO_DE_SECCION[seccion]}</span>
          {#if conInsignia}<span class="solo-lectores">, {TEXTO_MARCO.clientesParaRevisar(paraRevisar)}</span>{/if}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .pestanas {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--c-superficie);
    border-top: 1px solid var(--c-borde);
    box-shadow: var(--s-pestanas);
  }
  @media (min-width: 64rem) {
    .pestanas {
      display: none;
    }
  }
  ul {
    /* Contenedor de consultas solo para medir el ancho de la barra: el rótulo de cada pestaña se acota a lo que entra en su columna (ver `.pestana`). */
    container-type: inline-size;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    max-width: 40rem;
    margin: 0 auto;
  }
  .pestana {
    --icono-tam: 1.5rem;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-height: var(--alto-pestanas);
    padding: 0.375rem 2px 0.25rem;
    color: var(--c-texto-2);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-marca);
    /* El rótulo mide 13 px como máximo. Con el texto agrandado al 200 % «Comprobantes» (la palabra más larga) no entra en un cuarto de 360 px y se partiría en dos
       renglones: el tamaño nunca pasa de lo que cabe en la columna, el 3,6 % del ancho de la barra (12,96 px a 360 px, 11,5 px a 320 px). */
    font-size: min(var(--t-chico), 3.6cqi);
    font-weight: 650;
    line-height: 1.1;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }
  .pestana:focus-visible {
    outline-offset: -4px;
    border-radius: var(--r-2);
  }
  .caja {
    position: relative;
    display: grid;
    place-items: center;
    width: min(3.25rem, 100%);
    height: 1.875rem;
    border-radius: var(--r-pildora);
  }
  @media (hover: hover) {
    .pestana:hover .caja {
      background: var(--c-superficie-2);
    }
  }
  .pestana[aria-current] {
    color: var(--c-texto);
    font-weight: 750;
  }
  .pestana[aria-current] .caja {
    background: var(--c-tinta);
    color: var(--c-sobre-tinta);
  }
  .texto {
    max-width: 100%;
    overflow-wrap: anywhere;
    text-align: center;
  }
  .insignia {
    position: absolute;
    top: -0.3125rem;
    left: calc(50% + 0.5rem);
    display: grid;
    place-items: center;
    min-width: 1.1875rem;
    height: 1.1875rem;
    padding: 0 0.3125rem;
    border: 1px solid var(--c-revisar-r);
    border-radius: var(--r-pildora);
    background: var(--c-revisar-f);
    color: var(--c-revisar-t);
    font-family: var(--t-familia);
    font-stretch: 100%;
    font-size: 0.71875rem;
    font-weight: 750;
    line-height: 1;
  }
</style>
