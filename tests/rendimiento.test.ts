// G7: rendimiento (docs/diseno.md, 6.7). Generar los datos < 50 ms y recalcular todas las medidas de la empresa para un corte < 20 ms, con los dos
// caminos de 4.2.1 incluidos. El test de CI usa un tope **10 veces más holgado** (los tiempos en CI son ruidosos); los números reales se miden
// con `node scripts/medir.mjs` y se anotan en el registro. Mide la mediana de varias corridas para no depender de una sola.
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import { CLAVES_DEL_CATALOGO } from "../src/lib/dominio/claves.ts";
import { medida } from "../src/lib/dominio/medidas.ts";
import { controlar } from "../src/lib/dominio/medidas.ts";

const mediana = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
function tiempo(f: () => void, veces: number): number {
  const ms: number[] = [];
  for (let i = 0; i < veces; i++) {
    const t0 = performance.now();
    f();
    ms.push(performance.now() - t0);
  }
  return mediana(ms);
}

describe("G7: el generador y el recálculo de un corte entran en el presupuesto (con tope 10 veces más holgado)", () => {
  it("G7: generar los datos de ejemplo tarda menos de 500 ms (objetivo: 50 ms)", () => {
    generar(1); // calienta
    expect(tiempo(() => generar(20261118), 7)).toBeLessThan(500);
  });

  it("G7: las 15 medidas de la empresa con los dos caminos y controlar, para un corte (sobre datos recién generados), menos de 200 ms (objetivo: 20 ms)", () => {
    const frio: number[] = [];
    for (let i = 0; i < 7; i++) {
      const { datos } = generar(20261118 + i); // datos nuevos: sin los índices de un corte anterior
      const t0 = performance.now();
      for (const clave of CLAVES_DEL_CATALOGO) controlar(medida(datos, "2026-10-31", clave));
      frio.push(performance.now() - t0);
    }
    expect(mediana(frio)).toBeLessThan(200);
  });

  it("G7: con los índices ya armados, cambiar de corte es más barato todavía (menos de 100 ms)", () => {
    const { datos } = generar(20261118);
    for (const clave of CLAVES_DEL_CATALOGO) medida(datos, "2026-09-30", clave); // arma los índices
    expect(tiempo(() => { for (const clave of CLAVES_DEL_CATALOGO) controlar(medida(datos, "2026-10-31", clave)); }, 7)).toBeLessThan(100);
  });
});
