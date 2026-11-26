// Modelo de vista del Resumen (docs/diseno-ui.md, 6.1): la mora y el saldo, la regla de tramos, el movimiento del mes, los deudores con «Otros»,
// lo que hay para revisar y los doce meses. Se prueba contra `esperado.ts` (las cifras de la semilla publicada) y con datos armados a mano para los bordes.
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { TRAMOS } from "../src/lib/dominio/antiguedad.ts";
import { clavesExistentes, valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { reglaDeTramos, vistaResumen } from "../src/lib/vistas/resumen.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { CORTE, DATOS, idPlantado } from "./fixtures/vistas.ts";

const v = vistaResumen(DATOS, CORTE);

describe("Resumen al 31/10/2026 (la semilla publicada)", () => {
  it("la mora, el saldo y qué parte del saldo es mora salen de esperado.ts", () => {
    expect(v.corte).toBe("2026-10-31");
    expect(v.mora).toEqual({ medida: { clave: "mora" }, importe: ESPERADO.mora.importe });
    expect(v.saldo).toEqual({ medida: { clave: "saldo" }, importe: ESPERADO.saldo });
    expect(v.moraSobreSaldo).toBe(ESPERADO.mora.milesimasDelSaldo);
    expect(v.clientesEnMora).toBe(ESPERADO.mora.clientes);
  });

  it("la regla de tramos: los cinco importes, sus porcentajes (suman 100,0 %) y su cantidad; la suma es el saldo (X1)", () => {
    expect(v.regla.filas.map((f) => f.tramo)).toEqual(["no-vencido", "1-30", "31-60", "61-90", "mas-90"]);
    for (const f of v.regla.filas) {
      expect(f.cifra.importe, f.tramo).toBe(ESPERADO.tramos[f.tramo]);
      expect(f.milesimas, f.tramo).toBe(ESPERADO.milesimasDeTramos[f.tramo]);
      expect(f.cifra.medida.clave).toBe(`tramo-${f.tramo}`);
      expect(f.cifra.medida.clienteId).toBeUndefined();
    }
    expect(v.regla.filas.reduce((s, f) => s + (f.milesimas ?? 0), 0)).toBe(1000);
    expect(v.regla.total).toBe(ESPERADO.saldo);
    expect(v.regla.vacia).toBe(false);
    expect(v.regla.clienteId).toBeUndefined();
    expect(v.regla.filas.reduce((n, f) => n + f.cantidad, 0)).toBeGreaterThan(0);
  });

  it("el movimiento del mes es octubre de 2026, con los conteos de esperado.ts", () => {
    expect(v.movimiento.mes).toBe("2026-10");
    expect(v.movimiento.facturacion.importe).toBe(ESPERADO.octubre.facturacion);
    expect(v.movimiento.facturacion.medida).toEqual({ clave: "facturacion-mes", mes: "2026-10" });
    expect(v.movimiento.comprobantes).toBe(ESPERADO.octubre.comprobantes);
    expect(v.movimiento.cobranza.importe).toBe(ESPERADO.octubre.cobranza);
    expect(v.movimiento.recibos).toBe(ESPERADO.octubre.recibos);
    expect(v.movimiento.retenciones.importe).toBe(ESPERADO.octubre.retenciones);
  });

  it("deudores: los cinco mayores con sus días, su tramo más antiguo y su porcentaje, como en esperado.ts", () => {
    expect(v.deudores.filas).toHaveLength(5);
    v.deudores.filas.forEach((f, i) => {
      const esperado = ESPERADO.deudores[i];
      expect(f.clienteId).toBe(esperado?.clienteId);
      expect(f.mora.importe, f.clienteId).toBe(esperado?.importe);
      expect(f.mora.medida, f.clienteId).toEqual({ clave: "mora", clienteId: f.clienteId });
      expect(f.milesimas, f.clienteId).toBe(esperado?.milesimas);
      expect(f.diasDelMasAtrasado, f.clienteId).toBe(esperado?.diasDelMasAtrasado);
      expect(f.tramoMasAntiguo, f.clienteId).toBe(esperado?.tramoMasAntiguo);
    });
    expect(v.deudores.filas[0]?.nombre).toBe("Contratista Los Algarrobos Demo S.A.");
  });

  it("«Otros» es el sexto deudor (C07, un cliente, un comprobante), por resta, y la tabla suma la mora y 100,0 %", () => {
    expect(v.deudores.otros).toEqual({
      clientes: ESPERADO.otros.clientes,
      comprobantes: ESPERADO.otros.comprobantes,
      mora: { medida: { clave: "mora-otros" }, importe: ESPERADO.otros.importe },
      milesimas: ESPERADO.deudores[5]?.milesimas,
    });
    expect(v.deudores.total).toBe(ESPERADO.mora.importe);
    expect(v.deudores.clientes).toBe(6);
    const mil = [...v.deudores.filas.map((f) => f.milesimas ?? 0), v.deudores.otros?.milesimas ?? 0];
    expect(mil.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(v.deudores.filas.reduce((s, f) => s + f.mora.importe, v.deudores.otros?.mora.importe ?? 0)).toBe(v.mora.importe);
  });

  it("para revisar: el pago a cuenta de C07 (T06-R) y el saldo a favor de C09, con el total de cada tabla", () => {
    const p = v.paraRevisar;
    expect(p.pagosACuenta.filas).toEqual([
      { clienteId: "C07", nombre: "Montajes Sierra Chica Demo S.R.L.", reciboId: idPlantado("T06-R"), fecha: "2026-10-20", importe: ESPERADO.pagosACuenta.importe, desglose: { clave: "pagos-a-cuenta", clienteId: "C07" } },
    ]);
    expect(p.pagosACuenta.total).toEqual({ medida: { clave: "pagos-a-cuenta" }, importe: ESPERADO.pagosACuenta.importe });
    expect(p.saldosAFavor.filas).toHaveLength(1);
    expect(p.saldosAFavor.filas[0]).toMatchObject({ clienteId: "C09", importe: ESPERADO.saldosAFavor.importe, desglose: { clave: "saldos-a-favor", clienteId: "C09" } });
    expect(p.saldosAFavor.total).toEqual({ medida: { clave: "saldos-a-favor" }, importe: ESPERADO.saldosAFavor.importe });
    expect(p.cantidad).toBe(2);
  });

  it("los doce meses vienen listos para el gráfico y su tabla; el último es el del corte", () => {
    expect(v.meses.meses).toHaveLength(12);
    expect(v.meses.mesDelCorte).toBe("2026-10");
    expect(v.meses.meses[11]?.cobranza.importe).toBe(v.movimiento.cobranza.importe);
  });
});

describe("reglaDeTramos", () => {
  it("de un cliente: lleva su id en la regla y en cada medida, y la suma de sus tramos es su saldo", () => {
    const r = reglaDeTramos(DATOS, CORTE, "C05");
    expect(r.clienteId).toBe("C05");
    for (const f of r.filas) expect(f.cifra.medida.clienteId).toBe("C05");
    expect(r.total).toBe(ESPERADO.c05.saldo);
    expect(r.filas[4]?.cifra.importe).toBe(ESPERADO.tramos["mas-90"]);
    expect(r.filas.reduce((n, f) => n + f.cantidad, 0)).toBe(ESPERADO.c05.comprobantesConSaldo);
  });

  it("cada importe es el valor de su medida de tramo en el dominio", () => {
    for (const c of DATOS.clientes) {
      const r = reglaDeTramos(DATOS, CORTE, c.id);
      r.filas.forEach((f, i) => expect(f.cifra.importe, `${c.id} ${f.tramo}`).toBe(valorDeMedida(DATOS, CORTE, `tramo-${TRAMOS[i]?.clave}` as never, { clienteId: c.id })));
    }
  });

  it("un cliente sin saldo da una regla vacía, sin porcentajes, y la pantalla no tiene nada que abrir", () => {
    const sinSaldo = DATOS.clientes.find((c) => valorDeMedida(DATOS, CORTE, "saldo", { clienteId: c.id }) === 0);
    expect(sinSaldo, "algún cliente sin saldo al 31/10/2026").toBeDefined();
    const r = reglaDeTramos(DATOS, CORTE, sinSaldo?.id);
    expect(r.vacia).toBe(true);
    expect(r.total).toBe(0);
    for (const f of r.filas) {
      expect(f.milesimas).toBeNull();
      expect(f.cantidad).toBe(0);
    }
  });

  it("un cliente que no existe lanza", () => {
    expect(() => reglaDeTramos(DATOS, CORTE, "C99")).toThrow(/C99/);
  });
});

describe("Resumen: los bordes", () => {
  it("sin ningún dato: todo en cero, sin porcentajes y sin deudores", () => {
    const vacio = armarDatos({}).datos;
    const r = vistaResumen(vacio, "2026-10-31");
    expect(r.mora.importe).toBe(0);
    expect(r.saldo.importe).toBe(0);
    expect(r.moraSobreSaldo).toBeNull();
    expect(r.regla.vacia).toBe(true);
    expect(r.deudores).toEqual({ filas: [], otros: null, total: 0, clientes: 0 });
    expect(r.paraRevisar).toMatchObject({ cantidad: 0, pagosACuenta: { filas: [] }, saldosAFavor: { filas: [] } });
    expect(r.movimiento.comprobantes).toBe(0);
    expect(r.movimiento.recibos).toBe(0);
  });

  it("con saldo pero sin mora: la mora es 0 y su porcentaje 0,0 % (no «—»)", () => {
    const { datos } = armarDatos({ comprobantes: [{ clave: "F", cliente: "C01", emision: "2026-10-20", neto: pesos(100_000) }] });
    const r = vistaResumen(datos, "2026-10-31");
    expect(r.mora.importe).toBe(0);
    expect(r.saldo.importe).toBeGreaterThan(0);
    expect(r.moraSobreSaldo).toBe(0);
    expect(r.deudores.filas).toEqual([]);
    expect(r.deudores.otros).toBeNull();
  });

  it("con cinco deudores o menos no hay «Otros» y la clave mora-otros no existe", () => {
    const { datos } = armarDatos({ comprobantes: ["C01", "C02", "C03"].map((cliente) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(100_000) })) });
    const r = vistaResumen(datos, "2026-10-31");
    expect(r.deudores.otros).toBeNull();
    expect(r.deudores.filas).toHaveLength(3);
    expect(clavesExistentes(datos, "2026-10-31")).not.toContain("mora-otros");
  });

  it("con siete deudores «Otros» suma a los dos menores (M4) y el reparto, con «Otros» como una fila más, sigue sumando 100,0 %", () => {
    const clientes = ["C01", "C02", "C03", "C04", "C05", "C06", "C07"];
    const montos = [900_000, 800_000, 700_000, 600_000, 500_000, 300_000, 200_000];
    const { datos } = armarDatos({ comprobantes: clientes.map((cliente, i) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(montos[i] ?? 0) })) });
    const r = vistaResumen(datos, "2026-10-31");
    expect(r.deudores.filas).toHaveLength(5);
    expect(r.deudores.otros?.clientes).toBe(2);
    expect(r.deudores.otros?.comprobantes).toBe(2);
    expect(r.deudores.filas.reduce((s, f) => s + f.mora.importe, r.deudores.otros?.mora.importe ?? 0)).toBe(r.mora.importe);
    expect(r.deudores.filas.reduce((s, f) => s + (f.milesimas ?? 0), r.deudores.otros?.milesimas ?? 0)).toBe(1000);
    expect(r.deudores.filas[0]?.diasDelMasAtrasado).toBeGreaterThan(90);
    expect(r.deudores.filas[0]?.tramoMasAntiguo).toBe("mas-90");
  });

  it("un cliente con dos pagos a cuenta no enlaza ninguno de los dos importes (el desglose suma los dos y no coincidiría con cada fila)", () => {
    const { datos } = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C01", emision: "2026-09-01", neto: pesos(100_000) }],
      recibos: [
        { cliente: "C01", fecha: "2026-09-10", medios: [{ importe: pesos(1_000) }] },
        { cliente: "C01", fecha: "2026-09-20", medios: [{ importe: pesos(2_000) }] },
      ],
    });
    const r = vistaResumen(datos, "2026-10-31");
    expect(r.paraRevisar.pagosACuenta.filas).toHaveLength(2);
    for (const f of r.paraRevisar.pagosACuenta.filas) expect(f.desglose).toBeNull();
    expect(r.paraRevisar.pagosACuenta.total.importe).toBe(pesos(3_000));
  });
});
