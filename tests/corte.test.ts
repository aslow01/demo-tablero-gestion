// Fecha de corte, saldo y cuenta corriente (docs/diseno.md, 6.4 y 4.1): S1, S2, S3, S5, S6, S7 y R4. Cada test lleva en su nombre el
// identificador de la regla. Importes en centavos (pesos × 100); los fixtures son los de 5.3 y 5.5.
import { describe, expect, it } from "vitest";
import {
  atraso,
  cierresDeMes,
  cuentaDelCliente,
  existeAlCorte,
  mesDelCorte,
  posicionDelCliente,
  resolverCorte,
  saldoAlCorte,
  saldosAlCorte,
} from "../src/lib/dominio/corte.ts";
import { centavos, sumarLista } from "../src/lib/dominio/dinero.ts";
import type { Datos } from "../src/lib/dominio/tipos.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import type { Armado } from "./fixtures/armarDatos.ts";
import { CASOS_PLANTADOS, fixtureEjemploD3, fixtureR4, fixtureT01, fixtureT02, fixtureT03, fixtureT04, fixtureT05, fixtureT07, fixtureT08, fixtureT14, fixtureT17 } from "./fixtures/casos.ts";
import { validarDatos } from "../src/lib/dominio/validadores.ts";

const saldoDe = (a: Armado, clave: string, corte: string): number => saldoAlCorte(a.datos, a.id(clave), corte);
const atrasoDe = (a: Armado, clave: string, corte: string): number => {
  const c = a.datos.comprobantes.find((x) => x.id === a.id(clave));
  if (c === undefined) throw new Error(`No hay ${clave}`);
  return atraso(c, corte);
};

describe("fixtures de 5.3: los casos plantados son datos válidos", () => {
  it("G5: T02, T04, T05, T07, T08, T17 y el ejemplo de D3 pasan todos los validadores", () => {
    for (const [alias, f] of Object.entries(CASOS_PLANTADOS)) expect(validarDatos(f().datos), `caso ${alias}`).toEqual([]);
    expect(validarDatos(fixtureEjemploD3().datos)).toEqual([]);
  });
});

describe("S5: resolverCorte exige un cierre de mes del rango y es la única función que lo exige", () => {
  const datos = armarDatos({}).datos; // desde 2025-01-01, hasta 2026-10-31
  const aviso = "La fecha de corte de la dirección no es válida. Se muestra el 31/10/2026.";

  it("S5: ?corte=2026-09-30 → válido, sin aviso", () => {
    expect(resolverCorte("2026-09-30", datos)).toEqual({ corte: "2026-09-30", aviso: null });
    expect(resolverCorte(["2026-09-30"], datos)).toEqual({ corte: "2026-09-30", aviso: null });
  });

  it("S5: sin corte en la dirección → 2026-10-31 sin aviso", () => {
    expect(resolverCorte(undefined, datos)).toEqual({ corte: "2026-10-31", aviso: null });
    expect(resolverCorte(null, datos)).toEqual({ corte: "2026-10-31", aviso: null });
    expect(resolverCorte([], datos)).toEqual({ corte: "2026-10-31", aviso: null });
  });

  it.each([
    ["2026-02-30", "una fecha que no existe"],
    ["2030-01-01", "fuera de rango (después de hasta)"],
    ["hola", "no es una fecha"],
    ["2026-10-15", "no es cierre de mes"],
    ["2024-12-31", "fuera de rango (antes de desde)"],
    ["2025-01-30", "un día antes del primer cierre"],
    ["2026-11-30", "un cierre de mes después de hasta"],
    ["", "vacío"],
    [" 2026-09-30", "con un espacio"],
  ])("S5: %s (%s) → corte por defecto con el aviso", (texto) => {
    expect(resolverCorte(texto, datos)).toEqual({ corte: "2026-10-31", aviso });
  });

  it("S5: ?corte=2026-09-30&corte=2026-08-31 (repetido) → aviso", () => {
    expect(resolverCorte(["2026-09-30", "2026-08-31"], datos)).toEqual({ corte: "2026-10-31", aviso });
  });

  it("S5: los extremos válidos son 2025-01-31 y 2026-10-31, y el 28/02 de un año común y el 29/02 de uno bisiesto son cierres", () => {
    expect(resolverCorte("2025-01-31", datos).aviso).toBeNull();
    expect(resolverCorte("2026-10-31", datos).aviso).toBeNull();
    expect(resolverCorte("2025-02-28", datos).aviso).toBeNull();
    expect(resolverCorte("2025-02-27", datos).aviso).not.toBeNull();
    const bisiesto: Datos = { ...datos, desde: "2023-12-01", hasta: "2024-03-31" };
    expect(resolverCorte("2024-02-29", bisiesto)).toEqual({ corte: "2024-02-29", aviso: null });
    expect(resolverCorte("2024-02-28", bisiesto).aviso).not.toBeNull();
  });

  it("S5: cierresDeMes da los 22 cierres, del 2025-01-31 al 2026-10-31, en orden y sin repetir", () => {
    const cierres = cierresDeMes(datos);
    expect(cierres).toHaveLength(22);
    expect(cierres[0]).toBe("2025-01-31");
    expect(cierres[21]).toBe("2026-10-31");
    expect(cierres).toContain("2025-02-28");
    expect(cierres).toContain("2025-12-31");
    expect(cierres).toContain("2026-06-30");
    expect(new Set(cierres).size).toBe(22);
    expect([...cierres].sort()).toEqual(cierres);
  });

  it("S5: solo resolverCorte exige el cierre de mes: saldoAlCorte(T01-F, 2026-05-15) → 605.000,00 mientras resolverCorte('2026-05-15') → aviso", () => {
    const a = fixtureT01();
    expect(saldoDe(a, "T01-F", "2026-05-15")).toBe(pesos(605_000));
    expect(resolverCorte("2026-05-15", a.datos).aviso).not.toBeNull();
  });
});

describe("S1: lo posterior al corte no existe para ese corte", () => {
  it("S1 (T05): existeAlCorte del recibo del 03/11 → falso al 31/10 y verdadero al 03/11 (una función, no la dirección)", () => {
    const a = fixtureT05();
    const recibo = a.datos.recibos[0];
    if (recibo === undefined) throw new Error("falta el recibo");
    expect(existeAlCorte(recibo, "2026-10-31")).toBe(false);
    expect(existeAlCorte(recibo, "2026-11-02")).toBe(false);
    expect(existeAlCorte(recibo, "2026-11-03")).toBe(true);
  });

  it("S1 (T05): al 31/10 el saldo de T05-F es 363.000,00 aunque el recibo del 03/11 exista en los datos; al 03/11 es 0", () => {
    const a = fixtureT05();
    expect(saldoDe(a, "T05-F", "2026-10-31")).toBe(pesos(363_000));
    expect(atrasoDe(a, "T05-F", "2026-10-31")).toBe(6);
    expect(saldoDe(a, "T05-F", "2026-11-03")).toBe(0);
  });

  it("S1 (T14): con corte 2026-09-30 existe T14-F1 y no T14-F2 (01/10); con corte 10/31 existen los dos", () => {
    const a = fixtureT14();
    const f = (clave: string) => a.datos.comprobantes.find((c) => c.id === a.id(clave));
    const [f1, f2] = [f("T14-F1"), f("T14-F2")];
    if (f1 === undefined || f2 === undefined) throw new Error("faltan las facturas");
    expect([existeAlCorte(f1, "2026-09-30"), existeAlCorte(f2, "2026-09-30")]).toEqual([true, false]);
    expect([existeAlCorte(f1, "2026-10-31"), existeAlCorte(f2, "2026-10-31")]).toEqual([true, true]);
  });

  it("S1 (T14): el saldo de una factura emitida después del corte es 0 (no existe para ese corte) y no entra en la lista de saldos", () => {
    const a = fixtureT14();
    expect(saldoDe(a, "T14-F2", "2026-09-30")).toBe(0);
    expect(saldosAlCorte(a.datos, "2026-09-30").map((s) => s.comprobante.id)).toEqual([a.id("T14-F1")]);
    expect(saldoDe(a, "T14-F2", "2026-10-31")).toBe(0); // existe y está cobrada el 16/10
    expect(saldoDe(a, "T14-F1", "2026-09-30")).toBe(pesos(121_000));
  });

  it("S1: la fecha del corte incluye lo del mismo día (emisión y recibo con fecha = corte existen)", () => {
    const a = fixtureT03();
    const c = a.datos.comprobantes[0];
    const r = a.datos.recibos[0];
    if (c === undefined || r === undefined) throw new Error("faltan datos");
    expect(existeAlCorte(c, c.emision)).toBe(true);
    expect(existeAlCorte(c, "2026-07-15")).toBe(false);
    expect(existeAlCorte(r, r.fecha)).toBe(true);
    expect(existeAlCorte(r, "2026-07-30")).toBe(false);
  });
});

describe("S2: saldo de un comprobante al corte = total − imputaciones ≤ corte − NC asociadas ≤ corte", () => {
  it("S2 (T01): T01-F al 2026-05-15 → 605.000,00 (la NC es del 20/05); al 2026-05-31 → 0", () => {
    const a = fixtureT01();
    expect(saldoDe(a, "T01-F", "2026-05-15")).toBe(pesos(605_000));
    expect(saldoDe(a, "T01-F", "2026-05-31")).toBe(0);
  });

  it("S2 (T01): la NC del mismo día del corte ya cuenta (19/05 → 605.000,00; 20/05 → 0) y una NC no tiene saldo propio", () => {
    const a = fixtureT01();
    expect(saldoDe(a, "T01-F", "2026-05-19")).toBe(pesos(605_000));
    expect(saldoDe(a, "T01-F", "2026-05-20")).toBe(0);
    expect(saldoDe(a, "T01-NC", "2026-05-31")).toBe(0);
    expect(saldosAlCorte(a.datos, "2026-05-31").map((s) => s.comprobante.tipo)).toEqual([1]); // la NC no se lista
  });

  it("S2 (T02): saldo 810.000,00 al 31/07 y al 31/08, 410.000,00 al 30/09 y 0 al 31/10", () => {
    const a = fixtureT02();
    expect([saldoDe(a, "T02-F", "2026-07-31"), saldoDe(a, "T02-F", "2026-08-31"), saldoDe(a, "T02-F", "2026-09-30"), saldoDe(a, "T02-F", "2026-10-31")]).toEqual(
      [81_000_000, 81_000_000, 41_000_000, 0],
    );
  });

  it("S2 (T02): antes de que exista, el saldo es 0 (09/07) y el día de la emisión es el total entero menos nada (10/07)", () => {
    const a = fixtureT02();
    expect(saldoDe(a, "T02-F", "2026-07-09")).toBe(0);
    expect(saldoDe(a, "T02-F", "2026-07-10")).toBe(pesos(1_210_000));
  });

  it("S2 (T17): T12-d91 con NC, cobro con retenciones y cobro de octubre: 968.000,00 · 726.000,00 · 726.000,00 · 605.000,00", () => {
    const a = fixtureT17();
    expect([saldoDe(a, "T12-d91", "2026-07-31"), saldoDe(a, "T12-d91", "2026-08-31"), saldoDe(a, "T12-d91", "2026-09-30"), saldoDe(a, "T12-d91", "2026-10-31")]).toEqual(
      [96_800_000, 72_600_000, 72_600_000, 60_500_000],
    );
  });

  it("S2 (T16/C1): una ND tiene su propio saldo, que no toca el de su factura", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "F", cliente: "C13", emision: "2026-03-10", neto: pesos(600_000) },
        { clave: "ND", tipo: 2, cliente: "C13", emision: "2026-04-02", neto: pesos(24_000), asociadoA: "F" },
      ],
    });
    expect(saldoDe(a, "F", "2026-05-31")).toBe(pesos(726_000));
    expect(saldoDe(a, "ND", "2026-05-31")).toBe(pesos(29_040));
  });

  it("S2: saldosAlCorte lista las facturas y ND que existen al corte, en el orden de los datos, con su saldo y su atraso", () => {
    const a = fixtureT17();
    const l = saldosAlCorte(a.datos, "2026-10-31");
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ saldo: 60_500_000, atraso: 91 });
    expect(l[0]?.comprobante.id).toBe(a.id("T12-d91"));
  });

  it("S2: saldoAlCorte con un id que no existe lanza, nombrándolo", () => {
    const a = fixtureT01();
    expect(() => saldoAlCorte(a.datos, "1-0003-00000099", "2026-05-31")).toThrow(/1-0003-00000099/);
  });

  it("S2: un corte que no es una fecha civil válida lanza", () => {
    const a = fixtureT01();
    expect(() => saldoAlCorte(a.datos, a.id("T01-F"), "2026-02-30")).toThrow(/corte/);
    expect(() => saldosAlCorte(a.datos, "hola")).toThrow(/corte/);
  });
});

describe("S3: días de atraso = días entre el vencimiento y el corte; 0 o menos no está vencido", () => {
  it("S3 (T03): cobro el día del vencimiento → al 30/07 atraso −1, al 31/07 atraso 0 y saldo 0, nunca mora", () => {
    const a = fixtureT03();
    expect(atrasoDe(a, "T03-F", "2026-07-30")).toBe(-1);
    expect(saldoDe(a, "T03-F", "2026-07-30")).toBe(pesos(242_000));
    expect(atrasoDe(a, "T03-F", "2026-07-31")).toBe(0);
    expect(saldoDe(a, "T03-F", "2026-07-31")).toBe(0);
  });

  it("S3 (T04): vence 2026-10-31, corte 2026-10-31 → atraso 0 (no vencida) y saldo 302.500,00; con corte 01/11 (la función) atraso 1", () => {
    const a = fixtureT04();
    expect(atrasoDe(a, "T04-F", "2026-10-31")).toBe(0);
    expect(saldoDe(a, "T04-F", "2026-10-31")).toBe(pesos(302_500));
    expect(atrasoDe(a, "T04-F", "2026-11-01")).toBe(1);
  });

  it("S3 (T02): atraso −9, 22, 52 y 83 en los cuatro cortes", () => {
    const a = fixtureT02();
    expect(["2026-07-31", "2026-08-31", "2026-09-30", "2026-10-31"].map((k) => atrasoDe(a, "T02-F", k))).toEqual([-9, 22, 52, 83]);
  });

  it("S3: T07-F y T08-F antes de su vencimiento (−14 y −15)", () => {
    expect(atrasoDe(fixtureT07(), "T07-F", "2026-07-31")).toBe(-14);
    expect(atrasoDe(fixtureT08(), "T08-F", "2026-03-31")).toBe(-15);
  });
});

describe("S6: en un pago parcial el atraso sale del vencimiento original, no del último pago", () => {
  it("S6 (T02): al 2026-09-30, último pago el 15/09 (15 días antes) pero atraso 52 y saldo 410.000,00", () => {
    const a = fixtureT02();
    expect(atrasoDe(a, "T02-F", "2026-09-30")).toBe(52);
    expect(saldoDe(a, "T02-F", "2026-09-30")).toBe(pesos(410_000));
  });

  it("S6 (T17): T12-d91 al 31/08 y 30/09 → atraso 30 y 60; al 13/10 → 73; al 31/10 → 91", () => {
    const a = fixtureT17();
    expect(["2026-07-31", "2026-08-31", "2026-09-30", "2026-10-13", "2026-10-31"].map((k) => atrasoDe(a, "T12-d91", k))).toEqual([-1, 30, 60, 73, 91]);
    expect(saldoDe(a, "T12-d91", "2026-10-13")).toBe(pesos(726_000));
  });
});

describe("S7: el mes del corte", () => {
  it("S7: es el mes calendario que contiene el corte", () => {
    expect(mesDelCorte("2026-10-31")).toBe("2026-10");
    expect(mesDelCorte("2026-09-30")).toBe("2026-09");
    expect(mesDelCorte("2026-05-15")).toBe("2026-05");
  });

  it("S7: un corte que no es una fecha civil válida lanza", () => {
    expect(() => mesDelCorte("2026-13-01")).toThrow(/corte/);
  });
});

describe("R4: el pago a cuenta baja el saldo neto pero no la mora; se decide por el cliente y no se parte", () => {
  it("R4 (T06): C07 con 726.000,00 de saldo y un recibo de 50.000,00 sin imputar → pagos a cuenta 50.000,00, saldos a favor 0, saldo neto 676.000,00", () => {
    const a = fixtureR4();
    expect(posicionDelCliente(a.datos, "C07", "2026-10-31")).toEqual({
      saldo: 72_600_000,
      aCuenta: 5_000_000,
      pagosACuenta: 5_000_000,
      saldosAFavor: 0,
      saldoNeto: 67_600_000,
    });
  });

  it("R4 (T07): C09 sin comprobantes con saldo (S = 0) y a cuenta 58.000,00 → saldo a favor 58.000,00, pagos a cuenta 0 (al 31/08)", () => {
    const a = fixtureT07();
    expect(posicionDelCliente(a.datos, "C09", "2026-08-31")).toEqual({ saldo: 0, aCuenta: 5_800_000, pagosACuenta: 0, saldosAFavor: 5_800_000, saldoNeto: -5_800_000 });
  });

  it("R4 (T07): antes del recibo (31/07) C09 debe la factura entera y no tiene a cuenta", () => {
    const a = fixtureT07();
    expect(posicionDelCliente(a.datos, "C09", "2026-07-31")).toEqual({ saldo: 24_200_000, aCuenta: 0, pagosACuenta: 0, saldosAFavor: 0, saldoNeto: 24_200_000 });
  });

  it("R4: S = 100.000,00 y A = 150.000,00 → pagos a cuenta 150.000,00 entero, saldos a favor 0, saldo neto −50.000,00", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C04", emision: "2026-03-01", neto: pesos(200_000) }],
      recibos: [{ clave: "R", cliente: "C04", fecha: "2026-03-10", medios: [{ importe: pesos(292_000) }], imputaciones: [{ comprobante: "F", importe: pesos(142_000) }] }],
    });
    expect(posicionDelCliente(a.datos, "C04", "2026-03-31")).toEqual({
      saldo: 10_000_000,
      aCuenta: 15_000_000,
      pagosACuenta: 15_000_000,
      saldosAFavor: 0,
      saldoNeto: -5_000_000,
    });
  });

  it("R4: un cliente sin movimientos tiene todo en 0 (T15 al 31/10/2026, ya cobrado)", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C04", emision: "2025-10-15", neto: pesos(100_000) }],
      recibos: [{ clave: "R", cliente: "C04", fecha: "2025-11-10", medios: [{ importe: pesos(121_000) }], imputaciones: [{ comprobante: "F", importe: pesos(121_000) }] }],
    });
    expect(posicionDelCliente(a.datos, "C04", "2026-10-31")).toEqual({ saldo: 0, aCuenta: 0, pagosACuenta: 0, saldosAFavor: 0, saldoNeto: 0 });
    expect(posicionDelCliente(a.datos, "C01", "2026-10-31")).toEqual({ saldo: 0, aCuenta: 0, pagosACuenta: 0, saldosAFavor: 0, saldoNeto: 0 });
  });

  it("R4: el borde: con S de 1 centavo ya es pago a cuenta sin imputar (S > 0), y con S = 0 es saldo a favor", () => {
    const a = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C04", emision: "2026-03-01", neto: centavos(1) }],
      recibos: [{ clave: "R", cliente: "C04", fecha: "2026-03-10", medios: [{ importe: centavos(5) }] }],
    });
    expect(posicionDelCliente(a.datos, "C04", "2026-03-31")).toEqual({ saldo: 1, aCuenta: 5, pagosACuenta: 5, saldosAFavor: 0, saldoNeto: -4 });
    expect(posicionDelCliente(a.datos, "C04", "2026-03-05")).toMatchObject({ saldo: 1, aCuenta: 0 });
  });

  it("R4: el a cuenta de un cliente no se mezcla con el de otro (el recibo de C07 no cuenta en C01 ni en C09)", () => {
    const a = fixtureR4();
    for (const otro of ["C01", "C09"]) expect(posicionDelCliente(a.datos, otro, "2026-10-31"), otro).toEqual({ saldo: 0, aCuenta: 0, pagosACuenta: 0, saldosAFavor: 0, saldoNeto: 0 });
  });

  it("R4: un recibo posterior al corte no cuenta como a cuenta (S1): al 19/10 C07 todavía no tiene el pago de 50.000,00", () => {
    const a = fixtureR4();
    expect(posicionDelCliente(a.datos, "C07", "2026-10-19")).toMatchObject({ aCuenta: 0, saldoNeto: 72_600_000 });
  });

  it("R4: un cliente que no existe lanza, nombrándolo", () => {
    expect(() => posicionDelCliente(fixtureR4().datos, "C99", "2026-10-31")).toThrow(/C99/);
  });
});

describe("cuenta corriente del cliente (4.1): ordenada, con saldo acumulado, y cierra con el saldo neto", () => {
  it("D3: el ejemplo chico → 242.000,00 y después 92.000,00; S = 142.000,00, A = 50.000,00, saldo neto 92.000,00", () => {
    const a = fixtureEjemploD3();
    const cuenta = cuentaDelCliente(a.datos, "C04", "2026-03-31");
    expect(cuenta.movimientos.map((m) => [m.ref.tipo, m.importe, m.saldoAcumulado])).toEqual([
      ["comprobante", 24_200_000, 24_200_000],
      ["recibo", -15_000_000, 9_200_000],
    ]);
    expect(cuenta.saldoFinal).toBe(9_200_000);
    const p = posicionDelCliente(a.datos, "C04", "2026-03-31");
    expect([p.saldo, p.aCuenta, p.saldoNeto]).toEqual([14_200_000, 5_000_000, 9_200_000]);
    expect(p.saldoNeto).toBe(cuenta.saldoFinal);
  });

  it("D3: factura y ND suman, la NC resta y el recibo resta todos sus medios, retenciones incluidas (T17: 1.089.000 − 121.000 − 242.000 − 121.000 = 605.000)", () => {
    const a = fixtureT17();
    const cuenta = cuentaDelCliente(a.datos, "C05", "2026-10-31");
    expect(cuenta.movimientos.map((m) => m.importe)).toEqual([108_900_000, -12_100_000, -24_200_000, -12_100_000]);
    expect(cuenta.movimientos.map((m) => m.fecha)).toEqual(["2026-07-02", "2026-07-20", "2026-08-12", "2026-10-14"]);
    expect(cuenta.saldoFinal).toBe(60_500_000);
    expect(cuenta.movimientos.map((m) => m.ref.id)).toEqual([a.id("T12-d91"), a.id("T17-NC"), a.id("T17-R1"), a.id("T17-R2")]);
  });

  it("D3 (S1): solo entra lo que existe al corte (al 30/09 no está el recibo del 14/10)", () => {
    const a = fixtureT17();
    const cuenta = cuentaDelCliente(a.datos, "C05", "2026-09-30");
    expect(cuenta.movimientos).toHaveLength(3);
    expect(cuenta.saldoFinal).toBe(72_600_000);
  });

  it("D3: el mismo día van primero los comprobantes y después los recibos, y dentro de cada grupo por id", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "F1", cliente: "C04", emision: "2026-03-01", neto: pesos(100_000) },
        { clave: "F2", cliente: "C04", emision: "2026-03-10", neto: pesos(100_000) },
        { clave: "F3", cliente: "C04", emision: "2026-03-10", neto: pesos(100_000) },
      ],
      recibos: [
        { clave: "RB", cliente: "C04", fecha: "2026-03-10", medios: [{ importe: pesos(10_000) }] },
        { clave: "RA", cliente: "C04", fecha: "2026-03-10", medios: [{ importe: pesos(20_000) }], imputaciones: [{ comprobante: "F1", importe: pesos(10_000) }] },
      ],
    });
    const cuenta = cuentaDelCliente(a.datos, "C04", "2026-03-31");
    expect(cuenta.movimientos.map((m) => m.ref.id)).toEqual([a.id("F1"), a.id("F2"), a.id("F3"), a.id("RB"), a.id("RA")]);
    // RB no imputa nada y se numera antes (C2); dentro del grupo de recibos manda el id, no el orden en que se escribieron
    expect(cuenta.movimientos.map((m) => m.ref.tipo)).toEqual(["comprobante", "comprobante", "comprobante", "recibo", "recibo"]);
    expect(sumarLista(cuenta.movimientos.map((m) => m.importe))).toBe(cuenta.saldoFinal);
  });

  it("D3: un cliente sin movimientos tiene una cuenta vacía y saldo 0", () => {
    const cuenta = cuentaDelCliente(fixtureT17().datos, "C01", "2026-10-31");
    expect(cuenta).toEqual({ movimientos: [], saldoFinal: 0 });
  });

  it("D3: la cuenta de un cliente solo trae sus movimientos y un cliente inexistente lanza", () => {
    const a = fixtureT17();
    expect(cuentaDelCliente(a.datos, "C05", "2026-10-31").movimientos.every((m) => m.clienteId === "C05")).toBe(true);
    expect(() => cuentaDelCliente(a.datos, "C99", "2026-10-31")).toThrow(/C99/);
  });

  it("D3: el saldo final siempre es el de la posición del cliente (saldo − a cuenta), en cada corte de T17", () => {
    const a = fixtureT17();
    for (const corte of ["2026-06-30", "2026-07-31", "2026-08-31", "2026-09-30", "2026-10-31"]) {
      expect(cuentaDelCliente(a.datos, "C05", corte).saldoFinal, corte).toBe(posicionDelCliente(a.datos, "C05", corte).saldoNeto);
    }
  });
});
