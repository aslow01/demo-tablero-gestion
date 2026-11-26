// La propiedad de D2 (docs/diseno.md, 6.6; docs/plan.md, paso 3.5): con 50 semillas × los 22 cierres de mes × las 15 claves del catálogo ×
// la empresa y los 13 clientes (más `mora-otros` cuando existe y las cinco medidas del mes en cada uno de los doce meses de la tabla), el
// valor por agregación y la suma de las partidas por listado coinciden, al centavo (`controlar` no lanza). Los controles cruzados X1 a X6
// (D3) van en `propiedad-cierre-cruzados.test.ts`, otro archivo, para que corran en paralelo. Los datos salen de un generador provisional (`tests/fixtures/generadorProvisional.ts`); el de verdad tiene sus propios archivos: `propiedad-cierre-real.test.ts` y `propiedad-cierre-cruzados-real.test.ts`.
//
// Mutaciones plantadas (D2): una en cada camino, y cada una tiene que hacer fallar su control (ver `mutaciones-d2.test.ts`).
import { describe, expect, it } from "vitest";
import { cierresDeMes, posicionDelCliente } from "../src/lib/dominio/corte.ts";
import { validarDatos } from "../src/lib/dominio/validadores.ts";
import { generarProvisional } from "./fixtures/generadorProvisional.ts";
import { SEMILLAS_DE_LA_PROPIEDAD as SEMILLAS, problemasDeD2 } from "./fixtures/propiedades.ts";

describe("D2: el generador provisional produce datos válidos", () => {
  it.each(SEMILLAS)("G5: la semilla %i pasa los validadores C2, C3, R1, R3, C4 y los de G5", (semilla) => {
    const { datos } = generarProvisional(semilla);
    expect(validarDatos(datos)).toEqual([]);
    expect(datos.comprobantes.length).toBeGreaterThan(400);
    expect(datos.recibos.length).toBeGreaterThan(300);
  });

  it("el provisional recorre todos los caminos: NC, ND, retenciones, a cuenta, saldo a favor, cobros parciales y un recibo posterior al calendario", () => {
    const { datos } = generarProvisional(SEMILLAS[0] ?? 0);
    expect(datos.comprobantes.some((c) => c.tipo === 3)).toBe(true);
    expect(datos.comprobantes.some((c) => c.tipo === 2)).toBe(true);
    expect(datos.recibos.some((r) => r.medios.some((m) => m.medio === "retencion-iibb"))).toBe(true);
    expect(datos.recibos.some((r) => r.medios.some((m) => m.medio === "retencion-iva"))).toBe(true);
    expect(datos.recibos.some((r) => r.imputaciones.length === 0)).toBe(true);
    expect(datos.recibos.filter((r) => r.fecha > datos.hasta)).toHaveLength(1);
    const porFactura = new Map<string, number>();
    for (const r of datos.recibos) for (const i of r.imputaciones) porFactura.set(i.comprobanteId, (porFactura.get(i.comprobanteId) ?? 0) + 1);
    expect([...porFactura.values()].some((n) => n > 1)).toBe(true);
    // R4: en algún corte hay clientes con pago a cuenta sin imputar y otros con saldo a favor.
    let conPagoACuenta = false;
    let conSaldoAFavor = false;
    for (const corte of cierresDeMes(datos)) {
      for (const c of datos.clientes) {
        const p = posicionDelCliente(datos, c.id, corte);
        conPagoACuenta ||= p.pagosACuenta > 0;
        conSaldoAFavor ||= p.saldosAFavor > 0;
      }
    }
    expect([conPagoACuenta, conSaldoAFavor]).toEqual([true, true]);
  });
});

describe("D2: controlar no lanza en ninguna medida (50 semillas × 22 cierres × 15 claves × empresa y 13 clientes)", () => {
  it.each(SEMILLAS)("D2: semilla %i", { timeout: 120_000 }, (semilla) => {
    expect(problemasDeD2(generarProvisional(semilla).datos)).toEqual([]);
  });
});
