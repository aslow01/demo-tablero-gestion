// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/lib/dominio/fechas.ts.
// Cambios: se sacó todo lo del reloj y las zonas horarias (hoyEnArgentina, fechaEnArgentina, parsearInstante, formatearInstante,
// formatearHora, el Intl.DateTimeFormat y el tipo Instante), porque el dominio de esta demo no tiene "hoy" (docs/diseno.md, sección 4).
// Tampoco se copiaron sumarAnios, diaDeLaSemana ni formatearFechaConDia: todavía nada las usa.
// Fechas civiles (AAAA-MM-DD). Sin métodos locales de Date: todo es UTC.

import type { FechaCivil } from "./tipos.ts";

const MS_POR_DIA = 86_400_000;

function bisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

function diasDelMes(anio: number, mes: number): number {
  if (mes === 2) return bisiesto(anio) ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

interface Partes {
  anio: number;
  mes: number;
  dia: number;
}

function dosDigitos(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function armar(anio: number, mes: number, dia: number): FechaCivil {
  return `${String(anio).padStart(4, "0")}-${dosDigitos(mes)}-${dosDigitos(dia)}`;
}

/** Valida a mano `AAAA-MM-DD` (año 2000 a 2100). Devuelve la misma fecha o `null`. Nunca interpreta el texto con el constructor de Date (corre un día). */
export function parsearFechaCivil(texto: string): FechaCivil | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (m === null) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (anio < 2000 || anio > 2100) return null;
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > diasDelMes(anio, mes)) return null;
  return texto;
}

/** El corte como fecha civil válida: lo devuelve igual, o lanza nombrándolo. Lo usan corte.ts, agregados.ts y medidas.ts (un solo mensaje, que no diverja). */
export function exigirCorte(corte: string): FechaCivil {
  const valido = parsearFechaCivil(corte);
  if (valido === null) throw new Error(`El corte «${corte}» no es una fecha civil válida (AAAA-MM-DD).`);
  return valido;
}

/** Las partes de una fecha ya validada. */
function partesDe(fecha: FechaCivil): Partes {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (m === null) throw new Error(`Fecha civil inválida: ${fecha}`);
  return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

function diasDesdeEpoca(fecha: FechaCivil): number {
  const { anio, mes, dia } = partesDe(fecha);
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA;
}

/** Inversa de `diasDesdeEpoca` (algoritmo de calendario civil, sin Date). */
function fechaDesdeDias(dias: number): FechaCivil {
  const z = dias + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const dia = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const mes = mp < 10 ? mp + 3 : mp - 9;
  return armar(mes <= 2 ? y + 1 : y, mes, dia);
}

/** Días de calendario de `a` a `b`, con signo. */
export function diasEntre(a: FechaCivil, b: FechaCivil): number {
  return diasDesdeEpoca(b) - diasDesdeEpoca(a);
}

export function sumarDias(fecha: FechaCivil, dias: number): FechaCivil {
  if (!Number.isInteger(dias)) throw new Error(`sumarDias necesita un entero de días: ${dias}`);
  return fechaDesdeDias(diasDesdeEpoca(fecha) + dias);
}

/** `18/11/2026`. */
export function formatearFecha(fecha: FechaCivil): string {
  const { anio, mes, dia } = partesDe(fecha);
  return `${dosDigitos(dia)}/${dosDigitos(mes)}/${anio}`;
}

/** Suma `n` meses (con signo) a un mes `AAAA-MM` y devuelve otro `AAAA-MM`. Es de fechas.ts porque lee dígitos. */
export function sumarMeses(mes: string, n: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (m === null || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`El mes «${mes}» no tiene el formato AAAA-MM.`);
  if (!Number.isInteger(n)) throw new Error(`sumarMeses necesita un entero de meses: ${n}`);
  const indice = Number(m[1]) * 12 + (Number(m[2]) - 1) + n;
  return `${String(Math.floor(indice / 12)).padStart(4, "0")}-${dosDigitos((indice % 12) + 1)}`;
}

/** Cuántos días tiene el mes `AAAA-MM` (28 a 31). Lo usa el generador para sortear un día que exista. */
export function diasDeMes(mes: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (m === null || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`El mes «${mes}» no tiene el formato AAAA-MM.`);
  return diasDelMes(Number(m[1]), Number(m[2]));
}
