<!-- Pie de todas las pantallas: de dónde salen los datos, qué es la demo, los dos enlaces que salen de ella y quién hizo qué. -->
<script lang="ts">
  // «Ver el código fuente» no se muestra mientras el repositorio sea privado. Cuando sea público se suma el enlace acá, con
  // `TEXTO_PIE.codigoFuente`.
  import type { Datos } from "../../lib/dominio/tipos.ts";
  import { TEXTO_PIE } from "../textos-marco.ts";
  import { URL_DE_LA_DEMO_2, URL_DEL_PORTAFOLIO } from "./enlaces-externos.ts";

  let { datos }: { datos: Pick<Datos, "empresa" | "desde" | "hasta"> } = $props();
</script>

<footer class="pie">
  <p>{TEXTO_PIE.fuenteDeDatos(datos.desde.slice(0, 7), datos.hasta.slice(0, 7))}</p>
  <p>{TEXTO_PIE.queEs(datos.empresa.nombre)}</p>
  <p>
    {TEXTO_PIE.otraDemoIntro} <a href={URL_DE_LA_DEMO_2} rel="noopener">{TEXTO_PIE.otraDemoEnlace}</a>
    <span aria-hidden="true">·</span>
    <a href={URL_DEL_PORTAFOLIO} rel="noopener">{TEXTO_PIE.volverAlPortafolio}</a>
  </p>
  <p>{TEXTO_PIE.autoria}</p>
</footer>

<style>
  .pie {
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
    padding: var(--e-5) var(--margen) calc(var(--alto-pestanas) + env(safe-area-inset-bottom, 0px) + var(--e-6));
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    line-height: 1.45;
  }
  .pie p {
    max-width: 72ch;
  }
  /* Los dos enlaces que salen de la demo: objetivo de 24 px de alto (2.5.8). */
  .pie a {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem;
  }
  @media (min-width: 64rem) {
    .pie {
      padding-bottom: var(--e-7);
    }
  }
</style>
