// Enrutador por hash (docs/diseno-ui.md, sección 2; docs/diseno.md, S5 y 4.3). Puro: de un hash y los datos sale una dirección resuelta (ruta, corte y
// avisos). El hash es entrada externa y hostil: nada de lo que se escribe vuelve a salir como texto. Cada test lleva la regla en el nombre.
import { describe, expect, it } from "vitest";
import { TODAS_LAS_CLAVES } from "../src/lib/dominio/claves.ts";
import { medida } from "../src/lib/dominio/medidas.ts";
import { LARGO_MAXIMO_HASH, aHash, esAncla, idDeVista, normalizarBusqueda, resolverDireccion } from "../src/lib/estado/enrutador.ts";
import type { Ruta, RutaNavegable } from "../src/lib/estado/enrutador.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

const T12 = fixtureT12();
const datos = T12.datos; // desde 2025-01-01, hasta 2026-10-31; 13 clientes; 4 deudores al 31/10 (sin `mora-otros`)
const idFactura = T12.id("d30");
const AVISO_CORTE = "La fecha de corte de la dirección no es válida. Se muestra el 31/10/2026.";

const resumen: Ruta = { tipo: "resumen" };

describe("rutas válidas: las ocho secciones y el detalle (cliente, comprobante, desglose)", () => {
  it.each([
    ["#/", { tipo: "resumen" }],
    ["#", { tipo: "resumen" }],
    ["", { tipo: "resumen" }],
    ["#/?corte=2026-10-31", { tipo: "resumen" }],
    ["#/resumen", { tipo: "resumen" }],
    ["#/resumen/", { tipo: "resumen" }],
    ["#/resumen?corte=2026-09-30", { tipo: "resumen" }],
    ["#/comprobantes", { tipo: "comprobantes" }],
    ["#/comprobantes?corte=2026-10-31", { tipo: "comprobantes" }],
    ["#/clientes", { tipo: "clientes" }],
    ["#/clientes?corte=2026-10-31", { tipo: "clientes" }],
    ["#/meses", { tipo: "meses" }],
    ["#/meses?corte=2026-10-31", { tipo: "meses" }],
    ["#/como-se-calcula", { tipo: "como-se-calcula" }],
    ["#/como-se-calcula?corte=2026-10-31", { tipo: "como-se-calcula" }],
    ["#/cliente/C05", { tipo: "cliente", clienteId: "C05" }],
    ["#/cliente/C05?corte=2026-09-30", { tipo: "cliente", clienteId: "C05" }],
    ["#/cliente/C05/", { tipo: "cliente", clienteId: "C05" }],
    [`#/comprobante/${idFactura}?corte=2026-10-31`, { tipo: "comprobante", comprobanteId: idFactura }],
    ["#/desglose/mora?corte=2026-10-31", { tipo: "desglose", clave: "mora" }],
    ["#/desglose/mora?corte=2026-10-31&cliente=C05", { tipo: "desglose", clave: "mora", clienteId: "C05" }],
    ["#/desglose/saldo?corte=2026-10-31&agrupar=no", { tipo: "desglose", clave: "saldo", agrupar: "no" }],
    ["#/desglose/facturacion-mes?corte=2026-10-31&mes=2026-05", { tipo: "desglose", clave: "facturacion-mes", mes: "2026-05" }],
    ["#/desglose/cobranza-mes?corte=2026-10-31&cliente=C05&mes=2025-01&agrupar=no", { tipo: "desglose", clave: "cobranza-mes", clienteId: "C05", mes: "2025-01", agrupar: "no" }],
  ] as const)("%s", (hash, ruta) => {
    const d = resolverDireccion(hash, datos);
    expect(d.ruta).toEqual(ruta);
    expect(d.avisos).toEqual([]);
  });

  it("el orden de los parámetros no importa", () => {
    const a = resolverDireccion("#/desglose/cobranza-mes?mes=2026-05&agrupar=no&cliente=C05&corte=2026-09-30", datos);
    const b = resolverDireccion("#/desglose/cobranza-mes?corte=2026-09-30&cliente=C05&mes=2026-05&agrupar=no", datos);
    expect(a).toEqual(b);
    expect(a.corte).toBe("2026-09-30");
  });

  it("todas las claves del catálogo son rutas de desglose", () => {
    for (const clave of ["facturacion-mes", "facturado-con-iva-mes", "iva-mes", "cobranza-mes", "retenciones-mes", "saldo", "mora", "tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90", "pagos-a-cuenta", "saldos-a-favor", "saldo-neto"]) {
      expect(resolverDireccion(`#/desglose/${clave}`, datos).ruta, clave).toMatchObject({ tipo: "desglose", clave });
    }
  });
});

describe("S5: las ocho direcciones de la tabla de docs/diseno.md", () => {
  it.each([
    ["?corte=2026-09-30", "2026-09-30", []],
    ["?corte=2026-02-30", "2026-10-31", [AVISO_CORTE]],
    ["?corte=2030-01-01", "2026-10-31", [AVISO_CORTE]],
    ["?corte=hola", "2026-10-31", [AVISO_CORTE]],
    ["?corte=2026-10-15", "2026-10-31", [AVISO_CORTE]],
    ["?corte=2024-12-31", "2026-10-31", [AVISO_CORTE]],
    ["?corte=2026-09-30&corte=2026-08-31", "2026-10-31", [AVISO_CORTE]],
    ["", "2026-10-31", []],
  ] as const)("S5: %s → corte %s, avisos %j", (consulta, corte, textos) => {
    for (const camino of ["#/", "#/resumen", "#/comprobantes", "#/clientes", "#/meses", "#/como-se-calcula", "#/cliente/C05", `#/comprobante/${idFactura}`, "#/desglose/mora"]) {
      const d = resolverDireccion(`${camino}${consulta}`, datos);
      expect(d.corte, camino).toBe(corte);
      expect(d.avisos.map((a) => a.texto), camino).toEqual(textos);
      expect(d.avisos.every((a) => a.clase === "corte")).toBe(true);
    }
  });

  it("S5: con el corte inválido la ruta se conserva (la vista se muestra con el corte por defecto)", () => {
    expect(resolverDireccion("#/cliente/C05?corte=hola", datos)).toEqual({ ruta: { tipo: "cliente", clienteId: "C05" }, corte: "2026-10-31", avisos: [{ clase: "corte", texto: AVISO_CORTE }] });
  });

  it("S5: una ruta desconocida con un corte válido igual lleva ese corte (el selector no salta)", () => {
    expect(resolverDireccion("#/nada?corte=2026-09-30", datos)).toEqual({ ruta: { tipo: "desconocida" }, corte: "2026-09-30", avisos: [] });
  });

  it("S5: el corte es el mismo que da `resolverCorte` de los datos que se le pasan (no una fecha fija)", () => {
    const otros = armarDatos({ desde: "2024-01-01", hasta: "2025-06-30" }).datos;
    expect(resolverDireccion("#/", otros).corte).toBe("2025-06-30");
    expect(resolverDireccion("#/?corte=2026-10-31", otros).avisos[0]?.texto).toBe("La fecha de corte de la dirección no es válida. Se muestra el 30/06/2025.");
  });
});

describe("parámetros: cliente, mes y agrupar", () => {
  it("cliente: en el desglose filtra; en las demás rutas no aplica y se descarta sin aviso", () => {
    expect(resolverDireccion("#/cliente/C05?cliente=C09", datos)).toMatchObject({ ruta: { tipo: "cliente", clienteId: "C05" }, avisos: [] });
    expect(resolverDireccion("#/?cliente=C09&mes=2026-05&agrupar=no", datos)).toMatchObject({ ruta: { tipo: "resumen" }, avisos: [] });
  });

  it("cliente: inexistente, vacío o repetido en un desglose → error de vista (como un cliente inexistente), sin repetir lo escrito", () => {
    for (const consulta of ["cliente=C99", "cliente=", "cliente=C05&cliente=C06", "cliente=c05", "cliente=C05%20"]) {
      expect(resolverDireccion(`#/desglose/mora?corte=2026-10-31&${consulta}`, datos).ruta, consulta).toEqual({ tipo: "inexistente", vista: "desglose" });
    }
  });

  it("mes: válido entre el mes de `desde` y el del corte, ambos inclusive", () => {
    expect(resolverDireccion("#/desglose/iva-mes?corte=2026-10-31&mes=2025-01", datos).ruta).toMatchObject({ mes: "2025-01" });
    expect(resolverDireccion("#/desglose/iva-mes?corte=2026-10-31&mes=2026-10", datos).ruta).toMatchObject({ mes: "2026-10" });
    expect(resolverDireccion("#/desglose/iva-mes?corte=2026-05-31&mes=2026-05", datos).avisos).toEqual([]);
  });

  it.each([
    ["mes=2024-12", "antes de `desde`"],
    ["mes=2026-11", "después del mes del corte"],
    ["mes=2026-13", "mes 13"],
    ["mes=2026-00", "mes 0"],
    ["mes=hola", "texto"],
    ["mes=", "vacío"],
    ["mes=2026-5", "sin cero"],
    ["mes=2026-05-15", "con día"],
    ["mes=2026-05&mes=2026-06", "repetido"],
  ])("mes: %s (%s) en una medida del mes → se muestra el mes del corte y aparece el aviso del mes", (consulta) => {
    const d = resolverDireccion(`#/desglose/facturacion-mes?corte=2026-10-31&${consulta}`, datos);
    expect(d.ruta).toEqual({ tipo: "desglose", clave: "facturacion-mes" });
    expect(d.avisos).toEqual([{ clase: "mes", texto: "El mes de la dirección no es válido. Se muestra octubre de 2026." }]);
  });

  it("mes: el aviso nombra el mes del corte que se muestra (no el escrito)", () => {
    const d = resolverDireccion("#/desglose/iva-mes?corte=2026-09-30&mes=2026-10", datos);
    expect(d.avisos).toEqual([{ clase: "mes", texto: "El mes de la dirección no es válido. Se muestra septiembre de 2026." }]);
  });

  it("mes: en una medida que no es del mes, valga o no, se descarta sin aviso (4.3)", () => {
    for (const mes of ["2026-05", "hola", "2030-01", ""]) {
      const d = resolverDireccion(`#/desglose/mora?corte=2026-10-31&mes=${mes}`, datos);
      expect(d.ruta, mes).toEqual({ tipo: "desglose", clave: "mora" });
      expect(d.avisos, mes).toEqual([]);
    }
  });

  it("mes: con el corte inválido se valida contra el corte por defecto, y los dos avisos salen (corte primero)", () => {
    const d = resolverDireccion("#/desglose/iva-mes?corte=hola&mes=2030-01", datos);
    expect(d.corte).toBe("2026-10-31");
    expect(d.avisos.map((a) => a.clase)).toEqual(["corte", "mes"]);
    expect(resolverDireccion("#/desglose/iva-mes?corte=hola&mes=2026-10", datos).avisos.map((a) => a.clase)).toEqual(["corte"]);
  });

  it("agrupar: solo `no` vale; cualquier otro valor, vacío o repetido se ignora, sin aviso", () => {
    expect(resolverDireccion("#/desglose/mora?agrupar=no", datos).ruta).toEqual({ tipo: "desglose", clave: "mora", agrupar: "no" });
    for (const valor of ["agrupar=si", "agrupar=", "agrupar=NO", "agrupar=no&agrupar=no", "agrupar=no%20", "agrupar=true"]) {
      const d = resolverDireccion(`#/desglose/mora?${valor}`, datos);
      expect(d.ruta, valor).toEqual({ tipo: "desglose", clave: "mora" });
      expect(d.avisos, valor).toEqual([]);
    }
  });

  it("parámetros desconocidos se ignoran sin aviso", () => {
    const d = resolverDireccion("#/desglose/mora?corte=2026-09-30&zzz=1&x[]=2&=3&&&", datos);
    expect(d).toEqual({ ruta: { tipo: "desglose", clave: "mora" }, corte: "2026-09-30", avisos: [] });
  });

  it("`?` sin parámetros equivale a ninguno", () => {
    expect(resolverDireccion("#/?", datos)).toEqual({ ruta: resumen, corte: "2026-10-31", avisos: [] });
  });
});

describe("comprobantes y clientes: `tramo`, `filtro` y `q`", () => {
  it.each([
    ["vencidos", "vencidos"],
    ["no-vencido", "no-vencido"],
    ["1-30", "1-30"],
    ["31-60", "31-60"],
    ["61-90", "61-90"],
    ["mas-90", "mas-90"],
  ] as const)("tramo=%s es el tramo de la lista", (valor, tramo) => {
    expect(resolverDireccion(`#/comprobantes?corte=2026-10-31&tramo=${valor}`, datos)).toEqual({ ruta: { tipo: "comprobantes", tramo }, corte: "2026-10-31", avisos: [] });
  });

  it.each([
    ["con-mora", "con-mora"],
    ["revisar", "revisar"],
  ] as const)("filtro=%s es el filtro de clientes", (valor, filtro) => {
    expect(resolverDireccion(`#/clientes?filtro=${valor}`, datos).ruta).toEqual({ tipo: "clientes", filtro });
  });

  it("`todos` es el valor por defecto y no se guarda: la ruta de «todos» es la misma que sin parámetro", () => {
    expect(resolverDireccion("#/comprobantes?tramo=todos", datos).ruta).toEqual({ tipo: "comprobantes" });
    expect(resolverDireccion("#/clientes?filtro=todos", datos).ruta).toEqual({ tipo: "clientes" });
  });

  it("un valor desconocido, vacío, repetido o con otra mayúscula se trata como `todos`, sin aviso (igual que `agrupar`)", () => {
    for (const valor of ["tramo=cualquiera", "tramo=", "tramo=vencidos&tramo=1-30", "tramo=VENCIDOS", "tramo=vencidos%20", "tramo=__proto__", "tramo=constructor", "tramo=%E0%A4%A", "tramo=1–30"]) {
      const d = resolverDireccion(`#/comprobantes?corte=2026-10-31&${valor}`, datos);
      expect(d.ruta, valor).toEqual({ tipo: "comprobantes" });
      expect(d.avisos, valor).toEqual([]);
    }
    for (const valor of ["filtro=cualquiera", "filtro=", "filtro=revisar&filtro=con-mora", "filtro=REVISAR", "filtro=todos&filtro=todos", "filtro=toString"]) {
      const d = resolverDireccion(`#/clientes?corte=2026-10-31&${valor}`, datos);
      expect(d.ruta, valor).toEqual({ tipo: "clientes" });
      expect(d.avisos, valor).toEqual([]);
    }
  });

  it("cada parámetro vale solo en su ruta: en las demás se descarta sin aviso", () => {
    expect(resolverDireccion("#/clientes?tramo=vencidos", datos).ruta).toEqual({ tipo: "clientes" });
    expect(resolverDireccion("#/comprobantes?filtro=revisar", datos).ruta).toEqual({ tipo: "comprobantes" });
    for (const camino of ["#/resumen", "#/meses", "#/como-se-calcula", "#/cliente/C05", "#/desglose/mora"]) {
      const d = resolverDireccion(`${camino}?tramo=vencidos&filtro=revisar&q=algo`, datos);
      expect(d.ruta, camino).not.toHaveProperty("tramo");
      expect(d.ruta, camino).not.toHaveProperty("filtro");
      expect(d.ruta, camino).not.toHaveProperty("q");
      expect(d.avisos, camino).toEqual([]);
    }
  });

  it("`q`: la búsqueda se guarda tal cual (con espacios y mayúsculas); vacía, repetida o ausente es «sin búsqueda»", () => {
    expect(resolverDireccion("#/comprobantes?q=algarrobos", datos).ruta).toEqual({ tipo: "comprobantes", q: "algarrobos" });
    expect(resolverDireccion("#/clientes?q=Los%20Algarrobos%20", datos).ruta).toEqual({ tipo: "clientes", q: "Los Algarrobos " });
    expect(resolverDireccion("#/clientes?q=a+b", datos).ruta).toEqual({ tipo: "clientes", q: "a b" });
    for (const consulta of ["q=", "q=a&q=b", "", "Q=a"]) {
      expect(resolverDireccion(`#/comprobantes?${consulta}`, datos).ruta, consulta).toEqual({ tipo: "comprobantes" });
    }
  });

  it("`q` con tramo o filtro: se guardan los dos", () => {
    expect(resolverDireccion("#/comprobantes?corte=2026-09-30&tramo=31-60&q=0003", datos).ruta).toEqual({ tipo: "comprobantes", tramo: "31-60", q: "0003" });
    expect(resolverDireccion("#/clientes?corte=2026-09-30&filtro=con-mora&q=sol", datos).ruta).toEqual({ tipo: "clientes", filtro: "con-mora", q: "sol" });
  });

  it("`q` se recorta a 60 caracteres (no a 60 unidades de UTF-16: un emoji cortado por la mitad no queda roto)", () => {
    const largo = resolverDireccion(`#/clientes?q=${"a".repeat(80)}`, datos).ruta;
    expect(largo).toEqual({ tipo: "clientes", q: "a".repeat(60) });
    const conEmoji = resolverDireccion(`#/clientes?q=${"a".repeat(59)}${encodeURIComponent("😀😀")}`, datos).ruta;
    expect(conEmoji).toEqual({ tipo: "clientes", q: `${"a".repeat(59)}😀` });
    // El hash que arma la aplicación a partir de lo recortado se puede escribir (no hay surrogate suelto que haga lanzar a encodeURIComponent).
    expect(() => aHash(conEmoji as RutaNavegable, "2026-10-31")).not.toThrow();
  });

  it("60 letras con tilde (411 caracteres de hash) son una búsqueda legítima: se leen enteras y el hash no es «desconocido»", () => {
    const q = "ó".repeat(60);
    const hash = `#/comprobantes?corte=2026-10-31&tramo=no-vencido&q=${encodeURIComponent(q)}`;
    expect(hash).toHaveLength(411);
    expect(resolverDireccion(hash, datos)).toEqual({ ruta: { tipo: "comprobantes", tramo: "no-vencido", q }, corte: "2026-10-31", avisos: [] });
  });

  it("`q` acotada también por lo que ocupa codificada (360 caracteres): los ideogramas se recortan a 40 y el hash que escribe la aplicación cabe siempre", () => {
    const q = "漢".repeat(55); // 13 + 495 = 508 caracteres de hash: todavía entra
    const ruta = resolverDireccion(`#/clientes?q=${encodeURIComponent(q)}`, datos).ruta;
    expect(ruta).toEqual({ tipo: "clientes", q: "漢".repeat(40) });
    const emojis = "😀".repeat(60);
    const hash = aHash({ tipo: "comprobantes", tramo: "no-vencido", q: emojis }, "2026-10-31");
    expect(hash.length).toBeLessThanOrEqual(LARGO_MAXIMO_HASH);
    expect(resolverDireccion(hash, datos).ruta.tipo).toBe("comprobantes");
  });

  it("normalizarBusqueda: recorta por caracteres, reemplaza surrogates sueltos, no recorta espacios y acota lo codificado", () => {
    expect(normalizarBusqueda("")).toBe("");
    expect(normalizarBusqueda("  a  ")).toBe("  a  ");
    expect(normalizarBusqueda("a".repeat(61))).toBe("a".repeat(60));
    expect(normalizarBusqueda("ab\uD83D")).toBe("ab�");
    expect(normalizarBusqueda("\uDE00ab")).toBe("�ab");
    expect(normalizarBusqueda("😀")).toBe("😀");
    expect(encodeURIComponent(normalizarBusqueda("漢".repeat(60))).length).toBeLessThanOrEqual(360);
    expect(() => encodeURIComponent(normalizarBusqueda("x😀\uD83Dy"))).not.toThrow();
  });

  it("`q` es un dato de la ruta, nunca un texto de la dirección: con una entrada hostil no hay avisos ni cambia el corte", () => {
    for (const hostil of ["<script>alert(1)</script>", "javascript:alert(1)", "../../etc/passwd", "__proto__", "${7*7}", "{{7*7}}", "'; DROP TABLE clientes; --", "\u0000", "%00"]) {
      for (const camino of ["comprobantes", "clientes"]) {
        const d = resolverDireccion(`#/${camino}?corte=2026-09-30&q=${encodeURIComponent(hostil)}`, datos);
        expect(d.avisos, `${camino} ${hostil}`).toEqual([]);
        expect(d.corte).toBe("2026-09-30");
        expect(d.ruta.tipo).toBe(camino);
      }
    }
  });
});

describe("esAncla: un hash que no es una dirección de la aplicación", () => {
  it.each(["#principal", "#saldo-final", "#cc-saldo", "#cliente/C05", "cliente/C05", "#mora", "#?corte=2026-10-31"])("%s es un ancla", (hash) => {
    expect(esAncla(hash)).toBe(true);
  });

  it.each(["", "#", "#/", "#/resumen", "#/cliente/C05?corte=2026-09-30", "#/nada", "#//"])("%s no es un ancla (es una dirección, válida o no)", (hash) => {
    expect(esAncla(hash)).toBe(false);
  });

  it("el enrutador sigue resolviendo un ancla como ruta desconocida (la carga inicial no cambia); ignorarla es del estado", () => {
    expect(resolverDireccion("#principal", datos).ruta.tipo).toBe("desconocida");
    expect(resolverDireccion("#saldo-final", datos).avisos).toEqual([]);
  });
});

describe("rutas que no existen: desconocida o inexistente, nunca una página en blanco ni un eco", () => {
  it.each([
    "#/nada",
    "#/resumen/otra",
    "#/comprobantes/otra",
    "#/clientes/C05",
    "#/meses/2026-05",
    "#/como-se-calcula/saldo",
    "#/Resumen",
    "#/COMPROBANTES",
    "#/cliente",
    "#/cliente/",
    "#/cliente/C05/C06",
    "#/desglose",
    "#/desglose/mora/otra",
    "#/comprobante",
    "#//",
    "#//cliente/C05",
    "#cliente/C05",
    "cliente/C05",
    "#/CLIENTE/C05",
  ])("%s → desconocida", (hash) => {
    expect(resolverDireccion(hash, datos).ruta.tipo).toBe("desconocida");
  });

  it("cliente, comprobante y clave bien escritos pero que no existen → inexistente, con la vista", () => {
    expect(resolverDireccion("#/cliente/C99", datos).ruta).toEqual({ tipo: "inexistente", vista: "cliente" });
    expect(resolverDireccion("#/comprobante/1-0003-99999999", datos).ruta).toEqual({ tipo: "inexistente", vista: "comprobante" });
    expect(resolverDireccion("#/desglose/no-existe", datos).ruta).toEqual({ tipo: "inexistente", vista: "desglose" });
  });

  it("`mora-otros` existe solo con más de 5 deudores al corte (M4)", () => {
    expect(resolverDireccion("#/desglose/mora-otros?corte=2026-10-31", datos).ruta).toEqual({ tipo: "inexistente", vista: "desglose" });
    const seis = armarDatos({
      comprobantes: ["C01", "C02", "C03", "C04", "C05", "C06"].map((cliente) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(100_000) })),
    }).datos;
    expect(resolverDireccion("#/desglose/mora-otros?corte=2026-10-31", seis).ruta).toEqual({ tipo: "desglose", clave: "mora-otros" });
  });

  it("M4: `mora-otros` no admite `cliente=`; escrita a mano es el mismo desglose inexistente, sin importar si el cliente existe o está bien escrito", () => {
    const seis = armarDatos({
      comprobantes: ["C01", "C02", "C03", "C04", "C05", "C06"].map((cliente) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(100_000) })),
    }).datos;
    const inexistente = { tipo: "inexistente", vista: "desglose" };
    for (const consulta of ["cliente=C05", "cliente=C99", "cliente=", "cliente=C05&cliente=C06", "cliente=%3Cx%3E", "agrupar=no&cliente=C05"]) {
      const d = resolverDireccion(`#/desglose/mora-otros?corte=2026-10-31&${consulta}`, seis);
      expect(d.ruta, consulta).toEqual(inexistente);
      expect(d.corte).toBe("2026-10-31");
    }
    // Y sigue valiendo sin `cliente=`, con los demás parámetros.
    expect(resolverDireccion("#/desglose/mora-otros?corte=2026-10-31&agrupar=no", seis).ruta).toEqual({ tipo: "desglose", clave: "mora-otros", agrupar: "no" });
  });

  it("una dirección de desglose que el enrutador acepta nunca hace lanzar al dominio (`medida` con la clave y el cliente de la ruta)", () => {
    const seis = armarDatos({
      comprobantes: ["C01", "C02", "C03", "C04", "C05", "C06"].map((cliente) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(100_000) })),
    }).datos;
    for (const clave of TODAS_LAS_CLAVES) {
      for (const consulta of ["", "&cliente=C05"]) {
        const { ruta, corte } = resolverDireccion(`#/desglose/${clave}?corte=2026-10-31${consulta}`, seis);
        if (ruta.tipo !== "desglose") continue;
        const filtro = ruta.clienteId === undefined ? {} : { clienteId: ruta.clienteId };
        expect(() => medida(seis, corte, ruta.clave, filtro), `${clave}${consulta}`).not.toThrow();
      }
    }
  });

  it("un comprobante posterior al corte sigue siendo una ruta de comprobante: lo resuelve la vista (S1, diseno-ui 8.2)", () => {
    const f = armarDatos({ comprobantes: [{ clave: "F", cliente: "C01", emision: "2026-10-01", neto: pesos(1000) }] });
    expect(resolverDireccion(`#/comprobante/${f.id("F")}?corte=2026-09-30`, f.datos).ruta).toEqual({ tipo: "comprobante", comprobanteId: f.id("F") });
  });

  it("una ruta inexistente conserva el corte (y su aviso, si no era válido)", () => {
    expect(resolverDireccion("#/cliente/C99?corte=2026-09-30", datos)).toEqual({ ruta: { tipo: "inexistente", vista: "cliente" }, corte: "2026-09-30", avisos: [] });
    expect(resolverDireccion("#/cliente/C99?corte=hola", datos).avisos).toHaveLength(1);
  });
});

describe("entrada hostil: acotada, validada y nunca repetida en lo que se muestra", () => {
  const hostiles = [
    "<script>alert(1)</script>",
    "%3Cscript%3Ealert(1)%3C/script%3E",
    "javascript:alert(1)",
    "../../etc/passwd",
    "%2e%2e%2f%2e%2e%2f",
    "%00",
    "%0d%0aSet-Cookie:x=1",
    "%E0%A4%A",
    "%",
    "%%%",
    "__proto__",
    "constructor",
    "toString",
    "hasOwnProperty",
    "C05%2FC06",
    "C05%3Fcorte%3D2026-09-30",
    "'; DROP TABLE clientes; --",
    "${7*7}",
    "{{7*7}}",
    "‮\u0000﻿",
    "😀",
    "C0５",
  ];

  const contieneEco = (valor: unknown, hostil: string): boolean => {
    const texto = JSON.stringify(valor);
    const crudo = decodeURIComponentSeguro(hostil);
    return texto.includes(hostil) || (crudo.length > 1 && texto.includes(crudo));
  };

  it.each(hostiles)("como segmento de ruta (%s)", (hostil) => {
    for (const camino of ["cliente", "comprobante", "desglose", "zzz"]) {
      const d = resolverDireccion(`#/${camino}/${hostil}`, datos);
      expect(["desconocida", "inexistente"], camino).toContain(d.ruta.tipo);
      expect(contieneEco(d, hostil), `${camino}: ${JSON.stringify(d)}`).toBe(false);
    }
  });

  it.each(hostiles)("como valor de cada parámetro (%s)", (hostil) => {
    for (const nombre of ["corte", "cliente", "mes", "agrupar", "tramo", "filtro", "zzz"]) {
      const d = resolverDireccion(`#/desglose/facturacion-mes?${nombre}=${hostil}`, datos);
      expect(contieneEco(d, hostil), `${nombre}: ${JSON.stringify(d)}`).toBe(false);
      expect(d.corte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it.each(hostiles)("como nombre de parámetro (%s)", (hostil) => {
    const d = resolverDireccion(`#/?${hostil}=1&corte=2026-09-30`, datos);
    expect(d).toEqual({ ruta: resumen, corte: "2026-09-30", avisos: [] });
  });

  it("el largo máximo es 512; un hash de más es una ruta desconocida, con el corte por defecto y sin aviso", () => {
    expect(LARGO_MAXIMO_HASH).toBe(512);
    const largo = `#/cliente/C05?corte=2026-09-30&zzz=${"a".repeat(600)}`;
    expect(resolverDireccion(largo, datos)).toEqual({ ruta: { tipo: "desconocida" }, corte: "2026-10-31", avisos: [] });
    const relleno = (hasta: number): string => `#/desglose/mora?corte=2026-09-30&zzz=${"a".repeat(hasta - "#/desglose/mora?corte=2026-09-30&zzz=".length)}`;
    const justo = relleno(512);
    expect(justo).toHaveLength(512);
    expect(resolverDireccion(justo, datos).ruta.tipo).toBe("desglose");
    expect(resolverDireccion(`${justo}a`, datos).ruta.tipo).toBe("desconocida");
  });

  it("las direcciones de 200 a 512 caracteres no son «desconocidas»: se leen (400 caracteres, por ejemplo)", () => {
    const de400 = `#/cliente/C05?corte=2026-09-30&zzz=${"a".repeat(400 - "#/cliente/C05?corte=2026-09-30&zzz=".length)}`;
    expect(de400).toHaveLength(400);
    expect(resolverDireccion(de400, datos)).toEqual({ ruta: { tipo: "cliente", clienteId: "C05" }, corte: "2026-09-30", avisos: [] });
  });

  it("muchos parámetros repetidos no rompen nada", () => {
    const d = resolverDireccion(`#/?${"corte=1&".repeat(20)}`, datos);
    expect(d.corte).toBe("2026-10-31");
    expect(d.avisos).toHaveLength(1);
  });

  it("los avisos solo llevan fechas y nombres de mes que arma el dominio, nunca el texto de la dirección", () => {
    for (const hostil of hostiles) {
      const d = resolverDireccion(`#/desglose/iva-mes?corte=${hostil}&mes=${hostil}`, datos);
      for (const a of d.avisos) expect(a.texto).toMatch(/^(La fecha de corte de la dirección no es válida\. Se muestra el 31\/10\/2026\.|El mes de la dirección no es válido\. Se muestra octubre de 2026\.)$/);
    }
  });
});

function decodeURIComponentSeguro(texto: string): string {
  try {
    return decodeURIComponent(texto);
  } catch {
    return texto;
  }
}

describe("aHash: la forma canónica, y ida y vuelta con resolverDireccion", () => {
  const navegables: readonly RutaNavegable[] = [
    { tipo: "resumen" },
    { tipo: "comprobantes" },
    { tipo: "comprobantes", tramo: "vencidos" },
    { tipo: "comprobantes", tramo: "mas-90", q: "algarrobos" },
    { tipo: "comprobantes", q: "ó".repeat(60) },
    { tipo: "clientes" },
    { tipo: "clientes", filtro: "revisar" },
    { tipo: "clientes", filtro: "con-mora", q: "Los Algarrobos & Cía + 100%" },
    { tipo: "clientes", q: "😀 ñandú #1 ?x=1&corte=hola" },
    { tipo: "meses" },
    { tipo: "como-se-calcula" },
    { tipo: "cliente", clienteId: "C05" },
    { tipo: "comprobante", comprobanteId: idFactura },
    { tipo: "desglose", clave: "mora" },
    { tipo: "desglose", clave: "mora", clienteId: "C05" },
    { tipo: "desglose", clave: "saldo", agrupar: "no" },
    { tipo: "desglose", clave: "facturacion-mes", mes: "2026-05" },
    { tipo: "desglose", clave: "cobranza-mes", clienteId: "C05", mes: "2026-05", agrupar: "no" },
  ];

  it("la forma de cada ruta es la de docs/diseno-ui.md, sección 2, con el corte siempre en la dirección", () => {
    expect(aHash({ tipo: "resumen" }, "2026-10-31")).toBe("#/resumen?corte=2026-10-31");
    expect(aHash({ tipo: "comprobantes" }, "2026-10-31")).toBe("#/comprobantes?corte=2026-10-31");
    expect(aHash({ tipo: "comprobantes", tramo: "no-vencido", q: "Los Algarrobos" }, "2026-10-31")).toBe("#/comprobantes?corte=2026-10-31&tramo=no-vencido&q=Los%20Algarrobos");
    expect(aHash({ tipo: "clientes", filtro: "revisar" }, "2026-09-30")).toBe("#/clientes?corte=2026-09-30&filtro=revisar");
    expect(aHash({ tipo: "clientes", q: "ñandú" }, "2026-09-30")).toBe("#/clientes?corte=2026-09-30&q=%C3%B1and%C3%BA");
    expect(aHash({ tipo: "meses" }, "2026-10-31")).toBe("#/meses?corte=2026-10-31");
    expect(aHash({ tipo: "como-se-calcula" }, "2026-10-31")).toBe("#/como-se-calcula?corte=2026-10-31");
    expect(aHash({ tipo: "cliente", clienteId: "C05" }, "2026-09-30")).toBe("#/cliente/C05?corte=2026-09-30");
    expect(aHash({ tipo: "comprobante", comprobanteId: "1-0003-00000123" }, "2026-10-31")).toBe("#/comprobante/1-0003-00000123?corte=2026-10-31");
    expect(aHash({ tipo: "desglose", clave: "mora" }, "2026-10-31")).toBe("#/desglose/mora?corte=2026-10-31");
    expect(aHash({ tipo: "desglose", clave: "mora", clienteId: "C05" }, "2026-10-31")).toBe("#/desglose/mora?corte=2026-10-31&cliente=C05");
    expect(aHash({ tipo: "desglose", clave: "cobranza-mes", clienteId: "C05", mes: "2026-05", agrupar: "no" }, "2026-10-31")).toBe(
      "#/desglose/cobranza-mes?corte=2026-10-31&cliente=C05&mes=2026-05&agrupar=no",
    );
  });

  it.each(navegables.map((r) => [aHash(r, "2026-08-31"), r] as const))("ida y vuelta: %s", (hash, ruta) => {
    expect(resolverDireccion(hash, datos)).toEqual({ ruta, corte: "2026-08-31", avisos: [] });
  });

  it("`aHash` no escribe `todos`, ni una búsqueda vacía, y recorta la búsqueda como la lee el enrutador", () => {
    expect(aHash({ tipo: "comprobantes", q: "" }, "2026-10-31")).toBe("#/comprobantes?corte=2026-10-31");
    expect(aHash({ tipo: "clientes", q: "a".repeat(70) }, "2026-10-31")).toBe(`#/clientes?corte=2026-10-31&q=${"a".repeat(60)}`);
  });

  it("cabe con holgura en el largo máximo", () => {
    const peor = aHash({ tipo: "desglose", clave: "facturado-con-iva-mes", clienteId: "C05", mes: "2026-05", agrupar: "no" }, "2026-10-31");
    expect(peor.length).toBeLessThan(120);
  });

  it("todo lo que escribe `aHash` lo acepta `resolverDireccion`, con la peor búsqueda (60 caracteres de la peor clase) y el peor tramo", () => {
    for (const unidad of ["a", "ó", "漢", "😀", "%", "&", " ", "+", "\uD83D"]) {
      for (const tramo of ["no-vencido", "mas-90"] as const) {
        const ruta: RutaNavegable = { tipo: "comprobantes", tramo, q: unidad.repeat(60) };
        const hash = aHash(ruta, "2026-10-31");
        expect(hash.length, `${unidad} ${tramo}`).toBeLessThanOrEqual(LARGO_MAXIMO_HASH);
        const d = resolverDireccion(hash, datos);
        expect(d.ruta.tipo, `${unidad} ${tramo}`).toBe("comprobantes");
        // La forma canónica es un punto fijo: leerla y volver a escribirla da el mismo hash.
        expect(aHash(d.ruta as RutaNavegable, d.corte)).toBe(hash);
      }
    }
  });
});

describe("idDeVista: qué cuenta como «otra vista» para mover el foco (diseno-ui, sección 2)", () => {
  const corte = "2026-10-31";
  const id = (r: RutaNavegable): string => idDeVista(r);

  it("cambia con la ruta, el cliente, el comprobante, la clave, `cliente=` y `mes=`", () => {
    const base = id({ tipo: "desglose", clave: "iva-mes", clienteId: "C05", mes: "2026-05" });
    expect(new Set([
      base,
      id({ tipo: "resumen" }),
      id({ tipo: "cliente", clienteId: "C05" }),
      id({ tipo: "cliente", clienteId: "C06" }),
      id({ tipo: "comprobante", comprobanteId: "1-0003-00000001" }),
      id({ tipo: "comprobante", comprobanteId: "1-0003-00000002" }),
      id({ tipo: "desglose", clave: "mora" }),
      id({ tipo: "desglose", clave: "iva-mes", clienteId: "C06", mes: "2026-05" }),
      id({ tipo: "desglose", clave: "iva-mes", mes: "2026-05" }),
      id({ tipo: "desglose", clave: "iva-mes", clienteId: "C05", mes: "2026-06" }),
      id({ tipo: "desglose", clave: "iva-mes", clienteId: "C05" }),
    ]).size).toBe(11);
  });

  it("no cambia con `agrupar` (es la misma vista y el mismo sujeto)", () => {
    expect(id({ tipo: "desglose", clave: "mora" })).toBe(id({ tipo: "desglose", clave: "mora", agrupar: "no" }));
  });

  it("las ocho secciones tienen cada una su id, distinto de los demás", () => {
    expect(new Set([
      id({ tipo: "resumen" }),
      id({ tipo: "comprobantes" }),
      id({ tipo: "clientes" }),
      id({ tipo: "meses" }),
      id({ tipo: "como-se-calcula" }),
      id({ tipo: "cliente", clienteId: "C05" }),
      id({ tipo: "comprobante", comprobanteId: "1-0003-00000001" }),
      id({ tipo: "desglose", clave: "mora" }),
    ]).size).toBe(8);
  });

  it("R2: filtrar o escribir no cambia la vista (el foco no se mueve y la página no sube): `tramo`, `filtro` y `q` no entran en el id", () => {
    expect(id({ tipo: "comprobantes", tramo: "vencidos", q: "algarrobos" })).toBe(id({ tipo: "comprobantes" }));
    expect(id({ tipo: "comprobantes", tramo: "mas-90" })).toBe(id({ tipo: "comprobantes", tramo: "1-30", q: "x" }));
    expect(id({ tipo: "clientes", filtro: "revisar", q: "sol" })).toBe(id({ tipo: "clientes" }));
    // Y el id no repite lo escrito.
    expect(id({ tipo: "clientes", q: "<script>alert(1)</script>" })).not.toContain("script");
  });

  it("no depende del corte: cambiar solo el corte es la misma vista (el foco no se mueve)", () => {
    const a = resolverDireccion(`#/cliente/C05?corte=2026-09-30`, datos).ruta;
    const b = resolverDireccion(`#/cliente/C05?corte=${corte}`, datos).ruta;
    expect(idDeVista(a)).toBe(idDeVista(b));
  });

  it("las rutas desconocidas e inexistentes tienen id propio, que no repite lo escrito", () => {
    expect(idDeVista({ tipo: "desconocida" })).toBe("desconocida");
    expect(idDeVista({ tipo: "inexistente", vista: "cliente" })).toBe("inexistente/cliente");
  });
});

describe("un segundo `#` en la dirección: lo que viene después se ignora", () => {
  it("`#/resumen?corte=2026-09-30#frag` se lee como el corte 30/09/2026, sin aviso", () => {
    expect(resolverDireccion("#/resumen?corte=2026-09-30#frag", datos)).toEqual({ ruta: { tipo: "resumen" }, corte: "2026-09-30", avisos: [] });
  });

  it("también sin consulta, en el último parámetro y con el fragmento vacío", () => {
    expect(resolverDireccion("#/clientes#abajo", datos).ruta).toEqual({ tipo: "clientes" });
    expect(resolverDireccion("#/clientes?corte=2026-10-31&filtro=con-mora#x", datos).ruta).toEqual({ tipo: "clientes", filtro: "con-mora" });
    expect(resolverDireccion("#/cliente/C05#otro", datos).ruta).toMatchObject({ tipo: "cliente", clienteId: "C05" });
    expect(resolverDireccion("#/resumen?corte=2026-10-31#", datos)).toEqual({ ruta: { tipo: "resumen" }, corte: "2026-10-31", avisos: [] });
  });

  it("un `#` codificado (%23) dentro de la búsqueda sigue siendo parte de la búsqueda", () => {
    expect(resolverDireccion("#/comprobantes?corte=2026-10-31&q=a%23b", datos).ruta).toEqual({ tipo: "comprobantes", q: "a#b" });
  });
});
