<!-- Comprobantes con saldo: la regla de tramos, los filtros por tramo con su conteo, la búsqueda por cliente o número
     y la tabla con su total. Todo el estado está en la dirección (`tramo`, `q`): filtrar o escribir cambia la dirección sin entrada nueva y esta pantalla se actualiza
     EN EL LUGAR (nada de `{#key}` con la consulta), así el foco sigue en la pastilla o en el campo. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { cantidadDe, ROTULO_DE_TRAMO, tituloDeDesglose, vacioDeComprobantes } from "../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import type { RutaNavegable } from "../lib/estado/enrutador.ts";
  import { vistaComprobantes } from "../lib/vistas/comprobantes.ts";
  import { normalizarBusqueda } from "../lib/vistas/formato.ts";
  import { estadoDeLaListaDeComprobantes, etiquetaDeReglaDeTramos } from "../lib/vistas/rotulos.ts";
  import type { FiltroDeTramo } from "../lib/vistas/tipos.ts";
  import Buscador from "../componentes/Buscador.svelte";
  import Cabecera from "../componentes/Cabecera.svelte";
  import CifraEnlace from "../componentes/CifraEnlace.svelte";
  import Panel from "../componentes/Panel.svelte";
  import Pastillas from "../componentes/Pastillas.svelte";
  import type { PastillaItem } from "../componentes/Pastillas.svelte";
  import ReglaTramos from "../componentes/ReglaTramos.svelte";
  import { TEXTO_COMPROBANTES } from "../componentes/textos-marco.ts";
  import { NUMERO_DE_TRAMO } from "../componentes/tramos.ts";
  import TablaDeComprobantes from "./comprobantes/TablaDeComprobantes.svelte";

  type Ruta = Extract<RutaNavegable, { tipo: "comprobantes" }>;
  let { app, ruta }: { app: AplicacionLista; ruta: Ruta } = $props();

  const corte = $derived(app.direccion.corte);
  const vista = $derived(vistaComprobantes(app.datos, corte, { tramo: ruta.tramo ?? "todos", q: ruta.q ?? "" }));

  // Lo que se ve en el campo es lo que se escribió, tal cual (la dirección guarda la búsqueda ya recortada y en minúsculas: devolverla al campo mientras se
  // escribe se comería los espacios del final). Si la dirección cambia por otro lado (Atrás, un enlace), el campo la sigue.
  let escrito = $state(untrack(() => ruta.q ?? ""));
  $effect.pre(() => {
    const deLaDireccion = ruta.q ?? "";
    if (normalizarBusqueda(untrack(() => escrito)) !== deLaDireccion) escrito = deLaDireccion;
  });

  /** La ruta de la lista con este filtro y esta búsqueda. */
  function rutaCon(tramo: FiltroDeTramo, q: string): Ruta {
    const siguiente: Ruta = { tipo: "comprobantes" };
    if (tramo !== "todos") siguiente.tramo = tramo;
    if (q !== "") siguiente.q = q;
    return siguiente;
  }

  function alEscribir(texto: string): void {
    escrito = texto;
    app.direccion.reemplazar(rutaCon(vista.filtro, normalizarBusqueda(texto)));
  }
  function alBorrarBusqueda(): void {
    alEscribir("");
    document.getElementById("busca-cmp")?.focus();
  }

  function textoDelFiltro(filtro: FiltroDeTramo): string {
    if (filtro === "todos") return TEXTO_COMPROBANTES.filtroTodos;
    if (filtro === "vencidos") return TEXTO_COMPROBANTES.filtroEnMora;
    return ROTULO_DE_TRAMO[filtro];
  }
  const pastillas = $derived<PastillaItem[]>(
    vista.pastillas.map((p) => {
      const item: PastillaItem = {
        id: p.filtro,
        texto: textoDelFiltro(p.filtro),
        href: app.direccion.enlace(rutaCon(p.filtro, ruta.q ?? "")),
        cantidad: p.cantidad,
        cantidadDicha: cantidadDe(p.cantidad, "comprobante", "comprobantes"),
      };
      if (p.filtro !== "todos" && p.filtro !== "vencidos") item.tramo = NUMERO_DE_TRAMO[p.filtro];
      return item;
    }),
  );

  const tramosDeLaRegla = $derived(vista.regla.filas.map((f) => ({ clave: f.tramo, importe: f.cifra.importe, porcentaje: f.milesimas })));
</script>

<Cabecera titulo={TEXTO_COMPROBANTES.titulo(corte)}>
  {#snippet bajada()}
    {TEXTO_COMPROBANTES.bajadaInicio}
    <CifraEnlace
      href={app.direccion.enlace({ tipo: "desglose", clave: "saldo" })}
      importe={vista.saldo.importe}
      ref={vista.saldo.medida}
      {corte}
      nombre={tituloDeDesglose("saldo", corte)}
    />{TEXTO_COMPROBANTES.bajadaFin}
  {/snippet}
</Cabecera>

<Panel titulo={TEXTO_COMPROBANTES.panel} estado={estadoDeLaListaDeComprobantes(vista)} relleno="ninguno">
  {#snippet herramientas()}
    <div class="regla">
      <ReglaTramos
        tramos={tramosDeLaRegla}
        ariaLabel={etiquetaDeReglaDeTramos(vista.regla, corte, app.datos)}
        textoVacio={vacioDeComprobantes(0, "todos", corte)}
        sinLista
      />
    </div>
    <Pastillas etiqueta={TEXTO_COMPROBANTES.filtrarPorTramo} items={pastillas} actual={vista.filtro} prefijoDeFoco="f-cmp" />
    <Buscador id="busca-cmp" etiqueta={TEXTO_COMPROBANTES.buscarEtiqueta} marcador={TEXTO_COMPROBANTES.buscarPlaceholder} valor={escrito} {alEscribir} />
  {/snippet}
  <TablaDeComprobantes {app} {vista} {alBorrarBusqueda} />
</Panel>

<style>
  /* La regla ocupa todo el ancho de las herramientas (con el panel ancho, filtros a la izquierda y búsqueda a la derecha). */
  .regla {
    grid-column: 1 / -1;
  }
</style>
