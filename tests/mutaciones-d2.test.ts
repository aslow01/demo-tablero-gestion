// Las tres mutaciones plantadas de D2 (docs/diseno.md, 6.6; docs/plan.md, paso 3.5): una en cada camino de cálculo, y cada una tiene que
// hacer fallar su control. Sin esto, «los dos caminos concuerdan» podría ser verdad porque los controles no pueden fallar nunca.
//   (a) 1 centavo de más en una partida del tramo 31–60 (camino por listado) → falla `controlar`.
//   (b) 1 centavo de más en el `valor` de ese tramo (camino por agregación) → fallan `controlar` y los controles cruzados X1 y X2.
//   (c) un saldo mal calculado en S2 (se olvidan las NC) sin tocar la agregación → falla `controlar`.
// Se prueban con el fixture T12 (a mano) y con datos del generador provisional.
import { describe, expect, it } from "vitest";
import { cierresDeMes, saldosAlCorte } from "../src/lib/dominio/corte.ts";
import { controlesCruzados, valoresDe } from "../src/lib/dominio/controles.ts";
import { centavos, sumar } from "../src/lib/dominio/dinero.ts";
import { ErrorDeCierre, controlar, medida } from "../src/lib/dominio/medidas.ts";
import type { ProveedorDeSaldos } from "../src/lib/dominio/partidas.ts";
import type { Datos, Medida } from "../src/lib/dominio/tipos.ts";
import { validarDatos } from "../src/lib/dominio/validadores.ts";
import { pesos } from "./fixtures/armarDatos.ts";
import { alterando } from "./fixtures/alterar.ts";
import { fixtureT01, fixtureT12, fixtureT17 } from "./fixtures/casos.ts";
import { generarProvisional } from "./fixtures/generadorProvisional.ts";

/** El saldo de S2 con un error plantado: se olvidan las NC (el saldo de una factura no baja por sus notas de crédito). */
const saldosSinNotasDeCredito: ProveedorDeSaldos = (datos, corte) =>
  saldosAlCorte(datos, corte).map((s) => {
    const acreditado = datos.comprobantes.filter((c) => c.tipo === 3 && c.asociadoA === s.comprobante.id && c.emision <= corte).map((c) => c.total);
    return { ...s, saldo: sumar(s.saldo, ...acreditado) };
  });

interface Caso {
  nombre: string;
  datos: Datos;
  corte: string;
}

/** Los casos: el fixture T12 y un conjunto del generador provisional con un corte donde el tramo 31–60 tiene partidas y hay una NC aplicada. */
function casos(): Caso[] {
  const t12 = fixtureT12().datos;
  const lista: Caso[] = [{ nombre: "T12 al 31/10", datos: t12, corte: "2026-10-31" }];
  for (const semilla of [20261118, 20261119, 20261120]) {
    const datos = generarProvisional(semilla).datos;
    const corte = cierresDeMes(datos)
      .slice()
      .reverse()
      .find((k) => medida(datos, k, "tramo-31-60").partidas.length > 0 && datos.comprobantes.some((c) => c.tipo === 3 && c.emision <= k));
    if (corte === undefined) throw new Error(`La semilla ${semilla} no tiene un corte con tramo 31–60 y una NC: el generador provisional cambió.`);
    lista.push({ nombre: `provisional ${semilla} al ${corte}`, datos, corte });
  }
  return lista;
}

describe("D2 (a): 1 centavo de más en una partida del tramo 31–60 hace fallar controlar", () => {
  for (const c of casos()) {
    it(`D2 (a): ${c.nombre}`, () => {
      const m = medida(c.datos, c.corte, "tramo-31-60");
      expect(() => controlar(m)).not.toThrow(); // antes de la mutación cierra
      const [primera, ...resto] = m.partidas;
      if (primera === undefined) throw new Error("sin partidas");
      const rota: Medida = { ...m, partidas: [{ ...primera, importe: sumar(primera.importe, centavos(1)) }, ...resto] };
      expect(() => controlar(rota)).toThrow(ErrorDeCierre);
      try {
        controlar(rota);
      } catch (e) {
        expect((e as ErrorDeCierre).clave).toBe("tramo-31-60");
        expect((e as ErrorDeCierre).diferencia).toBe(-1);
      }
    });
  }
});

describe("D2 (b): 1 centavo de más en el valor de ese tramo hace fallar controlar y los controles cruzados X1 y X2", () => {
  for (const c of casos()) {
    it(`D2 (b): ${c.nombre}`, () => {
      const m = medida(c.datos, c.corte, "tramo-31-60");
      const rota: Medida = { ...m, valor: sumar(m.valor, centavos(1)) };
      expect(() => controlar(rota)).toThrow(ErrorDeCierre);
      expect(controlesCruzados(c.datos, c.corte, valoresDe(c.datos, c.corte))).toEqual([]); // sin la mutación todo cierra
      const fallos = controlesCruzados(c.datos, c.corte, alterando(valoresDe(c.datos, c.corte), (clave, f) => clave === "tramo-31-60" && f.clienteId === undefined));
      const quienes = new Set(fallos.map((f) => f.control));
      expect(quienes.has("X1"), "X1").toBe(true);
      expect(quienes.has("X2"), "X2").toBe(true);
    });
  }
});

describe("D2 (c): un saldo mal calculado en S2 (se olvidan las NC) sin tocar la agregación hace fallar controlar", () => {
  for (const c of casos().slice(1)) {
    it(`D2 (c): ${c.nombre}: el saldo roto no cierra con la agregación`, () => {
      const buena = medida(c.datos, c.corte, "saldo");
      expect(() => controlar(buena)).not.toThrow();
      const rota = medida(c.datos, c.corte, "saldo", {}, { saldos: saldosSinNotasDeCredito });
      expect(rota.valor).toBe(buena.valor); // la agregación no se tocó
      expect(() => controlar(rota)).toThrow(ErrorDeCierre);
    });
  }

  it("D2 (c): T01 al 31/05, el caso más chico: la NC cancela la factura y el saldo roto la deja en 605.000,00 contra 0 de la agregación", () => {
    const a = fixtureT01();
    const buena = medida(a.datos, "2026-05-31", "saldo");
    expect([buena.valor, buena.partidas.length]).toEqual([0, 0]);
    const rota = medida(a.datos, "2026-05-31", "saldo", {}, { saldos: saldosSinNotasDeCredito });
    expect(rota.valor).toBe(0);
    expect(rota.partidas.map((p) => p.importe)).toEqual([60_500_000]);
    let capturado: unknown;
    try {
      controlar(rota);
    } catch (e) {
      capturado = e;
    }
    expect(capturado).toBeInstanceOf(ErrorDeCierre);
    expect((capturado as ErrorDeCierre).valor).toBe(0);
    expect((capturado as ErrorDeCierre).suma).toBe(60_500_000);
  });

  it("D2 (c): el saldo roto también deja de cerrar en la mora y en los tramos (cada medida de saldo se lo cuestiona)", () => {
    const a = fixtureT17();
    for (const clave of ["saldo", "mora", "tramo-mas-90", "saldo-neto"] as const) {
      const rota = medida(a.datos, "2026-10-31", clave, {}, { saldos: saldosSinNotasDeCredito });
      expect(() => controlar(rota), clave).toThrow(ErrorDeCierre);
    }
  });
});

describe("D2: un dato dañado a mano (una NC mayor que el saldo de su factura) lo nombran el validador y controlar", () => {
  it("G5 y D2: T17 con la NC de 2.420.000,00 contra una factura de 1.089.000,00", () => {
    const a = fixtureT17();
    const idNc = a.id("T17-NC");
    const dañado: Datos = { ...a.datos, comprobantes: a.datos.comprobantes.map((c) => (c.id === idNc ? { ...c, neto: pesos(2_000_000), iva: pesos(420_000), total: pesos(2_420_000) } : c)) };
    expect(validarDatos(dañado).some((p) => p.regla === "C3" && p.dato === idNc)).toBe(true);
    expect(() => controlar(medida(dañado, "2026-10-31", "saldo"))).toThrow(ErrorDeCierre);
  });
});
