<!-- SOLO DESARROLLO: galería de las piezas C: Ubicador, ReciboDesplegable, FilaEnlace, ReglaTramos y GraficoMeses.
     La importa Muestras.svelte. Datos y textos de prueba (no son los de la semilla). -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { ROTULO_DE_TRAMO, rotuloDelUbicador } from "../../lib/dominio/textos.ts";
  import { ubicadorDe } from "../../lib/vistas/formato.ts";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import FilaEnlace from "../../componentes/FilaEnlace.svelte";
  import GraficoMeses from "../../componentes/GraficoMeses.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import ReciboDesplegable from "../../componentes/ReciboDesplegable.svelte";
  import type { FilaDeDetalleDeRecibo } from "../../componentes/ReciboDesplegable.svelte";
  import ReglaTramos from "../../componentes/ReglaTramos.svelte";
  import Ubicador from "../../componentes/Ubicador.svelte";
  import type { TablaDelGrafico, TramoDeRegla } from "../../componentes/tipos-graficos.ts";
  import {
    mesesDelCliente,
    mesesFacturadoCobrado,
    renglonDeCorte,
    resumenDeRegla,
    resumenDelGrafico,
    serieDelCliente,
    seriesFacturadoCobrado,
    tablaFacturadoCobradoDePrueba,
    tramosCompletos,
    tramosConUnoEnCero,
    tramosDePrueba,
    tramosExtremos,
    tramosSinSaldo,
  } from "../datos-de-prueba.ts";

  const MES_DE_CORTE = "2026-10";

  // ---------- Ubicador: un caso por tramo y los bordes ----------
  const casosDeUbicador: { titulo: string; atraso: number }[] = [
    { titulo: "Faltan 29 días (borde izquierdo)", atraso: -29 },
    { titulo: "Vence el día del corte", atraso: 0 },
    { titulo: "12 días de atraso", atraso: 12 },
    { titulo: "45 días de atraso", atraso: 45 },
    { titulo: "75 días de atraso", atraso: 75 },
    { titulo: "91 días de atraso", atraso: 91 },
    { titulo: "180 días de atraso (borde derecho)", atraso: 180 },
    { titulo: "400 días: la marca se recorta en 180", atraso: 400 },
  ];

  // ---------- Recibos: dos en una tabla (el botón en la celda, el detalle en la fila de abajo), uno suelto ----------
  const recibos = [
    { id: "R-0003-00000045", fecha: "12/08/2026", nota: "Cobro parcial", haber: "$ 242.000,00", aCuenta: "$ 0,00", medios: "Transferencia $ 234.000,00 · Retención IIBB $ 5.000,00 · Retención Ganancias $ 3.000,00", imputado: [{ texto: "FA 0003-00000562", href: "#fa-562", importe: "$ 242.000,00" }] },
    { id: "R-0003-00000071", fecha: "14/10/2026", nota: "Cobro", haber: "$ 1.450.000,00", aCuenta: "$ 58.000,00", medios: "Cheque $ 1.508.000,00", imputado: [{ texto: "FA 0003-00000571", href: "#fa-571", importe: "$ 900.000,00" }, { texto: "FA 0003-00000574", href: "#fa-574", importe: "$ 550.000,00" }] },
  ] as const;
  let abierto = $state<Record<string, boolean>>({ "R-0003-00000045": false, "R-0003-00000071": true });
  let abiertoSuelto = $state(false);

  const filasDeRecibo = (r: (typeof recibos)[number]): FilaDeDetalleDeRecibo[] => [
    { clave: "recibo", rotulo: "Recibo", texto: `${r.haber} del ${r.fecha}` },
    { clave: "medios", rotulo: "Medios", texto: r.medios },
    { clave: "imputado", rotulo: "Imputado a" },
    { clave: "a-cuenta", rotulo: "A cuenta" },
  ];

  // ---------- Regla de tramos con destinos (cada renglón con importe es un enlace) ----------
  const conDestino = (tramos: readonly TramoDeRegla[]): TramoDeRegla[] =>
    tramos.map((t) => ({ ...t, rotulo: ROTULO_DE_TRAMO[t.clave], href: `#desglose-${t.clave}`, medida: `tramo-${t.clave}||2026-10|2026-10-31` }));
  const reglaConEnlaces = conDestino(tramosConUnoEnCero);
  const reglaDeCliente = conDestino(tramosDePrueba([0, 0, 1_240_000, 3_100_000, 0]));
  const reglaDeUnTramo = conDestino(tramosDePrueba([0, 0, 0, 0, 605_000]));

  // ---------- Gráfico sin tabla propia, con el mes resaltado en el renglón ----------
  const tablaConClaves: TablaDelGrafico = { ...tablaFacturadoCobradoDePrueba, claves: ["fa", "fi", "co", "re"] };
  const resumenFacturadoCobrado = resumenDelGrafico("Facturado y cobrado por mes, con IVA", mesesFacturadoCobrado, seriesFacturadoCobrado);
  const renglonCompleto = renglonDeCorte(mesesFacturadoCobrado, seriesFacturadoCobrado);
  const renglonConMesResaltado = { titulo: `${renglonCompleto.split(":")[0] ?? ""}:`, texto: renglonCompleto.split(":").slice(1).join(":").trim() };
  const ubicadorDeHoy = ubicadorDe(0);
</script>

<section class="grupo" aria-labelledby="piezas-c">
  <h2 id="piezas-c">Piezas C: ubicador, recibo desplegable, fila-enlace, regla de tramos y gráfico de meses</h2>
  <p class="nota">Probar con Tab (todo lo que se pulsa tiene foco visible), con el texto al 200 % y en oscuro.</p>

  <!-- ===================== Ubicador ===================== -->
  <Panel titulo="Ubicador (Comprobante): un caso por tramo y los bordes">
    <div class="rejilla">
      {#each casosDeUbicador as caso (caso.titulo)}
        {@const u = ubicadorDe(caso.atraso)}
        <div class="caso">
          <p class="rotulo">{caso.titulo}</p>
          <Ubicador tramo={u.tramo} milesimas={u.milesimas} borde={u.borde} rotulo={rotuloDelUbicador(caso.atraso)} unidad="días" />
        </div>
      {/each}
    </div>
  </Panel>
  <Panel titulo="Ubicador en un contenedor de 14rem (pista angosta: la unidad baja de renglón)">
    <div class="angosto-14">
      <Ubicador tramo={ubicadorDeHoy.tramo} milesimas={ubicadorDeHoy.milesimas} borde={ubicadorDeHoy.borde} rotulo={rotuloDelUbicador(0)} unidad="días" />
    </div>
  </Panel>

  <!-- ===================== Recibo desplegable ===================== -->
  <Panel titulo="Recibo desplegable dentro de una tabla" relleno="ninguno">
    <div class="tabla-caja">
      <table>
        <caption class="solo-lectores">Movimientos de prueba</caption>
        <thead>
          <tr>
            <th scope="col" class="rotulo">Fecha</th>
            <th scope="col" class="rotulo">Movimiento</th>
            <th scope="col" class="rotulo importe">Haber</th>
          </tr>
        </thead>
        <tbody>
          {#each recibos as r (r.id)}
            <tr class:abierta={abierto[r.id]}>
              <td class="num">{r.fecha}</td>
              <td>
                <ReciboDesplegable id={r.id} prefijo="Recibo " parte="boton" bind:abierto={abierto[r.id]} filas={filasDeRecibo(r)} />
                <span class="aparte">{r.nota}</span>
              </td>
              <td class="importe num">{r.haber}</td>
            </tr>
            {#if abierto[r.id]}
              <tr class="detalle-fila">
                <td colspan="3">
                  <ReciboDesplegable id={r.id} prefijo="Recibo " parte="detalle" bind:abierto={abierto[r.id]} filas={filasDeRecibo(r)}>
                    {#snippet valor(fila)}
                      {#if fila.clave === "imputado"}
                        {#each r.imputado as imp, k (imp.href)}{#if k > 0}{" · "}{/if}<a href={imp.href}>{imp.texto}</a> <span class="num">{imp.importe}</span>{/each}
                      {:else if fila.clave === "a-cuenta"}
                        <span class="num">{r.aCuenta}</span>
                        {#if r.aCuenta !== "$ 0,00"}<Etiqueta tono="revisar" icono="alerta">Revisar imputación</Etiqueta>{/if}
                      {:else}
                        {fila.texto}
                      {/if}
                    {/snippet}
                  </ReciboDesplegable>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  </Panel>
  <Panel titulo="Recibo desplegable suelto (botón y detalle juntos, sin tabla)">
    <ReciboDesplegable id="R-0003-00000099" prefijo="Recibo " bind:abierto={abiertoSuelto} filas={[{ clave: "recibo", rotulo: "Recibo", texto: "$ 12.345.678,90 del 02/09/2026" }, { clave: "medios", rotulo: "Medios", texto: "Transferencia $ 12.000.000,00 · Retención IIBB $ 345.678,90" }, { clave: "imputado", rotulo: "Imputado a", texto: "Ningún comprobante" }, { clave: "a-cuenta", rotulo: "A cuenta", texto: "$ 12.345.678,90" }]} />
  </Panel>

  <!-- ===================== Fila-enlace ===================== -->
  <Panel titulo="Fila-enlace">
    <div class="pila">
      <FilaEnlace href="#meses" titulo="Facturado y cobrado, últimos 12 meses" detalle="Octubre de 2026: facturado $ 19.004.155,94 · cobrado $ 23.847.590,51" data-m="facturado-con-iva-mes" />
      <FilaEnlace href="#cliente" titulo="Ver los 13 clientes" />
      <FilaEnlace href="#largo" titulo="Un título largo para ver cómo baja de renglón en un panel angosto sin empujar la página" detalle="abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz" />
    </div>
  </Panel>
  <Panel titulo="Filas-enlace planas, apiladas en un panel sin relleno" relleno="ninguno">
    <FilaEnlace variante="plana" href="#a" titulo="Comprobantes con saldo" detalle="13 comprobantes" />
    <FilaEnlace variante="plana" href="#b" titulo="Clientes" detalle="13 clientes, 6 con mora" />
  </Panel>

  <!-- ===================== Regla de tramos ===================== -->
  <Panel titulo="Regla de tramos completa, con renglones que son enlaces (el tramo de 61 a 90 días está en 0 y no lo es)">
    <ReglaTramos tramos={reglaConEnlaces} ariaLabel={resumenDeRegla(reglaConEnlaces)} textoVacio="No hay saldo a cobrar." titulo="Saldo a cobrar según días de atraso" />
  </Panel>
  <Panel titulo="Mediana (Cliente), con dos tramos">
    <ReglaTramos variante="mediana" tramos={reglaDeCliente} ariaLabel={resumenDeRegla(reglaDeCliente)} textoVacio="Este cliente no tiene saldo a cobrar." />
  </Panel>
  <Panel titulo="Un solo tramo con deuda">
    <ReglaTramos tramos={reglaDeUnTramo} ariaLabel={resumenDeRegla(reglaDeUnTramo)} textoVacio="No hay saldo a cobrar." />
  </Panel>
  <Panel titulo="Solo la barra (sin lista), como en Comprobantes">
    <ReglaTramos tramos={tramosCompletos} ariaLabel={resumenDeRegla(tramosCompletos)} textoVacio="No hay saldo a cobrar." sinLista />
  </Panel>
  <Panel titulo="Un tramo de $ 1 junto a millones">
    <ReglaTramos tramos={tramosExtremos} ariaLabel={resumenDeRegla(tramosExtremos)} textoVacio="No hay saldo a cobrar." />
  </Panel>
  <Panel titulo="Contenedores angostos: 16rem (apilada) y 26rem (renglones)">
    <div class="angosto-16"><ReglaTramos tramos={conDestino(tramosCompletos)} ariaLabel={resumenDeRegla(tramosCompletos)} textoVacio="No hay saldo a cobrar." /></div>
    <div class="angosto-26"><ReglaTramos tramos={conDestino(tramosCompletos)} ariaLabel={resumenDeRegla(tramosCompletos)} textoVacio="No hay saldo a cobrar." /></div>
  </Panel>
  <Panel titulo="Mínima (columna de una tabla), con el vacío">
    <ul class="filas-minimas">
      <li><span>Contratista Demo S.A.</span><ReglaTramos variante="minima" tramos={tramosConUnoEnCero} ariaLabel="" textoVacio="" /></li>
      <li><span>Transportes del Sur Demo S.R.L.</span><ReglaTramos variante="minima" tramos={tramosExtremos} ariaLabel="" textoVacio="" /></li>
      <li><span>Cliente sin saldo</span><ReglaTramos variante="minima" tramos={tramosSinSaldo} ariaLabel="" textoVacio="" /></li>
    </ul>
  </Panel>
  <Panel titulo="Sin saldo a cobrar (vacío)">
    <ReglaTramos tramos={tramosSinSaldo} ariaLabel="" textoVacio="No hay saldo a cobrar al 31/10/2026." />
  </Panel>

  <!-- ===================== Gráfico de meses ===================== -->
  <Panel titulo="Gráfico de 12 meses, con su tabla (con claves de columna y enlaces en las celdas)">
    <GraficoMeses
      subtitulo="En millones de pesos, con IVA."
      series={seriesFacturadoCobrado}
      meses={mesesFacturadoCobrado}
      mesDeCorte={MES_DE_CORTE}
      ariaLabel={resumenFacturadoCobrado}
      renglonDeCorte={renglonConMesResaltado}
      tabla={tablaConClaves}
    >
      {#snippet celda({ mes, columna, importe })}
        <a href="#desglose-{mes}-{columna}">{formatearImporte(importe)}</a>
      {/snippet}
    </GraficoMeses>
  </Panel>
  <Panel titulo="Gráfico alto, sin tabla propia (la página Meses la muestra en otro panel)">
    <GraficoMeses
      alto="alto"
      subtitulo="En millones de pesos, con IVA."
      series={seriesFacturadoCobrado}
      meses={mesesFacturadoCobrado}
      mesDeCorte={MES_DE_CORTE}
      ariaLabel={resumenFacturadoCobrado}
      renglonDeCorte={renglonDeCorte(mesesFacturadoCobrado, seriesFacturadoCobrado)}
    />
  </Panel>
  <Panel titulo="Una serie, con un valor negativo y un mes en 0">
    <GraficoMeses
      subtitulo="Sin IVA, en millones de pesos."
      series={serieDelCliente}
      meses={mesesDelCliente}
      mesDeCorte={MES_DE_CORTE}
      ariaLabel={resumenDelGrafico("Facturación sin IVA del cliente por mes", mesesDelCliente, serieDelCliente)}
    />
  </Panel>
</section>

<style>
  .grupo {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .rejilla {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
    gap: var(--e-5) var(--e-6);
  }
  .caso {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    min-width: 0;
  }
  .angosto-14 {
    max-width: 14rem;
  }
  .angosto-16 {
    max-width: 16rem;
    margin-bottom: var(--e-5);
  }
  .angosto-26 {
    max-width: 26rem;
  }
  .pila {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .filas-minimas {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    font-size: var(--t-tabla);
  }
  .filas-minimas li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2) var(--e-4);
  }

  /* Tabla de la muestra (la de verdad es la pieza Tabla): lo justo para ver el recibo en su lugar. */
  .tabla-caja {
    container: tabla / inline-size;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--t-tabla);
  }
  th,
  td {
    padding: var(--e-1) var(--e-3);
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--c-borde);
  }
  thead th {
    padding-block: var(--e-2);
    background: var(--c-superficie-2);
  }
  .importe {
    text-align: right;
    white-space: nowrap;
  }
  tr.abierta {
    background: var(--c-acento-suave);
    box-shadow: inset 4px 0 0 var(--c-tinta);
  }
  .detalle-fila td {
    padding: var(--e-1) var(--e-3) var(--e-3);
  }
  .aparte {
    display: block;
    color: var(--c-texto-2);
    font-size: var(--t-chico);
  }
  @container tabla (max-width: 35rem) {
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    table,
    tbody,
    tr {
      display: block;
    }
    td {
      display: block;
      padding-block: var(--e-1);
      border: 0;
    }
    tr {
      padding: var(--e-2) 0;
      border-bottom: 1px solid var(--c-borde);
    }
    td.importe {
      text-align: left;
    }
  }
</style>
