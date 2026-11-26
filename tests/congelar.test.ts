// `congelar`: los datos son de solo lectura. corte.ts y agregados.ts guardan índices por conjunto de datos (WeakMap): si alguien agregara
// un comprobante al mismo objeto, las medidas darían valores viejos sin avisar. Congelado, intentarlo lanza.
import { describe, expect, it } from "vitest";
import { congelar } from "../src/lib/datos/congelar.ts";
import { fixtureT17 } from "./fixtures/casos.ts";

describe("congelar deja los datos en solo lectura, a fondo", () => {
  it("congela el objeto, sus listas y los objetos de adentro, y devuelve el mismo objeto", () => {
    const original = { lista: [{ a: 1 }, { a: 2 }], hijo: { nieto: { b: [1, 2] } } };
    const resultado = congelar(original);
    expect(resultado).toBe(original);
    expect(Object.isFrozen(original)).toBe(true);
    expect(Object.isFrozen(original.lista)).toBe(true);
    expect(Object.isFrozen(original.lista[0])).toBe(true);
    expect(Object.isFrozen(original.hijo.nieto.b)).toBe(true);
  });

  it("agregar a una lista o cambiar un campo de un dato congelado lanza (los módulos de ES son estrictos)", () => {
    const datos = congelar(fixtureT17().datos);
    expect(() => datos.comprobantes.push(datos.comprobantes[0] as never)).toThrow(TypeError);
    expect(() => {
      (datos.clientes[0] as { id: string }).id = "X";
    }).toThrow(TypeError);
    expect(() => {
      (datos as { hasta: string }).hasta = "2030-01-01";
    }).toThrow(TypeError);
  });

  it("a fondo de verdad: un objeto ya congelado a medias (solo la capa de arriba) termina congelado por dentro", () => {
    const a = Object.freeze({ adentro: { lista: [1, 2] } });
    congelar(a);
    expect(Object.isFrozen(a.adentro)).toBe(true);
    expect(Object.isFrozen(a.adentro.lista)).toBe(true);
  });

  it("no se pierde con un ciclo ni con algo ya congelado, y deja pasar números, textos y null", () => {
    const a: { yo?: unknown } = {};
    a.yo = a;
    expect(() => congelar(a)).not.toThrow();
    expect(congelar(Object.freeze({ x: 1 }))).toEqual({ x: 1 });
    expect(congelar(null)).toBeNull();
    expect(congelar(5)).toBe(5);
    expect(congelar("texto")).toBe("texto");
  });

  it("los datos congelados siguen calculando (los índices no escriben en ellos)", async () => {
    const { medida } = await import("../src/lib/dominio/medidas.ts");
    const a = fixtureT17();
    const datos = congelar(a.datos);
    expect(medida(datos, "2026-10-31", "saldo").valor).toBe(60_500_000);
  });
});
