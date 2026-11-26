<!-- Posición al corte: la franja de la mora (la cifra que manda, un enlace a su desglose) y, al lado en escritorio, el saldo a cobrar y la regla
     de tramos. Recibe el modelo de vista ya calculado; no calcula nada. -->
<script lang="ts">
  import { formatearPorcentaje } from "../../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { VistaResumen } from "../../lib/vistas/resumen.ts";
  import { etiquetaDeReglaDeTramos } from "../../lib/vistas/rotulos.ts";
  import Cifra, { claveDeMedida } from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Icono from "../../componentes/Icono.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import ReglaTramos from "../../componentes/ReglaTramos.svelte";
  import { TEXTO_CLIENTE, TEXTO_RESUMEN } from "../../componentes/textos-marco.ts";
  import type { TramoDeRegla } from "../../componentes/tipos-graficos.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./cifras.ts";

  let { app, v }: { app: AplicacionLista; v: VistaResumen } = $props();

  const corte = $derived(v.corte);
  const hrefDeMora = $derived(app.direccion.enlace(rutaDeDesglose(v.mora.medida, false)));
  const hrefDeSaldo = $derived(app.direccion.enlace(rutaDeDesglose(v.saldo.medida, false)));
  const hayMora = $derived(v.mora.importe > 0);
  const frase = $derived(
    hayMora ? TEXTO_RESUMEN.fraseDeLaMora(formatearPorcentaje(v.moraSobreSaldo), v.clientesEnMora) : TEXTO_RESUMEN.sinMora(corte),
  );
  const tramos = $derived(
    v.regla.filas.map(
      (f): TramoDeRegla => ({
        clave: f.tramo,
        importe: f.cifra.importe,
        porcentaje: f.milesimas,
        href: app.direccion.enlace(rutaDeDesglose(f.cifra.medida, false)),
        medida: claveDeMedida(f.cifra.medida, corte),
      }),
    ),
  );
</script>

<Panel titulo={TEXTO_RESUMEN.posicion(corte)} relleno="ninguno">
  <div class="posicion">
    <a class="heroe" href={hrefDeMora} data-m={claveDeMedida(v.mora.medida, corte)} data-c={v.mora.importe}>
      <span class="rotulo">{TEXTO_RESUMEN.enMora}</span>
      <span class="solo-lectores">{TEXTO_RESUMEN.enMoraAl(corte)}: </span>
      <Cifra importe={v.mora.importe} tamano="grande" />
      <span class="frase">{frase}</span>
      {#if hayMora}<span class="ir">{TEXTO_RESUMEN.verDeDondeSale}<Icono nombre="flecha" /></span>{/if}
    </a>
    <div class="derecha">
      <div class="saldo">
        <span class="rotulo-saldo">{TEXTO_RESUMEN.saldoACobrar}</span>
        <CifraEnlace
          href={hrefDeSaldo}
          importe={v.saldo.importe}
          ref={v.saldo.medida}
          {corte}
          nombre={nombreDeCifra(v.saldo.medida, corte, app.datos)}
          tamano="cifra"
        />
      </div>
      <div class="regla">
        <ReglaTramos
          {tramos}
          titulo={TEXTO_CLIENTE.antiguedad}
          ariaLabel={etiquetaDeReglaDeTramos(v.regla, corte, app.datos)}
          textoVacio={TEXTO_RESUMEN.sinMora(corte)}
        />
      </div>
    </div>
  </div>
</Panel>

<style>
  .posicion {
    display: grid;
  }

  /* ---------- Franja de la mora: la cifra que manda. Tinta en claro; azul profundo en oscuro (los tokens ya lo resuelven). ---------- */
  .heroe {
    --cifra-centavos: var(--c-sobre-franja-2);
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 1rem 1.125rem 0.875rem;
    background: var(--c-franja);
    color: var(--c-sobre-franja);
    text-decoration: none;
    transition: background-color var(--m-rapido) linear;
  }
  @media (hover: hover) {
    .heroe:hover {
      background: var(--c-franja-hover);
    }
  }
  .heroe:focus-visible {
    outline: 3px solid var(--c-sobre-franja);
    outline-offset: -7px;
  }
  .heroe .rotulo {
    color: var(--c-sobre-franja);
  }
  .frase {
    font-size: var(--t-grande);
    font-weight: 600;
    line-height: 1.3;
  }
  .ir {
    --icono-tam: 1.125rem;
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.375rem;
    margin-top: var(--e-1);
    font-size: var(--t-medio);
    font-weight: 650;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ---------- Saldo a cobrar y regla de tramos ---------- */
  .saldo {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 0.75rem;
    padding: 0.875rem var(--e-4) var(--e-1);
  }
  .rotulo-saldo {
    color: var(--c-texto-2);
    font-size: var(--t-medio);
    font-weight: 650;
  }
  .regla {
    padding: 0.625rem var(--e-4) var(--e-4);
  }

  @media (min-width: 64rem) {
    .posicion {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    }
    .heroe {
      justify-content: center;
      gap: var(--e-2);
      padding: 1.375rem 1.625rem 1.25rem;
      border-radius: 0 0 0 calc(var(--r-2) - 1px);
    }
    .frase {
      font-size: 1.1875rem;
    }
    .derecha {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    /* Medido a 1280 × 800: con estos márgenes el panel del movimiento del mes entra entero en la primera pantalla (la lista de la regla va en una línea por tramo). */
    .saldo {
      padding: 0.75rem var(--e-5) 2px;
    }
    .regla {
      padding: 0.375rem var(--e-5) 0.75rem;
    }
  }

  @media (forced-colors: active) {
    .heroe {
      border: 1px solid CanvasText;
    }
  }
</style>
