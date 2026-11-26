// El resultado de referencia de la semilla publicada al corte por defecto (docs/diseno.md, 5.4 y G3). **Solo vale para la semilla 20261122**: para
// cualquier otra valen los invariantes (D2, D3, A2, G2, G5), no estos valores. Se calcularon **después de generar**, con el oráculo independiente
// (`scripts/oraculo.mjs`, que no importa nada del dominio; `node scripts/referencia.mjs` los imprime) y se comprobaron con los dos caminos de
// cálculo y `controlar` en `tests/referencia.test.ts`. Si cambia el generador (o la semilla), ese test falla hasta que se actualiza a propósito.
//
// Importes en centavos enteros; porcentajes en milésimas (M3: 221 es 22,1 %). Las constantes alimentan también «Cómo se calcula» (un test las compara).

import type { Tramo } from "../dominio/antiguedad.ts";

export const ESPERADO = {
  semilla: 20261122,
  /** Huella FNV-1a de los datos (G1): el único lugar del código donde está escrita; la usan los tests de generador y referencia, y un test vigila que el README la cite igual. */
  huella: "e9274f2c",
  corte: "2026-10-31",
  cantidades: { comprobantes: 690, recibos: 618 },

  /** Saldo a cobrar (con IVA) y saldo neto (saldo − pagos a cuenta − saldos a favor). */
  saldo: 2_851_366_210,
  saldoNeto: 2_840_566_210,

  /** En mora: importe, comprobantes con saldo vencido, clientes con mora y el «% de lo que hay por cobrar» (M3, a la milésima). */
  mora: { importe: 630_648_128, comprobantes: 16, clientes: 6, milesimasDelSaldo: 221 },

  /** Antigüedad del saldo (A1). «Más de 90» es exacto por construcción: solo T12-d91. */
  tramos: { "no-vencido": 2_220_718_082, "1-30": 455_283_433, "31-60": 2_324_168, "61-90": 112_540_527, "mas-90": 60_500_000 } satisfies Record<Tramo, number>,
  milesimasDeTramos: { "no-vencido": 779, "1-30": 160, "31-60": 1, "61-90": 39, "mas-90": 21 } satisfies Record<Tramo, number>,

  /**
   * Los clientes con mora, del mayor al menor (el empate, por razón social). Con esta semilla son **seis**: hay más de cinco y «Otros» existe (M4); es
   * C07, el sexto. La semilla se eligió por eso (ver el registro y el README).
   */
  deudores: [
    { clienteId: "C05", importe: 344_607_879, milesimas: 547, diasDelMasAtrasado: 91, tramoMasAntiguo: "mas-90" },
    { clienteId: "C11", importe: 118_462_872, milesimas: 188, diasDelMasAtrasado: 25, tramoMasAntiguo: "1-30" },
    { clienteId: "C10", importe: 94_205_155, milesimas: 149, diasDelMasAtrasado: 16, tramoMasAntiguo: "1-30" },
    { clienteId: "C03", importe: 53_028_250, milesimas: 84, diasDelMasAtrasado: 10, tramoMasAntiguo: "1-30" },
    { clienteId: "C02", importe: 13_166_373, milesimas: 21, diasDelMasAtrasado: 15, tramoMasAntiguo: "1-30" },
    { clienteId: "C07", importe: 7_177_599, milesimas: 11, diasDelMasAtrasado: 21, tramoMasAntiguo: "1-30" },
  ] satisfies readonly { clienteId: string; importe: number; milesimas: number; diasDelMasAtrasado: number; tramoMasAntiguo: Tramo }[],
  /** «Otros» (M4): existe con más de cinco deudores. Acá es solo C07: un comprobante, el sexto cliente del ranking. */
  hayOtros: true,
  otros: { importe: 7_177_599, clientes: 1, comprobantes: 1 },

  /** El cliente con más mora y su comprobante más atrasado (T12-d91, 91 días: el único por encima de 90). */
  clienteConMasMora: "C05",
  comprobanteMasAtrasado: { alias: "T12-d91", dias: 91 },

  /** Pagos a cuenta sin imputar (T06, C07: «Revisar imputación») y saldos a favor (T07, C09): exactos por construcción. */
  pagosACuenta: { importe: 5_000_000, clienteId: "C07", reciboAlias: "T06-R" },
  saldosAFavor: { importe: 5_800_000, clienteId: "C09" },

  /** Octubre de 2026 (el mes del corte), con lo que existe al 31/10. */
  octubre: {
    facturacion: 1_570_591_400,
    iva: 329_824_194,
    facturadoConIva: 1_900_415_594,
    cobranza: 2_384_759_051,
    retenciones: 15_297_281,
    comprobantes: 30,
    recibos: 37,
  },

  /** C05 (el cliente del recorrido) al 31/10. */
  c05: { saldo: 487_604_469, mora: 344_607_879, comprobantesConSaldo: 13, recibos: 45, movimientos: 102, enMoraComprobantes: 9 },
} as const;
