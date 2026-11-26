<!-- La tabla de la sección Clientes: un cliente por fila, del saldo más grande al más chico, con su saldo y su mora (cada
     importe abre su desglose), su regla mínima, su tramo más antiguo y, si hay algo para revisar, su etiqueta. Recibe el modelo de vista ya calculado: los dos totales
     son la suma de las filas que se ven (y valen lo mismo que la medida entera cuando son todos los clientes que la tienen). -->
<script lang="ts">
  import { formatearCuit } from "../../lib/datos/cuit.ts";
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import { nombreDeRuta, vacioDeLaListaDeClientes } from "../../lib/vistas/rotulos.ts";
  import type { FilaDeCliente, VistaClientes } from "../../lib/vistas/clientes.ts";
  import type { CifraDeMedida, TotalDeColumna } from "../../lib/vistas/tipos.ts";
  import Boton from "../../componentes/Boton.svelte";
  import { claveDeMedida } from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import ReglaTramos from "../../componentes/ReglaTramos.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { CeldaDeTotal, ColumnaDeTabla, TotalDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_CLIENTES, TEXTO_ETIQUETAS, TEXTO_MARCO, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import Vacio from "../../componentes/Vacio.svelte";
  import EtiquetaDeTramo from "../../componentes/EtiquetaDeTramo.svelte";

  let { app, vista, alBorrarBusqueda }: { app: AplicacionLista; vista: VistaClientes; alBorrarBusqueda: () => void } = $props();

  const columnas: ColumnaDeTabla<FilaDeCliente>[] = [
    { id: "cliente", titulo: TEXTO_TABLA.cliente, papel: "principal" },
    { id: "saldo", titulo: TEXTO_TABLA.saldo, numerica: true, importe: (f) => f.saldo.importe },
    { id: "mora", titulo: TEXTO_TABLA.enMora, numerica: true, importe: (f) => f.mora.importe },
    { id: "antiguedad", titulo: TEXTO_TABLA.antiguedad, opcional: true },
    { id: "tramo", titulo: TEXTO_TABLA.tramoMasAntiguo, papel: "etiqueta" },
  ];

  /** La celda de un total: el importe, los centavos y, si es una medida entera, de cuál (`data-m`). */
  function celdaDeTotal(total: TotalDeColumna): CeldaDeTotal {
    const celda: CeldaDeTotal = { texto: formatearImporte(total.importe), centavos: total.importe };
    if (total.medida !== null) celda.medida = claveDeMedida(total.medida, vista.corte);
    return celda;
  }
  const total = $derived<TotalDeTabla>({
    rotulo: TEXTO_TABLA.totalDeClientes(vista.filas.length),
    celdas: { saldo: celdaDeTotal(vista.totales.saldo), mora: celdaDeTotal(vista.totales.mora) },
  });

  const elegida = $derived(app.memoria.filaElegidaEn(app.direccion.ruta)?.clienteId ?? null);

  /** El desglose de una cifra del cliente. */
  function enlaceDeCifra(cifra: CifraDeMedida): string {
    return app.direccion.enlace({ tipo: "desglose", clave: cifra.medida.clave, ...(cifra.medida.clienteId === undefined ? {} : { clienteId: cifra.medida.clienteId }) });
  }
  function nombreDeCifra(cifra: CifraDeMedida): string {
    return nombreDeRuta({ tipo: "desglose", clave: cifra.medida.clave, ...(cifra.medida.clienteId === undefined ? {} : { clienteId: cifra.medida.clienteId }) }, app.datos, vista.corte);
  }
</script>

{#snippet cifraDelCliente(cifra: CifraDeMedida)}
  {#if cifra.importe > 0}
    <CifraEnlace href={enlaceDeCifra(cifra)} importe={cifra.importe} ref={cifra.medida} corte={vista.corte} nombre={nombreDeCifra(cifra)} />
  {:else}
    <span class="solo-lectores">{nombreDeCifra(cifra)}:&nbsp;</span>{formatearImporte(cifra.importe)}
  {/if}
{/snippet}

{#snippet celda(f: FilaDeCliente, c: ColumnaDeTabla<FilaDeCliente>)}
  {#if c.id === "cliente"}
    <a href={app.direccion.enlace({ tipo: "cliente", clienteId: f.clienteId })} data-viaja>{f.nombre}</a>
    <span class="sec">{TEXTO_CLIENTES.plazoYCuit(f.plazoDias, formatearCuit(f.cuit))}</span>
  {:else if c.id === "saldo"}
    {@render cifraDelCliente(f.saldo)}
  {:else if c.id === "mora"}
    {@render cifraDelCliente(f.mora)}
  {:else if c.id === "antiguedad"}
    <ReglaTramos
      variante="minima"
      tramos={f.regla.filas.map((t) => ({ clave: t.tramo, importe: t.cifra.importe, porcentaje: t.milesimas }))}
      ariaLabel=""
      textoVacio=""
    />
  {:else if c.id === "tramo"}
    {#if f.tramoMasAntiguo === null}
      <span class="suave">{TEXTO_ETIQUETAS.sinSaldo}</span>
    {:else}
      <EtiquetaDeTramo tramo={f.tramoMasAntiguo} />
    {/if}
    {#if f.estado === "revisar-imputacion"}
      <Etiqueta tono="revisar" icono="alerta">{TEXTO_ETIQUETAS.revisarImputacion}</Etiqueta>
    {:else if f.estado === "saldo-a-favor"}
      <Etiqueta tono="pendiente" icono="flecha-izq">{TEXTO_ETIQUETAS.saldoAFavor}</Etiqueta>
    {/if}
  {/if}
{/snippet}

<Tabla
  titulo={TEXTO_CLIENTES.panel}
  {columnas}
  filas={vista.filas}
  clave={(f) => f.clienteId}
  {celda}
  {total}
  {elegida}
  textoDeElegida="({TEXTO_MARCO.ultimaFilaAbierta})"
  tarjetasDesde={41.5}
>
  {#snippet vacia()}
    <Vacio conMargen texto={vacioDeLaListaDeClientes(vista)} detalle={vista.conBusqueda ? TEXTO_CLIENTES.sugerenciaDeBusqueda : undefined}>
      {#snippet accion()}
        {#if vista.conBusqueda}<Boton variante="secundario" onclick={alBorrarBusqueda}>{TEXTO_TABLA.borrarBusqueda}</Boton>{/if}
      {/snippet}
    </Vacio>
  {/snippet}
</Tabla>
