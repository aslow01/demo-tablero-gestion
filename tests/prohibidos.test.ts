// Búsqueda de términos prohibidos (`scripts/prohibidos.mjs`). Los términos de estos tests son inventados:
// el repositorio público no puede traer los reales ni siquiera en las pruebas. Los reales viven en un archivo local
// no versionado (`scripts/prohibidos.local.json`).
import { describe, expect, it } from "vitest";
import {
  ARCHIVO_LOCAL,
  correosNoPermitidos,
  contieneProhibido,
  normalizar,
  terminosDeJson,
  tokenizar,
} from "../scripts/prohibidos.mjs";
import { correrBuscarCon } from "../scripts/ensayo-buscar.mjs";

const terminos = terminosDeJson(JSON.stringify({ palabras: ["Zorbalux", "Quéntaro Brisa Norte"] }));

describe("normalizar", () => {
  it("pasa a minúsculas y quita acentos y diéresis", () => {
    expect(normalizar("ZORBALUX")).toBe("zorbalux");
    expect(normalizar("Quéntaro Pingüino")).toBe("quentaro pinguino");
  });
  it("trata la eñe como la ene (las dos formas dan lo mismo)", () => {
    expect(normalizar("Ñandú")).toBe(normalizar("Nandu"));
  });
  it("es idempotente y entiende texto ya descompuesto (NFD)", () => {
    expect(normalizar("é")).toBe("e");
    expect(normalizar(normalizar("É"))).toBe("e");
  });
});

describe("tokenizar", () => {
  it("parte por todo lo que no es letra ni número y normaliza", () => {
    expect(tokenizar("Quéntaro-Brisa_Norte, 2026!")).toEqual(["quentaro", "brisa", "norte", "2026"]);
  });
  it("no devuelve vacíos", () => {
    expect(tokenizar("  ...  ")).toEqual([]);
    expect(tokenizar("")).toEqual([]);
  });
});

describe("terminosDeJson (archivo local)", () => {
  it("lee el campo «palabras» y deja cada término normalizado y partido en palabras", () => {
    expect(terminos).toEqual([["zorbalux"], ["quentaro", "brisa", "norte"]]);
  });
  it("ignora lo que no es texto o no tiene letras ni números, en lugar de romper", () => {
    expect(terminosDeJson(JSON.stringify({ palabras: ["---", 7, null, "", "Zorbalux"] }))).toEqual([["zorbalux"]]);
  });
  it("sin palabras da una lista vacía", () => {
    expect(terminosDeJson(JSON.stringify({ palabras: [] }))).toEqual([]);
    expect(terminosDeJson(JSON.stringify({}))).toEqual([]);
  });
  it("rechaza un JSON roto o que no es un objeto con una lista (un archivo mal escrito no puede apagar la regla en silencio)", () => {
    expect(() => terminosDeJson("{ no es json")).toThrow(ARCHIVO_LOCAL);
    expect(() => terminosDeJson("[]")).toThrow(ARCHIVO_LOCAL);
    expect(() => terminosDeJson(JSON.stringify({ palabras: "Zorbalux" }))).toThrow(ARCHIVO_LOCAL);
  });
});

describe("contieneProhibido", () => {
  it("detecta un término en otra mayúscula", () => {
    expect(contieneProhibido("Usé ZORBALUX ayer", terminos)).toBe(true);
    expect(contieneProhibido("usé zorbalux ayer", terminos)).toBe(true);
  });
  it("detecta un término con acento o diéresis agregados", () => {
    expect(contieneProhibido("Zórbalux", terminos)).toBe(true);
  });
  it("detecta el término pegado a otras palabras o en un identificador", () => {
    expect(contieneProhibido("class ZorbaluxCentral {}", terminos)).toBe(true);
    expect(contieneProhibido("const zorbalux_id = 1", terminos)).toBe(true);
    expect(contieneProhibido("https://zorbalux.example.com/x", terminos)).toBe(true);
  });
  it("detecta una frase partida en palabras consecutivas, con otros separadores y en otra mayúscula", () => {
    expect(contieneProhibido("empresa Quentaro Brisa Norte S.A.", terminos)).toBe(true);
    expect(contieneProhibido("QUÉNTARO-BRISA_NORTE", terminos)).toBe(true);
    expect(contieneProhibido("quentaro   brisa\tnorte", terminos)).toBe(true);
  });
  it("una frase incompleta o desordenada no cuenta", () => {
    expect(contieneProhibido("Quéntaro Brisa", terminos)).toBe(false);
    expect(contieneProhibido("Norte Brisa Quéntaro", terminos)).toBe(false);
  });
  it("una frase con otra palabra en el medio no cuenta", () => {
    expect(contieneProhibido("Quéntaro del Brisa Norte", terminos)).toBe(false);
  });
  it("no da falsos positivos con texto común del proyecto", () => {
    const texto = [
      "export function clasificar(documento: Documento): Clasificacion {",
      "Tablero de cobranzas: facturación, cobranza y mora de una empresa ficticia.",
      "Zona horaria de Argentina, Brisa de ejemplo, Norte y Sur.",
      "zorba lux, zorb alux, zorbalu",
    ].join("\n");
    expect(contieneProhibido(texto, terminos)).toBe(false);
  });
  it("sin términos no encuentra nada", () => {
    expect(contieneProhibido("Zorbalux", [])).toBe(false);
  });
  it("texto vacío no encuentra nada", () => {
    expect(contieneProhibido("", terminos)).toBe(false);
  });
  it("detecta una frase de dos palabras aunque haya términos de otros largos", () => {
    const dos = terminosDeJson(JSON.stringify({ palabras: ["Ab", "Mar Plata"] }));
    expect(contieneProhibido("viaje a mar-plata", dos)).toBe(true);
    expect(contieneProhibido("viaje a mar del plata", dos)).toBe(false);
  });
});

// La arroba va aparte para que estos ejemplos no sean, ellos mismos, correos que `npm run buscar` rechace.
const A = "@";

describe("correosNoPermitidos", () => {
  it("marca un correo de un proveedor cualquiera", () => {
    expect(correosNoPermitidos(`escribir a persona.inventada${A}proveedor-ficticio.com`)).toEqual([`persona.inventada${A}proveedor-ficticio.com`]);
  });
  it("marca el correo aunque esté en otra mayúscula y rodeado de signos", () => {
    expect(correosNoPermitidos(`<Alguien${A}Proveedor-Ficticio.COM>,`)).toHaveLength(1);
  });
  it("permite los dominios de ejemplo reservados y sus subdominios", () => {
    expect(correosNoPermitidos("a@example.com b@example.org c@example.net d@mail.example.com e@algo.test f@x.invalid")).toEqual([]);
  });
  it("permite las direcciones noreply", () => {
    expect(correosNoPermitidos("noreply@proveedor-ficticio.com no-reply@otro-ficticio.org 12345+nombre@users.noreply.github.com")).toEqual([]);
  });
  it("no confunde con correos las versiones, los paquetes con alcance ni las rutas", () => {
    const texto = ['"vite@8.3.5"', "svelte@5.57.3", "npm i pkg@latest", "node_modules/@sveltejs/vite-plugin-svelte", "@media (min-width: 30rem)"].join("\n");
    expect(correosNoPermitidos(texto)).toEqual([]);
  });
  it("devuelve todos los correos de una línea", () => {
    expect(correosNoPermitidos(`a${A}uno-ficticio.com y b${A}dos-ficticio.com`)).toHaveLength(2);
  });
});

describe("buscar: nombres de terceros con el archivo local", () => {
  const local = JSON.stringify({ palabras: ["Zorbalux", "Quéntaro Brisa Norte"] });

  it("con el archivo presente, falla con un término plantado y nombra el archivo y la línea (sin repetir el término)", () => {
    const r = correrBuscarCon("export const x = 1;\n// ver ZorbaluxCentral\n", local);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("src/plantado.ts:2");
    expect(r.stderr).toContain("nombres de terceros");
  });
  it("con el archivo presente, falla también con una frase plantada", () => {
    const r = correrBuscarCon("// Quéntaro Brisa Norte S.A.\n", local);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("src/plantado.ts:1");
  });
  it("con el archivo presente, pasa si no hay nada plantado", () => {
    const r = correrBuscarCon("export const x = 1;\n", local);
    expect(r.status).toBe(0);
  });
  it("el propio archivo local no se revisa (contiene los términos)", () => {
    const r = correrBuscarCon("export const x = 1;\n", local);
    expect(r.status).toBe(0);
    expect(r.stderr).not.toContain(ARCHIVO_LOCAL);
  });
  it("sin el archivo, omite la regla de nombres, lo avisa y no falla por eso", () => {
    const r = correrBuscarCon("export const x = 1;\n// ver ZorbaluxCentral\n");
    expect(r.status).toBe(0);
    expect(r.stderr).toContain(ARCHIVO_LOCAL);
    expect(r.stderr).toContain("omit");
  });
  it("sin el archivo, las demás reglas siguen corriendo", () => {
    const r = correrBuscarCon("const x = eval(\"1\");\n");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("src/plantado.ts:1");
    expect(r.stderr).toContain("eval");
  });
  it("con un archivo roto, falla y lo dice (no apaga la regla en silencio)", () => {
    const r = correrBuscarCon("export const x = 1;\n", "{ no es json");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(ARCHIVO_LOCAL);
  });
});

describe("el repositorio no guarda los términos ni su huella", () => {
  const ignorado = import.meta.glob("../.gitignore", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
  const scripts = import.meta.glob("../scripts/*.{mjs,mts}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

  it("el archivo local está en .gitignore, igual que .env*", () => {
    const lineas = (ignorado["../.gitignore"] ?? "").split("\n").map((l) => l.trim());
    expect(lineas).toContain(ARCHIVO_LOCAL);
    expect(lineas).toContain(".env*");
  });
  it("ningún script trae una cadena de 64 hexadecimales (una huella SHA-256 sin sal se revierte probando un diccionario)", () => {
    expect(Object.keys(scripts).length).toBeGreaterThan(5);
    for (const [ruta, texto] of Object.entries(scripts)) {
      expect(texto, ruta).not.toMatch(/[0-9a-f]{64}/i);
    }
  });
  it("ya no existe el módulo de huellas", () => {
    expect(Object.keys(scripts).some((r) => r.includes("huellas-prohibidas"))).toBe(false);
  });
});
