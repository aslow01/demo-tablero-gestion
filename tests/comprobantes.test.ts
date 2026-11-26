// Comprobantes (docs/diseno.md, sección 6.2): C1 (signo), C4 (vencimiento) y C5 (facturación del mes). Cada test lleva el identificador de la regla.
// Acá los comprobantes se escriben a mano, sin armarDatos; los fixtures completos de 5.5 se prueban en tests/fixtures.test.ts.
import { describe, expect, it } from "vitest";
import {
  clientesQueFacturaron,
  comprobantesDelMes,
  facturacionDelMes,
  idComprobante,
  idRecibo,
  importeFirmado,
  leerIdRecibo,
  mesDeEmision,
  numerarComprobantes,
  numerarRecibos,
  vencimientoDe,
} from "../src/lib/dominio/comprobantes.ts";
import { calcularIva, centavos, formatearImporte, sumar, sumarLista } from "../src/lib/dominio/dinero.ts";
import type { BorradorDeComprobante, BorradorDeRecibo } from "../src/lib/dominio/comprobantes.ts";
import type { Cliente, Comprobante, TipoCmp } from "../src/lib/dominio/tipos.ts";
import { pesos } from "./fixtures/armarDatos.ts";
import { MENOS, NB } from "./fixtures/formato.ts";


let siguiente = 0;
/** Un comprobante armado a mano: IVA y total con M2, vencimiento con C4 (plazo 30 salvo que se diga otro). */
function cmp(o: { tipo?: TipoCmp; cliente: string; emision: string; neto: number; plazo?: number; asociadoA?: string | null }): Comprobante {
  const tipo = o.tipo ?? 1;
  const neto = pesos(o.neto);
  const iva = calcularIva(neto);
  siguiente += 1;
  return {
    id: idComprobante(tipo, 3, siguiente),
    tipo,
    puntoVenta: 3,
    numero: siguiente,
    clienteId: o.cliente,
    emision: o.emision,
    vencimiento: vencimientoDe(tipo, o.emision, o.plazo ?? 30),
    servicio: "alquiler-4x4",
    neto,
    iva,
    total: sumar(neto, iva),
    asociadoA: o.asociadoA ?? null,
  };
}

describe("C2 (formato): el id es tipo-PV-número", () => {
  it("C2: la factura 123 del punto de venta 3 es 1-0003-00000123", () => {
    expect(idComprobante(1, 3, 123)).toBe("1-0003-00000123");
    expect(idComprobante(2, 3, 1)).toBe("2-0003-00000001");
    expect(idComprobante(3, 12, 99_999_999)).toBe("3-0012-99999999");
  });

  it("C2: el recibo 45 del punto de venta 3 es R-0003-00000045", () => {
    expect(idRecibo(3, 45)).toBe("R-0003-00000045");
  });

  it("C2: un punto de venta o un número fuera del formato lanza", () => {
    expect(() => idComprobante(1, 0, 1)).toThrow(/punto de venta/i);
    expect(() => idComprobante(1, 10_000, 1)).toThrow(/punto de venta/i);
    expect(() => idComprobante(1, 3, 0)).toThrow(/número/i);
    expect(() => idComprobante(1, 3, 100_000_000)).toThrow(/número/i);
    expect(() => idComprobante(1, 3, 1.5)).toThrow(/número/i);
    expect(() => idRecibo(3, 0)).toThrow(/número/i);
  });
});

describe("C1: factura y nota de débito suman, la nota de crédito resta", () => {
  it("C1: el importe firmado de una factura y de una ND es positivo y el de una NC es negativo (neto, IVA y total)", () => {
    const f = cmp({ cliente: "C06", emision: "2026-05-12", neto: 500_000 });
    const nd = cmp({ tipo: 2, cliente: "C06", emision: "2026-05-13", neto: 24_000, asociadoA: f.id });
    const nc = cmp({ tipo: 3, cliente: "C06", emision: "2026-05-20", neto: 500_000, asociadoA: f.id });
    expect(importeFirmado(f, "neto")).toBe(pesos(500_000));
    expect(importeFirmado(f, "iva")).toBe(pesos(105_000));
    expect(importeFirmado(f, "total")).toBe(pesos(605_000));
    expect(importeFirmado(nd, "neto")).toBe(pesos(24_000));
    expect(importeFirmado(nc, "neto")).toBe(pesos(-500_000));
    expect(importeFirmado(nc, "iva")).toBe(pesos(-105_000));
    expect(importeFirmado(nc, "total")).toBe(pesos(-605_000));
  });

  it("C1 (T01): la facturación de mayo con el par factura + NC es igual a la de mayo sin el par", () => {
    const f = cmp({ cliente: "C06", emision: "2026-05-12", neto: 500_000, plazo: 45 });
    const nc = cmp({ tipo: 3, cliente: "C06", emision: "2026-05-20", neto: 500_000, asociadoA: f.id });
    const otra = cmp({ cliente: "C06", emision: "2026-05-30", neto: 80_000, plazo: 45 });
    const conElPar = facturacionDelMes([f, nc, otra], "2026-05");
    const sinElPar = facturacionDelMes([otra], "2026-05");
    expect(conElPar).toBe(sinElPar);
    expect(facturacionDelMes([f, nc], "2026-05")).toBe(pesos(0)); // 500.000,00 − 500.000,00
  });

  it("C1 (T16): la ND suma 24.000,00 a la facturación de abril y vence el 02/05", () => {
    const f = cmp({ cliente: "C13", emision: "2026-03-10", neto: 600_000 });
    const nd = cmp({ tipo: 2, cliente: "C13", emision: "2026-04-02", neto: 24_000, asociadoA: f.id });
    expect(facturacionDelMes([f, nd], "2026-04")).toBe(pesos(24_000));
    expect(facturacionDelMes([f, nd], "2026-03")).toBe(pesos(600_000));
    expect(nd.vencimiento).toBe("2026-05-02");
    expect(nd.total).toBe(centavos(2_904_000)); // 29.040,00
  });
});

describe("C4: vencimiento = emisión + plazo, en días corridos", () => {
  it("C4: 2026-01-30 + 30 → 2026-03-01", () => {
    expect(vencimientoDe(1, "2026-01-30", 30)).toBe("2026-03-01");
  });

  it("C4: 2025-12-15 + 45 → 2026-01-29 (cruza el año)", () => {
    expect(vencimientoDe(1, "2025-12-15", 45)).toBe("2026-01-29");
  });

  it("C4: 2026-08-31 + 30 → 2026-09-30", () => {
    expect(vencimientoDe(1, "2026-08-31", 30)).toBe("2026-09-30");
  });

  it("C4 (T04): 2026-09-16 + 45 → 2026-10-31", () => {
    expect(vencimientoDe(1, "2026-09-16", 45)).toBe("2026-10-31");
  });

  it("C4: no se corre por fines de semana ni feriados (el 2026-10-31 es sábado y vence ese día)", () => {
    expect(vencimientoDe(1, "2026-10-01", 30)).toBe("2026-10-31");
  });

  it("C4: en una NC el vencimiento es la emisión, sin plazo", () => {
    expect(vencimientoDe(3, "2026-07-20", 30)).toBe("2026-07-20");
    expect(vencimientoDe(3, "2026-07-20", 60)).toBe("2026-07-20");
  });

  it("C4: una ND tiene su propio vencimiento: emisión + plazo del cliente", () => {
    expect(vencimientoDe(2, "2026-04-02", 30)).toBe("2026-05-02");
  });

  it("C4: un plazo que no es entero, o es negativo, lanza", () => {
    expect(() => vencimientoDe(1, "2026-01-01", 1.5)).toThrow(/plazo/);
    expect(() => vencimientoDe(1, "2026-01-01", -1)).toThrow(/plazo/);
  });
});

describe("C5: la facturación del mes es el neto firmado por fecha de emisión", () => {
  it("C5: el mes de un comprobante es el de su emisión, no el de su vencimiento", () => {
    const f = cmp({ cliente: "C12", emision: "2025-12-31", neto: 100_000, plazo: 45 });
    expect(mesDeEmision(f)).toBe("2025-12");
    expect(f.vencimiento.slice(0, 7)).toBe("2026-02");
  });

  it("C5 (T09): la facturación de C06 en julio es 300.000,00 − 800.000,00 = −500.000,00 y se muestra con signo, sin recortar a 0", () => {
    const f = cmp({ cliente: "C06", emision: "2026-06-10", neto: 800_000, plazo: 45 });
    const f2 = cmp({ cliente: "C06", emision: "2026-07-03", neto: 300_000, plazo: 45 });
    const nc = cmp({ tipo: 3, cliente: "C06", emision: "2026-07-14", neto: 800_000, asociadoA: f.id });
    const todos = [f, f2, nc];
    expect(facturacionDelMes(todos, "2026-07", "C06")).toBe(pesos(-500_000));
    expect(formatearImporte(facturacionDelMes(todos, "2026-07", "C06"))).toBe(`${MENOS}$${NB}500.000,00`);
    expect(facturacionDelMes(todos, "2026-06", "C06")).toBe(pesos(800_000));
  });

  it("C5 (T09): el facturado con IVA de julio (363.000,00 − 968.000,00 = −605.000,00) es el neto (−500.000,00) más el IVA (−105.000,00)", () => {
    const f = cmp({ cliente: "C06", emision: "2026-06-10", neto: 800_000 });
    const f2 = cmp({ cliente: "C06", emision: "2026-07-03", neto: 300_000 });
    const nc = cmp({ tipo: 3, cliente: "C06", emision: "2026-07-14", neto: 800_000, asociadoA: f.id });
    const julio = comprobantesDelMes([f, f2, nc], "2026-07");
    expect(sumarLista(julio.map((c) => importeFirmado(c, "total")))).toBe(pesos(-605_000));
    expect(sumarLista(julio.map((c) => importeFirmado(c, "neto")))).toBe(pesos(-500_000));
    expect(sumarLista(julio.map((c) => importeFirmado(c, "iva")))).toBe(pesos(-105_000));
  });

  it("C5 (T13): 2025-12-31 pertenece a diciembre de 2025 y 2026-01-01 a enero de 2026, y cada uno a ningún otro mes", () => {
    const f1 = cmp({ cliente: "C12", emision: "2025-12-31", neto: 100_000, plazo: 45 });
    const f2 = cmp({ cliente: "C12", emision: "2026-01-01", neto: 120_000, plazo: 45 });
    const meses: string[] = [];
    for (let anio = 2025; anio <= 2026; anio++) for (let mes = 1; mes <= 12; mes++) meses.push(`${anio}-${String(mes).padStart(2, "0")}`);
    const dondeEstaF1 = meses.filter((m) => comprobantesDelMes([f1, f2], m).includes(f1));
    const dondeEstaF2 = meses.filter((m) => comprobantesDelMes([f1, f2], m).includes(f2));
    expect(dondeEstaF1).toEqual(["2025-12"]);
    expect(dondeEstaF2).toEqual(["2026-01"]);
  });

  it("C5 (T13): el año 2025 (la suma de sus doce meses) incluye solo la primera factura", () => {
    const f1 = cmp({ cliente: "C12", emision: "2025-12-31", neto: 100_000, plazo: 45 });
    const f2 = cmp({ cliente: "C12", emision: "2026-01-01", neto: 120_000, plazo: 45 });
    const meses2025 = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, "0")}`);
    expect(sumarLista(meses2025.map((m) => facturacionDelMes([f1, f2], m)))).toBe(pesos(100_000));
  });

  it("C5: filtra por cliente y no mezcla los comprobantes de otros", () => {
    const a = cmp({ cliente: "C01", emision: "2026-03-05", neto: 100_000 });
    const b = cmp({ cliente: "C02", emision: "2026-03-06", neto: 40_000 });
    expect(facturacionDelMes([a, b], "2026-03", "C01")).toBe(pesos(100_000));
    expect(facturacionDelMes([a, b], "2026-03", "C02")).toBe(pesos(40_000));
    expect(facturacionDelMes([a, b], "2026-03")).toBe(pesos(140_000));
    expect(facturacionDelMes([a, b], "2026-03", "C03")).toBe(pesos(0));
  });

  it("C5: un cliente aparece en la facturación del mes si tiene al menos un comprobante emitido en él, aunque el neto firmado sea 0 o negativo", () => {
    const f = cmp({ cliente: "C06", emision: "2026-05-12", neto: 500_000 });
    const nc = cmp({ tipo: 3, cliente: "C06", emision: "2026-05-20", neto: 500_000, asociadoA: f.id });
    const otro = cmp({ cliente: "C01", emision: "2026-04-30", neto: 10_000 });
    expect(facturacionDelMes([f, nc], "2026-05", "C06")).toBe(pesos(0));
    expect(clientesQueFacturaron([f, nc, otro], "2026-05")).toEqual(["C06"]);
    expect(clientesQueFacturaron([f, nc, otro], "2026-04")).toEqual(["C01"]);
    expect(clientesQueFacturaron([f, nc, otro], "2026-06")).toEqual([]);
  });

  it("C5: los clientes salen sin repetir y ordenados por id", () => {
    const x = [cmp({ cliente: "C09", emision: "2026-02-01", neto: 1000 }), cmp({ cliente: "C02", emision: "2026-02-02", neto: 1000 }), cmp({ cliente: "C09", emision: "2026-02-03", neto: 1000 })];
    expect(clientesQueFacturaron(x, "2026-02")).toEqual(["C02", "C09"]);
  });

  it("C5: un mes mal escrito lanza en vez de dar 0 sin avisar", () => {
    expect(() => comprobantesDelMes([], "2026-13")).toThrow(/mes/);
    expect(() => comprobantesDelMes([], "2026-5")).toThrow(/mes/);
    expect(() => facturacionDelMes([], "hola")).toThrow(/mes/);
  });
});

describe("C2: numeración correlativa por tipo, en orden de emisión, con desempate fijo", () => {
  const CLIENTES: Pick<Cliente, "id" | "plazoDias">[] = [
    { id: "C01", plazoDias: 45 },
    { id: "C03", plazoDias: 30 },
    { id: "C08", plazoDias: 15 },
  ];
  const borrador = (o: Partial<BorradorDeComprobante> & { clave: string }): BorradorDeComprobante => ({
    tipo: 1,
    clienteId: "C03",
    emision: "2026-03-10",
    servicio: "alquiler-4x4",
    neto: pesos(100_000),
    asociadoA: null,
    ...o,
  });
  const idsEnOrden = (r: ReturnType<typeof numerarComprobantes>): string[] => r.comprobantes.map((c) => c.id);

  it("C2: cada tipo se numera por separado desde 1, sin saltos (facturas 1-0003-…, ND 2-0003-…, NC 3-0003-…)", () => {
    const r = numerarComprobantes(
      [
        borrador({ clave: "f1", emision: "2026-03-01" }),
        borrador({ clave: "nc", tipo: 3, emision: "2026-03-05", asociadoA: "f1" }),
        borrador({ clave: "f2", emision: "2026-03-09" }),
        borrador({ clave: "nd", tipo: 2, emision: "2026-03-12", asociadoA: "f1" }),
      ],
      CLIENTES,
      3,
    );
    expect(idsEnOrden(r)).toEqual(["1-0003-00000001", "3-0003-00000001", "1-0003-00000002", "2-0003-00000001"]);
  });

  it("C2: se numera en orden de emisión aunque lleguen desordenados, y la lista sale en el orden de numeración", () => {
    const r = numerarComprobantes(
      [borrador({ clave: "tarde", emision: "2026-03-20" }), borrador({ clave: "temprano", emision: "2026-03-02" }), borrador({ clave: "medio", emision: "2026-03-11" })],
      CLIENTES,
      3,
    );
    expect(r.idPorClave.get("temprano")).toBe("1-0003-00000001");
    expect(r.idPorClave.get("medio")).toBe("1-0003-00000002");
    expect(r.idPorClave.get("tarde")).toBe("1-0003-00000003");
    expect(r.comprobantes.map((c) => c.emision)).toEqual(["2026-03-02", "2026-03-11", "2026-03-20"]);
  });

  it("C2: misma fecha → por id de cliente: el de C01 lleva el número menor aunque llegue después", () => {
    const r = numerarComprobantes([borrador({ clave: "de-c03", clienteId: "C03" }), borrador({ clave: "de-c01", clienteId: "C01" })], CLIENTES, 3);
    expect(r.idPorClave.get("de-c01")).toBe("1-0003-00000001");
    expect(r.idPorClave.get("de-c03")).toBe("1-0003-00000002");
  });

  it("C2: misma fecha y mismo cliente → por orden de generación (el orden de entrada)", () => {
    const r = numerarComprobantes([borrador({ clave: "primero" }), borrador({ clave: "segundo" }), borrador({ clave: "tercero" })], CLIENTES, 3);
    expect(["primero", "segundo", "tercero"].map((k) => r.idPorClave.get(k))).toEqual(["1-0003-00000001", "1-0003-00000002", "1-0003-00000003"]);
  });

  it("C2: calcula IVA y total con M2 y el vencimiento con C4 (la NC vence el día de su emisión)", () => {
    const r = numerarComprobantes(
      [
        borrador({ clave: "f", clienteId: "C01", emision: "2026-09-16", neto: centavos(100050) }),
        borrador({ clave: "nc", clienteId: "C01", tipo: 3, emision: "2026-09-20", neto: centavos(50), asociadoA: "f" }),
      ],
      CLIENTES,
      3,
    );
    const [f, nc] = r.comprobantes;
    expect(f).toMatchObject({ iva: 21011, total: 121061, vencimiento: "2026-10-31", puntoVenta: 3, numero: 1 });
    expect(nc).toMatchObject({ iva: 11, total: 61, vencimiento: "2026-09-20", numero: 1, tipo: 3 });
  });

  it("C2: la asociación entre claves pasa a ser la asociación entre ids", () => {
    const r = numerarComprobantes([borrador({ clave: "f", emision: "2026-03-01" }), borrador({ clave: "nc", tipo: 3, emision: "2026-03-05", asociadoA: "f" })], CLIENTES, 3);
    const nc = r.comprobantes.find((c) => c.tipo === 3);
    expect(nc?.asociadoA).toBe("1-0003-00000001");
    expect(r.comprobantes.find((c) => c.tipo === 1)?.asociadoA).toBeNull();
  });

  it("C2: usa el punto de venta que se le da", () => {
    const r = numerarComprobantes([borrador({ clave: "f" })], CLIENTES, 12);
    expect(r.comprobantes[0]?.id).toBe("1-0012-00000001");
    expect(r.comprobantes[0]?.puntoVenta).toBe(12);
  });

  it("C2: nombra el dato dañado: clave repetida, cliente que no existe, factura asociada que no existe, neto inválido", () => {
    expect(() => numerarComprobantes([borrador({ clave: "x" }), borrador({ clave: "x" })], CLIENTES, 3)).toThrow(/«x».*repetid/);
    expect(() => numerarComprobantes([borrador({ clave: "y", clienteId: "C99" })], CLIENTES, 3)).toThrow(/C99/);
    expect(() => numerarComprobantes([borrador({ clave: "nc", tipo: 3, asociadoA: "fantasma" })], CLIENTES, 3)).toThrow(/«fantasma»/);
    expect(() => numerarComprobantes([borrador({ clave: "z", neto: centavos(0) })], CLIENTES, 3)).toThrow(/neto/);
  });

  it("C2: una NC sin factura asociada se numera igual (rechazarla es del validador C3, no de la numeración)", () => {
    const r = numerarComprobantes([borrador({ clave: "nc", tipo: 3, asociadoA: null })], CLIENTES, 3);
    expect(r.comprobantes[0]?.asociadoA).toBeNull();
  });
});

describe("C2: numeración de los recibos (R-PV-número) y su desempate", () => {
  const CLIENTES: Pick<Cliente, "id" | "plazoDias">[] = [
    { id: "C01", plazoDias: 45 },
    { id: "C03", plazoDias: 30 },
  ];
  const facturas = numerarComprobantes(
    [
      { clave: "fa", tipo: 1, clienteId: "C03", emision: "2026-03-01", servicio: "alquiler-4x4", neto: pesos(100_000), asociadoA: null },
      { clave: "fb", tipo: 1, clienteId: "C03", emision: "2026-03-02", servicio: "alquiler-4x4", neto: pesos(100_000), asociadoA: null },
      { clave: "fc", tipo: 1, clienteId: "C01", emision: "2026-03-02", servicio: "alquiler-4x4", neto: pesos(100_000), asociadoA: null },
    ],
    CLIENTES,
    3,
  );
  const recibo = (o: Partial<BorradorDeRecibo> & { clave: string }): BorradorDeRecibo => ({
    clienteId: "C03",
    fecha: "2026-04-10",
    medios: [{ medio: "transferencia", importe: pesos(121_000) }],
    imputaciones: [],
    ...o,
  });
  const imputa = (comprobante: string): BorradorDeRecibo["imputaciones"] => [{ comprobante, importe: pesos(121_000) }];

  it("C2: se numeran desde 1 en orden de fecha", () => {
    const r = numerarRecibos([recibo({ clave: "tarde", fecha: "2026-04-20" }), recibo({ clave: "temprano", fecha: "2026-04-05" })], facturas.idPorClave, 3);
    expect(r.idPorClave.get("temprano")).toBe("R-0003-00000001");
    expect(r.idPorClave.get("tarde")).toBe("R-0003-00000002");
    expect(r.recibos.map((x) => x.fecha)).toEqual(["2026-04-05", "2026-04-20"]);
  });

  it("C2: dos recibos del mismo día de C03 y C01 → el de C01 lleva el número menor", () => {
    const r = numerarRecibos([recibo({ clave: "de-c03", clienteId: "C03", imputaciones: imputa("fa") }), recibo({ clave: "de-c01", clienteId: "C01", imputaciones: imputa("fc") })], facturas.idPorClave, 3);
    expect(r.idPorClave.get("de-c01")).toBe("R-0003-00000001");
    expect(r.idPorClave.get("de-c03")).toBe("R-0003-00000002");
  });

  it("C2: dos del mismo día y cliente → el que imputa al comprobante de id menor, aunque llegue después", () => {
    const r = numerarRecibos([recibo({ clave: "a-fb", imputaciones: imputa("fb") }), recibo({ clave: "a-fa", imputaciones: imputa("fa") })], facturas.idPorClave, 3);
    expect(r.idPorClave.get("a-fa")).toBe("R-0003-00000001");
    expect(r.idPorClave.get("a-fb")).toBe("R-0003-00000002");
  });

  it("C2: el desempate usa el id menor entre los comprobantes que imputa, no el primero de la lista", () => {
    // «x» imputa [fb, fa] (el menor es fa) e «y» imputa [fb]; con «el primero de la lista» empatarían en fb y ganaría «y» por haber llegado antes.
    const r = numerarRecibos(
      [recibo({ clave: "y", imputaciones: imputa("fb") }), recibo({ clave: "x", imputaciones: [...imputa("fb"), ...imputa("fa")] })],
      facturas.idPorClave,
      3,
    );
    expect(r.idPorClave.get("x")).toBe("R-0003-00000001");
    expect(r.idPorClave.get("y")).toBe("R-0003-00000002");
    // Y las imputaciones del recibo conservan el orden en que se escribieron.
    expect(r.recibos[0]?.imputaciones.map((i) => i.comprobanteId)).toEqual([facturas.idPorClave.get("fb"), facturas.idPorClave.get("fa")]);
  });

  it("C2: el que no imputa nada (id vacío) va antes que el que imputa, en la misma fecha y cliente", () => {
    const r = numerarRecibos([recibo({ clave: "imputa", imputaciones: imputa("fa") }), recibo({ clave: "a-cuenta" })], facturas.idPorClave, 3);
    expect(r.idPorClave.get("a-cuenta")).toBe("R-0003-00000001");
  });

  it("C2: si todo empata, queda el orden de generación (el de entrada)", () => {
    const r = numerarRecibos([recibo({ clave: "uno" }), recibo({ clave: "dos" })], facturas.idPorClave, 3);
    expect(r.idPorClave.get("uno")).toBe("R-0003-00000001");
    expect(r.idPorClave.get("dos")).toBe("R-0003-00000002");
  });

  it("C2: las imputaciones pasan a apuntar al id del comprobante y se conservan los medios", () => {
    const r = numerarRecibos([recibo({ clave: "r", imputaciones: imputa("fb") })], facturas.idPorClave, 3);
    expect(r.recibos[0]?.imputaciones).toEqual([{ comprobanteId: facturas.idPorClave.get("fb"), importe: pesos(121_000) }]);
    expect(r.recibos[0]?.medios).toEqual([{ medio: "transferencia", importe: pesos(121_000) }]);
  });

  it("C2: nombra el dato dañado: comprobante imputado que no existe, clave repetida", () => {
    expect(() => numerarRecibos([recibo({ clave: "r", imputaciones: imputa("fantasma") })], facturas.idPorClave, 3)).toThrow(/«fantasma»/);
    expect(() => numerarRecibos([recibo({ clave: "r" }), recibo({ clave: "r" })], facturas.idPorClave, 3)).toThrow(/«r».*repetid/);
  });
});

describe("C2: leerIdRecibo es la inversa de idRecibo (la lectura de los dígitos vive acá, junto al formato)", () => {
  it("C2: R-0003-00000045 → punto de venta 3, número 45", () => {
    expect(leerIdRecibo("R-0003-00000045")).toEqual({ puntoVenta: 3, numero: 45 });
  });

  it("C2: ida y vuelta en los bordes (1, 9999, 99.999.999)", () => {
    for (const [pv, n] of [[1, 1], [3, 45], [9999, 99_999_999], [10, 1_000_000]] as const) {
      expect(leerIdRecibo(idRecibo(pv, n))).toEqual({ puntoVenta: pv, numero: n });
    }
  });

  it("C2: lo que no tiene el formato exacto da null (otro prefijo, dígitos de menos o de más, letras, espacios, punto de venta o número 0)", () => {
    for (const malo of ["", "R-3-1", "r-0003-00000045", "R-0003-0000004a", "R-0003-00000045 ", " R-0003-00000045", "R-0003-000000456", "1-0003-00000045", "R-0000-00000001", "R-0003-00000000", "R-0003-١٢٣٤٥٦٧٨"]) {
      expect(leerIdRecibo(malo), JSON.stringify(malo)).toBeNull();
    }
  });
});
