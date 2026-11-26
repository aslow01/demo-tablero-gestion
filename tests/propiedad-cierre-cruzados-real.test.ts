// La propiedad de D3 sobre el generador de verdad: 50 semillas × los 22 cierres de mes, los controles cruzados X1 a X6 cierran.
// Archivo aparte (paralelo con `propiedad-cierre-real.test.ts`, que es la de D2).
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import { SEMILLAS_DE_LA_PROPIEDAD as SEMILLAS, fallosDeD3 } from "./fixtures/propiedades.ts";

describe("D3 (generador real): los controles cruzados X1 a X6 cierran (50 semillas × 22 cierres)", () => {
  it.each(SEMILLAS)("D3: semilla %i", { timeout: 120_000 }, (semilla) => {
    expect(fallosDeD3(generar(semilla).datos)).toEqual([]);
  });
});
