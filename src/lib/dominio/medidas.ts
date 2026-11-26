// El catálogo de medidas (docs/diseno.md, 4.2 y 4.3): toda cifra del tablero es una `Medida` con su valor (camino por agregación), su
// base (M5), su fórmula en palabras y sus partidas (camino por listado). `controlar` compara los dos caminos (D2): si difieren lanza
// `ErrorDeCierre` y la interfaz nunca muestra el número. Además: los filtros validados, los doce meses y la tabla «Por cliente».

import { valorAgregado } from "./agregados.ts";
import { CLAVES_DEL_CATALOGO, esClaveDelMes } from "./claves.ts";
import { mesDelCorte } from "./corte.ts";
import { centavos, compararNombres, formatearImporte, porcentajes, sumarLista } from "./dinero.ts";
import type { Centavos, Milesimas } from "./dinero.ts";
import { exigirCorte, sumarMeses } from "./fechas.ts";
import { partidasDe } from "./partidas.ts";
import type { ProveedorDeSaldos } from "./partidas.ts";
import { TITULO_DE_MEDIDA, formulaDeMedida } from "./textos.ts";
import type { Base, ClaveDeMedida, Datos, FechaCivil, FiltroDeMedida, Medida } from "./tipos.ts";

/** El catálogo (4.2): título y base (M5) de cada clave, incluida `mora-otros`. La fórmula depende del corte y se arma en `textos.ts`. */
export const CATALOGO: Readonly<Record<ClaveDeMedida, { titulo: string; base: Base }>> = {
  "facturacion-mes": entrada("facturacion-mes"),
  "facturado-con-iva-mes": entrada("facturado-con-iva-mes"),
  "iva-mes": entrada("iva-mes"),
  "cobranza-mes": entrada("cobranza-mes"),
  "retenciones-mes": entrada("retenciones-mes"),
  saldo: entrada("saldo"),
  mora: entrada("mora"),
  "tramo-no-vencido": entrada("tramo-no-vencido"),
  "tramo-1-30": entrada("tramo-1-30"),
  "tramo-31-60": entrada("tramo-31-60"),
  "tramo-61-90": entrada("tramo-61-90"),
  "tramo-mas-90": entrada("tramo-mas-90"),
  "pagos-a-cuenta": entrada("pagos-a-cuenta"),
  "saldos-a-favor": entrada("saldos-a-favor"),
  "saldo-neto": entrada("saldo-neto"),
  "mora-otros": entrada("mora-otros"),
};

function entrada(clave: ClaveDeMedida): { titulo: string; base: Base } {
  return { titulo: TITULO_DE_MEDIDA[clave], base: baseDe(clave) };
}

/** M5: la facturación es sin IVA; el IVA se rotula aparte; todo lo demás (cobranza, saldos, mora, antigüedad) es con IVA. */
function baseDe(clave: ClaveDeMedida): Base {
  if (clave === "facturacion-mes") return "sin-iva";
  if (clave === "iva-mes") return "iva";
  return "con-iva";
}

export interface OpcionesDeMedida {
  /** De dónde salen los saldos del camino por listado. Solo para plantar una mutación en los tests de D2; por defecto, `saldosAlCorte`. */
  saldos?: ProveedorDeSaldos;
}

/**
 * Valida el filtro (4.3): el cliente tiene que existir y, en las medidas del mes, un `mes` (`AAAA-MM`) dado tiene que estar entre el de `desde` y
 * el del corte, ambos incluidos; sin `mes` rige el del corte (S7), **sea cual sea el corte** (vale cualquier fecha civil válida; un corte anterior
 * a `desde` da una medida del mes en 0, como uno posterior a `hasta`). En una medida que no es del mes, el `mes` se descarta sin avisar.
 */
function normalizarFiltro(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, filtro: FiltroDeMedida): FiltroDeMedida {
  if (!Object.hasOwn(CATALOGO, clave)) throw new Error(`La clave «${String(clave)}» no es una medida del catálogo.`);
  exigirCorte(corte);
  const normalizado: FiltroDeMedida = {};
  if (filtro.clienteId !== undefined) {
    if (!datos.clientes.some((c) => c.id === filtro.clienteId)) throw new Error(`No hay ningún cliente con el id ${filtro.clienteId}.`);
    normalizado.clienteId = filtro.clienteId;
  }
  if (esClaveDelMes(clave)) {
    const primero = datos.desde.slice(0, 7);
    const ultimo = mesDelCorte(corte);
    if (filtro.mes === undefined) {
      normalizado.mes = ultimo;
    } else {
      const mes = filtro.mes;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error(`El mes «${mes}» no es válido: tiene que ser AAAA-MM.`);
      if (ultimo < primero) throw new Error(`El mes «${mes}» no es válido: el corte «${corte}» es anterior al primer mes de los datos (${primero}).`);
      if (mes < primero || mes > ultimo) throw new Error(`El mes «${mes}» no es válido: tiene que ser AAAA-MM, entre ${primero} y ${ultimo}.`);
      normalizado.mes = mes;
    }
  }
  return normalizado;
}

/** Solo el `valor` (camino por agregación) de una medida, con el mismo filtro validado que `medida()`. Lo usan los controles cruzados. */
export function valorDeMedida(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, filtro: FiltroDeMedida = {}): Centavos {
  return valorAgregado(datos, corte, clave, normalizarFiltro(datos, corte, clave, filtro));
}

/**
 * Construye una medida del catálogo para un corte y un filtro: el `valor` por agregación y las `partidas` por listado, dos cálculos
 * independientes que `controlar` compara. Lanza con un cliente, una clave o un mes inválidos, y con `mora-otros` si no hay más de 5
 * clientes con mora (la clave no existe, M4).
 */
export function medida(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, filtro: FiltroDeMedida = {}, opciones: OpcionesDeMedida = {}): Medida {
  const f = normalizarFiltro(datos, corte, clave, filtro);
  const { titulo, base } = CATALOGO[clave];
  return {
    clave,
    titulo,
    base,
    formula: formulaDeMedida(clave, corte, f.mes),
    valor: valorAgregado(datos, corte, clave, f),
    partidas: partidasDe(datos, corte, clave, f, opciones.saldos),
    filtro: f,
  };
}

/**
 * La puerta de la interfaz (D2): `medida` + `controlar`. Lanza `ErrorDeCierre` si los dos caminos no coinciden, así que **no hay forma de pedir
 * un número sin que se haya controlado**. `medida` sola queda para los tests y para los controles cruzados.
 */
export function medidaControlada(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, filtro: FiltroDeMedida = {}, opciones: OpcionesDeMedida = {}): Medida {
  const m = medida(datos, corte, clave, filtro, opciones);
  controlar(m);
  return m;
}

/** Las claves que existen para un corte: las 15 del catálogo y `mora-otros` solo si hay más de 5 clientes con mora (M4). */
export function clavesExistentes(datos: Datos, corte: FechaCivil): ClaveDeMedida[] {
  const deudores = new Set(partidasDe(datos, corte, "mora").map((p) => p.clienteId));
  return deudores.size > 5 ? [...CLAVES_DEL_CATALOGO, "mora-otros"] : [...CLAVES_DEL_CATALOGO];
}

/** Los 12 meses `AAAA-MM` que terminan en el del corte, en orden; menos, si empezarían antes del mes de `desde` (4.3). */
export function docesMeses(corte: FechaCivil, desde: FechaCivil): string[] {
  const ultimo = mesDelCorte(corte);
  const primero = desde.slice(0, 7);
  const meses: string[] = [];
  for (let atras = 11; atras >= 0; atras--) {
    const mes = sumarMeses(ultimo, -atras);
    if (mes >= primero) meses.push(mes);
  }
  return meses;
}

// ---------------------------------------------------------------------------------------------------------------------------
// D2: controlar
// ---------------------------------------------------------------------------------------------------------------------------

/** La diferencia con el formato de M1; si por un dato absurdo pasara el tope de `Centavos`, en centavos (el mensaje de un error no puede lanzar otro). */
function importeDeLaDiferencia(diferencia: number): string {
  try {
    return formatearImporte(centavos(diferencia));
  } catch {
    return `${diferencia} centavos`;
  }
}

/** D2: un control no cierra. Trae la clave, los dos valores y la diferencia; la interfaz muestra la pantalla de error y nunca el número. */
export class ErrorDeCierre extends Error {
  readonly clave: string;
  /** Lo que dio el primer cálculo (agregación, o el valor esperado de un control cruzado). */
  readonly valor: Centavos;
  /** Lo que dio el segundo (la suma de las partidas, o el otro lado del control cruzado). */
  readonly suma: Centavos;
  /** `valor − suma`, con signo. */
  readonly diferencia: number;
  /** Qué dos cálculos no coinciden, **sin ningún importe**: es lo único del error que la interfaz puede mostrar (el `message` trae las cifras). */
  readonly descripcion: string;

  /** `descripcion`: qué se comparó, sin cifras; si no se da, es «la medida «clave» y la suma de sus partidas». */
  constructor(clave: string, valor: Centavos, suma: Centavos, contraste = "la suma de sus partidas", descripcion = `la medida «${clave}» y ${contraste}`) {
    const diferencia = valor - suma;
    super(`No cierra «${clave}»: el valor es ${formatearImporte(valor)} y ${contraste} es ${formatearImporte(suma)} (diferencia de ${importeDeLaDiferencia(diferencia)}).`);
    this.name = "ErrorDeCierre";
    this.clave = clave;
    this.valor = valor;
    this.suma = suma;
    this.diferencia = diferencia;
    this.descripcion = descripcion;
  }
}

/** D2: compara el `valor` (agregación) con la suma de las `partidas` (listado) y lanza `ErrorDeCierre` si difieren, al centavo. */
export function controlar(m: Medida): void {
  const suma = sumarLista(m.partidas.map((p) => p.importe));
  if (suma !== m.valor) throw new ErrorDeCierre(m.clave, m.valor, suma);
}

// ---------------------------------------------------------------------------------------------------------------------------
// 4.3: «Por cliente»
// ---------------------------------------------------------------------------------------------------------------------------

export interface FilaPorCliente {
  clienteId: string;
  razonSocial: string;
  cantidad: number;
  subtotal: Centavos;
  /** M3, en milésimas; `null` en todas las filas si algún subtotal es negativo o el valor no es mayor que 0. */
  milesimas: Milesimas | null;
}

/**
 * Agrupa las partidas de una medida por cliente: una fila por cliente con su cantidad y su subtotal, de mayor a menor y, en el empate, por
 * razón social (`es-AR`). El porcentaje (M3, mayor resto) solo se calcula si todos los subtotales son ≥ 0 y el valor es > 0; si no (la
 * facturación de un mes puede ser negativa para un cliente, C5), es `null` en todas las filas y `porcentajes`, que lanza con negativos,
 * no se llama.
 */
/** Un cliente que no está en los datos es un dato dañado (G5): se lanza nombrándolo, no se inventa un nombre. */
function nombreDe(nombres: ReadonlyMap<string, string>, clienteId: string): string {
  const nombre = nombres.get(clienteId);
  if (nombre === undefined) throw new Error(`Error interno: la partida es del cliente ${clienteId}, que no está en los datos.`);
  return nombre;
}

export function porCliente(m: Medida, datos: Datos): FilaPorCliente[] {
  const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
  const grupos = new Map<string, { cantidad: number; importes: Centavos[] }>();
  for (const p of m.partidas) {
    const g = grupos.get(p.clienteId) ?? { cantidad: 0, importes: [] };
    g.cantidad += 1;
    g.importes.push(p.importe);
    grupos.set(p.clienteId, g);
  }
  const filas = [...grupos.entries()]
    .map(([clienteId, g]) => ({ clienteId, razonSocial: nombreDe(nombres, clienteId), cantidad: g.cantidad, subtotal: sumarLista(g.importes) }))
    .sort((a, b) => b.subtotal - a.subtotal || compararNombres(a.razonSocial, b.razonSocial));
  const conPorcentaje = m.valor > 0 && filas.every((f) => f.subtotal >= 0);
  const milesimas = conPorcentaje ? porcentajes(filas.map((f) => ({ nombre: f.razonSocial, importe: f.subtotal }))) : filas.map(() => null);
  return filas.map((f, i): FilaPorCliente => ({ ...f, milesimas: milesimas[i] ?? null }));
}
