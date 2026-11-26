// La propiedad de D2 sobre el generador de verdad (`src/lib/datos/generador.ts`): 50 semillas × 22 cierres × 15 claves × empresa y 13 clientes
// (más `mora-otros` cuando existe y las cinco del mes en cada uno de los doce meses), el valor por agregación y la suma de las partidas coinciden al
// centavo. Es la propiedad que cuenta para lo que se publica: la de `propiedad-cierre.test.ts` usa un generador provisional con más variedad
// (ND, recibos con varias imputaciones, retención de IVA) que el real no produce. Archivo aparte para que corra en paralelo con los otros.
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/datos/generador.ts";
import { SEMILLAS_DE_LA_PROPIEDAD as SEMILLAS, problemasDeD2 } from "./fixtures/propiedades.ts";

describe("D2 (generador real): controlar no lanza en ninguna medida", () => {
  it.each(SEMILLAS)("D2: semilla %i", { timeout: 120_000 }, (semilla) => {
    expect(problemasDeD2(generar(semilla).datos)).toEqual([]);
  });
});
