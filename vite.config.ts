// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): vite.config.ts.
// Cambios: se sacó la mención a la regla T2 de la Demo 2 (acá las fechas no tienen identificador T).
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

// Zona horaria: `npm test` corre por defecto con una zona horaria que NO es la de Argentina, así quien trabaja en Argentina
// también se entera si el dominio usa la hora local por error. `TZ=... npm test` (y `npm run test:tz`) la pisan.
// Tiene que fijarse acá, antes de que se carguen los módulos y de que se creen los procesos de prueba.
// Sin @types/node: se llega a `process` por globalThis.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
if (entorno !== undefined && (entorno["TZ"] === undefined || entorno["TZ"] === "")) entorno["TZ"] = "Asia/Tokyo";

export default defineConfig(({ mode }) => ({
  // En los tests Vitest transforma como "servidor" y Svelte compilaría los $effect a nada: se fuerza el modo cliente.
  plugins: [svelte(mode === "test" ? { dynamicCompileOptions: () => ({ generate: "client" }) } : {})],
  build: {
    target: "es2022",
    sourcemap: false,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
}));
