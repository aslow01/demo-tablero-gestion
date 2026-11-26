// Las claves del catálogo de medidas (docs/diseno.md, 4.2) agrupadas, y qué medios de cobro son retenciones (R2). Es el único módulo de
// definiciones que comparten los dos caminos de cálculo (agregados.ts y partidas.ts), a propósito: las claves son nombres, pero `esRetencion`
// decide qué importes entran en «de lo cual, retenciones», o sea que es una definición, y los tests la prueban con números (tests/claves.test.ts).

import type { ClaveDeMedida, Medio } from "./tipos.ts";

/** Las cinco medidas «del mes» (S7): usan el mes del corte, o el `mes` del filtro (4.3). */
export const CLAVES_DEL_MES = ["facturacion-mes", "facturado-con-iva-mes", "iva-mes", "cobranza-mes", "retenciones-mes"] as const;
export type ClaveDelMes = (typeof CLAVES_DEL_MES)[number];

export function esClaveDelMes(clave: ClaveDeMedida): clave is ClaveDelMes {
  return (CLAVES_DEL_MES as readonly string[]).includes(clave);
}

/** Las 15 claves del catálogo (4.2), en el orden de la tabla. `mora-otros` no está: existe solo con más de 5 deudores (M4). */
export const CLAVES_DEL_CATALOGO = [
  ...CLAVES_DEL_MES,
  "saldo",
  "mora",
  "tramo-no-vencido",
  "tramo-1-30",
  "tramo-31-60",
  "tramo-61-90",
  "tramo-mas-90",
  "pagos-a-cuenta",
  "saldos-a-favor",
  "saldo-neto",
] as const satisfies readonly ClaveDeMedida[];

/** Todas las claves, incluida `mora-otros`. */
export const TODAS_LAS_CLAVES: readonly ClaveDeMedida[] = [...CLAVES_DEL_CATALOGO, "mora-otros"];

/**
 * R2, medio por medio: `Record<Medio, boolean>` obliga a decidir cada medio (un medio nuevo en el tipo `Medio` no compila hasta que se lo clasifica).
 * Las retenciones cancelan deuda igual que el dinero y se muestran aparte en «de lo cual, retenciones».
 */
const ES_RETENCION: Readonly<Record<Medio, boolean>> = {
  transferencia: false,
  cheque: false,
  "retencion-iibb": true,
  "retencion-ganancias": true,
  "retencion-iva": true,
};

/** Los cinco medios de cobro, en el orden del tipo `Medio`. */
export const MEDIOS = Object.keys(ES_RETENCION) as readonly Medio[];

/** Los medios que son retenciones (R2), en el orden de `MEDIOS`. */
export const MEDIOS_DE_RETENCION: readonly Medio[] = MEDIOS.filter((medio) => ES_RETENCION[medio]);

export function esRetencion(medio: Medio): boolean {
  return ES_RETENCION[medio];
}
