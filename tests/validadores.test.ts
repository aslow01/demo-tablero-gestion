// Validadores de datos (docs/diseno.md: C2, C3, R1, R3 y los de G5). Cada caso válido y cada caso rechazado de la tabla, con el
// identificador de la regla en el nombre. El validador tiene que NOMBRAR el dato dañado (el id del comprobante o del recibo).
import { describe, expect, it } from "vitest";
import { idComprobante, idRecibo, vencimientoDe } from "../src/lib/dominio/comprobantes.ts";
import { TOPE_CENTAVOS, centavos } from "../src/lib/dominio/dinero.ts";
import type { Centavos } from "../src/lib/dominio/dinero.ts";
import { validarDatos } from "../src/lib/dominio/validadores.ts";
import type { Problema, ReglaValidada } from "../src/lib/dominio/validadores.ts";
import type { Comprobante, Datos, Recibo } from "../src/lib/dominio/tipos.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import type { Armado, ComprobanteDeFixture, ReciboDeFixture } from "./fixtures/armarDatos.ts";
import { FIXTURES } from "./fixtures/casos.ts";

const de = (problemas: readonly Problema[], regla: ReglaValidada): Problema[] => problemas.filter((p) => p.regla === regla);

function cambiarComprobante(d: Datos, id: string, cambios: Partial<Comprobante>): Datos {
  return { ...d, comprobantes: d.comprobantes.map((c) => (c.id === id ? { ...c, ...cambios } : c)) };
}
function cambiarRecibo(d: Datos, id: string, cambios: Partial<Recibo>): Datos {
  return { ...d, recibos: d.recibos.map((r) => (r.id === id ? { ...r, ...cambios } : r)) };
}
/** Cambia la emisión de un comprobante y recalcula su vencimiento (para no sumar un problema de C4 a lo que se prueba). */
function conEmision(d: Datos, id: string, emision: string): Datos {
  const c = d.comprobantes.find((x) => x.id === id);
  const plazo = d.clientes.find((x) => x.id === c?.clienteId)?.plazoDias ?? 0;
  return cambiarComprobante(d, id, { emision, vencimiento: vencimientoDe(c?.tipo ?? 1, emision, plazo) });
}

/** Una factura de 121.000,00 con IVA (neto 100.000,00) de C03 y lo que se le agregue. */
function conFactura(comprobantes: ComprobanteDeFixture[] = [], recibos: ReciboDeFixture[] = []): Armado {
  return armarDatos({
    comprobantes: [{ clave: "F", cliente: "C03", emision: "2026-03-01", neto: pesos(100_000) }, ...comprobantes],
    recibos,
  });
}
const nc = (clave: string, emision: string, neto: number, asociadoA = "F", cliente = "C03"): ComprobanteDeFixture => ({ clave, tipo: 3, cliente, emision, neto: pesos(neto), asociadoA });
const recibo = (clave: string, fecha: string, importe: number, imputaA: { comprobante: string; importe: number }[] = [], cliente = "C03"): ReciboDeFixture => ({
  clave,
  cliente,
  fecha,
  medios: [{ importe: pesos(importe) }],
  imputaciones: imputaA.map((i) => ({ comprobante: i.comprobante, importe: pesos(i.importe) })),
});

describe("G5: un conjunto bien armado no tiene problemas", () => {
  it("G5: los once fixtures de 5.5 pasan todos los validadores", () => {
    for (const [alias, f] of Object.entries(FIXTURES)) expect(validarDatos(f().datos), `fixture ${alias}`).toEqual([]);
  });

  it("G5: un conjunto vacío es válido", () => {
    expect(validarDatos(armarDatos({}).datos)).toEqual([]);
  });

  it("G5: cada problema trae la regla, el dato dañado y un mensaje", () => {
    const a = conFactura();
    const roto = cambiarComprobante(a.datos, a.id("F"), { clienteId: "C99" });
    const [p] = validarDatos(roto);
    expect(p).toBeDefined();
    expect(p?.dato).toBe(a.id("F"));
    expect(p?.mensaje).toContain(a.id("F"));
    expect(p?.mensaje).toContain("C99");
  });

  it("G5: informa todos los problemas, no solo el primero", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "F1", cliente: "C01", emision: "2026-03-01", neto: pesos(1_000) },
        { clave: "F2", cliente: "C01", emision: "2026-03-02", neto: pesos(1_000) },
      ],
    });
    let d = cambiarComprobante(a.datos, a.id("F1"), { clienteId: "C98" });
    d = cambiarComprobante(d, a.id("F2"), { clienteId: "C99" });
    const dados = validarDatos(d).map((p) => p.dato);
    expect(dados).toContain(a.id("F1"));
    expect(dados).toContain(a.id("F2"));
  });
});

describe("G5: estructura (ids únicos, M2, fechas, clientes) y C4", () => {
  it("G5: un id de comprobante repetido se nombra", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "F1", cliente: "C01", emision: "2026-03-01", neto: pesos(1_000) },
        { clave: "F2", cliente: "C01", emision: "2026-03-02", neto: pesos(1_000) },
      ],
    });
    const d = cambiarComprobante(a.datos, a.id("F2"), { id: a.id("F1") });
    const ps = de(validarDatos(d), "G5");
    expect(ps.some((p) => p.dato === a.id("F1") && /repetid/.test(p.mensaje))).toBe(true);
  });

  it("G5: un id de recibo repetido se nombra", () => {
    const a = armarDatos({ recibos: [recibo("R1", "2026-03-01", 10, [], "C01"), recibo("R2", "2026-03-02", 10, [], "C01")] });
    const d = cambiarRecibo(a.datos, a.id("R2"), { id: a.id("R1") });
    expect(de(validarDatos(d), "G5").some((p) => p.dato === a.id("R1") && /repetid/.test(p.mensaje))).toBe(true);
  });

  it("G5 (M2): un IVA que no es el de M2 se nombra, con el esperado", () => {
    const a = conFactura();
    const d = cambiarComprobante(a.datos, a.id("F"), { iva: centavos(2_100_001), total: centavos(12_100_001) });
    const ps = de(validarDatos(d), "G5");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("F"));
    expect(ps[0]?.mensaje).toMatch(/IVA/);
  });

  it("G5 (M2): un total que no es neto + IVA se nombra", () => {
    const a = conFactura();
    const d = cambiarComprobante(a.datos, a.id("F"), { total: centavos(12_100_001) });
    const ps = de(validarDatos(d), "G5");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.mensaje).toMatch(/total/);
  });

  it("G5: un neto menor que 1 se nombra", () => {
    const a = conFactura();
    const d = cambiarComprobante(a.datos, a.id("F"), { neto: centavos(0), iva: centavos(0), total: centavos(0) });
    expect(de(validarDatos(d), "G5").some((p) => p.dato === a.id("F") && /neto/.test(p.mensaje))).toBe(true);
  });

  it("G5: una fecha que no existe (2026-02-30) en un comprobante o en un recibo se nombra", () => {
    const a = conFactura([], [recibo("R", "2026-04-01", 100, [], "C03")]);
    const d1 = cambiarComprobante(a.datos, a.id("F"), { emision: "2026-02-30" });
    expect(de(validarDatos(d1), "G5").some((p) => p.dato === a.id("F") && /2026-02-30/.test(p.mensaje))).toBe(true);
    const d2 = cambiarRecibo(a.datos, a.id("R"), { fecha: "2026-13-01" });
    expect(de(validarDatos(d2), "G5").some((p) => p.dato === a.id("R") && /2026-13-01/.test(p.mensaje))).toBe(true);
  });

  it("G5: un cliente que no existe se nombra, en un comprobante y en un recibo", () => {
    const a = conFactura([], [recibo("R", "2026-04-01", 100, [], "C03")]);
    const d1 = cambiarComprobante(a.datos, a.id("F"), { clienteId: "C99" });
    expect(de(validarDatos(d1), "G5").some((p) => p.dato === a.id("F") && /C99/.test(p.mensaje))).toBe(true);
    const d2 = cambiarRecibo(a.datos, a.id("R"), { clienteId: "C98" });
    expect(de(validarDatos(d2), "G5").some((p) => p.dato === a.id("R") && /C98/.test(p.mensaje))).toBe(true);
  });

  it("C4: un vencimiento que no es emisión + plazo se nombra", () => {
    const a = conFactura(); // C03, plazo 30: vence el 2026-03-31
    const d = cambiarComprobante(a.datos, a.id("F"), { vencimiento: "2026-04-01" });
    const ps = de(validarDatos(d), "C4");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("F"));
    expect(ps[0]?.mensaje).toContain("2026-03-31");
  });

  it("C4: el vencimiento de una NC es su emisión y cualquier otro se rechaza", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)]);
    expect(validarDatos(a.datos)).toEqual([]);
    const d = cambiarComprobante(a.datos, a.id("NC"), { vencimiento: "2026-04-04" });
    expect(de(validarDatos(d), "C4").map((p) => p.dato)).toEqual([a.id("NC")]);
  });
});

describe("C2: numeración correlativa, sin saltos, en orden de emisión", () => {
  const tres = (): Armado =>
    armarDatos({
      comprobantes: [
        { clave: "F1", cliente: "C01", emision: "2026-03-01", neto: pesos(1_000) },
        { clave: "F2", cliente: "C01", emision: "2026-03-02", neto: pesos(1_000) },
        { clave: "F3", cliente: "C01", emision: "2026-03-03", neto: pesos(1_000) },
      ],
    });
  const renumerar = (d: Datos, de3: string, numero: number): Datos => cambiarComprobante(d, de3, { numero, id: idComprobante(1, 3, numero) });

  it("C2: números 1, 2, 3 → válido", () => {
    expect(de(validarDatos(tres().datos), "C2")).toEqual([]);
  });

  it("C2: números 1, 2, 4 → «salto», y nombra el comprobante 4 y el número que falta", () => {
    const a = tres();
    const ps = de(validarDatos(renumerar(a.datos, a.id("F3"), 4)), "C2");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe("1-0003-00000004");
    expect(ps[0]?.mensaje).toMatch(/salt/);
    expect(ps[0]?.mensaje).toMatch(/3/);
  });

  it("C2: números 1, 2, 2 → «repetido»", () => {
    const a = tres();
    const ps = de(validarDatos(renumerar(a.datos, a.id("F3"), 2)), "C2");
    expect(ps.some((p) => /repetid/.test(p.mensaje) && p.dato === "1-0003-00000002")).toBe(true);
  });

  it("C2: la numeración que no empieza en 1 es un salto", () => {
    const a = tres();
    let d = renumerar(a.datos, a.id("F1"), 2);
    d = renumerar(d, a.id("F2"), 3);
    d = renumerar(d, a.id("F3"), 4);
    const ps = de(validarDatos(d), "C2");
    expect(ps.length).toBeGreaterThan(0);
    expect(ps[0]?.mensaje).toMatch(/salt/);
  });

  it("C2: el número 5 con fecha anterior a la del 4 → «fuera de orden»", () => {
    const a = armarDatos({
      comprobantes: [1, 2, 3, 4, 5].map((n) => ({ clave: `F${n}`, cliente: "C01", emision: `2026-03-0${n}`, neto: pesos(1_000) })),
    });
    const d = conEmision(a.datos, a.id("F5"), "2026-03-03"); // el 5 se emitió el 3, antes que el 4 (del 4)
    const ps = de(validarDatos(d), "C2");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("F5"));
    expect(ps[0]?.mensaje).toMatch(/fuera de orden/);
  });

  it("C2: «fuera de orden» informa todos los casos: con fechas 1, 2, 3, 4, 3, 3 se nombran el 5 y el 6 (los dos anteriores al 4)", () => {
    const a = armarDatos({
      comprobantes: [1, 2, 3, 4, 5, 6].map((n) => ({ clave: `F${n}`, cliente: "C01", emision: `2026-03-0${n}`, neto: pesos(1_000) })),
    });
    let d = conEmision(a.datos, a.id("F5"), "2026-03-03");
    d = conEmision(d, a.id("F6"), "2026-03-03");
    const ps = de(validarDatos(d), "C2");
    expect(ps.map((p) => p.dato)).toEqual([a.id("F5"), a.id("F6")]);
    for (const p of ps) expect(p.mensaje).toMatch(/fuera de orden/);
  });

  it("C2: la misma fecha en números consecutivos no es fuera de orden (el desempate es del generador, no un dato)", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "A", cliente: "C03", emision: "2026-03-01", neto: pesos(1_000) },
        { clave: "B", cliente: "C01", emision: "2026-03-01", neto: pesos(1_000) },
      ],
    });
    expect(de(validarDatos(a.datos), "C2")).toEqual([]);
  });

  it("C2: cada tipo se numera por separado: la NC 1 no choca con la factura 1", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)]);
    expect(a.datos.comprobantes.map((c) => c.id)).toEqual(["1-0003-00000001", "3-0003-00000001"]);
    expect(de(validarDatos(a.datos), "C2")).toEqual([]);
  });

  it("C2: un id que no es tipo-PV-número del propio comprobante se nombra", () => {
    const a = tres();
    const d = cambiarComprobante(a.datos, a.id("F2"), { id: "1-0003-00000009" });
    const ps = de(validarDatos(d), "C2");
    expect(ps.some((p) => p.dato === "1-0003-00000009" && /no coincide/.test(p.mensaje))).toBe(true);
  });

  it("C2 (recibos): salto, repetido y fuera de orden, con ids R-PV-número", () => {
    const base = (): Armado => armarDatos({ recibos: [1, 2, 3].map((n) => recibo(`R${n}`, `2026-04-0${n}`, 10, [], "C01")) });
    const a = base();
    expect(de(validarDatos(a.datos), "C2")).toEqual([]);
    const salto = de(validarDatos(cambiarRecibo(a.datos, a.id("R3"), { id: idRecibo(3, 4) })), "C2");
    expect(salto).toHaveLength(1);
    expect(salto[0]).toMatchObject({ dato: "R-0003-00000004" });
    expect(salto[0]?.mensaje).toMatch(/salt/);
    const repetido = de(validarDatos(cambiarRecibo(a.datos, a.id("R3"), { id: idRecibo(3, 2) })), "C2");
    expect(repetido.some((p) => /repetid/.test(p.mensaje))).toBe(true);
    const fuera = de(validarDatos(cambiarRecibo(a.datos, a.id("R3"), { fecha: "2026-04-01" })), "C2");
    expect(fuera).toHaveLength(1);
    expect(fuera[0]?.dato).toBe(a.id("R3"));
    expect(fuera[0]?.mensaje).toMatch(/fuera de orden/);
  });

  it("C2: un id de recibo sin el formato R-PV-número se nombra", () => {
    const a = armarDatos({ recibos: [recibo("R", "2026-04-01", 10, [], "C01")] });
    const ps = de(validarDatos(cambiarRecibo(a.datos, a.id("R"), { id: "R-3-1" })), "C2");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe("R-3-1");
    expect(ps[0]?.mensaje).toMatch(/formato/);
  });
});

describe("C3: una NC es de una factura del mismo cliente y no supera su saldo a la fecha de la NC", () => {
  it("C3: factura con saldo 121.000,00 y NC de total 121.000,00 → válida", () => {
    const a = conFactura([nc("NC", "2026-03-05", 100_000)]);
    expect(de(validarDatos(a.datos), "C3")).toEqual([]);
  });

  it("C3: NC de 121.000,01 → el validador la rechaza y nombra la NC y la factura", () => {
    const a = conFactura([{ clave: "NC", tipo: 3, cliente: "C03", emision: "2026-03-05", neto: centavos(10_000_001), asociadoA: "F" }]);
    expect(a.datos.comprobantes.find((c) => c.id === a.id("NC"))?.total).toBe(centavos(12_100_001));
    const ps = de(validarDatos(a.datos), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("NC"));
    expect(ps[0]?.mensaje).toContain(a.id("F"));
    expect(ps[0]?.mensaje).toMatch(/saldo/);
  });

  it("C3: NC de una factura de otro cliente → rechazada", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000, "F", "C01")]);
    const ps = de(validarDatos(a.datos), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("NC"));
    expect(ps[0]?.mensaje).toMatch(/otro cliente/);
  });

  it("C3: NC sin asociadoA → rechazada", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)]);
    const d = cambiarComprobante(a.datos, a.id("NC"), { asociadoA: null });
    const ps = de(validarDatos(d), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("NC"));
    expect(ps[0]?.mensaje).toMatch(/sin factura asociada/);
  });

  it("C3: NC asociada a una factura que no existe → rechazada, nombrando la que falta", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)]);
    const d = cambiarComprobante(a.datos, a.id("NC"), { asociadoA: "1-0003-00000099" });
    const ps = de(validarDatos(d), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.mensaje).toContain("1-0003-00000099");
  });

  it("C3: NC asociada a una nota de débito (no es una factura) → rechazada", () => {
    const a = conFactura([{ clave: "ND", tipo: 2, cliente: "C03", emision: "2026-03-02", neto: pesos(5_000), asociadoA: "F" }, nc("NC", "2026-03-05", 1_000, "ND")]);
    const ps = de(validarDatos(a.datos), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("NC"));
    expect(ps[0]?.mensaje).toMatch(/no es una factura/);
  });

  it("C3: NC con fecha anterior a la de su factura → rechazada", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)]);
    const d = conEmision(a.datos, a.id("NC"), "2026-02-20");
    const ps = de(validarDatos(d), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.mensaje).toMatch(/anterior/);
  });

  it("C3: la NC se compara con el saldo de la factura a la fecha de la NC (después de un cobro parcial)", () => {
    // Factura 121.000,00; cobro de 100.000,00 el 03/03 → saldo 21.000,00 el 05/03.
    const cobro = recibo("R", "2026-03-03", 100_000, [{ comprobante: "F", importe: 100_000 }]);
    const valida = conFactura([nc("NC", "2026-03-05", 10_000)], [cobro]); // total 12.100,00 ≤ 21.000,00
    expect(de(validarDatos(valida.datos), "C3")).toEqual([]);
    const pasada = conFactura([nc("NC", "2026-03-05", 20_000)], [cobro]); // total 24.200,00 > 21.000,00
    const ps = de(validarDatos(pasada.datos), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(pasada.id("NC"));
  });

  it("C3: una NC posterior al cobro total de la factura se rechaza (saldo 0) y la anterior al cobro rechaza al recibo (R3), no a la NC", () => {
    const cobroTotal = recibo("R", "2026-03-03", 121_000, [{ comprobante: "F", importe: 121_000 }]);
    const despues = conFactura([nc("NC", "2026-03-05", 10_000)], [cobroTotal]);
    expect(de(validarDatos(despues.datos), "C3").map((p) => p.dato)).toEqual([despues.id("NC")]);
    const antes = conFactura([nc("NC", "2026-03-02", 10_000)], [cobroTotal]);
    expect(de(validarDatos(antes.datos), "C3")).toEqual([]);
    expect(de(validarDatos(antes.datos), "R3").map((p) => p.dato)).toEqual([antes.id("R")]);
  });

  it("C3: dos NC que juntas pasan el saldo: la segunda (por fecha) es la que se rechaza", () => {
    const a = conFactura([nc("NC1", "2026-03-05", 60_000), nc("NC2", "2026-03-06", 60_000)]); // 72.600 + 72.600 > 121.000
    const ps = de(validarDatos(a.datos), "C3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("NC2"));
  });

  it("C3: una ND asociada a una factura del mismo cliente es válida; sin asociar también", () => {
    const a = conFactura([{ clave: "ND", tipo: 2, cliente: "C03", emision: "2026-03-10", neto: pesos(24_000), asociadoA: "F" }, { clave: "ND2", tipo: 2, cliente: "C03", emision: "2026-03-11", neto: pesos(1_000) }]);
    expect(de(validarDatos(a.datos), "C3")).toEqual([]);
  });

  it("C3: una ND con emisión anterior a la de su factura se acepta (solo se rechaza la NC: la ND no cambia ningún saldo)", () => {
    const a = conFactura([{ clave: "ND", tipo: 2, cliente: "C03", emision: "2026-02-01", neto: pesos(1_000), asociadoA: "F" }]);
    expect(de(validarDatos(a.datos), "C3")).toEqual([]);
  });

  it("C3: una ND asociada a una factura de otro cliente, a una que no existe o a una NC → rechazada", () => {
    const base = conFactura([nc("NC", "2026-03-05", 10_000), { clave: "ND", tipo: 2, cliente: "C03", emision: "2026-03-10", neto: pesos(24_000), asociadoA: "F" }]);
    const deOtro = cambiarComprobante(base.datos, base.id("ND"), { clienteId: "C01" });
    expect(de(validarDatos(deOtro), "C3").some((p) => p.dato === base.id("ND") && /otro cliente/.test(p.mensaje))).toBe(true);
    const fantasma = cambiarComprobante(base.datos, base.id("ND"), { asociadoA: "1-0003-00000042" });
    expect(de(validarDatos(fantasma), "C3").some((p) => p.dato === base.id("ND") && p.mensaje.includes("1-0003-00000042"))).toBe(true);
    const aUnaNc = cambiarComprobante(base.datos, base.id("ND"), { asociadoA: base.id("NC") });
    expect(de(validarDatos(aUnaNc), "C3").some((p) => p.dato === base.id("ND") && /no es una factura/.test(p.mensaje))).toBe(true);
  });
});

describe("R1: Σ medios = Σ imputaciones + a cuenta, con a cuenta ≥ 0", () => {
  it("R1: medios 100.000,00 + 50.000,00 = 150.000,00 e imputaciones 120.000,00 → a cuenta 30.000,00, válido", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C03", emision: "2026-03-01", neto: pesos(200_000) }],
      recibos: [{ clave: "R", cliente: "C03", fecha: "2026-03-10", medios: [{ importe: pesos(100_000) }, { medio: "cheque", importe: pesos(50_000) }], imputaciones: [{ comprobante: "F", importe: pesos(120_000) }] }],
    });
    expect(de(validarDatos(a.datos), "R1")).toEqual([]);
  });

  it("R1: imputaciones de 160.000,00 contra medios de 150.000,00 → rechazado (a cuenta negativo), nombrando el recibo", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C03", emision: "2026-03-01", neto: pesos(200_000) }],
      recibos: [{ clave: "R", cliente: "C03", fecha: "2026-03-10", medios: [{ importe: pesos(100_000) }, { medio: "cheque", importe: pesos(50_000) }], imputaciones: [{ comprobante: "F", importe: pesos(160_000) }] }],
    });
    const ps = de(validarDatos(a.datos), "R1");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("R"));
    expect(ps[0]?.mensaje).toMatch(/a cuenta/);
  });

  it("R1: un medio de importe 0 o negativo se rechaza", () => {
    const a = armarDatos({ recibos: [recibo("R", "2026-03-10", 100, [], "C01")] });
    const cero = cambiarRecibo(a.datos, a.id("R"), { medios: [{ medio: "transferencia", importe: centavos(0) }] });
    expect(de(validarDatos(cero), "R1").some((p) => p.dato === a.id("R") && /medio/.test(p.mensaje))).toBe(true);
    const negativo = cambiarRecibo(a.datos, a.id("R"), { medios: [{ medio: "transferencia", importe: centavos(-5) }] });
    expect(de(validarDatos(negativo), "R1").some((p) => p.dato === a.id("R") && /medio/.test(p.mensaje))).toBe(true);
  });

  it("R1: una imputación de importe 0 se rechaza", () => {
    const a = conFactura([], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 50 }])]);
    const d = cambiarRecibo(a.datos, a.id("R"), { imputaciones: [{ comprobanteId: a.id("F"), importe: centavos(0) }] });
    expect(de(validarDatos(d), "R1").some((p) => p.dato === a.id("R") && /imputaci/.test(p.mensaje))).toBe(true);
  });

  it("R1: imputar a un comprobante de otro cliente se rechaza", () => {
    const a = conFactura([], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }], "C01")]);
    const ps = de(validarDatos(a.datos), "R1");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("R"));
    expect(ps[0]?.mensaje).toContain(a.id("F"));
    expect(ps[0]?.mensaje).toMatch(/otro cliente/);
  });

  it("R1: imputar a un comprobante que no existe se rechaza, nombrándolo", () => {
    const a = conFactura([], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }])]);
    const d = cambiarRecibo(a.datos, a.id("R"), { imputaciones: [{ comprobanteId: "1-0003-00000077", importe: pesos(100) }] });
    const ps = de(validarDatos(d), "R1");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.mensaje).toContain("1-0003-00000077");
  });

  it("R1: un recibo sin medios ni imputaciones se rechaza («no cobra nada»): no significa nada y consume un número de C2", () => {
    const a = armarDatos({ recibos: [recibo("R", "2026-03-10", 100, [], "C01")] });
    const vacio = cambiarRecibo(a.datos, a.id("R"), { medios: [], imputaciones: [] });
    const ps = de(validarDatos(vacio), "R1");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("R"));
    expect(ps[0]?.mensaje).toMatch(/no cobra nada/);
  });

  it("R1: imputaciones sin medios las rechaza el a cuenta negativo, no «no cobra nada»", () => {
    const a = conFactura([], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }])]);
    const sinMedios = cambiarRecibo(a.datos, a.id("R"), { medios: [] });
    const ps = de(validarDatos(sinMedios), "R1");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.mensaje).toMatch(/a cuenta/);
  });

  it("R1: un pago a cuenta (sin imputaciones) es válido", () => {
    const a = armarDatos({ recibos: [recibo("R", "2026-10-20", 50_000, [], "C07")] });
    expect(validarDatos(a.datos)).toEqual([]);
  });
});

describe("R3: la imputación no supera el saldo a la fecha del recibo ni va a un comprobante posterior", () => {
  it("R3: recibo que imputa 121.000,01 a un comprobante con saldo 121.000,00 → el validador lo rechaza", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C03", emision: "2026-03-01", neto: pesos(100_000) }],
      recibos: [{ clave: "R", cliente: "C03", fecha: "2026-04-01", medios: [{ importe: centavos(12_100_001) }], imputaciones: [{ comprobante: "F", importe: centavos(12_100_001) }] }],
    });
    const ps = de(validarDatos(a.datos), "R3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("R"));
    expect(ps[0]?.mensaje).toContain(a.id("F"));
    expect(ps[0]?.mensaje).toMatch(/saldo/);
  });

  it("R3: imputar exactamente el saldo (121.000,00) es válido", () => {
    const a = conFactura([], [recibo("R", "2026-04-01", 121_000, [{ comprobante: "F", importe: 121_000 }])]);
    expect(validarDatos(a.datos)).toEqual([]);
  });

  it("R3: recibo del 2026-05-09 que imputa a un comprobante emitido el 2026-05-10 → rechazado", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C03", emision: "2026-05-10", neto: pesos(100_000) }],
      recibos: [recibo("R", "2026-05-09", 50_000, [{ comprobante: "F", importe: 50_000 }])],
    });
    const ps = de(validarDatos(a.datos), "R3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("R"));
    expect(ps[0]?.mensaje).toMatch(/posterior|después/);
  });

  it("R3: un recibo del mismo día en que se emite el comprobante es válido", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C03", emision: "2026-05-10", neto: pesos(100_000) }],
      recibos: [recibo("R", "2026-05-10", 50_000, [{ comprobante: "F", importe: 50_000 }])],
    });
    expect(validarDatos(a.datos)).toEqual([]);
  });

  it("R3: el segundo cobro no puede pasar lo que queda después del primero (saldo a la fecha del recibo)", () => {
    const r1 = recibo("R1", "2026-03-10", 100_000, [{ comprobante: "F", importe: 100_000 }]);
    const justo = conFactura([], [r1, recibo("R2", "2026-03-11", 21_000, [{ comprobante: "F", importe: 21_000 }])]);
    expect(validarDatos(justo.datos)).toEqual([]);
    const pasado = conFactura([], [r1, { ...recibo("R2", "2026-03-11", 21_000, []), medios: [{ importe: centavos(2_100_001) }], imputaciones: [{ comprobante: "F", importe: centavos(2_100_001) }] }]);
    const ps = de(validarDatos(pasado.datos), "R3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(pasado.id("R2"));
  });

  it("R3: el resultado no depende del orden en que vienen los recibos en la lista", () => {
    const a = conFactura([], [recibo("R1", "2026-03-10", 100_000, [{ comprobante: "F", importe: 100_000 }]), recibo("R2", "2026-03-11", 30_000, [{ comprobante: "F", importe: 30_000 }])]);
    const normal = de(validarDatos(a.datos), "R3").map((p) => p.dato);
    const alReves = de(validarDatos({ ...a.datos, recibos: [...a.datos.recibos].reverse() }), "R3").map((p) => p.dato);
    expect(normal).toEqual([a.id("R2")]); // 100.000 + 30.000 > 121.000
    expect(alReves).toEqual(normal);
  });

  it("R3: el cobro que se pasa se informa y no se descuenta: el siguiente, que sí entra, no se marca", () => {
    const a = conFactura([], [recibo("A", "2026-03-10", 150_000, [{ comprobante: "F", importe: 150_000 }]), recibo("B", "2026-03-11", 100_000, [{ comprobante: "F", importe: 100_000 }])]);
    expect(de(validarDatos(a.datos), "R3").map((p) => p.dato)).toEqual([a.id("A")]);
  });

  it("R3: una NC no tiene saldo propio: imputarle un cobro se rechaza", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }])]);
    const d = cambiarRecibo(a.datos, a.id("R"), { imputaciones: [{ comprobanteId: a.id("NC"), importe: pesos(100) }] });
    const ps = de(validarDatos(d), "R3");
    expect(ps).toHaveLength(1);
    expect(ps[0]?.dato).toBe(a.id("R"));
    expect(ps[0]?.mensaje).toMatch(/nota de crédito/);
  });

  it("R3 y C3: el mismo día los comprobantes van antes que los recibos (el orden de la cuenta corriente)", () => {
    // Factura 121.000,00; NC de 60.500,00 y recibo de 60.500,00, los dos el 05/03: entran justo.
    const justo = conFactura([nc("NC", "2026-03-05", 50_000)], [recibo("R", "2026-03-05", 60_500, [{ comprobante: "F", importe: 60_500 }])]);
    expect(validarDatos(justo.datos)).toEqual([]);
    // Con un centavo más de recibo, el que se pasa es el recibo, no la NC.
    const pasado = conFactura([nc("NC", "2026-03-05", 50_000)], [{ ...recibo("R", "2026-03-05", 60_500, []), medios: [{ importe: centavos(6_050_001) }], imputaciones: [{ comprobante: "F", importe: centavos(6_050_001) }] }]);
    expect(de(validarDatos(pasado.datos), "R3").map((p) => p.dato)).toEqual([pasado.id("R")]);
    expect(de(validarDatos(pasado.datos), "C3")).toEqual([]);
  });

  it("R3: una ND tiene su propio saldo (T16): un cobro de la ND no toca el de la factura", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "F", cliente: "C13", emision: "2026-03-10", neto: pesos(600_000) },
        { clave: "ND", tipo: 2, cliente: "C13", emision: "2026-04-02", neto: pesos(24_000), asociadoA: "F" },
      ],
      recibos: [recibo("R", "2026-06-15", 29_040, [{ comprobante: "ND", importe: 29_040 }], "C13")],
    });
    expect(validarDatos(a.datos)).toEqual([]);
  });
});

describe("G5: con datos dañados los validadores informan y no lanzan (diseno.md, sección 8)", () => {
  const MALO_DECIMAL = 1.5 as Centavos;
  const MALO_NAN = Number.NaN as Centavos;
  const medio = (importe: Centavos): { medio: "transferencia"; importe: Centavos } => ({ medio: "transferencia", importe });

  it("R1: dos medios de 6 × 10^11 (la suma pasa el tope) → un problema que nombra el recibo, sin lanzar", () => {
    const a = armarDatos({ recibos: [recibo("R", "2026-03-10", 100, [], "C01")] });
    const d = cambiarRecibo(a.datos, a.id("R"), { medios: [medio(centavos(600_000_000_000)), medio(centavos(600_000_000_000))] });
    expect(() => validarDatos(d)).not.toThrow();
    const ps = de(validarDatos(d), "R1");
    expect(ps.some((p) => p.dato === a.id("R") && /tope/.test(p.mensaje))).toBe(true);
  });

  it("R1: lo mismo con imputaciones cuya suma pasa el tope", () => {
    const a = conFactura([], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }])]);
    const gigante = { comprobanteId: a.id("F"), importe: centavos(TOPE_CENTAVOS) };
    const d = cambiarRecibo(a.datos, a.id("R"), { medios: [medio(centavos(TOPE_CENTAVOS))], imputaciones: [gigante, gigante] });
    expect(() => validarDatos(d)).not.toThrow();
    expect(de(validarDatos(d), "R1").some((p) => p.dato === a.id("R") && /tope/.test(p.mensaje))).toBe(true);
  });

  it("R1: un medio de 1,5 o NaN se nombra como importe que no es un entero de centavos, sin lanzar", () => {
    const a = armarDatos({ recibos: [recibo("R", "2026-03-10", 100, [], "C01")] });
    for (const malo of [MALO_DECIMAL, MALO_NAN]) {
      const d = cambiarRecibo(a.datos, a.id("R"), { medios: [medio(malo)] });
      expect(() => validarDatos(d)).not.toThrow();
      expect(de(validarDatos(d), "R1").some((p) => p.dato === a.id("R") && /entero/.test(p.mensaje)), String(malo)).toBe(true);
    }
  });

  it("R1 y R3: una imputación de 1,5 o NaN se nombra y no rompe el cálculo de saldos", () => {
    const a = conFactura([], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }])]);
    for (const malo of [MALO_DECIMAL, MALO_NAN]) {
      const d = cambiarRecibo(a.datos, a.id("R"), { imputaciones: [{ comprobanteId: a.id("F"), importe: malo }] });
      expect(() => validarDatos(d), String(malo)).not.toThrow();
      expect(de(validarDatos(d), "R1").some((p) => p.dato === a.id("R") && /entero/.test(p.mensaje)), String(malo)).toBe(true);
    }
  });

  it("C3 y G5: una NC o una factura con total NaN se nombra y no rompe el cálculo de saldos", () => {
    const a = conFactura([nc("NC", "2026-03-05", 10_000)], [recibo("R", "2026-03-10", 100, [{ comprobante: "F", importe: 100 }])]);
    const ncRota = cambiarComprobante(a.datos, a.id("NC"), { total: MALO_NAN });
    expect(() => validarDatos(ncRota)).not.toThrow();
    expect(de(validarDatos(ncRota), "G5").some((p) => p.dato === a.id("NC"))).toBe(true);
    const facturaRota = cambiarComprobante(a.datos, a.id("F"), { total: MALO_NAN });
    expect(() => validarDatos(facturaRota)).not.toThrow();
    expect(de(validarDatos(facturaRota), "G5").some((p) => p.dato === a.id("F"))).toBe(true);
  });

  it("G5: un neto o un IVA de 1,5 o NaN se nombra, sin lanzar", () => {
    const a = conFactura();
    for (const malo of [MALO_DECIMAL, MALO_NAN]) {
      for (const campo of ["neto", "iva"] as const) {
        const d = cambiarComprobante(a.datos, a.id("F"), { [campo]: malo });
        expect(() => validarDatos(d), `${campo} ${malo}`).not.toThrow();
        expect(de(validarDatos(d), "G5").some((p) => p.dato === a.id("F")), `${campo} ${malo}`).toBe(true);
      }
    }
  });

  it("C4 y G5: un cliente con plazo −1 (o 1,5) se nombra y no hace lanzar al vencimiento de sus comprobantes", () => {
    const a = conFactura();
    for (const plazo of [-1, 1.5]) {
      const d: Datos = { ...a.datos, clientes: a.datos.clientes.map((c) => (c.id === "C03" ? { ...c, plazoDias: plazo as never } : c)) };
      expect(() => validarDatos(d), String(plazo)).not.toThrow();
      const ps = validarDatos(d).filter((p) => p.dato === "C03");
      expect(ps, String(plazo)).toHaveLength(1);
      expect(ps[0]?.regla).toBe("G5");
      expect(ps[0]?.mensaje).toMatch(/plazo/);
    }
  });
});
