// Modelo de vista de un comprobante (docs/diseno-ui.md, 6.3 y 5.9.3-5.9.4): situación al corte, datos, movimientos con saldo corrido y los posteriores al corte,
// que se muestran pero no cuentan (S1). Se prueba con los casos plantados de la semilla publicada (los del recorrido de 2 minutos) y con datos armados a mano.
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { saldoAlCorte } from "../src/lib/dominio/corte.ts";
import { comprobantePorId, detalleDeRecibo, reciboPorId, vistaComprobante } from "../src/lib/vistas/comprobante.ts";
import type { VistaDeComprobanteVigente } from "../src/lib/vistas/comprobante.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { CORTE, DATOS, idPlantado } from "./fixtures/vistas.ts";

function vigente(id: string, corte: string = CORTE): VistaDeComprobanteVigente {
  const v = vistaComprobante(DATOS, corte, id);
  if (v.clase !== "comprobante") throw new Error(`Se esperaba un comprobante vigente y vino ${v.clase}.`);
  return v;
}

describe("T12-d91 (el comprobante del recorrido de 2 minutos): factura con una nota de crédito y dos cobros parciales", () => {
  const id = idPlantado("T12-d91");

  it("al 31/10/2026: 91 días de atraso, tramo «más de 90», saldo de $ 605.000,00 y los cuatro movimientos con su saldo corrido", () => {
    const v = vigente(id);
    expect(v.situacion).toMatchObject({ estado: "con-saldo", saldo: ESPERADO.tramos["mas-90"], atraso: ESPERADO.comprobanteMasAtrasado.dias, tramo: "mas-90", conCobros: true });
    expect(v.movimientos.map((m) => [m.fecha, m.clase, m.debe, m.haber, m.saldo, m.parcial])).toEqual([
      ["2026-07-02", "emision", 108_900_000, 0, 108_900_000, false],
      ["2026-07-20", "nota-de-credito", 0, 12_100_000, 96_800_000, false],
      ["2026-08-12", "cobro", 0, 24_200_000, 72_600_000, true],
      ["2026-10-14", "cobro", 0, 12_100_000, 60_500_000, true],
    ]);
    expect(v.posteriores).toEqual([]);
    expect(v.movimientos.map((m) => m.referencia)[0]).toBe(id);
    expect(v.movimientos[2]?.referencia).toBe(idPlantado("T17-R1"));
  });

  it("al 30/09/2026 (el cambio de corte del recorrido): $ 726.000,00, 60 días, tramo 31 a 60, y el cobro del 14/10 pasa a «después de la fecha de corte»", () => {
    const v = vigente(id, "2026-09-30");
    expect(v.situacion).toMatchObject({ estado: "con-saldo", saldo: 72_600_000, atraso: 60, tramo: "31-60" });
    expect(v.movimientos).toHaveLength(3);
    expect(v.posteriores).toEqual([{ fecha: "2026-10-14", clase: "cobro", referencia: idPlantado("T17-R2"), debe: 0, haber: 12_100_000, parcial: true, saldo: null }]);
  });

  it("el ubicador cae en el tramo del atraso, con su posición", () => {
    const v = vigente(id);
    expect(v.situacion.estado === "con-saldo" && v.situacion.ubicador).toEqual({ atraso: 91, tramo: "mas-90", milesimas: 801, borde: null });
    const antes = vigente(id, "2026-09-30");
    expect(antes.situacion.estado === "con-saldo" && antes.situacion.ubicador).toEqual({ atraso: 60, tramo: "31-60", milesimas: 596, borde: null });
  });

  it("los datos: cliente, plazo, servicio, importes (neto + IVA = total) y la nota de crédito asociada", () => {
    const { datos } = vigente(id);
    expect(datos).toMatchObject({ id, tipo: 1, clienteId: "C05", nombreDelCliente: "Contratista Los Algarrobos Demo S.A.", plazoDias: 30, emision: "2026-07-02", vencimiento: "2026-08-01", servicio: "alquiler-4x4", asociadaA: null });
    expect(datos.neto + datos.iva).toBe(datos.total);
    expect(datos.notasDeCredito).toEqual([{ id: idPlantado("T17-NC"), tipo: 3 }]);
  });

  it("S1: una nota de crédito posterior al corte no figura entre los datos, pero sí entre los movimientos posteriores", () => {
    const v = vigente(id, "2026-07-15");
    expect(v.datos.notasDeCredito).toEqual([]);
    expect(v.movimientos.map((m) => m.clase)).toEqual(["emision"]);
    expect(v.posteriores.map((m) => m.clase)).toEqual(["nota-de-credito", "cobro", "cobro"]);
    expect(v.posteriores.every((m) => m.saldo === null)).toBe(true);
    expect(v.situacion).toMatchObject({ estado: "con-saldo", saldo: 108_900_000, conCobros: false });
  });
});

describe("T05-F: el cobro del 03/11/2026 es posterior a todo el calendario", () => {
  it("al 31/10/2026 sigue impaga, con 6 días de atraso, y el cobro aparece aparte y sin saldo", () => {
    const v = vigente(idPlantado("T05-F"));
    expect(v.situacion).toMatchObject({ estado: "con-saldo", saldo: 36_300_000, atraso: 6, tramo: "1-30", conCobros: false });
    expect(v.posteriores).toEqual([{ fecha: "2026-11-03", clase: "cobro", referencia: idPlantado("T05-R"), debe: 0, haber: 36_300_000, parcial: false, saldo: null }]);
  });
});

describe("T04-F: vence exactamente el 31/10/2026", () => {
  it("atraso 0: no está vencido (S3) y no tiene movimientos más que la emisión", () => {
    const v = vigente(idPlantado("T04-F"));
    expect(v.situacion).toMatchObject({ estado: "con-saldo", atraso: 0, tramo: "no-vencido" });
    expect(v.movimientos).toHaveLength(1);
  });
});

describe("T02-F: tres cobros, el segundo y el tercero después del vencimiento", () => {
  it("el atraso se cuenta desde el vencimiento original: 52 días al 30/09/2026, tras el pago del 15/09, y los dos primeros cobros son parciales", () => {
    const v = vigente(idPlantado("T02-F"), "2026-09-30");
    expect(v.situacion).toMatchObject({ estado: "con-saldo", atraso: 52, conCobros: true });
    expect(v.movimientos.filter((m) => m.clase === "cobro").map((m) => m.parcial)).toEqual([true, true]);
    expect(v.posteriores.map((m) => [m.clase, m.parcial])).toEqual([["cobro", false]]);
  });

  it("al 31/10/2026 está cancelada: el último cobro lo cierra y no es parcial", () => {
    const v = vigente(idPlantado("T02-F"));
    expect(v.situacion).toEqual({ estado: "cancelado", saldo: 0, fechaDelUltimoMovimiento: "2026-10-12" });
    expect(v.movimientos.at(-1)).toMatchObject({ clase: "cobro", parcial: false, saldo: 0 });
  });
});

describe("T08-F: cancelada con transferencia y retenciones", () => {
  it("está cancelada desde el 30/04/2026; el detalle del recibo suma los tres medios (R2) y no deja nada a cuenta", () => {
    const v = vigente(idPlantado("T08-F"));
    expect(v.situacion).toEqual({ estado: "cancelado", saldo: 0, fechaDelUltimoMovimiento: "2026-04-30" });
    const d = detalleDeRecibo(DATOS, idPlantado("T08-R"));
    expect(d.medios.map((m) => [m.medio, m.importe])).toEqual([["transferencia", 117_000_000], ["retencion-iibb", 2_500_000], ["retencion-ganancias", 1_500_000]]);
    expect(d.total).toBe(121_000_000);
    expect(d.imputaciones).toEqual([{ comprobante: { id: idPlantado("T08-F"), tipo: 1 }, importe: 121_000_000 }]);
    expect(d.imputado).toBe(121_000_000);
    expect(d.aCuenta).toBe(0);
  });
});

describe("la nota de crédito y el comprobante posterior al corte", () => {
  it("una nota de crédito se explica por su factura y no tiene saldo ni movimientos", () => {
    const v = vistaComprobante(DATOS, CORTE, idPlantado("T17-NC"));
    expect(v.clase).toBe("nota-de-credito");
    if (v.clase !== "nota-de-credito") return;
    expect(v.asociada).toEqual({ id: idPlantado("T12-d91"), tipo: 1 });
    expect(v.datos).toMatchObject({ tipo: 3, vencimiento: "2026-07-20", asociadaA: { id: idPlantado("T12-d91"), tipo: 1 } });
    expect("movimientos" in v).toBe(false);
  });

  it("un comprobante emitido después del corte no existía: ofrece verlo al cierre de su mes", () => {
    const v = vistaComprobante(DATOS, "2026-06-30", idPlantado("T12-d91"));
    expect(v).toMatchObject({ clase: "posterior-al-corte", verAl: "2026-07-31", datos: { id: idPlantado("T12-d91"), emision: "2026-07-02" } });
    expect("movimientos" in v).toBe(false);
  });

  it("una nota de crédito posterior al corte también es «posterior»: el corte manda antes que el tipo", () => {
    expect(vistaComprobante(DATOS, "2026-07-15", idPlantado("T17-NC")).clase).toBe("posterior-al-corte");
  });

  it("emitido el último día del mes: el cierre es ese mismo día; en febrero, el 28", () => {
    const { datos, id } = armarDatos({ comprobantes: [{ clave: "A", cliente: "C01", emision: "2026-03-31", neto: pesos(1_000) }, { clave: "B", cliente: "C01", emision: "2025-02-10", neto: pesos(1_000) }] });
    expect(vistaComprobante(datos, "2026-02-28", id("A"))).toMatchObject({ verAl: "2026-03-31" });
    expect(vistaComprobante(datos, "2025-01-31", id("B"))).toMatchObject({ verAl: "2025-02-28" });
  });

  it("un id que no existe lanza, con el id en el mensaje", () => {
    expect(() => vistaComprobante(DATOS, CORTE, "1-0003-99999999")).toThrow(/1-0003-99999999/);
  });
});

describe("anulada por nota de crédito", () => {
  const { datos, id } = armarDatos({
    comprobantes: [
      { clave: "F", cliente: "C01", emision: "2026-03-01", neto: pesos(100_000) },
      { clave: "NC", tipo: 3, cliente: "C01", emision: "2026-03-15", neto: pesos(100_000), asociadoA: "F" },
      { clave: "G", cliente: "C01", emision: "2026-03-01", neto: pesos(50_000) },
      { clave: "NCP", tipo: 3, cliente: "C01", emision: "2026-03-20", neto: pesos(20_000), asociadoA: "G" },
    ],
    recibos: [{ cliente: "C01", fecha: "2026-04-10", medios: [{ importe: pesos(36_300) }], imputaciones: [{ comprobante: "G", importe: pesos(36_300) }] }],
  });

  it("si las notas de crédito cubren todo el total, queda «anulado» con la fecha de la nota", () => {
    const v = vistaComprobante(datos, "2026-10-31", id("F"));
    expect(v).toMatchObject({ clase: "comprobante", situacion: { estado: "anulado", saldo: 0, fechaDelUltimoMovimiento: "2026-03-15" } });
  });

  it("antes de la nota todavía debe todo; una nota que no cubre todo, sumada a un cobro, es «cancelado»", () => {
    expect(vistaComprobante(datos, "2026-03-10", id("F"))).toMatchObject({ situacion: { estado: "con-saldo", saldo: pesos(121_000) } });
    expect(vistaComprobante(datos, "2026-10-31", id("G"))).toMatchObject({ situacion: { estado: "cancelado", fechaDelUltimoMovimiento: "2026-04-10" } });
  });
});

describe("S2: el saldo que dan los movimientos es el saldo del dominio", () => {
  it("para todos los comprobantes con saldo o cancelados, al corte por defecto y a otros tres cortes", () => {
    for (const corte of [CORTE, "2026-09-30", "2026-03-31", "2025-06-30"]) {
      for (const c of DATOS.comprobantes) {
        const v = vistaComprobante(DATOS, corte, c.id);
        if (v.clase !== "comprobante") continue;
        const ultimo = v.movimientos.at(-1);
        expect(ultimo?.saldo, `${c.id} al ${corte}`).toBe(saldoAlCorte(DATOS, c.id, corte));
        expect(v.situacion.saldo, `${c.id} al ${corte}`).toBe(saldoAlCorte(DATOS, c.id, corte));
        for (const m of v.movimientos) expect(m.fecha <= corte).toBe(true);
        for (const m of v.posteriores) expect(m.fecha > corte).toBe(true);
      }
    }
  });
});

describe("detalleDeRecibo y los índices por id", () => {
  it("T07-R: pagó de más; lo que no se imputó es el saldo a favor de C09 (esperado.ts)", () => {
    const d = detalleDeRecibo(DATOS, idPlantado("T07-R"));
    expect(d.clienteId).toBe("C09");
    expect(d.total).toBe(30_000_000);
    expect(d.imputado).toBe(24_200_000);
    expect(d.aCuenta).toBe(ESPERADO.saldosAFavor.importe);
  });

  it("T06-R: sin imputaciones, todo es a cuenta (el pago a cuenta de C07)", () => {
    const d = detalleDeRecibo(DATOS, idPlantado("T06-R"));
    expect(d.imputaciones).toEqual([]);
    expect(d.aCuenta).toBe(ESPERADO.pagosACuenta.importe);
  });

  it("ningún recibo imputa dos veces al mismo comprobante (la lista del detalle usa ese id como clave)", () => {
    for (const r of DATOS.recibos) {
      const ids = detalleDeRecibo(DATOS, r.id).imputaciones.map((i) => i.comprobante.id);
      expect(new Set(ids).size, r.id).toBe(ids.length);
    }
  });

  it("en los 618 recibos: total = imputado + a cuenta, y cada recibo apunta a comprobantes que existen", () => {
    for (const r of DATOS.recibos) {
      const d = detalleDeRecibo(DATOS, r.id);
      expect(d.total, r.id).toBe(d.imputado + d.aCuenta);
      expect(d.aCuenta, r.id).toBeGreaterThanOrEqual(0);
      for (const i of d.imputaciones) expect(comprobantePorId(DATOS, i.comprobante.id)?.clienteId, r.id).toBe(d.clienteId);
    }
  });

  it("un recibo que no existe lanza; el índice devuelve undefined para lo que no está", () => {
    expect(() => detalleDeRecibo(DATOS, "R-0003-99999999")).toThrow(/R-0003-99999999/);
    expect(reciboPorId(DATOS, "R-0003-99999999")).toBeUndefined();
    expect(comprobantePorId(DATOS, "nada")).toBeUndefined();
    expect(reciboPorId(DATOS, idPlantado("T06-R"))?.clienteId).toBe("C07");
  });
});
