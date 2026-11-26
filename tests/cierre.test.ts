// Verificación de un cierre antes de mostrarlo (D3: controles cruzados X1 a X6) con memoria por cierre (src/lib/estado/cierre.ts).
// Los controles tardan entre 38 y 66 ms por cierre: se corren una vez por cierre y la respuesta se recuerda, la buena y la mala.
import { describe, expect, it } from "vitest";
import { ErrorDeCierre } from "../src/lib/dominio/medidas.ts";
import type { FechaCivil } from "../src/lib/dominio/tipos.ts";
import { crearVerificadorDeCierres } from "../src/lib/estado/cierre.ts";
import { pesos } from "./fixtures/armarDatos.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

const datos = fixtureT12().datos;

/** Un `exigirControles` falso que cuenta las llamadas y falla en los cortes que se le digan. */
function falso(fallan: readonly string[] = [], otroError?: string) {
  const llamadas: string[] = [];
  const exigir = (_datos: unknown, corte: FechaCivil): void => {
    llamadas.push(corte);
    if (corte === otroError) throw new RangeError("esto no es un error de cierre");
    if (fallan.includes(corte)) throw new ErrorDeCierre("X1", pesos(100), pesos(90), "la suma de los cinco tramos");
  };
  return { exigir, llamadas };
}

describe("verificador de cierres", () => {
  it("con datos que cierran, el cierre está bien (controles reales X1 a X6 sobre el fixture)", () => {
    const verificar = crearVerificadorDeCierres(datos);
    expect(verificar("2026-10-31")).toEqual({ estado: "ok" });
    expect(verificar("2026-09-30")).toEqual({ estado: "ok" });
  });

  it("un control que no cierra da el error de cierre con sus valores, sin lanzar (la pantalla muestra el error y nunca el número)", () => {
    const { exigir } = falso(["2026-09-30"]);
    const r = crearVerificadorDeCierres(datos, exigir)("2026-09-30");
    expect(r.estado).toBe("error");
    if (r.estado !== "error") return;
    expect(r.error).toBeInstanceOf(ErrorDeCierre);
    expect(r.error.clave).toBe("X1");
    expect(r.error.diferencia).toBe(pesos(10));
  });

  it("corre los controles una sola vez por cierre, tanto si cierran como si no", () => {
    const { exigir, llamadas } = falso(["2026-09-30"]);
    const verificar = crearVerificadorDeCierres(datos, exigir);
    for (let i = 0; i < 4; i++) {
      verificar("2026-10-31");
      verificar("2026-09-30");
    }
    expect(llamadas).toEqual(["2026-10-31", "2026-09-30"]);
  });

  it("devuelve el mismo resultado (la misma instancia del error) las veces que se lo pida", () => {
    const { exigir } = falso(["2026-09-30"]);
    const verificar = crearVerificadorDeCierres(datos, exigir);
    expect(verificar("2026-09-30")).toBe(verificar("2026-09-30"));
  });

  it("un cierre malo no contagia a los demás", () => {
    const { exigir } = falso(["2026-09-30"]);
    const verificar = crearVerificadorDeCierres(datos, exigir);
    expect(verificar("2026-09-30").estado).toBe("error");
    expect(verificar("2026-08-31").estado).toBe("ok");
  });

  it("lo que no es un error de cierre (un bug) no se esconde ni se recuerda: se lanza, y la próxima vez se vuelve a intentar", () => {
    const { exigir, llamadas } = falso([], "2026-09-30");
    const verificar = crearVerificadorDeCierres(datos, exigir);
    expect(() => verificar("2026-09-30")).toThrow(RangeError);
    expect(() => verificar("2026-09-30")).toThrow(RangeError);
    expect(llamadas).toEqual(["2026-09-30", "2026-09-30"]);
  });

  it("dos verificadores no comparten memoria", () => {
    const a = falso();
    const b = falso();
    crearVerificadorDeCierres(datos, a.exigir)("2026-10-31");
    crearVerificadorDeCierres(datos, b.exigir)("2026-10-31");
    expect([a.llamadas.length, b.llamadas.length]).toEqual([1, 1]);
  });
});
