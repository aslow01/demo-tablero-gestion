<!-- Propio de esta demo. -->
<script lang="ts">
  // Cifra-enlace: todo importe que tiene desglose lleva a él. La cifra no se tiñe: el subrayado azul dice «esto se abre».
  //
  // - `nombre` es la medida dicha en palabras («Mora», «Cobranza de octubre»): un importe suelto no la dice, y el enlace tiene que tener nombre. Lo leen solo los lectores de pantalla.
  // - El enlace lleva `data-m` y `data-c` (contrato de marcado); `columna` pone `data-col` (la columna de la tabla de la que es la cifra).
  // - Objetivo táctil: el área pulsable se extiende hasta 44 px de alto con un pseudoelemento, sin cambiar el alto de la línea.
  import type { Centavos } from "../lib/dominio/dinero.ts";
  import type { RefDeMedida } from "../lib/vistas/tipos.ts";
  import Cifra, { claveDeMedida } from "./Cifra.svelte";
  import type { TamanoDeCifra } from "./Cifra.svelte";

  let {
    href,
    importe,
    ref,
    corte,
    nombre,
    tamano = "texto",
    columna,
  }: {
    /** El desglose de la medida (`#/desglose/…`). */
    href: string;
    importe: Centavos;
    ref: RefDeMedida;
    corte: string;
    nombre: string;
    tamano?: TamanoDeCifra;
    columna?: string;
  } = $props();
</script>

<a class="cifra-enlace" {href} data-m={claveDeMedida(ref, corte)} data-c={importe} data-col={columna}><span class="solo-lectores">{nombre}:&nbsp;</span><Cifra {importe} {tamano} /></a>

<style>
  .cifra-enlace {
    position: relative;
    /* 24 px de alto como mínimo (2.5.8, y lo que promete docs/diseno-ui.md 3.5); la cifra queda centrada y subrayada. Los 44 px del dedo los da el `::after`. */
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem;
    max-width: 100%;
    border-radius: var(--r-1);
    color: var(--c-texto);
    text-decoration: underline;
    text-decoration-color: var(--c-enlace);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.22em;
    text-decoration-skip-ink: none;
  }
  /* En una tabla, el margen negativo devuelve a la fila los 4 px que suma el mínimo de 24 px (la altura de las filas no cambia). */
  :global(:is(td, th)) .cifra-enlace {
    margin-block: -0.125rem;
  }
  /* Área pulsable de 44 px de alto como mínimo: crece hacia arriba y abajo solo si la línea es más baja. */
  .cifra-enlace::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block: min(0px, calc((var(--alto-tactil) - 100%) / -2));
  }
  @media (hover: hover) {
    .cifra-enlace:hover {
      background: var(--c-acento-suave);
      text-decoration-thickness: 2px;
    }
  }
  .cifra-enlace:active {
    text-decoration-color: var(--c-tinta-hover);
  }
</style>
