// Controles cruzados entre medidas (docs/diseno.md, D3 y A2): X1 a X6, cada lado con su propio cálculo. Cada control se prueba en los dos
// sentidos: con los datos de los fixtures no falla, y con una medida alterada a propósito sí (el control no es un número comparado consigo mismo).
import { describe, expect, it } from "vitest";
import { cierresDeMes, posicionDelCliente } from "../src/lib/dominio/corte.ts";
import type { PosicionDelCliente } from "../src/lib/dominio/corte.ts";
import { centavos, formatearImporte, sumar } from "../src/lib/dominio/dinero.ts";
import { ErrorDeCierre } from "../src/lib/dominio/medidas.ts";
import { CLAVES_DEL_X3, controlesCruzados, exigirControles, valoresDe } from "../src/lib/dominio/controles.ts";
import type { IdDeControl, PosicionDe, ValorDeMedida } from "../src/lib/dominio/controles.ts";
import { alterando } from "./fixtures/alterar.ts";
import { CASOS_PLANTADOS, FIXTURES, fixtureEjemploD3, fixtureOtros, fixtureOtrosConPagador, fixtureR4 } from "./fixtures/casos.ts";

const controlesQueFallan = (fallos: readonly { control: IdDeControl }[]): IdDeControl[] => [...new Set(fallos.map((f) => f.control))].sort();

describe("D3: con los datos de los fixtures ningún control cruzado falla, en todos los cortes de mes", () => {
  const todos = [
    ...Object.entries(FIXTURES).map(([alias, f]) => [alias, f] as const),
    ...Object.entries(CASOS_PLANTADOS).map(([alias, f]) => [alias, f] as const),
    ["D3-ejemplo", fixtureEjemploD3] as const,
    ["Otros", fixtureOtros] as const,
    ["Otros-con-pagador", fixtureOtrosConPagador] as const,
  ];

  for (const [alias, armar] of todos) {
    it(`D3: X1 a X6 sobre ${alias} en los 22 cierres de mes y en el 15/05 y el 03/11 (cualquier fecha civil)`, () => {
      const a = armar();
      for (const corte of [...cierresDeMes(a.datos), "2026-05-15", "2026-11-03"]) {
        expect(controlesCruzados(a.datos, corte), `${alias} al ${corte}`).toEqual([]);
      }
    });
  }
});

describe("D3: cada control falla si se altera a propósito una medida (cada lado con su propio cálculo)", () => {
  const a = CASOS_PLANTADOS.T17();
  const corte = "2026-10-31";
  const bien = (): ValorDeMedida => valoresDe(a.datos, corte);

  it("sin alterar nada, no falla ninguno", () => {
    expect(controlesCruzados(a.datos, corte, bien())).toEqual([]);
  });

  it("A2 y X1: 1 centavo de más en un tramo → falla X1 (los cinco tramos ya no suman el saldo)", () => {
    const fallos = controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "tramo-31-60" && f.clienteId === undefined));
    expect(controlesQueFallan(fallos)).toContain("X1");
    const x1 = fallos.find((f) => f.control === "X1");
    expect([x1?.esperado, x1?.obtenido]).toEqual([60_500_000, 60_500_001]);
  });

  it("X2: 1 centavo de más en un tramo vencido → falla X2; en «no vencido» no (no es parte de la mora)", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "tramo-mas-90" && f.clienteId === undefined)))).toContain("X2");
    const sinMora = controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "tramo-no-vencido" && f.clienteId === undefined));
    expect(controlesQueFallan(sinMora)).toContain("X1");
    expect(controlesQueFallan(sinMora)).not.toContain("X2");
  });

  it("X2: 1 centavo de más en la mora de la empresa → falla X2", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "mora" && f.clienteId === undefined)))).toContain("X2");
  });

  it("X3: 1 centavo de más en el saldo de un cliente → falla X3 (la empresa ya no es la suma de sus 13 clientes), nombrando la medida", () => {
    const fallos = controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "saldo" && f.clienteId === "C05"));
    expect(controlesQueFallan(fallos)).toContain("X3");
    expect(fallos.find((f) => f.control === "X3")?.detalle).toContain("saldo");
  });

  it("X3: también falla con la medida de la empresa alterada, y con una de las cinco del mes", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "mora" && f.clienteId === undefined)))).toContain("X3");
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "cobranza-mes" && f.clienteId === "C05" && f.mes === undefined)))).toContain("X3");
  });

  it("X4: 1 centavo de más en el saldo neto de un cliente → falla X4 (la cuenta corriente deja de coincidir)", () => {
    const fallos = controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "saldo-neto" && f.clienteId === "C05"));
    expect(controlesQueFallan(fallos)).toContain("X4");
    expect(fallos.find((f) => f.control === "X4")?.detalle).toContain("C05");
  });

  it("X4: 1 centavo de más en los pagos a cuenta de un cliente rompe «saldo − pagos − favor = saldo neto»", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "pagos-a-cuenta" && f.clienteId === "C05")))).toContain("X4");
  });

  it("X4: 1 centavo de más en el saldo neto de la empresa → falla X4 (la empresa ya no es la suma de los clientes)", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "saldo-neto" && f.clienteId === undefined)))).toContain("X4");
  });

  it("X5: 1 centavo de más en el IVA del mes → falla X5 (facturado con IVA ≠ facturación + IVA)", () => {
    const fallos = controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "iva-mes" && f.clienteId === undefined && f.mes === "2026-07"));
    expect(controlesQueFallan(fallos)).toContain("X5");
    expect(fallos.find((f) => f.control === "X5")?.detalle).toContain("2026-07");
  });

  it("X5: también falla en un cliente solo y en el mes del corte", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "facturado-con-iva-mes" && f.clienteId === "C05" && f.mes === "2026-07")))).toContain("X5");
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "facturacion-mes" && f.clienteId === undefined && f.mes === "2026-10")))).toContain("X5");
  });

  it("X6: 1 centavo de más en un mes de la cobranza → falla X6 (el año ya no es la suma de los doce meses)", () => {
    const fallos = controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "cobranza-mes" && f.clienteId === undefined && f.mes === "2026-08"));
    expect(controlesQueFallan(fallos)).toContain("X6");
    expect(fallos.find((f) => f.control === "X6")?.detalle).toContain("cobranza-mes");
  });

  it("X6: también con la facturación y con las retenciones", () => {
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "facturacion-mes" && f.clienteId === undefined && f.mes === "2026-07")))).toContain("X6");
    expect(controlesQueFallan(controlesCruzados(a.datos, corte, alterando(bien(), (c, f) => c === "retenciones-mes" && f.clienteId === undefined && f.mes === "2026-08")))).toContain("X6");
  });

  it("X1 a X6: un control que falla trae el control, un detalle y los dos valores", () => {
    const [f] = controlesCruzados(a.datos, corte, alterando(bien(), (c, fl) => c === "tramo-31-60" && fl.clienteId === undefined));
    expect(f).toBeDefined();
    expect(f?.detalle.length).toBeGreaterThan(10);
    expect(typeof f?.esperado).toBe("number");
    expect(typeof f?.obtenido).toBe("number");
  });
});

describe("D3 (X3): cada una de las 12 claves de su lista se controla (si una se cayera de la lista, nadie se daría cuenta)", () => {
  const a = CASOS_PLANTADOS.T17();
  const corte = "2026-10-31";

  it("X3: son 12 claves distintas: saldo, mora, los cinco tramos y las cinco del mes", () => {
    expect(new Set(CLAVES_DEL_X3).size).toBe(12);
    expect(CLAVES_DEL_X3).toEqual(expect.arrayContaining(["saldo", "mora", "tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90", "facturacion-mes", "facturado-con-iva-mes", "iva-mes", "cobranza-mes", "retenciones-mes"]));
  });

  it.each(CLAVES_DEL_X3.map((c) => [c] as const))("X3: 1 centavo de más en %s de un cliente → falla X3 nombrando la medida", (clave) => {
    const fallos = controlesCruzados(a.datos, corte, alterando(valoresDe(a.datos, corte), (c, f) => c === clave && f.clienteId === "C05" && f.mes === undefined));
    const x3 = fallos.filter((f) => f.control === "X3");
    expect(x3.map((f) => f.detalle).join(" ")).toContain(clave);
  });
});

describe("D3 (X4): la posición del cliente de corte.ts (por listado) contra las medidas (por agregación)", () => {
  const a = CASOS_PLANTADOS.T17();
  const corte = "2026-10-31";
  const campos: readonly (keyof PosicionDelCliente)[] = ["saldo", "aCuenta", "pagosACuenta", "saldosAFavor", "saldoNeto"];
  const alterada = (campo: keyof PosicionDelCliente, delta = 1): PosicionDe => (datos, clienteId, c) => {
    const p = posicionDelCliente(datos, clienteId, c);
    return clienteId === "C05" ? { ...p, [campo]: sumar(p[campo], centavos(delta)) } : p;
  };

  it("X4: con la posición de verdad no falla (en T17 y en los fixtures de R4 y T07, con pagos a cuenta y con saldos a favor)", () => {
    for (const [d, c] of [[a.datos, corte], [fixtureR4().datos, corte], [CASOS_PLANTADOS.T07().datos, "2026-08-31"]] as const) {
      expect(controlesCruzados(d, c, valoresDe(d, c), posicionDelCliente)).toEqual([]);
    }
  });

  it.each(campos.map((c) => [c] as const))("X4: 1 centavo de más en %s de la posición de C05 → falla X4 nombrando al cliente", (campo) => {
    const fallos = controlesCruzados(a.datos, corte, valoresDe(a.datos, corte), alterada(campo));
    expect(controlesQueFallan(fallos)).toEqual(["X4"]);
    expect(fallos.map((f) => f.detalle).join(" ")).toContain("C05");
  });

  it("X4: la posición alterada en otro cliente no se confunde con la de C05 (el detalle nombra a quien falla)", () => {
    const fallos = controlesCruzados(a.datos, corte, valoresDe(a.datos, corte), (d, id, c) => {
      const p = posicionDelCliente(d, id, c);
      return id === "C03" ? { ...p, saldo: sumar(p.saldo, centavos(1)) } : p;
    });
    expect(fallos.every((f) => f.detalle.includes("C03"))).toBe(true);
    expect(fallos.length).toBeGreaterThan(0);
  });
});

describe("D2: exigirControles lanza ErrorDeCierre con el primer control que falla", () => {
  const a = CASOS_PLANTADOS.T17();

  it("D2: con las medidas bien no lanza", () => {
    expect(() => exigirControles(a.datos, "2026-10-31")).not.toThrow();
  });

  it("D2: con una medida alterada lanza ErrorDeCierre con la clave del control (X1) y los dos valores", () => {
    const valores = alterando(valoresDe(a.datos, "2026-10-31"), (c, f) => c === "tramo-31-60" && f.clienteId === undefined);
    let capturado: unknown;
    try {
      exigirControles(a.datos, "2026-10-31", valores);
    } catch (e) {
      capturado = e;
    }
    expect(capturado).toBeInstanceOf(ErrorDeCierre);
    expect((capturado as ErrorDeCierre).clave).toBe("X1");
    expect((capturado as ErrorDeCierre).diferencia).not.toBe(0);
  });

  it("D2: la descripción del error es la del control (sin importes), no el mensaje que trae los valores", () => {
    const valores = alterando(valoresDe(a.datos, "2026-10-31"), (c, f) => c === "tramo-31-60" && f.clienteId === undefined);
    let capturado: unknown;
    try {
      exigirControles(a.datos, "2026-10-31", valores);
    } catch (e) {
      capturado = e;
    }
    const e = capturado as ErrorDeCierre;
    expect(e.descripcion).toBe("el saldo a cobrar y la suma de los cinco tramos de antigüedad");
    expect(e.descripcion).not.toContain(formatearImporte(e.valor));
    expect(e.descripcion).not.toContain(formatearImporte(e.suma));
    expect(e.message).toContain(formatearImporte(e.valor));
  });
});

describe("D3: valoresDe guarda lo ya calculado y valida como medida()", () => {
  it("D3: pedir dos veces lo mismo da lo mismo, y un cliente inexistente lanza", () => {
    const a = CASOS_PLANTADOS.T17();
    const v = valoresDe(a.datos, "2026-10-31");
    expect(v("saldo")).toBe(60_500_000);
    expect(v("saldo")).toBe(60_500_000);
    expect(v("saldo", { clienteId: "C05" })).toBe(60_500_000);
    expect(() => v("saldo", { clienteId: "C99" })).toThrow(/C99/);
  });
});
