// El punto de carga de los datos de la demo. Corre `validarDatos` **una vez**, al cargar: un dato dañado (por ejemplo una
// NC asociada a una nota de débito, que ningún control cruzado ve porque los dos caminos la restan de la ND) se informa en vez de calcularse en
// silencio, y la interfaz muestra la pantalla de error. Los datos que pasan quedan congelados a fondo (los índices por conjunto suponen que no cambian).
// La demo no carga datos del usuario: lo único que se carga son los datos de ejemplo del generador.

import type { Datos } from "../dominio/tipos.ts";
import { validarDatos } from "../dominio/validadores.ts";
import type { Problema } from "../dominio/validadores.ts";
import { SEMILLA_PUBLICADA } from "./constantes.ts";
import { congelar } from "./congelar.ts";
import { generar } from "./generador.ts";
import type { Generado } from "./generador.ts";
import type { Plantados } from "./plantados.ts";

export type Cargado = { estado: "ok"; datos: Datos } | { estado: "error"; problemas: Problema[]; mensaje: string };

/** Cuántos problemas se nombran en el mensaje; el resto se cuenta. */
const PROBLEMAS_EN_EL_MENSAJE = 3;

function mensajeDe(problemas: readonly Problema[]): string {
  const primeros = problemas.slice(0, PROBLEMAS_EN_EL_MENSAJE).map((p) => `${p.regla} (${p.dato}): ${p.mensaje}`);
  const resto = problemas.length - primeros.length;
  const cola = resto > 0 ? ` Y ${resto} problema${resto === 1 ? "" : "s"} más.` : "";
  return `Los datos de ejemplo no pasan las validaciones y no se calcula nada con ellos. ${primeros.join(" ")}${cola}`;
}

/**
 * Valida un conjunto de datos: si no hay problemas, lo entrega congelado; si los hay, los informa y no entrega nada. **Congela el objeto que recibe**
 * (no una copia): quien pase uno compartido lo deja congelado para todos. El generador arma uno nuevo en cada llamada, así que hoy no pasa.
 */
export function cargarDatos(datos: Datos): Cargado {
  const problemas = validarDatos(datos);
  if (problemas.length > 0) return { estado: "error", problemas, mensaje: mensajeDe(problemas) };
  return { estado: "ok", datos: congelar(datos) };
}

/** Los datos de ejemplo cargados: además de los datos, los alias de los casos plantados (5.3) → su id, que «Cómo se calcula» enlaza. */
export type CargadoDeEjemplo = (Extract<Cargado, { estado: "ok" }> & { plantados: Plantados }) | Extract<Cargado, { estado: "error" }>;

/**
 * Genera los datos de ejemplo (la semilla publicada por defecto) y los carga. `generador` se puede reemplazar en los tests. Si los datos
 * pasan, entrega también los casos plantados, congelados como ellos; si no, solo el error (no hay nada que enlazar).
 */
export function cargarDatosDeEjemplo(semilla: number = SEMILLA_PUBLICADA, generador: (semilla: number) => Generado = generar): CargadoDeEjemplo {
  const generado = generador(semilla);
  const cargado = cargarDatos(generado.datos);
  return cargado.estado === "ok" ? { ...cargado, plantados: congelar({ ...generado.plantados }) } : cargado;
}
