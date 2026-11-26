// Cómo se dibuja cada tramo de antigüedad en cualquier pantalla (listas, etiquetas, desglose): el número que elige el color (`--c-tramo-N`) y el tono de la etiqueta.
// Es solo presentación: el tramo de cada comprobante lo decide el dominio (A1). No vencido es neutro, de 1 a 60 días
// es «revisar» (ámbar) y de más de 60 días es «diferencia» (rojo); el color nunca va solo (la etiqueta escribe el rótulo del tramo).
// Es el único lugar donde viven estos dos mapas: las pantallas importan de acá y no escriben el suyo.

import type { Tramo } from "../lib/dominio/antiguedad.ts";
import type { NumeroDeTramo, Tono } from "./tipos.ts";

export const NUMERO_DE_TRAMO: Readonly<Record<Tramo, NumeroDeTramo>> = {
  "no-vencido": 0,
  "1-30": 1,
  "31-60": 2,
  "61-90": 3,
  "mas-90": 4,
};

export const TONO_DE_TRAMO: Readonly<Record<Tramo, Tono>> = {
  "no-vencido": "neutro",
  "1-30": "revisar",
  "31-60": "revisar",
  "61-90": "diferencia",
  "mas-90": "diferencia",
};

/** El número del tramo (0 a 4): elige su color y la muestra de la etiqueta. */
export function numeroDeTramo(tramo: Tramo): NumeroDeTramo {
  return NUMERO_DE_TRAMO[tramo];
}

/** El tono de la etiqueta de un tramo: gris (no vencido), ámbar (hasta 60 días) o rojo (más de 60). El color nunca va solo: la etiqueta dice el tramo escrito. */
export function tonoDeTramo(tramo: Tramo): Tono {
  return TONO_DE_TRAMO[tramo];
}
