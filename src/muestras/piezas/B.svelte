<!-- SOLO DESARROLLO: piezas B de la galería: Tabla, Pastillas, Buscador y Solapas, con todos sus estados.
     La importa Muestras.svelte. Datos y textos de prueba (empresas y números inventados); ninguna pieza lee el estado de la aplicación. -->
<script lang="ts">
  import { centavos, formatearImporte } from "../../lib/dominio/dinero.ts";
  import Boton from "../../componentes/Boton.svelte";
  import Buscador from "../../componentes/Buscador.svelte";
  import Etiqueta from "../../componentes/Etiqueta.svelte";
  import Panel from "../../componentes/Panel.svelte";
  import Pastillas, { type PastillaItem } from "../../componentes/Pastillas.svelte";
  import ReglaTramos from "../../componentes/ReglaTramos.svelte";
  import Solapas, { type Solapa } from "../../componentes/Solapas.svelte";
  import Tabla, { type ColumnaDeTabla, type TotalDeTabla } from "../../componentes/Tabla.svelte";
  import type { NumeroDeTramo, Tono } from "../../componentes/tipos.ts";
  import { resumenDeRegla, tramosConUnoEnCero } from "../datos-de-prueba.ts";

  // ---------- Datos de prueba ----------
  const cent = (pesos: number): number => Math.round(pesos * 100);
  const imp = (c: number): string => formatearImporte(centavos(c));
  const sumar = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);
  const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;
  const dias = (n: number): string => plural(n, "día", "días");

  const tramoDe = (atraso: number): NumeroDeTramo => (atraso <= 0 ? 0 : atraso <= 30 ? 1 : atraso <= 60 ? 2 : atraso <= 90 ? 3 : 4);
  const ROTULO_TRAMO = ["No vencido", "1 a 30 días", "31 a 60 días", "61 a 90 días", "Más de 90 días"];
  const TONO_TRAMO: Tono[] = ["neutro", "revisar", "revisar", "diferencia", "diferencia"];

  interface Comp {
    id: string;
    numero: string;
    cliente: string;
    emision: string;
    vence: string;
    saldo: number;
    atraso: number;
  }
  const COMPROBANTES: Comp[] = [
    { id: "562", numero: "FA 0003-00000562", cliente: "Contratista Demo S.A.", emision: "03/07/2026", vence: "02/08/2026", saldo: cent(1_452_300.5), atraso: 90 },
    { id: "571", numero: "FA 0003-00000571", cliente: "Transportes del Sur Demo S.R.L.", emision: "14/07/2026", vence: "13/08/2026", saldo: cent(902_000), atraso: 79 },
    { id: "588", numero: "FA 0003-00000588", cliente: "Minera Ejemplo S.A.", emision: "02/08/2026", vence: "01/09/2026", saldo: cent(3_210_870.14), atraso: 60 },
    { id: "593", numero: "FA 0003-00000593", cliente: "Algarrobos Demo S.R.L.", emision: "19/08/2026", vence: "18/09/2026", saldo: cent(480_000), atraso: 43 },
    { id: "604", numero: "FA 0003-00000604", cliente: "Servicios Andinos Demo S.A.", emision: "01/09/2026", vence: "01/10/2026", saldo: cent(1_118_540.9), atraso: 30 },
    { id: "611", numero: "FA 0003-00000611", cliente: "Contratista Demo S.A.", emision: "12/09/2026", vence: "12/10/2026", saldo: cent(2_750_000), atraso: 19 },
    { id: "620", numero: "FA 0003-00000620", cliente: "Minera Ejemplo S.A.", emision: "30/09/2026", vence: "30/10/2026", saldo: cent(6_000_100), atraso: 1 },
    { id: "633", numero: "FA 0003-00000633", cliente: "Transportes del Sur Demo S.R.L.", emision: "15/10/2026", vence: "14/11/2026", saldo: cent(1_340_220.75), atraso: -14 },
    { id: "641", numero: "NC 0003-00000641", cliente: "Algarrobos Demo S.R.L.", emision: "21/10/2026", vence: "20/11/2026", saldo: cent(-58_000), atraso: -20 },
    { id: "650", numero: "FA 0003-00000650", cliente: "Servicios Andinos Demo S.A.", emision: "27/10/2026", vence: "26/11/2026", saldo: cent(5_880_000), atraso: -26 },
  ];

  const COLUMNAS_COMP: ColumnaDeTabla<Comp>[] = [
    { id: "comprobante", titulo: "Comprobante", papel: "principal" },
    { id: "cliente", titulo: "Cliente", papel: "principal" },
    { id: "emision", titulo: "Emisión", cifras: true, opcional: true },
    { id: "vencimiento", titulo: "Vencimiento", cifras: true, papel: "secundaria" },
    { id: "saldo", titulo: "Saldo", numerica: true, importe: (f) => f.saldo },
    { id: "atraso", titulo: "Atraso", numerica: true, opcional: true, textoEnLinea: (f) => (f.atraso >= 1 ? dias(f.atraso) : ""), enLineaEn: "tramo" },
    { id: "tramo", titulo: "Tramo", papel: "etiqueta" },
  ];

  function totalComp(filas: Comp[]): TotalDeTabla {
    const t = sumar(filas.map((f) => f.saldo));
    return {
      rotulo: `Total (${plural(filas.length, "comprobante", "comprobantes")})`,
      cubre: 2,
      celdas: { saldo: { texto: imp(t), centavos: t, medida: "saldo|corte=2026-10-31" } },
    };
  }

  interface Cli {
    id: string;
    nombre: string;
    detalle: string;
    saldo: number;
    mora: number;
    tramo: NumeroDeTramo | null;
    estado: "revisar" | "favor" | null;
  }
  const CLIENTES: Cli[] = [
    { id: "C05", nombre: "Minera Ejemplo S.A.", detalle: "Plazo 30 días · CUIT 30-00000000-0 (ficticio)", saldo: cent(9_210_970.14), mora: cent(3_210_870.14), tramo: 2, estado: "revisar" },
    { id: "C02", nombre: "Servicios Andinos Demo S.A.", detalle: "Plazo 30 días · CUIT 30-00000001-8 (ficticio)", saldo: cent(6_998_540.9), mora: cent(1_118_540.9), tramo: 1, estado: null },
    { id: "C01", nombre: "Contratista Demo S.A.", detalle: "Plazo 45 días · CUIT 30-00000002-6 (ficticio)", saldo: cent(4_202_300.5), mora: cent(1_452_300.5), tramo: 3, estado: null },
    {
      id: "C07",
      nombre: "Sociedad Anónima de Servicios Integrales de Logística Minera y Transporte Interprovincial Demo",
      detalle: "Plazo 60 días · CUIT 30-00000003-4 (ficticio)",
      saldo: cent(902_000),
      mora: cent(902_000),
      tramo: 3,
      estado: null,
    },
    { id: "C09", nombre: "Algarrobos Demo S.R.L.", detalle: "Plazo 30 días · CUIT 30-00000004-2 (ficticio)", saldo: cent(422_000), mora: cent(480_000), tramo: 2, estado: "favor" },
    { id: "C11", nombre: "Cooperativa del Valle Demo", detalle: "Plazo 30 días · CUIT 30-00000005-0 (ficticio)", saldo: 0, mora: 0, tramo: null, estado: null },
  ];
  const COLUMNAS_CLI: ColumnaDeTabla<Cli>[] = [
    { id: "cliente", titulo: "Cliente", papel: "principal" },
    { id: "saldo", titulo: "Saldo", numerica: true, importe: (f) => f.saldo },
    { id: "mora", titulo: "En mora", numerica: true, importe: (f) => f.mora },
    { id: "antiguedad", titulo: "Saldo según atraso", opcional: true },
    { id: "tramo", titulo: "Tramo más antiguo", papel: "etiqueta" },
  ];
  const TOTAL_CLI: TotalDeTabla = {
    rotulo: `Total (${plural(CLIENTES.length, "cliente", "clientes")})`,
    celdas: {
      saldo: { texto: imp(sumar(CLIENTES.map((c) => c.saldo))), centavos: sumar(CLIENTES.map((c) => c.saldo)), medida: "saldo|corte=2026-10-31" },
      mora: { texto: imp(sumar(CLIENTES.map((c) => c.mora))), centavos: sumar(CLIENTES.map((c) => c.mora)) },
    },
  };

  interface Mov {
    id: string;
    fecha: string;
    tipo: "comprobante" | "cobro";
    numero: string;
    nota: string;
    debe: number;
    haber: number;
    saldo: number | null;
  }
  const MOVIMIENTOS: Mov[] = [
    { id: "m1", fecha: "03/07/2026", tipo: "comprobante", numero: "FA 0003-00000562", nota: "Alquiler mensual de camioneta 4x4 con chofer", debe: cent(1_452_300.5), haber: 0, saldo: cent(1_452_300.5) },
    { id: "m2", fecha: "14/08/2026", tipo: "cobro", numero: "RC 0001-00000211", nota: "Cobro", debe: 0, haber: cent(500_000), saldo: cent(952_300.5) },
    { id: "m3", fecha: "12/09/2026", tipo: "comprobante", numero: "FA 0003-00000611", nota: "Traslado de personal", debe: cent(2_750_000), haber: 0, saldo: cent(3_702_300.5) },
    { id: "m4", fecha: "21/10/2026", tipo: "comprobante", numero: "NC 0003-00000641", nota: "Nota de crédito", debe: 0, haber: cent(58_000), saldo: cent(3_644_300.5) },
  ];
  const POSTERIORES: Mov[] = [
    { id: "p1", fecha: "03/11/2026", tipo: "cobro", numero: "RC 0001-00000230", nota: "Cobro", debe: 0, haber: cent(1_000_000), saldo: null },
    { id: "p2", fecha: "10/11/2026", tipo: "comprobante", numero: "FA 0003-00000662", nota: "Traslado de personal", debe: cent(1_200_000), haber: 0, saldo: null },
  ];
  const COLUMNAS_MOV = (conCifra: boolean): ColumnaDeTabla<Mov>[] => [
    { id: "fecha", titulo: "Fecha", cifras: true, papel: "secundaria" },
    { id: "movimiento", titulo: "Movimiento", papel: "principal" },
    { id: "debe", titulo: "Debe", numerica: true, importe: (f) => (conCifra && f.debe > 0 ? f.debe : null) },
    { id: "haber", titulo: "Haber", numerica: true, importe: (f) => (conCifra && f.haber > 0 ? f.haber : null) },
    { id: "saldo", titulo: "Saldo", numerica: true },
  ];
  const SALDO_FINAL = MOVIMIENTOS.at(-1)?.saldo ?? 0;
  const TOTAL_CUENTA: TotalDeTabla = {
    rotulo: "Saldo al 31/10/2026",
    cubre: 4,
    id: "muestra-saldo-final",
    celdas: { saldo: { texto: imp(SALDO_FINAL), centavos: SALDO_FINAL, medida: "saldo-neto|cliente=C05", formula: "debe-haber" } },
  };

  // ---------- Lista completa e interactiva (pastillas + buscador + tabla en el mismo panel) ----------
  const FILTROS = ["todos", "vencidos", "no-vencido", "1-30", "31-60", "61-90", "mas-90"] as const;
  type Filtro = (typeof FILTROS)[number];
  const TEXTO_FILTRO: Record<Filtro, string> = {
    todos: "Todos",
    vencidos: "En mora",
    "no-vencido": "No vencido",
    "1-30": "1 a 30 días",
    "31-60": "31 a 60 días",
    "61-90": "61 a 90 días",
    "mas-90": "Más de 90 días",
  };
  const TRAMO_FILTRO: Partial<Record<Filtro, NumeroDeTramo>> = { "no-vencido": 0, "1-30": 1, "31-60": 2, "61-90": 3, "mas-90": 4 };
  const pasa = (f: Filtro, c: Comp): boolean => (f === "todos" ? true : f === "vencidos" ? c.atraso >= 1 : tramoDe(c.atraso) === TRAMO_FILTRO[f]);
  const normal = (t: string): string => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

  let filtro = $state<Filtro>("todos");
  let busqueda = $state("");
  const itemsLista = $derived<PastillaItem[]>(
    FILTROS.map((f) => {
      const n = COMPROBANTES.filter((c) => pasa(f, c)).length;
      const base: PastillaItem = { id: f, texto: TEXTO_FILTRO[f], href: `#muestra-filtro-${f}`, cantidad: n, cantidadDicha: plural(n, "comprobante", "comprobantes") };
      const t = TRAMO_FILTRO[f];
      return t === undefined ? base : { ...base, tramo: t };
    }),
  );
  const delFiltro = $derived(COMPROBANTES.filter((c) => pasa(filtro, c)));
  const visibles = $derived.by(() => {
    const q = normal(busqueda);
    return q === "" ? delFiltro : delFiltro.filter((c) => normal(c.cliente).includes(q) || c.numero.toLowerCase().includes(q));
  });
  const estadoLista = $derived(
    busqueda.trim() !== "" ? `Se muestran ${visibles.length} de ${delFiltro.length} comprobantes.` : `${plural(visibles.length, "comprobante", "comprobantes")}.`,
  );
  let volvio = $state<string | null>("593");

  // ---------- Pastillas de ejemplo ----------
  const PASTILLAS_TRAMO: PastillaItem[] = FILTROS.map((f, i) => ({
    id: f,
    texto: TEXTO_FILTRO[f],
    href: `#muestra-p1-${f}`,
    cantidad: [13, 9, 4, 2, 3, 1, 3][i] ?? 0,
    ...(TRAMO_FILTRO[f] === undefined ? {} : { tramo: TRAMO_FILTRO[f] }),
  }));
  const PASTILLAS_CLIENTE: PastillaItem[] = [
    { id: "todos", texto: "Todos", href: "#muestra-p2-todos", cantidad: 13 },
    { id: "con-mora", texto: "Con mora", href: "#muestra-p2-con-mora", cantidad: 8 },
    { id: "revisar", texto: "Para revisar", href: "#muestra-p2-revisar", cantidad: 1 },
  ];
  const PASTILLAS_RARAS: PastillaItem[] = [
    { id: "a", texto: "Comprobantes con diferencia de imputación pendiente de revisar", href: "#muestra-p3-a", cantidad: 1234567 },
    { id: "b", texto: "Sin conteo", href: "#muestra-p3-b" },
    { id: "c", texto: "Vacío", href: "#muestra-p3-c", cantidad: 0 },
  ];
  let p1 = $state("todos");
  let p2 = $state("con-mora");
  let p3 = $state("a");
  const elegirEnElLugar = (poner: (id: string) => void) => (id: string, e: MouseEvent) => {
    e.preventDefault();
    poner(id);
  };

  // ---------- Buscador ----------
  let b1 = $state("");
  let b2 = $state("algarrobos");
  let b3 = $state("");
  const LARGO = "Transportes y Servicios de la Cordillera y el Valle Demo Sociedad de Responsabilidad Limitada";

  // ---------- Solapas ----------
  const SOLAPAS: Solapa[] = [
    { id: "saldo", texto: "Comprobantes con saldo", cantidad: 5, cantidadDicha: "5 comprobantes" },
    { id: "recibos", texto: "Recibos", cantidad: 2, cantidadDicha: "2 recibos" },
    { id: "cuenta", texto: "Cuenta corriente", cantidad: 4 },
  ];
  let s1 = $state("saldo");
  let s2 = $state("recibos");
  let s3 = $state("a");
  const SOLAPAS_LARGAS: Solapa[] = [
    { id: "a", texto: "Comprobantes con diferencia de imputación", cantidad: 12 },
    { id: "b", texto: "Recibos", cantidad: 1234 },
    { id: "c", texto: "Cuenta corriente al 31/10/2026", cantidad: 0 },
    { id: "d", texto: "Notas de crédito" },
  ];
</script>

{#snippet celdaComp(f: Comp, c: ColumnaDeTabla<Comp>)}
  {#if c.id === "comprobante"}
    <a class="codigo" href="#muestra-comprobante-{f.id}">{f.numero}</a>
  {:else if c.id === "cliente"}
    <a href="#muestra-cliente-{f.cliente}">{f.cliente}</a>
  {:else if c.id === "emision"}
    {f.emision}
  {:else if c.id === "vencimiento"}
    Vence {f.vence}
  {:else if c.id === "saldo"}
    {imp(f.saldo)}
  {:else if c.id === "atraso"}
    {f.atraso >= 1 ? dias(f.atraso) : "—"}
  {:else if c.id === "tramo"}
    <Etiqueta tono={TONO_TRAMO[tramoDe(f.atraso)] ?? "neutro"} muestra={tramoDe(f.atraso)}>{ROTULO_TRAMO[tramoDe(f.atraso)]}</Etiqueta>
  {/if}
{/snippet}

{#snippet celdaCli(f: Cli, c: ColumnaDeTabla<Cli>)}
  {#if c.id === "cliente"}
    <a href="#muestra-cliente-{f.id}">{f.nombre}</a><span class="sec">{f.detalle}</span>
  {:else if c.id === "saldo"}
    {imp(f.saldo)}
  {:else if c.id === "mora"}
    {imp(f.mora)}
  {:else if c.id === "antiguedad"}
    {#if f.saldo > 0}<ReglaTramos variante="minima" tramos={tramosConUnoEnCero} ariaLabel={resumenDeRegla(tramosConUnoEnCero)} textoVacio="" />{/if}
  {:else if c.id === "tramo"}
    {#if f.tramo === null}<span class="suave">Sin saldo</span>{:else}<Etiqueta tono={TONO_TRAMO[f.tramo] ?? "neutro"} muestra={f.tramo}>{ROTULO_TRAMO[f.tramo]}</Etiqueta>{/if}
    {#if f.estado === "revisar"}
      <Etiqueta tono="revisar" icono="alerta">Revisar imputación</Etiqueta>
    {:else if f.estado === "favor"}
      <Etiqueta tono="pendiente" icono="flecha-izq">Saldo a favor</Etiqueta>
    {/if}
  {/if}
{/snippet}

{#snippet celdaMov(f: Mov, c: ColumnaDeTabla<Mov>)}
  {#if c.id === "fecha"}
    {f.fecha}
  {:else if c.id === "movimiento"}
    <a class="codigo" href="#muestra-mov-{f.id}">{f.numero}</a> <span class="suave">{f.nota}</span>
  {:else if c.id === "debe"}
    {#if f.debe > 0}{imp(f.debe)}{/if}
  {:else if c.id === "haber"}
    {#if f.haber > 0}{imp(f.haber)}{/if}
  {:else if c.id === "saldo"}
    {#if f.saldo !== null}{imp(f.saldo)}{/if}
  {/if}
{/snippet}

<section class="grupo" aria-labelledby="piezas-b">
  <h2 id="piezas-b">Piezas B: tablas, filtros y búsqueda</h2>
  <p class="nota">
    Tabla, Pastillas, Buscador y Solapas. La tabla elige su disposición por el ancho de SU contenedor: cada ejemplo está en una caja de un ancho fijo
    (hasta donde la pantalla lo permita). Los datos son de prueba.
  </p>

  <!-- ====================== Lista completa ====================== -->
  <h3 class="rotulo">Una lista completa (pastillas + buscador + tabla, todo en el lugar)</h3>
  <p class="nota">
    Probá: tabulá hasta una pastilla y pulsá Enter, o escribí en el buscador. El foco tiene que quedarse donde está. Escribí «zzz» para ver el vacío.
  </p>
  <Panel titulo="Comprobantes con saldo" icono="comprobantes" meta="al 31/10/2026" estado={estadoLista} relleno="ninguno">
    {#snippet herramientas()}
      <Pastillas
        etiqueta="Filtrar por tramo"
        items={itemsLista}
        actual={filtro}
        prefijoDeFoco="f-cmp"
        alElegir={elegirEnElLugar((id) => (filtro = id as Filtro))}
      />
      <Buscador
        id="busca-cmp"
        etiqueta="Buscar por cliente o número de comprobante"
        marcador="Cliente o número"
        valor={busqueda}
        etiquetaDeBorrar="Borrar la búsqueda"
        alEscribir={(v) => (busqueda = v)}
      />
    {/snippet}
    <Tabla
      titulo="Comprobantes con saldo"
      columnas={COLUMNAS_COMP}
      filas={visibles}
      clave={(f) => f.id}
      celda={celdaComp}
      total={totalComp(visibles)}
      elegida={volvio}
      textoDeElegida="(abierto recién)"
    >
      {#snippet vacia()}
        <div class="vacio">
          <p>Ningún comprobante coincide con la búsqueda.</p>
          <p class="nota">Pruebe con otra parte del nombre del cliente o con el número del comprobante (por ejemplo, 562).</p>
          <Boton variante="secundario" onclick={() => (busqueda = "")}>Borrar la búsqueda</Boton>
        </div>
      {/snippet}
    </Tabla>
  </Panel>
  <p class="fila">
    <Boton variante="texto" onclick={() => (volvio = volvio === null ? "593" : null)}>{volvio === null ? "Marcar la fila a la que se vuelve" : "Quitar la marca de la fila"}</Boton>
  </p>

  <!-- ====================== Tabla: tres disposiciones ====================== -->
  <h3 class="rotulo">Tabla: tabla completa (contenedor de 70 rem o más)</h3>
  <div class="ancho ancho-completo">
    <Panel titulo="Comprobantes con saldo" meta="{COMPROBANTES.length} comprobantes" relleno="ninguno">
      <Tabla titulo="Comprobantes con saldo" columnas={COLUMNAS_COMP} filas={COMPROBANTES} clave={(f) => f.id} celda={celdaComp} total={totalComp(COMPROBANTES)} elegida="593" textoDeElegida="(abierto recién)" />
    </Panel>
  </div>

  <h3 class="rotulo">Tabla: sin las columnas opcionales, con los días junto al tramo (contenedor de 45 rem)</h3>
  <div class="ancho ancho-medio">
    <Panel titulo="Comprobantes con saldo" meta="{COMPROBANTES.length} comprobantes" relleno="ninguno">
      <Tabla titulo="Comprobantes con saldo" columnas={COLUMNAS_COMP} filas={COMPROBANTES} clave={(f) => f.id} celda={celdaComp} total={totalComp(COMPROBANTES)} />
    </Panel>
  </div>

  <h3 class="rotulo">Tabla: tarjetas (contenedor de 24 rem, como un celular)</h3>
  <div class="ancho ancho-tarjeta">
    <Panel titulo="Comprobantes con saldo" meta="{COMPROBANTES.length} comprobantes" relleno="ninguno">
      <Tabla titulo="Comprobantes con saldo" columnas={COLUMNAS_COMP} filas={COMPROBANTES} clave={(f) => f.id} celda={celdaComp} total={totalComp(COMPROBANTES)} elegida="593" textoDeElegida="(abierto recién)" />
    </Panel>
  </div>

  <h3 class="rotulo">Tabla: clientes (dos totales, nombre larguísimo, sin saldo, para revisar, regla mínima)</h3>
  <div class="ancho ancho-completo">
    <Panel titulo="Cartera por cliente" meta="del saldo más grande al más chico" relleno="ninguno">
      <Tabla titulo="Cartera por cliente" columnas={COLUMNAS_CLI} filas={CLIENTES} clave={(f) => f.id} celda={celdaCli} total={TOTAL_CLI} elegida="C02" textoDeElegida="(abierto recién)" />
    </Panel>
  </div>
  <div class="ancho ancho-tarjeta">
    <Panel titulo="Cartera por cliente" relleno="ninguno">
      <Tabla titulo="Cartera por cliente" columnas={COLUMNAS_CLI} filas={CLIENTES} clave={(f) => f.id} celda={celdaCli} total={TOTAL_CLI} />
    </Panel>
  </div>

  <h3 class="rotulo">Tabla: cuenta corriente (saldo final enfocable, importes vacíos, y los movimientos posteriores aparte)</h3>
  <div class="ancho ancho-completo">
    <Panel titulo="Cuenta corriente" relleno="ninguno">
      <Tabla titulo="Cuenta corriente de Minera Ejemplo S.A." columnas={COLUMNAS_MOV(true)} filas={MOVIMIENTOS} clave={(f) => f.id} celda={celdaMov} total={TOTAL_CUENTA} />
      <Tabla titulo="Movimientos después de la fecha de corte" columnas={COLUMNAS_MOV(false)} filas={POSTERIORES} clave={(f) => f.id} celda={celdaMov} variante="posteriores">
        {#snippet encabezado()}
          <Etiqueta tono="neutro" icono="reloj">Después de la fecha de corte</Etiqueta> <span class="suave">(no cuentan para el saldo al 31/10/2026)</span>
        {/snippet}
      </Tabla>
    </Panel>
  </div>
  <p class="fila"><a class="enlace-prueba" href="#muestra-saldo-final">Ir al saldo al 31/10/2026</a></p>
  <div class="ancho ancho-tarjeta">
    <Panel titulo="Cuenta corriente" relleno="ninguno">
      <Tabla titulo="Cuenta corriente de Minera Ejemplo S.A." columnas={COLUMNAS_MOV(true)} filas={MOVIMIENTOS} clave={(f) => f.id} celda={celdaMov} total={{ ...TOTAL_CUENTA, id: "muestra-saldo-final-2" }} />
      <Tabla titulo="Movimientos después de la fecha de corte" columnas={COLUMNAS_MOV(false)} filas={POSTERIORES} clave={(f) => f.id} celda={celdaMov} variante="posteriores">
        {#snippet encabezado()}
          <Etiqueta tono="neutro" icono="reloj">Después de la fecha de corte</Etiqueta> <span class="suave">(no cuentan para el saldo)</span>
        {/snippet}
      </Tabla>
    </Panel>
  </div>

  <h3 class="rotulo">Tabla: una sola fila, sin total, vacía (con y sin pieza de vacío)</h3>
  <div class="ancho ancho-medio">
    <Panel titulo="Una sola fila, sin total" relleno="ninguno">
      <Tabla titulo="Un comprobante" columnas={COLUMNAS_COMP} filas={COMPROBANTES.slice(0, 1)} clave={(f) => f.id} celda={celdaComp} />
    </Panel>
    <Panel titulo="Sin filas y con pieza de vacío" relleno="ninguno">
      <Tabla titulo="Sin comprobantes" columnas={COLUMNAS_COMP} filas={[]} clave={(f) => f.id} celda={celdaComp}>
        {#snippet vacia()}
          <div class="vacio"><p>No hay comprobantes con saldo al 31/10/2026.</p></div>
        {/snippet}
      </Tabla>
    </Panel>
    <Panel titulo="Sin filas y sin pieza de vacío (solo encabezados y total)" relleno="ninguno">
      <Tabla titulo="Sin comprobantes" columnas={COLUMNAS_COMP} filas={[]} clave={(f) => f.id} celda={celdaComp} total={totalComp([])} />
    </Panel>
  </div>

  <!-- ====================== Pastillas ====================== -->
  <h3 class="rotulo">Pastillas</h3>
  <div class="ancho ancho-completo">
    <Panel titulo="Siete pastillas con muestra de tramo y conteo (se eligen en el lugar)" relleno="ninguno">
      {#snippet herramientas()}
        <Pastillas etiqueta="Filtrar por tramo (ejemplo 1)" items={PASTILLAS_TRAMO} actual={p1} prefijoDeFoco="f-p1" alElegir={elegirEnElLugar((id) => (p1 = id))} />
      {/snippet}
      <p class="interior-p">Elegida: <strong>{p1}</strong></p>
    </Panel>
  </div>
  <div class="ancho ancho-tarjeta">
    <Panel titulo="Las mismas, en 24 rem (se desplazan; desvanecido a la derecha)" relleno="ninguno">
      {#snippet herramientas()}
        <Pastillas etiqueta="Filtrar por tramo (ejemplo 1, angosto)" items={PASTILLAS_TRAMO} actual={p1} prefijoDeFoco="f-p1b" alElegir={elegirEnElLugar((id) => (p1 = id))} />
      {/snippet}
      <p class="interior-p">Elegida: <strong>{p1}</strong></p>
    </Panel>
  </div>
  <div class="ancho ancho-medio">
    <Panel titulo="Tres pastillas, sin muestra" relleno="ninguno">
      {#snippet herramientas()}
        <Pastillas etiqueta="Filtrar clientes" items={PASTILLAS_CLIENTE} actual={p2} prefijoDeFoco="f-p2" alElegir={elegirEnElLugar((id) => (p2 = id))} />
      {/snippet}
      <p class="interior-p">Elegida: <strong>{p2}</strong></p>
    </Panel>
    <Panel titulo="Texto largo, conteo enorme, sin conteo y en cero" relleno="ninguno">
      {#snippet herramientas()}
        <Pastillas etiqueta="Filtros raros" items={PASTILLAS_RARAS} actual={p3} prefijoDeFoco="f-p3" alElegir={elegirEnElLugar((id) => (p3 = id))} />
      {/snippet}
      <p class="interior-p">Elegida: <strong>{p3}</strong></p>
    </Panel>
  </div>

  <!-- ====================== Buscador ====================== -->
  <h3 class="rotulo">Buscador</h3>
  <div class="ancho ancho-medio">
    <Panel titulo="Vacío, con ayuda dentro; el botón de borrar aparece al escribir" relleno="ninguno">
      {#snippet herramientas()}
        <Buscador id="busca-1" etiqueta="Buscar cliente por nombre o CUIT" marcador="Nombre o CUIT" valor={b1} etiquetaDeBorrar="Borrar la búsqueda" alEscribir={(v) => (b1 = v)} />
      {/snippet}
      <p class="interior-p">Escrito: «{b1}»</p>
    </Panel>
    <Panel titulo="Con un valor que viene de la dirección" relleno="ninguno">
      {#snippet herramientas()}
        <Buscador id="busca-2" etiqueta="Buscar por cliente o número" marcador="Cliente o número" valor={b2} etiquetaDeBorrar="Borrar la búsqueda" alEscribir={(v) => (b2 = v)} />
      {/snippet}
      <p class="interior-p">Escrito: «{b2}»</p>
    </Panel>
    <Panel titulo="Sin botón de borrar, con un valor larguísimo (tope de 60)" relleno="ninguno">
      {#snippet herramientas()}
        <Buscador id="busca-3" etiqueta="Buscar sin botón de borrar" marcador="Buscar" valor={b3 === "" ? LARGO.slice(0, 60) : b3} alEscribir={(v) => (b3 = v)} />
      {/snippet}
      <p class="interior-p">Escrito: «{b3 === "" ? LARGO.slice(0, 60) : b3}»</p>
    </Panel>
  </div>
  <div class="ancho ancho-tarjeta">
    <Panel titulo="En 24 rem" relleno="ninguno">
      {#snippet herramientas()}
        <Buscador id="busca-4" etiqueta="Buscar (angosto)" marcador="Cliente o número" valor={b1} etiquetaDeBorrar="Borrar la búsqueda" alEscribir={(v) => (b1 = v)} />
      {/snippet}
      <p class="interior-p">Comparte el texto con el primero.</p>
    </Panel>
  </div>

  <!-- ====================== Solapas ====================== -->
  <h3 class="rotulo">Solapas (flechas, Inicio y Fin; la hoja también recibe el foco)</h3>
  <div class="ancho ancho-completo">
    <Solapas etiqueta="Detalle del cliente" solapas={SOLAPAS} actual={s1} alElegir={(id) => (s1 = id)} idPanel="hoja-1" prefijoDeId="sol-m1">
      {#if s1 === "saldo"}
        <Tabla titulo="Comprobantes con saldo del cliente" columnas={COLUMNAS_COMP} filas={COMPROBANTES.slice(0, 5)} clave={(f) => f.id} celda={celdaComp} total={totalComp(COMPROBANTES.slice(0, 5))} />
      {:else if s1 === "recibos"}
        <div class="vacio"><p>Recibos del cliente (de prueba).</p></div>
      {:else}
        <Tabla titulo="Cuenta corriente" columnas={COLUMNAS_MOV(true)} filas={MOVIMIENTOS} clave={(f) => f.id} celda={celdaMov} total={{ ...TOTAL_CUENTA, id: "muestra-saldo-final-3" }} />
      {/if}
    </Solapas>
  </div>
  <div class="ancho ancho-tarjeta">
    <Solapas etiqueta="Detalle del cliente (angosto)" solapas={SOLAPAS} actual={s2} alElegir={(id) => (s2 = id)} idPanel="hoja-2" prefijoDeId="sol-m2">
      <div class="vacio"><p>Solapa elegida: <strong>{s2}</strong>. En 24 rem la fila se desplaza y se ve un desvanecido a la derecha.</p></div>
    </Solapas>
  </div>
  <div class="ancho ancho-tarjeta">
    <Solapas etiqueta="Solapas con textos largos, conteo grande y sin conteo" solapas={SOLAPAS_LARGAS} actual={s3} alElegir={(id) => (s3 = id)} idPanel="hoja-3" prefijoDeId="sol-m3" relleno="normal">
      <p>Hoja con relleno. Elegida: <strong>{s3}</strong>.</p>
    </Solapas>
  </div>
</section>

<style>
  .grupo {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .ancho {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    width: 100%;
  }
  .ancho-completo {
    max-width: 72rem;
  }
  .ancho-medio {
    max-width: 45rem;
  }
  .ancho-tarjeta {
    max-width: 24rem;
  }
  .fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-2) var(--e-3);
  }
  .interior-p {
    padding: var(--e-3) var(--e-4);
  }
  .vacio {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--e-2);
    padding: var(--e-5) var(--e-4);
  }
  .suave {
    color: var(--c-texto-3);
  }
  .enlace-prueba {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-tactil);
  }
</style>
