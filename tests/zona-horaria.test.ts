// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): tests/zona-horaria.test.ts.
// Cambios: se sacó la mención a la regla T2 de la Demo 2.
import { describe, expect, it } from "vitest";

// Comprueba que la zona horaria del proceso de prueba NO es la de Argentina por accidente: `npm test` la fija a una
// zona lejana (vite.config.ts) y `npm run test:tz` la recorre con tres. Si esto falla, las fechas quedan sin defensa.
const ESPERADO: Record<string, number> = {
  UTC: 0,
  "Asia/Tokyo": -540,
  "America/Los_Angeles": 480,
};
const OFFSET_ARGENTINA = 180; // UTC−3 todo el año

// Sin @types/node: se llega a `process` por globalThis.
const zona = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env["TZ"];
// 15 de enero: sin horario de verano en ninguna de las zonas usadas
const offset = new Date(2026, 0, 15, 12, 0, 0).getTimezoneOffset();

describe("zona horaria del proceso", () => {
  it("TZ está definida (la config de Vitest la fija si nadie lo hizo)", () => {
    expect(zona).toBeDefined();
    expect(zona).not.toBe("");
  });

  it("la zona pedida con TZ es la que está activa (si no, la matriz no probaría nada)", () => {
    const esperado = zona === undefined ? undefined : ESPERADO[zona];
    if (esperado === undefined) return; // una zona que no está en la tabla: se confía en quien la pidió
    expect(offset).toBe(esperado);
  });

  it("por defecto el proceso no está en hora de Argentina (salvo que se pida a propósito)", () => {
    const pedidaArgentina = zona !== undefined && zona.includes("Argentina");
    if (pedidaArgentina) return;
    expect(offset).not.toBe(OFFSET_ARGENTINA);
  });
});
