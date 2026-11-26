// Enrutador por hash (docs/diseno-ui.md, sección 2; docs/diseno.md, S5 y 4.3). Puro: de un hash y los datos sale una `Direccion` (la ruta, el corte
// y los avisos); no toca la ventana. El hash es entrada externa (cualquiera puede escribirlo en la barra): se acota, se valida y NUNCA se repite en la
// interfaz. Una ruta que no se entiende es `desconocida`; una bien escrita cuyo cliente, comprobante o clave no existe es `inexistente`; en los dos
// casos la ruta no guarda lo que se escribió.
//
// Escrito de nuevo para esta demo (docs/procedencia.md): la Demo 2 no tiene parámetros de este tipo ni valida contra los datos.

import { CLAVES_DEL_CATALOGO, esClaveDelMes } from "../dominio/claves.ts";
import { mesDelCorte, resolverCorte } from "../dominio/corte.ts";
import { clavesExistentes } from "../dominio/medidas.ts";
import { avisoDeMesInvalido } from "../dominio/textos.ts";
import type { ClaveDeMedida, Datos, FechaCivil } from "../dominio/tipos.ts";

/** Los tramos que filtra la lista de Comprobantes (`todos`, el valor por defecto, no se guarda). `vencidos` son los cuatro vencidos juntos. */
export const TRAMOS_DE_LISTA = ["vencidos", "no-vencido", "1-30", "31-60", "61-90", "mas-90"] as const;
export type TramoDeLista = (typeof TRAMOS_DE_LISTA)[number];

/** Los filtros de la lista de Clientes (`todos`, el valor por defecto, no se guarda). */
export const FILTROS_DE_CLIENTES = ["con-mora", "revisar"] as const;
export type FiltroDeClientes = (typeof FILTROS_DE_CLIENTES)[number];

/**
 * Las ocho secciones de la aplicación: la ruta por defecto es el Resumen (también `#/resumen`); Comprobantes, Clientes, Meses y
 * Cómo se calcula son pantallas sin sujeto; Cliente, Comprobante y Desglose llevan el suyo. Un parámetro que vale su valor por defecto (`tramo`
 * `todos`, `filtro` `todos`, `q` vacía) **no se guarda**: así cada pantalla tiene una sola ruta y la forma canónica es un punto fijo.
 */
export type RutaNavegable =
  | { tipo: "resumen" }
  | {
      tipo: "comprobantes";
      tramo?: TramoDeLista;
      /** La búsqueda, ya acotada por `normalizarBusqueda`. Es un dato de la ruta: solo se muestra como valor del campo de búsqueda. */
      q?: string;
    }
  | { tipo: "clientes"; filtro?: FiltroDeClientes; q?: string }
  | { tipo: "meses" }
  | { tipo: "como-se-calcula" }
  | { tipo: "cliente"; clienteId: string }
  | { tipo: "comprobante"; comprobanteId: string }
  | {
      tipo: "desglose";
      clave: ClaveDeMedida;
      /** `cliente=`: ya validado contra los datos. */
      clienteId?: string;
      /** `mes=` (`AAAA-MM`): ya validado; solo en las medidas del mes. */
      mes?: string;
      /** `agrupar=no`: la única forma válida. */
      agrupar?: "no";
    };

export type VistaConId = "cliente" | "comprobante" | "desglose";

export type Ruta =
  | RutaNavegable
  /** Bien escrita, pero el cliente, el comprobante, la clave o el `cliente=` no existen (diseno-ui 8.2). No guarda el id escrito. */
  | { tipo: "inexistente"; vista: VistaConId }
  /** No es ninguna ruta de la aplicación (o el hash es demasiado largo). */
  | { tipo: "desconocida" };

export interface AvisoDeDireccion {
  /** `corte`: S5. `mes`: el `mes=` del desglose de una medida del mes no vale. Cierra por separado (`cerrarAviso`). */
  clase: "corte" | "mes";
  texto: string;
}

export interface Direccion {
  ruta: Ruta;
  /** Siempre un cierre de mes del rango: el de la dirección si valía, si no el de por defecto. */
  corte: FechaCivil;
  /** Primero el del corte, después el del mes. Vacío si la dirección estaba bien. */
  avisos: readonly AvisoDeDireccion[];
}

/**
 * Lo que cabe en la peor dirección legítima con holgura; más es una dirección que no escribió la aplicación. El tope tiene que superar lo que mide una
 * búsqueda de 60 letras con tilde una vez codificada (411 caracteres, `%C3%B3` por letra): con uno menor, la propia aplicación se negaría a leer el
 * enlace que ella misma escribió. La peor dirección que escribe `aHash` mide 51 + `LARGO_MAXIMO_DE_Q_CODIFICADA` = 411.
 */
export const LARGO_MAXIMO_HASH = 512;

/** La búsqueda tiene hasta 60 caracteres (puntos de código, no unidades de UTF-16)... */
const LARGO_MAXIMO_DE_Q = 60;
/** ...y hasta 360 caracteres una vez codificada en la dirección (60 letras con tilde, que ocupan 6 cada una): las que ocupan más (ideogramas, emojis) se recortan antes. */
const LARGO_MAXIMO_DE_Q_CODIFICADA = 360;

const DESCONOCIDA: Ruta = { tipo: "desconocida" };

// Surrogates sueltos (una mitad de un emoji): `encodeURIComponent` lanza con ellos.
const SURROGATE_SUELTO = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * La búsqueda tal como la guarda la ruta: un surrogate suelto pasa a U+FFFD, se recorta a 60 caracteres y, si codificada pasa de 360, se sigue
 * recortando hasta que entre. No se quitan espacios (quien escribe «los » no debe perder el espacio que acaba de tipear). Función pura e idempotente:
 * la usan el enrutador al leer y `aHash` al escribir, así todo lo que se escribe se puede volver a leer.
 */
export function normalizarBusqueda(texto: string): string {
  let letras = Array.from(texto.replace(SURROGATE_SUELTO, "�")).slice(0, LARGO_MAXIMO_DE_Q);
  let codificado = 0;
  for (const [i, letra] of letras.entries()) {
    codificado += encodeURIComponent(letra).length;
    if (codificado > LARGO_MAXIMO_DE_Q_CODIFICADA) {
      letras = letras.slice(0, i);
      break;
    }
  }
  return letras.join("");
}

/** ¿Es un ancla de la página (`#principal`, `#saldo-final`) y no una dirección de la aplicación? Direcciones son: vacío, `#` y todo lo que empieza con `#/`. */
export function esAncla(hash: string): boolean {
  return hash !== "" && hash !== "#" && !hash.startsWith("#/");
}

// Forma de cada id. Solo deciden «bien escrito o no»; que exista lo deciden los datos.
const ID_DE_CLIENTE = /^[A-Za-z0-9]{1,10}$/;
const ID_DE_COMPROBANTE = /^[1-3]-\d{4}-\d{8}$/;
const MES = /^\d{4}-(?:0[1-9]|1[0-2])$/;

function decodificar(segmento: string): string | null {
  try {
    return decodeURIComponent(segmento);
  } catch {
    return null; // %E0%A4%A y similares
  }
}

/** El único valor de un parámetro, o `null` si falta o viene repetido. (Un parámetro vacío es un valor: `""`.) */
function unico(valores: readonly string[]): string | null {
  const [primero] = valores;
  return valores.length === 1 && primero !== undefined ? primero : null;
}

function esClaveConocida(clave: string): clave is ClaveDeMedida {
  return (CLAVES_DEL_CATALOGO as readonly string[]).includes(clave) || clave === "mora-otros";
}

/** Los segmentos del camino, decodificados; `[]` es el Resumen. `null` si algo no se entiende (segmento vacío, barra de más, % roto). */
function segmentosDe(camino: string): string[] | null {
  let resto = camino.slice(1);
  if (resto === "") return [];
  if (resto.endsWith("/")) resto = resto.slice(0, -1);
  const segmentos: string[] = [];
  for (const crudo of resto.split("/")) {
    const s = decodificar(crudo);
    if (s === null || s === "") return null;
    segmentos.push(s);
  }
  return segmentos;
}

/** Ruta y consulta de un hash: `null` si no es una dirección de la aplicación. */
function partirHash(hash: string): { segmentos: string[]; consulta: URLSearchParams } | null {
  const sinNumeral = hash.startsWith("#") ? hash.slice(1) : hash;
  // Un segundo `#` abre un fragmento: nada de lo que viene después es de la dirección (un `#` dentro de la búsqueda llega como `%23`).
  const finDeLaDireccion = sinNumeral.indexOf("#");
  const direccion = finDeLaDireccion === -1 ? sinNumeral : sinNumeral.slice(0, finDeLaDireccion);
  return partirDireccion(direccion);
}

function partirDireccion(sinNumeral: string): { segmentos: string[]; consulta: URLSearchParams } | null {
  if (sinNumeral === "") return { segmentos: [], consulta: new URLSearchParams() };
  if (!sinNumeral.startsWith("/")) return null;
  const signo = sinNumeral.indexOf("?");
  const camino = signo === -1 ? sinNumeral : sinNumeral.slice(0, signo);
  const segmentos = segmentosDe(camino);
  if (segmentos === null) return null;
  return { segmentos, consulta: new URLSearchParams(signo === -1 ? "" : sinNumeral.slice(signo + 1)) };
}

/**
 * Lo que dice la dirección, validado contra los datos (S5 y 4.3):
 * - **corte**: `resolverCorte` (un cierre de mes del rango; si no, el de por defecto y el aviso, incluso repetido). Se resuelve aunque la ruta no exista.
 * - **cliente=**: solo en el Desglose. Debe ser uno y existir; si no, la ruta es `inexistente` (como un cliente inexistente). `mora-otros` no lo admite:
 *   con `cliente=` es `inexistente` aunque el cliente exista.
 * - **mes=**: solo en el Desglose de una medida del mes. Entre el mes de `desde` y el del corte; si no vale (o viene repetido), se muestra el del corte con
 *   el aviso. En una medida que no es del mes se descarta sin aviso.
 * - **agrupar=**: solo `no`, una vez; cualquier otra cosa se ignora.
 * - Parámetros desconocidos, o que no corresponden a la ruta, se ignoran.
 */
export function resolverDireccion(hash: string, datos: Datos): Direccion {
  if (hash.length > LARGO_MAXIMO_HASH) return { ruta: DESCONOCIDA, corte: datos.hasta, avisos: [] };
  const partes = partirHash(hash);
  const { corte, aviso } = resolverCorte(partes === null ? null : partes.consulta.getAll("corte"), datos);
  const avisos: AvisoDeDireccion[] = aviso === null ? [] : [{ clase: "corte", texto: aviso }];
  if (partes === null) return { ruta: DESCONOCIDA, corte, avisos };
  const { segmentos, consulta } = partes;
  const [pantalla, a, ...resto] = segmentos;

  if (pantalla === undefined) return { ruta: { tipo: "resumen" }, corte, avisos };
  if (resto.length > 0) return { ruta: DESCONOCIDA, corte, avisos };

  // Las pantallas sin sujeto: no admiten un segundo segmento.
  if (a === undefined) {
    const ruta = pantallaSinSujeto(pantalla, consulta);
    return { ruta: ruta ?? DESCONOCIDA, corte, avisos };
  }

  switch (pantalla) {
    case "cliente":
      if (!ID_DE_CLIENTE.test(a)) return { ruta: DESCONOCIDA, corte, avisos };
      if (!datos.clientes.some((c) => c.id === a)) return { ruta: { tipo: "inexistente", vista: "cliente" }, corte, avisos };
      return { ruta: { tipo: "cliente", clienteId: a }, corte, avisos };

    case "comprobante":
      if (!ID_DE_COMPROBANTE.test(a)) return { ruta: DESCONOCIDA, corte, avisos };
      if (!datos.comprobantes.some((c) => c.id === a)) return { ruta: { tipo: "inexistente", vista: "comprobante" }, corte, avisos };
      return { ruta: { tipo: "comprobante", comprobanteId: a }, corte, avisos };

    case "desglose":
      return desglose(a, consulta, datos, corte, avisos);

    default:
      return { ruta: DESCONOCIDA, corte, avisos };
  }
}

/** El valor de `nombre` si es uno de `validos` (y viene una sola vez); si no, `undefined` (= el valor por defecto, `todos`), sin aviso. */
function valorDe<T extends string>(consulta: URLSearchParams, nombre: string, validos: readonly T[]): T | undefined {
  const valor = unico(consulta.getAll(nombre));
  return validos.find((v) => v === valor);
}

/** `q` si hay una búsqueda (una sola, no vacía), ya acotada; si no, `undefined`. */
function busquedaDe(consulta: URLSearchParams): string | undefined {
  const q = normalizarBusqueda(unico(consulta.getAll("q")) ?? "");
  return q === "" ? undefined : q;
}

/** `resumen` (y su alias `#/`), `comprobantes`, `clientes`, `meses` y `como-se-calcula`; `null` si no es ninguna. Cada parámetro vale solo en su pantalla. */
function pantallaSinSujeto(pantalla: string, consulta: URLSearchParams): RutaNavegable | null {
  switch (pantalla) {
    case "resumen":
      return { tipo: "resumen" };
    case "meses":
      return { tipo: "meses" };
    case "como-se-calcula":
      return { tipo: "como-se-calcula" };
    case "comprobantes": {
      const ruta: Extract<RutaNavegable, { tipo: "comprobantes" }> = { tipo: "comprobantes" };
      const tramo = valorDe(consulta, "tramo", TRAMOS_DE_LISTA);
      const q = busquedaDe(consulta);
      if (tramo !== undefined) ruta.tramo = tramo;
      if (q !== undefined) ruta.q = q;
      return ruta;
    }
    case "clientes": {
      const ruta: Extract<RutaNavegable, { tipo: "clientes" }> = { tipo: "clientes" };
      const filtro = valorDe(consulta, "filtro", FILTROS_DE_CLIENTES);
      const q = busquedaDe(consulta);
      if (filtro !== undefined) ruta.filtro = filtro;
      if (q !== undefined) ruta.q = q;
      return ruta;
    }
    default:
      return null;
  }
}

function desglose(clave: string, consulta: URLSearchParams, datos: Datos, corte: FechaCivil, avisos: AvisoDeDireccion[]): Direccion {
  const inexistente: Direccion = { ruta: { tipo: "inexistente", vista: "desglose" }, corte, avisos };
  if (!esClaveConocida(clave)) return inexistente;
  // `mora-otros` existe solo con más de 5 deudores (M4); es la única que hay que preguntarle a los datos.
  if (clave === "mora-otros" && !clavesExistentes(datos, corte).includes(clave)) return inexistente;

  const ruta: Extract<RutaNavegable, { tipo: "desglose" }> = { tipo: "desglose", clave };

  const clientes = consulta.getAll("cliente");
  if (clientes.length > 0) {
    // `mora-otros` no admite filtro por cliente (el dominio lanza): con `cliente=`, bien o mal escrito, es el mismo desglose inexistente.
    if (clave === "mora-otros") return inexistente;
    const cliente = unico(clientes);
    if (cliente === null || !ID_DE_CLIENTE.test(cliente) || !datos.clientes.some((c) => c.id === cliente)) return inexistente;
    ruta.clienteId = cliente;
  }

  const meses = consulta.getAll("mes");
  if (meses.length > 0 && esClaveDelMes(clave)) {
    const mes = unico(meses);
    const delCorte = mesDelCorte(corte);
    if (mes !== null && MES.test(mes) && datos.desde.slice(0, 7) <= mes && mes <= delCorte) ruta.mes = mes;
    else avisos = [...avisos, { clase: "mes", texto: avisoDeMesInvalido(delCorte) }];
  }

  if (unico(consulta.getAll("agrupar")) === "no") ruta.agrupar = "no";

  return { ruta, corte, avisos };
}

/**
 * La forma canónica del hash de una ruta con su corte. El corte va **siempre** en la dirección (diseno-ui, sección 2). Los ids ya están validados
 * (letras, dígitos y guiones), así que no hace falta codificarlos; se codifican igual por si la regla de forma cambia.
 */
export function aHash(ruta: RutaNavegable, corte: FechaCivil): string {
  const consulta = `?corte=${encodeURIComponent(corte)}`;
  switch (ruta.tipo) {
    case "resumen":
      return `#/resumen${consulta}`;
    case "meses":
      return `#/meses${consulta}`;
    case "como-se-calcula":
      return `#/como-se-calcula${consulta}`;
    case "comprobantes": {
      const q = normalizarBusqueda(ruta.q ?? "");
      return `#/comprobantes${consulta}${ruta.tramo === undefined ? "" : `&tramo=${ruta.tramo}`}${q === "" ? "" : `&q=${encodeURIComponent(q)}`}`;
    }
    case "clientes": {
      const q = normalizarBusqueda(ruta.q ?? "");
      return `#/clientes${consulta}${ruta.filtro === undefined ? "" : `&filtro=${ruta.filtro}`}${q === "" ? "" : `&q=${encodeURIComponent(q)}`}`;
    }
    case "cliente":
      return `#/cliente/${encodeURIComponent(ruta.clienteId)}${consulta}`;
    case "comprobante":
      return `#/comprobante/${encodeURIComponent(ruta.comprobanteId)}${consulta}`;
    case "desglose": {
      let hash = `#/desglose/${encodeURIComponent(ruta.clave)}${consulta}`;
      if (ruta.clienteId !== undefined) hash += `&cliente=${encodeURIComponent(ruta.clienteId)}`;
      if (ruta.mes !== undefined) hash += `&mes=${encodeURIComponent(ruta.mes)}`;
      if (ruta.agrupar !== undefined) hash += "&agrupar=no";
      return hash;
    }
  }
}

/** ¿Es una ruta a la que se puede navegar (y de la que se puede armar un enlace)? */
export function esNavegable(ruta: Ruta): ruta is RutaNavegable {
  return ruta.tipo !== "desconocida" && ruta.tipo !== "inexistente";
}

/**
 * Identifica la vista y su sujeto (diseno-ui, sección 2): cambia con la ruta, el cliente, el comprobante, la clave, `cliente=` y `mes=`; **no** con el
 * corte, con `agrupar` ni con `tramo`, `filtro` y `q` (R2: filtrar o escribir en el buscador es la misma vista; si cambiara, el foco saltaría al `h1` y la
 * página subiría con cada letra). Cuando cambia, el foco va al `h1`; cuando cambia solo el corte, no se mueve. No repite nada de lo escrito en la dirección.
 */
export function idDeVista(ruta: Ruta): string {
  switch (ruta.tipo) {
    case "resumen":
    case "comprobantes":
    case "clientes":
    case "meses":
    case "como-se-calcula":
      return ruta.tipo;
    case "cliente":
      return `cliente/${ruta.clienteId}`;
    case "comprobante":
      return `comprobante/${ruta.comprobanteId}`;
    case "desglose":
      return `desglose/${ruta.clave}/${ruta.clienteId ?? "-"}/${ruta.mes ?? "-"}`;
    case "inexistente":
      return `inexistente/${ruta.vista}`;
    case "desconocida":
      return "desconocida";
  }
}
