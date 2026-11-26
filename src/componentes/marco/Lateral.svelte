<!-- Barra lateral oscura de escritorio (desde 64 rem): la marca, las cuatro secciones con la insignia de los clientes para revisar y, al pie, «Cómo se calcula»,
     «Volver al portafolio» y la fuente de los datos. La sección activa es una pestaña de fichero: sale de la barra y entra al contenido, con el corte en diagonal. -->
<script lang="ts">
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { SECCIONES } from "../../lib/estado/navegacion.ts";
  import { ROTULO_DE_SECCION } from "../../lib/vistas/rotulos.ts";
  import Icono from "../Icono.svelte";
  import { TEXTO_MARCO, TEXTO_PIE } from "../textos-marco.ts";
  import { URL_DEL_PORTAFOLIO } from "./enlaces-externos.ts";

  let { app, paraRevisar }: { app: AplicacionLista; paraRevisar: number } = $props();

  const enComoSeCalcula = $derived(app.direccion.ruta.tipo === "como-se-calcula");
</script>

<div class="lateral">
  <div class="cabecera">
    <a class="marca" href={app.direccion.enlace({ tipo: "resumen" })}><Icono nombre="marca" />{TEXTO_MARCO.nombre}</a>
    <span class="etiqueta-demo">{TEXTO_MARCO.etiquetaDemo}</span>
    <p class="empresa">{TEXTO_MARCO.empresa(app.datos.empresa.nombre)}</p>
  </div>

  <nav aria-label={TEXTO_MARCO.navegacionDeSecciones}>
    <ul>
      {#each SECCIONES as seccion (seccion)}
        {@const conInsignia = seccion === "clientes" && paraRevisar > 0}
        <li>
          <a
            class="item"
            href={app.direccion.enlace({ tipo: seccion })}
            aria-current={app.direccion.seccion === seccion ? (app.direccion.esRaiz ? "page" : "true") : undefined}
          >
            <Icono nombre={seccion} />
            <span>{ROTULO_DE_SECCION[seccion]}</span>
            {#if conInsignia}<span class="insignia" aria-hidden="true">{paraRevisar}</span>{/if}
            {#if conInsignia}<span class="solo-lectores">, {TEXTO_MARCO.clientesParaRevisar(paraRevisar)}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="pie">
    <ul>
      <li>
        <a class="item" href={app.direccion.enlace({ tipo: "como-se-calcula" })} aria-current={enComoSeCalcula ? "page" : undefined}>
          <Icono nombre="ayuda" />
          <span>{TEXTO_MARCO.comoSeCalcula}</span>
        </a>
      </li>
      <li>
        <a class="item" href={URL_DEL_PORTAFOLIO} rel="noopener">
          <Icono nombre="flecha-izq" />
          <span>{TEXTO_PIE.volverAlPortafolio}</span>
        </a>
      </li>
    </ul>
    <p class="fuente">{TEXTO_PIE.fuenteDeDatos(app.datos.desde.slice(0, 7), app.datos.hasta.slice(0, 7))}</p>
  </div>
</div>

<style>
  .lateral {
    display: none;
  }
  @media (min-width: 64rem) {
    .lateral {
      /* Sobre el azul de noche el anillo de foco es claro. */
      --c-foco: var(--c-lateral-foco);
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      height: 100dvh;
      overflow-y: auto;
      background: var(--c-lateral);
      color: var(--c-lateral-texto);
    }
  }

  .cabecera {
    padding: 1.375rem var(--e-4) 1.125rem 1.25rem;
    border-bottom: 1px solid var(--c-lateral-borde);
  }
  .marca {
    --icono-tam: 1.5rem;
    display: inline-flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    color: var(--c-lateral-texto);
    font-family: var(--t-familia-titulo);
    font-stretch: var(--t-ancho-marca);
    font-size: 1.25rem;
    font-weight: 750;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .etiqueta-demo {
    display: inline-block;
    margin-top: 0.625rem;
    padding: 3px var(--e-2);
    border: 1px solid var(--c-lateral-borde);
    border-radius: var(--r-1);
    color: var(--c-lateral-texto-2);
    font-size: 0.71875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .empresa {
    margin-top: 0.625rem;
    color: var(--c-lateral-texto-2);
    font-size: var(--t-chico);
    line-height: 1.35;
  }

  nav {
    padding: 0.875rem 0 0.875rem var(--e-3);
  }
  .pie {
    margin-top: auto;
    padding: var(--e-3) 0 var(--e-4) var(--e-3);
    border-top: 1px solid var(--c-lateral-borde);
  }
  .fuente {
    padding: 0.625rem 1.25rem 0 var(--e-3);
    color: var(--c-lateral-texto-2);
    font-size: 0.78125rem;
    line-height: 1.4;
  }

  .item {
    --icono-tam: 1.25rem;
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--e-3);
    min-height: var(--alto-tactil);
    padding: 0 var(--e-4) 0 var(--e-3);
    border-radius: var(--r-1) 0 0 var(--r-1);
    color: var(--c-lateral-texto-2);
    font-size: var(--t-medio);
    font-weight: 600;
    text-decoration: none;
    isolation: isolate;
  }
  /* El anillo va por adentro: el item llega al borde del lateral y por afuera se cortaría. */
  .item:focus-visible {
    outline-offset: -3px;
  }
  @media (hover: hover) {
    .item:hover {
      background: var(--c-lateral-hover);
      color: var(--c-lateral-texto);
    }
  }
  /* Activa: el fondo de la página entra a la barra (corte en diagonal arriba a la derecha), con marca de tinta de 3 px y negrita. */
  .item[aria-current] {
    background: none;
    color: var(--c-texto);
    font-weight: 750;
  }
  .item[aria-current]::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--r-1) 0 0 var(--r-1);
    background: var(--c-fondo);
    clip-path: polygon(0 0, calc(100% - var(--muesca)) 0, 100% var(--muesca), 100% 100%, 0 100%);
  }
  .item[aria-current]::after {
    content: "";
    position: absolute;
    top: 0.5625rem;
    bottom: 0.5625rem;
    left: 0;
    width: 3px;
    border-radius: 2px;
    background: var(--c-tinta);
  }
  .item[aria-current] :global(.icono) {
    color: var(--c-tinta);
  }
  .item[aria-current]:focus-visible {
    outline-color: var(--c-tinta);
  }

  .insignia {
    display: grid;
    place-items: center;
    min-width: 1.1875rem;
    height: 1.1875rem;
    margin-left: auto;
    padding: 0 0.3125rem;
    border: 1px solid var(--c-revisar-r);
    border-radius: var(--r-pildora);
    background: var(--c-revisar-f);
    color: var(--c-revisar-t);
    font-size: 0.71875rem;
    font-weight: 750;
    line-height: 1;
  }
</style>
