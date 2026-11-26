// Los casos plantados de docs/diseno.md, 5.3, como constantes: comprobantes y recibos literales (no usan el azar), con su alias estable.
// Acá se prueban solo las constantes, numeradas por su cuenta; sobre la semilla publicada están en `referencia.test.ts` (G3).
import { describe, expect, it } from "vitest";
import { CLIENTES_BASE } from "../src/lib/datos/clientes.ts";
import { PUNTO_DE_VENTA } from "../src/lib/datos/constantes.ts";
import { cuitValido } from "../src/lib/datos/cuit.ts";
import { ALIAS_DE_COMPROBANTES, ALIAS_DE_RECIBOS, COMPROBANTES_PLANTADOS, RECIBOS_PLANTADOS } from "../src/lib/datos/plantados.ts";
import { numerarComprobantes, numerarRecibos } from "../src/lib/dominio/comprobantes.ts";
import { validarDatos } from "../src/lib/dominio/validadores.ts";
import { pesos } from "./fixtures/armarDatos.ts";

const numerados = numerarComprobantes(COMPROBANTES_PLANTADOS, CLIENTES_BASE, PUNTO_DE_VENTA);
const recibos = numerarRecibos(RECIBOS_PLANTADOS, numerados.idPorClave, PUNTO_DE_VENTA);
const comprobante = (alias: string) => {
  const id = numerados.idPorClave.get(alias);
  const c = numerados.comprobantes.find((x) => x.id === id);
  if (c === undefined) throw new Error(`no hay ${alias}`);
  return c;
};
const reciboDe = (alias: string) => {
  const id = recibos.idPorClave.get(alias);
  const r = recibos.recibos.find((x) => x.id === id);
  if (r === undefined) throw new Error(`no hay ${alias}`);
  return r;
};

/** La tabla de comprobantes de 5.3, escrita a mano: alias, cliente, tipo, emisión, vencimiento, neto, IVA y total (en pesos). */
const TABLA_COMPROBANTES = [
  ["T02-F", "C03", 1, "2026-07-10", "2026-08-09", 1_000_000, 210_000, 1_210_000],
  ["T04-F", "C01", 1, "2026-09-16", "2026-10-31", 250_000, 52_500, 302_500],
  ["T05-F", "C05", 1, "2026-09-25", "2026-10-25", 300_000, 63_000, 363_000],
  ["T07-F", "C09", 1, "2026-06-15", "2026-08-14", 200_000, 42_000, 242_000],
  ["T08-F", "C02", 1, "2026-02-14", "2026-04-15", 1_000_000, 210_000, 1_210_000],
  ["T12-d91", "C05", 1, "2026-07-02", "2026-08-01", 900_000, 189_000, 1_089_000],
  ["T17-NC", "C05", 3, "2026-07-20", "2026-07-20", 100_000, 21_000, 121_000],
] as const;

/** Los recibos de 5.3: alias, cliente, fecha, medios (medio, pesos) e imputaciones (alias del comprobante, pesos). */
const TABLA_RECIBOS = [
  ["T02-R1", "C03", "2026-07-31", [["transferencia", 400_000]], [["T02-F", 400_000]]],
  ["T02-R2", "C03", "2026-09-15", [["transferencia", 400_000]], [["T02-F", 400_000]]],
  ["T02-R3", "C03", "2026-10-12", [["transferencia", 410_000]], [["T02-F", 410_000]]],
  ["T05-R", "C05", "2026-11-03", [["transferencia", 363_000]], [["T05-F", 363_000]]],
  ["T06-R", "C07", "2026-10-20", [["transferencia", 50_000]], []],
  ["T07-R", "C09", "2026-08-10", [["transferencia", 300_000]], [["T07-F", 242_000]]],
  ["T08-R", "C02", "2026-04-30", [["transferencia", 1_170_000], ["retencion-iibb", 25_000], ["retencion-ganancias", 15_000]], [["T08-F", 1_210_000]]],
  ["T17-R1", "C05", "2026-08-12", [["transferencia", 234_000], ["retencion-iibb", 5_000], ["retencion-ganancias", 3_000]], [["T12-d91", 242_000]]],
  ["T17-R2", "C05", "2026-10-14", [["transferencia", 121_000]], [["T12-d91", 121_000]]],
] as const;

describe("G3 (5.3): los comprobantes plantados, con sus importes y fechas", () => {
  it("son exactamente los de la tabla, en su orden", () => {
    expect(COMPROBANTES_PLANTADOS.map((c) => c.clave)).toEqual(TABLA_COMPROBANTES.map((f) => f[0]));
    expect([...ALIAS_DE_COMPROBANTES]).toEqual(TABLA_COMPROBANTES.map((f) => f[0]));
  });

  it.each(TABLA_COMPROBANTES.map((f) => [f[0], f] as const))("%s: cliente, tipo, emisión, vencimiento, neto, IVA y total", (alias, [, cliente, tipo, emision, vencimiento, neto, iva, total]) => {
    const c = comprobante(alias);
    expect([c.clienteId, c.tipo, c.emision, c.vencimiento]).toEqual([cliente, tipo, emision, vencimiento]);
    expect([c.neto, c.iva, c.total]).toEqual([pesos(neto), pesos(iva), pesos(total)]);
  });

  it("T17-NC está asociada a T12-d91 y ninguna otra lleva asociación", () => {
    expect(comprobante("T17-NC").asociadoA).toBe(comprobante("T12-d91").id);
    expect(numerados.comprobantes.filter((c) => c.asociadoA !== null)).toHaveLength(1);
  });
});

describe("G3 (5.3): los recibos plantados, con sus medios e imputaciones", () => {
  it("son exactamente los de la tabla, en su orden", () => {
    expect(RECIBOS_PLANTADOS.map((r) => r.clave)).toEqual(TABLA_RECIBOS.map((f) => f[0]));
    expect([...ALIAS_DE_RECIBOS]).toEqual(TABLA_RECIBOS.map((f) => f[0]));
  });

  it.each(TABLA_RECIBOS.map((f) => [f[0], f] as const))("%s: cliente, fecha, medios e imputaciones", (alias, [, cliente, fecha, medios, imputaciones]) => {
    const r = reciboDe(alias);
    expect([r.clienteId, r.fecha]).toEqual([cliente, fecha]);
    expect(r.medios).toEqual(medios.map(([medio, importe]) => ({ medio, importe: pesos(importe) })));
    expect(r.imputaciones).toEqual(imputaciones.map(([c, importe]) => ({ comprobanteId: comprobante(c).id, importe: pesos(importe) })));
  });

  it("G2: el único recibo posterior al 2026-10-31 es el de T05-F (2026-11-03)", () => {
    expect(recibos.recibos.filter((r) => r.fecha > "2026-10-31").map((r) => r.fecha)).toEqual(["2026-11-03"]);
  });

  it("T06: sin imputaciones, todo a cuenta (50.000,00); T07: 300.000,00 con 242.000,00 imputados, a cuenta 58.000,00", () => {
    expect(reciboDe("T06-R").imputaciones).toEqual([]);
    const t07 = reciboDe("T07-R");
    expect(t07.medios.reduce((s, m) => s + m.importe, 0) - t07.imputaciones.reduce((s, i) => s + i.importe, 0)).toBe(pesos(58_000));
  });

  it("T08: la factura de 1.210.000,00 se cancela con 1.170.000,00 de transferencia + 25.000,00 de IIBB + 15.000,00 de Ganancias", () => {
    expect(reciboDe("T08-R").medios.map((m) => m.importe).reduce((a, b) => a + b, 0)).toBe(pesos(1_210_000));
  });
});

describe("5.3: los plantados solos son datos válidos (C2, C3, R1, R3, C4 y G5)", () => {
  it("armados con los 13 clientes pasan los validadores", () => {
    const cuit = "30990000030"; // con dígito verificador válido
    expect(cuitValido(cuit)).toBe(true);
    const datos = {
      version: 1 as const,
      semilla: 0,
      desde: "2025-01-01",
      hasta: "2026-10-31",
      empresa: { nombre: "x Demo", cuit, puntoVenta: 3 },
      clientes: CLIENTES_BASE.map((c) => ({ id: c.id, razonSocial: c.razonSocial, cuit, plazoDias: c.plazoDias })),
      comprobantes: numerados.comprobantes,
      recibos: recibos.recibos,
    };
    expect(validarDatos(datos)).toEqual([]);
  });
});
