// Huella del conjunto de datos (docs/diseno.md, G1 y 5.2): FNV-1a de 32 bits sobre los bytes UTF-8 del JSON canónico de `Datos`, en hexadecimal de
// 8 cifras en minúscula. Sirve para saber que los datos de ejemplo son exactamente los de siempre: va fijada en un test y publicada en el README
// (no se muestra en la interfaz). No es criptografía: detecta cambios, no ataques.

import type { Comprobante, Datos, Recibo } from "../dominio/tipos.ts";

const BASE_DE_OFFSET = 0x811c9dc5;
const PRIMO = 0x01000193;

/** FNV-1a de 32 bits de los bytes UTF-8 del texto, en hexadecimal de 8 cifras. */
export function fnv1a(texto: string): string {
  let hash = BASE_DE_OFFSET;
  for (const byte of new TextEncoder().encode(texto)) {
    hash = Math.imul(hash ^ byte, PRIMO) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

// Las claves se escriben una por una, en el orden de las interfaces de la sección 4: así el orden no depende de cómo se armó cada objeto.
const comprobante = (c: Comprobante) => ({
  id: c.id,
  tipo: c.tipo,
  puntoVenta: c.puntoVenta,
  numero: c.numero,
  clienteId: c.clienteId,
  emision: c.emision,
  vencimiento: c.vencimiento,
  servicio: c.servicio,
  neto: c.neto,
  iva: c.iva,
  total: c.total,
  asociadoA: c.asociadoA,
});

const recibo = (r: Recibo) => ({
  id: r.id,
  clienteId: r.clienteId,
  fecha: r.fecha,
  medios: r.medios.map((m) => ({ medio: m.medio, importe: m.importe })),
  imputaciones: r.imputaciones.map((i) => ({ comprobanteId: i.comprobanteId, importe: i.importe })),
});

/** El JSON canónico de los datos: claves en el orden de las interfaces, sin espacios, listas en el orden de numeración. */
export function jsonCanonico(datos: Datos): string {
  return JSON.stringify({
    version: datos.version,
    semilla: datos.semilla,
    desde: datos.desde,
    hasta: datos.hasta,
    empresa: { nombre: datos.empresa.nombre, cuit: datos.empresa.cuit, puntoVenta: datos.empresa.puntoVenta },
    clientes: datos.clientes.map((c) => ({ id: c.id, razonSocial: c.razonSocial, cuit: c.cuit, plazoDias: c.plazoDias })),
    comprobantes: datos.comprobantes.map(comprobante),
    recibos: datos.recibos.map(recibo),
  });
}

/** La huella de un conjunto de datos (G1). */
export function huellaDe(datos: Datos): string {
  return fnv1a(jsonCanonico(datos));
}
