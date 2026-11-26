// Piezas puras del script de mutaciones (`scripts/mutaciones.mjs`): aplicar una mutación a un texto y juzgar la salida de Vitest.
// Van aparte para probarlas (`tests/mutaciones-lista.test.ts`) sin correr Vitest dentro de Vitest.

/**
 * Cuántas veces aparece `desde` en `texto`. Una mutación solo vale si aparece **exactamente una vez**: con cero, el código cambió y la
 * mutación quedó vieja; con más de una, no se sabe cuál se cambia.
 */
export function apariciones(texto, desde) {
  if (desde === "") return 0;
  return texto.split(desde).length - 1;
}

/** El texto con la única aparición de `desde` cambiada por `hasta`. Lanza si `desde` no aparece exactamente una vez. */
export function aplicar(texto, desde, hasta) {
  const n = apariciones(texto, desde);
  if (n !== 1) throw new Error(`La cadena aparece ${n} veces (tiene que ser 1): ${JSON.stringify(desde.slice(0, 80))}`);
  return texto.replace(desde, () => hasta);
}

/**
 * Qué pasó con una mutación, según la salida de Vitest y su código de salida:
 * - `muerta`: algún test falló (lo que se quiere: la suite se dio cuenta);
 * - `sobrevive`: todos pasaron (un hueco: el cambio no lo ve ningún test);
 * - `error`: no se pudo correr (no compila, no hay tests): no prueba nada, hay que mirar la salida.
 */
export function juzgar(salida, codigoDeSalida) {
  const resumen = /Tests\s+([^\n]*)/.exec(salida);
  if (resumen === null) return "error";
  if (/\bfailed\b/.test(resumen[1] ?? "")) return "muerta";
  return codigoDeSalida === 0 ? "sobrevive" : "error";
}

/** Valida la lista de mutaciones (el JSON): campos obligatorios, ids únicos. Devuelve los problemas, una lista vacía si está bien. */
export function problemasDeLaLista(lista) {
  if (!Array.isArray(lista)) return ["La lista de mutaciones tiene que ser un arreglo."];
  const problemas = [];
  const ids = new Set();
  for (const [i, m] of lista.entries()) {
    const donde = `Mutación ${i + 1}${typeof m?.id === "string" ? ` (${m.id})` : ""}`;
    for (const campo of ["id", "nombre", "archivo", "desde", "hasta"]) {
      if (typeof m?.[campo] !== "string") problemas.push(`${donde}: falta «${campo}» (texto).`);
    }
    if (m?.tests !== undefined && !(Array.isArray(m.tests) && m.tests.every((t) => typeof t === "string"))) problemas.push(`${donde}: «tests» tiene que ser una lista de rutas.`);
    if (typeof m?.archivo === "string" && !/^src\/lib\/[\w/-]+\.ts$/.test(m.archivo)) problemas.push(`${donde}: «archivo» tiene que ser un .ts de src/lib.`);
    if (typeof m?.id === "string") {
      if (ids.has(m.id)) problemas.push(`${donde}: el id está repetido.`);
      ids.add(m.id);
    }
    if (typeof m?.desde === "string" && m.desde === m.hasta) problemas.push(`${donde}: «desde» y «hasta» son iguales.`);
  }
  return problemas;
}
