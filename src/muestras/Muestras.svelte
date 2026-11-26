<!-- SOLO DESARROLLO: galería de piezas y de estados (docs/plan.md, paso 5.3). La monta `muestras.html`; no forma parte de la aplicación ni de `dist/`.
     Primero lo común (tokens, tipografías, íconos, botones, etiquetas, avisos, paneles), después los gráficos y, al final, un lugar por cada grupo de piezas
     (`piezas/A`, `B`, `C` y `estados`). Los textos son de prueba. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { formatearImporte } from "../lib/dominio/dinero.ts";
  import Aviso from "../componentes/Aviso.svelte";
  import Boton from "../componentes/Boton.svelte";
  import Etiqueta from "../componentes/Etiqueta.svelte";
  import GraficoMeses from "../componentes/GraficoMeses.svelte";
  import Icono from "../componentes/Icono.svelte";
  import Panel from "../componentes/Panel.svelte";
  import ReglaTramos from "../componentes/ReglaTramos.svelte";
  import { ICONOS, type NumeroDeTramo, type Tono } from "../componentes/tipos.ts";
  import {
    mesesChicos,
    mesesDelCliente,
    mesesFacturadoCobrado,
    renglonDeCorte,
    resumenDeRegla,
    resumenDelGrafico,
    serieDelCliente,
    seriesFacturadoCobrado,
    tablaChicos,
    tablaDelCliente,
    tablaFacturadoCobradoDePrueba,
    tramosCompletos,
    tramosConUnoEnCero,
    tramosExtremos,
    tramosSinSaldo,
  } from "./datos-de-prueba.ts";
  import A from "./piezas/A.svelte";
  import B from "./piezas/B.svelte";
  import C from "./piezas/C.svelte";
  import Estados from "./piezas/estados.svelte";

  const MES_DE_CORTE = "2026-10";

  // ---------- Paleta ----------
  const grupos: { titulo: string; tokens: string[] }[] = [
    { titulo: "Superficies y bordes", tokens: ["c-escritorio", "c-superficie", "c-superficie-2", "c-borde", "c-borde-fuerte"] },
    { titulo: "Texto", tokens: ["c-texto", "c-texto-2", "c-texto-3"] },
    { titulo: "Tinta, enlace y foco", tokens: ["c-tinta", "c-tinta-hover", "c-sobre-tinta", "c-enlace", "c-foco", "c-acento-suave"] },
    { titulo: "Franja de la mora", tokens: ["c-franja", "c-franja-hover", "c-sobre-franja", "c-sobre-franja-2"] },
    { titulo: "Barra lateral", tokens: ["c-lateral", "c-lateral-texto", "c-lateral-texto-2", "c-lateral-foco"] },
    { titulo: "Tramos de antigüedad", tokens: ["c-tramo-0", "c-tramo-1", "c-tramo-2", "c-tramo-3", "c-tramo-4"] },
    { titulo: "Series del gráfico", tokens: ["c-serie-facturado", "c-serie-cobrado"] },
    {
      titulo: "Tonos de estado (texto, fondo y marca)",
      tokens: ["ok", "revisar", "diferencia", "neutro", "pendiente"].flatMap((t) => [`c-${t}-t`, `c-${t}-f`, `c-${t}-r`]),
    },
  ];

  // ---------- Etiquetas ----------
  const etiquetasDeEstado: { tono: Tono; icono: "check" | "alerta" | "vencido" | "reloj" | "flecha-izq"; texto: string }[] = [
    { tono: "ok", icono: "check", texto: "Cancelado" },
    { tono: "revisar", icono: "alerta", texto: "Revisar imputación" },
    { tono: "diferencia", icono: "vencido", texto: "Con diferencia" },
    { tono: "neutro", icono: "reloj", texto: "Después de la fecha de corte" },
    { tono: "pendiente", icono: "flecha-izq", texto: "Saldo a favor" },
  ];
  const etiquetasDeTramo: { n: NumeroDeTramo; tono: Tono; texto: string }[] = [
    { n: 0, tono: "neutro", texto: "No vencido" },
    { n: 1, tono: "revisar", texto: "1 a 30 días" },
    { n: 2, tono: "revisar", texto: "31 a 60 días" },
    { n: 3, tono: "diferencia", texto: "61 a 90 días" },
    { n: 4, tono: "diferencia", texto: "Más de 90 días" },
  ];

  // ---------- Avisos que se cierran ----------
  let avisoCorte = $state(true);
  let avisoMes = $state(true);
  function reponerAvisos(): void {
    avisoCorte = true;
    avisoMes = true;
  }

  // ---------- Tipografías: qué archivos cargó el navegador ----------
  let fuentes = $state<string[]>([]);
  onMount(() => {
    void document.fonts.ready.then(() => {
      fuentes = [...document.fonts].map((f) => `${f.family} (${f.weight}, ${f.status})`);
    });
  });
</script>

<header class="contenedor cabecera">
  <h1 tabindex="-1">Galería de piezas</h1>
  <p class="nota">
    Solo desarrollo. Datos y textos de prueba, no son los de la semilla. Se ve claro u oscuro según el dispositivo.
  </p>
</header>

<main class="contenedor muestras">
  <section aria-labelledby="g-paleta" class="grupo">
    <h2 id="g-paleta">Paleta</h2>
    {#each grupos as grupo (grupo.titulo)}
      <h3 class="rotulo">{grupo.titulo}</h3>
      <ul class="paleta">
        {#each grupo.tokens as token (token)}
          <li>
            <span class="color" style:background="var(--{token})"></span>
            <code class="codigo">--{token}</code>
          </li>
        {/each}
      </ul>
    {/each}
  </section>

  <section aria-labelledby="g-tipografia" class="grupo">
    <h2 id="g-tipografia">Tipografías (alojadas en el propio sitio)</h2>
    <div class="tipos">
      <p class="m-texto">
        Schibsted Grotesk, el texto: «Cuenta corriente al 31/10/2026». Ñandú, ¿cuánto?, ¡ahora!, áéíóú, ü. Regular 400, <b>negrita 700</b>.
      </p>
      <p class="m-h1">Tablero de cobranzas</p>
      <p class="m-h2">Bricolage Grotesque, el título: condensada al 82 y al 88 %</p>
      <p>
        <span class="num m-cifra-g">$ 6.306.481<span class="centavos">,28</span></span>
        <span class="num m-cifra">$ 28.513.662,10</span>
        <span class="num">14/10/2026 · 61 a 90 días · 46,8 %</span>
      </p>
      <p><span class="codigo">1-0003-00000562</span> Red Hat Mono, el talón y los códigos</p>
    </div>
    <p class="nota">Archivos que cargó el navegador: {fuentes.length === 0 ? "…" : fuentes.join(" · ")}</p>
  </section>

  <section aria-labelledby="g-iconos" class="grupo">
    <h2 id="g-iconos">Íconos</h2>
    <ul class="iconos">
      {#each ICONOS as nombre (nombre)}
        <li>
          <span class="icono-grande"><Icono {nombre} /></span>
          <code class="codigo">{nombre}</code>
        </li>
      {/each}
    </ul>
    <p class="nota">
      Dos tamaños: 18 px (por defecto, dentro de botones, avisos y etiquetas) y 24 px (<code class="codigo">--icono-tam: 1.5rem</code>, navegación).
    </p>
  </section>

  <section aria-labelledby="g-botones" class="grupo">
    <h2 id="g-botones">Botones</h2>
    <div class="fila">
      <Boton>Primario</Boton>
      <Boton icono="flecha">Con ícono</Boton>
      <Boton variante="secundario">Secundario</Boton>
      <Boton variante="secundario" disabled>Secundario deshabilitado</Boton>
      <Boton variante="texto">Botón de texto</Boton>
      <Boton tamano="grande">Grande</Boton>
    </div>
    <div class="fila">
      <Boton href="#ir-al-resumen" icono="resumen">Ir al resumen (enlace)</Boton>
      <Boton href="#ver-al-corte" variante="secundario">Verlo al 30/09/2026 (enlace)</Boton>
      <Boton href="#texto" variante="texto">Enlace de texto</Boton>
    </div>
    <div class="fila">
      <Boton variante="icono-caja" icono="chevron-izq" etiqueta="Cierre anterior" />
      <Boton variante="icono-caja" icono="chevron" etiqueta="Cierre siguiente" />
      <Boton variante="icono-caja" icono="chevron" etiqueta="Cierre siguiente (último, deshabilitado)" disabled />
      <Boton variante="icono" icono="cerrar" etiqueta="Cerrar" />
      <Boton variante="icono" icono="buscar" etiqueta="Buscar" />
    </div>
    <p class="nota">Foco: tabulá por todos; el anillo es de 3 px. Un solo primario por zona.</p>
  </section>

  <section aria-labelledby="g-etiquetas" class="grupo">
    <h2 id="g-etiquetas">Etiquetas</h2>
    <div class="fila">
      {#each etiquetasDeEstado as e (e.texto)}
        <Etiqueta tono={e.tono} icono={e.icono}>{e.texto}</Etiqueta>
      {/each}
    </div>
    <div class="fila">
      {#each etiquetasDeTramo as e (e.texto)}
        <Etiqueta tono={e.tono} muestra={e.n}>{e.texto}</Etiqueta>
      {/each}
      <Etiqueta tono="neutro">Factura A (sin marca)</Etiqueta>
    </div>
  </section>

  <section aria-labelledby="g-avisos" class="grupo">
    <h2 id="g-avisos">Avisos</h2>
    <div class="avisos">
      {#if avisoCorte}
        <Aviso tono="revisar" icono="alerta" alCerrar={() => (avisoCorte = false)} etiquetaDeCerrar="Cerrar el aviso del corte">
          <p>La fecha de corte de la dirección no es un cierre de mes: se muestra el último cierre, el 31/10/2026.</p>
        </Aviso>
      {/if}
      {#if avisoMes}
        <Aviso tono="revisar" icono="alerta" alCerrar={() => (avisoMes = false)} etiquetaDeCerrar="Cerrar el aviso del mes">
          <p>El mes de la dirección no existe: se muestra el mes del corte.</p>
        </Aviso>
      {/if}
      {#if !avisoCorte && !avisoMes}
        <Boton variante="secundario" onclick={reponerAvisos}>Volver a mostrar los dos avisos</Boton>
      {/if}
      <Aviso tono="diferencia" icono="vencido">
        <p>Una frase larga con una palabra sin espacios para probar que no ensancha la página: abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz.</p>
        {#snippet boton()}
          <Boton variante="secundario" href="#ir-al-resumen">Ir al resumen</Boton>
        {/snippet}
      </Aviso>
      <Aviso tono="ok" icono="check"><p>Aviso sin cierre ni acción.</p></Aviso>
      <Aviso tono="pendiente" icono="flecha-izq"><p>Saldo a favor de $ 58.000,00.</p></Aviso>
    </div>
  </section>

  <section aria-labelledby="g-paneles" class="grupo">
    <h2 id="g-paneles">Paneles</h2>
    <Panel titulo="Comprobantes con saldo" meta="13 comprobantes" estado="Se muestran 13 de 13" icono="comprobantes">
      {#snippet controles()}
        <Boton variante="texto" href="#ver-todos">Ver todos</Boton>
      {/snippet}
      {#snippet herramientas()}
        <div class="fila">
          <Boton variante="secundario">En mora</Boton>
          <Boton variante="secundario">No vencido</Boton>
        </div>
        <label class="campo">
          <span class="solo-lectores">Buscar</span>
          <Icono nombre="buscar" />
          <input type="search" placeholder="Buscar cliente o número" />
        </label>
      {/snippet}
      <p>Interior con relleno de 16 px. La barra de título, las herramientas y la de estado se separan solo con una línea.</p>
    </Panel>
    <Panel titulo="Sin relleno, para tablas y listas" relleno="ninguno">
      <ul class="lista-a-ras">
        <li>Contratista Demo S.A.</li>
        <li>Transportes del Sur Demo S.R.L.</li>
      </ul>
    </Panel>
    <Panel titulo="Barra de estado con un control" meta="un título largo hace bajar el dato a su renglón en un panel angosto">
      <p>Contenido.</p>
      {#snippet contenidoEstado()}
        <Boton variante="texto">Borrar la búsqueda</Boton>
      {/snippet}
    </Panel>
  </section>

  <section aria-labelledby="g-graficos" class="grupo">
    <h2 id="g-graficos">Regla de tramos y gráfico de meses</h2>
    <Panel titulo="Facturado y cobrado, últimos 12 meses">
      <GraficoMeses
        subtitulo="En millones de pesos, con IVA."
        series={seriesFacturadoCobrado}
        meses={mesesFacturadoCobrado}
        mesDeCorte={MES_DE_CORTE}
        ariaLabel={resumenDelGrafico("Facturado y cobrado por mes, con IVA", mesesFacturadoCobrado, seriesFacturadoCobrado)}
        renglonDeCorte={renglonDeCorte(mesesFacturadoCobrado, seriesFacturadoCobrado)}
        tabla={tablaFacturadoCobradoDePrueba}
      >
        {#snippet celda({ mes, columna, importe })}
          <a href="#desglose-{mes}-{columna}">{formatearImporte(importe)}</a>
        {/snippet}
      </GraficoMeses>
    </Panel>

    <Panel titulo="Facturación del cliente (un valor negativo y un mes en 0)">
      <GraficoMeses
        subtitulo="En millones de pesos, sin IVA."
        series={serieDelCliente}
        meses={mesesDelCliente}
        mesDeCorte={MES_DE_CORTE}
        ariaLabel={resumenDelGrafico("Facturación sin IVA del cliente por mes", mesesDelCliente, serieDelCliente)}
        renglonDeCorte={renglonDeCorte(mesesDelCliente, serieDelCliente)}
        tabla={tablaDelCliente}
      />
    </Panel>

    <Panel titulo="Pocos meses e importes menores a un millón">
      <GraficoMeses
        subtitulo="En millones de pesos, con IVA."
        series={seriesFacturadoCobrado}
        meses={mesesChicos}
        mesDeCorte={MES_DE_CORTE}
        ariaLabel={resumenDelGrafico("Facturado y cobrado por mes, con IVA", mesesChicos, seriesFacturadoCobrado)}
        renglonDeCorte={renglonDeCorte(mesesChicos, seriesFacturadoCobrado)}
        avisoDesde="Hay datos desde junio de 2026."
        tabla={tablaChicos}
      />
    </Panel>

    <Panel titulo="Saldo a cobrar según días de atraso (completa, con el tramo 61 a 90 días en 0)">
      <ReglaTramos tramos={tramosConUnoEnCero} ariaLabel={resumenDeRegla(tramosConUnoEnCero)} textoVacio="No hay saldo a cobrar." />
    </Panel>

    <Panel titulo="Saldo según días de atraso con los cinco tramos (mediana)">
      <ReglaTramos variante="mediana" tramos={tramosCompletos} ariaLabel={resumenDeRegla(tramosCompletos)} textoVacio="No hay saldo a cobrar.">
        {#snippet cifra(tramo)}
          <a href="#muestra-{tramo.clave}">{formatearImporte(tramo.importe)}</a>
        {/snippet}
      </ReglaTramos>
    </Panel>

    <Panel titulo="Un tramo de $ 1 junto a millones">
      <ReglaTramos tramos={tramosExtremos} ariaLabel={resumenDeRegla(tramosExtremos)} textoVacio="No hay saldo a cobrar." />
    </Panel>

    <Panel titulo="Variante mínima (columna de una tabla)">
      <div class="fila-minima">
        <span>Contratista Demo S.A.</span>
        <ReglaTramos variante="minima" tramos={tramosConUnoEnCero} ariaLabel="" textoVacio="" />
      </div>
    </Panel>

    <Panel titulo="Sin saldo a cobrar (vacío)">
      <ReglaTramos tramos={tramosSinSaldo} ariaLabel="" textoVacio="No hay saldo a cobrar al 31/10/2026." />
    </Panel>
  </section>

  <A />
  <B />
  <C />
  <Estados />
</main>

<style>
  .cabecera {
    padding-block: var(--e-5) var(--e-3);
  }
  .muestras {
    display: flex;
    flex-direction: column;
    gap: var(--e-6);
    padding-bottom: var(--e-8);
  }
  .grupo {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  .avisos {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }

  /* Paleta */
  .paleta {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(10.5rem, 100%), 1fr));
    gap: var(--e-2);
  }
  .paleta li {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
  }
  .color {
    flex: none;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
  }
  .paleta code {
    font-size: var(--t-rotulo);
    overflow-wrap: anywhere;
  }

  /* Tipografías */
  .tipos {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-4);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-2);
  }
  .m-texto {
    max-width: 62ch;
  }
  .m-h1 {
    font-family: var(--t-familia-titulo);
    font-size: var(--t-h1);
    font-stretch: var(--t-ancho-titulo);
    font-weight: var(--t-peso-titulo);
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  .m-h2 {
    font-family: var(--t-familia-titulo);
    font-size: var(--t-grande);
    font-stretch: var(--t-ancho-seccion);
    font-weight: var(--t-peso-titulo);
  }
  .m-cifra-g {
    display: inline-block;
    margin-right: var(--e-4);
    font-size: var(--t-cifra-g);
    font-stretch: var(--t-ancho-titulo);
    font-weight: var(--t-peso-titulo);
    letter-spacing: -0.02em;
    line-height: 1;
    overflow-wrap: anywhere;
  }
  .centavos {
    color: var(--c-texto-2);
    font-size: var(--t-centavos);
    letter-spacing: 0;
  }
  .m-cifra {
    margin-right: var(--e-4);
    font-size: var(--t-cifra);
  }

  /* Íconos */
  .iconos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(8.5rem, 100%), 1fr));
    gap: var(--e-2);
  }
  .iconos li {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-width: 0;
  }
  .iconos code {
    font-size: var(--t-rotulo);
    overflow-wrap: anywhere;
  }
  .icono-grande {
    --icono-tam: 1.5rem;
    display: inline-flex;
    flex: none;
    padding: var(--e-2);
    background: var(--c-superficie);
    border: 1px solid var(--c-borde);
    border-radius: var(--r-1);
  }

  /* Panel de muestra */
  .campo {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    min-height: var(--alto-tactil);
    padding: 0 var(--e-3);
    background: var(--c-superficie);
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    color: var(--c-texto-2);
  }
  .campo:focus-within {
    outline: 3px solid var(--c-foco);
    outline-offset: 2px;
  }
  .campo input {
    flex: 1;
    min-width: 0;
    min-height: 2.5rem;
    border: 0;
    background: none;
    outline: none;
  }
  .lista-a-ras li {
    padding: var(--e-3) var(--e-4);
    border-bottom: 1px solid var(--c-borde);
  }
  .lista-a-ras li:last-child {
    border-bottom: 0;
  }
  .fila-minima {
    display: flex;
    align-items: center;
    gap: var(--e-4);
    font-size: var(--t-tabla);
  }
</style>
