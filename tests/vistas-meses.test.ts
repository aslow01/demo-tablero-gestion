// Modelo de vista de Meses y facturación de un cliente (docs/diseno-ui.md, 5.10 y 6.7): doce meses, cada importe una medida controlada, cada total la suma de su columna.
import { describe, expect, it } from "vitest";
import { valorDelPeriodo } from "../src/lib/dominio/agregados.ts";
import { cierresDeMes } from "../src/lib/dominio/corte.ts";
import { valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { facturacionDelCliente, vistaMeses } from "../src/lib/vistas/meses.ts";
import { CORTE, DATOS } from "./fixtures/vistas.ts";

describe("vistaMeses al corte por defecto", () => {
  const v = vistaMeses(DATOS, CORTE);

  it("son los doce meses que terminan en octubre de 2026, de noviembre de 2025 a octubre de 2026", () => {
    expect(v.meses.map((m) => m.mes)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(v.mesDelCorte).toBe("2026-10");
    expect(v.completa).toBe(true);
    expect(v.desde).toBe("2025-01");
  });

  it("octubre es lo que fija esperado.ts: facturación, facturado con IVA, cobranza y retenciones", () => {
    const octubre = v.meses[11];
    expect(octubre?.facturacion.importe).toBe(ESPERADO.octubre.facturacion);
    expect(octubre?.facturadoConIva.importe).toBe(ESPERADO.octubre.facturadoConIva);
    expect(octubre?.cobranza.importe).toBe(ESPERADO.octubre.cobranza);
    expect(octubre?.retenciones.importe).toBe(ESPERADO.octubre.retenciones);
  });

  it("cada importe dice de qué medida sale (con su mes, sin cliente) y vale lo que el dominio", () => {
    const claves = { facturacion: "facturacion-mes", facturadoConIva: "facturado-con-iva-mes", cobranza: "cobranza-mes", retenciones: "retenciones-mes" } as const;
    for (const fila of v.meses) {
      for (const [campo, clave] of Object.entries(claves) as [keyof typeof claves, (typeof claves)[keyof typeof claves]][]) {
        const cifra = fila[campo];
        expect(cifra.medida, `${fila.mes} ${campo}`).toEqual({ clave, mes: fila.mes });
        expect(cifra.importe, `${fila.mes} ${campo}`).toBe(valorDeMedida(DATOS, CORTE, clave, { mes: fila.mes }));
      }
    }
  });

  it("X6: cada total es la suma de su columna y es el valor del período entero", () => {
    expect(v.totales.facturacion).toBe(v.meses.reduce((s, m) => s + m.facturacion.importe, 0));
    expect(v.totales.facturadoConIva).toBe(valorDelPeriodo(DATOS, CORTE, "facturado-con-iva-mes", "2025-11", "2026-10"));
    expect(v.totales.facturacion).toBe(valorDelPeriodo(DATOS, CORTE, "facturacion-mes", "2025-11", "2026-10"));
    expect(v.totales.cobranza).toBe(valorDelPeriodo(DATOS, CORTE, "cobranza-mes", "2025-11", "2026-10"));
    expect(v.totales.retenciones).toBe(valorDelPeriodo(DATOS, CORTE, "retenciones-mes", "2025-11", "2026-10"));
  });

  it("`mayor` apunta al mes de mayor facturado con IVA", () => {
    const importes: number[] = v.meses.map((m) => m.facturadoConIva.importe);
    expect(v.mayor).not.toBeNull();
    expect(importes[v.mayor as number]).toBe(Math.max(...importes));
    expect(importes.indexOf(Math.max(...importes))).toBe(v.mayor);
  });
});

describe("vistaMeses en otros cortes", () => {
  it("con menos de doce meses de datos entrega los que hay y avisa que la serie no está completa", () => {
    const v = vistaMeses(DATOS, "2025-03-31");
    expect(v.meses.map((m) => m.mes)).toEqual(["2025-01", "2025-02", "2025-03"]);
    expect(v.completa).toBe(false);
    expect(v.mesDelCorte).toBe("2025-03");
  });

  it("el primer cierre (enero de 2025) es un solo mes", () => {
    const v = vistaMeses(DATOS, "2025-01-31");
    expect(v.meses).toHaveLength(1);
    expect(v.mayor).toBe(0);
  });

  it("en los 22 cierres, el último mes de la serie es el del corte y no hay meses repetidos ni desordenados", () => {
    for (const corte of cierresDeMes(DATOS)) {
      const v = vistaMeses(DATOS, corte);
      expect(v.meses.at(-1)?.mes, corte).toBe(corte.slice(0, 7));
      expect(v.meses.length, corte).toBe(Math.min(12, cierresDeMes(DATOS).indexOf(corte) + 1));
      expect(v.meses.map((m) => m.mes), corte).toEqual([...v.meses.map((m) => m.mes)].sort());
    }
  });

  it("lo que pasó después del corte no está: al 31/03/2026 las cobranzas de abril no existen para ese corte, y marzo vale lo que valía", () => {
    const v = vistaMeses(DATOS, "2026-03-31");
    expect(v.meses.at(-1)?.cobranza.importe).toBe(valorDeMedida(DATOS, "2026-03-31", "cobranza-mes", { mes: "2026-03" }));
  });
});

describe("facturacionDelCliente (la ficha del cliente)", () => {
  it("C05: doce meses de facturación sin IVA, con el cliente en cada medida, y el total es su suma", () => {
    const f = facturacionDelCliente(DATOS, CORTE, "C05");
    expect(f.clienteId).toBe("C05");
    expect(f.meses).toHaveLength(12);
    for (const m of f.meses) {
      expect(m.facturacion.medida).toEqual({ clave: "facturacion-mes", clienteId: "C05", mes: m.mes });
      expect(m.facturacion.importe).toBe(valorDeMedida(DATOS, CORTE, "facturacion-mes", { clienteId: "C05", mes: m.mes }));
    }
    expect(f.total).toBe(f.meses.reduce((s, m) => s + m.facturacion.importe, 0));
    expect(f.total).toBe(valorDelPeriodo(DATOS, CORTE, "facturacion-mes", "2025-11", "2026-10", "C05"));
  });

  it("la suma de los 13 clientes, mes por mes, es la facturación de la empresa (X3)", () => {
    const empresa = vistaMeses(DATOS, CORTE);
    const porCliente = DATOS.clientes.map((c) => facturacionDelCliente(DATOS, CORTE, c.id));
    empresa.meses.forEach((m, i) => {
      expect(porCliente.reduce((s, f) => s + (f.meses[i]?.facturacion.importe ?? 0), 0), m.mes).toBe(m.facturacion.importe);
    });
    expect(porCliente.reduce((s, f) => s + f.total, 0)).toBe(empresa.totales.facturacion);
  });

  it("un cliente que dejó de facturar (C09 desde agosto de 2026) muestra 0 en esos meses y sigue en la lista", () => {
    const f = facturacionDelCliente(DATOS, CORTE, "C09");
    expect(f.meses.find((m) => m.mes === "2026-09")?.facturacion.importe).toBe(0);
  });

  it("un cliente que no existe lanza, en vez de mostrar una serie vacía", () => {
    expect(() => facturacionDelCliente(DATOS, CORTE, "C99")).toThrow(/C99/);
  });
});
