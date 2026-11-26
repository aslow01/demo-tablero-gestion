<!-- Propio de esta demo (docs/diseno-ui.md, 5.6.2). Pista de 1.125rem; el rótulo de la marca queda en el flujo,
     así un rótulo largo o el texto agrandado lo hacen crecer hacia arriba en lugar de pisar lo que está encima). -->
<script lang="ts">
  // 5.6.2 Ubicador (Comprobante): la regla de tramos en escala de días. Cinco tramos de igual ancho, solo el del comprobante pintado con su color, y una marca en sus días de atraso.
  // Es decorativo para lectores de pantalla (`aria-hidden`): lo que dice (días de atraso y tramo) está escrito al lado, en la situación del comprobante.
  // No calcula nada: la posición de la marca (en milésimas del ancho, 0 a 999), el borde cercano y los textos llegan por propiedades (`ubicadorDe`, `rotuloDelUbicador`).
  // CSP: la posición se pone con `style:left` (CSSOM, la CSP lo permite); nunca el atributo `style` en el marcado.
  import { TRAMOS } from "../lib/dominio/antiguedad.ts";
  import type { Tramo } from "../lib/dominio/antiguedad.ts";
  import type { BordeDelUbicador } from "./tipos-graficos.ts";

  let {
    tramo,
    milesimas,
    borde = null,
    rotulo,
    unidad,
    marcas = ["0", "30", "60", "90"],
  }: {
    /** El tramo del comprobante: el único que se pinta. */
    tramo: Tramo;
    /** Posición de la marca, en milésimas del ancho de la pista (0 a 999). */
    milesimas: number;
    /** Si la marca está cerca de un borde, el rótulo se alinea hacia adentro para no salirse. */
    borde?: BordeDelUbicador;
    /** Texto de la marca: «12 días», «vence el día del corte», «faltan 9 días». */
    rotulo: string;
    /** Unidad de la escala: «días». */
    unidad: string;
    /** Los números de la escala, en los cortes entre tramos (los límites de A1). */
    marcas?: readonly string[];
  } = $props();

  const pintado = $derived(TRAMOS.findIndex((t) => t.clave === tramo));
  const izquierda = $derived(`${milesimas / 10}%`);
</script>

<div class="ubicador-caja" aria-hidden="true">
  <div class="fila-rotulo">
    <span class="rotulo-marca" class:izq={borde === "izquierdo"} class:der={borde === "derecho"} style:left={izquierda}>{rotulo}</span>
  </div>
  <div class="ubicador">
    {#each TRAMOS as t, i (t.clave)}
      <i class={i === pintado ? `pintado tramo-${i}` : ""}></i>
    {/each}
    <span class="marca" style:left={izquierda}></span>
  </div>
  <div class="escala-caja">
    <div class="escala">
      {#each marcas as numero, k (k)}
        <span class="numero" style:left="{(k + 1) * 20}%">{numero}</span>
      {/each}
    </div>
    <span class="unidad">{unidad}</span>
  </div>
</div>

<style>
  .ubicador-caja {
    container: ubicador / inline-size;
    max-width: 26rem;
    min-width: 0;
  }

  /* Rótulo de la marca: en el flujo, desplazado con `left` en porcentaje del ancho de la pista y centrado sobre la marca. */
  .fila-rotulo {
    position: relative;
    margin-bottom: 0.5rem;
  }
  .rotulo-marca {
    position: relative;
    display: block;
    width: max-content;
    max-width: 60%;
    transform: translateX(-50%);
    font-size: var(--t-chico);
    font-weight: 700;
    line-height: 1.3;
    text-align: center;
    color: var(--c-texto);
    text-wrap: balance;
  }
  .rotulo-marca.izq {
    transform: none;
    text-align: left;
  }
  .rotulo-marca.der {
    transform: translateX(-100%);
    text-align: right;
  }

  /* Pista: cinco tramos de igual ancho. Apagados: superficie y borde; el del comprobante, de su color y sin borde. */
  .ubicador {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    height: 1.125rem;
  }
  .ubicador i {
    background: var(--c-superficie-2);
    border: 1px solid var(--c-borde);
  }
  .ubicador i.pintado {
    border: 0;
  }
  .ubicador i.tramo-0 {
    background: var(--c-tramo-0);
  }
  .ubicador i.tramo-1 {
    background: var(--c-tramo-1);
  }
  .ubicador i.tramo-2 {
    background: var(--c-tramo-2);
  }
  .ubicador i.tramo-3 {
    background: var(--c-tramo-3);
  }
  .ubicador i.tramo-4 {
    background: var(--c-tramo-4);
  }
  /* Marca del atraso: línea de 2 px que sobresale 0.375rem por arriba y por abajo de la pista. Al cambiar el corte se mueve de una vez, sin transición. */
  .marca {
    position: absolute;
    top: -0.375rem;
    bottom: -0.375rem;
    width: 2px;
    margin-left: -1px;
    background: var(--c-texto);
  }

  /* Escala: los números van en los cortes entre tramos (20, 40, 60 y 80 % del ancho), con su rayita; la unidad, al final a la derecha. */
  .escala-caja {
    position: relative;
    margin-top: 0.125rem;
  }
  .escala {
    position: relative;
    height: 1.5rem;
  }
  .numero {
    position: absolute;
    top: 0.5rem;
    transform: translateX(-50%);
    font-size: var(--t-chico);
    font-weight: 400;
    font-variant-numeric: tabular-nums lining-nums;
    line-height: 1.2;
    color: var(--c-texto-3);
  }
  .numero::before {
    content: "";
    position: absolute;
    left: 50%;
    top: -0.375rem;
    width: 1px;
    height: 0.375rem;
    background: var(--c-borde-fuerte);
  }
  .unidad {
    position: absolute;
    top: 0.5rem;
    right: 0;
    font-size: var(--t-chico);
    line-height: 1.2;
    color: var(--c-texto-3);
  }
  /* Pista angosta (texto agrandado o pantalla chica): la unidad baja a su renglón, alineada a la derecha, y no pisa el último número. */
  @container ubicador (max-width: 14rem) {
    .unidad {
      position: static;
      display: block;
      text-align: right;
    }
  }

  /* ---------- Colores forzados: la pista y la marca son datos ---------- */
  @media (forced-colors: active) {
    .ubicador i {
      forced-color-adjust: none;
      border-color: CanvasText;
    }
    .ubicador i.pintado {
      outline: 1px solid CanvasText;
    }
    .marca {
      forced-color-adjust: none;
      background: CanvasText;
    }
  }
</style>
