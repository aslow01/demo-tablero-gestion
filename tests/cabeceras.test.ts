// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): tests/cabeceras.test.ts.
// Cambios: ninguno.
import { describe, expect, it } from "vitest";
import cabeceras from "../public/_headers?raw";

// Paso 0.3: la CSP que aplica Cloudflare Pages sale de `public/_headers`. Este test la fija: si alguien la afloja,
// falla. La verificación en el navegador (consola sin violaciones) está en el registro y en `scripts/servir-dist.mjs`.
function directivas(): Map<string, string> {
  const linea = cabeceras.split(/\r?\n/).find((l) => /^\s+Content-Security-Policy:/.test(l));
  expect(linea).toBeDefined();
  const valor = linea!.replace(/^\s+Content-Security-Policy:\s*/, "");
  return new Map(valor.split(";").map((d) => d.trim()).filter((d) => d !== "").map((d) => {
    const [nombre = "", ...fuentes] = d.split(/\s+/);
    return [nombre, fuentes.join(" ")] as const;
  }));
}

describe("CSP de public/_headers", () => {
  it("todo lo que no se nombra está prohibido y no hay conexiones salientes", () => {
    const d = directivas();
    expect(d.get("default-src")).toBe("'none'");
    expect(d.get("connect-src")).toBe("'none'");
    expect(d.get("frame-ancestors")).toBe("'none'");
    expect(d.get("object-src")).toBe("'none'");
    expect(d.get("base-uri")).toBe("'none'");
    expect(d.get("form-action")).toBe("'none'");
  });

  it("scripts y estilos solo del propio origen, sin 'unsafe-inline' ni 'unsafe-eval'", () => {
    const d = directivas();
    expect(d.get("script-src")).toBe("'self'");
    expect(d.get("style-src")).toBe("'self'");
    expect(cabeceras).not.toMatch(/unsafe-/);
  });

  it("solo pide lo que la demo usa: imágenes propias y data: (el ícono de la pestaña), sin blob:, sin workers ni manifiesto (caen en default-src 'none')", () => {
    const d = directivas();
    expect(d.get("img-src")).toBe("'self' data:");
    expect(d.get("font-src")).toBe("'self'");
    expect(d.has("worker-src")).toBe(false);
    expect(d.has("manifest-src")).toBe(false);
    expect(cabeceras).not.toMatch(/blob:/);
  });

  it("se aplica a todas las rutas y suma las cabeceras de endurecimiento", () => {
    expect(cabeceras.split(/\r?\n/)[0]).toBe("/*");
    expect(cabeceras).toMatch(/X-Content-Type-Options:\s*nosniff/);
    expect(cabeceras).toMatch(/Referrer-Policy:\s*no-referrer/);
  });
});
