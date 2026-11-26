// La huella del conjunto de datos (docs/diseno.md, G1 y 5.2): FNV-1a de 32 bits sobre los bytes UTF-8 del JSON canónico de `Datos`.
import { describe, expect, it } from "vitest";
import { fnv1a, huellaDe, jsonCanonico } from "../src/lib/datos/huella.ts";
import { fixtureT17 } from "./fixtures/casos.ts";

describe("G1: fnv1a (32 bits, hexadecimal de 8 cifras en minúscula)", () => {
  it("G1: los tres vectores publicados de FNV-1a 32", () => {
    expect(fnv1a("")).toBe("811c9dc5");
    expect(fnv1a("a")).toBe("e40c292c");
    expect(fnv1a("foobar")).toBe("bf9cf968");
  });

  it("G1: trabaja sobre bytes UTF-8, no sobre unidades de UTF-16 (valores calculados aparte con Buffer y BigInt)", () => {
    expect(fnv1a("ñ")).toBe("069dc2f9");
    expect(fnv1a("Logística Andina Demo S.A.")).toBe("1925bc91");
  });

  it("G1: siempre 8 cifras hexadecimales, con ceros a la izquierda", () => {
    for (const texto of ["", "a", "ñ", "x".repeat(1000), "069"]) expect(fnv1a(texto)).toMatch(/^[0-9a-f]{8}$/);
    expect(fnv1a("ñ").startsWith("0")).toBe(true);
  });
});

describe("G1: el JSON canónico sigue el orden de las interfaces de 4, sin espacios", () => {
  const datos = fixtureT17().datos;

  it("las claves de cada objeto van en el orden de su interfaz, sin importar cómo se armó el objeto", () => {
    const barajado = { recibos: datos.recibos, comprobantes: datos.comprobantes, clientes: datos.clientes, empresa: datos.empresa, hasta: datos.hasta, desde: datos.desde, semilla: datos.semilla, version: datos.version };
    expect(jsonCanonico(barajado)).toBe(jsonCanonico(datos));
    const texto = jsonCanonico(datos);
    expect(texto.startsWith('{"version":1,"semilla":0,"desde":"2025-01-01","hasta":"2026-10-31","empresa":{"nombre":')).toBe(true);
    expect(texto).toContain('"clientes":[{"id":"C01","razonSocial":"Operadora Piedra Lunar Demo S.A.","cuit":');
    expect(texto).toMatch(/"comprobantes":\[\{"id":"1-0003-00000001","tipo":1,"puntoVenta":3,"numero":1,"clienteId":"C05","emision":"2026-07-02","vencimiento":"2026-08-01","servicio":"alquiler-4x4","neto":90000000,"iva":18900000,"total":108900000,"asociadoA":null\}/);
    expect(texto).toMatch(/"recibos":\[\{"id":"R-0003-00000001","clienteId":"C05","fecha":"2026-08-12","medios":\[\{"medio":"transferencia","importe":23400000\},/);
    expect(texto).toContain('"imputaciones":[{"comprobanteId":"1-0003-00000001","importe":24200000}]');
    expect(texto).toBe(JSON.stringify(JSON.parse(texto))); // sin espacios ni saltos fuera de las cadenas
  });

  it("es JSON válido y las listas conservan el orden de numeración", () => {
    const vuelta = JSON.parse(jsonCanonico(datos)) as { comprobantes: { id: string }[] };
    expect(vuelta.comprobantes.map((c) => c.id)).toEqual(datos.comprobantes.map((c) => c.id));
  });

  it("un `asociadoA` nulo sale como null y las cadenas con acentos y comillas se escapan bien", () => {
    const con = { ...datos, empresa: { ...datos.empresa, nombre: 'Logística "Andina"' } };
    expect(jsonCanonico(con)).toContain('"nombre":"Logística \\"Andina\\""');
  });
});

describe("G1: huellaDe", () => {
  const datos = fixtureT17().datos;

  it("es la huella del JSON canónico y es estable", () => {
    expect(huellaDe(datos)).toBe(fnv1a(jsonCanonico(datos)));
    expect(huellaDe(datos)).toBe(huellaDe(datos));
  });

  it("cualquier cambio de un dato (un centavo, una fecha, un cliente) cambia la huella", () => {
    const base = huellaDe(datos);
    const c0 = datos.comprobantes[0];
    if (c0 === undefined) throw new Error("sin comprobantes");
    expect(huellaDe({ ...datos, semilla: 1 })).not.toBe(base);
    expect(huellaDe({ ...datos, comprobantes: [{ ...c0, neto: (c0.neto + 1) as typeof c0.neto }, ...datos.comprobantes.slice(1)] })).not.toBe(base);
    expect(huellaDe({ ...datos, comprobantes: [{ ...c0, emision: "2026-07-03" }, ...datos.comprobantes.slice(1)] })).not.toBe(base);
    expect(huellaDe({ ...datos, clientes: datos.clientes.slice(1) })).not.toBe(base);
  });
});
