// Orden por defecto de las partidas de un desglose (docs/diseno-ui.md, 5.9.2 y 6.4). En las medidas de saldo, por atraso (el mayor
// primero); en las demás, por importe. Se prueba con partidas escritas a mano (los empates y las partidas sin atraso se arman a propósito) y, aparte,
// que la lista de medidas de saldo coincide con las medidas cuyas partidas traen `atraso` (el dominio es quien lo dice).
import { describe, expect, it } from "vitest";
import { CLAVES_DEL_CATALOGO, TODAS_LAS_CLAVES } from "../src/lib/dominio/claves.ts";
import { centavos } from "../src/lib/dominio/dinero.ts";
import { clavesExistentes, medida } from "../src/lib/dominio/medidas.ts";
import { criteriosDeOrden, esMedidaDeSaldo, ordenarPartidas, ordenPorDefecto } from "../src/lib/dominio/orden.ts";
import type { Datos, FechaCivil, Partida } from "../src/lib/dominio/tipos.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { fixtureOtros, fixtureT12, fixtureT17 } from "./fixtures/casos.ts";

interface Opciones {
  atraso?: number;
  fecha?: string;
  recibo?: boolean;
}

/** Una partida mínima: `id` identifica a la partida en los resultados. */
function partida(id: string, importe: number, o: Opciones = {}): Partida {
  const p: Partida = { ref: { tipo: o.recibo === true ? "recibo" : "comprobante", id }, clienteId: "C01", fecha: o.fecha ?? "2026-01-01", importe: centavos(importe) };
  if (o.atraso !== undefined) p.atraso = o.atraso;
  return p;
}

const ids = (ps: readonly Partida[]): string[] => ps.map((p) => p.ref.id);

describe("la lista de medidas de saldo (5.9.2)", () => {
  it("son `mora`, `mora-otros`, los cinco tramos, `saldo` y `saldo-neto`; las demás no", () => {
    const deSaldo = TODAS_LAS_CLAVES.filter(esMedidaDeSaldo);
    expect(deSaldo).toEqual(["saldo", "mora", "tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90", "saldo-neto", "mora-otros"]);
    expect(TODAS_LAS_CLAVES.filter((c) => !esMedidaDeSaldo(c))).toEqual(["facturacion-mes", "facturado-con-iva-mes", "iva-mes", "cobranza-mes", "retenciones-mes", "pagos-a-cuenta", "saldos-a-favor"]);
  });

  it("coincide con lo que dice el dominio: las partidas de comprobante traen `atraso` solo en las medidas de saldo, y las de recibo nunca", () => {
    const seis = armarDatos({
      comprobantes: ["C01", "C02", "C03", "C04", "C05", "C06"].map((cliente) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(100_000) })),
    }).datos;
    const ejercitadas = new Set<string>();
    const casos: [Datos, FechaCivil][] = [[fixtureT12().datos, "2026-10-31"], [fixtureOtros().datos, "2026-10-31"], [seis, "2026-10-31"], [fixtureT17().datos, "2026-07-31"]];
    for (const [datos, corte] of casos) {
      for (const clave of TODAS_LAS_CLAVES) {
        if (clave === "mora-otros" && !clavesExistentes(datos, corte).includes(clave)) continue;
        const partidas = medida(datos, corte, clave).partidas;
        if (partidas.length > 0) ejercitadas.add(clave);
        for (const p of partidas) expect(p.atraso !== undefined, `${clave} ${p.ref.id}`).toBe(esMedidaDeSaldo(clave) && p.ref.tipo === "comprobante");
      }
    }
    expect(ejercitadas.has("mora-otros")).toBe(true);
    expect(ejercitadas.has("saldo-neto")).toBe(true);
    expect(ejercitadas.has("facturacion-mes")).toBe(true);
  });
});

describe("ordenPorDefecto: el criterio de cada medida", () => {
  it("atraso en las medidas de saldo; importe en las demás", () => {
    for (const clave of TODAS_LAS_CLAVES) expect(ordenPorDefecto(clave), clave).toBe(esMedidaDeSaldo(clave) ? "atraso" : "importe");
    expect(CLAVES_DEL_CATALOGO.map(ordenPorDefecto).filter((o) => o === "atraso")).toHaveLength(8);
  });
});

describe("ordenarPartidas por atraso (5.9.2): el mayor primero; en el empate, el importe mayor; sin atraso al final, por importe", () => {
  it("el mayor atraso primero, sin importar el importe ni la fecha", () => {
    const ps = [partida("a", 900, { atraso: 10 }), partida("b", 100, { atraso: 91 }), partida("c", 500, { atraso: 45 })];
    expect(ids(ordenarPartidas(ps, "atraso"))).toEqual(["b", "c", "a"]);
  });

  it("el caso de C05: la factura de 91 días queda primera aunque otras vencidas tengan más saldo", () => {
    const ps = [partida("relleno-grande", 9_000_000, { atraso: 80 }), partida("d91", 1_000_000, { atraso: 91 }), partida("relleno-chico", 50_000, { atraso: 12 })];
    expect(ordenarPartidas(ps, "atraso")[0]?.ref.id).toBe("d91");
  });

  it("con el mismo atraso, el importe mayor primero", () => {
    const ps = [partida("a", 100, { atraso: 30 }), partida("b", 300, { atraso: 30 }), partida("c", 200, { atraso: 30 })];
    expect(ids(ordenarPartidas(ps, "atraso"))).toEqual(["b", "c", "a"]);
  });

  it("con el mismo atraso y el mismo importe, la fecha más vieja primero; después, comprobantes antes que recibos y por id (nunca queda al azar)", () => {
    const ps = [
      partida("z", 100, { atraso: 30, fecha: "2026-02-01" }),
      partida("b", 100, { atraso: 30, fecha: "2026-01-01" }),
      partida("a", 100, { atraso: 30, fecha: "2026-01-01" }),
      partida("r", 100, { atraso: 30, fecha: "2026-01-01", recibo: true }),
    ];
    expect(ids(ordenarPartidas(ps, "atraso"))).toEqual(["a", "b", "r", "z"]);
    expect(ids(ordenarPartidas([...ps].reverse(), "atraso"))).toEqual(["a", "b", "r", "z"]);
  });

  it("un atraso de 0 o negativo (no vencido) es un atraso: va después de los vencidos y antes de las partidas sin atraso", () => {
    const ps = [partida("sin", 999, {}), partida("hoy", 100, { atraso: 0 }), partida("falta", 100, { atraso: -5 }), partida("vencida", 1, { atraso: 1 })];
    expect(ids(ordenarPartidas(ps, "atraso"))).toEqual(["vencida", "hoy", "falta", "sin"]);
  });

  it("las partidas sin atraso (a cuenta de `saldo-neto`) van al final, por importe de mayor a menor, y con el desempate de fecha", () => {
    const ps = [
      partida("ac-chico", -100, { recibo: true }),
      partida("f1", 500, { atraso: 3 }),
      partida("ac-grande", -900, { recibo: true }),
      partida("ac-viejo", -100, { recibo: true, fecha: "2025-12-01" }),
      partida("f2", 200, { atraso: 40 }),
    ];
    expect(ids(ordenarPartidas(ps, "atraso"))).toEqual(["f2", "f1", "ac-viejo", "ac-chico", "ac-grande"]);
  });

  it("todas sin atraso: queda ordenado por importe", () => {
    const ps = [partida("a", 100, { recibo: true }), partida("b", 300, { recibo: true }), partida("c", 200, { recibo: true })];
    expect(ids(ordenarPartidas(ps, "atraso"))).toEqual(["b", "c", "a"]);
  });
});

describe("ordenarPartidas por importe (5.9.2): de mayor a menor; en el empate, la fecha más vieja primero", () => {
  it("de mayor a menor, con el importe firmado (la nota de crédito va al final)", () => {
    const ps = [partida("nc", -10_000), partida("a", 200), partida("b", 900), partida("c", 0)];
    expect(ids(ordenarPartidas(ps, "importe"))).toEqual(["b", "a", "c", "nc"]);
  });

  it("con el mismo importe, la fecha más vieja primero; si también empata, comprobantes antes que recibos y por id", () => {
    const ps = [
      partida("nueva", 100, { fecha: "2026-03-01" }),
      partida("vieja", 100, { fecha: "2026-01-01" }),
      partida("rec", 100, { fecha: "2026-02-01", recibo: true }),
      partida("comp", 100, { fecha: "2026-02-01" }),
    ];
    expect(ids(ordenarPartidas(ps, "importe"))).toEqual(["vieja", "comp", "rec", "nueva"]);
  });

  it("no mira el atraso: una partida con atraso mayor pero menos importe no pasa", () => {
    const ps = [partida("viejo", 100, { atraso: 90 }), partida("grande", 500, { atraso: 1 })];
    expect(ids(ordenarPartidas(ps, "importe"))).toEqual(["grande", "viejo"]);
  });
});

describe("ordenarPartidas por fecha (la más vieja primero) y por referencia (las dos que ofrece el desglose de la interfaz)", () => {
  it("por fecha: la más vieja primero, sin mirar importe ni atraso; el mismo día, comprobantes antes que recibos y por id", () => {
    const ps = [
      partida("nueva", 900, { fecha: "2026-03-01", atraso: 99 }),
      partida("rec", 100, { fecha: "2026-02-01", recibo: true }),
      partida("b", 1, { fecha: "2026-02-01" }),
      partida("a", 5, { fecha: "2026-02-01" }),
      partida("vieja", 50, { fecha: "2025-12-31" }),
    ];
    expect(ids(ordenarPartidas(ps, "fecha"))).toEqual(["vieja", "a", "b", "rec", "nueva"]);
  });

  it("por referencia: el id de menor a mayor, sin mirar nada más; si dos tuvieran el mismo id, la fecha más vieja primero", () => {
    const ps = [partida("1-0003-00000562", 1, { fecha: "2026-05-01" }), partida("1-0003-00000010", 9, { fecha: "2026-09-01" }), partida("1-0001-00000900", 5), partida("R-0003-00000045", 5, { recibo: true }), partida("1-0003-00000010", 9, { fecha: "2026-01-01" })];
    const orden = ordenarPartidas(ps, "referencia");
    expect(ids(orden)).toEqual(["1-0001-00000900", "1-0003-00000010", "1-0003-00000010", "1-0003-00000562", "R-0003-00000045"]);
    expect(orden[1]?.fecha).toBe("2026-01-01");
  });

  it("no dependen del orden de entrada", () => {
    const ps = [partida("c", 1, { fecha: "2026-01-02" }), partida("a", 2, { fecha: "2026-01-02" }), partida("b", 3, { fecha: "2026-01-01" })];
    for (const criterio of ["fecha", "referencia"] as const) expect(ids(ordenarPartidas([...ps].reverse(), criterio))).toEqual(ids(ordenarPartidas(ps, criterio)));
  });
});

describe("criteriosDeOrden: lo que ofrece el desglose de cada medida (5.9.2)", () => {
  it("importe, fecha y referencia en todas; atraso solo en las medidas de saldo, al final", () => {
    for (const clave of TODAS_LAS_CLAVES) {
      expect(criteriosDeOrden(clave), clave).toEqual(esMedidaDeSaldo(clave) ? ["importe", "fecha", "referencia", "atraso"] : ["importe", "fecha", "referencia"]);
    }
  });

  it("el criterio por defecto de cada medida es uno de los que ofrece", () => {
    for (const clave of TODAS_LAS_CLAVES) expect(criteriosDeOrden(clave)).toContain(ordenPorDefecto(clave));
  });
});

describe("ordenarPartidas: es una función pura", () => {
  it("no modifica la lista que recibe ni las partidas, y devuelve otra lista", () => {
    const ps = [partida("a", 1, { atraso: 1 }), partida("b", 2, { atraso: 2 })];
    const copia = structuredClone(ps);
    const orden = ordenarPartidas(ps, "atraso");
    expect(orden).not.toBe(ps);
    expect(ps).toEqual(copia);
  });

  it("una lista vacía o de una partida queda igual", () => {
    expect(ordenarPartidas([], "atraso")).toEqual([]);
    const una = [partida("a", 1)];
    expect(ordenarPartidas(una, "importe")).toEqual(una);
  });

  it("el resultado no depende del orden de entrada (con todos los empates posibles)", () => {
    const ps = [
      partida("a", 100, { atraso: 30 }),
      partida("b", 100, { atraso: 30 }),
      partida("c", 100, { atraso: 30, fecha: "2025-12-31" }),
      partida("d", 50, { atraso: 30 }),
      partida("e", 100, { atraso: 31 }),
      partida("f", -50, { recibo: true }),
      partida("g", -50, { recibo: true, fecha: "2025-01-01" }),
    ];
    const esperado = ids(ordenarPartidas(ps, "atraso"));
    for (const orden of [[...ps].reverse(), [ps[3], ps[5], ps[0], ps[6], ps[1], ps[4], ps[2]] as Partida[]]) {
      expect(ids(ordenarPartidas(orden, "atraso"))).toEqual(esperado);
    }
  });
});

describe("sobre los datos del dominio: la lista de una medida de saldo, en orden por defecto", () => {
  it("T12 al 31/10: `mora` por atraso es 91, 90, 61, 60, 31 y 30 (la de 91 días, primera); la cobranza del mes, por importe", () => {
    const { datos } = fixtureT12();
    const mora = ordenarPartidas(medida(datos, "2026-10-31", "mora").partidas, ordenPorDefecto("mora"));
    expect(mora.map((p) => p.atraso)).toEqual([91, 90, 61, 60, 31, 30]);
    const cobranza = ordenarPartidas(medida(datos, "2026-10-31", "cobranza-mes", { mes: "2026-04" }).partidas, ordenPorDefecto("cobranza-mes"));
    for (let i = 1; i < cobranza.length; i++) expect(cobranza[i - 1]!.importe).toBeGreaterThanOrEqual(cobranza[i]!.importe);
  });

  it("ordenar no cambia la suma ni la cantidad (el cierre sigue al centavo)", () => {
    const { datos } = fixtureT12();
    for (const clave of CLAVES_DEL_CATALOGO) {
      const m = medida(datos, "2026-10-31", clave);
      const orden = ordenarPartidas(m.partidas, ordenPorDefecto(clave));
      expect(orden, clave).toHaveLength(m.partidas.length);
      expect(orden.reduce((s, p) => s + p.importe, 0), clave).toBe(m.partidas.reduce((s, p) => s + p.importe, 0));
    }
  });
});
