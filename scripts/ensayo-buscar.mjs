// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/ensayo-buscar.mjs.
// Cambios: ninguno.
// Ensayo de `buscar-prohibidos.mjs` con un caso plantado: copia los scripts a una raíz temporal con un `src/plantado.ts` y lo corre ahí.
// Vive en un `.mjs` (y no en el test) porque los tests no tienen los tipos de Node.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVO_LOCAL } from "./prohibidos.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));

/**
 * Corre la búsqueda sobre una raíz con un solo archivo `src/plantado.ts` con ese texto. Si se pasa `archivoLocal`, lo escribe
 * como `scripts/prohibidos.local.json` de esa raíz (sin él, la regla de nombres de terceros se omite). Devuelve el código de
 * salida y lo que escribió en stderr.
 */
export function correrBuscarCon(texto, archivoLocal) {
  const raiz = mkdtempSync(join(tmpdir(), "buscar-"));
  try {
    mkdirSync(join(raiz, "scripts"));
    mkdirSync(join(raiz, "src"));
    for (const nombre of readdirSync(aqui)) {
      if (nombre.endsWith(".mjs")) copyFileSync(join(aqui, nombre), join(raiz, "scripts", nombre));
    }
    writeFileSync(join(raiz, "src", "plantado.ts"), texto);
    if (archivoLocal !== undefined) writeFileSync(join(raiz, ARCHIVO_LOCAL), archivoLocal);
    const r = spawnSync(process.execPath, [join(raiz, "scripts", "buscar-prohibidos.mjs")], { encoding: "utf8" });
    return { status: r.status, stderr: r.stderr };
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}
