// El punto de carga de los datos de la demo: `validarDatos` corre una vez al cargar, y un dato dañado se informa en vez de
// calcularse en silencio (una NC asociada a una ND no la ve ningún control cruzado: los dos caminos la restan de la ND). Los datos cargados quedan congelados.
import { describe, expect, it } from "vitest";
import { cargarDatos, cargarDatosDeEjemplo } from "../src/lib/datos/cargar.ts";
import { SEMILLA_PUBLICADA } from "../src/lib/datos/constantes.ts";
import { generar } from "../src/lib/datos/generador.ts";
import { huellaDe } from "../src/lib/datos/huella.ts";
import { controlesCruzados } from "../src/lib/dominio/controles.ts";
import { medida, controlar } from "../src/lib/dominio/medidas.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { fixtureT16 } from "./fixtures/casos.ts";

/** El T16 con una NC de 10.000,00 asociada a la ND (el dato dañado que ningún control ve). */
function ncAsociadaAUnaNd() {
  const t16 = fixtureT16();
  return armarDatos({
    comprobantes: [
      { clave: "T16-F", cliente: "C13", emision: "2026-03-10", neto: pesos(600_000) },
      { clave: "T16-ND", tipo: 2, cliente: "C13", emision: "2026-04-02", neto: pesos(24_000), asociadoA: "T16-F" },
      { clave: "NC-MAL", tipo: 3, cliente: "C13", emision: "2026-04-10", neto: pesos(10_000), asociadoA: "T16-ND" },
    ],
    recibos: [{ clave: "R", cliente: "C13", fecha: "2026-04-09", medios: [{ importe: pesos(726_000) }], imputaciones: [{ comprobante: "T16-F", importe: pesos(726_000) }] }],
    clientes: t16.datos.clientes,
  });
}

describe("cargar valida una vez y no calcula en silencio con datos dañados", () => {
  it("el dato dañado de verdad: ningún control cruzado ni controlar lo ve (por eso se valida al cargar)", () => {
    const d = ncAsociadaAUnaNd().datos;
    expect(controlesCruzados(d, "2026-04-30")).toEqual([]);
    expect(() => controlar(medida(d, "2026-04-30", "saldo"))).not.toThrow();
  });

  it("con ese dato dañado, cargar informa el problema (regla y dato) y no entrega los datos", () => {
    const r = cargarDatos(ncAsociadaAUnaNd().datos);
    expect(r.estado).toBe("error");
    if (r.estado !== "error") return;
    expect(r.problemas.length).toBeGreaterThan(0);
    expect(r.problemas[0]?.regla).toBe("C3");
    expect(r.mensaje).toMatch(/datos de ejemplo/i);
    expect(r.mensaje).toContain(r.problemas[0]?.dato ?? "?");
    expect("datos" in r).toBe(false);
  });

  it("un generador que produce datos dañados (inyectado) también se informa", () => {
    const dañado = () => ({ datos: ncAsociadaAUnaNd().datos, plantados: {} });
    expect(cargarDatosDeEjemplo(SEMILLA_PUBLICADA, dañado).estado).toBe("error");
  });

  it("con datos válidos entrega los datos sin cambios (misma huella) y congelados", () => {
    const r = cargarDatosDeEjemplo();
    expect(r.estado).toBe("ok");
    if (r.estado !== "ok") return;
    expect(huellaDe(r.datos)).toBe(huellaDe(generar(SEMILLA_PUBLICADA).datos));
    expect(Object.isFrozen(r.datos)).toBe(true);
    expect(Object.isFrozen(r.datos.comprobantes)).toBe(true);
    expect(() => r.datos.comprobantes.push(r.datos.comprobantes[0] as never)).toThrow(TypeError);
  });

  it("los datos de ejemplo traen también los casos plantados (alias → id): cada alias apunta a un comprobante o a un recibo que existe, y quedan congelados", () => {
    const r = cargarDatosDeEjemplo();
    expect(r.estado).toBe("ok");
    if (r.estado !== "ok") return;
    expect(r.plantados).toEqual(generar(SEMILLA_PUBLICADA).plantados);
    const ids = new Set([...r.datos.comprobantes.map((c) => c.id), ...r.datos.recibos.map((x) => x.id)]);
    for (const alias of ["T02-F", "T04-F", "T05-F", "T08-F", "T12-d91", "T08-R", "T06-R"]) {
      const id = r.plantados[alias];
      expect(id, alias).toBeDefined();
      expect(ids.has(id as string), alias).toBe(true);
    }
    expect(Object.isFrozen(r.plantados)).toBe(true);
  });

  it("con un generador inyectado, los plantados son los que ese generador devuelve", () => {
    const base = generar(SEMILLA_PUBLICADA);
    const r = cargarDatosDeEjemplo(SEMILLA_PUBLICADA, () => ({ datos: base.datos, plantados: { X: "1-0003-00000001" } }));
    expect(r.estado === "ok" && r.plantados).toEqual({ X: "1-0003-00000001" });
  });

  it("con datos dañados no hay plantados (el error no trae nada para mostrar)", () => {
    const r = cargarDatosDeEjemplo(SEMILLA_PUBLICADA, () => ({ datos: ncAsociadaAUnaNd().datos, plantados: { X: "1-0003-00000001" } }));
    expect(r.estado).toBe("error");
    expect("plantados" in r).toBe(false);
  });

  it("cargarDatos (sin generador) no inventa plantados", () => {
    const r = cargarDatos(generar(SEMILLA_PUBLICADA).datos);
    expect(r.estado).toBe("ok");
    expect("plantados" in r).toBe(false);
  });

  it("el mensaje de varios problemas muestra los primeros y cuenta el resto, sin volcar todo", () => {
    const d = ncAsociadaAUnaNd().datos;
    const muchos = { ...d, comprobantes: [...d.comprobantes, ...d.comprobantes.map((c) => ({ ...c }))] };
    const r = cargarDatos(muchos);
    expect(r.estado).toBe("error");
    if (r.estado === "error") expect(r.mensaje.length).toBeLessThan(900);
  });
});
