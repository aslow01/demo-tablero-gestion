// Dinero (docs/diseno.md, sección 6.1, reglas M1 a M5). Todo importe es un entero de centavos con el tipo con marca `Centavos`.
// Nada de coma flotante: los números que no son dinero (porcentajes en milésimas) también son enteros y se calculan con
// divisiones enteras. La búsqueda de CI (`npm run buscar`) rechaza en este directorio las funciones de punto flotante.

/** Entero seguro con |valor| ≤ 10^12. Un `number` suelto no es `Centavos`: solo se crea con `centavos`. */
export type Centavos = number & { readonly __marca: "Centavos" };

/** Tope de |valor| en centavos (10^12 = 10.000 millones de pesos). Deja margen: M3 multiplica por 1000 (10^15 < 2^53). */
export const TOPE_CENTAVOS = 1_000_000_000_000;

/** Único constructor de `Centavos`: lanza si `n` no es un entero seguro o si supera el tope (M1). */
export function centavos(n: number): Centavos {
  if (!Number.isSafeInteger(n)) throw new Error(`Importe inválido: ${n} no es un entero de centavos.`);
  if (n > TOPE_CENTAVOS || n < -TOPE_CENTAVOS) {
    throw new Error(`Importe inválido: ${n} centavos supera el tope de ${TOPE_CENTAVOS} centavos.`);
  }
  // El cero negativo (-0) sale como 0: se formatea y se compara como cualquier cero.
  return (n === 0 ? 0 : n) as Centavos;
}

/**
 * Suma en el orden dado y lanza si el resultado, o una suma parcial, supera el tope (M1). Con importes de distinto signo depende del orden:
 * `[TOPE, 1, −1]` lanza y `[TOPE, −1, 1]` da `TOPE`. Es a propósito: mantiene la invariante «todo `Centavos` está dentro del tope».
 */
export function sumar(...sumandos: Centavos[]): Centavos {
  return sumarLista(sumandos);
}

/** Igual que `sumar`, para una lista de cualquier largo (no desparrama los elementos como argumentos). */
export function sumarLista(sumandos: readonly Centavos[]): Centavos {
  let acumulado = centavos(0);
  for (const s of sumandos) acumulado = centavos(acumulado + s);
  return acumulado;
}

export function restar(a: Centavos, b: Centavos): Centavos {
  return centavos(a - b);
}

export function negar(a: Centavos): Centavos {
  return centavos(0 - a);
}

/** División entera de enteros no negativos, sin pasar por la coma flotante: (a − resto) ÷ b es exacta. */
function divisionEntera(a: number, b: number): number {
  return (a - (a % b)) / b;
}

/**
 * IVA de un comprobante (M2): `(neto × 21 + 50) ÷ 100` con división entera, o sea el 21 % al centavo con la mitad hacia arriba.
 * El IVA de un período es la suma de los IVA de sus comprobantes, nunca el 21 % del neto del período. Lanza si el neto es menor que 1.
 */
export function calcularIva(neto: Centavos): Centavos {
  centavos(neto); // defensa en profundidad: un cast a la fuerza no pasa
  if (neto < 1) throw new Error(`El neto de un comprobante tiene que ser de 1 centavo o más (llegó ${neto}).`);
  return centavos(divisionEntera(neto * 21 + 50, 100));
}

/** Total de un comprobante: neto + IVA (M2). */
export function totalConIva(neto: Centavos): Centavos {
  return sumar(neto, calcularIva(neto));
}

/** Un porcentaje en milésimas del total (partes por mil): 449 es 44,9 %. Siempre entero; `null` cuando el total es 0 (se muestra «—»). */
export type Milesimas = number;

/** Espacio duro (U+00A0) entre la cifra y su signo (`$ `, ` %`): no se parte al envolver la línea (M1). */
const ESPACIO_DURO = "\u00A0";

const ORDEN_ES_AR = new Intl.Collator("es-AR");

/** Orden alfabético `es-AR` de dos nombres: el desempate de M3 y M4, y el de «Por cliente» (4.3). */
export function compararNombres(a: string, b: string): number {
  return ORDEN_ES_AR.compare(a, b);
}

/** Quien aporta una parte de un total (un cliente a un tramo, por ejemplo); `nombre` desempata. */
export interface Aporte {
  nombre: string;
  importe: Centavos;
}

/**
 * Porcentajes de cada aporte sobre el total, con un decimal y sumando exactamente 100,0 (M3, método del mayor resto): cada uno
 * lleva `piso(importe × 1000 ÷ total)` milésimas y las que faltan para 1000 van de a una a los mayores restos. Entre restos
 * iguales gana el importe mayor y después el nombre (orden alfabético `es-AR`). Devuelve las milésimas en el orden de entrada;
 * con total 0 devuelve `null` en cada lugar. Lanza si un importe es negativo (los aportes son ≥ 0).
 */
export function porcentajes(aportes: readonly Aporte[]): (Milesimas | null)[] {
  for (const a of aportes) {
    if (a.importe < 0) throw new Error(`El aporte de «${a.nombre}» es negativo (${a.importe} centavos): los aportes son de 0 o más.`);
  }
  const total = sumarLista(aportes.map((a) => a.importe));
  if (total === 0) return aportes.map(() => null);
  // Con enteros: importe × 1000 ≤ 10^15. El resto se compara como entero (todos comparten el mismo total, no hace falta dividirlo).
  const filas = aportes.map((a, indice) => {
    const bruto = a.importe * 1000;
    const piso = divisionEntera(bruto, total);
    return { indice, nombre: a.nombre, importe: a.importe, piso, resto: bruto - piso * total };
  });
  const faltan = 1000 - filas.reduce((suma, f) => suma + f.piso, 0);
  // El `sort` es estable: ante un empate total (mismo resto, importe y nombre) queda el orden de entrada.
  const conMilesimaDeMas = new Set(
    [...filas]
      .sort((a, b) => b.resto - a.resto || b.importe - a.importe || ORDEN_ES_AR.compare(a.nombre, b.nombre))
      .slice(0, faltan)
      .map((f) => f.indice),
  );
  return filas.map((f) => f.piso + (conMilesimaDeMas.has(f.indice) ? 1 : 0));
}

/** Porcentaje de un solo valor (el «% de mora»): a la milésima con la mitad hacia arriba. `null` si el total es 0. Lanza si `parte` o `total` son negativos. */
export function porcentaje(parte: Centavos, total: Centavos): Milesimas | null {
  if (parte < 0) throw new Error(`La parte de un porcentaje no puede ser negativa (llegó ${parte} centavos).`);
  if (total < 0) throw new Error(`El total de un porcentaje no puede ser negativo (llegó ${total} centavos).`);
  if (total === 0) return null;
  // piso(parte × 1000 ÷ total + 1/2) = piso((2 × parte × 1000 + total) ÷ (2 × total)), todo en enteros (≤ 2 × 10^15).
  return divisionEntera(parte * 2000 + total, 2 * total);
}

/** `44,9 %` (espacio duro antes del `%`); «—» si no hay porcentaje (total 0). Lanza si las milésimas no son un entero de 0 o más (nunca «NaN %»). */
export function formatearPorcentaje(milesimas: Milesimas | null): string {
  if (milesimas === null) return "—";
  if (!Number.isInteger(milesimas) || milesimas < 0) {
    throw new Error(`Las milésimas de un porcentaje tienen que ser un entero de 0 o más (llegó ${milesimas}).`);
  }
  return `${divisionEntera(milesimas, 10)},${milesimas % 10}${ESPACIO_DURO}%`;
}

export interface Ranking<T extends Aporte> {
  /** Las `maximo` filas mayores, de mayor a menor. */
  mostrados: T[];
  /** Todo lo que no entró en `mostrados`, con su propia lista; `null` si no hay más de `maximo` filas (M4). */
  otros: { importe: Centavos; filas: T[] } | null;
  total: Centavos;
}

/**
 * Ranking de filas con «Otros» (M4): ordena por importe de mayor a menor y, en el empate, por nombre (`es-AR`, el mismo
 * desempate de M3); muestra las primeras `maximo` (5) y el resto va a «Otros», cuyo importe sale **por resta**
 * (total − suma de los mostrados), y se abre en su propia lista. «Otros» solo existe si hay más de `maximo` filas.
 */
export function rankingConOtros<T extends Aporte>(filas: readonly T[], maximo = 5): Ranking<T> {
  if (!Number.isInteger(maximo) || maximo < 1) {
    throw new Error(`El máximo de filas mostradas tiene que ser un entero de 1 o más (llegó ${maximo}).`);
  }
  const ordenadas = [...filas].sort((a, b) => b.importe - a.importe || ORDEN_ES_AR.compare(a.nombre, b.nombre));
  const mostrados = ordenadas.slice(0, maximo);
  const resto = ordenadas.slice(maximo);
  const total = sumarLista(ordenadas.map((f) => f.importe));
  const otros = resto.length === 0 ? null : { importe: restar(total, sumarLista(mostrados.map((f) => f.importe))), filas: resto };
  return { mostrados, otros, total };
}

/** `$ 1.234,56` / `−$ 1.234,56`: espacio duro (U+00A0) tras el `$`, menos tipográfico (U+2212) antes del `$`, sin `Intl` (M1). */
export function formatearImporte(importe: Centavos): string {
  const negativo = importe < 0;
  const absoluto = negativo ? 0 - importe : importe;
  const pesos = divisionEntera(absoluto, 100);
  const resto = absoluto % 100;
  const conMiles = String(pesos).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}$${ESPACIO_DURO}${conMiles},${resto < 10 ? "0" : ""}${resto}`;
}
