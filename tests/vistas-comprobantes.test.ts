// Modelo de vista de Comprobantes: filtros por tramo con su conteo, búsqueda por cliente o número (sin tildes ni mayúsculas) y el
// total de la tabla, que es la suma de las filas y, sin búsqueda, una medida entera.
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { tramoDe } from "../src/lib/dominio/antiguedad.ts";
import { valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { vistaComprobantes } from "../src/lib/vistas/comprobantes.ts";
import { FILTROS_DE_TRAMO } from "../src/lib/vistas/tipos.ts";
import type { FiltroDeTramo } from "../src/lib/vistas/tipos.ts";
import { CORTE, DATOS, idPlantado } from "./fixtures/vistas.ts";

const ver = (tramo: FiltroDeTramo = "todos", q = "", corte: string = CORTE) => vistaComprobantes(DATOS, corte, { tramo, q });

describe("Comprobantes al 31/10/2026: todos", () => {
  const v = ver();

  it("el saldo a cobrar es el de esperado.ts y la tabla entera lo suma, con su medida", () => {
    expect(v.filtro).toBe("todos");
    expect(v.saldo).toEqual({ medida: { clave: "saldo" }, importe: ESPERADO.saldo });
    expect(v.total).toEqual({ importe: ESPERADO.saldo, medida: { clave: "saldo" } });
    expect(v.filas.length).toBe(v.cantidadDelFiltro);
    expect(v.conBusqueda).toBe(false);
  });

  it("las pastillas: todos, en mora y los cinco tramos, con el conteo (los cinco tramos suman «todos»; los cuatro vencidos, «en mora»)", () => {
    expect(v.pastillas.map((p) => p.filtro)).toEqual(["todos", "vencidos", "no-vencido", "1-30", "31-60", "61-90", "mas-90"]);
    const [todos, vencidos, ...tramos] = v.pastillas;
    expect(tramos.reduce((n, p) => n + p.cantidad, 0)).toBe(todos?.cantidad);
    expect(tramos.slice(1).reduce((n, p) => n + p.cantidad, 0)).toBe(vencidos?.cantidad);
    expect(vencidos?.cantidad).toBe(ESPERADO.mora.comprobantes);
    expect(tramos[4]?.cantidad).toBe(1);
  });

  it("de la más atrasada a la menos: la de 91 días primero, y cada fila trae su tramo, saldo y cliente", () => {
    expect(v.filas[0]).toMatchObject({ comprobanteId: idPlantado("T12-d91"), clienteId: "C05", atraso: 91, tramo: "mas-90", tipo: 1, saldo: 60_500_000 });
    for (let i = 1; i < v.filas.length; i++) expect(v.filas[i - 1]?.atraso).toBeGreaterThanOrEqual(v.filas[i]?.atraso ?? Number.POSITIVE_INFINITY);
    for (const f of v.filas) {
      expect(f.saldo).toBeGreaterThan(0);
      expect(f.tramo).toBe(tramoDe(f.atraso));
      expect(f.nombreDelCliente.length).toBeGreaterThan(0);
    }
  });

  it("T04-F (vence el 31/10) figura con atraso 0 y tramo «no vencido»; T08-F (cancelada) no figura", () => {
    expect(v.filas.find((f) => f.comprobanteId === idPlantado("T04-F"))).toMatchObject({ atraso: 0, tramo: "no-vencido", vencimiento: "2026-10-31" });
    expect(v.filas.some((f) => f.comprobanteId === idPlantado("T08-F"))).toBe(false);
  });

  it("la regla de tramos de la empresa viene en la vista", () => {
    expect(v.regla.total).toBe(ESPERADO.saldo);
    expect(v.regla.filas).toHaveLength(5);
  });
});

describe("el filtro por tramo", () => {
  it("«en mora»: los 16 de esperado.ts, su total es la mora y la medida es mora", () => {
    const v = ver("vencidos");
    expect(v.filas).toHaveLength(ESPERADO.mora.comprobantes);
    expect(v.total).toEqual({ importe: ESPERADO.mora.importe, medida: { clave: "mora" } });
    expect(v.cantidadDelFiltro).toBe(16);
    expect(v.filas.every((f) => f.atraso >= 1)).toBe(true);
  });

  it("cada filtro muestra solo su tramo, suma lo que esperado.ts dice y apunta a su medida", () => {
    for (const filtro of FILTROS_DE_TRAMO.filter((f) => f !== "todos" && f !== "vencidos")) {
      const v = ver(filtro);
      expect(v.filas.every((f) => f.tramo === filtro), filtro).toBe(true);
      expect(v.total.importe, filtro).toBe(ESPERADO.tramos[filtro as keyof typeof ESPERADO.tramos]);
      expect(v.total.medida, filtro).toEqual({ clave: `tramo-${filtro}` });
      expect(v.total.importe, filtro).toBe(valorDeMedida(DATOS, CORTE, `tramo-${filtro}` as never));
    }
  });

  it("un filtro desconocido se toma como «todos», sin error", () => {
    const v = ver("cualquiera" as FiltroDeTramo);
    expect(v.filtro).toBe("todos");
    expect(v.filas).toHaveLength(ver("todos").filas.length);
  });

  it("las pastillas no cambian con el filtro ni con la búsqueda (siempre cuentan sin buscar)", () => {
    expect(ver("1-30", "algarrobos").pastillas).toEqual(ver("todos").pastillas);
  });
});

describe("la búsqueda", () => {
  it("por cliente, sin tildes ni mayúsculas: «ALGARRÓBOS» deja solo los de C05, el total es la suma de las filas y ya no es una medida entera", () => {
    const v = ver("todos", "ALGARRÓBOS");
    expect(v.conBusqueda).toBe(true);
    expect(v.filas).toHaveLength(ESPERADO.c05.comprobantesConSaldo);
    expect(v.filas.every((f) => f.clienteId === "C05")).toBe(true);
    expect(v.total.importe).toBe(ESPERADO.c05.saldo);
    expect(v.total.medida).toBeNull();
    expect(v.cantidadDelFiltro).toBe(ver().filas.length);
  });

  it("por número de comprobante: el id entero deja uno; una parte del número, los que la tengan", () => {
    const id = idPlantado("T12-d91");
    expect(ver("todos", id).filas.map((f) => f.comprobanteId)).toEqual([id]);
    const parte = id.slice(-3);
    const esperados = ver().filas.filter((f) => f.comprobanteId.includes(parte));
    expect(ver("todos", parte).filas.map((f) => f.comprobanteId)).toEqual(esperados.map((f) => f.comprobanteId));
  });

  it("combina con el filtro: «en mora» más «algarrobos»", () => {
    const v = ver("vencidos", "algarrobos");
    expect(v.filas).toHaveLength(ESPERADO.c05.enMoraComprobantes);
    expect(v.total.importe).toBe(ESPERADO.c05.mora);
    expect(v.cantidadDelFiltro).toBe(ESPERADO.mora.comprobantes);
  });

  it("sin coincidencias: cero filas, total 0 y la cantidad del filtro intacta (para «Se muestran 0 de N»)", () => {
    const v = ver("todos", "zzzz");
    expect(v.filas).toEqual([]);
    expect(v.total).toEqual({ importe: 0, medida: null });
    expect(v.cantidadDelFiltro).toBeGreaterThan(0);
  });

  it("espacios solos o vacío no son una búsqueda; lo escrito se recorta a 60 caracteres", () => {
    expect(ver("todos", "   ").conBusqueda).toBe(false);
    expect(ver("todos", "   ").filas).toHaveLength(ver().filas.length);
    expect(ver("todos", `algarrobos${"x".repeat(100)}`).filas).toHaveLength(0);
    expect(ver("todos", `${"a".repeat(60)}zzz`).conBusqueda).toBe(true);
  });

  it("entradas hostiles son solo texto: no rompen ni encuentran nada", () => {
    for (const q of ["<script>alert(1)</script>", "(.*)+$", "__proto__", "%E0%A4%A", "toString", "\\"]) {
      const v = ver("todos", q);
      expect(v.filas.length, q).toBe(0);
    }
    expect(ver("todos", "(").filas).toHaveLength(0);
  });
});

describe("otros cortes", () => {
  it("al 30/09/2026 la factura del recorrido está en 31 a 60 días y T05-F todavía no vencida; el cobro del 14/10 no existe", () => {
    const v = ver("todos", "", "2026-09-30");
    expect(v.filas.find((f) => f.comprobanteId === idPlantado("T12-d91"))).toMatchObject({ atraso: 60, tramo: "31-60", saldo: 72_600_000 });
    expect(v.filas.find((f) => f.comprobanteId === idPlantado("T05-F"))).toMatchObject({ atraso: -25, tramo: "no-vencido" });
    expect(v.total.importe).toBe(valorDeMedida(DATOS, "2026-09-30", "saldo"));
  });

  it("en el primer cierre (31/01/2025) la tabla entera suma el saldo de ese día y «todos» cuenta sus filas", () => {
    const v = ver("todos", "", "2025-01-31");
    expect(v.total.importe).toBe(valorDeMedida(DATOS, "2025-01-31", "saldo"));
    expect(v.pastillas[0]?.cantidad).toBe(v.filas.length);
  });
});
