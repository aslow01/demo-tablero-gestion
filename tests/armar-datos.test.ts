// Función de apoyo de los fixtures (docs/plan.md, paso 2.4; docs/diseno.md, 5.5): arma un `Datos` mínimo a mano.
import { describe, expect, it } from "vitest";
import { cuitValido } from "../src/lib/datos/cuit.ts";
import { centavos } from "../src/lib/dominio/dinero.ts";
import { CLIENTES_DE_PRUEBA, armarDatos, pesos } from "./fixtures/armarDatos.ts";

describe("armarDatos: el conjunto mínimo", () => {
  it("M1: pesos(n) son n × 100 centavos, con el tipo Centavos", () => {
    expect(pesos(1_000)).toBe(100_000);
    expect(pesos(0)).toBe(0);
    expect(() => pesos(0.001)).toThrow(/entero/);
  });

  it("G4: los 13 clientes de la tabla 5.1, con su plazo, y los CUIT ficticios con dígito verificador válido", () => {
    expect(CLIENTES_DE_PRUEBA.map((c) => [c.id, c.plazoDias])).toEqual([
      ["C01", 45], ["C02", 60], ["C03", 30], ["C04", 30], ["C05", 30], ["C06", 45], ["C07", 30],
      ["C08", 15], ["C09", 60], ["C10", 30], ["C11", 30], ["C12", 45], ["C13", 30],
    ]);
    expect(CLIENTES_DE_PRUEBA.find((c) => c.id === "C11")?.razonSocial).toBe("Camiones del Norte Demo S.A.");
    expect(CLIENTES_DE_PRUEBA.find((c) => c.id === "C05")?.razonSocial).toBe("Contratista Los Algarrobos Demo S.A.");
    expect(CLIENTES_DE_PRUEBA.find((c) => c.id === "C10")?.razonSocial).toBe("Servicios Cerro Plata Demo S.R.L.");
    expect(CLIENTES_DE_PRUEBA.every((c) => c.razonSocial.includes("Demo") && cuitValido(c.cuit))).toBe(true);
    expect(new Set(CLIENTES_DE_PRUEBA.map((c) => c.cuit)).size).toBe(13);
  });

  it("armarDatos sin nada: versión 1, rango 2025-01-01 a 2026-10-31, la empresa y los 13 clientes", () => {
    const { datos } = armarDatos({});
    expect(datos).toMatchObject({ version: 1, desde: "2025-01-01", hasta: "2026-10-31" });
    expect(datos.empresa).toMatchObject({ nombre: "Logística Andina Demo S.A.", puntoVenta: 3 });
    expect(cuitValido(datos.empresa.cuit)).toBe(true);
    expect(datos.clientes).toHaveLength(13);
    expect(datos.comprobantes).toEqual([]);
    expect(datos.recibos).toEqual([]);
  });

  it("M2: numera y calcula IVA y total de cada comprobante con M2, y el vencimiento con el plazo del cliente", () => {
    const { datos, id } = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C01", emision: "2026-09-16", neto: centavos(100050) }],
    });
    expect(datos.comprobantes).toHaveLength(1);
    expect(datos.comprobantes[0]).toMatchObject({
      id: "1-0003-00000001",
      tipo: 1,
      clienteId: "C01",
      neto: 100050,
      iva: 21011,
      total: 121061,
      vencimiento: "2026-10-31",
      servicio: "alquiler-4x4",
      asociadoA: null,
    });
    expect(id("F")).toBe("1-0003-00000001");
  });

  it("C2: la numeración sigue el orden de emisión, no el orden en que se escribieron", () => {
    const { datos, id } = armarDatos({
      comprobantes: [
        { clave: "tarde", cliente: "C01", emision: "2026-05-20", neto: pesos(1_000) },
        { clave: "temprano", cliente: "C01", emision: "2026-05-02", neto: pesos(1_000) },
      ],
    });
    expect(id("temprano")).toBe("1-0003-00000001");
    expect(id("tarde")).toBe("1-0003-00000002");
    expect(datos.comprobantes.map((c) => c.emision)).toEqual(["2026-05-02", "2026-05-20"]);
  });

  it("una NC y una ND quedan asociadas por id, y la NC vence el día de su emisión", () => {
    const { datos, id } = armarDatos({
      comprobantes: [
        { clave: "F", cliente: "C06", emision: "2026-05-12", neto: pesos(500_000) },
        { clave: "NC", tipo: 3, cliente: "C06", emision: "2026-05-20", neto: pesos(500_000), asociadoA: "F" },
        { clave: "ND", tipo: 2, cliente: "C06", emision: "2026-05-21", neto: pesos(24_000), asociadoA: "F" },
      ],
    });
    const nc = datos.comprobantes.find((c) => c.id === id("NC"));
    const nd = datos.comprobantes.find((c) => c.id === id("ND"));
    expect(nc).toMatchObject({ tipo: 3, asociadoA: id("F"), vencimiento: "2026-05-20", total: pesos(605_000) });
    expect(nd).toMatchObject({ tipo: 2, asociadoA: id("F"), vencimiento: "2026-07-05" });
  });

  it("un recibo con medios (transferencia por defecto) e imputaciones por clave; los recibos se numeran desde 1", () => {
    const { datos, id } = armarDatos({
      comprobantes: [{ clave: "F", cliente: "C09", emision: "2026-06-15", neto: pesos(200_000) }],
      recibos: [
        {
          clave: "R",
          cliente: "C09",
          fecha: "2026-08-10",
          medios: [{ importe: pesos(300_000) }],
          imputaciones: [{ comprobante: "F", importe: pesos(242_000) }],
        },
      ],
    });
    expect(datos.recibos).toEqual([
      {
        id: "R-0003-00000001",
        clienteId: "C09",
        fecha: "2026-08-10",
        medios: [{ medio: "transferencia", importe: pesos(300_000) }],
        imputaciones: [{ comprobanteId: id("F"), importe: pesos(242_000) }],
      },
    ]);
    expect(id("R")).toBe("R-0003-00000001");
  });

  it("un recibo sin imputaciones es un pago a cuenta (T06) y un recibo sin clave recibe una propia", () => {
    const { datos } = armarDatos({ recibos: [{ cliente: "C07", fecha: "2026-10-20", medios: [{ importe: pesos(50_000) }] }, { cliente: "C07", fecha: "2026-10-21", medios: [{ importe: pesos(1_000) }] }] });
    expect(datos.recibos.map((r) => r.id)).toEqual(["R-0003-00000001", "R-0003-00000002"]);
    expect(datos.recibos.every((r) => r.imputaciones.length === 0)).toBe(true);
  });

  it("id() nombra la clave que no existe", () => {
    const { id } = armarDatos({});
    expect(() => id("fantasma")).toThrow(/«fantasma»/);
  });

  it("se pueden pasar clientes propios en lugar de los 13", () => {
    const { datos } = armarDatos({ clientes: CLIENTES_DE_PRUEBA.slice(0, 2) });
    expect(datos.clientes.map((c) => c.id)).toEqual(["C01", "C02"]);
  });
});
