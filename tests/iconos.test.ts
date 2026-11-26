// El sprite de íconos de `index.html` y la lista `ICONOS` de `src/componentes/tipos.ts` tienen que coincidir: un nombre sin símbolo
// dibuja un ícono vacío sin avisar (el `<use>` apunta a un id que no existe) y un símbolo sin nombre es peso muerto (docs/diseno-ui.md, 5.15).
import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import { ICONOS } from "../src/componentes/tipos.ts";

const simbolos = [...indexHtml.matchAll(/<symbol id="i-([a-z0-9-]+)"/g)].map((m) => m[1]);

describe("sprite de íconos", () => {
  it("cada nombre de ICONOS tiene su símbolo en index.html", () => {
    for (const nombre of ICONOS) expect(simbolos, `falta <symbol id="i-${nombre}">`).toContain(nombre);
  });

  it("cada símbolo de index.html está en ICONOS", () => {
    for (const nombre of simbolos) expect(ICONOS as readonly (string | undefined)[], `sobra <symbol id="i-${nombre}">`).toContain(nombre);
  });

  it("no hay símbolos repetidos y todos son de 24 × 24", () => {
    expect(new Set(simbolos).size).toBe(simbolos.length);
    const cuerpos = indexHtml.match(/<symbol [^>]*>/g) ?? [];
    expect(cuerpos).toHaveLength(simbolos.length);
    for (const c of cuerpos) expect(c).toContain('viewBox="0 0 24 24"');
  });

  it("la lista de íconos es la del sprite de `index.html`", () => {
    expect([...ICONOS].sort()).toEqual([
      "alerta",
      "atras",
      "ayuda",
      "buscar",
      "cerrar",
      "check",
      "chevron",
      "chevron-izq",
      "clientes",
      "comprobantes",
      "flecha",
      "flecha-izq",
      "guion",
      "marca",
      "meses",
      "reloj",
      "resumen",
      "vencido",
    ]);
  });

  it("los íconos son rellenos: ningún símbolo dibuja con trazo", () => {
    const sprite = indexHtml.slice(indexHtml.indexOf('<svg class="sprite"'), indexHtml.indexOf("</svg>"));
    expect(sprite).not.toMatch(/\bstroke/);
    expect(sprite).not.toMatch(/\bfill="(?!none)/);
  });
});
