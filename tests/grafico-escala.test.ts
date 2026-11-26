// Geometría del gráfico de 12 meses (docs/diseno-ui.md, 5.10 y plan 5.3): el eje empieza en 0, un valor negativo baja del eje, las marcas son
// redondas y entre 3 y 5, un valor chico mide al menos 1 px y con menos de 12 meses los grupos no se estiran. Datos de prueba, no de la semilla.
import { describe, expect, it } from "vitest";
import { aniosVisibles, disponerGrafico, escalaDeImportes, MESES_EN_EJE, pasoDeRotulos, rotuloDeMarca, rotuloDeMes, rotuloVisible, usarInicial } from "../src/componentes/grafico-escala.ts";
import type { Medidas } from "../src/componentes/grafico-escala.ts";

const MILLON = 100_000_000;
const medidas: Medidas = { ancho: 440, alto: 240, izquierda: 40, derecha: 0, superior: 8, inferior: 40 };
const doce = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, "0")}`);
const mesesDe = (n: number): string[] => doce.slice(12 - n);

describe("escalaDeImportes", () => {
  it("empieza en 0 con valores positivos y llega a una marca redonda por encima del máximo", () => {
    const e = escalaDeImportes([3 * MILLON, 12.4 * MILLON, 0]);
    expect(e.minimo).toBe(0);
    expect(e.marcas[0]).toBe(0);
    expect(e.maximo).toBeGreaterThanOrEqual(12.4 * MILLON);
    expect(e.maximo).toBeLessThan(12.4 * MILLON + e.paso);
  });

  it("el paso es 1, 2 o 5 por una potencia de 10 y hay entre 3 y 5 marcas", () => {
    for (const maximo of [1, 3, 4.01, 7, 9.9, 10, 12.4, 15, 47, 130, 999].map((m) => m * MILLON)) {
      const e = escalaDeImportes([maximo]);
      const mantisa = e.paso / 10 ** Math.floor(Math.log10(e.paso));
      expect([1, 2, 5], `paso ${e.paso}`).toContain(mantisa);
      expect(e.marcas.length, `marcas para ${maximo}`).toBeGreaterThanOrEqual(3);
      expect(e.marcas.length).toBeLessThanOrEqual(5);
      expect(e.maximo).toBeGreaterThanOrEqual(maximo);
    }
  });

  it("un valor negativo baja el eje hasta la marca redonda siguiente y deja el 0 entre las marcas", () => {
    const e = escalaDeImportes([6 * MILLON, -1.2 * MILLON]);
    expect(e.minimo).toBeLessThan(0);
    expect(e.minimo).toBeLessThanOrEqual(-1.2 * MILLON);
    expect(e.minimo).toBeGreaterThan(-1.2 * MILLON - e.paso);
    expect(e.marcas).toContain(0);
    expect(e.marcas[0]).toBe(e.minimo);
    expect(e.marcas.at(-1)).toBe(e.maximo);
    expect(e.marcas.length).toBeLessThanOrEqual(5);
  });

  it("sin datos o con todo en 0 el eje no tiene alto 0", () => {
    for (const v of [[], [0, 0]]) {
      const e = escalaDeImportes(v);
      expect(e.minimo).toBe(0);
      expect(e.maximo).toBeGreaterThan(0);
    }
  });

  it("con importes chicos usa pasos fraccionarios de millón sin perder el 0", () => {
    const e = escalaDeImportes([300_000_00, 120_000_00]);
    expect(e.paso).toBeLessThan(MILLON);
    expect(e.marcas[0]).toBe(0);
    expect(e.marcas.map(rotuloDeMarca)).toContain("0,3");
  });
});

describe("rotuloDeMarca", () => {
  it("escribe millones sin unidad, con coma decimal y menos tipográfico", () => {
    expect(rotuloDeMarca(0)).toBe("0");
    expect(rotuloDeMarca(5 * MILLON)).toBe("5");
    expect(rotuloDeMarca(15 * MILLON)).toBe("15");
    expect(rotuloDeMarca(MILLON / 2)).toBe("0,5");
    expect(rotuloDeMarca(25_000_000)).toBe("0,25");
    expect(rotuloDeMarca(-2 * MILLON)).toBe("−2");
  });
});

describe("rotuloDeMes", () => {
  it("abrevia a tres letras o a la inicial", () => {
    expect(rotuloDeMes("2026-10", false)).toBe("oct");
    expect(rotuloDeMes("2026-10", true)).toBe("O");
    expect(rotuloDeMes("2025-01", false)).toBe("ene");
  });
  it("lanza si no es AAAA-MM", () => {
    expect(() => rotuloDeMes("2026-13", false)).toThrow();
    expect(() => rotuloDeMes("oct", false)).toThrow();
  });
});

describe("usarInicial", () => {
  it("pasa a la inicial cuando el grupo mide menos de 2,25 veces la letra", () => {
    expect(usarInicial(29, 13)).toBe(true); // 29,25
    expect(usarInicial(29.25, 13)).toBe(false);
    expect(usarInicial(36, 13)).toBe(false);
  });
});

describe("pasoDeRotulos, rotuloVisible y aniosVisibles (texto muy agrandado)", () => {
  it("escribe todos los meses mientras la inicial cabe, y salta de a 2 o 3 cuando no", () => {
    expect(pasoDeRotulos(21.7, 13)).toBe(1);
    expect(pasoDeRotulos(16, 26)).toBe(2);
    expect(pasoDeRotulos(11, 26)).toBe(3);
    expect(pasoDeRotulos(1, 26)).toBe(4);
  });
  it("cuenta desde el último mes: el más nuevo siempre se escribe", () => {
    const visibles = Array.from({ length: 12 }, (_, i) => rotuloVisible(i, 12, 2));
    expect(visibles[11]).toBe(true);
    expect(visibles[10]).toBe(false);
    expect(visibles.filter(Boolean)).toHaveLength(6);
    expect(Array.from({ length: 5 }, (_, i) => rotuloVisible(i, 5, 1)).every(Boolean)).toBe(true);
  });
  it("si dos años se pisan queda el más nuevo; si no, quedan los dos", () => {
    expect(aniosVisibles([10, 30, 50], [true, false, true], 45)).toEqual([false, false, true]);
    expect(aniosVisibles([10, 30, 70], [true, false, true], 30)).toEqual([true, false, true]);
    expect(aniosVisibles([10, 20], [false, false], 30)).toEqual([false, false]);
  });
});

describe("disponerGrafico", () => {
  it("dibuja las barras positivas desde la línea de 0 hacia arriba y el 0 queda en el borde inferior del área si no hay negativos", () => {
    const d = disponerGrafico([[4 * MILLON, 2 * MILLON]], ["2025-12"], medidas);
    expect(d.escala.minimo).toBe(0);
    expect(d.y0).toBeCloseTo(d.abajo, 6);
    for (const b of d.barras) {
      expect(b.y + b.alto).toBeCloseTo(d.y0, 6);
      expect(b.alto).toBeGreaterThan(0);
    }
    const [mayor, menor] = d.barras;
    expect(mayor!.alto).toBeGreaterThan(menor!.alto);
    // La proporción es la de los valores (4 a 2).
    expect(mayor!.alto / menor!.alto).toBeCloseTo(2, 6);
  });

  it("un valor negativo baja de la línea de 0, dentro del área, y el eje llega más abajo del 0", () => {
    const d = disponerGrafico([[8 * MILLON], [-2 * MILLON], [0]], ["2025-10", "2025-11", "2025-12"], medidas);
    expect(d.escala.minimo).toBeLessThan(0);
    expect(d.y0).toBeLessThan(d.abajo);
    const negativa = d.barras.find((b) => b.mes === 1)!;
    expect(negativa.y).toBeCloseTo(d.y0, 6);
    expect(negativa.y + negativa.alto).toBeGreaterThan(d.y0);
    expect(negativa.y + negativa.alto).toBeLessThanOrEqual(d.abajo + 1e-9);
    const positiva = d.barras.find((b) => b.mes === 0)!;
    expect(positiva.y + positiva.alto).toBeCloseTo(d.y0, 6);
    // El mes en 0 no dibuja barra.
    expect(d.barras.some((b) => b.mes === 2)).toBe(false);
    // La marca del 0 está marcada como tal y es la única.
    expect(d.marcas.filter((m) => m.cero)).toHaveLength(1);
    expect(d.marcas.find((m) => m.cero)!.y).toBeCloseTo(d.y0, 6);
  });

  it("un valor positivo o negativo que mediría menos de 1 px se dibuja de 1 px", () => {
    const d = disponerGrafico([[900 * MILLON], [1]], ["2025-11", "2025-12"], { ...medidas, alto: 100 });
    expect(d.barras.find((b) => b.mes === 1)!.alto).toBe(1);
    const n = disponerGrafico([[900 * MILLON], [-1]], ["2025-11", "2025-12"], { ...medidas, alto: 100 });
    const baja = n.barras.find((b) => b.mes === 1)!;
    expect(baja.alto).toBe(1);
    expect(baja.y).toBeCloseTo(n.y0, 6);
  });

  it("con menos de 12 meses los grupos no se estiran y quedan a la derecha", () => {
    const completo = disponerGrafico(doce.map(() => [MILLON]), doce, medidas);
    const cinco = disponerGrafico(mesesDe(5).map(() => [MILLON]), mesesDe(5), medidas);
    expect(cinco.ancho).toBeCloseTo(completo.ancho, 9);
    expect(cinco.grupos).toHaveLength(5);
    const ultimo = cinco.grupos.at(-1)!;
    expect(ultimo.x + cinco.ancho).toBeCloseTo(medidas.ancho - medidas.derecha, 6);
    expect(cinco.grupos[0]!.x).toBeCloseTo(medidas.izquierda + (MESES_EN_EJE - 5) * cinco.ancho, 6);
  });

  it("con dos series la de la izquierda es la primera, ocupan el 38 % del grupo cada una y hay 2 px entre ellas; con una, el 60 %", () => {
    const dos = disponerGrafico([[MILLON, MILLON]], ["2025-12"], medidas);
    const [a, b] = dos.barras;
    expect(a!.serie).toBe(0);
    expect(b!.serie).toBe(1);
    expect(a!.ancho).toBeCloseTo(dos.ancho * 0.38, 6);
    expect(b!.x - (a!.x + a!.ancho)).toBeCloseTo(2, 6);
    const una = disponerGrafico([[MILLON]], ["2025-12"], medidas);
    expect(una.barras[0]!.ancho).toBeCloseTo(una.ancho * 0.6, 6);
  });

  it("el año va debajo del primer mes dibujado y de cada enero", () => {
    const d = disponerGrafico(
      [[1], [1], [1], [1]],
      ["2025-11", "2025-12", "2026-01", "2026-02"],
      medidas,
    );
    expect(d.grupos.map((g) => g.conAnio)).toEqual([true, false, true, false]);
  });

  it("rechaza más de 12 meses, series que no son 1 o 2 y filas desparejas", () => {
    expect(() => disponerGrafico(Array.from({ length: 13 }, () => [1]), Array.from({ length: 13 }, () => "2025-01"), medidas)).toThrow();
    expect(() => disponerGrafico([[1, 2, 3]], ["2025-01"], medidas)).toThrow();
    expect(() => disponerGrafico([[1], [1, 2]], ["2025-01", "2025-02"], medidas)).toThrow();
    expect(() => disponerGrafico([[1]], [], medidas)).toThrow();
  });
});
