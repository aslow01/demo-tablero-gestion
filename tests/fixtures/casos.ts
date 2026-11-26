// Los fixtures de docs/diseno.md, sección 5.5: un `Datos` mínimo, armado a mano, con resultado esperado exacto para cada regla.
// Los casos que también están en la semilla (T02, T04 a T08, T17) se prueban allá (5.3). Importes en pesos con `pesos(...)`.
import { centavos } from "../../src/lib/dominio/dinero.ts";
import { armarDatos, pesos } from "./armarDatos.ts";
import type { Armado } from "./armarDatos.ts";

/** T01 (C1, S2): C06, plazo 45. Una factura de 500.000,00 y su NC por el mismo importe, sin cobros. */
export function fixtureT01(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T01-F", cliente: "C06", emision: "2026-05-12", neto: pesos(500_000) },
      { clave: "T01-NC", tipo: 3, cliente: "C06", emision: "2026-05-20", neto: pesos(500_000), asociadoA: "T01-F" },
    ],
  });
}

/** T03 (S3): C08, plazo 15. Una factura de 242.000,00 con IVA que vence el 31/07 y se cobra ese día. */
export function fixtureT03(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "T03-F", cliente: "C08", emision: "2026-07-16", neto: pesos(200_000) }],
    recibos: [{ clave: "T03-R", cliente: "C08", fecha: "2026-07-31", medios: [{ importe: pesos(242_000) }], imputaciones: [{ comprobante: "T03-F", importe: pesos(242_000) }] }],
  });
}

/** T09 (C5, D3): C06. Una factura de junio, su NC total en julio y otra factura de julio, cobrada en agosto. */
export function fixtureT09(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T09-F", cliente: "C06", emision: "2026-06-10", neto: pesos(800_000) },
      { clave: "T09-NC", tipo: 3, cliente: "C06", emision: "2026-07-14", neto: pesos(800_000), asociadoA: "T09-F" },
      { clave: "T09-F2", cliente: "C06", emision: "2026-07-03", neto: pesos(300_000) },
    ],
    recibos: [{ clave: "T09-R", cliente: "C06", fecha: "2026-08-17", medios: [{ importe: pesos(363_000) }], imputaciones: [{ comprobante: "T09-F2", importe: pesos(363_000) }] }],
  });
}

/** T10 (M2, D3): un cliente con tres facturas de neto 1.000,50 en febrero de 2025 y ningún otro comprobante ese mes. */
export function fixtureT10(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T10-F1", cliente: "C04", emision: "2025-02-03", neto: centavos(100_050) },
      { clave: "T10-F2", cliente: "C04", emision: "2025-02-10", neto: centavos(100_050) },
      { clave: "T10-F3", cliente: "C04", emision: "2025-02-17", neto: centavos(100_050) },
    ],
  });
}

/** T11 (M3): C05, C10 y C11 (plazo 30) con una factura impaga de 363.000,00 y atraso 61, 75 y 90 al 31/10/2026. */
export function fixtureT11(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T11-C05", cliente: "C05", emision: "2026-08-01", neto: pesos(300_000) }, // vence 31/08: atraso 61
      { clave: "T11-C10", cliente: "C10", emision: "2026-07-18", neto: pesos(300_000) }, // vence 17/08: atraso 75
      { clave: "T11-C11", cliente: "C11", emision: "2026-07-03", neto: pesos(300_000) }, // vence 02/08: atraso 90
    ],
  });
}

/**
 * T12 (A1, A2, S4, D1): antigüedad, sin cobros. Plazo 30 salvo T04-F (C01, plazo 45). Atrasos al 31/10/2026: 30, 31, 60, 61, 90, 91 y 0.
 * La mora es 2.238.500,00 en 6 comprobantes y 4 clientes y el saldo 2.541.000,00.
 */
export function fixtureT12(): Armado {
  return armarDatos({ comprobantes: ANTIGUEDAD_T12 });
}

const ANTIGUEDAD_T12 = [
  { clave: "d30", cliente: "C07", emision: "2026-09-01", neto: pesos(200_000) },
  { clave: "d31", cliente: "C03", emision: "2026-08-31", neto: pesos(150_000) },
  { clave: "d60", cliente: "C07", emision: "2026-08-02", neto: pesos(400_000) },
  { clave: "d61", cliente: "C05", emision: "2026-08-01", neto: pesos(300_000) },
  { clave: "d90", cliente: "C11", emision: "2026-07-03", neto: pesos(300_000) },
  { clave: "d91f", cliente: "C05", emision: "2026-07-02", neto: pesos(500_000) },
  { clave: "T04-F", cliente: "C01", emision: "2026-09-16", neto: pesos(250_000) },
];

/** T13 (C5): C12, plazo 45. Facturas del 31/12/2025 y del 01/01/2026 y un recibo del 13/02/2026 que cobra las dos. */
export function fixtureT13(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T13-F1", cliente: "C12", emision: "2025-12-31", neto: pesos(100_000) },
      { clave: "T13-F2", cliente: "C12", emision: "2026-01-01", neto: pesos(120_000) },
    ],
    recibos: [
      {
        clave: "T13-R",
        cliente: "C12",
        fecha: "2026-02-13",
        medios: [{ importe: pesos(266_200) }],
        imputaciones: [
          { comprobante: "T13-F1", importe: pesos(121_000) },
          { comprobante: "T13-F2", importe: pesos(145_200) },
        ],
      },
    ],
  });
}

/** T14 (S1, S7): C08, plazo 15. Una factura del 30/09 y otra del 01/10, cobradas el 15/10 y el 16/10. */
export function fixtureT14(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T14-F1", cliente: "C08", emision: "2026-09-30", neto: pesos(100_000) },
      { clave: "T14-F2", cliente: "C08", emision: "2026-10-01", neto: pesos(100_000) },
    ],
    recibos: [
      { clave: "T14-R1", cliente: "C08", fecha: "2026-10-15", medios: [{ importe: pesos(121_000) }], imputaciones: [{ comprobante: "T14-F1", importe: pesos(121_000) }] },
      { clave: "T14-R2", cliente: "C08", fecha: "2026-10-16", medios: [{ importe: pesos(121_000) }], imputaciones: [{ comprobante: "T14-F2", importe: pesos(121_000) }] },
    ],
  });
}

/** T15 (D3): C04 con su último comprobante en octubre de 2025 y su último recibo en noviembre de 2025, ya cobrado. */
export function fixtureT15(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "T15-F", cliente: "C04", emision: "2025-10-15", neto: pesos(100_000) }],
    recibos: [{ clave: "T15-R", cliente: "C04", fecha: "2025-11-10", medios: [{ importe: pesos(121_000) }], imputaciones: [{ comprobante: "T15-F", importe: pesos(121_000) }] }],
  });
}

/** T16 (C1): C13, plazo 30. Una factura cobrada el 09/04 y una ND asociada, emitida el 02/04 y cobrada el 15/06. */
export function fixtureT16(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T16-F", cliente: "C13", emision: "2026-03-10", neto: pesos(600_000) },
      { clave: "T16-ND", tipo: 2, cliente: "C13", emision: "2026-04-02", neto: pesos(24_000), asociadoA: "T16-F" },
    ],
    recibos: [
      { clave: "T16-R1", cliente: "C13", fecha: "2026-04-09", medios: [{ importe: pesos(726_000) }], imputaciones: [{ comprobante: "T16-F", importe: pesos(726_000) }] },
      { clave: "T16-R2", cliente: "C13", fecha: "2026-06-15", medios: [{ importe: pesos(29_040) }], imputaciones: [{ comprobante: "T16-ND", importe: pesos(29_040) }] },
    ],
  });
}

/** R4 (R4, T06): C07 con d30 y d60 de T12 y un recibo de 50.000,00 sin imputar (pago a cuenta). */
export function fixtureR4(): Armado {
  return armarDatos({
    comprobantes: ANTIGUEDAD_T12.filter((c) => c.clave === "d30" || c.clave === "d60"),
    recibos: [{ clave: "T06-R", cliente: "C07", fecha: "2026-10-20", medios: [{ importe: pesos(50_000) }] }],
  });
}

/** Todos los fixtures de 5.5, por alias. */
export const FIXTURES = {
  T01: fixtureT01,
  T03: fixtureT03,
  T09: fixtureT09,
  T10: fixtureT10,
  T11: fixtureT11,
  T12: fixtureT12,
  T13: fixtureT13,
  T14: fixtureT14,
  T15: fixtureT15,
  T16: fixtureT16,
  R4: fixtureR4,
} as const;

// ---------------------------------------------------------------------------------------------------------------------------
// Los casos plantados de docs/diseno.md, 5.3, como fixtures chicos: solo el comprobante del caso y sus cobros, con los mismos importes
// y fechas que tendrán en la semilla. Los resultados por comprobante no dependen de la semilla; los de conjunto, sí, y no se prueban acá.
// ---------------------------------------------------------------------------------------------------------------------------

/** T02 (S2, S6): C03, plazo 30. Factura de 1.210.000,00 cobrada en tres pagos (31/07, 15/09 y 12/10). */
export function fixtureT02(): Armado {
  const imputa = (importe: number) => [{ comprobante: "T02-F", importe: pesos(importe) }];
  return armarDatos({
    comprobantes: [{ clave: "T02-F", cliente: "C03", emision: "2026-07-10", neto: pesos(1_000_000) }],
    recibos: [
      { clave: "T02-R1", cliente: "C03", fecha: "2026-07-31", medios: [{ importe: pesos(400_000) }], imputaciones: imputa(400_000) },
      { clave: "T02-R2", cliente: "C03", fecha: "2026-09-15", medios: [{ importe: pesos(400_000) }], imputaciones: imputa(400_000) },
      { clave: "T02-R3", cliente: "C03", fecha: "2026-10-12", medios: [{ importe: pesos(410_000) }], imputaciones: imputa(410_000) },
    ],
  });
}

/** T04 (S3): C01, plazo 45. Factura de 302.500,00 que vence el 31/10/2026, sin cobros. */
export function fixtureT04(): Armado {
  return armarDatos({ comprobantes: [{ clave: "T04-F", cliente: "C01", emision: "2026-09-16", neto: pesos(250_000) }] });
}

/** T05 (S1): C05, plazo 30. Factura de 363.000,00 que vence el 25/10 y se cobra el 03/11/2026, después del calendario. */
export function fixtureT05(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "T05-F", cliente: "C05", emision: "2026-09-25", neto: pesos(300_000) }],
    recibos: [{ clave: "T05-R", cliente: "C05", fecha: "2026-11-03", medios: [{ importe: pesos(363_000) }], imputaciones: [{ comprobante: "T05-F", importe: pesos(363_000) }] }],
  });
}

/** T07 (R4): C09, plazo 60. Factura de 242.000,00 y un recibo de 300.000,00 que imputa 242.000,00 y deja 58.000,00 a cuenta; C09 no tiene otros comprobantes. */
export function fixtureT07(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "T07-F", cliente: "C09", emision: "2026-06-15", neto: pesos(200_000) }],
    recibos: [{ clave: "T07-R", cliente: "C09", fecha: "2026-08-10", medios: [{ importe: pesos(300_000) }], imputaciones: [{ comprobante: "T07-F", importe: pesos(242_000) }] }],
  });
}

/** T08 (R2): C02, plazo 60. Factura de 1.210.000,00 cancelada con transferencia de 1.170.000,00 y retenciones de IIBB (25.000,00) y Ganancias (15.000,00). */
export function fixtureT08(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "T08-F", cliente: "C02", emision: "2026-02-14", neto: pesos(1_000_000) }],
    recibos: [
      {
        clave: "T08-R",
        cliente: "C02",
        fecha: "2026-04-30",
        medios: [{ importe: pesos(1_170_000) }, { medio: "retencion-iibb", importe: pesos(25_000) }, { medio: "retencion-ganancias", importe: pesos(15_000) }],
        imputaciones: [{ comprobante: "T08-F", importe: pesos(1_210_000) }],
      },
    ],
  });
}

/**
 * T17 (C1, C3, R2, R3, S1, S2, S6): el comprobante del recorrido, T12-d91 (C05, plazo 30): factura de 1.089.000,00, una NC parcial de
 * 121.000,00 (20/07), un cobro de 242.000,00 con retenciones (12/08) y otro de 121.000,00 (14/10). Saldo al 31/10: 605.000,00.
 */
export function fixtureT17(): Armado {
  return armarDatos({
    comprobantes: [
      { clave: "T12-d91", cliente: "C05", emision: "2026-07-02", neto: pesos(900_000) },
      { clave: "T17-NC", tipo: 3, cliente: "C05", emision: "2026-07-20", neto: pesos(100_000), asociadoA: "T12-d91" },
    ],
    recibos: [
      {
        clave: "T17-R1",
        cliente: "C05",
        fecha: "2026-08-12",
        medios: [{ importe: pesos(234_000) }, { medio: "retencion-iibb", importe: pesos(5_000) }, { medio: "retencion-ganancias", importe: pesos(3_000) }],
        imputaciones: [{ comprobante: "T12-d91", importe: pesos(242_000) }],
      },
      { clave: "T17-R2", cliente: "C05", fecha: "2026-10-14", medios: [{ importe: pesos(121_000) }], imputaciones: [{ comprobante: "T12-d91", importe: pesos(121_000) }] },
    ],
  });
}

/**
 * R2 con retención de IVA (no es un caso de la semilla; cubre el tercer medio de retención): C02, plazo 60. Factura de 1.210.000,00 cancelada el 30/04 con
 * transferencia de 1.190.000,00 y retención de IVA de 20.000,00. Sin este fixture, sacar `retencion-iva` de los medios de retención no rompería ningún test.
 */
export function fixtureRetencionIva(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "RIVA-F", cliente: "C02", emision: "2026-02-14", neto: pesos(1_000_000) }],
    recibos: [
      {
        clave: "RIVA-R",
        cliente: "C02",
        fecha: "2026-04-30",
        medios: [{ importe: pesos(1_190_000) }, { medio: "retencion-iva", importe: pesos(20_000) }],
        imputaciones: [{ comprobante: "RIVA-F", importe: pesos(1_210_000) }],
      },
    ],
  });
}

/** Los casos de 5.3 como fixtures, por alias (el T06 es el recibo del fixture R4). */
export const CASOS_PLANTADOS = { T02: fixtureT02, T04: fixtureT04, T05: fixtureT05, T07: fixtureT07, T08: fixtureT08, T17: fixtureT17 } as const;

/** El ejemplo chico de D3: una factura de 242.000,00 (01/03) y un recibo del 20/03 con transferencia de 150.000,00 que imputa 100.000,00 (a cuenta 50.000,00). */
export function fixtureEjemploD3(): Armado {
  return armarDatos({
    comprobantes: [{ clave: "D3-F", cliente: "C04", emision: "2026-03-01", neto: pesos(200_000) }],
    recibos: [{ clave: "D3-R", cliente: "C04", fecha: "2026-03-20", medios: [{ importe: pesos(150_000) }], imputaciones: [{ comprobante: "D3-F", importe: pesos(100_000) }] }],
  });
}

/**
 * M4 con siete deudores: siete clientes con una factura impaga y vencida al 31/10/2026, de 1.089.000,00, 968.000,00, 847.000,00, 726.000,00,
 * 605.000,00, 363.000,00 y 242.000,00. Los cinco mayores suman 4.235.000,00 y «Otros» es 605.000,00 (363.000,00 + 242.000,00).
 */
export function fixtureOtros(cantidad = 7): Armado {
  const filas: [string, number][] = [["C03", 900_000], ["C04", 800_000], ["C05", 700_000], ["C06", 600_000], ["C07", 500_000], ["C08", 300_000], ["C10", 200_000]];
  return armarDatos({ comprobantes: filas.slice(0, cantidad).map(([cliente, neto]) => ({ clave: `F-${cliente}`, cliente, emision: "2026-08-01", neto: pesos(neto) })) });
}

/** Como `fixtureOtros(5)` y un sexto cliente (C08) que pagó su factura vencida: tiene movimientos pero mora 0, así que no es un deudor. */
export function fixtureOtrosConPagador(): Armado {
  const base = fixtureOtros(5);
  return armarDatos({
    comprobantes: [
      ...["C03", "C04", "C05", "C06", "C07"].map((cliente, i) => ({ clave: `F-${cliente}`, cliente, emision: "2026-08-01", neto: pesos(900_000 - i * 100_000) })),
      { clave: "F-C08", cliente: "C08", emision: "2026-08-01", neto: pesos(300_000) },
    ],
    recibos: [{ clave: "R-C08", cliente: "C08", fecha: "2026-09-20", medios: [{ importe: pesos(363_000) }], imputaciones: [{ comprobante: "F-C08", importe: pesos(363_000) }] }],
    clientes: base.datos.clientes,
  });
}
