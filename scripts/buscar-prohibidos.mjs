// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/buscar-prohibidos.mjs.
// Cambios: las reglas de código pasaron a `reglas-codigo.mjs` (para probarlas, con las nuevas de dinero y de reloj de esta demo, M1);
// acá quedan la lectura de archivos, las dos reglas de nombres y correos y la salida.
// Además: la lista de nombres de terceros sale del repositorio (archivo local, sin huellas), como en la Demo 2.
// Búsquedas de `docs/stack.md` sección 6. Falla (código 1) si encuentra algo prohibido.
// Uso: npm run buscar  (lo corre también la integración continua).
// Los nombres de terceros NO están escritos en el repositorio: la regla los lee de `scripts/prohibidos.local.json`
// (`{ "palabras": [...] }`, ignorado por git; ver `prohibidos.mjs`). Si ese archivo no existe (integración continua,
// clon ajeno), la regla se omite con un aviso y las demás corren igual; si existe pero está roto, la búsqueda falla.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVO_LOCAL, contieneProhibido, correosNoPermitidos, terminosDeJson } from "./prohibidos.mjs";
import { REGLAS_DE_CODIGO, hallazgosDe } from "./reglas-codigo.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ignorar = new Set(["node_modules", "dist", ".git", "coverage"]);
const rutaLocal = join(raiz, ...ARCHIVO_LOCAL.split("/"));
let terminos = null; // null: no hay archivo local, la regla de nombres de terceros se omite
if (existsSync(rutaLocal)) {
  try {
    terminos = terminosDeJson(readFileSync(rutaLocal, "utf8"));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

function archivos(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (ignorar.has(nombre) || ruta === rutaLocal) continue;
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else salida.push(ruta);
  }
  return salida;
}

const rel = (f) => relative(raiz, f).split(sep).join("/");
const todos = archivos(raiz).map((f) => ({ ruta: rel(f), texto: readFileSync(f, "utf8") }));

const reglas = [
  ...REGLAS_DE_CODIGO,
  ...(terminos === null ? [] : [{ nombre: "nombres de terceros (lista local)", donde: /^(?!node_modules)/, coincide: (linea) => contieneProhibido(linea, terminos), excepto: [] }]),
  { nombre: "correos que no son de ejemplo ni noreply", donde: /^(?!node_modules)/, coincide: (linea) => correosNoPermitidos(linea).length > 0, excepto: [] },
];

if (terminos === null) {
  console.warn(`Aviso: no existe ${ARCHIVO_LOCAL}: la regla de nombres de terceros se omite (las demás reglas corren igual).`);
}
const hallazgos = hallazgosDe(todos, reglas);
for (const h of hallazgos) console.error(`${h.ruta}:${h.linea}  ${h.regla}\n    ${h.texto}`);
if (hallazgos.length > 0) {
  console.error(`\n${hallazgos.length} hallazgo(s).`);
  process.exit(1);
}
console.log(`Sin hallazgos (${reglas.length} reglas, ${todos.length} archivos).`);
