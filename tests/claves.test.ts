// Qué medios de cobro son retenciones (docs/diseno.md, R2): `claves.ts` es el único módulo que comparten los dos caminos de cálculo, y
// `esRetencion` decide qué importes entran en «de lo cual, retenciones». Es una definición, no un nombre: se prueba con números en cada camino.
import { describe, expect, it } from "vitest";
import { valorAgregado } from "../src/lib/dominio/agregados.ts";
import { MEDIOS, MEDIOS_DE_RETENCION, esRetencion } from "../src/lib/dominio/claves.ts";
import { controlar, medida } from "../src/lib/dominio/medidas.ts";
import { partidasDe } from "../src/lib/dominio/partidas.ts";
import type { Medio } from "../src/lib/dominio/tipos.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";

/** La tabla de verdad de R2, escrita a mano: transferencia y cheque son dinero; las tres retenciones, no. */
const TABLA_DE_VERDAD: readonly [Medio, boolean][] = [
  ["transferencia", false],
  ["cheque", false],
  ["retencion-iibb", true],
  ["retencion-ganancias", true],
  ["retencion-iva", true],
];

describe("R2: qué medios son retenciones", () => {
  it("R2: MEDIOS lista los cinco medios del tipo, ni uno más ni uno menos", () => {
    expect([...MEDIOS].sort()).toEqual(TABLA_DE_VERDAD.map(([m]) => m).sort());
  });

  it.each(TABLA_DE_VERDAD)("R2: esRetencion(%s) = %s", (medio, esperado) => {
    expect(esRetencion(medio)).toBe(esperado);
  });

  it("R2: MEDIOS_DE_RETENCION son exactamente los tres de la tabla, en el orden de MEDIOS", () => {
    expect([...MEDIOS_DE_RETENCION]).toEqual(["retencion-iibb", "retencion-ganancias", "retencion-iva"]);
  });
});

describe("R2: cada medio de retención suma en «retenciones-mes» (y en la cobranza), por los dos caminos; los otros medios, no", () => {
  /** C02: una factura de 1.210.000,00 cobrada el 30/04 con 1.000.000,00 de transferencia y 210.000,00 del medio que se prueba. */
  function recibo(medio: Medio) {
    const principal: Medio = medio === "transferencia" ? "cheque" : "transferencia";
    return armarDatos({
      comprobantes: [{ clave: "F", cliente: "C02", emision: "2026-03-01", neto: pesos(1_000_000) }],
      recibos: [{ clave: "R", cliente: "C02", fecha: "2026-04-30", medios: [{ medio: principal, importe: pesos(1_000_000) }, { medio, importe: pesos(210_000) }], imputaciones: [{ comprobante: "F", importe: pesos(1_210_000) }] }],
    }).datos;
  }

  it.each(TABLA_DE_VERDAD)("R2: un recibo con %s → retenciones del mes = %s", (medio, esRet) => {
    const datos = recibo(medio);
    const esperado = esRet ? 21_000_000 : 0;
    expect(valorAgregado(datos, "2026-04-30", "retenciones-mes")).toBe(esperado);
    expect(partidasDe(datos, "2026-04-30", "retenciones-mes").map((p) => p.importe)).toEqual(esRet ? [21_000_000] : []);
    // La cobranza cuenta todos los medios, y la medida cierra (valor = suma de partidas).
    expect(valorAgregado(datos, "2026-04-30", "cobranza-mes")).toBe(121_000_000);
    expect(() => controlar(medida(datos, "2026-04-30", "retenciones-mes"))).not.toThrow();
  });

  it.each(TABLA_DE_VERDAD.filter(([, esRet]) => esRet))("R2: con %s la nota de la partida nombra la retención", (medio) => {
    const [p] = partidasDe(recibo(medio), "2026-04-30", "retenciones-mes");
    expect(p?.nota).toMatch(/^Retención /);
  });
});
