// Los fixtures de docs/diseno.md, sección 5.5, escritos con `armarDatos`: acá se comprueba lo que se puede decir con las funciones de comprobantes y fechas
// (importes, vencimientos, atrasos como días entre fechas, facturación por mes). Saldos, tramos y mora se prueban en `corte.test.ts`.
import { describe, expect, it } from "vitest";
import { clientesQueFacturaron, comprobantesDelMes, facturacionDelMes, importeFirmado, mesDeEmision } from "../src/lib/dominio/comprobantes.ts";
import { formatearPorcentaje, porcentajes, sumarLista } from "../src/lib/dominio/dinero.ts";
import { diasEntre } from "../src/lib/dominio/fechas.ts";
import type { Comprobante, Datos } from "../src/lib/dominio/tipos.ts";
import type { Armado } from "./fixtures/armarDatos.ts";
import { pesos } from "./fixtures/armarDatos.ts";
import { NB } from "./fixtures/formato.ts";
import { FIXTURES, fixtureR4, fixtureT01, fixtureT03, fixtureT09, fixtureT10, fixtureT11, fixtureT12, fixtureT13, fixtureT14, fixtureT15, fixtureT16 } from "./fixtures/casos.ts";

function cmp(a: Armado, clave: string): Comprobante {
  const id = a.id(clave);
  const c = a.datos.comprobantes.find((x) => x.id === id);
  if (c === undefined) throw new Error(`El fixture no tiene el comprobante ${clave}`);
  return c;
}
const atrasoAl = (c: Comprobante, corte: string): number => diasEntre(c.vencimiento, corte);
const aCuenta = (datos: Datos, reciboId: string): number => {
  const r = datos.recibos.find((x) => x.id === reciboId);
  if (r === undefined) throw new Error(`No hay recibo ${reciboId}`);
  return sumarLista(r.medios.map((m) => m.importe)) - sumarLista(r.imputaciones.map((i) => i.importe));
};

describe("fixtures: forma general", () => {
  it("hay un fixture por cada alias de la tabla 5.5 (T01, T03, T09 a T16 y R4) y cada uno trae los 13 clientes", () => {
    expect(Object.keys(FIXTURES)).toEqual(["T01", "T03", "T09", "T10", "T11", "T12", "T13", "T14", "T15", "T16", "R4"]);
    for (const f of Object.values(FIXTURES)) expect(f().datos.clientes).toHaveLength(13);
  });

  it("cada fixture se arma siempre igual (sin azar ni reloj)", () => {
    for (const f of Object.values(FIXTURES)) expect(f().datos).toEqual(f().datos);
  });
});

describe("fixture T01 (C1, S2)", () => {
  it("la factura de C06 vence el 26/06 (plazo 45), la NC repite su neto y la facturación de mayo con el par es la de mayo sin el par", () => {
    const a = fixtureT01();
    expect(cmp(a, "T01-F")).toMatchObject({ clienteId: "C06", emision: "2026-05-12", vencimiento: "2026-06-26", neto: pesos(500_000), total: pesos(605_000) });
    expect(cmp(a, "T01-NC")).toMatchObject({ tipo: 3, emision: "2026-05-20", total: pesos(605_000), asociadoA: a.id("T01-F") });
    expect(facturacionDelMes(a.datos.comprobantes, "2026-05")).toBe(pesos(0));
    expect(facturacionDelMes(a.datos.comprobantes.filter((c) => c.tipo !== 3 && c.id !== a.id("T01-F")), "2026-05")).toBe(pesos(0));
    expect(atrasoAl(cmp(a, "T01-F"), "2026-05-15")).toBe(-42);
  });
});

describe("fixture T03 (S3)", () => {
  it("la factura de C08 (plazo 15) vence el 31/07, el día del cobro: atraso -1 al 30/07 y 0 al 31/07", () => {
    const a = fixtureT03();
    const f = cmp(a, "T03-F");
    expect(f).toMatchObject({ clienteId: "C08", emision: "2026-07-16", vencimiento: "2026-07-31", total: pesos(242_000) });
    expect(atrasoAl(f, "2026-07-30")).toBe(-1);
    expect(atrasoAl(f, "2026-07-31")).toBe(0);
    expect(a.datos.recibos).toHaveLength(1);
    expect(a.datos.recibos[0]).toMatchObject({ fecha: "2026-07-31", imputaciones: [{ comprobanteId: f.id, importe: pesos(242_000) }] });
  });
});

describe("fixture T09 (C5, D3)", () => {
  it("C5: la facturación de C06 en julio es −500.000,00 sin IVA y −605.000,00 con IVA (−500.000,00 de neto y −105.000,00 de IVA)", () => {
    const a = fixtureT09();
    const julio = comprobantesDelMes(a.datos.comprobantes, "2026-07").filter((c) => c.clienteId === "C06");
    expect(julio).toHaveLength(2);
    expect(facturacionDelMes(a.datos.comprobantes, "2026-07", "C06")).toBe(pesos(-500_000));
    expect(sumarLista(julio.map((c) => importeFirmado(c, "total")))).toBe(pesos(-605_000));
    expect(sumarLista(julio.map((c) => importeFirmado(c, "iva")))).toBe(pesos(-105_000));
    expect(atrasoAl(cmp(a, "T09-F"), "2026-06-30")).toBe(-25);
  });
});

describe("fixture T10 (M2, D3)", () => {
  it("tres facturas de neto 1.000,50 en febrero de 2025: IVA de cada una 210,11, del mes 630,33 y facturado con IVA 3.631,83", () => {
    const a = fixtureT10();
    const febrero = comprobantesDelMes(a.datos.comprobantes, "2025-02");
    expect(febrero).toHaveLength(3);
    expect(a.datos.comprobantes).toHaveLength(3);
    expect(febrero.map((c) => c.iva)).toEqual([21011, 21011, 21011]);
    expect(sumarLista(febrero.map((c) => c.iva))).toBe(63033);
    expect(sumarLista(febrero.map((c) => c.neto))).toBe(300150);
    expect(sumarLista(febrero.map((c) => c.total))).toBe(363183);
  });
});

describe("fixture T11 (M3)", () => {
  it("C05, C10 y C11 con una factura impaga de 363.000,00 y atraso 61, 75 y 90 al 31/10", () => {
    const a = fixtureT11();
    const cs = ["T11-C05", "T11-C10", "T11-C11"].map((k) => cmp(a, k));
    expect(cs.map((c) => c.clienteId)).toEqual(["C05", "C10", "C11"]);
    expect(cs.map((c) => c.total)).toEqual([pesos(363_000), pesos(363_000), pesos(363_000)]);
    expect(cs.map((c) => atrasoAl(c, "2026-10-31"))).toEqual([61, 75, 90]);
    expect(a.datos.recibos).toEqual([]);
  });

  it("M3: el aporte de cada cliente al tramo 61–90 es 33,3 (C05) + 33,3 (C10) + 33,4 (C11, «Camiones…» antes que «Contratista…» y «Servicios…»)", () => {
    const a = fixtureT11();
    const porCliente = [...a.datos.comprobantes].sort((x, y) => (x.clienteId < y.clienteId ? -1 : 1)); // C05, C10, C11
    const aportes = porCliente.map((c) => ({ nombre: a.datos.clientes.find((x) => x.id === c.clienteId)?.razonSocial ?? "", importe: c.total }));
    const texto = porcentajes(aportes).map((m) => formatearPorcentaje(m));
    expect(texto).toEqual([`33,3${NB}%`, `33,3${NB}%`, `33,4${NB}%`]);
  });
});

describe("fixture T12 (A1, A2, S4, D1)", () => {
  it("siete facturas sin cobros, plazo 30 salvo T04-F (C01, plazo 45), con los totales de la tabla", () => {
    const a = fixtureT12();
    expect(a.datos.comprobantes).toHaveLength(7);
    expect(a.datos.recibos).toEqual([]);
    const total = (k: string): number => cmp(a, k).total;
    expect([total("d30"), total("d31"), total("d60"), total("d61"), total("d90"), total("d91f"), total("T04-F")]).toEqual(
      [242_000, 181_500, 484_000, 363_000, 363_000, 605_000, 302_500].map(pesos),
    );
  });

  it("al 31/10 los atrasos son 30, 31, 60, 61, 90, 91 y 0", () => {
    const a = fixtureT12();
    expect(["d30", "d31", "d60", "d61", "d90", "d91f", "T04-F"].map((k) => atrasoAl(cmp(a, k), "2026-10-31"))).toEqual([30, 31, 60, 61, 90, 91, 0]);
  });

  it("los clientes de la tabla: d30 y d60 de C07, d31 de C03, d61 y d91f de C05, d90 de C11", () => {
    const a = fixtureT12();
    expect(["d30", "d31", "d60", "d61", "d90", "d91f", "T04-F"].map((k) => cmp(a, k).clienteId)).toEqual(["C07", "C03", "C07", "C05", "C11", "C05", "C01"]);
  });

  it("la suma de los seis vencidos es la mora de la tabla, 2.238.500,00, y con T04-F el saldo es 2.541.000,00", () => {
    const a = fixtureT12();
    const vencidos = ["d30", "d31", "d60", "d61", "d90", "d91f"].map((k) => cmp(a, k).total);
    expect(sumarLista(vencidos)).toBe(pesos(2_238_500));
    expect(sumarLista(a.datos.comprobantes.map((c) => c.total))).toBe(pesos(2_541_000));
  });
});

describe("fixture T13 (C5)", () => {
  it("T13-F1 es de diciembre de 2025 y T13-F2 de enero de 2026; un recibo del 13/02 de 266.200,00 imputa 121.000,00 y 145.200,00", () => {
    const a = fixtureT13();
    expect(mesDeEmision(cmp(a, "T13-F1"))).toBe("2025-12");
    expect(mesDeEmision(cmp(a, "T13-F2"))).toBe("2026-01");
    expect(a.datos.recibos).toHaveLength(1);
    const r = a.datos.recibos[0];
    expect(r?.fecha).toBe("2026-02-13");
    expect(sumarLista(r?.medios.map((m) => m.importe) ?? [])).toBe(pesos(266_200));
    expect(r?.imputaciones.map((i) => i.importe)).toEqual([pesos(121_000), pesos(145_200)]);
  });

  it("al 31/01 los atrasos son -14 (T13-F1) y -15 (T13-F2)", () => {
    const a = fixtureT13();
    expect(atrasoAl(cmp(a, "T13-F1"), "2026-01-31")).toBe(-14);
    expect(atrasoAl(cmp(a, "T13-F2"), "2026-01-31")).toBe(-15);
  });
});

describe("fixture T14 (S1, S7)", () => {
  it("T14-F1 se emite el 30/09 y T14-F2 el 01/10, cada una cobrada a los 15 días", () => {
    const a = fixtureT14();
    expect(cmp(a, "T14-F1")).toMatchObject({ clienteId: "C08", emision: "2026-09-30", vencimiento: "2026-10-15" });
    expect(cmp(a, "T14-F2")).toMatchObject({ clienteId: "C08", emision: "2026-10-01", vencimiento: "2026-10-16" });
    expect(a.datos.recibos.map((r) => r.fecha)).toEqual(["2026-10-15", "2026-10-16"]);
  });

  it("C5: la facturación de septiembre incluye solo T14-F1 y la de octubre solo T14-F2", () => {
    const a = fixtureT14();
    expect(facturacionDelMes(a.datos.comprobantes, "2026-09")).toBe(pesos(100_000));
    expect(facturacionDelMes(a.datos.comprobantes, "2026-10")).toBe(pesos(100_000));
    expect(comprobantesDelMes(a.datos.comprobantes, "2026-09").map((c) => c.id)).toEqual([a.id("T14-F1")]);
    expect(comprobantesDelMes(a.datos.comprobantes, "2026-10").map((c) => c.id)).toEqual([a.id("T14-F2")]);
  });
});

describe("fixture T15 (D3)", () => {
  it("el cliente tiene su último comprobante en octubre de 2025 y su último recibo en noviembre de 2025, ya cobrado; sigue en la lista de clientes", () => {
    const a = fixtureT15();
    expect(a.datos.comprobantes).toHaveLength(1);
    expect(a.datos.comprobantes[0]?.emision).toBe("2025-10-15");
    expect(a.datos.recibos[0]?.fecha).toBe("2025-11-10");
    expect(a.datos.recibos[0]?.imputaciones[0]?.importe).toBe(a.datos.comprobantes[0]?.total);
    expect(a.datos.clientes.some((c) => c.id === a.datos.comprobantes[0]?.clienteId)).toBe(true);
    expect(clientesQueFacturaron(a.datos.comprobantes, "2026-10")).toEqual([]);
  });
});

describe("fixture T16 (C1)", () => {
  it("la ND de 24.000,00 neto (29.040,00 con IVA) asociada a T16-F vence el 02/05: atraso -2 al 30/04 y 29 al 31/05", () => {
    const a = fixtureT16();
    const nd = cmp(a, "T16-ND");
    expect(nd).toMatchObject({ tipo: 2, emision: "2026-04-02", vencimiento: "2026-05-02", total: pesos(29_040), asociadoA: a.id("T16-F") });
    expect(atrasoAl(nd, "2026-04-30")).toBe(-2);
    expect(atrasoAl(nd, "2026-05-31")).toBe(29);
  });

  it("C1: la ND suma 24.000,00 a la facturación de abril", () => {
    const a = fixtureT16();
    expect(facturacionDelMes(a.datos.comprobantes, "2026-04")).toBe(pesos(24_000));
    expect(facturacionDelMes(a.datos.comprobantes, "2026-03")).toBe(pesos(600_000));
  });

  it("T16-F se cobra el 09/04 y la ND el 15/06", () => {
    const a = fixtureT16();
    expect(a.datos.recibos.map((r) => [r.fecha, r.imputaciones[0]?.comprobanteId])).toEqual([
      ["2026-04-09", a.id("T16-F")],
      ["2026-06-15", a.id("T16-ND")],
    ]);
  });
});

describe("fixture R4 (T06)", () => {
  it("C07 con d30 y d60 de T12 y un recibo de 50.000,00 sin imputar: a cuenta 50.000,00", () => {
    const a = fixtureR4();
    expect(a.datos.comprobantes.map((c) => [c.clienteId, c.total])).toEqual([
      ["C07", pesos(484_000)], // d60 (2026-08-02)
      ["C07", pesos(242_000)], // d30 (2026-09-01)
    ]);
    expect(a.datos.comprobantes.map((c) => atrasoAl(c, "2026-10-31"))).toEqual([60, 30]);
    expect(a.datos.recibos).toHaveLength(1);
    expect(aCuenta(a.datos, a.datos.recibos[0]?.id ?? "")).toBe(pesos(50_000));
    expect(a.datos.recibos[0]?.imputaciones).toEqual([]);
  });
});
