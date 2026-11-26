<!-- Región de estado para lectores de pantalla: dice los datos nuevos cuando cambia el corte. Siempre está en la página, vacía; nunca nace con texto. -->
<script lang="ts">
  // Solo anuncia el CAMBIO de corte (no el primer corte ni el cambio de pantalla: eso lo dice el foco al `h1`). El texto entra a la región con retraso
  // (`textoAnunciado`) para que un mensaje igual al anterior también se diga.
  // Qué cifra dice cada pantalla lo decide `anuncioDeCorteDeRuta` (`lib/vistas/rotulos.ts`).
  import { untrack } from "svelte";
  import { ErrorDeCierre } from "../../lib/dominio/medidas.ts";
  import { anuncioDeCorte } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { anuncioDeCorteDeRuta } from "../../lib/vistas/rotulos.ts";
  import { textoAnunciado } from "../anuncio.svelte.ts";

  let { app }: { app: AplicacionLista } = $props();

  let texto = $state("");
  let repetir = $state(0);
  let corteAnterior: string | undefined;

  function armarAnuncio(): string {
    const corte = app.direccion.corte;
    // Con un cierre que no cierra no hay cifras que decir (y pedirlas lanzaría).
    if (app.cierre.estado !== "ok") return anuncioDeCorte(corte);
    try {
      return anuncioDeCorteDeRuta(app.direccion.ruta, app.datos, corte);
    } catch (e) {
      // Un control de la propia pantalla no cierra: la pantalla muestra el error y acá no hay ninguna cifra que decir.
      if (e instanceof ErrorDeCierre) return anuncioDeCorte(corte);
      throw e;
    }
  }

  $effect(() => {
    const corte = app.direccion.corte;
    if (corteAnterior === undefined) {
      corteAnterior = corte;
      return;
    }
    if (corte === corteAnterior) return;
    corteAnterior = corte;
    untrack(() => {
      texto = armarAnuncio();
      repetir += 1;
    });
  });

  const anunciado = textoAnunciado(() => ({ texto, repetir }));
</script>

<p class="solo-lectores" id="anuncio" role="status">{anunciado.valor}</p>
