// Dinero (docs/diseno.md, sección 6.1). Cada test lleva en su nombre el identificador de la regla (M1 a M5).
// Los importes de las tablas de diseno.md están en pesos; acá van en centavos enteros.
import { describe, expect, it } from "vitest";
import { TOPE_CENTAVOS, calcularIva, centavos, formatearImporte, formatearPorcentaje, negar, porcentaje, porcentajes, rankingConOtros, restar, sumar, sumarLista, totalConIva } from "../src/lib/dominio/dinero.ts";
import type { Centavos } from "../src/lib/dominio/dinero.ts";
import { pesos } from "./fixtures/armarDatos.ts";
import { MENOS, NB } from "./fixtures/formato.ts";


describe("M1: centavos, el único constructor de Centavos", () => {
  it("M1: acepta enteros seguros dentro del tope, con signo", () => {
    expect(centavos(0)).toBe(0);
    expect(centavos(30)).toBe(30);
    expect(centavos(-123456)).toBe(-123456);
    expect(centavos(TOPE_CENTAVOS)).toBe(1_000_000_000_000);
    expect(centavos(-TOPE_CENTAVOS)).toBe(-1_000_000_000_000);
  });

  it("M1: el tope es 10^12 centavos", () => {
    expect(TOPE_CENTAVOS).toBe(10 ** 12);
  });

  it("M1: lanza con 1,5", () => {
    expect(() => centavos(1.5)).toThrow(/entero/);
  });

  it("M1: lanza con NaN", () => {
    expect(() => centavos(Number.NaN)).toThrow(/entero/);
  });

  it("M1: lanza con Infinity y -Infinity", () => {
    expect(() => centavos(Number.POSITIVE_INFINITY)).toThrow(/entero/);
    expect(() => centavos(Number.NEGATIVE_INFINITY)).toThrow(/entero/);
  });

  it("M1: lanza con 2**53 (no es un entero seguro)", () => {
    expect(() => centavos(2 ** 53)).toThrow(/entero/);
  });

  it("M1: lanza con 10^12 + 1 y con -(10^12 + 1) (supera el tope)", () => {
    expect(() => centavos(10 ** 12 + 1)).toThrow(/tope/);
    expect(() => centavos(-(10 ** 12) - 1)).toThrow(/tope/);
  });

  it("M1: el mensaje dice qué valor llegó", () => {
    expect(() => centavos(1.5)).toThrow(/1\.5/);
    expect(() => centavos(10 ** 12 + 1)).toThrow(/1000000000001/);
  });

  it("M1: el cero negativo se normaliza a cero (para que formatee y compare como 0)", () => {
    expect(Object.is(centavos(-0), 0)).toBe(true);
  });
});

describe("M1: sumar, restar y negar pasan por el tope", () => {
  it("M1: sumar(10, 20) = 30, nunca 0,30000000000000004", () => {
    expect(sumar(centavos(10), centavos(20))).toBe(30);
  });

  it("M1: sumar sin sumandos da 0 y con varios los junta", () => {
    expect(sumar()).toBe(0);
    expect(sumar(centavos(1), centavos(2), centavos(3))).toBe(6);
  });

  it("M1: sumarLista suma una lista de cualquier largo (sin desparramar argumentos)", () => {
    const lista: Centavos[] = Array.from({ length: 200_000 }, () => centavos(1));
    expect(sumarLista(lista)).toBe(200_000);
    expect(sumarLista([])).toBe(0);
  });

  it("M1: sumar lanza si el resultado supera el tope", () => {
    expect(() => sumar(centavos(TOPE_CENTAVOS), centavos(1))).toThrow(/tope/);
    expect(() => sumarLista([centavos(TOPE_CENTAVOS), centavos(TOPE_CENTAVOS)])).toThrow(/tope/);
  });

  it("M1: una suma parcial que pasa el tope lanza aunque el resultado final entre (depende del orden con importes de distinto signo)", () => {
    expect(() => sumarLista([centavos(TOPE_CENTAVOS), centavos(1), centavos(-1)])).toThrow(/tope/);
    expect(sumarLista([centavos(TOPE_CENTAVOS), centavos(-1), centavos(1)])).toBe(TOPE_CENTAVOS);
  });

  it("M1: sumar acepta exactamente el tope", () => {
    expect(sumar(centavos(TOPE_CENTAVOS - 1), centavos(1))).toBe(TOPE_CENTAVOS);
  });

  it("M1: restar da con signo y lanza si supera el tope", () => {
    expect(restar(centavos(10), centavos(30))).toBe(-20);
    expect(() => restar(centavos(TOPE_CENTAVOS), centavos(-1))).toThrow(/tope/);
  });

  it("M1: negar cambia el signo y el cero sigue siendo 0 (no -0)", () => {
    expect(negar(centavos(30))).toBe(-30);
    expect(negar(centavos(-30))).toBe(30);
    expect(Object.is(negar(centavos(0)), 0)).toBe(true);
  });
});

describe("M1: formatearImporte arma el texto con enteros", () => {
  it("M1: 30 centavos → $ 0,30", () => {
    expect(formatearImporte(centavos(30))).toBe(`$${NB}0,30`);
  });

  it("M1: -123456 → −$ 1.234,56 (menos tipográfico antes del $)", () => {
    expect(formatearImporte(centavos(-123456))).toBe(`${MENOS}$${NB}1.234,56`);
  });

  it("M1: 0 → $ 0,00", () => {
    expect(formatearImporte(centavos(0))).toBe(`$${NB}0,00`);
  });

  it("M1: 100000000 → $ 1.000.000,00", () => {
    expect(formatearImporte(centavos(100000000))).toBe(`$${NB}1.000.000,00`);
  });

  it("M1: los centavos siempre llevan dos cifras (5 → 0,05; 100 → 1,00)", () => {
    expect(formatearImporte(centavos(5))).toBe(`$${NB}0,05`);
    expect(formatearImporte(centavos(100))).toBe(`$${NB}1,00`);
    expect(formatearImporte(centavos(-5))).toBe(`${MENOS}$${NB}0,05`);
  });

  it("M1: el punto de miles aparece cada tres cifras (999,99 · 1.000,00 · 10.000,00 · 100.000,00)", () => {
    expect(formatearImporte(centavos(99999))).toBe(`$${NB}999,99`);
    expect(formatearImporte(centavos(100000))).toBe(`$${NB}1.000,00`);
    expect(formatearImporte(centavos(1000000))).toBe(`$${NB}10.000,00`);
    expect(formatearImporte(centavos(10000000))).toBe(`$${NB}100.000,00`);
  });

  it("M1: el tope se formatea entero (10.000.000.000,00)", () => {
    expect(formatearImporte(centavos(TOPE_CENTAVOS))).toBe(`$${NB}10.000.000.000,00`);
    expect(formatearImporte(centavos(-TOPE_CENTAVOS))).toBe(`${MENOS}$${NB}10.000.000.000,00`);
  });

  it("M1: el cero negativo se muestra sin signo", () => {
    expect(formatearImporte(centavos(-0))).toBe(`$${NB}0,00`);
  });
});

describe("M1: un number suelto no es Centavos (el compilador lo rechaza)", () => {
  // Estos bloques no se ejecutan: los comprueba `tsc` (npm run check). Si dejaran de ser errores de tipo, el
  // `@ts-expect-error` sin uso haría fallar la compilación.
  it("M1: un literal, una cuenta con + y una división no compilan donde se pide Centavos", () => {
    const noSeEjecuta = (a: Centavos, b: Centavos): void => {
      // @ts-expect-error un número suelto no es Centavos
      formatearImporte(5);
      // @ts-expect-error sumar pide Centavos
      sumar(10, 20);
      // @ts-expect-error restar pide Centavos
      restar(a, 1);
      // @ts-expect-error el resultado de un + es un number suelto
      const suma: Centavos = a + b;
      // @ts-expect-error el resultado de una división es un number suelto
      const mitad: Centavos = a / 2;
      // @ts-expect-error un literal no es Centavos
      const literal: Centavos = 100;
      void [suma, mitad, literal];
    };
    expect(noSeEjecuta).toBeTypeOf("function");
  });

  it("M1: un Centavos sí se puede usar donde se espera un number", () => {
    const c: Centavos = centavos(5);
    const comoNumero: number = c;
    expect(comoNumero).toBe(5);
  });
});

describe("M2: IVA por comprobante, 21 % al centavo con la mitad hacia arriba, en enteros", () => {
  const iva = (neto: number): number => calcularIva(centavos(neto));

  it("M2 (T10): neto 1.000,50 → IVA 210,11 y total 1.210,61", () => {
    expect(iva(100050)).toBe(21011);
    expect(totalConIva(centavos(100050))).toBe(121061);
  });

  it("M2 (T10): tres facturas de 1.000,50 → IVA del mes 630,33 (la suma de los IVA)", () => {
    const ivas = [100050, 100050, 100050].map((n) => calcularIva(centavos(n)));
    expect(sumarLista(ivas)).toBe(63033);
    expect(sumarLista([100050, 100050, 100050].map((n) => totalConIva(centavos(n))))).toBe(363183); // 3.631,83 = 3.001,50 + 630,33
  });

  it("M2 (T10): el 21 % del neto del período daría 630,32: no es el IVA del período", () => {
    const netoDelPeriodo = sumarLista([100050, 100050, 100050].map(centavos));
    expect(calcularIva(netoDelPeriodo)).toBe(63032); // 21 % de 3.001,50 = 630,315 → 630,32
    expect(calcularIva(netoDelPeriodo)).not.toBe(63033);
  });

  it("M2: neto 50 → 11 (10,5 sube)", () => {
    expect(iva(50)).toBe(11);
  });

  it("M2: neto 250 → 53 (52,5 sube)", () => {
    expect(iva(250)).toBe(53);
  });

  it("M2: neto 5 → 1 (1,05)", () => {
    expect(iva(5)).toBe(1);
  });

  it("M2: neto 1 → 0 (0,21 no llega a medio centavo)", () => {
    expect(iva(1)).toBe(0);
  });

  it("M2: neto 100.000,00 → 21.000,00 (exacto, sin redondeo)", () => {
    expect(iva(10_000_000)).toBe(2_100_000);
  });

  it("M2: neto 0 lanza", () => {
    expect(() => calcularIva(centavos(0))).toThrow(/neto/);
  });

  it("M2: neto -5 lanza", () => {
    expect(() => calcularIva(centavos(-5))).toThrow(/neto/);
  });

  it("M2: neto 1,5 lanza (aunque se lo fuerce con un cast: defensa en profundidad)", () => {
    expect(() => calcularIva(1.5 as Centavos)).toThrow(/entero/);
  });

  it("M2: justo debajo de la mitad baja (neto 69 → 14,49 → 14) y en la mitad exacta sube (neto 150 → 31,5 → 32)", () => {
    expect(iva(69)).toBe(14);
    expect(iva(70)).toBe(15);
    expect(iva(150)).toBe(32);
  });

  it("M2: en el tope del neto (10^12) el IVA es exacto: 21 % = 210.000.000.000", () => {
    expect(iva(TOPE_CENTAVOS)).toBe(210_000_000_000);
  });

  it("M2: coincide con un cálculo aparte en BigInt para 1 a 5.000 y para valores grandes", () => {
    const aparte = (neto: bigint): number => Number((neto * 21n + 50n) / 100n);
    const grandes = [TOPE_CENTAVOS, TOPE_CENTAVOS - 1, TOPE_CENTAVOS - 37, 999_999_999_999, 123_456_789_012, 4_761_904_761];
    for (let n = 1; n <= 5000; n++) expect(iva(n)).toBe(aparte(BigInt(n)));
    for (const n of grandes) expect(iva(n)).toBe(aparte(BigInt(n)));
  });

  it("M2: el total es neto + IVA, y lanza si pasaría el tope", () => {
    expect(totalConIva(centavos(1))).toBe(1);
    expect(totalConIva(centavos(10_000_000))).toBe(12_100_000);
    expect(() => totalConIva(centavos(TOPE_CENTAVOS))).toThrow(/tope/);
  });
});

const aporte = (nombre: string, importe: Centavos): { nombre: string; importe: Centavos } => ({ nombre, importe });
const texto = (milesimas: readonly (number | null)[]): string[] => milesimas.map((m) => formatearPorcentaje(m));

describe("M3: porcentajes con un decimal que suman 100,0 (mayor resto)", () => {
  const CAMIONES = "Camiones del Norte Demo S.A."; // C11
  const CONTRATISTA = "Contratista Los Algarrobos Demo S.A."; // C05
  const SERVICIOS = "Servicios Cerro Plata Demo S.R.L."; // C10

  it("M3 (T11): tres aportes iguales de 363.000,00 → C05 33,3 · C10 33,3 · C11 33,4 (gana «Camiones…» por nombre)", () => {
    const m = porcentajes([aporte(CONTRATISTA, pesos(363000)), aporte(SERVICIOS, pesos(363000)), aporte(CAMIONES, pesos(363000))]);
    expect(m).toEqual([333, 333, 334]);
    expect(texto(m)).toEqual([`33,3${NB}%`, `33,3${NB}%`, `33,4${NB}%`]);
  });

  it("M3 (T11): el resultado no depende del orden en que llegan (gana siempre «Camiones…»)", () => {
    const m = porcentajes([aporte(CAMIONES, pesos(363000)), aporte(SERVICIOS, pesos(363000)), aporte(CONTRATISTA, pesos(363000))]);
    expect(m).toEqual([334, 333, 333]);
  });

  it("M3: 2 y 1 de 3 → 66,7 y 33,3", () => {
    const m = porcentajes([aporte("A", centavos(2)), aporte("B", centavos(1))]);
    expect(texto(m)).toEqual([`66,7${NB}%`, `33,3${NB}%`]);
  });

  it("M3: la tabla de cinco importes (1.331.000 · 726.000 · 363.000 · 363.000 · 181.500) → 44,9 · 24,5 · 12,3 · 12,2 · 6,1 = 100,0", () => {
    const m = porcentajes([
      aporte("Operadora Piedra Lunar Demo S.A.", pesos(1331000)),
      aporte("Operadora Arroyo Escondido Demo S.A.", pesos(726000)),
      aporte(SERVICIOS, pesos(363000)),
      aporte(CAMIONES, pesos(363000)),
      aporte("Montajes Sierra Chica Demo S.R.L.", centavos(18150000)),
    ]);
    // Pisos 448 + 244 + 122 + 122 + 61 = 997: los 3 restos que faltan van a .98, .90 y, en el empate de los 363.000,00, a «Camiones…».
    expect(m).toEqual([449, 245, 122, 123, 61]);
    expect(texto(m)).toEqual([`44,9${NB}%`, `24,5${NB}%`, `12,2${NB}%`, `12,3${NB}%`, `6,1${NB}%`]);
  });

  it("M3: entre restos iguales gana el importe mayor, antes que el nombre", () => {
    // 1, 8 y 5 centavos (total 14): los restos de 1 y de 8 son iguales (6); sin desempate por importe ganaría «A…» (el de 1).
    const m = porcentajes([aporte("A chica", centavos(1)), aporte("Z grande", centavos(8)), aporte("M mediana", centavos(5))]);
    expect(m).toEqual([71, 572, 357]);
  });

  it("M3 (mayor resto, no mayor importe): [1999, 1001] → [666, 334]: la milésima que falta va al importe menor, que tiene el resto mayor", () => {
    // Total 3000: 1999 × 1000 ÷ 3000 = 666 con resto 1000; 1001 × 1000 ÷ 3000 = 333 con resto 2000. Ordenando por importe daría [667, 333].
    const m = porcentajes([aporte("A grande", centavos(1999)), aporte("B chica", centavos(1001))]);
    expect(m).toEqual([666, 334]);
  });

  it("M3 (mayor resto, no mayor importe): [5, 5, 1, 1, 1, 1] → [357, 357, 72, 72, 71, 71]: los de 5 centavos no reciben nada", () => {
    // Total 14: los 5 dan 357 con resto 2 y los 1 dan 71 con resto 6; faltan 2 y los restos mayores son los de 1 centavo (los dos primeros por nombre).
    const m = porcentajes([
      aporte("A cinco", centavos(5)),
      aporte("B cinco", centavos(5)),
      aporte("C uno", centavos(1)),
      aporte("D uno", centavos(1)),
      aporte("E uno", centavos(1)),
      aporte("F uno", centavos(1)),
    ]);
    expect(m).toEqual([357, 357, 72, 72, 71, 71]);
  });

  it("M3: total 0 → «—», nunca «NaN %» ni «0 %»", () => {
    const m = porcentajes([aporte("A", centavos(0)), aporte("B", centavos(0))]);
    expect(m).toEqual([null, null]);
    expect(texto(m)).toEqual(["—", "—"]);
    expect(formatearPorcentaje(null)).not.toMatch(/NaN|0/);
  });

  it("M3: una lista vacía da una lista vacía", () => {
    expect(porcentajes([])).toEqual([]);
  });

  it("M3: un importe negativo lanza y nombra al aporte (los aportes son ≥ 0)", () => {
    expect(() => porcentajes([aporte("Cliente dañado Demo", centavos(-1)), aporte("B", centavos(5))])).toThrow(/Cliente dañado Demo/);
  });

  it("M3: un único aporte es 100,0", () => {
    expect(porcentajes([aporte("A", centavos(7))])).toEqual([1000]);
  });

  it("M3: propiedad: en 500 casos armados con una semilla fija suman 1000, ninguno se aparta más de una milésima y el orden de entrada no cambia el resultado", () => {
    let semilla = 12345;
    const siguiente = (tope: number): number => {
      semilla = ((Math.imul(semilla, 1103515245) + 12345) >>> 0) % 2147483648;
      return semilla % tope;
    };
    for (let caso = 0; caso < 500; caso++) {
      const cantidad = 1 + siguiente(9);
      const aportes = Array.from({ length: cantidad }, (_, i) => aporte(`Cliente ${i} Demo`, centavos(siguiente(5) === 0 ? 0 : 1 + siguiente(10_000_000))));
      const total = sumarLista(aportes.map((a) => a.importe));
      const m = porcentajes(aportes);
      if (total === 0) {
        expect(m.every((x) => x === null)).toBe(true);
        continue;
      }
      let suma = 0;
      const restos: { recibio: boolean; resto: bigint }[] = [];
      m.forEach((x, i) => {
        const bruto = BigInt(aportes[i]?.importe ?? 0) * 1000n;
        const exacto = bruto / BigInt(total); // piso, en BigInt
        expect(x).not.toBeNull();
        expect(BigInt(x ?? 0) - exacto === 0n || BigInt(x ?? 0) - exacto === 1n).toBe(true);
        restos.push({ recibio: BigInt(x ?? 0) - exacto === 1n, resto: bruto - exacto * BigInt(total) });
        suma += x ?? 0;
      });
      expect(suma).toBe(1000);
      // Mayor resto: quien recibió +1 tiene un resto mayor o igual que cualquiera que no lo recibió (también calculado en BigInt).
      for (const a of restos.filter((r) => r.recibio)) {
        for (const b of restos.filter((r) => !r.recibio)) expect(a.resto >= b.resto).toBe(true);
      }
      const alReves = porcentajes([...aportes].reverse()).reverse();
      expect(alReves).toEqual(m);
    }
  });
});

describe("M3: el porcentaje de un solo valor se redondea a la milésima con la mitad hacia arriba", () => {
  it("M3: 1 sobre 3 → 33,3 % y 2 sobre 3 → 66,7 %", () => {
    expect(formatearPorcentaje(porcentaje(centavos(1), centavos(3)))).toBe(`33,3${NB}%`);
    expect(formatearPorcentaje(porcentaje(centavos(2), centavos(3)))).toBe(`66,7${NB}%`);
  });

  it("M3 (S4): mora 1.000 y saldo 3.000 → 33,3 % · mora 0 y saldo 5.000 → 0,0 % · saldo 0 → «—»", () => {
    expect(formatearPorcentaje(porcentaje(pesos(1000), pesos(3000)))).toBe(`33,3${NB}%`);
    expect(formatearPorcentaje(porcentaje(pesos(0), pesos(5000)))).toBe(`0,0${NB}%`);
    expect(formatearPorcentaje(porcentaje(pesos(0), pesos(0)))).toBe("—");
    expect(porcentaje(pesos(10), pesos(0))).toBeNull();
  });

  it("M3 (S4, T12): mora 2.238.500,00 sobre saldo 2.541.000,00 → 88,1 %", () => {
    expect(formatearPorcentaje(porcentaje(centavos(223_850_000), centavos(254_100_000)))).toBe(`88,1${NB}%`);
  });

  it("M3: la mitad exacta sube (1 sobre 2.000 = 0,5 milésimas → 0,1 %; 3 sobre 2.000 = 1,5 → 0,2 %) y un cuarto baja", () => {
    expect(porcentaje(centavos(1), centavos(2000))).toBe(1);
    expect(porcentaje(centavos(3), centavos(2000))).toBe(2);
    expect(porcentaje(centavos(1), centavos(4000))).toBe(0);
    expect(porcentaje(centavos(1999), centavos(4000))).toBe(500); // 499,75 → 500
    expect(porcentaje(centavos(1998), centavos(4000))).toBe(500); // 499,5 → sube
    expect(porcentaje(centavos(1997), centavos(4000))).toBe(499); // 499,25 → baja
  });

  it("M3: una parte mayor que el total pasa de 100 % sin error (150,0 %)", () => {
    expect(formatearPorcentaje(porcentaje(centavos(1500), centavos(1000)))).toBe(`150,0${NB}%`);
  });

  it("M3: coincide con un cálculo aparte en BigInt, también en los valores grandes", () => {
    const aparte = (parte: bigint, total: bigint): number => Number((parte * 2000n + total) / (2n * total));
    const casos: [number, number][] = [[1, 3], [2, 3], [1, 7], [5, 9], [TOPE_CENTAVOS, TOPE_CENTAVOS], [TOPE_CENTAVOS - 1, TOPE_CENTAVOS], [123_456_789, 987_654_321_000]];
    for (const [parte, total] of casos) expect(porcentaje(centavos(parte), centavos(total))).toBe(aparte(BigInt(parte), BigInt(total)));
  });

  it("M3: una parte negativa lanza (los aportes son ≥ 0)", () => {
    expect(() => porcentaje(centavos(-1), centavos(3))).toThrow(/negativ/);
  });

  it("M3: un total negativo lanza, también con parte 0 (nunca un porcentaje con signo ni «NaN %»)", () => {
    expect(() => porcentaje(centavos(300), centavos(-1000))).toThrow(/negativ/);
    expect(() => porcentaje(centavos(0), centavos(-1))).toThrow(/negativ/);
  });

  it("M3: formatearPorcentaje lanza con una milésima negativa, con decimales, NaN o infinito (nunca «0,-5 %» ni «NaN,NaN %»)", () => {
    for (const malo of [-5, -1, 1.5, 0.1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => formatearPorcentaje(malo)).toThrow(/milésimas/);
    }
  });

  it("M3: formatearPorcentaje arma el texto con enteros (0 → 0,0 · 5 → 0,5 · 449 → 44,9 · 1000 → 100,0)", () => {
    expect(formatearPorcentaje(0)).toBe(`0,0${NB}%`);
    expect(formatearPorcentaje(5)).toBe(`0,5${NB}%`);
    expect(formatearPorcentaje(449)).toBe(`44,9${NB}%`);
    expect(formatearPorcentaje(1000)).toBe(`100,0${NB}%`);
  });
});

describe("M4: «Otros» en un ranking, por resta", () => {
  const filas = (importes: number[]): { nombre: string; importe: Centavos }[] => importes.map((n, i) => aporte(`Cliente ${String.fromCharCode(65 + i)} Demo`, pesos(n)));

  it("M4: 900, 800, 700, 600, 500, 300 y 200 → los 5 primeros suman 3.500, Otros = 500 (300 + 200, lista propia), total 4.000", () => {
    const r = rankingConOtros(filas([900, 800, 700, 600, 500, 300, 200]));
    expect(r.mostrados.map((f) => f.importe)).toEqual([900, 800, 700, 600, 500].map(pesos));
    expect(sumarLista(r.mostrados.map((f) => f.importe))).toBe(pesos(3500));
    expect(r.otros?.importe).toBe(pesos(500));
    expect(r.otros?.filas.map((f) => f.importe)).toEqual([pesos(300), pesos(200)]);
    expect(r.total).toBe(pesos(4000));
  });

  it("M4: con «Otros» como sexta fila los porcentajes son 22,5 · 20,0 · 17,5 · 15,0 · 12,5 · 12,5 = 100,0", () => {
    const r = rankingConOtros(filas([900, 800, 700, 600, 500, 300, 200]));
    const aportes = [...r.mostrados, aporte("Otros", r.otros?.importe ?? pesos(0))];
    const m = porcentajes(aportes);
    expect(texto(m)).toEqual(["22,5", "20,0", "17,5", "15,0", "12,5", "12,5"].map((p) => `${p}${NB}%`));
    expect(m.reduce<number>((s, x) => s + (x ?? 0), 0)).toBe(1000);
  });

  it("M4: con 5 filas no hay «Otros»", () => {
    const r = rankingConOtros(filas([900, 800, 700, 600, 500]));
    expect(r.mostrados).toHaveLength(5);
    expect(r.otros).toBeNull();
    expect(r.total).toBe(pesos(3500));
  });

  it("M4: con 6 filas, «Otros» es la sexta", () => {
    const r = rankingConOtros(filas([900, 800, 700, 600, 500, 300]));
    expect(r.otros?.importe).toBe(pesos(300));
    expect(r.otros?.filas).toHaveLength(1);
  });

  it("M4: con menos de 5 filas, o con ninguna, no hay «Otros»", () => {
    expect(rankingConOtros(filas([10, 20])).otros).toBeNull();
    const vacio = rankingConOtros([]);
    expect(vacio.mostrados).toEqual([]);
    expect(vacio.otros).toBeNull();
    expect(vacio.total).toBe(0);
  });

  it("M4: ordena de mayor a menor y, en el empate, por nombre (es-AR), también en el corte entre los 5 primeros y «Otros»", () => {
    const entrada = [
      aporte("Servicios Cerro Plata Demo S.R.L.", pesos(100)),
      aporte("Camiones del Norte Demo S.A.", pesos(100)),
      aporte("Operadora Piedra Lunar Demo S.A.", pesos(500)),
      aporte("Contratista Los Algarrobos Demo S.A.", pesos(100)),
      aporte("Obras Cumbre Demo S.A.", pesos(300)),
      aporte("Minera Cordón Azul Demo S.A.", pesos(200)),
    ];
    const r = rankingConOtros(entrada);
    expect(r.mostrados.map((f) => f.nombre)).toEqual([
      "Operadora Piedra Lunar Demo S.A.",
      "Obras Cumbre Demo S.A.",
      "Minera Cordón Azul Demo S.A.",
      "Camiones del Norte Demo S.A.",
      "Contratista Los Algarrobos Demo S.A.",
    ]);
    expect(r.otros?.filas.map((f) => f.nombre)).toEqual(["Servicios Cerro Plata Demo S.R.L."]);
  });

  it("M4: un máximo distinto de 5 se respeta", () => {
    const r = rankingConOtros(filas([40, 30, 20, 10]), 2);
    expect(r.mostrados).toHaveLength(2);
    expect(r.otros?.importe).toBe(pesos(30));
  });

  it("M4: un máximo que no es un entero de 1 o más lanza (con -1 un slice dejaría «Otros» con la última fila)", () => {
    for (const malo of [-1, 0, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => rankingConOtros(filas([10, 20, 30]), malo)).toThrow(/máximo/);
    }
    expect(rankingConOtros(filas([10, 20, 30]), 1).mostrados).toHaveLength(1);
  });

  it("M4: el importe de «Otros» (por resta) es la suma de las filas de su lista", () => {
    const r = rankingConOtros(filas([5, 90, 7, 33, 21, 2, 60, 1]));
    expect(r.otros?.importe).toBe(sumarLista(r.otros?.filas.map((f) => f.importe) ?? []));
  });
});
