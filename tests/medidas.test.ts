// El catálogo de medidas (docs/diseno.md, 4.2 y 4.3): D1 (cada cifra es una medida con valor, base, fórmula y partidas), M5 (rotulado de la base),
// los filtros, los doce meses, `controlar` y `ErrorDeCierre` (D2) y la tabla «Por cliente» con la guarda del porcentaje.
import { describe, expect, it } from "vitest";
import { CLAVES_DEL_CATALOGO, TODAS_LAS_CLAVES } from "../src/lib/dominio/claves.ts";
import { formatearImporte, formatearPorcentaje, porcentajes, sumarLista } from "../src/lib/dominio/dinero.ts";
import { CATALOGO, ErrorDeCierre, clavesExistentes, controlar, docesMeses, medida, medidaControlada, porCliente } from "../src/lib/dominio/medidas.ts";
import type { ClaveDeMedida, FiltroDeMedida, Medida } from "../src/lib/dominio/tipos.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { ESPERADOS } from "./fixtures/esperados.ts";
import { fixtureOtros, fixtureT11, fixtureT12, fixtureT17 } from "./fixtures/casos.ts";
import { MENOS, NB } from "./fixtures/formato.ts";
import { saldosAlCorte } from "../src/lib/dominio/corte.ts";
import type { ProveedorDeSaldos } from "../src/lib/dominio/partidas.ts";

describe("M5: rotulado de la base de cada medida del catálogo (16 claves)", () => {
  it("M5: el catálogo tiene las 16 claves, ni una más ni una menos", () => {
    expect(Object.keys(CATALOGO).sort()).toEqual([...TODAS_LAS_CLAVES].sort());
    expect(TODAS_LAS_CLAVES).toHaveLength(16);
    expect(CLAVES_DEL_CATALOGO).toHaveLength(15);
  });

  it("M5: facturacion-mes → sin-iva; iva-mes → iva; las otras 14 (incluidas facturado-con-iva-mes y mora-otros) → con-iva", () => {
    expect(CATALOGO["facturacion-mes"].base).toBe("sin-iva");
    expect(CATALOGO["iva-mes"].base).toBe("iva");
    const otras = TODAS_LAS_CLAVES.filter((c) => c !== "facturacion-mes" && c !== "iva-mes");
    expect(otras).toHaveLength(14);
    for (const c of otras) expect(CATALOGO[c].base, c).toBe("con-iva");
    expect(CATALOGO["facturado-con-iva-mes"].base).toBe("con-iva");
    expect(CATALOGO["mora-otros"].base).toBe("con-iva");
  });

  it("M5: toda medida construida lleva la base de su clave, en la empresa y en un cliente", () => {
    const a = fixtureT12();
    for (const clave of CLAVES_DEL_CATALOGO) {
      expect(medida(a.datos, "2026-10-31", clave).base, clave).toBe(CATALOGO[clave].base);
      expect(medida(a.datos, "2026-10-31", clave, { clienteId: "C05" }).base, clave).toBe(CATALOGO[clave].base);
    }
  });
});

describe("D1: cada clave del catálogo tiene su medida, por empresa y por cliente", () => {
  it("D1: las 15 claves se construyen para la empresa y para cada uno de los 13 clientes, con título, fórmula, valor y partidas", () => {
    const a = fixtureT17();
    for (const clave of CLAVES_DEL_CATALOGO) {
      const filtros: FiltroDeMedida[] = [{}, ...a.datos.clientes.map((c) => ({ clienteId: c.id }))];
      for (const filtro of filtros) {
        const m = medida(a.datos, "2026-10-31", clave, filtro);
        expect(m.clave).toBe(clave);
        expect(m.titulo.length).toBeGreaterThan(0);
        expect(m.formula.length).toBeGreaterThan(0);
        expect(Array.isArray(m.partidas)).toBe(true);
        expect(typeof m.valor).toBe("number");
        expect(m.filtro.clienteId).toBe(filtro.clienteId);
      }
    }
  });

  it("D1 (T12): mora al 31/10 → 6 partidas, suma 223.850.000 centavos, agrupadas en 4 clientes", () => {
    const m = medida(fixtureT12().datos, "2026-10-31", "mora");
    expect(m.partidas).toHaveLength(6);
    expect(sumarLista(m.partidas.map((p) => p.importe))).toBe(223_850_000);
    expect(m.valor).toBe(223_850_000);
    expect(porCliente(m, fixtureT12().datos)).toHaveLength(4);
    expect(() => controlar(m)).not.toThrow();
  });

  it("D1: la fórmula de la mora es la frase del diseño, con la fecha del corte", () => {
    expect(medida(fixtureT12().datos, "2026-10-31", "mora").formula).toBe("Suma del saldo de los comprobantes con 1 día de atraso o más al 31/10/2026.");
  });

  it("D1/D2: contra todos los números escritos a mano, el valor y la suma de las partidas de la medida construida coinciden y controlar no lanza", () => {
    for (const x of ESPERADOS) {
      const m = medida(x.armar().datos, x.corte, x.clave, x.filtro ?? {});
      expect(m.valor, x.nombre).toBe(x.valor);
      expect(sumarLista(m.partidas.map((p) => p.importe)), x.nombre).toBe(x.valor);
      expect(() => controlar(m), x.nombre).not.toThrow();
    }
  });

  it("D1: clavesExistentes da 15 claves, y 16 (con mora-otros) solo con más de 5 deudores", () => {
    expect(clavesExistentes(fixtureT12().datos, "2026-10-31")).toEqual([...CLAVES_DEL_CATALOGO]);
    expect(clavesExistentes(fixtureOtros(5).datos, "2026-10-31")).toHaveLength(15);
    expect(clavesExistentes(fixtureOtros(6).datos, "2026-10-31")).toEqual([...CLAVES_DEL_CATALOGO, "mora-otros"]);
  });

  it("M4: mora-otros con siete deudores es una medida más (60.500,00 en 2 partidas, base con IVA); con 5 la clave es inexistente", () => {
    const m = medida(fixtureOtros().datos, "2026-10-31", "mora-otros");
    expect([m.valor, m.partidas.length, m.base]).toEqual([60_500_000, 2, "con-iva"]);
    expect(() => controlar(m)).not.toThrow();
    expect(() => medida(fixtureT12().datos, "2026-10-31", "mora-otros")).toThrow(/mora-otros/);
  });
});

describe("4.3: los filtros cliente y mes, validados", () => {
  const datos = fixtureT12().datos; // desde 2025-01-01

  it("4.3: un cliente que no existe o una clave inexistente lanzan, nombrándolos", () => {
    expect(() => medida(datos, "2026-10-31", "saldo", { clienteId: "C99" })).toThrow(/C99/);
    expect(() => medida(datos, "2026-10-31", "inexistente" as ClaveDeMedida)).toThrow(/inexistente/);
  });

  it("4.3: un corte que no es una fecha civil válida lanza", () => {
    expect(() => medida(datos, "2026-02-30", "saldo")).toThrow(/corte/);
  });

  it.each(["2026-13", "2026-00", "2026-9", "abc", "", "2026-10-31", "2024-12", "2026-11", "2027-01"])("4.3: mes=%s no es válido (formato, antes de desde o después del mes del corte) y lanza", (mes) => {
    expect(() => medida(datos, "2026-10-31", "facturacion-mes", { mes })).toThrow(/mes/);
  });

  it("4.3: un mes entre el de desde (2025-01) y el del corte, ambos incluidos, es válido", () => {
    for (const mes of ["2025-01", "2026-09", "2026-10"]) expect(medida(datos, "2026-10-31", "facturacion-mes", { mes }).filtro.mes).toBe(mes);
  });

  it("4.3 (S7): sin mes, las medidas del mes usan el mes del corte, y el filtro lo dice", () => {
    expect(medida(datos, "2026-09-30", "facturacion-mes").filtro.mes).toBe("2026-09");
    expect(medida(datos, "2026-09-30", "cobranza-mes", { clienteId: "C05" }).filtro).toEqual({ clienteId: "C05", mes: "2026-09" });
  });

  it("S7: sin mes, un corte anterior al primer mes de los datos es una fecha válida: la medida del mes da 0 y el filtro dice el mes del corte", () => {
    const m = medida(datos, "2024-06-30", "facturacion-mes");
    expect(m.valor).toBe(0);
    expect(m.partidas).toEqual([]);
    expect(m.filtro.mes).toBe("2024-06");
    expect(medida(datos, "2024-06-30", "saldo").valor).toBe(0);
    expect(medida(datos, "2026-11-03", "facturacion-mes").valor).toBe(0); // y uno posterior al calendario, igual
  });

  it("con un mes explícito y un corte anterior al primer mes de los datos, el error lo dice en llano (no «entre 2025-01 y 2024-06»)", () => {
    expect(() => medida(datos, "2024-06-30", "facturacion-mes", { mes: "2024-06" })).toThrow(/anterior al primer mes/);
    expect(() => medida(datos, "2026-10-31", "facturacion-mes", { mes: "2027-01" })).toThrow(/entre 2025-01 y 2026-10/);
  });

  it("4.3: en una medida que no es del mes, el mes se descarta sin error ni efecto", () => {
    const con = medida(datos, "2026-10-31", "saldo", { mes: "cualquier cosa" });
    const sin = medida(datos, "2026-10-31", "saldo");
    expect(con.filtro).toEqual({});
    expect(con.valor).toBe(sin.valor);
    expect(con.partidas).toEqual(sin.partidas);
  });

  it("4.3 (S7): con mes=2026-09 y corte 2026-10-31 la facturación es la del mes completo de septiembre; la fórmula nombra el mes", () => {
    const m = medida(datos, "2026-10-31", "facturacion-mes", { mes: "2026-09" });
    expect(m.valor).toBe(45_000_000);
    expect(m.formula).toContain("septiembre de 2026");
  });
});

describe("4.3: doce meses que terminan en el del corte", () => {
  it("4.3: con el corte 2026-10-31 → de 2025-11 a 2026-10 (12 meses, cruzando el año)", () => {
    expect(docesMeses("2026-10-31", "2025-01-01")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
  });

  it("4.3: con menos de un año de datos son menos meses (no empiezan antes de desde): corte 2025-03-31 → 2025-01, 2025-02, 2025-03; corte 2025-01-31 → 2025-01", () => {
    expect(docesMeses("2025-03-31", "2025-01-01")).toEqual(["2025-01", "2025-02", "2025-03"]);
    expect(docesMeses("2025-01-31", "2025-01-01")).toEqual(["2025-01"]);
  });

  it("4.3: justo 12 meses: corte 2025-12-31 → de 2025-01 a 2025-12; y corte 2026-01-31 → de 2025-02 a 2026-01", () => {
    const a = docesMeses("2025-12-31", "2025-01-01");
    expect([a.length, a[0], a[11]]).toEqual([12, "2025-01", "2025-12"]);
    const b = docesMeses("2026-01-31", "2025-01-01");
    expect([b.length, b[0], b[11]]).toEqual([12, "2025-02", "2026-01"]);
  });

  it("4.3: el corte puede ser cualquier día del mes", () => {
    expect(docesMeses("2026-05-15", "2025-01-01").at(-1)).toBe("2026-05");
  });
});

describe("D2: controlar compara el valor (agregación) con la suma de las partidas (listado) y lanza ErrorDeCierre si difieren", () => {
  const medidaT12 = (): Medida => medida(fixtureT12().datos, "2026-10-31", "tramo-31-60");

  it("D2: una medida que cierra no lanza", () => {
    expect(() => controlar(medidaT12())).not.toThrow();
  });

  it("D2: 1 centavo de más en una partida lanza ErrorDeCierre con la clave, los dos valores y la diferencia", () => {
    const m = medidaT12();
    const [p, ...resto] = m.partidas;
    if (p === undefined) throw new Error("falta una partida");
    const rota: Medida = { ...m, partidas: [{ ...p, importe: (p.importe + 1) as typeof p.importe }, ...resto] };
    let capturado: unknown;
    try {
      controlar(rota);
    } catch (e) {
      capturado = e;
    }
    expect(capturado).toBeInstanceOf(ErrorDeCierre);
    expect(capturado).toBeInstanceOf(Error);
    const e = capturado as ErrorDeCierre;
    expect(e.clave).toBe("tramo-31-60");
    expect(e.valor).toBe(66_550_000);
    expect(e.suma).toBe(66_550_001);
    expect(e.diferencia).toBe(-1);
    expect(e.message).toContain("tramo-31-60");
    expect(e.name).toBe("ErrorDeCierre");
    // La descripción es lo único que la pantalla muestra del error: dice qué no cierra, sin ningún importe (el mensaje sí los trae).
    expect(e.descripcion).toBe("la medida «tramo-31-60» y la suma de sus partidas");
    expect(e.message).toContain(formatearImporte(e.valor));
    expect(e.descripcion).not.toContain(formatearImporte(e.valor));
    expect(e.descripcion).not.toContain(formatearImporte(e.suma));
  });

  it("D2: 1 centavo de más en el valor también lanza (la diferencia sale con signo)", () => {
    const m = medidaT12();
    const rota: Medida = { ...m, valor: (m.valor + 1) as typeof m.valor };
    expect(() => controlar(rota)).toThrow(ErrorDeCierre);
    try {
      controlar(rota);
    } catch (e) {
      expect((e as ErrorDeCierre).diferencia).toBe(1);
    }
  });

  it("D2: una medida sin partidas y con valor 0 cierra; con valor distinto de 0 lanza", () => {
    const vacia = medida(fixtureT12().datos, "2026-10-31", "pagos-a-cuenta");
    expect(vacia.partidas).toEqual([]);
    expect(() => controlar(vacia)).not.toThrow();
    expect(() => controlar({ ...vacia, valor: 1 as typeof vacia.valor })).toThrow(ErrorDeCierre);
  });

  it("D2 (dato dañado): una NC mayor que el saldo de su factura → controlar lo nombra (el saldo por agregación queda negativo)", () => {
    const a = fixtureT17();
    const idNc = a.id("T17-NC");
    const dañado = { ...a.datos, comprobantes: a.datos.comprobantes.map((c) => (c.id === idNc ? { ...c, neto: pesos(2_000_000), iva: pesos(420_000), total: pesos(2_420_000) } : c)) };
    expect(() => controlar(medida(dañado, "2026-10-31", "saldo"))).toThrow(ErrorDeCierre);
  });
});

describe("D2: medidaControlada es la única puerta para la interfaz: medida + controlar, sin número sin control", () => {
  it("D2: con datos que cierran devuelve la medida entera", () => {
    const a = fixtureT12();
    expect(medidaControlada(a.datos, "2026-10-31", "mora")).toEqual(medida(a.datos, "2026-10-31", "mora"));
    expect(medidaControlada(a.datos, "2026-10-31", "saldo", { clienteId: "C05" }).valor).toBe(96_800_000);
  });

  it("D2: si los dos caminos no coinciden lanza ErrorDeCierre y no devuelve ninguna medida (un saldo roto plantado en el camino por listado)", () => {
    const sinNotas: ProveedorDeSaldos = (datos, corte) => saldosAlCorte(datos, corte).map((s) => ({ ...s, saldo: (s.saldo + 1) as typeof s.saldo }));
    expect(() => medidaControlada(fixtureT12().datos, "2026-10-31", "saldo", {}, { saldos: sinNotas })).toThrow(ErrorDeCierre);
  });

  it("4.3: los errores de filtro siguen siendo los de medida() (cliente inexistente)", () => {
    expect(() => medidaControlada(fixtureT12().datos, "2026-10-31", "saldo", { clienteId: "C99" })).toThrow(/C99/);
  });
});

describe("D2: el mensaje del error usa un solo formato de importes", () => {
  it("D2: la diferencia sale con el formato de M1 (menos tipográfico, $, espacio duro), no en centavos crudos", () => {
    const m = medida(fixtureT12().datos, "2026-10-31", "tramo-31-60");
    const [p, ...resto] = m.partidas;
    if (p === undefined) throw new Error("falta una partida");
    const rota: Medida = { ...m, partidas: [{ ...p, importe: (p.importe + 1) as typeof p.importe }, ...resto] };
    let mensaje = "";
    try {
      controlar(rota);
    } catch (e) {
      mensaje = (e as Error).message;
    }
    expect(mensaje).toContain(`diferencia de ${MENOS}$${NB}0,01`);
    expect(mensaje).not.toMatch(/centavos/);
  });
});

describe("4.3 y M3: «Por cliente» agrupa las partidas, ordena y calcula el porcentaje solo si todos los subtotales son ≥ 0", () => {
  it("4.3 (T12): la mora por cliente → C05 968.000,00 (2) · C07 726.000,00 (2) · C11 363.000,00 · C03 181.500,00, y los porcentajes suman 100,0", () => {
    const a = fixtureT12();
    const filas = porCliente(medida(a.datos, "2026-10-31", "mora"), a.datos);
    expect(filas.map((f) => [f.clienteId, f.cantidad, f.subtotal])).toEqual([
      ["C05", 2, 96_800_000],
      ["C07", 2, 72_600_000],
      ["C11", 1, 36_300_000],
      ["C03", 1, 18_150_000],
    ]);
    expect(filas.map((f) => f.razonSocial)).toEqual(["Contratista Los Algarrobos Demo S.A.", "Montajes Sierra Chica Demo S.R.L.", "Camiones del Norte Demo S.A.", "Minera Cordón Azul Demo S.A."]);
    // 43,2 + 32,4 + 16,2 + 8,1 = 99,9: la milésima que falta va al mayor resto (C05)
    expect(filas.map((f) => f.milesimas)).toEqual([433, 324, 162, 81]);
    expect(filas.reduce((s, f) => s + (f.milesimas ?? 0), 0)).toBe(1000);
    expect(formatearPorcentaje(filas[0]?.milesimas ?? null)).toBe(`43,3${NB}%`);
  });

  it("M3 (T11): tres clientes con 363.000,00 en el tramo 61–90 → el empate se ordena por razón social: Camiones (C11) 33,4 · Contratista (C05) 33,3 · Servicios (C10) 33,3", () => {
    const a = fixtureT11();
    const filas = porCliente(medida(a.datos, "2026-10-31", "tramo-61-90"), a.datos);
    expect(filas.map((f) => f.clienteId)).toEqual(["C11", "C05", "C10"]);
    expect(filas.map((f) => f.milesimas)).toEqual([334, 333, 333]);
  });

  it("T09: si algún subtotal es negativo, el porcentaje es «—» (null) en todas las filas y no lanza", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "T09-F", cliente: "C06", emision: "2026-06-10", neto: pesos(800_000) },
        { clave: "T09-NC", tipo: 3, cliente: "C06", emision: "2026-07-14", neto: pesos(800_000), asociadoA: "T09-F" },
        { clave: "T09-F2", cliente: "C06", emision: "2026-07-03", neto: pesos(300_000) },
        { clave: "C04-F", cliente: "C04", emision: "2026-07-05", neto: pesos(100_000) },
      ],
    });
    const m = medida(a.datos, "2026-07-31", "facturacion-mes");
    expect(m.valor).toBe(-40_000_000);
    const filas = porCliente(m, a.datos);
    expect(filas.map((f) => [f.clienteId, f.subtotal])).toEqual([["C04", 10_000_000], ["C06", -50_000_000]]);
    expect(filas.map((f) => f.milesimas)).toEqual([null, null]);
  });

  it("con el valor positivo pero un cliente en negativo (900.000,00 y −500.000,00) también es «—» en todas las filas, sin lanzar", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "F", cliente: "C06", emision: "2026-06-10", neto: pesos(800_000) },
        { clave: "NC", tipo: 3, cliente: "C06", emision: "2026-07-14", neto: pesos(800_000), asociadoA: "F" },
        { clave: "F2", cliente: "C06", emision: "2026-07-03", neto: pesos(300_000) },
        { clave: "G", cliente: "C04", emision: "2026-07-05", neto: pesos(900_000) },
      ],
    });
    const m = medida(a.datos, "2026-07-31", "facturacion-mes");
    expect(m.valor).toBe(40_000_000);
    const filas = porCliente(m, a.datos);
    expect(filas.map((f) => f.subtotal)).toEqual([90_000_000, -50_000_000]);
    expect(filas.map((f) => f.milesimas)).toEqual([null, null]);
  });

  it("con todos los subtotales ≥ 0 y valor > 0 hay porcentaje en cada fila; un subtotal 0 convive con los demás", () => {
    const a = fixtureT12();
    const filas = porCliente(medida(a.datos, "2026-10-31", "saldo"), a.datos);
    expect(filas.every((f) => f.milesimas !== null)).toBe(true);
    expect(filas.reduce((s, f) => s + (f.milesimas ?? 0), 0)).toBe(1000);
    const ps = porcentajes(filas.map((f) => ({ nombre: f.razonSocial, importe: f.subtotal })));
    expect(filas.map((f) => f.milesimas)).toEqual(ps);
  });

  it("un subtotal 0 (una factura y su NC total en el mes) NO es negativo: con otro cliente en 100.000,00 hay porcentaje en cada fila (0 y 100,0)", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "T01-F", cliente: "C06", emision: "2026-05-12", neto: pesos(500_000) },
        { clave: "T01-NC", tipo: 3, cliente: "C06", emision: "2026-05-20", neto: pesos(500_000), asociadoA: "T01-F" },
        { clave: "C04-F", cliente: "C04", emision: "2026-05-05", neto: pesos(100_000) },
      ],
    });
    const m = medida(a.datos, "2026-05-31", "facturacion-mes");
    expect(m.valor).toBe(10_000_000);
    const filas = porCliente(m, a.datos);
    expect(filas.map((f) => [f.clienteId, f.subtotal])).toEqual([["C04", 10_000_000], ["C06", 0]]);
    expect(filas.map((f) => f.milesimas)).toEqual([1000, 0]);
  });

  it("4.3: una partida de un cliente que no está en los datos es un dato dañado: lanza nombrándolo, no inventa un nombre", () => {
    const a = fixtureT12();
    const m = medida(a.datos, "2026-10-31", "mora");
    const [p, ...resto] = m.partidas;
    if (p === undefined) throw new Error("falta una partida");
    expect(() => porCliente({ ...m, partidas: [{ ...p, clienteId: "C99" }, ...resto] }, a.datos)).toThrow(/C99/);
  });

  it("4.3: sin partidas no hay filas", () => {
    const a = fixtureT12();
    expect(porCliente(medida(a.datos, "2026-10-31", "pagos-a-cuenta"), a.datos)).toEqual([]);
  });

  it("4.3: una medida de un solo cliente trae una sola fila con todo el porcentaje (100,0)", () => {
    const a = fixtureT12();
    const filas = porCliente(medida(a.datos, "2026-10-31", "mora", { clienteId: "C07" }), a.datos);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ clienteId: "C07", cantidad: 2, subtotal: 72_600_000, milesimas: 1000 });
  });

  it("4.3: el empate de subtotal se desempata por razón social (es-AR)", () => {
    const a = armarDatos({
      comprobantes: [
        { clave: "A", cliente: "C10", emision: "2026-08-01", neto: pesos(100_000) },
        { clave: "B", cliente: "C03", emision: "2026-08-01", neto: pesos(100_000) },
        { clave: "C", cliente: "C11", emision: "2026-08-01", neto: pesos(100_000) },
      ],
    });
    expect(porCliente(medida(a.datos, "2026-10-31", "saldo"), a.datos).map((f) => f.clienteId)).toEqual(["C11", "C03", "C10"]);
  });
});
