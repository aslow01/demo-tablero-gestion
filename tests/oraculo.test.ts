// El oráculo independiente (`scripts/oraculo.mjs`): recalcula las 15 medidas desde los datos crudos sin importar nada del dominio. Se prueba
// primero contra los números escritos a mano de los fixtures (que es lo que lo hace confiable) y después se lo usa para verificar a los dos
// caminos de `src/lib/dominio` sobre los datos del generador (docs/diseno.md, 5.4: «se verifican con un script independiente»).
import { describe, expect, it } from "vitest";
import { calcularOraculo } from "../scripts/oraculo.mjs";
import { SEMILLA_PUBLICADA } from "../src/lib/datos/constantes.ts";
import { generar } from "../src/lib/datos/generador.ts";
import { CLAVES_DEL_CATALOGO } from "../src/lib/dominio/claves.ts";
import { cierresDeMes } from "../src/lib/dominio/corte.ts";
import { medida } from "../src/lib/dominio/medidas.ts";
import { sumarLista } from "../src/lib/dominio/dinero.ts";
import { sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Datos } from "../src/lib/dominio/tipos.ts";
import { fixtureEjemploD3, fixtureR4, fixtureRetencionIva, fixtureT07, fixtureT08, fixtureT09, fixtureT10, fixtureT12, fixtureT17 } from "./fixtures/casos.ts";
import { generarProvisional } from "./fixtures/generadorProvisional.ts";

describe("el oráculo contra los números escritos a mano de docs/diseno.md (5.3 y 5.5)", () => {
  it("T12 al 31/10: saldo 2.541.000,00, mora 2.238.500,00 en 6 comprobantes y 4 clientes, tramos 302.500 · 242.000 · 665.500 · 726.000 · 605.000", () => {
    const o = calcularOraculo(fixtureT12().datos, "2026-10-31");
    expect(o.empresa.saldo).toBe(254_100_000);
    expect(o.empresa.mora).toBe(223_850_000);
    expect([o.empresa["tramo-no-vencido"], o.empresa["tramo-1-30"], o.empresa["tramo-31-60"], o.empresa["tramo-61-90"], o.empresa["tramo-mas-90"]]).toEqual([30_250_000, 24_200_000, 66_550_000, 72_600_000, 60_500_000]);
    expect([o.comprobantesEnMora, o.clientesEnMora]).toEqual([6, 4]);
    expect(Object.fromEntries(Object.entries(o.moraPorCliente).map(([id, m]) => [id, m.importe]))).toEqual({ C07: 72_600_000, C03: 18_150_000, C05: 96_800_000, C11: 36_300_000 });
  });

  it("T17 (T12-d91): saldo 968.000,00 · 726.000,00 · 726.000,00 · 605.000,00 al 31/07, 31/08, 30/09 y 31/10", () => {
    const d = fixtureT17().datos;
    expect(["2026-07-31", "2026-08-31", "2026-09-30", "2026-10-31"].map((c) => calcularOraculo(d, c).empresa.saldo)).toEqual([96_800_000, 72_600_000, 72_600_000, 60_500_000]);
    expect(calcularOraculo(d, "2026-10-31").moraPorCliente["C05"]?.masAtrasado.atraso).toBe(91);
  });

  it("R4 (T06): pagos a cuenta 50.000,00 y saldo neto 676.000,00; T07: saldo a favor 58.000,00 y saldo neto −58.000,00; D3: A = 50.000,00", () => {
    const r4 = calcularOraculo(fixtureR4().datos, "2026-10-31").empresa;
    expect([r4["pagos-a-cuenta"], r4["saldos-a-favor"], r4["saldo-neto"]]).toEqual([5_000_000, 0, 67_600_000]);
    const t07 = calcularOraculo(fixtureT07().datos, "2026-08-31").empresa;
    expect([t07["pagos-a-cuenta"], t07["saldos-a-favor"], t07["saldo-neto"]]).toEqual([0, 5_800_000, -5_800_000]);
    expect(calcularOraculo(fixtureEjemploD3().datos, "2026-03-31").empresa["pagos-a-cuenta"]).toBe(5_000_000);
  });

  it("T09: facturación de julio −500.000,00 y con IVA −605.000,00; T10: IVA de febrero 630,33 (no 630,32)", () => {
    const t09 = calcularOraculo(fixtureT09().datos, "2026-07-31").empresa;
    expect([t09["facturacion-mes"], t09["iva-mes"], t09["facturado-con-iva-mes"]]).toEqual([-50_000_000, -10_500_000, -60_500_000]);
    expect(calcularOraculo(fixtureT10().datos, "2025-02-28").empresa["iva-mes"]).toBe(63_033);
  });
});

describe("el oráculo contra los números escritos a mano de cobranza y retenciones (T08 y la retención de IVA)", () => {
  it("T08 al 30/04: cobranza del mes 1.210.000,00 (todos los medios) y retenciones 40.000,00 (IIBB y Ganancias); saldo 0", () => {
    const e = calcularOraculo(fixtureT08().datos, "2026-04-30").empresa;
    expect([e["cobranza-mes"], e["retenciones-mes"], e.saldo]).toEqual([121_000_000, 4_000_000, 0]);
  });

  it("retención de IVA al 30/04: cobranza del mes 1.210.000,00 y retenciones 20.000,00 (la de IVA cuenta como retención)", () => {
    const e = calcularOraculo(fixtureRetencionIva().datos, "2026-04-30").empresa;
    expect([e["cobranza-mes"], e["retenciones-mes"], e.saldo]).toEqual([121_000_000, 2_000_000, 0]);
  });

  it("T08 al 31/05: el recibo es de abril, así que la cobranza y las retenciones de mayo son 0", () => {
    const e = calcularOraculo(fixtureT08().datos, "2026-05-31").empresa;
    expect([e["cobranza-mes"], e["retenciones-mes"]]).toEqual([0, 0]);
  });
});

describe("el oráculo recalcula el IVA, el total y el vencimiento en lugar de confiar en los datos", () => {
  const conCambio = (cambio: (d: ReturnType<typeof fixtureT12>["datos"]) => void) => {
    const d = structuredClone(fixtureT12().datos);
    cambio(d);
    return d;
  };

  it("datos íntegros: no lanza (T12, con facturas, y la NC y la ND del generador provisional)", () => {
    expect(() => calcularOraculo(fixtureT12().datos, "2026-10-31")).not.toThrow();
    expect(() => calcularOraculo(generarProvisional(1).datos, "2026-10-31")).not.toThrow();
  });

  it("un IVA que no es el 21 % del neto (mitad hacia arriba) lanza y dice cuál comprobante", () => {
    const d = conCambio((x) => {
      const c = x.comprobantes[0];
      if (c === undefined) throw new Error("sin comprobantes");
      c.iva = (c.iva + 1) as typeof c.iva;
      c.total = (c.total + 1) as typeof c.total;
    });
    expect(() => calcularOraculo(d, "2026-10-31")).toThrow(/IVA/);
  });

  it("un total que no es neto + IVA lanza", () => {
    const d = conCambio((x) => {
      const c = x.comprobantes[0];
      if (c === undefined) throw new Error("sin comprobantes");
      c.total = (c.total + 1) as typeof c.total;
    });
    expect(() => calcularOraculo(d, "2026-10-31")).toThrow(/total/);
  });

  it("un vencimiento que no es la emisión + el plazo del cliente lanza", () => {
    const d = conCambio((x) => {
      const c = x.comprobantes.find((y) => y.tipo === 1);
      if (c === undefined) throw new Error("sin facturas");
      c.vencimiento = "2030-01-01";
    });
    expect(() => calcularOraculo(d, "2026-10-31")).toThrow(/vencimiento/);
  });

  it("la nota de crédito vence el día de su emisión (C4): un vencimiento posterior lanza", () => {
    expect(() => calcularOraculo(structuredClone(fixtureT17().datos), "2026-10-31")).not.toThrow();
    const d = structuredClone(fixtureT17().datos);
    const nc = d.comprobantes.find((y) => y.tipo === 3);
    if (nc === undefined) throw new Error("sin NC");
    nc.vencimiento = sumarDias(nc.emision, 30);
    expect(() => calcularOraculo(d, "2026-10-31")).toThrow(/vencimiento/);
  });
});

describe("el oráculo contra los dos caminos del dominio, sobre los datos del generador", () => {
  const semillas = Array.from({ length: 8 }, (_, i) => SEMILLA_PUBLICADA + i);

  it.each(semillas)("semilla %i: las 15 medidas de la empresa y de cada cliente, en los 22 cierres y a mitad de mes, dan lo mismo por agregación, por listado y por el oráculo", (semilla) => {
    const { datos } = generar(semilla);
    compararConElOraculo(datos, [...cierresDeMes(datos), "2026-05-15", "2026-10-14"]);
  });
});

describe("el oráculo contra el dominio sobre el generador provisional, que sí emite notas de débito y retención de IVA", () => {
  const semillas = Array.from({ length: 8 }, (_, i) => 100 + i);

  it("el provisional emite de verdad esos dos casos (si no, esta comparación no probaría nada)", () => {
    const todos = semillas.map((s) => generarProvisional(s).datos);
    expect(todos.some((d) => d.comprobantes.some((c) => c.tipo === 2))).toBe(true);
    expect(todos.some((d) => d.recibos.some((r) => r.medios.some((m) => m.medio === "retencion-iva")))).toBe(true);
  });

  it.each(semillas)("semilla provisional %i: lo mismo, en 8 cortes (cierres y mitades de mes)", (semilla) => {
    const { datos } = generarProvisional(semilla);
    const cierres = cierresDeMes(datos);
    compararConElOraculo(datos, [cierres[0], cierres[5], cierres[11], cierres[16], cierres[21], "2025-09-10", "2026-03-15", "2026-10-14"].filter((c): c is string => c !== undefined));
  });
});

/** Las 15 medidas de la empresa y de cada cliente, a cada corte: el valor de la agregación, la suma de las partidas y el oráculo tienen que dar lo mismo. */
function compararConElOraculo(datos: Datos, cortes: readonly string[]): void {
  for (const corte of cortes) {
    const o = calcularOraculo(datos, corte);
    for (const clave of CLAVES_DEL_CATALOGO) {
      const m = medida(datos, corte, clave);
      expect(m.valor, `${clave} al ${corte}`).toBe(o.empresa[clave]);
      expect(sumarLista(m.partidas.map((p) => p.importe)), `${clave} al ${corte} (partidas)`).toBe(o.empresa[clave]);
      for (const c of datos.clientes) {
        const mc = medida(datos, corte, clave, { clienteId: c.id });
        expect(mc.valor, `${clave} de ${c.id} al ${corte}`).toBe(o.porCliente[c.id]?.[clave]);
      }
    }
  }
}
