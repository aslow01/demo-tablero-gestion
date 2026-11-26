<!-- Los mismos doce meses, en tabla: facturación sin IVA, facturado con IVA, cobrado y retenciones de cada mes, con el total de cada columna. Cada importe
     lleva al desglose de ese mes; el mes del corte va marcado. En el celular cada mes es una tarjeta. -->
<script lang="ts">
  import { formatearImporte } from "../../lib/dominio/dinero.ts";
  import type { AplicacionLista } from "../../lib/estado/aplicacion.svelte.ts";
  import type { MesDeLaEmpresa, VistaMeses } from "../../lib/vistas/meses.ts";
  import CifraEnlace from "../../componentes/CifraEnlace.svelte";
  import Tabla from "../../componentes/Tabla.svelte";
  import type { ColumnaDeTabla } from "../../componentes/Tabla.svelte";
  import { TEXTO_MESES, TEXTO_TABLA } from "../../componentes/textos-marco.ts";
  import { nombreDeCifra, rutaDeDesglose } from "../resumen/cifras.ts";
  import { COLUMNAS_DE_MESES, importeDelMes, rotuloDeMes, totalDeMeses } from "../resumen/meses-en-pantalla.ts";

  let { app, v }: { app: AplicacionLista; v: VistaMeses } = $props();

  const corte = $derived(app.direccion.corte);
  const columnas: ColumnaDeTabla<MesDeLaEmpresa>[] = [
    { id: "mes", titulo: TEXTO_TABLA.mes, papel: "principal" },
    ...COLUMNAS_DE_MESES.map((c): ColumnaDeTabla<MesDeLaEmpresa> => ({ id: c.id, titulo: c.titulo, numerica: true, importe: (m) => importeDelMes(m, c.id) })),
  ];
  const total = $derived({
    rotulo: TEXTO_MESES.totalDeLosMeses(v.meses.length),
    celdas: Object.fromEntries(
      COLUMNAS_DE_MESES.map((c) => {
        const importe = totalDeMeses(v, c.id);
        return [c.id, { texto: formatearImporte(importe), centavos: importe }];
      }),
    ),
  });
</script>

{#snippet celda(m: MesDeLaEmpresa, c: ColumnaDeTabla<MesDeLaEmpresa>)}{#if c.id === "mes"}{rotuloDeMes(m.mes)}{:else}{#each COLUMNAS_DE_MESES as columna (columna.id)}{#if columna.id === c.id}{@const ref = { clave: columna.clave, mes: m.mes }}<CifraEnlace href={app.direccion.enlace(rutaDeDesglose(ref, true))} importe={importeDelMes(m, columna.id)} {ref} {corte} nombre={nombreDeCifra(ref, corte, app.datos)} />{/if}{/each}{/if}{/snippet}

<Tabla
  titulo={TEXTO_MESES.panelDeLaTabla}
  {columnas}
  filas={v.meses}
  clave={(m) => m.mes}
  {celda}
  {total}
  elegida={v.mesDelCorte}
  textoDeElegida={TEXTO_MESES.marcaDelCorte}
  tarjetasDesde={40.5}
/>
