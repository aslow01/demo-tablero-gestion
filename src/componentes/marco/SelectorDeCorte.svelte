<!-- Selector de la fecha de corte: ‹ lista de cierres › y, si no es el cierre por defecto, «Volver al …». Cambiar el corte no anima nada ni mueve el foco. -->
<script lang="ts">
  // Los 22 cierres de mes, agrupados por año (el más nuevo primero). Todo cambio de corte pasa por `direccion.cambiarCorte` (una entrada nueva del historial,
  // conservando la pantalla y sus filtros). Los textos son de `textos-marco.ts`.
  // Foco: si la flecha pulsada deja de tener a dónde ir (primer o último cierre), o desaparece «Volver al …», el foco pasa a la lista: nunca se pierde en `body`.
  import { untrack } from "svelte";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import Boton from "../Boton.svelte";
  import { TEXTO_MARCO } from "../textos-marco.ts";

  let { app }: { app: AplicacionLista } = $props();

  const cortes = $derived(app.direccion.cortes);
  const corte = $derived(app.direccion.corte);
  const indice = $derived(cortes.indexOf(corte));
  const anterior = $derived(cortes[indice - 1] ?? null);
  const siguiente = $derived(cortes[indice + 1] ?? null);
  // El corte por defecto es el último cierre (`datos.hasta`).
  const porDefecto = $derived(cortes.at(-1) ?? corte);
  const esOtro = $derived(corte !== porDefecto);
  const anios = $derived([...new Set(cortes.map((c) => c.slice(0, 4)))].reverse());

  let lista = $state<HTMLSelectElement | null>(null);
  let ultimoControl: "anterior" | "siguiente" | "volver" | null = null;

  $effect(() => {
    const sinAnterior = anterior === null;
    const sinSiguiente = siguiente === null;
    const enElPorDefecto = !esOtro;
    untrack(() => {
      const control = ultimoControl;
      ultimoControl = null;
      if ((control === "anterior" && sinAnterior) || (control === "siguiente" && sinSiguiente) || (control === "volver" && enElPorDefecto)) lista?.focus();
    });
  });

  function ir(destino: string | null, control: "anterior" | "siguiente" | "volver"): void {
    if (destino === null) return;
    ultimoControl = control;
    app.direccion.cambiarCorte(destino);
  }

  /** ‹ y ›: el paso se cuenta desde el cierre que dice la barra, no desde el que ya se dibujó, para que un doble clic avance dos cierres. */
  function mover(paso: -1 | 1, control: "anterior" | "siguiente"): void {
    if (app.direccion.moverCorte(paso)) ultimoControl = control;
  }
</script>

<div class="corte" data-estado={esOtro ? "otro" : undefined}>
  <div class="grupo">
    <label for="corte">{TEXTO_MARCO.fechaDeCorte}</label>
    <div class="controles">
      <Boton
        variante="icono-caja"
        icono="chevron-izq"
        etiqueta={anterior === null ? TEXTO_MARCO.sinCierreAnterior : TEXTO_MARCO.cierreAnterior(anterior)}
        disabled={anterior === null}
        onclick={() => mover(-1, "anterior")}
      />
      <select id="corte" bind:this={lista} value={corte} onchange={(e) => app.direccion.cambiarCorte(e.currentTarget.value)}>
        {#each anios as anio (anio)}
          <optgroup label={anio}>
            {#each cortes.filter((c) => c.startsWith(anio)).reverse() as c (c)}
              <option value={c}>{formatearFecha(c)}</option>
            {/each}
          </optgroup>
        {/each}
      </select>
      <Boton
        variante="icono-caja"
        icono="chevron"
        etiqueta={siguiente === null ? TEXTO_MARCO.sinCierrePosterior : TEXTO_MARCO.cierreSiguiente(siguiente)}
        disabled={siguiente === null}
        onclick={() => mover(1, "siguiente")}
      />
    </div>
  </div>
  {#if esOtro}
    <Boton variante="texto" icono="flecha-izq" onclick={() => ir(porDefecto, "volver")}>{TEXTO_MARCO.volverAlCorte(porDefecto)}</Boton>
  {/if}
</div>

<style>
  .corte {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.625rem;
  }
  .grupo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.25rem;
    padding: var(--e-1) 0.375rem;
    margin: calc(var(--e-1) * -1) -0.375rem;
    border: 1px solid transparent;
    border-radius: var(--r-2);
  }
  /* Un corte distinto del de por defecto se nota: la cifra ya no es la de «hoy». */
  .corte[data-estado="otro"] .grupo {
    background: var(--c-revisar-f);
    border-color: var(--c-revisar-r);
  }
  label {
    margin-right: var(--e-1);
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
    font-weight: 650;
  }
  .controles {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1);
  }
  select {
    /* Con el texto muy agrandado la lista pasa a su renglón en vez de salirse de la pantalla. El `width: 100%` no la ensancha (manda el `flex`): hace que
       el ancho del texto más largo de la lista no cuente como ancho mínimo de la barra, y la lista se achica a su caja en lugar de empujarla. */
    flex: 0 1 9.5rem;
    width: 100%;
    max-width: 100%;
    min-height: var(--alto-tactil);
    min-width: 0;
    padding: 0 var(--e-2) 0 var(--e-3);
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    background: var(--c-superficie);
    color: var(--c-texto);
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  @media (hover: hover) {
    select:hover {
      border-color: var(--c-texto-2);
    }
  }
  @media (min-width: 64rem) {
    .corte,
    .grupo,
    .controles {
      flex-wrap: nowrap;
    }
  }
</style>
