// Formato de los modelos de vista (docs/diseno.md, M1; docs/diseno-ui.md, 5.3 y 5.9): el importe partido en entero y centavos para la cifra grande, la posición
// del ubicador de un comprobante, la búsqueda sin tildes ni mayúsculas y el último día del mes. Todo puro y sin texto visible.
import { describe, expect, it } from "vitest";
import { centavos, formatearImporte } from "../src/lib/dominio/dinero.ts";
import { tramoDe } from "../src/lib/dominio/antiguedad.ts";
import { normalizarBusqueda, normalizarTexto, partesDeImporte, posicionEnRegla, ubicadorDe, ultimoDiaDelMes } from "../src/lib/vistas/formato.ts";
import { LARGO_MAXIMO_DE_BUSQUEDA } from "../src/lib/vistas/tipos.ts";

describe("partesDeImporte: el texto de formatearImporte partido en signo, entero y centavos (sin aritmética nueva, M1)", () => {
  it.each([
    [0, false, "0", "00"],
    [5, false, "0", "05"],
    [99, false, "0", "99"],
    [100, false, "1", "00"],
    [123_456, false, "1.234", "56"],
    [630_648_128, false, "6.306.481", "28"],
    [2_851_366_210, false, "28.513.662", "10"],
    [-5_000_000, true, "50.000", "00"],
    [-1, true, "0", "01"],
    [100_000_000_000, false, "1.000.000.000", "00"],
  ])("%i centavos → negativo %s, entero «%s», centavos «%s»", (importe, negativo, enteros, cents) => {
    expect(partesDeImporte(centavos(importe))).toEqual({ negativo, enteros, centavos: cents });
  });

  it("volver a armar el texto con las partes da exactamente formatearImporte (espacio duro y menos tipográfico incluidos)", () => {
    const muestra = [0, 1, 9, 10, 99, 100, 101, 999, 1_000, 99_999, 100_000, 123_456_789, 2_851_366_210, 999_999_999_999, 1_000_000_000_000];
    for (const n of muestra) {
      for (const signo of [1, -1]) {
        const importe = centavos(n * signo);
        const p = partesDeImporte(importe);
        expect(`${p.negativo ? "−" : ""}$ ${p.enteros},${p.centavos}`, String(importe)).toBe(formatearImporte(importe));
      }
    }
  });

  it("el cero no es negativo", () => {
    expect(partesDeImporte(centavos(0)).negativo).toBe(false);
    expect(partesDeImporte(centavos(-0)).negativo).toBe(false);
  });
});

describe("posicionEnRegla: dónde cae la marca del ubicador (milésimas del ancho de la barra, 5 tramos de un quinto)", () => {
  it.each([
    [-30, 3], // se recorta a −29: el comienzo de «No vencido»
    [-29, 3],
    [0, 196],
    [1, 203],
    [30, 396],
    [31, 403],
    [60, 596],
    [61, 603],
    [90, 796],
    [91, 801],
    [180, 998],
    [400, 998], // se recorta a 180: el final de «Más de 90»
  ])("%i días → %i milésimas", (atraso, milesimas) => {
    expect(posicionEnRegla(atraso)).toBe(milesimas);
  });

  it("crece con el atraso, nunca sale de 0 a 1000 y cada marca cae dentro del quinto de su tramo", () => {
    let anterior = -1;
    for (let d = -60; d <= 300; d++) {
      const m = posicionEnRegla(d);
      expect(m, `${d} días`).toBeGreaterThanOrEqual(anterior);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(1000);
      const indice = ["no-vencido", "1-30", "31-60", "61-90", "mas-90"].indexOf(tramoDe(d));
      expect(Math.floor(m / 200), `${d} días`).toBe(indice);
      anterior = m;
    }
  });

  it("un atraso que no es entero es un error (el tramo no se puede decidir)", () => {
    expect(() => posicionEnRegla(1.5)).toThrow(/entero/);
    expect(() => posicionEnRegla(Number.NaN)).toThrow();
  });
});

describe("ubicadorDe: la marca con su tramo y el lado donde el rótulo no se sale de la barra", () => {
  it("trae el atraso, el tramo de A1 y la posición", () => {
    expect(ubicadorDe(60)).toEqual({ atraso: 60, tramo: "31-60", milesimas: 596, borde: null });
    expect(ubicadorDe(91)).toEqual({ atraso: 91, tramo: "mas-90", milesimas: 801, borde: null });
  });

  it("cerca del comienzo, el rótulo se alinea a la izquierda; cerca del final, a la derecha; en el medio, centrado", () => {
    expect(ubicadorDe(-29).borde).toBe("izquierdo");
    expect(ubicadorDe(-20).borde).toBe("izquierdo");
    expect(ubicadorDe(0).borde).toBeNull();
    expect(ubicadorDe(150).borde).toBe("derecho");
    expect(ubicadorDe(180).borde).toBe("derecho");
    expect(ubicadorDe(400).borde).toBe("derecho");
  });
});

describe("normalizarBusqueda: minúsculas, sin tildes ni espacios de los costados, y nunca más de 60 caracteres", () => {
  it.each([
    ["Algarrobos", "algarrobos"],
    ["  ALGARRÓBOS  ", "algarrobos"],
    ["Peñasco", "penasco"],
    ["Ñandú", "nandu"],
    ["1-0003-00000562", "1-0003-00000562"],
    ["", ""],
    ["   ", ""],
  ])("«%s» → «%s»", (texto, esperado) => {
    expect(normalizarBusqueda(texto)).toBe(esperado);
  });

  it("recorta a 60 caracteres antes de normalizar y no parte un emoji por la mitad", () => {
    expect(LARGO_MAXIMO_DE_BUSQUEDA).toBe(60);
    expect(normalizarBusqueda("a".repeat(500))).toBe("a".repeat(60));
    const emojis = "😀".repeat(100);
    expect(Array.from(normalizarBusqueda(emojis))).toHaveLength(60);
  });

  it("una entrada hostil sigue siendo texto inofensivo (no es una expresión regular ni HTML)", () => {
    for (const hostil of ["<img src=x onerror=alert(1)>", "(.*)+$", "__proto__", "%E0%A4%A", "\u0000‮"]) {
      const r = normalizarBusqueda(hostil);
      expect(typeof r).toBe("string");
      expect("algarrobos".includes(r)).toBe(r === "");
    }
  });
});

describe("normalizarTexto: un texto de los datos en la forma de la búsqueda, sin recortarlo", () => {
  it("minúsculas, sin tildes ni espacios de los costados, y no corta un nombre largo", () => {
    expect(normalizarTexto("  Ingeniería Paso Largo Demo S.R.L. ")).toBe("ingenieria paso largo demo s.r.l.");
    expect(normalizarTexto("a".repeat(200))).toHaveLength(200);
  });
});

describe("ultimoDiaDelMes: el cierre del mes de una fecha civil", () => {
  it.each([
    ["2026-02-10", "2026-02-28"],
    ["2024-02-01", "2024-02-29"],
    ["2026-10-31", "2026-10-31"],
    ["2026-04-01", "2026-04-30"],
    ["2025-12-15", "2025-12-31"],
  ])("%s → %s", (fecha, esperado) => {
    expect(ultimoDiaDelMes(fecha)).toBe(esperado);
  });
});
