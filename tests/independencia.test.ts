// La independencia de los dos caminos de cálculo (docs/diseno.md, 4.2.1 y D2): `agregados.ts` (suma los datos crudos) y `partidas.ts` +
// `corte.ts` (listan comprobante por comprobante) no se llaman entre sí, ni directamente ni a través de un tercero. Si lo hicieran, que los dos
// den lo mismo no probaría nada. El test lee el grafo de importaciones completo (varias líneas, las dos direcciones, transitivo).
// Se prueba también al revés, con fuentes armados a mano (D3: «cada control se prueba también al revés»); las mutaciones sobre el código
// de verdad están en `scripts/mutaciones.json`.
import { describe, expect, it } from "vitest";
import { alcanzablesDesde, destinosDe, fuentesDelDominio, sinComentarios } from "./fixtures/grafoDeImportaciones.ts";

describe("D2 (el lector de importaciones): lee la sintaxis completa y no se deja engañar", () => {
  it("una importación en varias líneas cuenta (el caso que se saltaba el test viejo)", () => {
    expect(destinosDe(`import {\n  saldosAlCorte,\n  existeAlCorte\n} from "./corte.ts";`)).toEqual(["./corte.ts"]);
  });

  it("importaciones de tipos, re-exportaciones, importaciones sin nombres e importaciones dinámicas cuentan", () => {
    const fuente = ['import type { A } from "./a.ts";', 'export { b } from "./b.ts";', 'export * from "./c.ts";', 'import "./d.ts";', 'const e = await import("./e.ts");'].join("\n");
    expect(destinosDe(fuente).sort()).toEqual(["./a.ts", "./b.ts", "./c.ts", "./d.ts", "./e.ts"]);
  });

  it("con comillas simples y con espacios de más", () => {
    expect(destinosDe("import{x}from'./f.ts'; import  {y}  from   \"./g.ts\"")).toEqual(["./f.ts", "./g.ts"]);
  });

  it("lo que está en un comentario no es una importación", () => {
    const fuente = ['// import { x } from "./corte.ts";', '/* import { y } from "./partidas.ts";', '   y más: from "./agregados.ts" */', 'import { z } from "./dinero.ts"; // y no de "./medidas.ts"'].join("\n");
    expect(destinosDe(fuente)).toEqual(["./dinero.ts"]);
    expect(sinComentarios("const url = 'https://x.y'; // fin")).toContain("https://x.y");
  });

  it("alcanzables: sigue los terceros (a → b → c) y no se pierde en un ciclo", () => {
    const fuentes = { "a.ts": 'import { b } from "./b.ts";', "b.ts": 'import {\n c\n} from "./c.ts"; import { a } from "./a.ts";', "c.ts": "export const c = 1;" };
    expect([...alcanzablesDesde("a.ts", fuentes)].sort()).toEqual(["a.ts", "b.ts", "c.ts"]);
    expect([...alcanzablesDesde("c.ts", fuentes)]).toEqual([]);
  });

  it("alcanzables: un paquete o una ruta fuera de la carpeta no es un módulo del dominio", () => {
    expect([...alcanzablesDesde("a.ts", { "a.ts": 'import x from "svelte"; import y from "../otro/z.ts";' })]).toEqual([]);
  });
});

describe("D2: los dos caminos no comparten cuentas (el grafo de importaciones de src/lib/dominio)", () => {
  const fuentes = fuentesDelDominio();
  const desde = (modulo: string): Set<string> => alcanzablesDesde(modulo, fuentes);

  // Lo que los dos caminos comparten A PROPÓSITO, y por qué no es una cuenta compartida. Si aparece otro módulo en común, falla.
  //  - dinero.ts, fechas.ts y tipos.ts: aritmética de centavos, de días y tipos; no deciden qué se suma.
  //  - antiguedad.ts: los límites de A1; `agregados.ts` usa `TRAMOS` y `partidas.ts` usa `tramoDe`, y `antiguedad.test.ts` los cruza.
  //  - claves.ts: los nombres de las claves y `esRetencion` (R2), que es una definición: `claves.test.ts` la prueba con números.
  const UTILIDADES = ["dinero.ts", "fechas.ts", "tipos.ts"];
  const DEFINICIONES_CUBIERTAS = ["antiguedad.ts", "claves.ts"];

  it("el lector ve los archivos del dominio (si no, los demás tests pasarían sin mirar nada)", () => {
    expect(Object.keys(fuentes)).toEqual(expect.arrayContaining(["agregados.ts", "partidas.ts", "corte.ts", "medidas.ts", "controles.ts", "claves.ts", "dinero.ts"]));
    expect(desde("agregados.ts").size).toBeGreaterThan(3);
    expect(desde("partidas.ts").size).toBeGreaterThan(3);
  });

  it("D2: agregados.ts no llega a ningún módulo que calcule saldos por comprobante, ni directo ni a través de un tercero", () => {
    const alcanza = desde("agregados.ts");
    for (const prohibido of ["corte.ts", "partidas.ts", "comprobantes.ts", "textos.ts", "validadores.ts", "medidas.ts", "controles.ts"]) {
      expect(alcanza.has(prohibido), `agregados.ts llega a ${prohibido}`).toBe(false);
    }
  });

  it("D2: partidas.ts y corte.ts no llegan a agregados.ts, ni directo ni a través de un tercero", () => {
    for (const raiz of ["partidas.ts", "corte.ts"]) {
      const alcanza = desde(raiz);
      for (const prohibido of ["agregados.ts", "medidas.ts", "controles.ts"]) expect(alcanza.has(prohibido), `${raiz} llega a ${prohibido}`).toBe(false);
    }
  });

  it("D2: nada de lo que está debajo de medidas.ts llega a medidas.ts ni a controles.ts (el árbol va hacia arriba)", () => {
    for (const raiz of ["agregados.ts", "partidas.ts", "corte.ts", "comprobantes.ts", "textos.ts", "antiguedad.ts", "claves.ts", "dinero.ts", "fechas.ts"]) {
      const alcanza = desde(raiz);
      expect(alcanza.has("medidas.ts"), `${raiz} llega a medidas.ts`).toBe(false);
      expect(alcanza.has("controles.ts"), `${raiz} llega a controles.ts`).toBe(false);
    }
  });

  it("D2: lo que los dos caminos tienen en común es solo dinero, fechas, tipos, antiguedad y claves (claves.ts es la única definición con números propios)", () => {
    const deAgregados = desde("agregados.ts");
    const compartido = [...desde("partidas.ts")].filter((m) => deAgregados.has(m)).sort();
    expect(compartido).toEqual([...UTILIDADES, ...DEFINICIONES_CUBIERTAS].sort());
  });

  it("D3: controles.ts es el único que junta los dos caminos (por eso existe)", () => {
    const alcanza = desde("controles.ts");
    expect(alcanza.has("agregados.ts")).toBe(true);
    expect(alcanza.has("corte.ts")).toBe(true);
  });
});
