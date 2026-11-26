// Medición del peso del JS (scripts/peso-js.mjs): el tope de 100 kB de JS comprimido con gzip (docs/stack.md, sección 6) deja de ser una convención y pasa a
// ser un control. Acá se prueba el cálculo con contenidos en memoria (el proyecto no usa tipos de Node en los tests); leer `dist/` y salir con código 1 lo
// comprueba `npm run build && npm run peso`, que es el paso de la integración continua.
import { describe, expect, it } from "vitest";
import { TOPE_DE_JS, evaluar, formatearPeso, medirArchivos, pesoGzip } from "../scripts/peso-js.mjs";

const texto = (s: string): Uint8Array => new TextEncoder().encode(s);

/** Texto que casi no se comprime (y varía con `n`). */
function ruido(n: number, largo: number): string {
  let x = n * 2654435761 + 1;
  let s = "";
  while (s.length < largo) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    s += x.toString(36);
  }
  return s.slice(0, largo);
}

describe("el método: gzip de cada archivo, con el nivel por defecto de zlib", () => {
  it("`pesoGzip` mide lo comprimido, no el original", () => {
    expect(pesoGzip(texto("a".repeat(10_000)))).toBeLessThan(100);
    const sucio = ruido(1, 10_000);
    expect(pesoGzip(texto(sucio))).toBeGreaterThan(5_000);
    expect(pesoGzip(texto(sucio))).toBeLessThan(10_000);
  });

  it("es determinista y hasta un archivo vacío trae cabecera", () => {
    const a = texto(ruido(2, 5_000));
    expect(pesoGzip(a)).toBe(pesoGzip(a));
    expect(pesoGzip(new Uint8Array())).toBeGreaterThan(0);
  });
});

describe("medirArchivos: suma el JS y deja aparte el CSS", () => {
  const js1 = texto(ruido(1, 3000));
  const js2 = texto(ruido(2, 2000));
  const css = texto(ruido(3, 5000));

  it("el total es la suma del gzip de cada .js (también .mjs y en subcarpetas)", () => {
    const r = medirArchivos([
      { nombre: "assets/index-abc.js", contenido: js1 },
      { nombre: "assets/chunks/otro-def.js", contenido: js2 },
      { nombre: "assets/modulo.mjs", contenido: js2 },
    ]);
    expect(r.archivos.map((a) => a.nombre)).toEqual(["assets/index-abc.js", "assets/chunks/otro-def.js", "assets/modulo.mjs"]);
    expect(r.total).toBe(pesoGzip(js1) + pesoGzip(js2) + pesoGzip(js2));
  });

  it("el CSS se informa aparte y no suma al tope; las fuentes, imágenes y el HTML no se miden", () => {
    const r = medirArchivos([
      { nombre: "assets/index-abc.js", contenido: js1 },
      { nombre: "assets/index-abc.css", contenido: css },
      { nombre: "assets/letra.woff2", contenido: texto(ruido(4, 9000)) },
      { nombre: "index.html", contenido: texto("<html></html>") },
    ]);
    expect(r.archivos).toHaveLength(1);
    expect(r.total).toBe(pesoGzip(js1));
    expect(r.css).toBe(pesoGzip(css));
  });

  it("cada archivo trae su tamaño sin comprimir y el comprimido", () => {
    const [a] = medirArchivos([{ nombre: "assets/i.js", contenido: texto("x".repeat(1234)) }]).archivos;
    expect(a).toMatchObject({ nombre: "assets/i.js", bytes: 1234 });
    expect(a?.gzip).toBeLessThan(100);
  });

  it("un nombre que termina en .js.map o .json no es JS", () => {
    expect(() => medirArchivos([{ nombre: "assets/i.js.map", contenido: js1 }, { nombre: "datos.json", contenido: js1 }])).toThrow(/ning[uú]n archivo \.js/);
  });

  it("sin ningún .js es un error con un mensaje claro (el build no corrió)", () => {
    expect(() => medirArchivos([])).toThrow(/npm run build/);
  });
});

describe("evaluar: el tope", () => {
  it("el tope es de 100.000 bytes de gzip", () => {
    expect(TOPE_DE_JS).toBe(100_000);
  });

  it("justo en el tope está dentro; un byte más, no", () => {
    expect(evaluar(100_000)).toEqual({ dentro: true, margen: 0 });
    expect(evaluar(99_000)).toEqual({ dentro: true, margen: 1000 });
    expect(evaluar(100_001)).toEqual({ dentro: false, margen: -1 });
  });

  it("acepta otro tope (si se decide uno distinto)", () => {
    expect(evaluar(61_000, 85_000)).toEqual({ dentro: true, margen: 24_000 });
  });
});

describe("formatearPeso", () => {
  it("bytes con punto de miles y kilobytes (1 kB = 1000 B) con coma y un decimal", () => {
    expect(formatearPeso(39_436)).toBe("39.436 B (39,4 kB)");
    expect(formatearPeso(100_000)).toBe("100.000 B (100,0 kB)");
    expect(formatearPeso(950)).toBe("950 B (1,0 kB)");
    expect(formatearPeso(39_449)).toBe("39.449 B (39,4 kB)");
  });
});
