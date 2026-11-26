// Modelo de vista de un cliente (docs/diseno-ui.md, 6.2): posición, regla, facturación y las tres hojas (comprobantes con saldo, recibos y cuenta corriente con
// los movimientos posteriores al corte aparte). Se prueba con C05 (el cliente del recorrido), C07 (pago a cuenta) y C09 (saldo a favor).
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { posicionDelCliente } from "../src/lib/dominio/corte.ts";
import { valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { vistaCliente } from "../src/lib/vistas/cliente.ts";
import { CORTE, DATOS, idPlantado } from "./fixtures/vistas.ts";

const ver = (id: string, corte: string = CORTE) => vistaCliente(DATOS, corte, id);

describe("C05 al 31/10/2026 (el cliente del recorrido)", () => {
  const v = ver("C05");

  it("los datos del cliente y las dos cifras grandes, con el cliente en cada medida", () => {
    expect(v.cliente).toMatchObject({ id: "C05", nombre: "Contratista Los Algarrobos Demo S.A.", plazoDias: 30 });
    expect(v.cliente.cuit).toMatch(/^\d{11}$/);
    expect(v.saldo).toEqual({ medida: { clave: "saldo", clienteId: "C05" }, importe: ESPERADO.c05.saldo });
    expect(v.mora).toEqual({ medida: { clave: "mora", clienteId: "C05" }, importe: ESPERADO.c05.mora });
    expect(v.moraSobreSaldo).toBe(Math.floor((ESPERADO.c05.mora * 2000 + ESPERADO.c05.saldo) / (2 * ESPERADO.c05.saldo)));
    expect(v.sinImputar).toBeNull();
    expect(v.regla.clienteId).toBe("C05");
    expect(v.regla.total).toBe(ESPERADO.c05.saldo);
  });

  it("facturación de doce meses del cliente", () => {
    expect(v.facturacion.clienteId).toBe("C05");
    expect(v.facturacion.meses).toHaveLength(12);
  });

  it("comprobantes con saldo: los 13 de esperado.ts, por vencimiento, y las filas suman el saldo del cliente", () => {
    const h = v.comprobantesConSaldo;
    expect(h.filas).toHaveLength(ESPERADO.c05.comprobantesConSaldo);
    for (let i = 1; i < h.filas.length; i++) expect((h.filas[i - 1]?.vencimiento ?? "") <= (h.filas[i]?.vencimiento ?? "")).toBe(true);
    expect(h.filas.reduce((s, f) => s + f.saldo, 0)).toBe(h.total.importe);
    expect(h.total).toEqual(v.saldo);
    const d91 = h.filas.find((f) => f.comprobanteId === idPlantado("T12-d91"));
    expect(d91).toMatchObject({ tipo: 1, atraso: 91, tramo: "mas-90", saldo: 60_500_000, total: 108_900_000, emision: "2026-07-02", vencimiento: "2026-08-01" });
    for (const f of h.filas) expect(f.saldo).toBeLessThanOrEqual(f.total);
  });

  it("recibos: los 45 de esperado.ts, el más nuevo primero, y lo imputado más lo que quedó a cuenta es lo cobrado", () => {
    const h = v.recibos;
    expect(h.filas).toHaveLength(ESPERADO.c05.recibos);
    for (let i = 1; i < h.filas.length; i++) expect((h.filas[i - 1]?.fecha ?? "") >= (h.filas[i]?.fecha ?? "")).toBe(true);
    for (const f of h.filas) expect(f.imputado + f.aCuenta, f.reciboId).toBe(f.medios.reduce((s, m) => s + m.importe, 0));
    expect(h.totales.imputado).toBe(h.filas.reduce((s, f) => s + f.imputado, 0));
    expect(h.totales.aCuenta).toBe(0);
  });

  it("cuenta corriente: los 102 movimientos de esperado.ts, en orden, con el saldo corrido que termina en el saldo neto, y el cobro del 03/11 aparte", () => {
    const c = v.cuentaCorriente;
    expect(c.movimientos).toHaveLength(ESPERADO.c05.movimientos);
    let corrido = 0;
    for (const m of c.movimientos) {
      expect(m.debe === 0 || m.haber === 0, `${m.fecha} ${m.origen.id}`).toBe(true);
      expect(m.debe + m.haber).toBeGreaterThan(0);
      corrido += m.debe - m.haber;
      expect(m.saldo, `${m.fecha} ${m.origen.id}`).toBe(corrido);
      expect(m.fecha <= CORTE).toBe(true);
    }
    expect(c.saldoFinal).toEqual({ medida: { clave: "saldo-neto", clienteId: "C05" }, importe: ESPERADO.c05.saldo });
    expect(c.movimientos.at(-1)?.saldo).toBe(c.saldoFinal.importe);
    expect(c.posteriores).toEqual([{ fecha: "2026-11-03", origen: { clase: "recibo", id: idPlantado("T05-R") }, debe: 0, haber: 36_300_000 }]);
  });

  it("el origen de cada movimiento dice si es un comprobante (con su tipo y servicio) o un recibo", () => {
    const movs = v.cuentaCorriente.movimientos;
    expect(movs.find((m) => m.origen.id === idPlantado("T12-d91"))).toMatchObject({ origen: { clase: "comprobante", tipo: 1, servicio: "alquiler-4x4" }, debe: 108_900_000, haber: 0 });
    expect(movs.find((m) => m.origen.id === idPlantado("T17-NC"))).toMatchObject({ origen: { clase: "comprobante", tipo: 3 }, debe: 0, haber: 12_100_000 });
    expect(movs.find((m) => m.origen.id === idPlantado("T17-R1"))).toMatchObject({ origen: { clase: "recibo", id: idPlantado("T17-R1") }, haber: 24_200_000 });
  });
});

describe("C05 al 30/09/2026 (el cambio de corte del recorrido)", () => {
  const v = ver("C05", "2026-09-30");

  it("la factura del recorrido tiene $ 726.000,00, 60 días y tramo 31 a 60, y el cobro del 14/10 pasa a «después de la fecha de corte»", () => {
    expect(v.comprobantesConSaldo.filas.find((f) => f.comprobanteId === idPlantado("T12-d91"))).toMatchObject({ saldo: 72_600_000, atraso: 60, tramo: "31-60" });
    expect(v.cuentaCorriente.posteriores.map((m) => m.origen.id)).toContain(idPlantado("T17-R2"));
    expect(v.cuentaCorriente.movimientos.some((m) => m.origen.id === idPlantado("T17-R2"))).toBe(false);
    expect(v.recibos.filas.some((f) => f.reciboId === idPlantado("T17-R2"))).toBe(false);
  });

  it("T05-F todavía no vence y figura en la hoja de comprobantes con saldo", () => {
    expect(v.comprobantesConSaldo.filas.find((f) => f.comprobanteId === idPlantado("T05-F"))).toMatchObject({ atraso: -25, tramo: "no-vencido" });
  });
});

describe("lo cobrado sin imputar", () => {
  it("C07 debe y tiene un pago a cuenta de $ 50.000,00: «pagos a cuenta», y el saldo neto es el saldo menos eso, con lo que termina la cuenta corriente", () => {
    const v = ver("C07");
    expect(v.sinImputar).toEqual({
      tipo: "pagos-a-cuenta",
      importe: { medida: { clave: "pagos-a-cuenta", clienteId: "C07" }, importe: ESPERADO.pagosACuenta.importe },
      saldoNeto: { medida: { clave: "saldo-neto", clienteId: "C07" }, importe: v.saldo.importe - ESPERADO.pagosACuenta.importe },
    });
    expect(v.cuentaCorriente.saldoFinal.importe).toBe(v.sinImputar?.saldoNeto.importe);
    expect(v.recibos.totales.aCuenta).toBe(ESPERADO.pagosACuenta.importe);
  });

  it("C09 no debe nada y pagó de más: «saldos a favor» por $ 58.000,00, saldo neto negativo, sin comprobantes con saldo ni mora ni porcentaje", () => {
    const v = ver("C09");
    expect(v.sinImputar?.tipo).toBe("saldos-a-favor");
    expect(v.sinImputar?.importe).toEqual({ medida: { clave: "saldos-a-favor", clienteId: "C09" }, importe: ESPERADO.saldosAFavor.importe });
    expect(v.sinImputar?.saldoNeto.importe).toBe(-ESPERADO.saldosAFavor.importe);
    expect(v.cuentaCorriente.saldoFinal.importe).toBe(-ESPERADO.saldosAFavor.importe);
    expect(v.saldo.importe).toBe(0);
    expect(v.moraSobreSaldo).toBeNull();
    expect(v.comprobantesConSaldo.filas).toEqual([]);
    expect(v.regla.vacia).toBe(true);
  });
});

describe("el cliente contra el dominio, en todos los clientes y varios cortes", () => {
  it("el saldo y la mora son los de las medidas; la cuenta corriente termina en saldo − a cuenta (D3, X4); las filas de saldo suman el saldo", () => {
    for (const corte of [CORTE, "2026-09-30", "2026-06-30", "2025-03-31"]) {
      for (const c of DATOS.clientes) {
        const v = ver(c.id, corte);
        const pos = posicionDelCliente(DATOS, c.id, corte);
        expect(v.saldo.importe, `${c.id} ${corte}`).toBe(valorDeMedida(DATOS, corte, "saldo", { clienteId: c.id }));
        expect(v.mora.importe, `${c.id} ${corte}`).toBe(valorDeMedida(DATOS, corte, "mora", { clienteId: c.id }));
        expect(v.cuentaCorriente.saldoFinal.importe, `${c.id} ${corte}`).toBe(v.saldo.importe - pos.aCuenta);
        expect(v.cuentaCorriente.saldoFinal.importe, `${c.id} ${corte}`).toBe(valorDeMedida(DATOS, corte, "saldo-neto", { clienteId: c.id }));
        expect(v.comprobantesConSaldo.filas.reduce((s, f) => s + f.saldo, 0), `${c.id} ${corte}`).toBe(v.saldo.importe);
        expect(v.recibos.totales.aCuenta, `${c.id} ${corte}`).toBe(pos.aCuenta);
        expect(v.cuentaCorriente.posteriores.every((m) => m.fecha > corte), `${c.id} ${corte}`).toBe(true);
      }
    }
  });

  it("un cliente que no existe lanza, con el id en el mensaje", () => {
    expect(() => ver("C99")).toThrow(/C99/);
  });
});
