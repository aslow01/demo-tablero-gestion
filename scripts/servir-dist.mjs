// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/servir-dist.mjs.
// Cambios: conoce `.woff2` (las tipografías van alojadas en el propio sitio, `font-src 'self'`), `.woff`, `.png` (la imagen de vista previa para redes) y `.txt` (`robots.txt`): los archivos se sirven con su tipo, como lo hace Cloudflare Pages, y no como `application/octet-stream`.
// Sirve `dist/` con las cabeceras de `public/_headers` (la misma CSP que va a aplicar Cloudflare Pages).
// Es solo para verificar a mano o con un navegador: sin dependencias, solo escucha en 127.0.0.1.
// Uso: npm run build && node scripts/servir-dist.mjs [puerto]
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");
const puerto = Number(process.argv[2] ?? 4173);

// `_headers`: un bloque "/*" con líneas "Nombre: valor".
const cabeceras = {};
for (const linea of readFileSync(join(dist, "_headers"), "utf8").split(/\r?\n/)) {
  const m = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(linea);
  if (m) cabeceras[m[1]] = m[2];
}

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

createServer((req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
  } catch {
    // Un «%» mal formado (por ejemplo «/%E0%A4%A») hace lanzar a `decodeURIComponent`: se responde 400 y el servidor sigue en pie.
    res.writeHead(400, { ...cabeceras, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Dirección mal formada.");
    return;
  }
  let archivo = normalize(join(dist, ruta === "/" ? "index.html" : ruta));
  if (!archivo.startsWith(dist + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) archivo = join(dist, "index.html");
  res.writeHead(200, { ...cabeceras, "Content-Type": tipos[extname(archivo)] ?? "application/octet-stream" });
  res.end(readFileSync(archivo));
}).listen(puerto, "127.0.0.1", () => console.log(`dist/ con cabeceras en http://127.0.0.1:${puerto}/`));
