// Las constantes de los datos de ejemplo (docs/diseno.md, 5.2): calendario fijo, semilla publicada y punto de venta.

/** La semilla de los datos que se publican (y la del resultado de referencia, G3). */
export const SEMILLA_PUBLICADA = 20261122;

/** Primer día del calendario fijo (no se corre con «hoy»: el número de la captura del README es el de la demo en vivo). */
export const DESDE = "2025-01-01";

/** Último día del calendario fijo, y corte por defecto. Solo el cobro de T05-F (2026-11-03) es posterior (G2). */
export const HASTA = "2026-10-31";

/** Punto de venta de la empresa ficticia. */
export const PUNTO_DE_VENTA = 3;
