// Los 13 clientes de docs/diseno.md, 5.1: razón social inventada, plazo, perfil de pago y CUIT ficticio que sale del azar (G4).
import { describe, expect, it } from "vitest";
import { crearAzar } from "../src/lib/datos/azar.ts";
import { SEMILLA_PUBLICADA } from "../src/lib/datos/constantes.ts";
import { BASE_DE_CLIENTES_DESDE, BASE_DE_CLIENTES_HASTA, CLIENTES_BASE, armarClientes, crearEmpresa, cuitDesdeBase } from "../src/lib/datos/clientes.ts";
import { armarCuit, cuitValido, digitoVerificador } from "../src/lib/datos/cuit.ts";
import { CLIENTES_DE_PRUEBA } from "./fixtures/armarDatos.ts";

/** La tabla de 5.1, escrita a mano (id, razón social, plazo, perfil, escala del relleno). */
const TABLA_5_1 = [
  ["C01", "Operadora Piedra Lunar Demo S.A.", 45, "puntual", 3],
  ["C02", "Operadora Arroyo Escondido Demo S.A.", 60, "con-retenciones", 3],
  ["C03", "Minera Cordón Azul Demo S.A.", 30, "lento", 2],
  ["C04", "Constructora Valle Hondo Demo S.R.L.", 30, "puntual", 1],
  ["C05", "Contratista Los Algarrobos Demo S.A.", 30, "moroso", 1],
  ["C06", "Obras Cumbre Demo S.A.", 45, "con-nc", 1],
  ["C07", "Montajes Sierra Chica Demo S.R.L.", 30, "lento", 1],
  ["C08", "Transportes Altiplano Demo S.A.", 15, "puntual", 1],
  ["C09", "Perforaciones del Oeste Demo S.A.", 60, "puntual", 1],
  ["C10", "Servicios Cerro Plata Demo S.R.L.", 30, "lento", 1],
  ["C11", "Camiones del Norte Demo S.A.", 30, "lento", 1],
  ["C12", "Ingeniería Paso Largo Demo S.R.L.", 45, "puntual", 1],
  ["C13", "Estructuras Río Seco Demo S.R.L.", 30, "puntual", 1],
] as const;

describe("5.1: el catálogo de los 13 clientes", () => {
  it("son los 13 de la tabla, en orden de id, con su razón social, plazo, perfil y escala", () => {
    expect(CLIENTES_BASE.map((c) => [c.id, c.razonSocial, c.plazoDias, c.perfil, c.escala])).toEqual(TABLA_5_1.map((f) => [...f]));
  });

  it("coinciden con los 13 clientes de tests/fixtures/armarDatos.ts (id, razón social y plazo)", () => {
    expect(CLIENTES_DE_PRUEBA.map((c) => [c.id, c.razonSocial, c.plazoDias])).toEqual(CLIENTES_BASE.map((c) => [c.id, c.razonSocial, c.plazoDias]));
  });

  it("G4: es ficticio y se nota: todas las razones sociales llevan «Demo»", () => {
    for (const c of CLIENTES_BASE) expect(c.razonSocial).toMatch(/\bDemo\b/);
  });

  it("5.1: C09 es el cliente que se fue: sin relleno desde 2026-08-01; los demás facturan hasta el final", () => {
    expect(CLIENTES_BASE.filter((c) => c.sinRellenoDesde !== undefined).map((c) => [c.id, c.sinRellenoDesde])).toEqual([["C09", "2026-08-01"]]);
  });

  it("5.1: los tres más grandes son C01, C02 y C03 (importes del relleno por 2 a 3)", () => {
    expect(CLIENTES_BASE.filter((c) => c.escala > 1).map((c) => c.id)).toEqual(["C01", "C02", "C03"]);
    for (const c of CLIENTES_BASE) expect([1, 2, 3]).toContain(c.escala);
  });
});

describe("5.1 y G4: los CUIT ficticios salen del azar y tienen dígito verificador válido", () => {
  it("cuitDesdeBase: prefijo 30, ocho dígitos y verificador válido; si la base no tiene verificador, pasa a la siguiente", () => {
    expect(cuitDesdeBase(12_345_678)).toMatch(/^30\d{9}$/);
    expect(cuitValido(cuitDesdeBase(12_345_678))).toBe(true);
    let sinVerificador = 10_000_000;
    while (digitoVerificador(`30${sinVerificador}`) !== null) sinVerificador++;
    expect(armarCuit("30", String(sinVerificador))).toBeNull();
    const siguiente = cuitDesdeBase(sinVerificador);
    expect(cuitValido(siguiente)).toBe(true);
    expect(siguiente.slice(2, 10)).not.toBe(String(sinVerificador));
    expect(Number(siguiente.slice(2, 10))).toBeGreaterThan(sinVerificador);
  });

  it("armarClientes: 13 CUIT válidos, distintos, deterministas por semilla, y consume exactamente 13 sorteos (el orden del azar es contrato)", () => {
    const a = crearAzar(SEMILLA_PUBLICADA);
    const clientes = armarClientes(a);
    expect(clientes).toHaveLength(13);
    expect(clientes.every((c) => cuitValido(c.cuit))).toBe(true);
    expect(new Set(clientes.map((c) => c.cuit)).size).toBe(13);
    expect(armarClientes(crearAzar(SEMILLA_PUBLICADA)).map((c) => c.cuit)).toEqual(clientes.map((c) => c.cuit));
    expect(armarClientes(crearAzar(1)).map((c) => c.cuit)).not.toEqual(clientes.map((c) => c.cuit));
    const fresco = crearAzar(SEMILLA_PUBLICADA);
    for (let i = 0; i < 13; i++) fresco.siguiente();
    expect(a.siguiente()).toBe(fresco.siguiente());
  });

  it("armarClientes: los datos del cliente (id, razón social, plazo) son los del catálogo y no llevan el perfil", () => {
    const clientes = armarClientes(crearAzar(5));
    expect(clientes.map((c) => [c.id, c.razonSocial, c.plazoDias])).toEqual(CLIENTES_BASE.map((c) => [c.id, c.razonSocial, c.plazoDias]));
    for (const c of clientes) expect(Object.keys(c).sort()).toEqual(["cuit", "id", "plazoDias", "razonSocial"]);
  });

  it("la empresa: «Logística Andina Demo S.A.», punto de venta 3 y un CUIT válido distinto de los de los clientes (no usa el azar)", () => {
    const e = crearEmpresa();
    expect(e.nombre).toBe("Logística Andina Demo S.A.");
    expect(e.puntoVenta).toBe(3);
    expect(cuitValido(e.cuit)).toBe(true);
    expect(armarClientes(crearAzar(SEMILLA_PUBLICADA)).map((c) => c.cuit)).not.toContain(e.cuit);
    expect(crearEmpresa()).toEqual(e);
  });

  it("el CUIT de la empresa es el de 5.1 y de la Demo 2, armarCuit(«30», «99000003»), escrito a mano acá (30-99000003-0)", () => {
    expect(crearEmpresa().cuit).toBe("30990000030");
    expect(crearEmpresa().cuit).toBe(armarCuit("30", "99000003"));
  });

  it("los CUIT de los clientes salen de un rango acotado (nunca de todo el espacio) y nunca coinciden con el de la empresa, en 50 semillas", () => {
    const base = (cuit: string) => Number(cuit.slice(2, 10));
    const empresa = crearEmpresa().cuit;
    for (let semilla = SEMILLA_PUBLICADA; semilla < SEMILLA_PUBLICADA + 50; semilla++) {
      for (const c of armarClientes(crearAzar(semilla))) {
        expect(c.cuit.startsWith("30"), `${c.id} (${semilla})`).toBe(true);
        expect(base(c.cuit), `${c.id} (${semilla})`).toBeGreaterThanOrEqual(BASE_DE_CLIENTES_DESDE);
        expect(base(c.cuit), `${c.id} (${semilla})`).toBeLessThanOrEqual(BASE_DE_CLIENTES_HASTA);
        expect(c.cuit).not.toBe(empresa);
      }
    }
  });

  it("el rango de los clientes es el bloque de la Demo 2 y queda por encima de la base de la empresa (99.000.003), sin pisarla", () => {
    expect([BASE_DE_CLIENTES_DESDE, BASE_DE_CLIENTES_HASTA]).toEqual([99_100_000, 99_999_999]);
    expect(BASE_DE_CLIENTES_DESDE).toBeGreaterThan(99_000_003);
  });
});
