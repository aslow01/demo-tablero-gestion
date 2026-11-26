// Memoria de la vista (docs/diseno-ui.md, sección 6): lo que la pantalla recuerda entre una visita y la siguiente dentro de la
// sesión: la fila que se abrió (para marcarla al volver), la solapa de cada cliente y el orden de cada medida. Vive solo en memoria: no se escribe en
// ningún almacenamiento ni en la dirección, y se pierde al recargar. Las pantallas LEEN de acá y llaman a `elegir…`; el marco avisa con `alVerRuta`.

import type { ClaveDeMedida } from "../dominio/tipos.ts";
import { ordenPorDefecto } from "../dominio/orden.ts";
import type { CriterioDeOrden } from "../dominio/orden.ts";
import { idDeVista } from "./enrutador.ts";
import type { Ruta } from "./enrutador.ts";
import { esRaiz, seccionDe } from "./navegacion.ts";
import type { Seccion } from "./navegacion.ts";

/** Las solapas de la ficha de un cliente, en orden. La primera es la que se ve al entrar. */
export const SOLAPAS_DE_CLIENTE = ["saldo", "recibos", "cuenta"] as const;
export type SolapaDeCliente = (typeof SOLAPAS_DE_CLIENTE)[number];

/** La última fila que se abrió: un cliente, o un comprobante (con su cliente). */
export interface FilaElegida {
  clienteId?: string;
  comprobanteId?: string;
}

export interface MemoriaDeVista {
  /**
   * La fila que se abrió desde `ruta`, o `null` si la última se abrió desde otra pantalla: la marca «última fila abierta» vale solo donde se la abrió.
   * Dos rutas son la misma pantalla si tienen el mismo `idDeVista` (cambiar el filtro, la búsqueda o el corte no cambia de pantalla).
   */
  filaElegidaEn(ruta: Ruta): FilaElegida | null;
  /**
   * Recuerda `fila` como la última abierta; `desde` es la pantalla en la que estaba quien la abrió (la anterior del recorrido). Con `null` (se entró con un
   * enlace directo: no se abrió desde ninguna tabla) no queda ninguna fila marcada.
   */
  elegirFila(fila: FilaElegida, desde: Ruta | null): void;
  vaciarFila(): void;
  /** La solapa de ese cliente; `saldo` si no se eligió otra. */
  solapaDe(clienteId: string): SolapaDeCliente;
  elegirSolapa(clienteId: string, solapa: SolapaDeCliente): void;
  /** El orden de las partidas de esa medida: el elegido o, si no, el por defecto. */
  ordenDe(clave: ClaveDeMedida): CriterioDeOrden;
  elegirOrden(clave: ClaveDeMedida, criterio: CriterioDeOrden): void;
  /**
   * Avisa qué ruta se ve ahora. La fila elegida se vacía cuando se pasa de una pestaña a otra (de una raíz a otra raíz de distinta sección): al abrir un
   * detalle y volver, o al filtrar la lista, sigue marcada. Solo las raíces cuentan: «Cómo se calcula», los desgloses y los errores no cambian de sección.
   */
  alVerRuta(ruta: Ruta): void;
}

export function crearMemoriaDeVista(): MemoriaDeVista {
  // La fila y el `idDeVista` de la pantalla desde la que se abrió.
  let abierta = $state.raw<{ fila: FilaElegida; desde: string } | null>(null);
  // `Map` y no un objeto: las claves son ids de la dirección, y con un objeto `__proto__` sería un problema. Se reemplaza entero para avisar del cambio.
  let solapas = $state.raw<ReadonlyMap<string, SolapaDeCliente>>(new Map());
  let ordenes = $state.raw<ReadonlyMap<ClaveDeMedida, CriterioDeOrden>>(new Map());
  let ultimaRaiz: Seccion | null = null;

  return {
    filaElegidaEn(ruta) {
      return abierta !== null && abierta.desde === idDeVista(ruta) ? abierta.fila : null;
    },
    elegirFila(nueva, desde) {
      abierta = desde === null ? null : { fila: nueva, desde: idDeVista(desde) };
    },
    vaciarFila() {
      abierta = null;
    },
    solapaDe(clienteId) {
      return solapas.get(clienteId) ?? "saldo";
    },
    elegirSolapa(clienteId, solapa) {
      solapas = new Map(solapas).set(clienteId, solapa);
    },
    ordenDe(clave) {
      return ordenes.get(clave) ?? ordenPorDefecto(clave);
    },
    elegirOrden(clave, criterio) {
      ordenes = new Map(ordenes).set(clave, criterio);
    },
    alVerRuta(ruta) {
      if (!esRaiz(ruta)) return;
      const seccion = seccionDe(ruta);
      if (ultimaRaiz !== null && ultimaRaiz !== seccion) abierta = null;
      ultimaRaiz = seccion;
    },
  };
}
