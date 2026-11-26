<!-- Una de las dos tablas de «Para revisar»: los pagos a cuenta sin imputar (de clientes que todavía deben) o los saldos a favor (de los que no).
     Cada fila lleva al cliente; el importe, a su desglose (si el cliente tiene más de un recibo así, el importe de la fila no es todo lo que ese desglose suma y no se enlaza). -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import { formatearFecha } from "../../lib/dominio/fechas.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { FilaDeACuenta, GrupoDeACuenta } from "../../lib/vistas/resumen.ts";
  import Cifra, { claveDeMedida } from "../../componentes/Cifra.svelte";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_ETIQUETAS, TEXTO_RESUMEN, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "./cifras.ts";

  let { app, grupo, tipo, corte }: { app: AplicacionLista; grupo: GrupoDeACuenta; tipo: "pagos" | "saldos"; corte: string } = $props();

  const esPagos = $derived(tipo === "pagos");
  const idDeImporte = $derived(esPagos ? "ac" : "af");
  const columnas = $derived<ColumnaDeTabla<FilaDeACuenta>[]>([
    { id: "cliente", titulo: TEXTO_TABLA.cliente, papel: "principal" },
    { id: "detalle", titulo: esPagos ? TEXTO_TABLA.recibo : TEXTO_RESUMEN.origen, papel: "secundaria" },
    { id: idDeImporte, titulo: esPagos ? TEXTO_RESUMEN.aCuenta : TEXTO_ETIQUETAS.saldoAFavor, numerica: true, importe: (f) => f.importe },
    { id: "estado", titulo: TEXTO_TABLA.estado, papel: "etiqueta" },
  ]);
  const total = $derived(
    grupo.filas.length > 1
      ? {
          rotulo: TEXTO_TABLA.total,
          celdas: { [idDeImporte]: { texto: formatearImporte(grupo.total.importe), centavos: grupo.total.importe, medida: claveDeMedida(grupo.total.medida, corte) } },
        }
      : undefined,
  );
</script>

{#snippet celda(f: FilaDeACuenta, c: ColumnaDeTabla<FilaDeACuenta>)}{#if c.id === "cliente"}<a href={app.direccion.enlace({ tipo: "cliente", clienteId: f.clienteId })}>{f.nombre}</a>{:else if c.id === "detalle"}{#if esPagos}<span class="codigo">{f.reciboId}</span> · {formatearFecha(f.fecha)}{:else}{TEXTO_RESUMEN.sobrepagoEn(f.reciboId)}{/if}{:else if c.id === idDeImporte}{#if f.desglose !== null}<CifraEnlace href={app.direccion.enlace(rutaDeDesglose(f.desglose, false))} importe={f.importe} ref={f.desglose} {corte} nombre={nombreDeCifra(f.desglose, corte, app.datos)} />{:else}<Cifra importe={f.importe} />{/if}{:else if c.id === "estado"}{#if esPagos}<Etiqueta tono="revisar" icono="alerta">{TEXTO_ETIQUETAS.revisarImputacion}</Etiqueta>{:else}<Etiqueta tono="pendiente" icono="flecha-izq">{TEXTO_ETIQUETAS.saldoAFavor}</Etiqueta>{/if}{/if}{/snippet}

<Tabla
  titulo={esPagos ? TEXTO_RESUMEN.pagosACuentaSinImputar : TEXTO_RESUMEN.saldosAFavor}
  tituloVisible
  {columnas}
  filas={grupo.filas}
  clave={(f) => f.reciboId}
  {celda}
  {total}
/>
