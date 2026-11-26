// Navegación de la aplicación (docs/diseno-ui.md, sección 4): de una ruta, qué sección queda marcada, si es una pantalla raíz,
// el camino de migas y el padre. Puro y **sin texto**: cada miga dice qué es (una sección, un cliente, un comprobante, un desglose) y a dónde lleva; los
// nombres que se ven los pone la capa de rótulos. Escrito de nuevo para esta demo (docs/procedencia.md).

import { esClaveDelMes } from "../dominio/claves.ts";
import { mesDelCorte } from "../dominio/corte.ts";
import type { ClaveDeMedida, Datos, FechaCivil } from "../dominio/tipos.ts";
import type { Ruta, RutaNavegable } from "./enrutador.ts";

/** Las cuatro secciones que son una pestaña, en el orden de la barra. «Cómo se calcula» queda aparte. */
export const SECCIONES = ["resumen", "comprobantes", "clientes", "meses"] as const;
export type Seccion = (typeof SECCIONES)[number];

/**
 * ¿Se llegó a un comprobante desde la lista de Comprobantes? `anteriores` son las pantallas del recorrido anteriores a la actual, de la más vieja a la más
 * reciente. Un cliente o un comprobante no cuentan como origen (son detalles): se sigue hacia atrás hasta la primera pantalla de otra clase, y decide esa.
 * Sin pantalla anterior (un enlace directo) no hay origen: `false`.
 */
export function llegoDesdeComprobantes(anteriores: readonly Ruta[]): boolean {
  const origen = anteriores.findLast((r) => r.tipo !== "cliente" && r.tipo !== "comprobante");
  return origen?.tipo === "comprobantes";
}

/**
 * La sección que queda marcada, siempre la misma que dice la primera miga (`migasDe`). Un cliente cuelga de Clientes; un comprobante, de Clientes, o de
 * Comprobantes si `desdeComprobantes` (se llegó desde esa lista); un desglose, de Meses si la medida es del mes y del Resumen si no. «Cómo se calcula» y
 * los errores no marcan ninguna.
 */
export function seccionDe(ruta: Ruta, desdeComprobantes = false): Seccion | null {
  switch (ruta.tipo) {
    case "resumen":
    case "comprobantes":
    case "clientes":
    case "meses":
      return ruta.tipo;
    case "comprobante":
      return desdeComprobantes ? "comprobantes" : "clientes";
    case "cliente":
      return "clientes";
    case "desglose":
      return esClaveDelMes(ruta.clave) ? "meses" : "resumen";
    case "como-se-calcula":
    case "inexistente":
    case "desconocida":
      return null;
  }
}

/** Las cuatro pantallas que son una pestaña: ahí la barra del celular muestra la marca y no el botón «Atrás». */
export function esRaiz(ruta: Ruta): boolean {
  return ruta.tipo === "resumen" || ruta.tipo === "comprobantes" || ruta.tipo === "clientes" || ruta.tipo === "meses";
}

/**
 * ¿La barra del celular ofrece el botón «Cómo se calcula»? Sí, salvo que se muestre «Atrás» (fuera de las pantallas raíz) y ese «Atrás» ya lleve a
 * «Cómo se calcula»: serían dos botones con el mismo nombre uno al lado del otro.
 */
export function ofreceAyudaEnLaBarra(enPantallaRaiz: boolean, destinoDeAtras: RutaNavegable): boolean {
  return enPantallaRaiz || destinoDeAtras.tipo !== "como-se-calcula";
}

/** Qué es una miga. El texto que se ve no está acá. */
export type Miga =
  | { que: "seccion"; seccion: Seccion }
  | { que: "como-se-calcula" }
  | { que: "cliente"; clienteId: string }
  | { que: "comprobante"; comprobanteId: string }
  /** `mes` (`AAAA-MM`) solo en las medidas del mes: el pedido en la dirección o, si no, el del corte. */
  | { que: "desglose"; clave: ClaveDeMedida; mes?: string }
  | { que: "error" };

export interface PasoDeMigas {
  miga: Miga;
  /** A dónde lleva. `null` en el último paso (la pantalla actual). */
  destino: RutaNavegable | null;
}

const RESUMEN: RutaNavegable = { tipo: "resumen" };

/**
 * El camino hasta la pantalla (diseno-ui, sección 4; la miga del desglose de una medida del mes cuelga de Meses, no del Resumen):
 * - una raíz, «Cómo se calcula» o un error: un solo paso;
 * - un cliente: Clientes → cliente; un comprobante: Clientes → su cliente → comprobante, o, si se llegó desde la lista de Comprobantes
 *   (`desdeComprobantes`), Comprobantes → comprobante;
 * - un desglose: Resumen o Meses → desglose; con `cliente=`, → el cliente. La miga del desglose lleva al desglose de todos (con su mes, sin `cliente=`
 *   ni `agrupar`).
 * `corte` solo sirve para saber qué mes muestra el desglose de una medida del mes cuando la dirección no trae `mes=`.
 */
export function migasDe(ruta: Ruta, datos: Pick<Datos, "comprobantes">, corte: FechaCivil, desdeComprobantes = false): PasoDeMigas[] {
  switch (ruta.tipo) {
    case "resumen":
    case "comprobantes":
    case "clientes":
    case "meses":
      return [{ miga: { que: "seccion", seccion: ruta.tipo }, destino: null }];
    case "como-se-calcula":
      return [{ miga: { que: "como-se-calcula" }, destino: null }];
    case "inexistente":
    case "desconocida":
      return [{ miga: { que: "error" }, destino: null }];
    case "cliente":
      return [paso({ que: "seccion", seccion: "clientes" }, { tipo: "clientes" }), paso({ que: "cliente", clienteId: ruta.clienteId }, null)];
    case "comprobante": {
      if (desdeComprobantes) return [paso({ que: "seccion", seccion: "comprobantes" }, { tipo: "comprobantes" }), paso({ que: "comprobante", comprobanteId: ruta.comprobanteId }, null)];
      const clienteId = datos.comprobantes.find((c) => c.id === ruta.comprobanteId)?.clienteId;
      const pasos = [paso({ que: "seccion", seccion: "clientes" }, { tipo: "clientes" })];
      // Un comprobante que no está en los datos no puede pasar por el enrutador; si llega una ruta armada a mano, no se inventa un cliente.
      if (clienteId !== undefined) pasos.push(paso({ que: "cliente", clienteId }, { tipo: "cliente", clienteId }));
      pasos.push(paso({ que: "comprobante", comprobanteId: ruta.comprobanteId }, null));
      return pasos;
    }
    case "desglose": {
      const delMes = esClaveDelMes(ruta.clave);
      const base: PasoDeMigas = delMes ? paso({ que: "seccion", seccion: "meses" }, { tipo: "meses" }) : paso({ que: "seccion", seccion: "resumen" }, RESUMEN);
      const miga: Miga = delMes ? { que: "desglose", clave: ruta.clave, mes: ruta.mes ?? mesDelCorte(corte) } : { que: "desglose", clave: ruta.clave };
      if (ruta.clienteId === undefined) return [base, paso(miga, null)];
      const deTodos: RutaNavegable = ruta.mes === undefined ? { tipo: "desglose", clave: ruta.clave } : { tipo: "desglose", clave: ruta.clave, mes: ruta.mes };
      return [base, paso(miga, deTodos), paso({ que: "cliente", clienteId: ruta.clienteId }, null)];
    }
  }
}

function paso(miga: Miga, destino: RutaNavegable | null): PasoDeMigas {
  return { miga, destino };
}

/** A dónde vuelve «Atrás» cuando no hay una pantalla anterior en la pila (un enlace directo): la miga anterior, o el Resumen. */
export function padreDe(ruta: Ruta, datos: Pick<Datos, "comprobantes">, corte: FechaCivil, desdeComprobantes = false): RutaNavegable {
  const pasos = migasDe(ruta, datos, corte, desdeComprobantes);
  return pasos.at(-2)?.destino ?? RESUMEN;
}
