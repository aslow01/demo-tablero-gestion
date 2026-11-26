// Los datos de ejemplo de la semilla publicada (20261122), cargados como los carga la demo (validados y congelados), para las pruebas de los modelos de
// vista: son los mismos datos que ve quien abre la página, y sus cifras están fijadas en `src/lib/datos/esperado.ts`.
import { cargarDatosDeEjemplo } from "../../src/lib/datos/cargar.ts";

const cargado = cargarDatosDeEjemplo();
if (cargado.estado !== "ok") throw new Error(cargado.mensaje);

/** Los datos de la semilla publicada. */
export const DATOS = cargado.datos;
/** Alias de los casos plantados (5.3) → id. */
export const PLANTADOS = cargado.plantados;
/** El corte por defecto: 31/10/2026. */
export const CORTE = DATOS.hasta;

/** El id de un caso plantado; lanza si el alias no existe (un alias mal escrito no puede dar un test que pasa mirando nada). */
export function idPlantado(alias: string): string {
  const id = PLANTADOS[alias];
  if (id === undefined) throw new Error(`No hay ningún caso plantado con el alias ${alias}.`);
  return id;
}
