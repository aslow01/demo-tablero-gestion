// Ayudas de las pantallas Cliente, Comprobante y Desglose (y de sus subcomponentes): el destino de una cifra y su nombre para lectores de pantalla. Cómo se pintan los tramos
// vive en `componentes/tramos.ts`.
// No calculan nada del dominio ni escriben un texto nuevo: arman con lo que ya dan los modelos de vista y los módulos de textos.

import { tituloDeDesglose } from "../../lib/dominio/textos.ts";
import type { Datos, FechaCivil } from "../../lib/dominio/tipos.ts";
import type { RutaNavegable } from "../../lib/estado/enrutador.ts";
import { razonSocialDe } from "../../lib/vistas/rotulos.ts";
import type { RefDeMedida } from "../../lib/vistas/tipos.ts";

/** El desglose de una medida: `#/desglose/{clave}` con el cliente y el mes si la cifra los trae. */
export function rutaDeDesglose(ref: RefDeMedida): RutaNavegable {
  const ruta: Extract<RutaNavegable, { tipo: "desglose" }> = { tipo: "desglose", clave: ref.clave };
  if (ref.clienteId !== undefined) ruta.clienteId = ref.clienteId;
  if (ref.mes !== undefined) ruta.mes = ref.mes;
  return ruta;
}

/**
 * Qué cifra es, dicho en palabras, para el nombre accesible de un enlace: el título del desglose y, si es de un cliente, su razón social
 * («Saldo a cobrar al 31/10/2026 · Minera Ejemplo S.A.»). El separador es el mismo que usan las migas y el título de la pestaña.
 */
export function nombreDeCifra(datos: Pick<Datos, "clientes">, ref: RefDeMedida, corte: FechaCivil): string {
  const titulo = tituloDeDesglose(ref.clave, corte, ref.mes);
  return ref.clienteId === undefined ? titulo : `${titulo} · ${razonSocialDe(datos, ref.clienteId)}`;
}
