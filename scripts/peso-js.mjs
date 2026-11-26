// Mide el peso del JS de `dist/` y falla si pasa el tope (docs/stack.md, sección 6: 100 kB de JS comprimido con gzip). Es un control que corre
// en la integración continua (`npm run build && npm run peso`).
//
// MÉTODO (fijo, para que los números de una medición a otra se puedan comparar):
//   - Se suman todos los archivos `.js` que haya bajo `dist/` (Vite los deja en `dist/assets/`), cada uno comprimido por separado con gzip de Node (`zlib`)
//     con el nivel por defecto. El número que imprime Vite al construir difiere en menos del 1 % (9,37 kB contra 9,29 kB en la página vacía): el que vale
//     es este, porque el método es fijo y se puede repetir.
//   - 1 kB = 1000 bytes. El tope es de 100.000 bytes.
//   - El CSS se informa pero no cuenta para el tope; las fuentes, las imágenes y el HTML no se miden.
// Uso: node scripts/peso-js.mjs [carpeta]     (por defecto, `dist` al lado de `scripts/`)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

/** Tope del JS comprimido, en bytes (100 kB). */
export const TOPE_DE_JS = 100_000;

/** El tamaño de un contenido comprimido con gzip (nivel por defecto de zlib). */
export function pesoGzip(contenido) {
  return gzipSync(contenido).length;
}

/** Todos los archivos de una carpeta (y sus subcarpetas) como `{ nombre, contenido }`, con el nombre relativo y con `/`. */
export function leerCarpeta(carpeta) {
  if (!existsSync(carpeta)) throw new Error(`No existe ${carpeta}. Primero hay que construir la aplicación con «npm run build».`);
  const salida = [];
  for (const entrada of readdirSync(carpeta, { recursive: true })) {
    const ruta = join(carpeta, String(entrada));
    if (statSync(ruta).isFile()) salida.push({ nombre: relative(carpeta, ruta).split(sep).join("/"), contenido: readFileSync(ruta) });
  }
  return salida;
}

/**
 * Mide el JS (y, aparte, el CSS) de una lista de archivos `{ nombre, contenido }`. Es JS lo que termina en `.js` o `.mjs`.
 * @returns {{ archivos: { nombre: string, bytes: number, gzip: number }[], total: number, css: number }}
 */
export function medirArchivos(entradas) {
  const archivos = [];
  let css = 0;
  for (const { nombre, contenido } of entradas) {
    if (/\.m?js$/.test(nombre)) archivos.push({ nombre, bytes: contenido.length, gzip: pesoGzip(contenido) });
    else if (nombre.endsWith(".css")) css += pesoGzip(contenido);
  }
  if (archivos.length === 0) throw new Error("No hay ningún archivo .js que medir. Primero hay que construir la aplicación con «npm run build».");
  return { archivos, total: archivos.reduce((suma, a) => suma + a.gzip, 0), css };
}

/** ¿Está dentro del tope? `margen` es lo que falta para llegar (negativo si se pasó). */
export function evaluar(total, tope = TOPE_DE_JS) {
  return { dentro: total <= tope, margen: tope - total };
}

const enteros = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** «39.436 B (39,4 kB)». */
export function formatearPeso(bytes) {
  return `${enteros.format(bytes)} B (${decimal.format(Math.round(bytes / 100) / 10)} kB)`;
}

function principal() {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
  const carpeta = process.argv[2] ?? join(raiz, "dist");
  let medida;
  try {
    medida = medirArchivos(leerCarpeta(carpeta));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
  for (const a of medida.archivos) console.log(`  ${a.nombre}: ${formatearPeso(a.gzip)} con gzip (${formatearPeso(a.bytes)} sin comprimir)`);
  console.log(`JS con gzip: ${formatearPeso(medida.total)}, tope de ${enteros.format(TOPE_DE_JS)} B.`);
  console.log(`CSS con gzip (no cuenta para el tope): ${formatearPeso(medida.css)}.`);
  const { dentro, margen } = evaluar(medida.total);
  if (!dentro) {
    console.error(`El JS supera el tope por ${enteros.format(-margen)} B.`);
    return 1;
  }
  console.log(`Dentro del tope, con un margen de ${formatearPeso(margen)}.`);
  return 0;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = principal();
