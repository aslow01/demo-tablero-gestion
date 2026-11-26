// El script de mutaciones (`scripts/mutaciones.mjs`) no corre acá (correr Vitest dentro de Vitest tarda minutos): se prueban sus piezas puras y se
// comprueba que la lista no se pudre. Una mutación cuya cadena ya no está en el código «muere» por error, no porque la suite la detecte;
// por eso cada cadena de `scripts/mutaciones.json` tiene que aparecer **exactamente una vez** en su archivo, y esto lo vigila.
import { describe, expect, it } from "vitest";
import { aplicar, apariciones, juzgar, problemasDeLaLista } from "../scripts/mutaciones-lib.mjs";
import lista from "../scripts/mutaciones.json";

const fuentes = import.meta.glob("../src/lib/**/*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const fuenteDe = (archivo: string): string | undefined => fuentes[`../${archivo}`];

describe("D3 (mutaciones): aplicar y juzgar", () => {
  it("aplicar cambia la única aparición y deja el resto igual", () => {
    expect(aplicar("a <= b y c <= d", "a <= b", "a < b")).toBe("a < b y c <= d");
  });

  it("aplicar lanza si la cadena no está (la mutación quedó vieja) o está más de una vez (no se sabe cuál)", () => {
    expect(() => aplicar("a <= b", "x", "y")).toThrow(/0 veces/);
    expect(() => aplicar("a <= b; a <= b", "a <= b", "a < b")).toThrow(/2 veces/);
    expect(apariciones("abc", "")).toBe(0);
  });

  it("aplicar no interpreta el `$` de la cadena nueva", () => {
    expect(aplicar("x", "x", "$&$1")).toBe("$&$1");
  });

  it("juzgar: con algún test fallado, la mutación murió; con todos en verde, sobrevive; sin resumen, es un error", () => {
    expect(juzgar(" Test Files  1 failed (1)\n      Tests  3 failed | 20 passed (23)\n", 1)).toBe("muerta");
    expect(juzgar(" Test Files  1 passed (1)\n      Tests  23 passed (23)\n", 0)).toBe("sobrevive");
    expect(juzgar("SyntaxError: Unexpected token", 1)).toBe("error");
    expect(juzgar("      Tests  23 passed (23)\n", 1)).toBe("error");
  });

  it("problemasDeLaLista: pide los campos, los ids únicos y un archivo de src/lib", () => {
    expect(problemasDeLaLista([{ id: "a", nombre: "n", archivo: "src/lib/dominio/x.ts", desde: "d", hasta: "h" }])).toEqual([]);
    expect(problemasDeLaLista([{ id: "a" }]).length).toBeGreaterThan(0);
    const repetido = { id: "a", nombre: "n", archivo: "src/lib/dominio/x.ts", desde: "d", hasta: "h" };
    expect(problemasDeLaLista([repetido, repetido]).join(" ")).toMatch(/repetido/);
    expect(problemasDeLaLista([{ ...repetido, archivo: "../fuera.ts" }]).join(" ")).toMatch(/src\/lib/);
    expect(problemasDeLaLista([{ ...repetido, hasta: "d" }]).join(" ")).toMatch(/iguales/);
  });
});

describe("D3 (mutaciones): la lista de scripts/mutaciones.json está al día con el código", () => {
  it("la lista es válida y no está vacía", () => {
    expect(problemasDeLaLista(lista)).toEqual([]);
    expect(lista.length).toBeGreaterThanOrEqual(55);
  });

  it.each(lista.map((m) => [m.id, m] as const))("%s: su cadena aparece exactamente una vez en su archivo", (_id, m) => {
    const fuente = fuenteDe(m.archivo);
    expect(fuente, `no existe ${m.archivo}`).toBeDefined();
    expect(apariciones(fuente ?? "", m.desde), `${m.archivo}: ${m.desde.slice(0, 60)}`).toBe(1);
  });

  it("cada archivo que dice un test existe en el repositorio", () => {
    const tests = import.meta.glob("./*.test.ts");
    for (const m of lista) for (const t of m.tests ?? []) expect(Object.keys(tests), t).toContain(`./${t.replace(/^tests\//, "")}`);
  });
});
