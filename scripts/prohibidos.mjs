// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/prohibidos.mjs.
// Cambios: sin `marcaPendienteDeConfirmar` (esta demo no tiene esa regla).
// Búsqueda de términos prohibidos (nombres de terceros que el repositorio no puede nombrar).
// Módulo puro (sin lectura de archivos ni consola): lo usa `buscar-prohibidos.mjs` y lo prueba `tests/prohibidos.test.ts`.
//
// Los términos NO están en el repositorio: viven en un archivo local no versionado (`scripts/prohibidos.local.json`,
// ignorado por git). Se probó guardar su SHA-256, pero un hash sin sal de una palabra corta se recupera probando un
// diccionario, y en un repositorio público eso equivale a publicar el nombre: por eso no queda ni la huella.
//
// Formato del archivo local: `{ "palabras": ["término", "dos o tres palabras", ...] }`.
//
// Cómo busca:
//  1. Normaliza el texto: minúsculas y sin acentos (así «É», «e» y «é» son lo mismo).
//  2. Lo parte en palabras (todo lo que no es letra o número separa).
//  3. Un término de UNA palabra se busca como trozo de cada palabra: encuentra «NombreAjenoCentral» o «nombre_ajeno_id».
//     Una frase de varias palabras se busca como esas palabras consecutivas y exactas.

/** Ruta, desde la raíz del repositorio, del archivo local con los términos. Está en `.gitignore`. */
export const ARCHIVO_LOCAL = "scripts/prohibidos.local.json";

/** Minúsculas y sin marcas diacríticas («ñ» queda como «n»). */
export function normalizar(texto) {
  return texto.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

/** Palabras del texto ya normalizadas: lo que no es letra ASCII ni número separa. */
export function tokenizar(texto) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter((t) => t !== "");
}

/**
 * Términos a partir del contenido del archivo local (`{ "palabras": [...] }`), cada uno como lista de palabras normalizadas.
 * Lo que no es texto o no tiene letras ni números se ignora. Un JSON roto o de otra forma lanza un error: un archivo mal
 * escrito no puede apagar la regla en silencio.
 */
export function terminosDeJson(contenido) {
  let datos;
  try {
    datos = JSON.parse(contenido);
  } catch {
    throw new Error(`${ARCHIVO_LOCAL} no es un JSON válido (se espera { "palabras": [...] }).`);
  }
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error(`${ARCHIVO_LOCAL} debe ser un objeto con la forma { "palabras": [...] }.`);
  }
  if (datos.palabras === undefined) return [];
  if (!Array.isArray(datos.palabras)) {
    throw new Error(`El campo "palabras" de ${ARCHIVO_LOCAL} debe ser una lista de textos.`);
  }
  return datos.palabras.filter((p) => typeof p === "string").map(tokenizar).filter((t) => t.length > 0);
}

/** ¿El texto contiene algún término de la lista (`string[][]`, de `terminosDeJson`)? */
export function contieneProhibido(texto, terminos) {
  if (terminos.length === 0) return false;
  const palabras = tokenizar(texto);
  return terminos.some((termino) => {
    if (termino.length === 1) {
      const unica = termino[0];
      return palabras.some((palabra) => palabra.includes(unica));
    }
    for (let i = 0; i + termino.length <= palabras.length; i++) {
      if (termino.every((parte, k) => palabras[i + k] === parte)) return true;
    }
    return false;
  });
}

// Dominios de correo permitidos: los reservados para ejemplos (RFC 2606) y los de aviso sin respuesta.
const DOMINIOS_EJEMPLO = ["example.com", "example.org", "example.net"];
const TLD_EJEMPLO = ["example", "test", "invalid", "localhost"];
const DOMINIOS_SIN_RESPUESTA = ["users.noreply.github.com"];
const CORREO = /[a-z0-9._%+-]+@((?:[a-z0-9-]+\.)+[a-z]{2,})/gi;

function dominioPermitido(dominio) {
  const d = dominio.toLowerCase();
  if (DOMINIOS_EJEMPLO.some((e) => d === e || d.endsWith(`.${e}`))) return true;
  if (TLD_EJEMPLO.includes(d.slice(d.lastIndexOf(".") + 1))) return true;
  return DOMINIOS_SIN_RESPUESTA.some((e) => d === e || d.endsWith(`.${e}`));
}

/** Correos del texto que no son de un dominio de ejemplo ni una dirección «noreply». No nombra a nadie en particular. */
export function correosNoPermitidos(texto) {
  const salida = [];
  for (const m of texto.matchAll(CORREO)) {
    const correo = m[0];
    const local = correo.slice(0, correo.indexOf("@")).toLowerCase();
    if (/^no-?reply/.test(local) || dominioPermitido(m[1] ?? "")) continue;
    salida.push(correo);
  }
  return salida;
}
