// G3: la prueba de referencia de la semilla publicada (docs/diseno.md, 5.3, 5.4 y 6.7). Con el generador real y la semilla 20261122 están los casos
// plantados con sus importes y fechas y se cumple la tabla de 5.4 (`ESPERADO`). **Solo para la semilla publicada**: para las otras 49 valen los
// invariantes (D2, D3, G2, G5), no los valores. Cada cifra se obtiene por los dos caminos y pasa `controlar` (`medidaControlada`); el oráculo
// independiente (`scripts/oraculo.mjs`) la confirma aparte. Los casos borde (S3, A1, R4, M2...) siguen en los fixtures escritos a mano.
import { describe, expect, it } from "vitest";
import { calcularOraculo } from "../scripts/oraculo.mjs";
import { SEMILLA_PUBLICADA } from "../src/lib/datos/constantes.ts";
import { congelar } from "../src/lib/datos/congelar.ts";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { generar } from "../src/lib/datos/generador.ts";
import { huellaDe } from "../src/lib/datos/huella.ts";
import { tramoDe } from "../src/lib/dominio/antiguedad.ts";
import { exigirControles } from "../src/lib/dominio/controles.ts";
import { atraso, cierresDeMes, cuentaDelCliente, existeAlCorte, posicionDelCliente, saldoAlCorte } from "../src/lib/dominio/corte.ts";
import { porcentaje, porcentajes } from "../src/lib/dominio/dinero.ts";
import { clavesExistentes, medida, medidaControlada, porCliente } from "../src/lib/dominio/medidas.ts";
import type { Datos } from "../src/lib/dominio/tipos.ts";

const generado = generar(SEMILLA_PUBLICADA);
const datos: Datos = congelar(generado.datos);
const ids = generado.plantados;
const CORTE = ESPERADO.corte;
const id = (alias: string): string => {
  const v = ids[alias];
  if (v === undefined) throw new Error(`No hay un plantado con el alias ${alias}`);
  return v;
};
const comprobante = (alias: string) => {
  const c = datos.comprobantes.find((x) => x.id === id(alias));
  if (c === undefined) throw new Error(alias);
  return c;
};
const nombreDe = (clienteId: string) => datos.clientes.find((c) => c.id === clienteId)?.razonSocial ?? "";

describe("G3: la semilla publicada y sus datos", () => {
  it("la semilla, la huella y las cantidades son las de ESPERADO", () => {
    expect(datos.semilla).toBe(ESPERADO.semilla);
    expect(SEMILLA_PUBLICADA).toBe(ESPERADO.semilla);
    expect(huellaDe(datos)).toBe(ESPERADO.huella);
    expect([datos.comprobantes.length, datos.recibos.length]).toEqual([ESPERADO.cantidades.comprobantes, ESPERADO.cantidades.recibos]);
  });

  it("el README cita la semilla y la huella que da el generador (si cambia una, hay que actualizar el README a propósito)", () => {
    const leidos = import.meta.glob("../README.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const readme = leidos["../README.md"];
    if (readme === undefined) throw new Error("No se pudo leer README.md.");
    const huellas = [...readme.matchAll(/huella `([0-9a-f]{8})`/g)].map((m) => m[1]);
    const semillas = [...readme.matchAll(/semilla `(\d+)`/g)].map((m) => Number(m[1]));
    expect(huellas, "huella citada en el README").toEqual([huellaDe(datos)]);
    expect(semillas, "semilla citada en el README").toEqual([SEMILLA_PUBLICADA]);
  });
});

describe("G3 (5.4): las cifras al corte por defecto (2026-10-31), por los dos caminos y con controlar", () => {
  const valor = (clave: Parameters<typeof medidaControlada>[2], filtro = {}) => medidaControlada(datos, CORTE, clave, filtro).valor;

  it("saldo a cobrar, saldo neto, mora y los cinco tramos", () => {
    expect(valor("saldo")).toBe(ESPERADO.saldo);
    expect(valor("saldo-neto")).toBe(ESPERADO.saldoNeto);
    expect(valor("mora")).toBe(ESPERADO.mora.importe);
    expect(valor("tramo-no-vencido")).toBe(ESPERADO.tramos["no-vencido"]);
    expect(valor("tramo-1-30")).toBe(ESPERADO.tramos["1-30"]);
    expect(valor("tramo-31-60")).toBe(ESPERADO.tramos["31-60"]);
    expect(valor("tramo-61-90")).toBe(ESPERADO.tramos["61-90"]);
    expect(valor("tramo-mas-90")).toBe(ESPERADO.tramos["mas-90"]);
  });

  it("la semilla se eligió para que haya deuda en los cinco tramos de antigüedad (61–90 incluido): todos tienen importe", () => {
    for (const [tramo, importe] of Object.entries(ESPERADO.tramos)) expect(importe, tramo).toBeGreaterThan(0);
    expect(valor("tramo-61-90")).toBeGreaterThan(0);
  });

  it("A2: los cinco tramos suman el saldo y los cuatro vencidos suman la mora (al centavo)", () => {
    const t = ESPERADO.tramos;
    expect(t["no-vencido"] + t["1-30"] + t["31-60"] + t["61-90"] + t["mas-90"]).toBe(ESPERADO.saldo);
    expect(t["1-30"] + t["31-60"] + t["61-90"] + t["mas-90"]).toBe(ESPERADO.mora.importe);
  });

  it("«Más de 90» es exacto por construcción: 605.000,00, solo T12-d91 (el atraso máximo del relleno es 89)", () => {
    const m = medida(datos, CORTE, "tramo-mas-90");
    expect(m.valor).toBe(60_500_000);
    expect(m.partidas.map((p) => p.ref.id)).toEqual([id("T12-d91")]);
    const delRelleno = medida(datos, CORTE, "mora").partidas.filter((p) => p.ref.id !== id("T12-d91"));
    expect(Math.max(...delRelleno.map((p) => p.atraso ?? 0))).toBeLessThanOrEqual(89);
  });

  it("la mora son 16 comprobantes de 6 clientes, y es el 22,1 % de lo que hay por cobrar (M3)", () => {
    const m = medida(datos, CORTE, "mora");
    expect(m.partidas).toHaveLength(ESPERADO.mora.comprobantes);
    expect(new Set(m.partidas.map((p) => p.clienteId)).size).toBe(ESPERADO.mora.clientes);
    expect(porcentaje(m.valor, medida(datos, CORTE, "saldo").valor)).toBe(ESPERADO.mora.milesimasDelSaldo);
  });

  it("los porcentajes de los tramos (mayor resto) son los de ESPERADO y suman 100,0", () => {
    const orden = ["no-vencido", "1-30", "31-60", "61-90", "mas-90"] as const;
    const milesimas = porcentajes(orden.map((t) => ({ nombre: t, importe: ESPERADO.tramos[t] as never })));
    expect(milesimas).toEqual(orden.map((t) => ESPERADO.milesimasDeTramos[t]));
    expect(milesimas.reduce((s: number, m) => s + (m ?? 0), 0)).toBe(1000);
  });

  it("C05 es el cliente con más mora, con T12-d91 (91 días) como su comprobante más atrasado; hay seis deudores y «Otros» existe (M4)", () => {
    const m = medida(datos, CORTE, "mora");
    const filas = porCliente(m, datos);
    expect(filas[0]?.clienteId).toBe(ESPERADO.clienteConMasMora);
    expect(filas.map((f) => f.clienteId)).toEqual(ESPERADO.deudores.map((d) => d.clienteId));
    const deC05 = m.partidas.filter((p) => p.clienteId === "C05");
    const masAtrasado = deC05.reduce((a, b) => ((b.atraso ?? 0) > (a.atraso ?? 0) ? b : a));
    expect([masAtrasado.ref.id, masAtrasado.atraso]).toEqual([id(ESPERADO.comprobanteMasAtrasado.alias), ESPERADO.comprobanteMasAtrasado.dias]);
    // El más atrasado de toda la empresa, también:
    expect(m.partidas.reduce((a, b) => ((b.atraso ?? 0) > (a.atraso ?? 0) ? b : a)).ref.id).toBe(id("T12-d91"));
    expect(filas).toHaveLength(6);
    expect(ESPERADO.hayOtros).toBe(true);
    expect(clavesExistentes(datos, CORTE)).toContain("mora-otros");
  });

  it("M4: «Otros» es la mora del sexto deudor (C07): importe, un comprobante, un cliente; los cinco mayores y «Otros» suman la mora", () => {
    const otros = medidaControlada(datos, CORTE, "mora-otros");
    expect(otros.valor).toBe(ESPERADO.otros.importe);
    expect(otros.partidas).toHaveLength(ESPERADO.otros.comprobantes);
    expect(new Set(otros.partidas.map((p) => p.clienteId))).toEqual(new Set([ESPERADO.deudores[5]?.clienteId]));
    expect(new Set(otros.partidas.map((p) => p.clienteId)).size).toBe(ESPERADO.otros.clientes);
    const cincoMayores = ESPERADO.deudores.slice(0, 5).reduce((s, d) => s + d.importe, 0);
    expect(cincoMayores + otros.valor).toBe(ESPERADO.mora.importe);
    expect(otros.valor).toBe(ESPERADO.deudores.slice(5).reduce((s, d) => s + d.importe, 0));
  });

  it("el ranking de deudores: importe, porcentaje (M3), tramo más antiguo y días del más atrasado de cada uno", () => {
    const m = medida(datos, CORTE, "mora");
    const filas = porCliente(m, datos);
    expect(filas.map((f) => [f.clienteId, f.subtotal, f.milesimas])).toEqual(ESPERADO.deudores.map((d) => [d.clienteId, d.importe, d.milesimas]));
    expect(filas.reduce((s, f) => s + (f.milesimas ?? 0), 0)).toBe(1000);
    for (const d of ESPERADO.deudores) {
      const dias = Math.max(...m.partidas.filter((p) => p.clienteId === d.clienteId).map((p) => p.atraso ?? 0));
      expect([d.clienteId, dias, tramoDe(dias)]).toEqual([d.clienteId, d.diasDelMasAtrasado, d.tramoMasAntiguo]);
    }
    expect(ESPERADO.deudores.reduce((s, d) => s + d.importe, 0)).toBe(ESPERADO.mora.importe);
  });

  it("R4: pagos a cuenta 50.000,00 (C07, el recibo de T06, «Revisar imputación») y saldos a favor 58.000,00 (C09, el recibo de T07), exactos", () => {
    const a = medida(datos, CORTE, "pagos-a-cuenta");
    expect([a.valor, a.partidas.map((p) => [p.ref.id, p.clienteId])]).toEqual([ESPERADO.pagosACuenta.importe, [[id(ESPERADO.pagosACuenta.reciboAlias), ESPERADO.pagosACuenta.clienteId]]]);
    const f = medida(datos, CORTE, "saldos-a-favor");
    expect([f.valor, f.partidas.map((p) => [p.ref.id, p.clienteId])]).toEqual([ESPERADO.saldosAFavor.importe, [[id("T07-R"), ESPERADO.saldosAFavor.clienteId]]]);
    expect(posicionDelCliente(datos, "C09", CORTE)).toMatchObject({ saldo: 0, saldosAFavor: 5_800_000, pagosACuenta: 0 });
    expect(posicionDelCliente(datos, "C07", CORTE)).toMatchObject({ pagosACuenta: 5_000_000, saldosAFavor: 0 });
  });

  it("octubre de 2026: facturación, IVA, facturado con IVA, cobranza y retenciones; cobranza ≥ retenciones; D3 (X5): facturado = facturación + IVA", () => {
    const o = ESPERADO.octubre;
    expect(valor("facturacion-mes")).toBe(o.facturacion);
    expect(valor("iva-mes")).toBe(o.iva);
    expect(valor("facturado-con-iva-mes")).toBe(o.facturadoConIva);
    expect(valor("cobranza-mes")).toBe(o.cobranza);
    expect(valor("retenciones-mes")).toBe(o.retenciones);
    expect(o.cobranza).toBeGreaterThanOrEqual(o.retenciones);
    expect(o.facturacion + o.iva).toBe(o.facturadoConIva);
    expect(medida(datos, CORTE, "facturado-con-iva-mes").partidas).toHaveLength(o.comprobantes);
    expect(medida(datos, CORTE, "cobranza-mes").partidas).toHaveLength(o.recibos);
  });

  it("el recibo de T05 (03/11/2026) no está en la cobranza de octubre y T05-F sigue impaga (S1)", () => {
    const refs = medida(datos, CORTE, "cobranza-mes").partidas.map((p) => p.ref.id);
    expect(refs).not.toContain(id("T05-R"));
    expect(existeAlCorte(datos.recibos.find((r) => r.id === id("T05-R")) ?? (undefined as never), CORTE)).toBe(false);
  });

  it("C05 (el cliente del recorrido) al 31/10: saldo, mora, comprobantes con saldo, recibos y movimientos de la cuenta corriente (X4: el saldo final es su saldo neto)", () => {
    const c = ESPERADO.c05;
    expect(medidaControlada(datos, CORTE, "saldo", { clienteId: "C05" }).valor).toBe(c.saldo);
    expect(medidaControlada(datos, CORTE, "mora", { clienteId: "C05" }).valor).toBe(c.mora);
    expect(medida(datos, CORTE, "saldo", { clienteId: "C05" }).partidas).toHaveLength(c.comprobantesConSaldo);
    expect(medida(datos, CORTE, "mora", { clienteId: "C05" }).partidas).toHaveLength(c.enMoraComprobantes);
    expect(datos.recibos.filter((r) => r.clienteId === "C05" && r.fecha <= CORTE)).toHaveLength(c.recibos);
    const cuenta = cuentaDelCliente(datos, "C05", CORTE);
    expect(cuenta.movimientos).toHaveLength(c.movimientos);
    expect(cuenta.saldoFinal).toBe(medida(datos, CORTE, "saldo-neto", { clienteId: "C05" }).valor);
  });

  it("el oráculo independiente da las mismas cifras (importes, comprobantes y clientes en mora)", () => {
    const o = calcularOraculo(datos, CORTE);
    expect([o.empresa.saldo, o.empresa["saldo-neto"], o.empresa.mora]).toEqual([ESPERADO.saldo, ESPERADO.saldoNeto, ESPERADO.mora.importe]);
    expect([o.empresa["tramo-no-vencido"], o.empresa["tramo-1-30"], o.empresa["tramo-31-60"], o.empresa["tramo-61-90"], o.empresa["tramo-mas-90"]]).toEqual([
      ESPERADO.tramos["no-vencido"], ESPERADO.tramos["1-30"], ESPERADO.tramos["31-60"], ESPERADO.tramos["61-90"], ESPERADO.tramos["mas-90"],
    ]);
    expect([o.comprobantesEnMora, o.clientesEnMora]).toEqual([ESPERADO.mora.comprobantes, ESPERADO.mora.clientes]);
    expect([o.empresa["pagos-a-cuenta"], o.empresa["saldos-a-favor"]]).toEqual([ESPERADO.pagosACuenta.importe, ESPERADO.saldosAFavor.importe]);
    expect([o.empresa["facturacion-mes"], o.empresa["iva-mes"], o.empresa["cobranza-mes"], o.empresa["retenciones-mes"]]).toEqual([ESPERADO.octubre.facturacion, ESPERADO.octubre.iva, ESPERADO.octubre.cobranza, ESPERADO.octubre.retenciones]);
    expect(Object.fromEntries(Object.entries(o.moraPorCliente).map(([k, m]) => [k, m.importe]))).toEqual(Object.fromEntries(ESPERADO.deudores.map((d) => [d.clienteId, d.importe])));
    expect(o.porCliente["C05"]?.saldo).toBe(ESPERADO.c05.saldo);
  });

  it("D3: en los 22 cierres de mes de la semilla publicada cierran los controles cruzados X1 a X6", () => {
    for (const corte of cierresDeMes(datos)) expect(() => exigirControles(datos, corte), corte).not.toThrow();
  });
});

describe("G3 (5.3 y 5.4): los casos plantados dan lo escrito, por comprobante, en cada corte", () => {
  /** [alias, corte, saldo en pesos, atraso en días o null si el saldo es 0 y no se mira, tramo o null] */
  const FILAS = [
    ["T02-F", "2026-07-31", 810_000, -9, "no-vencido"],
    ["T02-F", "2026-08-31", 810_000, 22, "1-30"],
    ["T02-F", "2026-09-30", 410_000, 52, "31-60"],
    ["T02-F", "2026-10-31", 0, null, null],
    ["T04-F", "2026-10-31", 302_500, 0, "no-vencido"],
    ["T05-F", "2026-10-31", 363_000, 6, "1-30"],
    ["T05-F", "2026-11-03", 0, null, null],
    ["T07-F", "2026-07-31", 242_000, -14, "no-vencido"],
    ["T07-F", "2026-08-31", 0, null, null],
    ["T08-F", "2026-03-31", 1_210_000, -15, "no-vencido"],
    ["T08-F", "2026-04-30", 0, null, null],
    ["T12-d91", "2026-07-31", 968_000, -1, "no-vencido"],
    ["T12-d91", "2026-08-31", 726_000, 30, "1-30"],
    ["T12-d91", "2026-09-30", 726_000, 60, "31-60"],
    ["T12-d91", "2026-10-13", 726_000, 73, "61-90"],
    ["T12-d91", "2026-10-31", 605_000, 91, "mas-90"],
  ] as const;

  it.each(FILAS.map((f) => [`${f[0]} al ${f[1]}`, f] as const))("%s", (_nombre, [alias, corte, saldo, dias, tramo]) => {
    const c = comprobante(alias);
    expect(saldoAlCorte(datos, c.id, corte)).toBe(saldo * 100);
    if (dias !== null) {
      expect(atraso(c, corte)).toBe(dias);
      expect(tramoDe(atraso(c, corte))).toBe(tramo);
    }
  });

  it("T17: al 30/09 el cobro del 14/10 no existe (S1: «Después de la fecha de corte»); al 31/10 sí", () => {
    const r2 = datos.recibos.find((r) => r.id === id("T17-R2"));
    if (r2 === undefined) throw new Error("T17-R2");
    expect([existeAlCorte(r2, "2026-09-30"), existeAlCorte(r2, "2026-10-31")]).toEqual([false, true]);
  });

  it("T08: al 30/04 el saldo es 0 con las retenciones; contando solo el banco quedarían 40.000,00 «en mora» (atraso 15)", () => {
    const r = datos.recibos.find((x) => x.id === id("T08-R"));
    expect(r?.medios.filter((m) => m.medio.startsWith("retencion")).reduce((s, m) => s + m.importe, 0)).toBe(4_000_000);
    expect(atraso(comprobante("T08-F"), "2026-04-30")).toBe(15);
  });

  it("T06 y T07: los pagos sin imputar de 5.3 están (T06 a cuenta de C07 por 50.000,00; T07 deja 58.000,00)", () => {
    expect(medida(datos, "2026-10-31", "pagos-a-cuenta", { clienteId: "C07" }).valor).toBe(5_000_000);
    expect(medida(datos, "2026-10-31", "saldos-a-favor", { clienteId: "C09" }).valor).toBe(5_800_000);
    // Al 31/08 C09 todavía tiene facturas de relleno sin cobrar (S > 0), así que ese mismo recibo es un pago a cuenta y no un saldo a favor (R4: se decide por el cliente).
    expect(medida(datos, "2026-08-31", "saldos-a-favor", { clienteId: "C09" }).valor).toBe(0);
    expect(medida(datos, "2026-08-31", "pagos-a-cuenta", { clienteId: "C09" }).valor).toBe(5_800_000);
  });

  it("T05 es el único dato posterior al calendario (G2) y T04-F vence el último día, así que al 31/10 no está en mora", () => {
    expect(datos.recibos.filter((r) => r.fecha > datos.hasta).map((r) => r.id)).toEqual([id("T05-R")]);
    expect(medida(datos, CORTE, "mora").partidas.map((p) => p.ref.id)).not.toContain(id("T04-F"));
    expect(medida(datos, CORTE, "tramo-no-vencido").partidas.map((p) => p.ref.id)).toContain(id("T04-F"));
  });

  it("T17 al 31/10: T12-d91 tiene su NC y sus dos cobros, y el nombre del cliente es el de 5.1", () => {
    expect(comprobante("T12-d91").clienteId).toBe("C05");
    expect(nombreDe("C05")).toBe("Contratista Los Algarrobos Demo S.A.");
    expect(datos.comprobantes.find((c) => c.id === id("T17-NC"))?.asociadoA).toBe(id("T12-d91"));
  });
});

describe("G3: los resultados por comprobante de los casos plantados no dependen de la semilla (el relleno nunca los toca)", () => {
  const semillas = Array.from({ length: 50 }, (_, i) => SEMILLA_PUBLICADA + i);

  it.each(semillas)("semilla %i: T17, T02, T05, T07 y T08 dan lo mismo", (semilla) => {
    const g = generar(semilla);
    const saldo = (alias: string, corte: string) => saldoAlCorte(g.datos, g.plantados[alias] ?? "", corte);
    expect(["2026-07-31", "2026-08-31", "2026-09-30", "2026-10-31"].map((c) => saldo("T12-d91", c))).toEqual([96_800_000, 72_600_000, 72_600_000, 60_500_000]);
    expect(["2026-07-31", "2026-08-31", "2026-09-30", "2026-10-31"].map((c) => saldo("T02-F", c))).toEqual([81_000_000, 81_000_000, 41_000_000, 0]);
    expect([saldo("T05-F", "2026-10-31"), saldo("T05-F", "2026-11-03")]).toEqual([36_300_000, 0]);
    expect([saldo("T07-F", "2026-07-31"), saldo("T07-F", "2026-08-31")]).toEqual([24_200_000, 0]);
    expect([saldo("T08-F", "2026-03-31"), saldo("T08-F", "2026-04-30")]).toEqual([121_000_000, 0]);
  });
});
