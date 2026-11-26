// Camino por listado (docs/diseno.md, 4.2.1): las `partidas` de cada medida, comprobante por comprobante y recibo por recibo, con el saldo
// (S2), el atraso (S3) y el tramo (A1) de `corte.ts`. Se prueba por su cuenta, contra los números de los fixtures (docs/plan.md, paso 3.3),
// sin pasar por agregados.ts: la suma de las partidas tiene que dar el valor escrito a mano en la tabla de esperados.
import { describe, expect, it } from "vitest";
import { saldosAlCorte } from "../src/lib/dominio/corte.ts";
import { sumarLista } from "../src/lib/dominio/dinero.ts";
import { partidasDe } from "../src/lib/dominio/partidas.ts";
import type { ClaveDeMedida, Partida } from "../src/lib/dominio/tipos.ts";
import { ESPERADOS } from "./fixtures/esperados.ts";
import { fixtureEjemploD3, fixtureOtros, fixtureOtrosConPagador, fixtureR4, fixtureT04, fixtureT07, fixtureT08, fixtureT12, fixtureT17 } from "./fixtures/casos.ts";
import { NB } from "./fixtures/formato.ts";

const suma = (ps: readonly Partida[]): number => sumarLista(ps.map((p) => p.importe));

describe("D2 (camino por listado): la suma de las partidas de cada medida contra los números de los fixtures", () => {
  for (const x of ESPERADOS) {
    it(`D2: ${x.nombre}`, () => {
      const a = x.armar();
      const ps = partidasDe(a.datos, x.corte, x.clave, x.filtro ?? {});
      expect(suma(ps)).toBe(x.valor);
      expect(ps).toHaveLength(x.partidas);
    });
  }
});

describe("D1: cada partida lleva su cliente, su fecha, su importe firmado y el enlace a su comprobante o recibo", () => {
  it("D1 (T12): mora al 31/10 → 6 partidas, suma 223.850.000 centavos, agrupadas en 4 clientes", () => {
    const a = fixtureT12();
    const ps = partidasDe(a.datos, "2026-10-31", "mora", {});
    expect(ps).toHaveLength(6);
    expect(suma(ps)).toBe(223_850_000);
    expect(new Set(ps.map((p) => p.clienteId))).toEqual(new Set(["C07", "C05", "C03", "C11"]));
  });

  it("D1 (T12): las partidas de mora están en orden (fecha, comprobantes antes que recibos, id) y enlazan a un comprobante con su emisión y su cliente", () => {
    const a = fixtureT12();
    const ps = partidasDe(a.datos, "2026-10-31", "mora", {});
    expect(ps.map((p) => p.fecha)).toEqual(["2026-07-02", "2026-07-03", "2026-08-01", "2026-08-02", "2026-08-31", "2026-09-01"]);
    expect(ps.map((p) => p.ref)).toEqual(["d91f", "d90", "d61", "d60", "d31", "d30"].map((k) => ({ tipo: "comprobante", id: a.id(k) })));
    expect(ps.map((p) => p.clienteId)).toEqual(["C05", "C11", "C05", "C07", "C03", "C07"]);
  });

  it("D1 (S3): las partidas de saldo traen los días de atraso y el tramo sale de ellos: 91, 90, 61, 60, 31 y 30", () => {
    const a = fixtureT12();
    expect(partidasDe(a.datos, "2026-10-31", "mora", {}).map((p) => p.atraso)).toEqual([91, 90, 61, 60, 31, 30]);
  });

  it("D1: las partidas de saldo traen una nota con los días de atraso, o con el vencimiento si no está vencido", () => {
    const a = fixtureT12();
    expect(partidasDe(a.datos, "2026-10-31", "mora", {}).map((p) => p.nota)).toEqual(["91 días de atraso", "90 días de atraso", "61 días de atraso", "60 días de atraso", "31 días de atraso", "30 días de atraso"]);
    expect(partidasDe(a.datos, "2026-10-31", "tramo-no-vencido", {}).map((p) => p.nota)).toEqual(["Vence el 31/10/2026"]);
    const unDia = partidasDe(fixtureT04().datos, "2026-11-01", "mora", {});
    expect(unDia.map((p) => p.nota)).toEqual(["1 día de atraso"]);
  });

  it("D1: las medidas del mes no llevan atraso (no son de saldo) y la NC va con importe negativo", () => {
    const a = fixtureT17();
    const ps = partidasDe(a.datos, "2026-07-31", "facturacion-mes", {});
    expect(ps.map((p) => p.importe)).toEqual([90_000_000, -10_000_000]);
    expect(ps.every((p) => p.atraso === undefined)).toBe(true);
    expect(ps.map((p) => p.ref.tipo)).toEqual(["comprobante", "comprobante"]);
  });

  it("R2 (T08): la partida de retenciones es la del recibo, con el detalle de cada retención en la nota", () => {
    const a = fixtureT08();
    const ps = partidasDe(a.datos, "2026-04-30", "retenciones-mes", {});
    expect(ps).toEqual([{ ref: { tipo: "recibo", id: a.id("T08-R") }, clienteId: "C02", fecha: "2026-04-30", importe: 4_000_000, nota: `Retención IIBB $${NB}25.000,00 y Ganancias $${NB}15.000,00` }]);
  });

  it("R2 (T17): el recibo del 12/08 trae 5.000,00 de IIBB y 3.000,00 de Ganancias; el de octubre no es una partida de retenciones", () => {
    const a = fixtureT17();
    const [p] = partidasDe(a.datos, "2026-08-31", "retenciones-mes", {});
    expect(p?.nota).toBe(`Retención IIBB $${NB}5.000,00 y Ganancias $${NB}3.000,00`);
    expect(partidasDe(a.datos, "2026-10-31", "retenciones-mes", {})).toEqual([]);
  });

  it("R2 (T08): la partida de cobranza del mismo recibo vale 1.210.000,00 (todos sus medios, retenciones incluidas) y enlaza al recibo", () => {
    const a = fixtureT08();
    const [p] = partidasDe(a.datos, "2026-04-30", "cobranza-mes", {});
    expect(p?.importe).toBe(121_000_000);
    expect(p?.ref).toEqual({ tipo: "recibo", id: a.id("T08-R") });
  });

  it("R4 (T06): pagos a cuenta → una partida del recibo con su a cuenta (50.000,00), con el cliente y la fecha del recibo", () => {
    const a = fixtureR4();
    expect(partidasDe(a.datos, "2026-10-31", "pagos-a-cuenta", {})).toEqual([{ ref: { tipo: "recibo", id: a.id("T06-R") }, clienteId: "C07", fecha: "2026-10-20", importe: 5_000_000 }]);
  });

  it("R4 (T07): saldos a favor → el recibo con su a cuenta de 58.000,00 (300.000,00 − 242.000,00 imputados)", () => {
    const a = fixtureT07();
    expect(partidasDe(a.datos, "2026-08-31", "saldos-a-favor", {})).toEqual([{ ref: { tipo: "recibo", id: a.id("T07-R") }, clienteId: "C09", fecha: "2026-08-10", importe: 5_800_000 }]);
  });

  it("D3: saldo neto → un comprobante con saldo (+) y un recibo con a cuenta (−), que suman el saldo neto", () => {
    const a = fixtureEjemploD3();
    const ps = partidasDe(a.datos, "2026-03-31", "saldo-neto", {});
    expect(ps.map((p) => [p.ref.tipo, p.importe])).toEqual([["comprobante", 14_200_000], ["recibo", -5_000_000]]);
    expect(suma(ps)).toBe(9_200_000);
  });

  it("D1: con un cliente solo trae las partidas de ese cliente", () => {
    const a = fixtureT12();
    const ps = partidasDe(a.datos, "2026-10-31", "saldo", { clienteId: "C05" });
    expect(ps.map((p) => p.clienteId)).toEqual(["C05", "C05"]);
    expect(partidasDe(a.datos, "2026-10-31", "saldo", { clienteId: "C99" })).toEqual([]);
  });

  it("D1: una clave desconocida lanza", () => {
    expect(() => partidasDe(fixtureT12().datos, "2026-10-31", "inexistente" as ClaveDeMedida, {})).toThrow(/inexistente/);
  });
});

describe("M4 (D1): las partidas de «Otros» son los comprobantes de los clientes fuera de los cinco mayores deudores", () => {
  it("M4: con siete deudores, mora-otros = las facturas de C08 y C10 (363.000,00 + 242.000,00)", () => {
    const a = fixtureOtros();
    const ps = partidasDe(a.datos, "2026-10-31", "mora-otros", {});
    expect(ps.map((p) => p.clienteId).sort()).toEqual(["C08", "C10"]);
    expect(suma(ps)).toBe(60_500_000);
  });

  it("M4: con 5 deudores la clave no existe y lanza", () => {
    expect(() => partidasDe(fixtureOtros(5).datos, "2026-10-31", "mora-otros", {})).toThrow(/mora-otros/);
  });

  it("M4: un cliente con movimientos pero mora 0 (pagó su factura vencida) no es un deudor: con 5 deudores y él, «Otros» no existe", () => {
    expect(() => partidasDe(fixtureOtrosConPagador().datos, "2026-10-31", "mora-otros", {})).toThrow(/mora-otros/);
  });

  it("M4: mora-otros no admite filtro por cliente", () => {
    expect(() => partidasDe(fixtureOtros().datos, "2026-10-31", "mora-otros", { clienteId: "C03" })).toThrow(/mora-otros/);
  });
});

describe("D2: el camino por listado usa el saldo que se le da (así se prueba la mutación del saldo, paso 3.5)", () => {
  it("D2: con un proveedor de saldos distinto, las partidas de saldo lo reflejan", () => {
    const a = fixtureT12();
    const real = saldosAlCorte(a.datos, "2026-10-31");
    const sinSaldo = (): typeof real => real.map((s) => ({ ...s, saldo: 0 as typeof s.saldo }));
    expect(partidasDe(a.datos, "2026-10-31", "saldo", {}, sinSaldo)).toEqual([]);
    expect(partidasDe(a.datos, "2026-10-31", "saldo", {})).toHaveLength(7);
  });
});
