// Modelo de vista de Clientes: la cartera ordenada, los filtros con su conteo, la búsqueda por nombre o CUIT y los totales.
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { posicionDelCliente } from "../src/lib/dominio/corte.ts";
import { valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { cantidadParaRevisar, carteraDeClientes, vistaClientes } from "../src/lib/vistas/clientes.ts";
import type { FiltroDeClientes } from "../src/lib/vistas/tipos.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { CORTE, DATOS } from "./fixtures/vistas.ts";

const ver = (filtro: FiltroDeClientes = "todos", q = "", corte: string = CORTE) => vistaClientes(DATOS, corte, { filtro, q });

describe("Clientes al 31/10/2026: la cartera", () => {
  const v = ver();

  it("los 13 clientes, del saldo mayor al menor, con los que no tienen saldo al final y el empate por nombre", () => {
    expect(v.filas).toHaveLength(13);
    expect(new Set(v.filas.map((f) => f.clienteId)).size).toBe(13);
    const saldos = v.filas.map((f) => f.saldo.importe);
    const conSaldo = saldos.filter((s) => s > 0);
    expect(saldos.slice(0, conSaldo.length)).toEqual([...conSaldo].sort((a, b) => b - a));
    expect(saldos.slice(conSaldo.length).every((s) => s === 0)).toBe(true);
    expect(conSaldo.length).toBeLessThan(13);
    const sinSaldo = v.filas.slice(conSaldo.length).map((f) => f.nombre);
    expect(sinSaldo).toEqual([...sinSaldo].sort((a, b) => a.localeCompare(b, "es-AR")));
  });

  it("C05 es el cliente con más mora y su tramo más antiguo es «más de 90»; cada cifra dice de qué cliente es", () => {
    const c05 = v.filas.find((f) => f.clienteId === "C05");
    expect(c05).toMatchObject({ nombre: "Contratista Los Algarrobos Demo S.A.", plazoDias: 30, tramoMasAntiguo: "mas-90", estado: null });
    expect(c05?.saldo).toEqual({ medida: { clave: "saldo", clienteId: "C05" }, importe: ESPERADO.c05.saldo });
    expect(c05?.mora).toEqual({ medida: { clave: "mora", clienteId: "C05" }, importe: ESPERADO.c05.mora });
    expect(c05?.regla.clienteId).toBe("C05");
    expect(c05?.regla.total).toBe(ESPERADO.c05.saldo);
    expect(c05?.cuit).toMatch(/^\d{11}$/);
  });

  it("el cliente con pagos a cuenta sin imputar (C07) pide revisar la imputación; el de saldo a favor (C09), un saldo a favor; los demás, nada", () => {
    expect(v.filas.find((f) => f.clienteId === "C07")?.estado).toBe("revisar-imputacion");
    expect(v.filas.find((f) => f.clienteId === "C09")).toMatchObject({ estado: "saldo-a-favor", tramoMasAntiguo: null });
    expect(v.filas.filter((f) => f.estado !== null).map((f) => f.clienteId).sort()).toEqual(["C07", "C09"]);
  });

  it("un cliente sin saldo no tiene tramo más antiguo ni mora, y su regla está vacía", () => {
    const sin = v.filas.filter((f) => f.saldo.importe === 0);
    expect(sin.length).toBeGreaterThan(0);
    for (const f of sin) {
      expect(f.tramoMasAntiguo, f.clienteId).toBeNull();
      expect(f.mora.importe, f.clienteId).toBe(0);
      expect(f.regla.vacia, f.clienteId).toBe(true);
    }
  });

  it("los totales son medidas enteras: la suma de los 13 saldos es el saldo y la de las 13 moras, la mora (X3)", () => {
    expect(v.totales.saldo).toEqual({ importe: ESPERADO.saldo, medida: { clave: "saldo" } });
    expect(v.totales.mora).toEqual({ importe: ESPERADO.mora.importe, medida: { clave: "mora" } });
  });
});

describe("filtros y conteo", () => {
  it("las pastillas: todos (13), con mora (6, esperado.ts) y para revisar (2), y no cambian con el filtro ni la búsqueda", () => {
    const p = ver().pastillas;
    expect(p).toEqual([{ filtro: "todos", cantidad: 13 }, { filtro: "con-mora", cantidad: ESPERADO.mora.clientes }, { filtro: "revisar", cantidad: 2 }]);
    expect(ver("revisar", "algarrobos").pastillas).toEqual(p);
    expect(cantidadParaRevisar(DATOS, CORTE)).toBe(2);
  });

  it("«con mora» deja a los 6 deudores, y la suma de su mora es la mora entera (por eso el total enlaza a mora, pero el del saldo no)", () => {
    const v = ver("con-mora");
    expect(v.filas.map((f) => f.clienteId).sort()).toEqual(ESPERADO.deudores.map((d) => d.clienteId).sort());
    expect(v.totales.mora).toEqual({ importe: ESPERADO.mora.importe, medida: { clave: "mora" } });
    expect(v.totales.saldo.medida).toBeNull();
    expect(v.totales.saldo.importe).toBeLessThan(ESPERADO.saldo);
  });

  it("«para revisar» deja a C07 y C09; ningún total es una medida entera", () => {
    const v = ver("revisar");
    expect(v.filas.map((f) => f.clienteId).sort()).toEqual(["C07", "C09"]);
    expect(v.totales.saldo.medida).toBeNull();
    expect(v.totales.mora.medida).toBeNull();
    expect(v.cantidadDelFiltro).toBe(2);
  });

  it("un filtro desconocido se toma como «todos»", () => {
    expect(ver("cualquiera" as FiltroDeClientes).filtro).toBe("todos");
  });
});

describe("la búsqueda", () => {
  it("por nombre, sin tildes ni mayúsculas: «ALGARRÓBOS» deja a C05; los totales dejan de ser medidas enteras", () => {
    const v = ver("todos", "ALGARRÓBOS");
    expect(v.filas.map((f) => f.clienteId)).toEqual(["C05"]);
    expect(v.conBusqueda).toBe(true);
    expect(v.cantidadDelFiltro).toBe(13);
    expect(v.totales.saldo).toEqual({ importe: ESPERADO.c05.saldo, medida: null });
    expect(v.totales.mora).toEqual({ importe: ESPERADO.c05.mora, medida: null });
  });

  it("por CUIT, con o sin guiones, completo o en parte", () => {
    const c05 = DATOS.clientes.find((c) => c.id === "C05");
    const cuit = c05?.cuit ?? "";
    const conGuiones = `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
    expect(ver("todos", cuit).filas.map((f) => f.clienteId)).toEqual(["C05"]);
    expect(ver("todos", conGuiones).filas.map((f) => f.clienteId)).toEqual(["C05"]);
    expect(ver("todos", cuit.slice(2, 10)).filas.map((f) => f.clienteId)).toEqual(["C05"]);
  });

  it("combina con el filtro y puede dar cero: «para revisar» más «algarrobos» no encuentra a nadie", () => {
    const v = ver("revisar", "algarrobos");
    expect(v.filas).toEqual([]);
    expect(v.totales.saldo).toEqual({ importe: 0, medida: null });
    expect(v.cantidadDelFiltro).toBe(2);
  });

  it("un guion solo no es «todo»: no encuentra nada (ni se confunde con un CUIT vacío)", () => {
    expect(ver("todos", "-").filas).toEqual([]);
    expect(ver("todos", "---").filas).toEqual([]);
  });

  it("espacios no son una búsqueda; entradas hostiles son solo texto", () => {
    expect(ver("todos", "   ").filas).toHaveLength(13);
    for (const q of ["<img src=x>", "(.*)+$", "__proto__", "%E0%A4%A"]) expect(ver("todos", q).filas, q).toEqual([]);
  });
});

describe("carteraDeClientes y otros cortes", () => {
  it("cada fila coincide con el dominio: saldo y mora de la medida, y el estado con la posición del cliente (R4)", () => {
    for (const corte of [CORTE, "2026-09-30", "2026-03-31", "2025-02-28"]) {
      for (const f of carteraDeClientes(DATOS, corte)) {
        expect(f.saldo.importe, `${f.clienteId} ${corte}`).toBe(valorDeMedida(DATOS, corte, "saldo", { clienteId: f.clienteId }));
        expect(f.mora.importe, `${f.clienteId} ${corte}`).toBe(valorDeMedida(DATOS, corte, "mora", { clienteId: f.clienteId }));
        const pos = posicionDelCliente(DATOS, f.clienteId, corte);
        expect(f.estado, `${f.clienteId} ${corte}`).toBe(pos.aCuenta === 0 ? null : pos.saldo > 0 ? "revisar-imputacion" : "saldo-a-favor");
      }
    }
  });

  it("al 30/09/2026 el pago a cuenta de C07 (20/10) todavía no existe: nadie pide revisar esa imputación por él", () => {
    const f = carteraDeClientes(DATOS, "2026-09-30").find((c) => c.clienteId === "C07");
    expect(f?.estado).toBeNull();
  });

  it("sin ningún comprobante: 13 clientes sin saldo, ordenados por nombre, sin nada para revisar", () => {
    const { datos } = armarDatos({});
    const v = vistaClientes(datos, "2026-10-31", { filtro: "todos", q: "" });
    expect(v.filas).toHaveLength(13);
    expect(v.filas.map((f) => f.nombre)).toEqual([...v.filas.map((f) => f.nombre)].sort((a, b) => a.localeCompare(b, "es-AR")));
    expect(v.totales.saldo.importe).toBe(0);
    expect(cantidadParaRevisar(datos, "2026-10-31")).toBe(0);
  });

  it("un empate de saldo se resuelve por nombre y no por el orden de los datos", () => {
    const { datos } = armarDatos({ comprobantes: [{ clave: "A", cliente: "C13", emision: "2026-10-01", neto: pesos(1_000) }, { clave: "B", cliente: "C02", emision: "2026-10-01", neto: pesos(1_000) }] });
    const v = vistaClientes(datos, "2026-10-31", { filtro: "todos", q: "" });
    // C13 (Estructuras…) va antes que C02 (Operadora…) aunque en los datos esté después.
    expect(v.filas.slice(0, 2).map((f) => f.clienteId)).toEqual(["C13", "C02"]);
  });
});
