// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): tests/cuit.test.ts.
// Cambios: ninguno.
import { describe, expect, it } from "vitest";
import { armarCuit, cuitValido, digitoVerificador, formatearCuit } from "../src/lib/datos/cuit.ts";

describe("cuit (reutilizado de la Demo 1)", () => {
  it("acepta un CUIT con dígito verificador correcto y rechaza uno equivocado", () => {
    expect(cuitValido("30-99000003-0")).toBe(true);
    expect(cuitValido("30990000030")).toBe(true);
    expect(cuitValido("30990000031")).toBe(false);
    expect(cuitValido("3099000003")).toBe(false);
    expect(cuitValido("")).toBe(false);
  });

  it("las bases con resto 1 no tienen dígito válido", () => {
    expect(digitoVerificador("3099000009")).toBeNull();
    expect(armarCuit("30", "99000009")).toBeNull();
    expect(armarCuit("30", "99000003")).toBe("30990000030");
  });

  it("formatea con guiones", () => {
    expect(formatearCuit("30990000030")).toBe("30-99000003-0");
  });
});
