// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/test-tz.mjs.
// Cambios: se sacó una mención a una regla de la Demo 2.
// Corre la suite completa con tres zonas horarias distintas.
// Uso: npm run test:tz
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const vitest = join(raiz, "node_modules", "vitest", "vitest.mjs");
const zonas = ["UTC", "Asia/Tokyo", "America/Los_Angeles"];

let fallo = false;
for (const zona of zonas) {
  console.log(`\n=== TZ=${zona} ===`);
  const r = spawnSync(process.execPath, [vitest, "run"], {
    cwd: raiz,
    env: { ...process.env, TZ: zona },
    stdio: "inherit",
  });
  if (r.status !== 0) {
    fallo = true;
    console.error(`FALLÓ con TZ=${zona}`);
  }
}
process.exit(fallo ? 1 : 0);
