<!-- Resumen: posición al corte (franja de la mora, saldo y regla de tramos), movimiento del mes, deudores, lo que hay para
     revisar y el gráfico de 12 meses (en el celular, una fila que lleva a Meses). Dibuja el modelo de vista `vistaResumen`: no calcula ninguna cifra. -->
<script lang="ts">
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import { vistaResumen } from "../lib/vistas/resumen.ts";
  import Cabecera from "../componentes/Cabecera.svelte";
  import { TEXTO_MARCO, TEXTO_RESUMEN } from "../componentes/textos-marco.ts";
  import Deudores from "./resumen/Deudores.svelte";
  import GraficoDelResumen from "./resumen/GraficoDelResumen.svelte";
  import Movimiento from "./resumen/Movimiento.svelte";
  import ParaRevisar from "./resumen/ParaRevisar.svelte";
  import Posicion from "./resumen/Posicion.svelte";

  let { app }: { app: AplicacionLista } = $props();

  const corte = $derived(app.direccion.corte);
  const v = $derived(vistaResumen(app.datos, corte));
</script>

<Cabecera titulo={TEXTO_RESUMEN.titulo(corte)}>
  {#snippet bajada()}<span class="solo-celular">{TEXTO_MARCO.empresa(app.datos.empresa.nombre)}.</span>{" "}{TEXTO_RESUMEN.bajada}{/snippet}
</Cabecera>

<div class="grilla" class:sin-revisar={v.paraRevisar.cantidad === 0}>
  <div class="a-pos"><Posicion {app} {v} /></div>
  <div class="a-mov"><Movimiento {app} {v} /></div>
  <div class="a-deu"><Deudores {app} {v} /></div>
  {#if v.paraRevisar.cantidad > 0}
    <div class="a-rev"><ParaRevisar {app} {v} /></div>
  {/if}
  <div class="a-gra"><GraficoDelResumen {app} {v} /></div>
</div>

<style>
  .grilla {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--e-4);
  }
  .grilla > * {
    min-width: 0;
  }
  /* En escritorio el lateral oscuro ya dice cuál es la empresa. */
  @media (min-width: 64rem) {
    .solo-celular {
      display: none;
    }
  }
  /* Desde 80rem: la posición arriba, el movimiento y lo que hay para revisar a la izquierda, los deudores a la derecha y el gráfico abajo. */
  @media (min-width: 80rem) {
    .grilla {
      grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
      grid-template-areas:
        "pos pos"
        "mov deu"
        "rev deu"
        "gra gra";
      align-items: start;
    }
    .grilla.sin-revisar {
      grid-template-areas:
        "pos pos"
        "mov deu"
        "gra gra";
    }
    .a-pos {
      grid-area: pos;
    }
    .a-mov {
      grid-area: mov;
    }
    .a-deu {
      grid-area: deu;
    }
    .a-rev {
      grid-area: rev;
    }
    .a-gra {
      grid-area: gra;
    }
  }
</style>
