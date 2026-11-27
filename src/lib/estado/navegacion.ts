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

/** La pantalla de la que se salió para abrir un comprobante, cuando la miga y el menú tienen que decirlo: la lista de Comprobantes o un desglose. */
export type OrigenDeComprobante = Extract<RutaNavegable, { tipo: "comprobantes" | "desglose" }>;

/**
 * ¿Desde dónde se llegó a un comprobante? `anteriores` son las pantallas del recorrido anteriores a la actual, de la más vieja a la más reciente. Un cliente o
 * un comprobante no cuentan como origen (son detalles): se sigue hacia atrás hasta la primera pantalla de otra clase, y decide esa. Si es la lista de
 * Comprobantes o un desglose, es el origen; si es otra cosa, o no hay pantalla anterior (un enlace directo), no hay origen: `null`.
 */
export function origenDeComprobante(anteriores: readonly Ruta[]): OrigenDeComprobante | null {
  const origen = anteriores.findLast((r) => r.tipo !== "cliente" && r.tipo !== "comprobante");
  return origen?.tipo === "comprobantes" || origen?.tipo === "desglose" ? origen : null;
}

/**
 * La sección que queda marcada, siempre la misma que dice la primera miga (`migasDe`). Un cliente cuelga de Clientes; un comprobante, de Clientes, o, si se
 * llegó con `origen`, de la sección de esa pantalla (Comprobantes, Meses o el Resumen); un desglose, de Meses si la medida es del mes y del Resumen si no.
 * «Cómo se calcula» y los errores no marcan ninguna.
 */
export function seccionDe(ruta: Ruta, origen: OrigenDeComprobante | null = null): Seccion | null {
  switch (ruta.tipo) {
    case "resumen":
    case "comprobantes":
    case "clientes":
    case "meses":
      return ruta.tipo;
    case "comprobante":
      return origen === null ? "clientes" : seccionDe(origen);
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
 * - un cliente: Clientes → cliente; un comprobante: Clientes → su cliente → comprobante, o, si se llegó desde otra pantalla (`origen`), el camino de esa
 *   pantalla → comprobante: Comprobantes → comprobante, o el de un desglose (que termina en la miga que lleva de vuelta a ese mismo desglose);
 * - un desglose: Resumen o Meses → desglose; con `cliente=`, → el cliente. La miga del desglose lleva al desglose de todos (con su mes, sin `cliente=`
 *   ni `agrupar`).
 * `corte` solo sirve para saber qué mes muestra el desglose de una medida del mes cuando la dirección no trae `mes=`.
 */
export function migasDe(ruta: Ruta, datos: Pick<Datos, "comprobantes">, corte: FechaCivil, origen: OrigenDeComprobante | null = null): PasoDeMigas[] {
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
      const actual = paso({ que: "comprobante", comprobanteId: ruta.comprobanteId }, null);
      if (origen?.tipo === "comprobantes") return [paso({ que: "seccion", seccion: "comprobantes" }, { tipo: "comprobantes" }), actual];
      if (origen?.tipo === "desglose") {
        // El camino del desglose, con su último paso (que era la pantalla actual y no llevaba a ningún lado) apuntando al desglose del que se salió.
        const delDesglose = migasDe(origen, datos, corte);
        const ultimo = delDesglose.pop();
        if (ultimo === undefined) return [actual];
        return [...delDesglose, paso(ultimo.miga, origen), actual];
      }
      const clienteId = datos.comprobantes.find((c) => c.id === ruta.comprobanteId)?.clienteId;
      const pasos = [paso({ que: "seccion", seccion: "clientes" }, { tipo: "clientes" })];
      // Un comprobante que no está en los datos no puede pasar por el enrutador; si llega una ruta armada a mano, no se inventa un cliente.
      if (clienteId !== undefined) pasos.push(paso({ que: "cliente", clienteId }, { tipo: "cliente", clienteId }));
      pasos.push(actual);
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
export function padreDe(ruta: Ruta, datos: Pick<Datos, "comprobantes">, corte: FechaCivil, origen: OrigenDeComprobante | null = null): RutaNavegable {
  const pasos = migasDe(ruta, datos, corte, origen);
  return pasos.at(-2)?.destino ?? RESUMEN;
}
