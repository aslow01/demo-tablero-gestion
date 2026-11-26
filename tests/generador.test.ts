// El generador de los datos de ejemplo (docs/diseno.md, 5.2 y 6.7): G1 (determinista y con huella), G2 (calendario fijo), G4 (ficticio),
// G5 (datos válidos) y las reglas del relleno. El generador **no fuerza ningún resultado**: acá no hay cifras de mora ni de ranking (eso es de
// `referencia.test.ts`, solo para la semilla publicada); lo que se prueba vale para cualquier semilla.
import { describe, expect, it } from "vitest";
import { crearAzar } from "../src/lib/datos/azar.ts";
import { CLIENTES_BASE, armarClientes } from "../src/lib/datos/clientes.ts";
import { DESDE, HASTA, PUNTO_DE_VENTA, SEMILLA_PUBLICADA } from "../src/lib/datos/constantes.ts";
import { cuitValido } from "../src/lib/datos/cuit.ts";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { generar, partirEnRecibos } from "../src/lib/datos/generador.ts";
import { huellaDe } from "../src/lib/datos/huella.ts";
import { ALIAS_DE_COMPROBANTES, ALIAS_DE_RECIBOS } from "../src/lib/datos/plantados.ts";
import { MEDIOS } from "../src/lib/dominio/claves.ts";
import { aCuentaDelRecibo, cierresDeMes, saldosAlCorte } from "../src/lib/dominio/corte.ts";
import { diasEntre, sumarDias } from "../src/lib/dominio/fechas.ts";
import type { Comprobante, Recibo } from "../src/lib/dominio/tipos.ts";
import { validarDatos } from "../src/lib/dominio/validadores.ts";

/**
 * La huella de los datos de la semilla publicada: si el generador cambia, este test falla hasta que se actualiza a propósito (en `esperado.ts`, que
 * es el único lugar donde está escrita en el código), con una línea en el registro.
 */
const HUELLA_PUBLICADA = ESPERADO.huella;

const SEMILLAS = Array.from({ length: 50 }, (_, i) => SEMILLA_PUBLICADA + i);
const publicada = generar(SEMILLA_PUBLICADA);
const baseDe = (clienteId: string) => {
  const c = CLIENTES_BASE.find((x) => x.id === clienteId);
  if (c === undefined) throw new Error(clienteId);
  return c;
};

/** Lo que el generador sortea: comprobantes de relleno (los que no son plantados) y sus recibos. */
function relleno(g: ReturnType<typeof generar>) {
  const idsPlantados = new Set(Object.values(g.plantados));
  const comprobantes = g.datos.comprobantes.filter((c) => !idsPlantados.has(c.id));
  const recibos = g.datos.recibos.filter((r) => !idsPlantados.has(r.id));
  const facturas = comprobantes.filter((c) => c.tipo === 1);
  const notas = comprobantes.filter((c) => c.tipo === 3);
  const idsDeFacturas = new Set(facturas.map((f) => f.id));
  return { comprobantes, recibos, facturas, notas, idsDeFacturas };
}

describe("G1: generar es determinista y su huella está fijada", () => {
  it("G1: dos llamadas con la semilla publicada dan la misma huella, y es la fijada", () => {
    expect(huellaDe(generar(SEMILLA_PUBLICADA).datos)).toBe(huellaDe(generar(SEMILLA_PUBLICADA).datos));
    expect(huellaDe(publicada.datos)).toBe(HUELLA_PUBLICADA);
  });

  it("G1: una semilla distinta da una huella distinta", () => {
    expect(huellaDe(generar(SEMILLA_PUBLICADA + 1).datos)).not.toBe(huellaDe(publicada.datos));
  });

  it("G1: sin argumentos usa la semilla publicada", () => {
    expect(huellaDe(generar().datos)).toBe(huellaDe(publicada.datos));
  });

  it("G1: el CUIT de los clientes es lo primero que usa el azar (5.2: el orden de las llamadas es contrato)", () => {
    expect(publicada.datos.clientes).toEqual(armarClientes(crearAzar(SEMILLA_PUBLICADA)));
  });
});

describe("5.2: la forma del conjunto", () => {
  const d = publicada.datos;

  it("versión 1, la semilla, el calendario fijo, la empresa y los 13 clientes en orden de id", () => {
    expect([d.version, d.semilla, d.desde, d.hasta]).toEqual([1, SEMILLA_PUBLICADA, DESDE, HASTA]);
    expect(d.empresa.nombre).toBe("Logística Andina Demo S.A.");
    expect(d.empresa.puntoVenta).toBe(PUNTO_DE_VENTA);
    expect(d.clientes.map((c) => c.id)).toEqual(CLIENTES_BASE.map((c) => c.id));
  });

  it("volumen: unos 700 comprobantes y unos 600 recibos (13 clientes, 22 meses, 1 a 4 facturas por cliente y mes)", () => {
    expect(d.comprobantes.length).toBeGreaterThan(600);
    expect(d.comprobantes.length).toBeLessThan(800);
    expect(d.recibos.length).toBeGreaterThan(500);
    expect(d.recibos.length).toBeLessThan(700);
  });

  it("de 1 a 4 facturas de relleno por cliente y mes, todos los meses; C09 deja de facturar el 2026-08-01", () => {
    const { facturas } = relleno(publicada);
    for (const cliente of d.clientes) {
      for (let i = 0; i < 22; i++) {
        const mes = `${i < 12 ? 2025 : 2026}-${String((i % 12) + 1).padStart(2, "0")}`;
        const n = facturas.filter((f) => f.clienteId === cliente.id && f.emision.startsWith(mes)).length;
        if (cliente.id === "C09" && mes >= "2026-08") expect(n, `C09 en ${mes}`).toBe(0);
        else {
          expect(n, `${cliente.id} en ${mes}`).toBeGreaterThanOrEqual(1);
          expect(n, `${cliente.id} en ${mes}`).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it("C2: cada tipo se numera por separado desde 1, sin saltos, y las listas van por (emisión, cliente) y (fecha, cliente)", () => {
    for (const tipo of [1, 2, 3] as const) {
      const deTipo = d.comprobantes.filter((c) => c.tipo === tipo);
      expect(deTipo.map((c) => c.numero)).toEqual(deTipo.map((_, i) => i + 1));
    }
    const clave = (c: Comprobante) => `${c.emision}|${c.clienteId}`;
    for (const tipo of [1, 3] as const) {
      const claves = d.comprobantes.filter((c) => c.tipo === tipo).map(clave);
      expect(claves).toEqual([...claves].sort());
    }
    const clavesR = d.recibos.map((r) => `${r.fecha}|${r.clienteId}`);
    expect(clavesR).toEqual([...clavesR].sort());
    expect(d.recibos.map((r) => r.id)).toEqual(d.recibos.map((_, i) => `R-0003-${String(i + 1).padStart(8, "0")}`));
  });

  it("no hay notas de débito en el relleno (T16 vive solo como fixture)", () => {
    expect(publicada.datos.comprobantes.filter((c) => c.tipo === 2)).toEqual([]);
  });
});

describe("5.3: los plantados están en los datos, con su alias", () => {
  it("el mapa alias → id tiene todos los comprobantes y recibos de la tabla, y cada id existe", () => {
    expect(Object.keys(publicada.plantados).sort()).toEqual([...ALIAS_DE_COMPROBANTES, ...ALIAS_DE_RECIBOS].sort());
    const ids = new Set([...publicada.datos.comprobantes.map((c) => c.id), ...publicada.datos.recibos.map((r) => r.id)]);
    for (const id of Object.values(publicada.plantados)) expect(ids.has(id), id).toBe(true);
    expect(new Set(Object.values(publicada.plantados)).size).toBe(Object.keys(publicada.plantados).length);
  });
});

describe("G2: calendario fijo, y un solo recibo posterior al 2026-10-31 (el de T05-F)", () => {
  it.each(SEMILLAS)("G2: semilla %i", (semilla) => {
    const g = generar(semilla);
    expect(g.datos.comprobantes.every((c) => c.emision >= DESDE && c.emision <= HASTA)).toBe(true);
    const tardios = g.datos.recibos.filter((r) => r.fecha > HASTA);
    expect(tardios.map((r) => r.id)).toEqual([g.plantados["T05-R"]]);
    expect(g.datos.recibos.every((r) => r.fecha >= DESDE)).toBe(true);
  });
});

describe("G4: es ficticio y se nota", () => {
  it("los 14 CUIT (empresa y clientes) tienen dígito verificador válido y son distintos; los nombres llevan «Demo»", () => {
    const d = publicada.datos;
    const cuits = [d.empresa.cuit, ...d.clientes.map((c) => c.cuit)];
    expect(cuits).toHaveLength(14);
    expect(cuits.every(cuitValido)).toBe(true);
    expect(new Set(cuits).size).toBe(14);
    expect([d.empresa.nombre, ...d.clientes.map((c) => c.razonSocial)].every((n) => /\bDemo\b/.test(n))).toBe(true);
  });
});

describe("G5: el conjunto pasa los validadores en las 50 semillas", () => {
  it.each(SEMILLAS)("G5: semilla %i: C2, C3, C4, R1, R3 y los de G5 (ids únicos, IVA y total con M2, fechas válidas, saldo ≥ 0)", (semilla) => {
    expect(validarDatos(generar(semilla).datos)).toEqual([]);
  });

  it("G5: todo comprobante tiene saldo ≥ 0 en los 22 cierres de mes (semilla publicada, a mano, sin pasar por el validador)", () => {
    const d = publicada.datos;
    for (const corte of cierresDeMes(d)) for (const s of saldosAlCorte(d, corte)) expect(s.saldo, `${s.comprobante.id} al ${corte}`).toBeGreaterThanOrEqual(0);
  });
});

describe("5.2: el relleno (vale para cualquier semilla)", () => {
  const corrimiento: Readonly<Record<string, readonly [number, number]>> = { puntual: [-5, 0], lento: [10, 40], moroso: [45, 90], "con-retenciones": [0, 20], "con-nc": [0, 15] };
  const rangoDe = (clienteId: string): readonly [number, number] => corrimiento[baseDe(clienteId).perfil] ?? [0, 0];

  /** Para cada factura de relleno: sus NC, y los cobros (recibo e importe imputado). */
  function cobrosDe(g: ReturnType<typeof generar>) {
    const { facturas, notas, recibos } = relleno(g);
    return facturas.map((f) => ({
      factura: f,
      nc: notas.filter((n) => n.asociadoA === f.id),
      cobros: recibos.flatMap((r) => r.imputaciones.filter((i) => i.comprobanteId === f.id).map((i) => ({ recibo: r, importe: i.importe }))),
    }));
  }

  it.each(SEMILLAS.slice(0, 10))("cada factura de relleno se cobra entera, en un solo cobro, o no se cobra; sin «a cuenta» (semilla %i)", (semilla) => {
    const g = generar(semilla);
    for (const { factura, nc, cobros } of cobrosDe(g)) {
      const aCobrar = factura.total - nc.reduce((s, n) => s + n.total, 0);
      expect(cobros.length, factura.id).toBeLessThanOrEqual(1);
      if (cobros[0] !== undefined) expect(cobros[0].importe, factura.id).toBe(aCobrar);
      if (aCobrar === 0) expect(cobros, `${factura.id} anulada por una NC del 100 %`).toHaveLength(0);
    }
    // Ningún recibo de relleno deja a cuenta: los únicos con a cuenta son T06-R y T07-R.
    const conACuenta = g.datos.recibos.filter((r) => aCuentaDelRecibo(r) > 0).map((r) => r.id);
    expect(conACuenta.sort()).toEqual([g.plantados["T06-R"], g.plantados["T07-R"]].sort());
  });

  it("en las 50 semillas hay al menos una NC del 100 % que anula la factura de relleno, y esa factura no tiene cobro ni queda con saldo", () => {
    const anuladas = SEMILLAS.flatMap((semilla) => {
      const g = generar(semilla);
      return cobrosDe(g)
        .filter(({ factura, nc }) => nc.length > 0 && nc.reduce((s, n) => s + n.total, 0) === factura.total)
        .map(({ factura, cobros }) => ({ semilla, id: factura.id, cobros: cobros.length }));
    });
    expect(anuladas.length, "NC del 100 % en las 50 semillas").toBeGreaterThanOrEqual(1);
    for (const a of anuladas) expect(a.cobros, `${a.id} (semilla ${a.semilla})`).toBe(0);
  }, 30_000); // genera 50 semillas (~4 s en reposo): el tope por defecto de 5 s falla con la máquina cargada

  it.each(SEMILLAS.slice(0, 10))("el cobro cae en vencimiento + el corrimiento del perfil (o en la emisión si ésta es posterior), y nunca después del 2026-10-31 (semilla %i)", (semilla) => {
    const g = generar(semilla);
    for (const { factura, cobros } of cobrosDe(g)) {
      const cobro = cobros[0];
      if (cobro === undefined) continue;
      const [min, max] = rangoDe(factura.clienteId);
      const corrido = diasEntre(factura.vencimiento, cobro.recibo.fecha);
      const enLaEmision = cobro.recibo.fecha === factura.emision;
      expect(enLaEmision || (corrido >= min && corrido <= max), `${factura.id} (${baseDe(factura.clienteId).perfil}) corrido ${corrido}`).toBe(true);
      expect(cobro.recibo.fecha <= HASTA).toBe(true);
    }
  });

  it.each(SEMILLAS.slice(0, 10))("una factura sin cobro es la mora natural: su cobro habría caído después del 2026-10-31, o una NC del 100 % la anuló (semilla %i)", (semilla) => {
    const g = generar(semilla);
    for (const { factura, nc, cobros } of cobrosDe(g)) {
      if (cobros.length > 0) continue;
      const anulada = nc.some((n) => n.total === factura.total);
      const mayorCobroPosible = sumarDias(factura.vencimiento, rangoDe(factura.clienteId)[1]);
      expect(anulada || mayorCobroPosible > HASTA, `${factura.id} sin cobro`).toBe(true);
    }
  });

  it("C02 cobra con retenciones en cada cobro (IIBB 2,5 % y Ganancias 1,5 % del neto, redondeo de M2); ningún otro cliente de relleno las usa", () => {
    const g = publicada;
    let deC02 = 0;
    for (const { factura, cobros } of cobrosDe(g)) {
      const cobro = cobros[0];
      if (cobro === undefined) continue;
      const retenciones = cobro.recibo.medios.filter((m) => m.medio.startsWith("retencion-")).map((m) => m.medio);
      if (factura.clienteId === "C02") {
        deC02 += 1;
        expect(retenciones.sort(), factura.id).toEqual(["retencion-ganancias", "retencion-iibb"]);
      } else {
        expect(retenciones, factura.id).toEqual([]);
      }
    }
    expect(deC02).toBeGreaterThan(10);
    // Un recibo de C02 con un solo cobro: las retenciones son exactas.
    const porId = new Map(g.datos.comprobantes.map((c) => [c.id, c]));
    let exactos = 0;
    for (const r of relleno(g).recibos.filter((x) => x.clienteId === "C02" && x.imputaciones.length === 1)) {
      const f = porId.get(r.imputaciones[0]?.comprobanteId ?? "");
      if (f === undefined) throw new Error("sin factura");
      expect(r.medios.find((m) => m.medio === "retencion-iibb")?.importe).toBe(Math.floor((f.neto * 25 + 500) / 1000));
      expect(r.medios.find((m) => m.medio === "retencion-ganancias")?.importe).toBe(Math.floor((f.neto * 15 + 500) / 1000));
      exactos += 1;
    }
    expect(exactos).toBeGreaterThan(5);
  });

  it.each(SEMILLAS.slice(0, 10))("las NC del relleno son solo de C06, parciales de 10 a 100 % con IVA de M2, a 3 a 25 días de la factura, y se descartan si pasan del 2026-10-31 (semilla %i)", (semilla) => {
    const g = generar(semilla);
    const { facturas, notas } = relleno(g);
    const porId = new Map(facturas.map((f) => [f.id, f]));
    for (const n of notas) {
      expect(n.clienteId).toBe("C06");
      const f = porId.get(n.asociadoA ?? "");
      if (f === undefined) throw new Error("NC sin factura de relleno");
      const pct = (n.neto * 100) / f.neto;
      expect(Number.isInteger(pct) && pct >= 10 && pct <= 100, `${n.id}: ${pct} %`).toBe(true);
      const dias = diasEntre(f.emision, n.emision);
      expect(dias >= 3 && dias <= 25).toBe(true);
      expect(n.emision <= HASTA).toBe(true);
      expect(n.vencimiento).toBe(n.emision);
    }
    const deC06 = facturas.filter((f) => f.clienteId === "C06").length;
    expect(notas.length).toBeGreaterThan(deC06 * 0.04);
    expect(notas.length).toBeLessThan(deC06 * 0.25);
  });

  it("un recibo de relleno es de un solo cliente y una sola fecha, con hasta 3 comprobantes; el cuarto va a otro recibo", () => {
    for (const semilla of SEMILLAS.slice(0, 10)) {
      const { recibos, idsDeFacturas } = relleno(generar(semilla));
      const grupos = new Map<string, Recibo[]>();
      for (const r of recibos) {
        expect(r.imputaciones.length).toBeGreaterThanOrEqual(1);
        expect(r.imputaciones.length).toBeLessThanOrEqual(3);
        for (const i of r.imputaciones) expect(idsDeFacturas.has(i.comprobanteId)).toBe(true);
        const k = `${r.clienteId}|${r.fecha}`;
        grupos.set(k, [...(grupos.get(k) ?? []), r]);
      }
      // En cada (cliente, fecha) solo el último recibo puede tener menos de 3.
      for (const [k, rs] of grupos) expect(rs.filter((r) => r.imputaciones.length < 3).length, k).toBeLessThanOrEqual(1);
    }
    expect(relleno(publicada).recibos.some((r) => r.imputaciones.length > 1)).toBe(true);
  });

  it("partirEnRecibos reparte en grupos de hasta 3 en orden: 1 → [1], 3 → [3], 4 → [3, 1], 7 → [3, 3, 1]", () => {
    const largo = (n: number) => partirEnRecibos(Array.from({ length: n }, (_, i) => i + 1)).map((p) => p.length);
    expect([largo(1), largo(3), largo(4), largo(7)]).toEqual([[1], [3], [3, 1], [3, 3, 1]]);
    expect(partirEnRecibos([1, 2, 3, 4])).toEqual([[1, 2, 3], [4]]);
    expect(partirEnRecibos([])).toEqual([]);
    expect(() => partirEnRecibos([1], 0)).toThrow(/entero de 1 o más/);
  });

  it("los medios de un recibo suman por medio, en el orden del tipo Medio, sin repetir ni importes en 0", () => {
    for (const r of publicada.datos.recibos) {
      const orden = r.medios.map((m) => MEDIOS.indexOf(m.medio));
      expect(orden, r.id).toEqual([...orden].sort((a, b) => a - b));
      expect(new Set(orden).size).toBe(orden.length);
      expect(r.medios.every((m) => m.importe >= 1)).toBe(true);
    }
    expect(relleno(publicada).recibos.some((r) => r.medios.some((m) => m.medio === "cheque"))).toBe(true);
  });

  it("5.1: los importes del relleno salen de los rangos de cada servicio (por la escala del cliente), en pesos enteros; el alquiler está todos los meses", () => {
    const rangos: Readonly<Record<string, readonly [number, number]>> = {
      "alquiler-4x4": [600_000, 900_000],
      "traslado-personal": [120_000, 350_000],
      "flete-liviano": [60_000, 180_000],
      "horas-espera": [20_000, 80_000],
      "km-excedentes": [15_000, 90_000],
    };
    const { facturas } = relleno(publicada);
    const vistos = new Set<string>();
    for (const f of facturas) {
      const [min, max] = rangos[f.servicio] ?? [0, 0];
      const escala = baseDe(f.clienteId).escala;
      expect(f.neto % 100, f.id).toBe(0);
      expect(f.neto / 100 >= min * escala && f.neto / 100 <= max * escala, `${f.id} ${f.servicio} ${f.neto / 100}`).toBe(true);
      vistos.add(f.servicio);
    }
    expect([...vistos].sort()).toEqual(Object.keys(rangos).sort());
    for (const cliente of publicada.datos.clientes) {
      const delMes = facturas.filter((f) => f.clienteId === cliente.id && f.emision.startsWith("2026-03"));
      expect(delMes.filter((f) => f.servicio === "alquiler-4x4").length, cliente.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("5.1: el traslado de personal es más frecuente en enero y febrero (estacionalidad leve), sobre 50 semillas", () => {
    const eneFeb = { traslado: 0, otros: 0 };
    const resto = { traslado: 0, otros: 0 };
    for (const semilla of SEMILLAS) {
      for (const f of relleno(generar(semilla)).facturas) {
        if (f.servicio === "alquiler-4x4") continue;
        const bolsa = /^\d{4}-0[12]-/.test(f.emision) ? eneFeb : resto;
        if (f.servicio === "traslado-personal") bolsa.traslado += 1;
        else bolsa.otros += 1;
      }
    }
    expect(eneFeb.traslado / (eneFeb.traslado + eneFeb.otros)).toBeGreaterThan(resto.traslado / (resto.traslado + resto.otros) + 0.1);
  });

  it("el relleno usa todos los días del mes, incluidos el 29, 30 y 31 y ninguno que no exista", () => {
    const dias = new Set<number>();
    for (const semilla of SEMILLAS.slice(0, 10)) for (const f of relleno(generar(semilla)).facturas) dias.add(Number(f.emision.slice(8, 10)));
    expect([...dias].sort((a, b) => a - b)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });
});
