<!-- SOLO DESARROLLO: galería de las piezas A (cifras y datos): Cifra, CifraEnlace, Talon, Vacio y Pares, con todos sus estados. La importa Muestras.svelte.
     Los textos y los importes son de prueba (no son los de la semilla). El foco y el hover se prueban con el teclado y el mouse sobre cada enlace. -->
<script lang="ts">
  import Boton from "../../componentes/Boton.svelte";
  import Cifra from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import Pares from "../../componentes/Pares.svelte";
  import type { ParDeDatos } from "../../componentes/Pares.svelte";
  import Talon from "../../componentes/Talon.svelte";
  import Vacio from "../../componentes/Vacio.svelte";
  import { centavos } from "../../lib/dominio/dinero.ts";

  const CORTE = "2026-10-31";
  const mora = centavos(630_648_128); // $ 6.306.481,28
  const saldo = centavos(2_851_366_210);
  const negativo = centavos(-5_800_000);
  const cero = centavos(0);
  const enorme = centavos(999_999_999_999); // $ 9.999.999.999,99: el tope de importe del dominio

  const datosDelComprobante: ParDeDatos[] = [
    { rotulo: "Cliente", valor: "Contratista Demo S.A." },
    { rotulo: "Emisión", valor: "14/08/2026" },
    { rotulo: "Vencimiento", valor: "13/09/2026 (plazo de 30 días)" },
    { rotulo: "Servicio", valor: "Vigilancia con una descripción larga que tiene que pasar de renglón sin salirse de la caja" },
    { rotulo: "Asociada a", clave: "asociada" },
    { rotulo: "Notas de crédito", clave: "notas" },
    { rotulo: "Neto", valor: "$ 1.000.000,00", numerico: true },
    { rotulo: "IVA 21 %", valor: "$ 210.000,00", numerico: true },
    { rotulo: "Total", valor: "$ 1.210.000,00", numerico: true, total: true },
  ];
  const datosCortos: ParDeDatos[] = [
    { rotulo: "Emisión", valor: "14/08/2026" },
    { rotulo: "Neto", valor: "$ 1.000.000,00", numerico: true },
    { rotulo: "Total", valor: "$ 1.210.000,00", numerico: true, total: true },
  ];
</script>

<section class="grupo" aria-labelledby="piezas-a">
  <h2 id="piezas-a">Piezas A: cifras y datos</h2>

  <!-- ---------- Cifra ---------- -->
  <h3 class="rotulo">Cifra, los cuatro tamaños</h3>
  <div class="ejemplo columna">
    <p class="nota">Texto: hereda el tamaño del lugar (15 px en tablas, aquí el del cuerpo) y no se parte.</p>
    <p><Cifra importe={saldo} /> · <Cifra importe={negativo} /> · <Cifra importe={cero} /></p>
    <p class="nota">Cifra (movimiento del mes, saldo, datos del cliente).</p>
    <p><Cifra importe={saldo} tamano="cifra" /></p>
    <p class="nota">Cabecera (título de un desglose).</p>
    <p><Cifra importe={mora} tamano="cabecera" /></p>
    <p class="nota">Grande (la mora).</p>
    <p><Cifra importe={mora} tamano="grande" /></p>
  </div>

  <h3 class="rotulo">Cifra: negativo, cero y un importe enorme (se parte después de un punto de miles)</h3>
  <div class="ejemplo columna">
    <p><Cifra importe={negativo} tamano="cifra" /> · <Cifra importe={cero} tamano="cifra" /></p>
    <p><Cifra importe={enorme} tamano="grande" /></p>
    <p class="nota">Con la referencia de la medida y el corte lleva los atributos de medida y de centavos del contrato de marcado (se ven al inspeccionar):</p>
    <p><Cifra importe={mora} tamano="cifra" ref={{ clave: "mora" }} corte={CORTE} /></p>
  </div>

  <h3 class="rotulo">Cifra sobre la franja de la mora (el color de los centavos se pasa desde afuera)</h3>
  <div class="franja">
    <span class="rotulo">En mora</span>
    <Cifra importe={mora} tamano="grande" />
    <p>Una frase de la franja con el color de «sobre la franja».</p>
  </div>

  <!-- ---------- CifraEnlace ---------- -->
  <h3 class="rotulo">Cifra-enlace: en una frase, en tamaño cifra y grande</h3>
  <div class="ejemplo columna">
    <p>
      La mora es <CifraEnlace href="#muestra-mora" importe={mora} ref={{ clave: "mora" }} corte={CORTE} nombre="Mora" /> y el saldo a cobrar,
      <CifraEnlace href="#muestra-saldo" importe={saldo} ref={{ clave: "saldo" }} corte={CORTE} nombre="Saldo a cobrar" columna="saldo" />.
    </p>
    <p>
      <CifraEnlace href="#muestra-cobranza" importe={centavos(2_384_759_051)} ref={{ clave: "cobranza-mes", mes: "2026-10" }} corte={CORTE} nombre="Cobranza de octubre" tamano="cifra" />
    </p>
    <p><CifraEnlace href="#muestra-mora-g" importe={mora} ref={{ clave: "mora" }} corte={CORTE} nombre="Mora" tamano="grande" /></p>
    <p><CifraEnlace href="#muestra-negativo" importe={negativo} ref={{ clave: "pagos-a-cuenta" }} corte={CORTE} nombre="Pagos a cuenta sin imputar" /></p>
  </div>
  <div class="ejemplo columna angosto">
    <p class="nota">En una caja angosta (12 rem):</p>
    <CifraEnlace href="#muestra-enorme" importe={enorme} ref={{ clave: "saldo" }} corte={CORTE} nombre="Saldo a cobrar" tamano="cifra" />
  </div>

  <!-- ---------- Talon ---------- -->
  <h3 class="rotulo">Talón: enlace, dato y grande, con los tres tipos</h3>
  <div class="ejemplo">
    <div class="fila">
      <Talon tipoCorto="FA" tipoLargo="Factura A" numero="0003-00000562" href="#muestra-fa" />
      <Talon tipoCorto="ND" tipoLargo="Nota de débito A" numero="0003-00000563" href="#muestra-nd" />
      <Talon tipoCorto="NC" tipoLargo="Nota de crédito A" numero="0003-00000564" href="#muestra-nc" />
    </div>
    <div class="fila">
      <Talon tipoCorto="FA" tipoLargo="Factura A" numero="0003-00000562" />
      <span class="nota">(sin enlace: un dato)</span>
    </div>
    <div class="fila">
      <Talon tipoCorto="FA" tipoLargo="Factura A" numero="0003-00000562" grande />
      <Talon tipoCorto="NC" tipoLargo="Nota de crédito A" numero="0003-00000564" href="#muestra-nc-g" grande viaja />
    </div>
  </div>
  <div class="ejemplo angosto-talon">
    <p class="nota">En una caja angosta (15 rem), grande: baja de renglón en el guion (con el texto al 200 % también parte los dígitos, antes que salirse).</p>
    <Talon tipoCorto="FA" tipoLargo="Factura A" numero="0003-00000562" href="#muestra-fa-angosto" grande />
  </div>

  <!-- ---------- Vacio ---------- -->
  <h3 class="rotulo">Vacío: solo frase, con detalle, con acción</h3>
  <div class="ejemplo columna">
    <Vacio texto="No hay saldo a cobrar al 31/10/2026." />
    <Vacio texto="Ningún comprobante coincide con «zzz»." detalle="Pruebe con otra parte del nombre o del número." />
    <Vacio texto="Se muestran 0 de 13 clientes." detalle="Hay una búsqueda activa.">
      {#snippet accion()}
        <Boton variante="secundario">Borrar la búsqueda</Boton>
      {/snippet}
    </Vacio>
  </div>
  <Panel titulo="Vacío con margen, en un panel sin relleno" relleno="ninguno">
    <Vacio conMargen texto="Este cliente no tiene saldo a cobrar al 31/10/2026." />
  </Panel>

  <!-- ---------- Pares ---------- -->
  <h3 class="rotulo">Pares rótulo-valor: completo (con valores de texto, enlaces, talones e importes)</h3>
  <Panel titulo="Datos del comprobante">
    <Pares filas={datosDelComprobante}>
      {#snippet celda(fila)}
        {#if fila.clave === "asociada"}
          <Talon tipoCorto="FA" tipoLargo="Factura A" numero="0003-00000561" href="#muestra-asociada" />
        {:else if fila.clave === "notas"}
          <span class="fila">
            <Talon tipoCorto="NC" tipoLargo="Nota de crédito A" numero="0003-00000564" href="#muestra-nc-1" />
            <Talon tipoCorto="NC" tipoLargo="Nota de crédito A" numero="0003-00000565" href="#muestra-nc-2" />
          </span>
        {/if}
      {/snippet}
    </Pares>
  </Panel>

  <h3 class="rotulo">Pares: en una caja angosta (12 rem; los valores bajan bajo su rótulo)</h3>
  <div class="ejemplo angosto">
    <Pares filas={datosCortos} />
  </div>
</section>

<style>
  .grupo {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .ejemplo {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    min-width: 0;
    padding: var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
  }
  .columna {
    gap: var(--e-2);
  }
  .fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  /* La caja angosta se mide en rem: con el texto agrandado se angosta igual de rápido. */
  .angosto {
    width: min(12rem, 100%);
  }
  .angosto-talon {
    width: min(15rem, 100%);
  }
  .franja {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-4);
    border-radius: var(--r-2);
    background: var(--c-franja);
    color: var(--c-sobre-franja);
    --cifra-centavos: var(--c-sobre-franja-2);
  }
  .franja .rotulo {
    color: var(--c-sobre-franja);
  }
</style>
