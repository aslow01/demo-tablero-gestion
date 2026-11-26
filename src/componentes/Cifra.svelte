<!-- Propio de esta demo. -->
<script lang="ts" module>
  import type { RefDeMedida } from "../lib/vistas/tipos.ts";

  /** Tamaños de la cifra: `texto` hereda el tamaño del lugar donde está (tablas, frases); `cifra` es --t-cifra; `cabecera` es 1,3 veces eso; `grande` es --t-cifra-g (la mora). */
  export type TamanoDeCifra = "texto" | "cifra" | "cabecera" | "grande";

  /**
   * El valor de `data-m` (contrato de marcado): `medida|cliente|mes|corte`, con vacío donde no aplica. Lo comparten la cifra, la cifra-enlace y las
   * tablas, para que la prueba de cifras cruce lo que se ve con el dominio sin adivinar.
   */
  export function claveDeMedida(ref: RefDeMedida, corte: string): string {
    return `${ref.clave}|${ref.clienteId ?? ""}|${ref.mes ?? ""}|${corte}`;
  }
</script>

<script lang="ts">
  // Un importe en pesos. Lo recibe en centavos y lo dibuja con el texto de `formatearImporte` (no hay otra cuenta). En `cifra`, `cabecera` y `grande` los centavos van más chicos
  // y el entero puede partirse después de cada punto de miles (con el texto agrandado al 200 % la mora no ensancha la página); en `texto` es un solo texto que no se parte.
  //
  // - Con `ref` (de qué medida es) y `corte` lleva `data-m` y `data-c` (centavos), como pide el contrato de marcado. Sin ellos, solo se ve (el ejemplo de un texto, un importe sin desglose).
  // - Personalización desde afuera, sin `:global`: `--cifra-centavos` (color de los centavos; en la franja de la mora, el de «sobre la franja») y `--cifra-peso`.
  //   El color de la cifra es el del lugar donde está.
  import { formatearImporte } from "../lib/dominio/dinero.ts";
  import type { Centavos } from "../lib/dominio/dinero.ts";
  import { partesDeImporte } from "../lib/vistas/formato.ts";

  let {
    importe,
    tamano = "texto",
    ref,
    corte,
  }: {
    importe: Centavos;
    tamano?: TamanoDeCifra;
    /** Qué medida es el importe. Junto con `corte`, pone `data-m` y `data-c`. */
    ref?: RefDeMedida;
    /** Fecha de corte con la que se calculó (AAAA-MM-DD). */
    corte?: string;
  } = $props();

  const partes = $derived(partesDeImporte(importe));
  const grupos = $derived(partes.enteros.split("."));
  const dataM = $derived(ref !== undefined && corte !== undefined ? claveDeMedida(ref, corte) : undefined);
</script>

<span class="cifra" data-tamano={tamano} data-m={dataM} data-c={dataM !== undefined ? importe : undefined}>
  {#if tamano === "texto"}{formatearImporte(importe)}{:else}<span class="ent">{partes.negativo ? "−" : ""}$&nbsp;{#each grupos as grupo, i (i)}{#if i > 0}.<wbr />{/if}{grupo}{/each}</span><span class="cv">,{partes.centavos}</span>{/if}
</span>

<style>
  /* Importes y fechas: la condensada de los títulos con cifras tabulares (las de la de texto son demasiado anchas). */
  .cifra {
    font-family: var(--t-familia-cifra);
    font-stretch: var(--t-ancho-seccion);
    font-weight: var(--cifra-peso, var(--t-peso-cifra));
    font-variant-numeric: tabular-nums lining-nums;
    letter-spacing: 0.01em;
    /* Un importe que se parte en la línea de una tabla miente: en texto corrido no se parte nunca. */
    white-space: nowrap;
  }

  /* Las tres grandes: la más condensada, apretada y sin interlineado extra. Pueden partirse después de un punto de miles (<wbr>) o, como último recurso, en cualquier lugar. */
  .cifra:not([data-tamano="texto"]) {
    font-stretch: var(--t-ancho-titulo);
    font-weight: var(--cifra-peso, var(--t-peso-titulo));
    letter-spacing: -0.02em;
    line-height: 1;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .cifra[data-tamano="cifra"] {
    font-size: var(--t-cifra);
  }
  .cifra[data-tamano="cabecera"] {
    font-size: calc(var(--t-cifra) * 1.3);
  }
  .cifra[data-tamano="grande"] {
    font-size: var(--t-cifra-g);
  }

  /* Los centavos: más chicos y más claros que el entero. */
  .cv {
    font-size: var(--t-centavos);
    color: var(--cifra-centavos, var(--c-texto-2));
    letter-spacing: 0;
  }
</style>
