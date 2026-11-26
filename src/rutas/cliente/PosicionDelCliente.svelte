<!-- Panel «Posición del cliente al …»: su saldo y su mora (cifras que se abren en su desglose), lo cobrado sin imputar con el saldo neto si lo hay, y su regla de tramos. -->
<script lang="ts">
  import { formatearPorcentaje } from "../../lib/dominio/dinero.ts";
  import { ROTULO_DE_TRAMO } from "../../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { etiquetaDeReglaDeTramos } from "../../lib/vistas/rotulos.ts";
  import type { VistaCliente } from "../../lib/vistas/cliente.ts";
  import type { RefDeMedida } from "../../lib/vistas/tipos.ts";
  import Cifra, { claveDeMedida } from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import ReglaTramos from "../../componentes/ReglaTramos.svelte";
  import type { TramoDeRegla } from "../../componentes/tipos-graficos.ts";
  import { TEXTO_CLIENTE, TEXTO_ETIQUETAS } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./enlaces.ts";

  let { app, vista }: { app: AplicacionLista; vista: VistaCliente } = $props();

  const corte = $derived(vista.corte);
  const destino = (ref: RefDeMedida): string => app.direccion.enlace(rutaDeDesglose(ref));

  const tramos = $derived<TramoDeRegla[]>(
    vista.regla.filas.map((f) => ({
      clave: f.tramo,
      importe: f.cifra.importe,
      porcentaje: f.milesimas,
      rotulo: ROTULO_DE_TRAMO[f.tramo],
      href: destino(f.cifra.medida),
      medida: claveDeMedida(f.cifra.medida, corte),
    })),
  );
  const etiquetaDeLaRegla = $derived(etiquetaDeReglaDeTramos(vista.regla, corte, app.datos));
</script>

<Panel titulo={TEXTO_CLIENTE.posicion(corte)} id="t-posc">
  <div class="cifras">
    <div>
      <p class="rotulo">{TEXTO_CLIENTE.saldoConIva}</p>
      {#if vista.saldo.importe > 0}
        <CifraEnlace href={destino(vista.saldo.medida)} importe={vista.saldo.importe} ref={vista.saldo.medida} {corte} nombre={nombreDeCifra(app.datos, vista.saldo.medida, corte)} tamano="cifra" />
      {:else}
        <Cifra importe={vista.saldo.importe} tamano="cifra" ref={vista.saldo.medida} {corte} />
      {/if}
    </div>
    <div>
      <p class="rotulo">{TEXTO_CLIENTE.enMora}</p>
      {#if vista.mora.importe > 0}
        <CifraEnlace href={destino(vista.mora.medida)} importe={vista.mora.importe} ref={vista.mora.medida} {corte} nombre={nombreDeCifra(app.datos, vista.mora.medida, corte)} tamano="cifra" />
      {:else}
        <Cifra importe={vista.mora.importe} tamano="cifra" ref={vista.mora.medida} {corte} />
      {/if}
      <span class="sec">{vista.moraSobreSaldo === null ? TEXTO_ETIQUETAS.sinSaldoACobrar : TEXTO_CLIENTE.porcentajeDelSaldo(formatearPorcentaje(vista.moraSobreSaldo))}</span>
    </div>
  </div>

  {#if vista.sinImputar !== null}
    {@const sin = vista.sinImputar}
    <div class="lineas">
      <div class="linea">
        {#if sin.tipo === "pagos-a-cuenta"}
          <span class="r">{TEXTO_CLIENTE.pagosACuentaSinImputar} <Etiqueta tono="revisar" icono="alerta">{TEXTO_ETIQUETAS.revisarImputacion}</Etiqueta></span>
        {:else}
          <span class="r">{TEXTO_CLIENTE.saldoAFavor}</span>
        {/if}
        <CifraEnlace href={destino(sin.importe.medida)} importe={sin.importe.importe} ref={sin.importe.medida} {corte} nombre={nombreDeCifra(app.datos, sin.importe.medida, corte)} />
      </div>
      <div class="linea">
        <span class="r">{TEXTO_CLIENTE.saldoNeto} <span class="sec-in">{TEXTO_CLIENTE.saldoNetoNota}</span></span>
        <CifraEnlace href={destino(sin.saldoNeto.medida)} importe={sin.saldoNeto.importe} ref={sin.saldoNeto.medida} {corte} nombre={nombreDeCifra(app.datos, sin.saldoNeto.medida, corte)} />
      </div>
    </div>
  {/if}

  <div class="regla">
    <ReglaTramos {tramos} ariaLabel={etiquetaDeLaRegla} variante="mediana" titulo={TEXTO_CLIENTE.antiguedad} textoVacio={TEXTO_CLIENTE.sinSaldoALaFecha(corte)} />
  </div>
</Panel>

<style>
  .cifras {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 11.875rem), 1fr));
    gap: var(--e-3) var(--e-5);
  }
  .cifras .rotulo {
    margin-bottom: var(--e-1);
  }
  .sec {
    display: block;
    margin-top: 0.125rem;
    color: var(--c-texto-2);
    font-size: var(--t-chico);
  }
  .sec-in {
    color: var(--c-texto-2);
    font-size: var(--t-chico);
    font-weight: 400;
  }
  .lineas {
    margin-top: 0.875rem;
    border-top: 1px solid var(--c-borde);
  }
  .linea {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem var(--e-3);
    padding: 0.625rem 0;
    border-bottom: 1px solid var(--c-borde);
  }
  .linea:last-child {
    border-bottom: 0;
  }
  .r {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.625rem;
    font-weight: 600;
  }
  .regla {
    margin-top: var(--e-4);
    padding-top: var(--e-4);
    border-top: 1px solid var(--c-borde);
  }
</style>
