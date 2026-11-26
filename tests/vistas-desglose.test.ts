// Modelo de vista del Desglose (docs/diseno-ui.md, 6.4): una medida con su valor y sus partidas «por cliente», en lista con orden, o vacía. Se prueba contra
// esperado.ts, contra el dominio y con datos armados a mano para «Otros» con varios clientes.
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { esClaveDelMes, TODAS_LAS_CLAVES } from "../src/lib/dominio/claves.ts";
import { clavesExistentes, valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { criteriosDeOrden } from "../src/lib/dominio/orden.ts";
import type { CriterioDeOrden } from "../src/lib/dominio/orden.ts";
import type { ClaveDeMedida } from "../src/lib/dominio/tipos.ts";
import { vistaDesglose } from "../src/lib/vistas/desglose.ts";
import type { ConsultaDeDesglose, FilaDePartida, VistaDesglose } from "../src/lib/vistas/desglose.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { CORTE, DATOS, idPlantado } from "./fixtures/vistas.ts";

const ver = (consulta: ConsultaDeDesglose, corte: string = CORTE) => vistaDesglose(DATOS, corte, consulta);

function porCliente(v: VistaDesglose) {
  if (v.modo !== "por-cliente") throw new Error(`Se esperaba «por cliente» y vino «${v.modo}».`);
  return v;
}
function enLista(v: VistaDesglose) {
  if (v.modo !== "partidas") throw new Error(`Se esperaba la lista de partidas y vino «${v.modo}».`);
  return v;
}
const ids = (ps: readonly FilaDePartida[]): string[] => ps.map((p) => p.ref.id);

describe("la mora de la empresa, por cliente", () => {
  const v = porCliente(ver({ clave: "mora" }));

  it("el número que se abrió es la mora y la tabla tiene los seis clientes de esperado.ts, del mayor al menor", () => {
    expect(v.importe).toBe(ESPERADO.mora.importe);
    expect(v.medida).toEqual({ clave: "mora" });
    expect(v.base).toBe("con-iva");
    expect(v.mes).toBeNull();
    expect(v.clienteId).toBeNull();
    expect(v.nombreDelCliente).toBeNull();
    expect(v.origen).toBe("comprobantes");
    expect(v.cantidadDePartidas).toBe(ESPERADO.mora.comprobantes);
    expect(v.filas.map((f) => f.clienteId)).toEqual(ESPERADO.deudores.map((d) => d.clienteId));
    expect(v.filas.map((f) => f.importe.importe)).toEqual(ESPERADO.deudores.map((d) => d.importe));
    expect(v.filas.map((f) => f.milesimas)).toEqual(ESPERADO.deudores.map((d) => d.milesimas));
  });

  it("las filas suman el valor y la cantidad de partidas; cada importe abre la mora de ese cliente y vale lo mismo", () => {
    expect(v.filas.reduce((s, f) => s + f.importe.importe, 0)).toBe(v.importe);
    expect(v.filas.reduce((n, f) => n + f.cantidad, 0)).toBe(v.cantidadDePartidas);
    expect(v.filas.reduce((s, f) => s + (f.milesimas ?? 0), 0)).toBe(1000);
    for (const f of v.filas) {
      expect(f.importe.medida).toEqual({ clave: "mora", clienteId: f.clienteId });
      expect(f.importe.importe, f.clienteId).toBe(valorDeMedida(DATOS, CORTE, "mora", { clienteId: f.clienteId }));
    }
    expect(v.filas[0]?.nombre).toBe("Contratista Los Algarrobos Demo S.A.");
  });

  it("con agrupar=no es la lista de las 16 partidas, con la de 91 días primera", () => {
    const l = enLista(ver({ clave: "mora", agrupar: "no" }));
    expect(l.partidas).toHaveLength(16);
    expect(l.partidas[0]).toMatchObject({ ref: { tipo: "comprobante", id: idPlantado("T12-d91") }, clienteId: "C05" });
    expect(l.orden).toEqual({ criterio: "atraso", opciones: ["importe", "fecha", "referencia", "atraso"] });
  });
});

describe("la mora de un cliente, en lista", () => {
  const v = enLista(ver({ clave: "mora", clienteId: "C05" }));

  it("trae el cliente, las 9 partidas vencidas de esperado.ts y su suma es la mora de C05", () => {
    expect(v.clienteId).toBe("C05");
    expect(v.nombreDelCliente).toBe("Contratista Los Algarrobos Demo S.A.");
    expect(v.medida).toEqual({ clave: "mora", clienteId: "C05" });
    expect(v.partidas).toHaveLength(ESPERADO.c05.enMoraComprobantes);
    expect(v.importe).toBe(ESPERADO.c05.mora);
    expect(v.partidas.reduce((s, p) => s + p.importe, 0)).toBe(v.importe);
  });

  it("orden por defecto: atraso; la primera partida es la factura de 91 días, con su detalle de saldo", () => {
    expect(v.orden.criterio).toBe("atraso");
    expect(v.partidas[0]).toMatchObject({
      ref: { tipo: "comprobante", id: idPlantado("T12-d91") },
      fecha: "2026-07-02",
      importe: 60_500_000,
      detalle: { tipo: "saldo", atraso: 91, tramo: "mas-90", vencimiento: "2026-08-01" },
    });
    const atrasos = v.partidas.map((p) => (p.detalle.tipo === "saldo" ? p.detalle.atraso : Number.NaN));
    expect(atrasos).toEqual([...atrasos].sort((a, b) => b - a));
  });

  it("cada criterio ordena como dice: importe de mayor a menor, fecha de la más vieja, referencia de menor a mayor", () => {
    const importes = enLista(ver({ clave: "mora", clienteId: "C05", orden: "importe" })).partidas.map((p) => p.importe);
    expect(importes).toEqual([...importes].sort((a, b) => b - a));
    const fechas = enLista(ver({ clave: "mora", clienteId: "C05", orden: "fecha" })).partidas.map((p) => p.fecha);
    expect(fechas).toEqual([...fechas].sort());
    const refs = ids(enLista(ver({ clave: "mora", clienteId: "C05", orden: "referencia" })).partidas);
    expect(refs).toEqual([...refs].sort());
    expect(enLista(ver({ clave: "mora", clienteId: "C05", orden: "referencia" })).orden.criterio).toBe("referencia");
  });

  it("ordenar no cambia el total ni las partidas, solo su orden", () => {
    for (const orden of criteriosDeOrden("mora")) {
      const l = enLista(ver({ clave: "mora", clienteId: "C05", orden }));
      expect(l.importe, orden).toBe(v.importe);
      expect([...ids(l.partidas)].sort(), orden).toEqual([...ids(v.partidas)].sort());
    }
  });
});

describe("el orden que se ofrece depende de la medida", () => {
  it("la cobranza del mes no ofrece «atraso»; si la dirección o la memoria lo piden, se usa el de por defecto (importe)", () => {
    const l = enLista(ver({ clave: "cobranza-mes", clienteId: "C05", orden: "atraso" as CriterioDeOrden }));
    expect(l.orden).toEqual({ criterio: "importe", opciones: ["importe", "fecha", "referencia"] });
  });

  it("todas las medidas ofrecen lo que dice criteriosDeOrden y su criterio por defecto está entre ellas", () => {
    for (const clave of clavesExistentes(DATOS, CORTE)) {
      const v = ver({ clave, clienteId: clave === "mora-otros" ? undefined : "C05", agrupar: "no" });
      if (v.modo !== "partidas") continue;
      expect(v.orden.opciones, clave).toEqual(criteriosDeOrden(clave));
      expect(v.orden.opciones, clave).toContain(v.orden.criterio);
    }
  });
});

describe("«Otros» (mora-otros)", () => {
  it("con los datos de ejemplo es un solo cliente (C07): lista de una partida, sin cliente en el filtro", () => {
    const l = enLista(ver({ clave: "mora-otros" }));
    expect(l.importe).toBe(ESPERADO.otros.importe);
    expect(l.partidas).toHaveLength(1);
    expect(l.partidas[0]).toMatchObject({ clienteId: "C07", importe: ESPERADO.otros.importe, detalle: { tipo: "saldo", atraso: 21, tramo: "1-30" } });
    expect(l.clienteId).toBeNull();
  });

  it("con varios clientes es «por cliente» y cada importe lleva a la mora de ese cliente, no a mora-otros", () => {
    const clientes = ["C01", "C02", "C03", "C04", "C05", "C06", "C07"];
    const montos = [900_000, 800_000, 700_000, 600_000, 500_000, 300_000, 200_000];
    const { datos } = armarDatos({ comprobantes: clientes.map((cliente, i) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(montos[i] ?? 0) })) });
    const v = porCliente(vistaDesglose(datos, "2026-10-31", { clave: "mora-otros" }));
    expect(v.filas.map((f) => f.clienteId)).toEqual(["C06", "C07"]);
    for (const f of v.filas) expect(f.importe.medida).toEqual({ clave: "mora", clienteId: f.clienteId });
    expect(v.filas.reduce((s, f) => s + f.importe.importe, 0)).toBe(v.importe);
  });

  it("mora-otros con un cliente no existe: es un error que ya filtra el enrutador, y acá no se inventa", () => {
    expect(() => ver({ clave: "mora-otros", clienteId: "C07" })).toThrow();
  });
});

describe("medidas del mes", () => {
  it("la facturación de C05 en julio de 2026 trae la nota de crédito (negativa, tipo 3) y el servicio de cada comprobante", () => {
    const l = enLista(ver({ clave: "facturacion-mes", clienteId: "C05", mes: "2026-07" }));
    expect(l.mes).toBe("2026-07");
    expect(l.medida).toEqual({ clave: "facturacion-mes", clienteId: "C05", mes: "2026-07" });
    expect(l.base).toBe("sin-iva");
    expect(l.origen).toBe("comprobantes");
    expect(l.orden.criterio).toBe("importe");
    const nc = l.partidas.find((p) => p.ref.id === idPlantado("T17-NC"));
    expect(nc).toMatchObject({ importe: -10_000_000, detalle: { tipo: "comprobante-del-mes", tipoDeComprobante: 3, servicio: "alquiler-4x4" } });
    const t12 = l.partidas.find((p) => p.ref.id === idPlantado("T12-d91"));
    expect(t12).toMatchObject({ importe: 90_000_000, detalle: { tipo: "comprobante-del-mes", tipoDeComprobante: 1 } });
    expect(l.partidas.reduce((s, p) => s + p.importe, 0)).toBe(l.importe);
  });

  it("sin mes en la dirección rige el del corte, y quedó escrito en la medida", () => {
    const v = ver({ clave: "facturacion-mes" });
    expect(v.mes).toBe("2026-10");
    expect(v.medida).toEqual({ clave: "facturacion-mes", mes: "2026-10" });
    expect(v.importe).toBe(ESPERADO.octubre.facturacion);
  });

  it("por cliente, cada importe abre la misma medida del cliente y del mismo mes", () => {
    const v = porCliente(ver({ clave: "cobranza-mes", mes: "2026-04" }));
    for (const f of v.filas) {
      expect(f.importe.medida).toEqual({ clave: "cobranza-mes", clienteId: f.clienteId, mes: "2026-04" });
      expect(f.importe.importe).toBe(valorDeMedida(DATOS, CORTE, "cobranza-mes", { clienteId: f.clienteId, mes: "2026-04" }));
    }
    expect(v.origen).toBe("recibos");
  });

  it("la cobranza muestra con qué medios se cobró cada recibo, y las retenciones, cuánto fue de cada una (R2)", () => {
    const cobranza = enLista(ver({ clave: "cobranza-mes", clienteId: "C02", mes: "2026-04" }));
    const recibo = cobranza.partidas.find((p) => p.ref.id === idPlantado("T08-R"));
    expect(recibo).toMatchObject({ ref: { tipo: "recibo" }, importe: 121_000_000, detalle: { tipo: "cobranza", medios: ["transferencia", "retencion-iibb", "retencion-ganancias"] } });
    const retenciones = enLista(ver({ clave: "retenciones-mes", clienteId: "C02", mes: "2026-04" }));
    expect(retenciones.partidas.find((p) => p.ref.id === idPlantado("T08-R"))).toMatchObject({
      importe: 4_000_000,
      detalle: { tipo: "retenciones", retenciones: [{ medio: "retencion-iibb", importe: 2_500_000 }, { medio: "retencion-ganancias", importe: 1_500_000 }] },
    });
    for (const p of retenciones.partidas) {
      expect(p.detalle.tipo === "retenciones" && p.detalle.retenciones.reduce((s, r) => s + r.importe, 0), p.ref.id).toBe(p.importe);
    }
  });

  it("un mes en una medida que no es del mes se descarta sin avisar", () => {
    const v = ver({ clave: "saldo", mes: "2026-07" });
    expect(v.mes).toBeNull();
    expect(v.medida).toEqual({ clave: "saldo" });
  });

  it("un mes inválido o fuera del rango lanza (el enrutador lo corrige antes con un aviso)", () => {
    expect(() => ver({ clave: "cobranza-mes", mes: "2026-13" })).toThrow(/mes/i);
    expect(() => ver({ clave: "cobranza-mes", mes: "2026-11" })).toThrow(/mes/i);
  });
});

describe("lo cobrado sin imputar y el saldo neto", () => {
  it("pagos a cuenta: un recibo (T06-R, C07) de $ 50.000,00, de recibos, sin restar", () => {
    const l = enLista(ver({ clave: "pagos-a-cuenta" }));
    expect(l.origen).toBe("recibos");
    expect(l.partidas).toEqual([
      { ref: { tipo: "recibo", id: idPlantado("T06-R") }, clienteId: "C07", nombreDelCliente: "Montajes Sierra Chica Demo S.R.L.", fecha: "2026-10-20", importe: ESPERADO.pagosACuenta.importe, detalle: { tipo: "a-cuenta", resta: false } },
    ]);
  });

  it("el saldo neto de C07 son sus comprobantes con saldo y su pago a cuenta, que resta (importe negativo)", () => {
    const l = enLista(ver({ clave: "saldo-neto", clienteId: "C07" }));
    expect(l.origen).toBe("comprobantes");
    const resta = l.partidas.find((p) => p.ref.tipo === "recibo");
    expect(resta).toMatchObject({ importe: -ESPERADO.pagosACuenta.importe, detalle: { tipo: "a-cuenta", resta: true } });
    expect(l.partidas.some((p) => p.detalle.tipo === "saldo")).toBe(true);
    expect(l.partidas.reduce((s, p) => s + p.importe, 0)).toBe(l.importe);
    // El pago a cuenta no tiene atraso: al ordenar por atraso va al final (5.9.2).
    expect(l.partidas.at(-1)?.ref.tipo).toBe("recibo");
  });

  it("saldos a favor de C09 al corte: uno solo; antes de que existiera el sobrepago (30/06/2026) no hay nada y la vista es «vacío»", () => {
    expect(enLista(ver({ clave: "saldos-a-favor" })).importe).toBe(ESPERADO.saldosAFavor.importe);
    const v = ver({ clave: "saldos-a-favor" }, "2026-06-30");
    expect(v.modo).toBe("vacio");
    expect(v.importe).toBe(0);
    expect(v.cantidadDePartidas).toBe(0);
  });
});

describe("el desglose vacío, el de un solo cliente y los errores", () => {
  it("un tramo sin partidas es «vacío», con su medida, y no una tabla de ceros", () => {
    const v = ver({ clave: "tramo-61-90", clienteId: "C09" });
    expect(v.modo).toBe("vacio");
    expect(v).toMatchObject({ importe: 0, medida: { clave: "tramo-61-90", clienteId: "C09" }, nombreDelCliente: "Perforaciones del Oeste Demo S.A." });
  });

  it("una medida con varios clientes pero filtrada por uno nunca es «por cliente»; con una sola partida es lista", () => {
    expect(ver({ clave: "saldo", clienteId: "C05" }).modo).toBe("partidas");
    expect(ver({ clave: "tramo-mas-90" }).modo).toBe("partidas");
  });

  it("claves y clientes que no existen lanzan", () => {
    expect(() => ver({ clave: "inexistente" as ClaveDeMedida })).toThrow(/inexistente/);
    expect(() => ver({ clave: "mora", clienteId: "C99" })).toThrow(/C99/);
  });

  it("en todas las medidas, la tabla suma el valor, al centavo, tanto «por cliente» como en lista", () => {
    for (const clave of clavesExistentes(DATOS, CORTE)) {
      for (const agrupar of [undefined, "no" as const]) {
        const v = ver({ clave, ...(agrupar === undefined ? {} : { agrupar }) });
        const suma = v.modo === "por-cliente" ? v.filas.reduce((s, f) => s + f.importe.importe, 0) : v.modo === "partidas" ? v.partidas.reduce((s, p) => s + p.importe, 0) : 0;
        expect(suma, `${clave} ${String(agrupar)}`).toBe(v.importe);
        expect(v.importe, clave).toBe(valorDeMedida(DATOS, CORTE, clave, esClaveDelMes(clave) ? { mes: "2026-10" } : {}));
      }
    }
    expect(TODAS_LAS_CLAVES).toContain("mora-otros");
  });
});
