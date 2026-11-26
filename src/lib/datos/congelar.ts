// Congelado a fondo de los datos. Los datos de la demo son de solo lectura: `corte.ts` y `agregados.ts` guardan índices por conjunto
// (un `WeakMap` con el objeto de `Datos` como llave) y darían valores viejos, sin avisar, si alguien agregara un comprobante al mismo objeto.
// Congelados, intentarlo lanza un `TypeError` (los módulos de ES son estrictos). Lo usan `cargar.ts` (los datos de la demo) y los fixtures de los tests.

/** Congela `valor` y todo lo que contiene (objetos y listas), y lo devuelve. Cada objeto se visita una sola vez, así que un ciclo no lo pierde. */
export function congelar<T>(valor: T, vistos: WeakSet<object> = new WeakSet()): T {
  if (typeof valor !== "object" || valor === null || vistos.has(valor)) return valor;
  vistos.add(valor);
  Object.freeze(valor);
  for (const hijo of Object.values(valor)) congelar(hijo, vistos);
  return valor;
}
