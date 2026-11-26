// Camino por agregación (docs/diseno.md, 4.2.1): el `valor` de cada medida, sumando campos de los datos crudos, sin calcular el saldo de
// cada comprobante. Se prueba por su cuenta, contra los números de los fixtures (docs/plan.md, paso 3.3), sin pasar por partidas.ts.
import { describe, expect, it } from "vitest";
import { valorAgregado, valorDelPeriodo } from "../src/lib/dominio/agregados.ts";
import { CLAVES_DEL_CATALOGO } from "../src/lib/dominio/claves.ts";
import type { ClaveDeMedida } from "../src/lib/dominio/tipos.ts";
import { ESPERADOS } from "./fixtures/esperados.ts";
import { fixtureOtros, fixtureOtrosConPagador, fixtureT09, fixtureT12, fixtureT13 } from "./fixtures/casos.ts";

describe("D2 (camino por agregación): el valor de cada medida contra los números de los fixtures", () => {
  for (const x of ESPERADOS) {
    it(`D2: ${x.nombre}`, () => {
      const a = x.armar();
      expect(valorAgregado(a.datos, x.corte, x.clave, x.filtro ?? {})).toBe(x.valor);
    });
  }
});

// La independencia de agregados.ts (que no llegue a partidas.ts ni a corte.ts, ni directo ni a través de un tercero) la custodia tests/independencia.test.ts.

describe("M4 (D1): «Otros» por agregación, solo con más de 5 clientes con mora", () => {
  it("M4: con siete deudores, mora-otros = 363.000,00 + 242.000,00 = 605.000,00 (por resta: mora − los cinco mayores)", () => {
    const a = fixtureOtros();
    expect(valorAgregado(a.datos, "2026-10-31", "mora", {})).toBe(484_000_000);
    expect(valorAgregado(a.datos, "2026-10-31", "mora-otros", {})).toBe(60_500_000);
  });

  it("M4: con 5 o 6 deudores la clave es inexistente: mora-otros lanza (con 6 sería la sexta fila)", () => {
    expect(() => valorAgregado(fixtureOtros(5).datos, "2026-10-31", "mora-otros", {})).toThrow(/mora-otros/);
    expect(valorAgregado(fixtureOtros(6).datos, "2026-10-31", "mora-otros", {})).toBe(36_300_000);
  });

  it("M4: un cliente con movimientos pero mora 0 (pagó su factura vencida) no es un deudor: con 5 deudores y él, «Otros» no existe", () => {
    expect(() => valorAgregado(fixtureOtrosConPagador().datos, "2026-10-31", "mora-otros", {})).toThrow(/mora-otros/);
  });

  it("M4: mora-otros no admite filtro por cliente (es de los clientes fuera de los cinco mayores)", () => {
    expect(() => valorAgregado(fixtureOtros().datos, "2026-10-31", "mora-otros", { clienteId: "C03" })).toThrow(/mora-otros/);
  });

  it("M4: con siete deudores de igual importe, «Otros» son dos de siete (el valor no depende de cuáles caen en el corte)", () => {
    const a = fixtureOtros();
    const parejos = {
      ...a.datos,
      comprobantes: a.datos.comprobantes.map((c) => ({ ...c, neto: a.datos.comprobantes[0]?.neto ?? c.neto, iva: a.datos.comprobantes[0]?.iva ?? c.iva, total: a.datos.comprobantes[0]?.total ?? c.total })),
    };
    expect(valorAgregado(parejos, "2026-10-31", "mora-otros", {})).toBe(2 * (a.datos.comprobantes[0]?.total ?? 0));
  });
});

describe("D2: un mes inexistente o una clave que no es del catálogo", () => {
  it("D2: una clave desconocida lanza", () => {
    expect(() => valorAgregado(fixtureT12().datos, "2026-10-31", "inexistente" as ClaveDeMedida, {})).toThrow(/inexistente/);
  });

  it("D2: un corte que no es una fecha válida lanza", () => {
    expect(() => valorAgregado(fixtureT12().datos, "2026-02-30", "saldo", {})).toThrow(/corte/);
  });

  it("D2: las 15 claves del catálogo se calculan sobre cualquier fixture (ninguna lanza)", () => {
    for (const clave of CLAVES_DEL_CATALOGO) expect(() => valorAgregado(fixtureT12().datos, "2026-10-31", clave, {})).not.toThrow();
  });
});

describe("D3 (X6): valorDelPeriodo suma un rango de meses de una vez", () => {
  it("X6 (T13): facturación de diciembre de 2025 a enero de 2026 = 100.000,00 + 120.000,00", () => {
    expect(valorDelPeriodo(fixtureT13().datos, "2026-01-31", "facturacion-mes", "2025-12", "2026-01")).toBe(22_000_000);
  });

  it("X6 (T13): un solo mes da lo mismo que la medida del mes", () => {
    const d = fixtureT13().datos;
    expect(valorDelPeriodo(d, "2026-01-31", "facturacion-mes", "2026-01", "2026-01")).toBe(valorAgregado(d, "2026-01-31", "facturacion-mes", { mes: "2026-01" }));
  });

  it("X6 (T09): con el cliente, solo los suyos; la facturación del período puede ser negativa", () => {
    const d = fixtureT09().datos;
    expect(valorDelPeriodo(d, "2026-07-31", "facturacion-mes", "2026-06", "2026-07", "C06")).toBe(30_000_000); // 800.000,00 − 800.000,00 + 300.000,00
  });

  it("X6: lo emitido después del corte no cuenta aunque el período lo incluya (S1)", () => {
    const d = fixtureT13().datos;
    expect(valorDelPeriodo(d, "2025-12-31", "facturacion-mes", "2025-12", "2026-01")).toBe(10_000_000);
  });

  it("X6: una clave que no es del mes lanza", () => {
    expect(() => valorDelPeriodo(fixtureT13().datos, "2026-01-31", "saldo" as never, "2025-12", "2026-01")).toThrow(/mes/);
  });
});
