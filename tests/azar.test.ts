// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): tests/azar.test.ts.
// Cambios: el identificador del primer test pasa de D1 (regla de la Demo 2) a G1 (docs/diseno.md, tabla de reglas, que remite a este test).
import { describe, expect, it } from "vitest";
import { crearAzar } from "../src/lib/datos/azar.ts";

describe("2.1 azar con semilla (mulberry32)", () => {
  it("G1: los primeros 5 valores de la semilla 20261118 son fijos (el orden de las llamadas es contrato)", () => {
    const a = crearAzar(20261118);
    const valores = [a.siguiente(), a.siguiente(), a.siguiente(), a.siguiente(), a.siguiente()];
    expect(valores).toEqual([
      0.02845785580575466, 0.23895404138602316, 0.2033751884009689, 0.17913771863095462, 0.4072091004345566,
    ]);
  });

  it("coincide con el valor de referencia publicado de mulberry32 para la semilla 1", () => {
    expect(crearAzar(1).siguiente()).toBe(0.6270739405881613);
  });

  it("la misma semilla da siempre la misma secuencia y otra semilla da otra", () => {
    const a = crearAzar(7);
    const b = crearAzar(7);
    const c = crearAzar(8);
    const sa = Array.from({ length: 20 }, () => a.siguiente());
    const sb = Array.from({ length: 20 }, () => b.siguiente());
    const sc = Array.from({ length: 20 }, () => c.siguiente());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });

  it("siguiente() está en [0, 1)", () => {
    const a = crearAzar(123);
    for (let i = 0; i < 5000; i++) {
      const v = a.siguiente();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("entero(min, max) incluye los dos extremos y nunca se sale", () => {
    const a = crearAzar(99);
    const vistos = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = a.entero(3, 7);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      vistos.add(n);
    }
    expect([...vistos].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it("entero(n, n) devuelve n", () => {
    expect(crearAzar(5).entero(4, 4)).toBe(4);
  });

  it("entero con extremos invertidos es un error (no un valor al azar)", () => {
    expect(() => crearAzar(5).entero(5, 4)).toThrow();
  });

  it("elegir toma un elemento de la lista y falla con una lista vacía", () => {
    const a = crearAzar(11);
    const lista = ["a", "b", "c"] as const;
    for (let i = 0; i < 50; i++) expect(lista).toContain(a.elegir(lista));
    expect(() => a.elegir([])).toThrow();
  });

  it("probabilidad(p): 0 nunca y 1 siempre", () => {
    const a = crearAzar(3);
    for (let i = 0; i < 100; i++) {
      expect(a.probabilidad(0)).toBe(false);
      expect(a.probabilidad(1)).toBe(true);
    }
  });
});
