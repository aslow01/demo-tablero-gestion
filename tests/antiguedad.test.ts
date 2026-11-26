// Antigüedad de saldos (docs/diseno.md, 6.5): A1, los tramos excluyentes sobre los días de atraso. Cada test lleva el identificador de la regla.
import { describe, expect, it } from "vitest";
import { CLAVE_DE_MEDIDA_DEL_TRAMO, TRAMOS, tramoDe } from "../src/lib/dominio/antiguedad.ts";
import { saldosAlCorte } from "../src/lib/dominio/corte.ts";
import { ROTULO_DE_TRAMO } from "../src/lib/dominio/textos.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

describe("A1: tramos excluyentes No vencido (d ≤ 0), 1–30, 31–60, 61–90 y Más de 90 (d ≥ 91)", () => {
  it.each([
    [0, "no-vencido"],
    [1, "1-30"],
    [30, "1-30"],
    [31, "31-60"],
    [60, "31-60"],
    [61, "61-90"],
    [90, "61-90"],
    [91, "mas-90"],
    [-400, "no-vencido"],
    [400, "mas-90"],
    [-1, "no-vencido"],
  ] as const)("A1: d = %i → %s", (d, tramo) => {
    expect(tramoDe(d)).toBe(tramo);
  });

  it("A1 (T12): cada borde con el fixture, al 2026-10-31: atrasos 30, 31, 60, 61, 90, 91 y 0 → 1–30, 31–60, 31–60, 61–90, 61–90, Más de 90 y No vencido", () => {
    const a = fixtureT12();
    const porClave = (clave: string) => {
      const s = saldosAlCorte(a.datos, "2026-10-31").find((x) => x.comprobante.id === a.id(clave));
      if (s === undefined) throw new Error(`No hay ${clave}`);
      return s;
    };
    const esperado: [string, number, string][] = [
      ["d30", 30, "1-30"],
      ["d31", 31, "31-60"],
      ["d60", 60, "31-60"],
      ["d61", 61, "61-90"],
      ["d90", 90, "61-90"],
      ["d91f", 91, "mas-90"],
      ["T04-F", 0, "no-vencido"],
    ];
    for (const [clave, dias, tramo] of esperado) {
      const s = porClave(clave);
      expect(s.atraso, clave).toBe(dias);
      expect(tramoDe(s.atraso), clave).toBe(tramo);
    }
  });

  it("A1: propiedad: para todo d en [−400, 400] hay exactamente un tramo, y es el que dice tramoDe", () => {
    for (let d = -400; d <= 400; d++) {
      const contienen = TRAMOS.filter((t) => d >= t.minimo && d <= t.maximo);
      expect(contienen, `d = ${d}`).toHaveLength(1);
      expect(contienen[0]?.clave, `d = ${d}`).toBe(tramoDe(d));
    }
  });

  it("A1: los tramos están en orden, sin huecos ni solapes (cada uno empieza donde termina el anterior + 1) y cubren toda la recta", () => {
    expect(TRAMOS.map((t) => t.clave)).toEqual(["no-vencido", "1-30", "31-60", "61-90", "mas-90"]);
    expect(TRAMOS[0]?.minimo).toBe(Number.NEGATIVE_INFINITY);
    expect(TRAMOS[TRAMOS.length - 1]?.maximo).toBe(Number.POSITIVE_INFINITY);
    TRAMOS.slice(1).forEach((t, i) => expect(t.minimo).toBe((TRAMOS[i]?.maximo ?? Number.NaN) + 1));
  });

  it("A1: los días de atraso son un entero: 1,5 y NaN lanzan", () => {
    expect(() => tramoDe(1.5)).toThrow(/entero/);
    expect(() => tramoDe(Number.NaN)).toThrow(/entero/);
  });

  it("A1: cada tramo tiene su clave de medida del catálogo (4.2) y su rótulo de la interfaz (sección 7)", () => {
    expect(CLAVE_DE_MEDIDA_DEL_TRAMO).toEqual({
      "no-vencido": "tramo-no-vencido",
      "1-30": "tramo-1-30",
      "31-60": "tramo-31-60",
      "61-90": "tramo-61-90",
      "mas-90": "tramo-mas-90",
    });
    expect(ROTULO_DE_TRAMO).toEqual({ "no-vencido": "No vencido", "1-30": "1 a 30 días", "31-60": "31 a 60 días", "61-90": "61 a 90 días", "mas-90": "Más de 90 días" });
  });
});
