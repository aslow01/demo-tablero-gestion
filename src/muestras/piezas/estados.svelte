<!-- SOLO DESARROLLO: los estados y las pantallas de error del marco que no se ven con los datos de ejemplo.
     Error de cierre (controles cruzados que fallan, forzado acá con un `ErrorDeCierre` armado a mano), error al iniciar, dirección que no existe,
     cliente, comprobante y desglose inexistentes y los avisos de la dirección a la vez. Los textos son los de la aplicación; los números, de prueba. -->
<script lang="ts">
  import { centavos } from "../../lib/dominio/dinero.ts";
  import { ErrorDeCierre } from "../../lib/dominio/medidas.ts";
  import { avisoDeCorteInvalido, avisoDeMesInvalido } from "../../lib/dominio/textos.ts";
  import type { Redireccion } from "../../lib/estado/direccion.svelte.ts";
  import type { AvisoDeDireccion, Ruta } from "../../lib/estado/enrutador.ts";
  import AvisosDeDireccion from "../../componentes/marco/AvisosDeDireccion.svelte";
  import Boton from "../../componentes/Boton.svelte";
  import ErrorDeCierreVista from "../../rutas/ErrorDeCierre.svelte";
  import ErrorDeInicio from "../../rutas/ErrorDeInicio.svelte";
  import ErrorDeVista from "../../rutas/ErrorDeVista.svelte";

  // El control que no cierra: el valor por agregación y la suma de las partidas difieren en $ 1,00.
  const errorDeCierre = new ErrorDeCierre("saldo", centavos(2851366210), centavos(2851366110));

  const vistasInexistentes: { titulo: string; ruta: Extract<Ruta, { tipo: "inexistente" | "desconocida" }> }[] = [
    { titulo: "Dirección que no existe", ruta: { tipo: "desconocida" } },
    { titulo: "Cliente inexistente", ruta: { tipo: "inexistente", vista: "cliente" } },
    { titulo: "Comprobante inexistente", ruta: { tipo: "inexistente", vista: "comprobante" } },
    { titulo: "Desglose inexistente", ruta: { tipo: "inexistente", vista: "desglose" } },
  ];

  const AVISOS: readonly AvisoDeDireccion[] = [
    { clase: "corte", texto: avisoDeCorteInvalido("2026-10-31") },
    { clase: "mes", texto: avisoDeMesInvalido("2026-10") },
  ];
  const REDIRECCION: Redireccion = { motivo: "sin-otros", corte: "2026-09-30" };

  let avisos = $state<readonly AvisoDeDireccion[]>(AVISOS);
  let redireccion = $state<Redireccion | null>(REDIRECCION);
  function reponer(): void {
    avisos = AVISOS;
    redireccion = REDIRECCION;
  }
</script>

<section class="estados" aria-labelledby="estados">
  <h2 id="estados">Estados que no se ven con los datos de ejemplo</h2>

  <h3 class="rotulo">Avisos de la dirección (el del corte, el del mes y el de «Otros», a la vez)</h3>
  <AvisosDeDireccion
    {avisos}
    {redireccion}
    alCerrarAviso={(clase) => (avisos = avisos.filter((a) => a.clase !== clase))}
    alCerrarRedireccion={() => (redireccion = null)}
  />
  {#if avisos.length === 0 && redireccion === null}
    <div><Boton variante="secundario" onclick={reponer}>Volver a mostrar los avisos</Boton></div>
  {/if}

  <h3 class="rotulo">Error de cierre (forzado)</h3>
  <ErrorDeCierreVista error={errorDeCierre} corte="2026-10-31" />

  <h3 class="rotulo">Error al iniciar</h3>
  <ErrorDeInicio mensaje="Los datos de ejemplo no pasan las validaciones y no se calcula nada con ellos. C4 (CMP-0001): ejemplo de mensaje." />

  {#each vistasInexistentes as v (v.titulo)}
    <h3 class="rotulo">{v.titulo}</h3>
    <ErrorDeVista ruta={v.ruta} enlaceAlResumen="#/resumen" />
  {/each}
</section>

<style>
  .estados {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
</style>
