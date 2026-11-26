<!-- Clientes: la cartera por cliente con su saldo y su mora, los filtros con su conteo, la búsqueda por nombre o CUIT y
     la tabla con sus dos totales. Todo el estado está en la dirección (`filtro`, `q`): filtrar o escribir cambia la dirección sin entrada nueva y esta pantalla se
     actualiza EN EL LUGAR (nada de `{#key}` con la consulta), así el foco sigue en la pastilla o en el campo. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { cantidadDe } from "../lib/dominio/textos.ts";
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import type { RutaNavegable } from "../lib/estado/enrutador.ts";
  import { vistaClientes } from "../lib/vistas/clientes.ts";
  import { normalizarBusqueda } from "../lib/vistas/formato.ts";
  import { estadoDeLaListaDeClientes } from "../lib/vistas/rotulos.ts";
  import type { FiltroDeClientes } from "../lib/vistas/tipos.ts";
  import Buscador from "../componentes/Buscador.svelte";
  import Cabecera from "../componentes/Cabecera.svelte";
  import Panel from "../componentes/Panel.svelte";
  import Pastillas from "../componentes/Pastillas.svelte";
  import type { PastillaItem } from "../componentes/Pastillas.svelte";
  import { TEXTO_CLIENTES } from "../componentes/textos-marco.ts";
  import TablaDeClientes from "./clientes/TablaDeClientes.svelte";

  type Ruta = Extract<RutaNavegable, { tipo: "clientes" }>;
  let { app, ruta }: { app: AplicacionLista; ruta: Ruta } = $props();

  const corte = $derived(app.direccion.corte);
  const vista = $derived(vistaClientes(app.datos, corte, { filtro: ruta.filtro ?? "todos", q: ruta.q ?? "" }));

  // Lo que se ve en el campo es lo que se escribió, tal cual (la dirección guarda la búsqueda ya recortada y en minúsculas: devolverla al campo mientras se
  // escribe se comería los espacios del final). Si la dirección cambia por otro lado (Atrás, un enlace), el campo la sigue.
  let escrito = $state(untrack(() => ruta.q ?? ""));
  $effect.pre(() => {
    const deLaDireccion = ruta.q ?? "";
    if (normalizarBusqueda(untrack(() => escrito)) !== deLaDireccion) escrito = deLaDireccion;
  });

  /** La ruta de la lista con este filtro y esta búsqueda. */
  function rutaCon(filtro: FiltroDeClientes, q: string): Ruta {
    const siguiente: Ruta = { tipo: "clientes" };
    if (filtro !== "todos") siguiente.filtro = filtro;
    if (q !== "") siguiente.q = q;
    return siguiente;
  }

  function alEscribir(texto: string): void {
    escrito = texto;
    app.direccion.reemplazar(rutaCon(vista.filtro, normalizarBusqueda(texto)));
  }
  function alBorrarBusqueda(): void {
    alEscribir("");
    document.getElementById("busca-cli")?.focus();
  }

  const TEXTO_DEL_FILTRO: Readonly<Record<FiltroDeClientes, string>> = {
    todos: TEXTO_CLIENTES.filtroTodos,
    "con-mora": TEXTO_CLIENTES.filtroConMora,
    revisar: TEXTO_CLIENTES.filtroParaRevisar,
  };
  const pastillas = $derived<PastillaItem[]>(
    vista.pastillas.map((p) => ({
      id: p.filtro,
      texto: TEXTO_DEL_FILTRO[p.filtro],
      href: app.direccion.enlace(rutaCon(p.filtro, ruta.q ?? "")),
      cantidad: p.cantidad,
      cantidadDicha: cantidadDe(p.cantidad, "cliente", "clientes"),
    })),
  );
</script>

<Cabecera titulo={TEXTO_CLIENTES.titulo(corte)} bajada={TEXTO_CLIENTES.bajada} />

<Panel titulo={TEXTO_CLIENTES.panel} meta={TEXTO_CLIENTES.orden} estado={estadoDeLaListaDeClientes(vista)} relleno="ninguno">
  {#snippet herramientas()}
    <Pastillas etiqueta={TEXTO_CLIENTES.filtrarClientes} items={pastillas} actual={vista.filtro} prefijoDeFoco="f-cli" />
    <Buscador id="busca-cli" etiqueta={TEXTO_CLIENTES.buscarEtiqueta} marcador={TEXTO_CLIENTES.buscarPlaceholder} valor={escrito} {alEscribir} />
  {/snippet}
  <TablaDeClientes {app} {vista} {alBorrarBusqueda} />
</Panel>
