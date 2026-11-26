// El grafo de importaciones de los módulos del dominio, leído del texto de cada archivo, para custodiar la independencia de los dos caminos de
// cálculo (docs/diseno.md, 4.2.1 y D2). Lee la sintaxis completa, no líneas sueltas: un `import` en varias líneas, un `export ... from`, un
// `import "x"` sin nombres y un `import("x")` dinámico cuentan igual. Los comentarios no cuentan (se sacan antes de leer).

/** Saca los comentarios de bloque y de línea. No entiende cadenas: alcanza para estos archivos, donde ninguna cadena lleva `//` ni `/*` (salvo `://`, que se respeta). */
export function sinComentarios(fuente: string): string {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

/** Los destinos de las importaciones de un archivo, tal como están escritos (`./corte.ts`). */
export function destinosDe(fuente: string): string[] {
  const texto = sinComentarios(fuente);
  const patrones = [
    /\bfrom\s*["']([^"']+)["']/g, // import ... from "x" y export ... from "x", en una o en varias líneas
    /\bimport\s*["']([^"']+)["']/g, // import "x"
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // import("x")
  ];
  const destinos = new Set<string>();
  for (const patron of patrones) for (const m of texto.matchAll(patron)) destinos.add(m[1] ?? "");
  return [...destinos].filter((d) => d !== "");
}

/** El nombre de módulo de un destino relativo (`./corte.ts` → `corte.ts`); `null` si no es de la carpeta (un paquete, otra carpeta). */
function modulo(destino: string): string | null {
  const m = /^\.\/([\w-]+\.ts)$/.exec(destino);
  return m === null ? null : (m[1] ?? null);
}

/** Los módulos a los que llega `raiz` por importaciones directas o a través de terceros (sin contar a `raiz`, salvo que haya un ciclo). */
export function alcanzablesDesde(raiz: string, fuentes: Readonly<Record<string, string>>): Set<string> {
  const vistos = new Set<string>();
  const pendientes = [raiz];
  while (pendientes.length > 0) {
    const actual = pendientes.pop();
    const fuente = actual === undefined ? undefined : fuentes[actual];
    if (actual === undefined || fuente === undefined) continue;
    for (const destino of destinosDe(fuente)) {
      const m = modulo(destino);
      if (m !== null && !vistos.has(m)) {
        vistos.add(m);
        pendientes.push(m);
      }
    }
  }
  return vistos;
}

/** Los fuentes de `src/lib/dominio/*.ts`, por nombre de archivo (`corte.ts`). */
export function fuentesDelDominio(): Record<string, string> {
  const crudo = import.meta.glob("../../src/lib/dominio/*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
  const fuentes: Record<string, string> = {};
  for (const [ruta, texto] of Object.entries(crudo)) fuentes[ruta.slice(ruta.lastIndexOf("/") + 1)] = texto;
  return fuentes;
}
