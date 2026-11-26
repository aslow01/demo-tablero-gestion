<!-- Propio de esta demo (docs/diseno-ui.md, 5.6.1). Cada renglón de la lista es un enlace entero al desglose del
     tramo (con la cifra subrayada), el tramo que se apunta resalta en la barra, y la lista se puede omitir (`sinLista`) cuando otra cosa de la pantalla ya hace de lista. -->
<script lang="ts">
  // 5.6.1 Regla de tramos (barra apilada de antigüedad): una barra con un tramo por cada importe mayor que 0, de ancho proporcional,
  // y debajo la lista de los cinco tramos con su importe y su porcentaje. La barra es un resumen gráfico: los datos completos están en la lista.
  // No escribe ninguna cifra: los importes y los porcentajes (M3, suman 100,0 %) llegan por propiedades, el `aria-label` y los destinos los arma la lógica.
  // Interactiva: un renglón con `href` y con importe es un enlace (Tab, Enter, foco visible, objetivo de 44 px). Con importe 0 o sin `href` no lo es.
  // CSP: el ancho de cada tramo se pone con `style:flex-grow` (CSSOM, la CSP lo permite); nunca el atributo `style` en el marcado.
  import type { Snippet } from "svelte";
  import { TRAMOS } from "../lib/dominio/antiguedad.ts";
  import { formatearImporte, formatearPorcentaje } from "../lib/dominio/dinero.ts";
  import { ROTULO_DE_TRAMO } from "../lib/dominio/textos.ts";
  import type { TramoDeRegla, VarianteDeRegla } from "./tipos-graficos.ts";

  let {
    tramos,
    ariaLabel,
    variante = "completa",
    textoVacio,
    titulo,
    sinLista = false,
    cifra,
  }: {
    /** Los cinco tramos de A1, en orden (no vencido a más de 90 días). Con importe 0 no se dibuja el tramo, pero el renglón de la lista se muestra. */
    tramos: readonly TramoDeRegla[];
    /** Resumen para lectores de pantalla, con los cinco valores (lo arma la lógica). */
    ariaLabel: string;
    /** Completa (Resumen, 1.375rem), mediana (Cliente, 1rem) o mínima (columna de una tabla: 0.5rem × 6rem, sin lista y oculta a lectores de pantalla). */
    variante?: VarianteDeRegla;
    /** Frase cuando no hay saldo a cobrar (todos los tramos en 0): "No hay saldo a cobrar al 31/10/2026." */
    textoVacio: string;
    /** Título chico sobre la barra («Saldo a cobrar según días de atraso»). Sin él, la barra va sola. */
    titulo?: string;
    /** Solo la barra, sin la lista (la pantalla de Comprobantes: los filtros por tramo ya están al lado). */
    sinLista?: boolean;
    /** Contenido del importe de un renglón que NO es enlace (por ejemplo una cifra-enlace propia). Por defecto, el importe formateado. */
    cifra?: Snippet<[TramoDeRegla]>;
  } = $props();

  const vacia = $derived(tramos.every((t) => t.importe <= 0));
  const indiceDeTramo = (t: TramoDeRegla): number => TRAMOS.findIndex((l) => l.clave === t.clave);
  /** La regla es un resumen que se oculta a lectores en la variante mínima (la fila dice el tramo más antiguo en texto). */
  const decorativa = $derived(variante === "minima");
  const conLista = $derived(variante !== "minima" && !sinLista);
  const esEnlace = (t: TramoDeRegla): boolean => t.href !== undefined && t.importe > 0;
  const rotuloDe = (t: TramoDeRegla): string => t.rotulo ?? ROTULO_DE_TRAMO[t.clave];
</script>

{#snippet cuerpo(tramo: TramoDeRegla, enlace: boolean)}
  <span class="muestra tramo-{indiceDeTramo(tramo)}" aria-hidden="true"></span>
  <span class="rotulo-tramo">{rotuloDe(tramo)}</span>
  <span class="importe num" class:subrayado={enlace}>
    {#if !enlace && cifra !== undefined && tramo.importe > 0}{@render cifra(tramo)}{:else}{formatearImporte(tramo.importe)}{/if}
  </span>
  <span class="porcentaje num">{formatearPorcentaje(tramo.porcentaje)}</span>
{/snippet}

<div class="regla-tramos {variante}">
  {#if titulo !== undefined && titulo !== "" && variante !== "minima"}
    <h3 class="rotulo">{titulo}</h3>
  {/if}
  {#if vacia}
    {#if variante === "minima"}
      <span class="guion" aria-hidden="true">—</span>
    {:else}
      <div class="vacio">
        <span class="regla-vacia" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <p>{textoVacio}</p>
      </div>
    {/if}
  {:else}
    <div class="regla" role={decorativa ? undefined : "img"} aria-label={decorativa ? undefined : ariaLabel} aria-hidden={decorativa ? "true" : undefined}>
      {#each tramos.filter((t) => t.importe > 0) as tramo (tramo.clave)}
        <span class="tramo tramo-{indiceDeTramo(tramo)}" style:flex-grow={tramo.importe}></span>
      {/each}
    </div>
    {#if conLista}
      <ul class="lista">
        {#each tramos as tramo (tramo.clave)}
          <li>
            {#if esEnlace(tramo)}
              <a class="item t-{indiceDeTramo(tramo)}" href={tramo.href} data-m={tramo.medida} data-c={tramo.importe}>{@render cuerpo(tramo, true)}</a>
            {:else}
              <span class="item t-{indiceDeTramo(tramo)}" data-m={tramo.medida} data-c={tramo.importe}>{@render cuerpo(tramo, false)}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .regla-tramos {
    container: regla / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
  }
  .regla-tramos.minima {
    width: 6rem;
    max-width: 100%;
  }

  /* ---------- Barra: la pista se ve en los 2 px entre tramos. Sin radio (un extremo redondeado hace parecer más chico un importe chico). ---------- */
  .regla {
    display: flex;
    gap: 2px;
    height: 1.375rem;
    background: var(--c-superficie-2);
  }
  .mediana .regla {
    height: 1rem;
  }
  .minima .regla {
    height: 0.5rem;
    gap: 1px;
  }
  .tramo {
    flex-basis: 0;
    flex-shrink: 1;
    min-width: 3px;
    transition: opacity var(--m-rapido) var(--m-curva);
  }
  .tramo-0 {
    background: var(--c-tramo-0);
  }
  .tramo-1 {
    background: var(--c-tramo-1);
  }
  .tramo-2 {
    background: var(--c-tramo-2);
  }
  .tramo-3 {
    background: var(--c-tramo-3);
  }
  .tramo-4 {
    background: var(--c-tramo-4);
  }
  .minima .guion {
    color: var(--c-texto-3);
  }

  /* Al apuntar o enfocar un renglón, los otros tramos de la barra se apagan (solo visual: la lista ya dice todo). */
  .regla-tramos:has(.item.t-0:focus-visible) .regla .tramo:not(.tramo-0),
  .regla-tramos:has(.item.t-1:focus-visible) .regla .tramo:not(.tramo-1),
  .regla-tramos:has(.item.t-2:focus-visible) .regla .tramo:not(.tramo-2),
  .regla-tramos:has(.item.t-3:focus-visible) .regla .tramo:not(.tramo-3),
  .regla-tramos:has(.item.t-4:focus-visible) .regla .tramo:not(.tramo-4) {
    opacity: 0.35;
  }
  @media (hover: hover) {
    .regla-tramos:has(.item.t-0:hover) .regla .tramo:not(.tramo-0),
    .regla-tramos:has(.item.t-1:hover) .regla .tramo:not(.tramo-1),
    .regla-tramos:has(.item.t-2:hover) .regla .tramo:not(.tramo-2),
    .regla-tramos:has(.item.t-3:hover) .regla .tramo:not(.tramo-3),
    .regla-tramos:has(.item.t-4:hover) .regla .tramo:not(.tramo-4) {
      opacity: 0.35;
    }
  }

  /* ---------- Lista de tramos ----------
     Cuatro disposiciones por consulta de contenedor (en rem, así acompañan al texto agrandado): apilada (< 18rem: cada dato en su renglón, sin nada que empuje el ancho),
     renglones de dos líneas (18rem a 26rem: rótulo e importe en una fila y el porcentaje debajo), renglones de una línea (26rem a 40rem: muestra, rótulo, importe y
     porcentaje en la misma fila; es la de la columna angosta del Resumen en escritorio, que así no empuja hacia abajo el panel del movimiento del mes) y cinco columnas
     (desde 40rem). */
  .lista {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .item {
    display: grid;
    grid-template-columns: 0.75rem minmax(0, 1fr);
    grid-template-areas:
      "muestra rotulo"
      ". importe"
      ". porcentaje";
    align-items: baseline;
    column-gap: var(--e-2);
    row-gap: var(--e-1);
    min-height: var(--alto-tactil);
    padding: var(--e-2) var(--e-2);
    border-radius: var(--r-1);
    color: var(--c-texto);
    text-decoration: none;
    font-size: var(--t-tabla);
    line-height: 1.35;
  }
  a.item {
    cursor: pointer;
  }
  @media (hover: hover) {
    a.item:hover {
      background: var(--c-superficie-2);
    }
    a.item:hover .importe {
      text-decoration-thickness: 2px;
    }
  }
  .muestra {
    grid-area: muestra;
    align-self: center;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 2px;
  }
  .rotulo-tramo {
    grid-area: rotulo;
    font-size: var(--t-chico);
    font-weight: 650;
    color: var(--c-texto);
  }
  .importe {
    grid-area: importe;
    white-space: nowrap;
    font-size: var(--t-medio);
    color: var(--c-texto);
  }
  .importe.subrayado {
    text-decoration: underline 1px var(--c-enlace);
    text-underline-offset: 0.22em;
  }
  .porcentaje {
    grid-area: porcentaje;
    font-size: var(--t-chico);
    color: var(--c-texto-2);
  }

  @container regla (min-width: 18rem) {
    .item {
      grid-template-columns: 0.75rem minmax(0, 1fr) auto;
      grid-template-areas:
        "muestra rotulo importe"
        ". . porcentaje";
      row-gap: 0;
    }
    .importe,
    .porcentaje {
      text-align: right;
    }
  }

  @container regla (min-width: 26rem) {
    .item {
      grid-template-columns: 0.75rem minmax(0, 1fr) auto 3.5rem;
      grid-template-areas: "muestra rotulo importe porcentaje";
      align-items: center;
      padding-block: var(--e-1);
    }
    .porcentaje {
      justify-self: end;
    }
  }
  /* Con puntero fino (mouse) el renglón no necesita los 44 px del dedo: la lista de una línea mide 1,75 rem (28 px) por tramo (WCAG 2.2: el mínimo es 24 px). En pantallas táctiles se conservan los 44 px. */
  @media (pointer: fine) {
    @container regla (min-width: 26rem) {
      .item {
        min-height: 1.75rem;
      }
    }
  }

  @container regla (min-width: 40rem) {
    .lista {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0 var(--e-1);
    }
    .item {
      grid-template-columns: 0.75rem minmax(0, 1fr);
      grid-template-areas:
        "muestra rotulo"
        ". importe"
        ". porcentaje";
      align-items: baseline;
      row-gap: 1px;
      column-gap: var(--e-2);
      min-height: var(--alto-tactil);
      padding: var(--e-2) var(--e-1);
    }
    .rotulo-tramo {
      white-space: nowrap;
    }
    .importe,
    .porcentaje {
      justify-self: start;
      text-align: left;
    }
  }

  /* ---------- Vacío: sin barra ni lista (5.13). Cinco cajitas de borde punteado en lugar de la barra. ---------- */
  .vacio {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-3);
    padding: var(--e-4);
    border: 1px dashed var(--c-borde-fuerte);
    border-radius: var(--r-2);
    color: var(--c-texto-2);
  }
  .vacio p {
    color: var(--c-texto);
  }
  .regla-vacia {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    width: 7.5rem;
    max-width: 100%;
    height: 0.875rem;
  }
  .regla-vacia i {
    border: 1.5px dashed var(--c-borde-fuerte);
  }

  /* ---------- Colores forzados: los tramos son datos; si el sistema borra el color no queda barra ---------- */
  @media (forced-colors: active) {
    .tramo,
    .muestra {
      forced-color-adjust: none;
      outline: 1px solid CanvasText;
    }
    .vacio,
    .regla-vacia i {
      border-color: CanvasText;
    }
  }
</style>
