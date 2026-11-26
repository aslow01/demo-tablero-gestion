// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): tests/fechas.test.ts.
// Cambios: se sacaron los tests del reloj y de las zonas horarias (T1, T2, T3, formatos de instante y T7) porque esas funciones no se copiaron,
// y los identificadores T1 a T7 (reglas de la Demo 2) pasan a nombres descriptivos: acá T01 a T17 son casos de datos (docs/diseno.md, 5.3).
// La suite entera corre con TZ=UTC, Asia/Tokyo y America/Los_Angeles (`npm run test:tz`): el cálculo con Date.UTC no depende de la zona.
import { describe, expect, it } from "vitest";
import { diasDeMes, diasEntre, exigirCorte, formatearFecha, parsearFechaCivil, sumarDias, sumarMeses } from "../src/lib/dominio/fechas.ts";

const H = "2026-11-18";

describe("fecha civil validada a mano", () => {
  it("acepta fechas válidas, incluido el 29/02 de un año bisiesto", () => {
    expect(parsearFechaCivil("2028-02-29")).toBe("2028-02-29");
    expect(parsearFechaCivil("2026-11-18")).toBe("2026-11-18");
    expect(parsearFechaCivil("2000-01-01")).toBe("2000-01-01");
    expect(parsearFechaCivil("2100-12-31")).toBe("2100-12-31");
  });

  it("rechaza días que no existen", () => {
    expect(parsearFechaCivil("2027-02-29")).toBeNull();
    expect(parsearFechaCivil("2026-11-31")).toBeNull();
    expect(parsearFechaCivil("2026-04-31")).toBeNull();
    expect(parsearFechaCivil("2026-00-10")).toBeNull();
    expect(parsearFechaCivil("2026-13-10")).toBeNull();
    expect(parsearFechaCivil("2026-11-00")).toBeNull();
  });

  it("2100 no es bisiesto y 2000 sí (regla de los siglos)", () => {
    expect(parsearFechaCivil("2100-02-29")).toBeNull();
    expect(parsearFechaCivil("2000-02-29")).toBe("2000-02-29");
  });

  it("rechaza formatos que no son AAAA-MM-DD", () => {
    expect(parsearFechaCivil("2026-1-5")).toBeNull();
    expect(parsearFechaCivil("18/11/2026")).toBeNull();
    expect(parsearFechaCivil("2026-11-18T10:00:00Z")).toBeNull();
    expect(parsearFechaCivil(" 2026-11-18")).toBeNull();
    expect(parsearFechaCivil("")).toBeNull();
    expect(parsearFechaCivil("2026-11-18\n")).toBeNull();
    expect(parsearFechaCivil("２０２６-11-18")).toBeNull();
  });

  it("rechaza años fuera de 2000 a 2100", () => {
    expect(parsearFechaCivil("1999-12-31")).toBeNull();
    expect(parsearFechaCivil("2101-01-01")).toBeNull();
    expect(parsearFechaCivil("0026-01-01")).toBeNull();
  });
});

describe("días de calendario entre fechas", () => {
  it("cruces de año y de mes", () => {
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
    expect(diasEntre("2028-02-28", "2028-03-01")).toBe(2);
    expect(diasEntre("2027-02-28", "2027-03-01")).toBe(1);
  });

  it("mismo día es 0 y hacia atrás es negativo", () => {
    expect(diasEntre(H, H)).toBe(0);
    expect(diasEntre("2026-11-18", "2026-11-11")).toBe(-7);
  });

  it("un año común tiene 365 días y uno bisiesto 366", () => {
    expect(diasEntre("2026-01-01", "2027-01-01")).toBe(365);
    expect(diasEntre("2028-01-01", "2029-01-01")).toBe(366);
  });

  it("sumarDias es la inversa de diasEntre (propiedad sobre varios años)", () => {
    for (let n = -800; n <= 800; n += 7) {
      const f = sumarDias("2026-11-18", n);
      expect(parsearFechaCivil(f)).toBe(f);
      expect(diasEntre("2026-11-18", f)).toBe(n);
    }
  });

  it("sumarDias coincide con Date.UTC en cada día de 2000-01-01 a 2100-12-31 (incluye 2100, que no es bisiesto)", () => {
    const inicio = Date.UTC(2000, 0, 1) / 86_400_000;
    const fin = Date.UTC(2100, 11, 31) / 86_400_000;
    for (let dias = inicio; dias <= fin; dias++) {
      const d = new Date(dias * 86_400_000);
      const esperado = `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      if (sumarDias("2000-01-01", dias - inicio) !== esperado) throw new Error(`sumarDias falla en ${esperado}`);
    }
    expect(sumarDias("2100-02-28", 1)).toBe("2100-03-01");
    expect(sumarDias("2100-03-01", -1)).toBe("2100-02-28");
    expect(sumarDias("2100-12-31", 0)).toBe("2100-12-31");
  });

  it("sumarDias exige un número entero de días", () => {
    expect(() => sumarDias("2026-11-18", Number.NaN)).toThrow(/entero/);
    expect(() => sumarDias("2026-11-18", 1.5)).toThrow(/entero/);
    expect(() => sumarDias("2026-11-18", Infinity)).toThrow(/entero/);
  });

  it("sumarDias cruza meses y años", () => {
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(sumarDias("2028-03-01", -1)).toBe("2028-02-29");
    expect(sumarDias("2026-11-18", 0)).toBe("2026-11-18");
  });
});

describe("formato para mostrar", () => {
  it("día, mes y año con dos dígitos en día y mes", () => {
    expect(formatearFecha("2026-11-18")).toBe("18/11/2026");
    expect(formatearFecha("2026-01-05")).toBe("05/01/2026");
  });

  it("una fecha que no es válida lanza en lugar de mostrar basura", () => {
    expect(() => formatearFecha("18/11/2026")).toThrow(/inválida/);
  });
});

describe("sumarMeses: aritmética de meses AAAA-MM", () => {
  it("suma y resta meses cruzando el año", () => {
    expect(sumarMeses("2026-10", 0)).toBe("2026-10");
    expect(sumarMeses("2026-10", 3)).toBe("2027-01");
    expect(sumarMeses("2026-10", -11)).toBe("2025-11");
    expect(sumarMeses("2026-01", -1)).toBe("2025-12");
    expect(sumarMeses("2025-12", 1)).toBe("2026-01");
    expect(sumarMeses("2025-01", -12)).toBe("2024-01");
  });

  it("lanza con un mes que no es AAAA-MM, con el mes 13 o con meses que no son enteros", () => {
    expect(() => sumarMeses("2026-13", 1)).toThrow(/AAAA-MM/);
    expect(() => sumarMeses("2026-00", 1)).toThrow(/AAAA-MM/);
    expect(() => sumarMeses("hola", 1)).toThrow(/AAAA-MM/);
    expect(() => sumarMeses("2026-10", 1.5)).toThrow(/entero/);
  });
});

describe("exigirCorte: la validación del corte, en un solo lugar", () => {
  it("devuelve la misma fecha si es válida, con cualquier día del mes", () => {
    expect(exigirCorte("2026-10-31")).toBe("2026-10-31");
    expect(exigirCorte("2026-05-15")).toBe("2026-05-15");
  });

  it("lanza, nombrando el corte y el formato, con una fecha que no existe o que no es AAAA-MM-DD", () => {
    for (const corte of ["2026-02-30", "2026-13-01", "26-10-31", "", "hola"]) expect(() => exigirCorte(corte)).toThrow(/corte.*AAAA-MM-DD/);
    expect(() => exigirCorte("2026-02-30")).toThrow(/2026-02-30/);
  });
});

describe("diasDeMes: cuántos días tiene un mes AAAA-MM", () => {
  it("28, 29 (bisiesto), 30 y 31", () => {
    expect(diasDeMes("2026-02")).toBe(28);
    expect(diasDeMes("2028-02")).toBe(29);
    expect(diasDeMes("2100-02")).toBe(28);
    expect(diasDeMes("2026-04")).toBe(30);
    expect(diasDeMes("2026-10")).toBe(31);
  });

  it("lanza con un mes que no es AAAA-MM", () => {
    expect(() => diasDeMes("2026-13")).toThrow(/AAAA-MM/);
    expect(() => diasDeMes("2026-1")).toThrow(/AAAA-MM/);
  });
});
