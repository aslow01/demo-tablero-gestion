// La propiedad de D3 (docs/diseno.md, 6.6; docs/plan.md, paso 3.5): con 50 semillas × los 22 cierres de mes, los controles cruzados X1 a X6
// cierran. Va en un archivo aparte de `propiedad-cierre.test.ts` (D2) para que los dos corran en paralelo. Datos: generador provisional.
import { describe, expect, it } from "vitest";
import { generarProvisional } from "./fixtures/generadorProvisional.ts";
import { SEMILLAS_DE_LA_PROPIEDAD as SEMILLAS, fallosDeD3 } from "./fixtures/propiedades.ts";

describe("D3: los controles cruzados X1 a X6 cierran (50 semillas × 22 cierres)", () => {
  it.each(SEMILLAS)("D3: semilla %i", { timeout: 120_000 }, (semilla) => {
    expect(fallosDeD3(generarProvisional(semilla).datos)).toEqual([]);
  });
});
