// Resultados esperados de las medidas, escritos a mano desde docs/diseno.md (5.3, 5.4, 5.5 y 6): cada fila es un fixture, un corte, una
// clave y, si hace falta, un filtro, con el valor en centavos y la cantidad de partidas. Los dos caminos de cálculo (agregados.ts y
// partidas.ts) se prueban cada uno contra esta tabla, por separado (docs/plan.md, paso 3.3). Importes de las tablas × 100.
import type { ClaveDeMedida, FiltroDeMedida } from "../../src/lib/dominio/tipos.ts";
import type { Armado } from "./armarDatos.ts";
import { fixtureEjemploD3, fixtureR4, fixtureRetencionIva, fixtureT01, fixtureT02, fixtureT03, fixtureT05, fixtureT07, fixtureT08, fixtureT09, fixtureT10, fixtureT12, fixtureT13, fixtureT14, fixtureT16, fixtureT17 } from "./casos.ts";

export interface Esperado {
  /** Qué prueba, para el nombre del test. */
  nombre: string;
  armar: () => Armado;
  corte: string;
  clave: ClaveDeMedida;
  filtro?: FiltroDeMedida;
  /** Centavos. */
  valor: number;
  /** Cantidad de partidas. */
  partidas: number;
}

const e = (nombre: string, armar: () => Armado, corte: string, clave: ClaveDeMedida, valor: number, partidas: number, filtro?: FiltroDeMedida): Esperado => ({
  nombre,
  armar,
  corte,
  clave,
  valor,
  partidas,
  ...(filtro === undefined ? {} : { filtro }),
});

export const ESPERADOS: readonly Esperado[] = [
  // T12 (A1, A2, S4, D1) al 31/10/2026: mora 2.238.500,00 en 6 comprobantes; saldo 2.541.000,00; tramos 242.000 · 665.500 · 726.000 · 605.000 · 302.500 (no vencido)
  e("T12: saldo 2.541.000,00 en 7 comprobantes", fixtureT12, "2026-10-31", "saldo", 254_100_000, 7),
  e("T12: mora 2.238.500,00 en 6 comprobantes", fixtureT12, "2026-10-31", "mora", 223_850_000, 6),
  e("T12: tramo no vencido 302.500,00 (T04-F)", fixtureT12, "2026-10-31", "tramo-no-vencido", 30_250_000, 1),
  e("T12: tramo 1–30 242.000,00", fixtureT12, "2026-10-31", "tramo-1-30", 24_200_000, 1),
  e("T12: tramo 31–60 181.500,00 + 484.000,00 = 665.500,00", fixtureT12, "2026-10-31", "tramo-31-60", 66_550_000, 2),
  e("T12: tramo 61–90 363.000,00 + 363.000,00 = 726.000,00", fixtureT12, "2026-10-31", "tramo-61-90", 72_600_000, 2),
  e("T12: tramo más de 90 605.000,00", fixtureT12, "2026-10-31", "tramo-mas-90", 60_500_000, 1),
  e("T12: pagos a cuenta 0", fixtureT12, "2026-10-31", "pagos-a-cuenta", 0, 0),
  e("T12: saldos a favor 0", fixtureT12, "2026-10-31", "saldos-a-favor", 0, 0),
  e("T12: saldo neto = saldo (7 comprobantes, ningún recibo)", fixtureT12, "2026-10-31", "saldo-neto", 254_100_000, 7),
  e("T12, C07: mora 726.000,00 (d30 y d60)", fixtureT12, "2026-10-31", "mora", 72_600_000, 2, { clienteId: "C07" }),
  e("T12, C05: mora 968.000,00 (d61 y d91f)", fixtureT12, "2026-10-31", "mora", 96_800_000, 2, { clienteId: "C05" }),
  e("T12, C03: mora 181.500,00", fixtureT12, "2026-10-31", "mora", 18_150_000, 1, { clienteId: "C03" }),
  e("T12, C11: mora 363.000,00", fixtureT12, "2026-10-31", "mora", 36_300_000, 1, { clienteId: "C11" }),
  e("T12, C01: mora 0 y saldo 302.500,00 (T04-F no vence hasta hoy)", fixtureT12, "2026-10-31", "mora", 0, 0, { clienteId: "C01" }),
  e("T12, C01: saldo 302.500,00", fixtureT12, "2026-10-31", "saldo", 30_250_000, 1, { clienteId: "C01" }),
  e("T12, C04: sin comprobantes, saldo 0", fixtureT12, "2026-10-31", "saldo", 0, 0, { clienteId: "C04" }),
  e("T12: facturación de septiembre de 2026 vista al 31/10 (mes=2026-09): 200.000,00 + 250.000,00", fixtureT12, "2026-10-31", "facturacion-mes", 45_000_000, 2, { mes: "2026-09" }),
  e("T12: IVA de septiembre: 42.000,00 + 52.500,00", fixtureT12, "2026-10-31", "iva-mes", 9_450_000, 2, { mes: "2026-09" }),
  e("T12: facturado con IVA de septiembre: 242.000,00 + 302.500,00", fixtureT12, "2026-10-31", "facturado-con-iva-mes", 54_450_000, 2, { mes: "2026-09" }),
  e("T12: sin comprobantes emitidos en octubre, la facturación del mes del corte es 0", fixtureT12, "2026-10-31", "facturacion-mes", 0, 0),

  // Lo del mismo día del corte existe (S1: ≤ corte), y lo posterior del mismo mes no
  e("T14 al 30/09: la factura emitida el día del corte existe, saldo 121.000,00", fixtureT14, "2026-09-30", "saldo", 12_100_000, 1),
  e("T14 al 30/09: y todavía no vence (vence el 15/10)", fixtureT14, "2026-09-30", "tramo-no-vencido", 12_100_000, 1),
  e("R4 al 20/10: el recibo fechado el día del corte existe, pagos a cuenta 50.000,00", fixtureR4, "2026-10-20", "pagos-a-cuenta", 5_000_000, 1),
  e("R4 al 20/10: saldo neto 676.000,00", fixtureR4, "2026-10-20", "saldo-neto", 67_600_000, 3),
  e("T02 al 12/10: el cobro del 12/10 existe, saldo 0 y cobranza del mes 410.000,00", fixtureT02, "2026-10-12", "cobranza-mes", 41_000_000, 1),
  e("T02 al 01/10: el cobro del 12/10 es del mes del corte pero posterior al corte: cobranza de octubre 0 (S1 y S7)", fixtureT02, "2026-10-01", "cobranza-mes", 0, 0),
  e("T02 al 01/10: y el saldo sigue en 410.000,00", fixtureT02, "2026-10-01", "saldo", 41_000_000, 1),

  // Un recibo imputado por completo no es un pago a cuenta ni un saldo a favor (a cuenta 0 no es una partida)
  e("T17 al 31/10: C05 tiene saldo y sus recibos imputaron todo: pagos a cuenta 0", fixtureT17, "2026-10-31", "pagos-a-cuenta", 0, 0),
  e("T08 al 30/04: C02 sin saldo y su recibo imputó todo: saldos a favor 0", fixtureT08, "2026-04-30", "saldos-a-favor", 0, 0),

  // T12 en los bordes de cada tramo, un día antes y un día después del corte de 5.5 (la ventana de vencimiento de cada tramo, 4.2.1)
  e("T12 al 30/10 (un día antes): tramo 1–30 = d30 (29) + d31 (30) = 423.500,00", fixtureT12, "2026-10-30", "tramo-1-30", 42_350_000, 2),
  e("T12 al 30/10: tramo 31–60 = d60 (59) + d61 (60) = 847.000,00", fixtureT12, "2026-10-30", "tramo-31-60", 84_700_000, 2),
  e("T12 al 30/10: tramo 61–90 = d90 (89) + d91f (90) = 968.000,00", fixtureT12, "2026-10-30", "tramo-61-90", 96_800_000, 2),
  e("T12 al 30/10: nadie pasa de 90 días", fixtureT12, "2026-10-30", "tramo-mas-90", 0, 0),
  e("T12 al 30/10: T04-F todavía no venció (−1)", fixtureT12, "2026-10-30", "tramo-no-vencido", 30_250_000, 1),
  e("T12 al 01/11 (la función, un día después): tramo 1–30 = T04-F (1)", fixtureT12, "2026-11-01", "tramo-1-30", 30_250_000, 1),
  e("T12 al 01/11: tramo 31–60 = d30 (31) + d31 (32) = 423.500,00", fixtureT12, "2026-11-01", "tramo-31-60", 42_350_000, 2),
  e("T12 al 01/11: tramo 61–90 = d60 (61) + d61 (62) = 847.000,00", fixtureT12, "2026-11-01", "tramo-61-90", 84_700_000, 2),
  e("T12 al 01/11: tramo más de 90 = d90 (91) + d91f (92) = 968.000,00", fixtureT12, "2026-11-01", "tramo-mas-90", 96_800_000, 2),
  e("T12 al 01/11: ya no hay nada sin vencer", fixtureT12, "2026-11-01", "tramo-no-vencido", 0, 0),

  // R4 / T06: C07 con d30 (242.000,00) y d60 (484.000,00) y un recibo del 20/10 de 50.000,00 sin imputar
  e("R4: mora de C07 726.000,00, con o sin el recibo", fixtureR4, "2026-10-31", "mora", 72_600_000, 2),
  e("R4: pagos a cuenta sin imputar 50.000,00 (1 recibo)", fixtureR4, "2026-10-31", "pagos-a-cuenta", 5_000_000, 1),
  e("R4: saldos a favor 0 (C07 tiene saldo)", fixtureR4, "2026-10-31", "saldos-a-favor", 0, 0),
  e("R4: saldo neto 676.000,00 (726.000,00 − 50.000,00)", fixtureR4, "2026-10-31", "saldo-neto", 67_600_000, 3),
  e("R4: la cobranza de octubre es el recibo de 50.000,00", fixtureR4, "2026-10-31", "cobranza-mes", 5_000_000, 1),
  e("R4: antes del recibo (19/10) no hay pago a cuenta", fixtureR4, "2026-10-19", "pagos-a-cuenta", 0, 0),

  // T07: C09, sobrepago de 58.000,00 sin comprobantes con saldo → saldo a favor, fuera de la mora
  e("T07 al 31/08: saldos a favor 58.000,00", fixtureT07, "2026-08-31", "saldos-a-favor", 5_800_000, 1),
  e("T07 al 31/08: pagos a cuenta 0 (el cliente no tiene saldo)", fixtureT07, "2026-08-31", "pagos-a-cuenta", 0, 0),
  e("T07 al 31/08: saldo 0 y mora 0", fixtureT07, "2026-08-31", "saldo", 0, 0),
  e("T07 al 31/08: saldo neto −58.000,00", fixtureT07, "2026-08-31", "saldo-neto", -5_800_000, 1),
  e("T07 al 31/07: la factura de 242.000,00 aún no vence (−14) y no hay recibo", fixtureT07, "2026-07-31", "tramo-no-vencido", 24_200_000, 1),
  e("T07 al 31/07: sin mora", fixtureT07, "2026-07-31", "mora", 0, 0),
  e("T07 al 31/07: sin saldo a favor ni pago a cuenta", fixtureT07, "2026-07-31", "saldos-a-favor", 0, 0),

  // T05: el cobro del 03/11 no existe al 31/10 (S1)
  e("T05 al 31/10: saldo 363.000,00 (el cobro del 03/11 no existe)", fixtureT05, "2026-10-31", "saldo", 36_300_000, 1),
  e("T05 al 31/10: mora 363.000,00 con 6 días de atraso", fixtureT05, "2026-10-31", "mora", 36_300_000, 1),
  e("T05 al 31/10: tramo 1–30", fixtureT05, "2026-10-31", "tramo-1-30", 36_300_000, 1),
  e("T05 al 31/10: la cobranza de octubre no incluye el recibo de noviembre", fixtureT05, "2026-10-31", "cobranza-mes", 0, 0),
  e("T05 al 03/11 (la función): saldo 0", fixtureT05, "2026-11-03", "saldo", 0, 0),
  e("T05 al 03/11: la cobranza de noviembre es 363.000,00", fixtureT05, "2026-11-03", "cobranza-mes", 36_300_000, 1),

  // T02 (S2, S6): el atraso sale del vencimiento original
  e("T02 al 31/07: tramo no vencido 810.000,00", fixtureT02, "2026-07-31", "tramo-no-vencido", 81_000_000, 1),
  e("T02 al 31/07: sin mora", fixtureT02, "2026-07-31", "mora", 0, 0),
  e("T02 al 31/08: tramo 1–30 810.000,00", fixtureT02, "2026-08-31", "tramo-1-30", 81_000_000, 1),
  e("T02 al 30/09: saldo 410.000,00", fixtureT02, "2026-09-30", "saldo", 41_000_000, 1),
  e("T02 al 30/09: tramo 31–60 410.000,00 (S6, atraso 52 aunque el último pago fue 15 días antes)", fixtureT02, "2026-09-30", "tramo-31-60", 41_000_000, 1),
  e("T02 al 30/09: no queda nada en el tramo 1–30", fixtureT02, "2026-09-30", "tramo-1-30", 0, 0),
  e("T02 al 31/10: saldo 0", fixtureT02, "2026-10-31", "saldo", 0, 0),
  e("T02 al 30/09: la cobranza de septiembre es el pago del 15/09", fixtureT02, "2026-09-30", "cobranza-mes", 40_000_000, 1),

  // T08 (R2): las retenciones cancelan deuda igual que el dinero
  e("T08 al 30/04: saldo 0 (con las retenciones; solo con el banco quedarían 40.000,00)", fixtureT08, "2026-04-30", "saldo", 0, 0),
  e("T08 al 30/04: sin mora", fixtureT08, "2026-04-30", "mora", 0, 0),
  e("T08 al 30/04: cobranza del mes 1.210.000,00 (todos los medios)", fixtureT08, "2026-04-30", "cobranza-mes", 121_000_000, 1),
  e("T08 al 30/04: de lo cual, retenciones 40.000,00", fixtureT08, "2026-04-30", "retenciones-mes", 4_000_000, 1),
  e("T08 al 31/03: saldo 1.210.000,00 y no vencido (−15)", fixtureT08, "2026-03-31", "tramo-no-vencido", 121_000_000, 1),

  // R2 con retención de IVA: el tercer medio de retención también cancela deuda y se muestra aparte
  e("R2 (IVA) al 30/04: saldo 0 (la retención de IVA cancela deuda)", fixtureRetencionIva, "2026-04-30", "saldo", 0, 0),
  e("R2 (IVA) al 30/04: cobranza del mes 1.210.000,00 (transferencia 1.190.000,00 + retención de IVA 20.000,00)", fixtureRetencionIva, "2026-04-30", "cobranza-mes", 121_000_000, 1),
  e("R2 (IVA) al 30/04: de lo cual, retenciones 20.000,00 (la de IVA)", fixtureRetencionIva, "2026-04-30", "retenciones-mes", 2_000_000, 1),

  // T17: el comprobante del recorrido
  e("T17 al 31/10: saldo 605.000,00", fixtureT17, "2026-10-31", "saldo", 60_500_000, 1),
  e("T17 al 31/10: tramo más de 90 605.000,00", fixtureT17, "2026-10-31", "tramo-mas-90", 60_500_000, 1),
  e("T17 al 30/09: tramo 31–60 726.000,00 (el cobro del 14/10 no existe)", fixtureT17, "2026-09-30", "tramo-31-60", 72_600_000, 1),
  e("T17 al 31/08: tramo 1–30 726.000,00", fixtureT17, "2026-08-31", "tramo-1-30", 72_600_000, 1),
  e("T17 al 31/07: no vencido 968.000,00 (la NC de 121.000,00 ya existe)", fixtureT17, "2026-07-31", "tramo-no-vencido", 96_800_000, 1),
  e("T17 al 31/08: cobranza del mes 242.000,00 (234.000,00 + retenciones)", fixtureT17, "2026-08-31", "cobranza-mes", 24_200_000, 1),
  e("T17 al 31/08: retenciones 5.000,00 + 3.000,00 = 8.000,00", fixtureT17, "2026-08-31", "retenciones-mes", 800_000, 1),
  e("T17 al 31/10: la cobranza de octubre es 121.000,00 sin retenciones", fixtureT17, "2026-10-31", "cobranza-mes", 12_100_000, 1),
  e("T17 al 31/10: retenciones de octubre 0", fixtureT17, "2026-10-31", "retenciones-mes", 0, 0),
  e("T17 al 31/07: facturación de julio = 900.000,00 − 100.000,00 de la NC", fixtureT17, "2026-07-31", "facturacion-mes", 80_000_000, 2),
  e("T17 al 31/07: IVA de julio = 189.000,00 − 21.000,00", fixtureT17, "2026-07-31", "iva-mes", 16_800_000, 2),
  e("T17 al 31/07: facturado con IVA de julio = 1.089.000,00 − 121.000,00", fixtureT17, "2026-07-31", "facturado-con-iva-mes", 96_800_000, 2),

  // T01 (C1, S2): una factura y su NC por el mismo importe
  e("T01 al 31/05: facturación de mayo con el par = 0 (500.000,00 − 500.000,00)", fixtureT01, "2026-05-31", "facturacion-mes", 0, 2),
  e("T01 al 31/05: saldo 0", fixtureT01, "2026-05-31", "saldo", 0, 0),
  e("T01 al 15/05: la NC (20/05) todavía no existe: facturación 500.000,00 y saldo 605.000,00", fixtureT01, "2026-05-15", "facturacion-mes", 50_000_000, 1),
  e("T01 al 15/05: saldo 605.000,00", fixtureT01, "2026-05-15", "saldo", 60_500_000, 1),
  e("T01 al 15/05: tramo no vencido (atraso −42)", fixtureT01, "2026-05-15", "tramo-no-vencido", 60_500_000, 1),

  // T03 (S3): vence el 31/07 y se cobra ese día
  e("T03 al 30/07: no vencido 242.000,00", fixtureT03, "2026-07-30", "tramo-no-vencido", 24_200_000, 1),
  e("T03 al 31/07: cobrada el día del vencimiento, saldo 0, nunca mora", fixtureT03, "2026-07-31", "saldo", 0, 0),
  e("T03 al 30/07: sin mora", fixtureT03, "2026-07-30", "mora", 0, 0),

  // T09 (C5, D3): la facturación de un cliente puede ser negativa
  e("T09: facturación de C06 en julio −500.000,00 (300.000,00 − 800.000,00)", fixtureT09, "2026-07-31", "facturacion-mes", -50_000_000, 2, { clienteId: "C06" }),
  e("T09: facturado con IVA de C06 en julio −605.000,00 (363.000,00 − 968.000,00)", fixtureT09, "2026-07-31", "facturado-con-iva-mes", -60_500_000, 2, { clienteId: "C06" }),
  e("T09: IVA de julio −105.000,00", fixtureT09, "2026-07-31", "iva-mes", -10_500_000, 2, { clienteId: "C06" }),
  e("T09: facturación de la empresa en julio, igual (el único cliente)", fixtureT09, "2026-07-31", "facturacion-mes", -50_000_000, 2),
  e("T09 al 30/06: saldo de T09-F 968.000,00 (aún sin la NC de julio)", fixtureT09, "2026-06-30", "saldo", 96_800_000, 1),
  e("T09 al 31/07: la NC cancela T09-F; queda T09-F2 de 363.000,00", fixtureT09, "2026-07-31", "saldo", 36_300_000, 1),

  // T10 (M2, D3): el IVA del período es la suma de los IVA
  e("T10: IVA de febrero de 2025 630,33 (no 630,32)", fixtureT10, "2025-02-28", "iva-mes", 63_033, 3),
  e("T10: facturación de febrero 3.001,50", fixtureT10, "2025-02-28", "facturacion-mes", 300_150, 3),
  e("T10: facturado con IVA 3.631,83 (= 3.001,50 + 630,33)", fixtureT10, "2025-02-28", "facturado-con-iva-mes", 363_183, 3),

  // T13 (C5): diciembre y enero
  e("T13 al 31/12/2025: la factura del 31/12 es de diciembre", fixtureT13, "2025-12-31", "facturacion-mes", 10_000_000, 1),
  e("T13 al 31/01/2026: la del 01/01 es de enero (y la de diciembre no)", fixtureT13, "2026-01-31", "facturacion-mes", 12_000_000, 1),
  e("T13 al 31/01/2026: saldo 121.000,00 + 145.200,00", fixtureT13, "2026-01-31", "saldo", 26_620_000, 2),
  e("T13 al 28/02/2026: cobradas, saldo 0", fixtureT13, "2026-02-28", "saldo", 0, 0),

  // T14 (S1, S7): el mes del corte, con lo que existe al corte
  e("T14 al 30/09: facturación de septiembre incluye T14-F1 (emitida ese día)", fixtureT14, "2026-09-30", "facturacion-mes", 10_000_000, 1),
  e("T14 al 31/10: facturación de octubre incluye T14-F2 y no T14-F1", fixtureT14, "2026-10-31", "facturacion-mes", 10_000_000, 1),
  e("T14 al 31/10 con mes=2026-09: mes completo, incluye T14-F1", fixtureT14, "2026-10-31", "facturacion-mes", 10_000_000, 1, { mes: "2026-09" }),
  e("T14 al 30/09: facturado con IVA de septiembre 121.000,00", fixtureT14, "2026-09-30", "facturado-con-iva-mes", 12_100_000, 1),
  e("T14 al 31/10: saldo 0 (las dos cobradas)", fixtureT14, "2026-10-31", "saldo", 0, 0),

  // T16 (C1): una ND tiene su propio saldo y vencimiento
  e("T16 al 30/04: la ND suma 24.000,00 a la facturación de abril", fixtureT16, "2026-04-30", "facturacion-mes", 2_400_000, 1),
  e("T16 al 30/04: saldo de la ND 29.040,00 (la factura se cobró el 09/04), atraso −2", fixtureT16, "2026-04-30", "tramo-no-vencido", 2_904_000, 1),
  e("T16 al 31/05: la ND con atraso 29 está en mora, tramo 1–30", fixtureT16, "2026-05-31", "tramo-1-30", 2_904_000, 1),
  e("T16 al 30/06: la ND cobrada el 15/06, saldo 0", fixtureT16, "2026-06-30", "saldo", 0, 0),

  // D3: el ejemplo chico (una factura de 242.000,00 y un recibo que imputa 100.000,00 y deja 50.000,00 a cuenta)
  e("D3 (ejemplo chico) al 31/03: saldo S = 142.000,00", fixtureEjemploD3, "2026-03-31", "saldo", 14_200_000, 1),
  e("D3 al 31/03: pagos a cuenta A = 50.000,00", fixtureEjemploD3, "2026-03-31", "pagos-a-cuenta", 5_000_000, 1),
  e("D3 al 31/03: saldo neto 92.000,00", fixtureEjemploD3, "2026-03-31", "saldo-neto", 9_200_000, 2),
  e("D3 al 31/03: cobranza de marzo 150.000,00", fixtureEjemploD3, "2026-03-31", "cobranza-mes", 15_000_000, 1),
];
