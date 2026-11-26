// Navegación: de una ruta, la sección que queda marcada, si es una pantalla raíz, las migas y el padre (src/lib/estado/navegacion.ts). Es estructura,
// sin texto: los nombres de cada miga los pone la capa de rótulos. Los destinos salen de las rutas del enrutador (docs/diseno-ui.md, sección 4).
import { describe, expect, it } from "vitest";
import { CLAVES_DEL_CATALOGO } from "../src/lib/dominio/claves.ts";
import type { Ruta, RutaNavegable } from "../src/lib/estado/enrutador.ts";
import { aHash, resolverDireccion } from "../src/lib/estado/enrutador.ts";
import { esRaiz, migasDe, ofreceAyudaEnLaBarra, padreDe, seccionDe, SECCIONES } from "../src/lib/estado/navegacion.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

const T12 = fixtureT12();
const datos = T12.datos;
const idFactura = T12.id("d30");
const clienteDeLaFactura = datos.comprobantes.find((c) => c.id === idFactura)?.clienteId ?? "";
const corte = "2026-10-31";

const resumen: RutaNavegable = { tipo: "resumen" };
const clientes: RutaNavegable = { tipo: "clientes" };
const meses: RutaNavegable = { tipo: "meses" };

describe("seccionDe: qué pestaña queda marcada", () => {
  it.each([
    [{ tipo: "resumen" }, "resumen"],
    [{ tipo: "comprobantes" }, "comprobantes"],
    [{ tipo: "comprobantes", tramo: "vencidos", q: "x" }, "comprobantes"],
    [{ tipo: "clientes" }, "clientes"],
    [{ tipo: "clientes", filtro: "revisar" }, "clientes"],
    [{ tipo: "meses" }, "meses"],
    [{ tipo: "cliente", clienteId: "C05" }, "clientes"],
    [{ tipo: "comprobante", comprobanteId: "1-0003-00000001" }, "comprobantes"],
  ] as const)("%j → %s", (ruta, seccion) => {
    expect(seccionDe(ruta)).toBe(seccion);
  });

  it("un desglose de una medida del mes cuelga de Meses; el de cualquier otra medida, del Resumen", () => {
    for (const clave of CLAVES_DEL_CATALOGO) {
      const delMes = ["facturacion-mes", "facturado-con-iva-mes", "iva-mes", "cobranza-mes", "retenciones-mes"].includes(clave);
      expect(seccionDe({ tipo: "desglose", clave }), clave).toBe(delMes ? "meses" : "resumen");
    }
    expect(seccionDe({ tipo: "desglose", clave: "mora-otros" })).toBe("resumen");
    expect(seccionDe({ tipo: "desglose", clave: "mora", clienteId: "C05" })).toBe("resumen");
  });

  it("«Cómo se calcula» es una página aparte (no marca ninguna pestaña) y los errores tampoco", () => {
    expect(seccionDe({ tipo: "como-se-calcula" })).toBeNull();
    expect(seccionDe({ tipo: "desconocida" })).toBeNull();
    expect(seccionDe({ tipo: "inexistente", vista: "cliente" })).toBeNull();
  });

  it("las cuatro secciones, en el orden de las pestañas", () => {
    expect(SECCIONES).toEqual(["resumen", "comprobantes", "clientes", "meses"]);
  });
});

describe("esRaiz: las cuatro pantallas que son una pestaña", () => {
  it("son raíz el Resumen, Comprobantes, Clientes y Meses, con sus filtros", () => {
    for (const ruta of [resumen, { tipo: "comprobantes", q: "a" }, { tipo: "clientes", filtro: "con-mora" }, meses] as const) expect(esRaiz(ruta), ruta.tipo).toBe(true);
  });

  it("no son raíz el detalle, «Cómo se calcula» ni los errores", () => {
    for (const ruta of [
      { tipo: "cliente", clienteId: "C05" },
      { tipo: "comprobante", comprobanteId: idFactura },
      { tipo: "desglose", clave: "mora" },
      { tipo: "como-se-calcula" },
      { tipo: "desconocida" },
      { tipo: "inexistente", vista: "desglose" },
    ] as const) {
      expect(esRaiz(ruta), ruta.tipo).toBe(false);
    }
  });
});

describe("migasDe: el camino hasta la pantalla, sin texto", () => {
  it("una raíz tiene una sola miga, la actual, sin destino", () => {
    expect(migasDe(resumen, datos, corte)).toEqual([{ miga: { que: "seccion", seccion: "resumen" }, destino: null }]);
    expect(migasDe({ tipo: "comprobantes", tramo: "1-30" }, datos, corte)).toEqual([{ miga: { que: "seccion", seccion: "comprobantes" }, destino: null }]);
    expect(migasDe(clientes, datos, corte)).toEqual([{ miga: { que: "seccion", seccion: "clientes" }, destino: null }]);
    expect(migasDe(meses, datos, corte)).toEqual([{ miga: { que: "seccion", seccion: "meses" }, destino: null }]);
  });

  it("«Cómo se calcula» y los errores: una sola miga", () => {
    expect(migasDe({ tipo: "como-se-calcula" }, datos, corte)).toEqual([{ miga: { que: "como-se-calcula" }, destino: null }]);
    expect(migasDe({ tipo: "desconocida" }, datos, corte)).toEqual([{ miga: { que: "error" }, destino: null }]);
    expect(migasDe({ tipo: "inexistente", vista: "comprobante" }, datos, corte)).toEqual([{ miga: { que: "error" }, destino: null }]);
  });

  it("un cliente cuelga de Clientes", () => {
    expect(migasDe({ tipo: "cliente", clienteId: "C05" }, datos, corte)).toEqual([
      { miga: { que: "seccion", seccion: "clientes" }, destino: clientes },
      { miga: { que: "cliente", clienteId: "C05" }, destino: null },
    ]);
  });

  it("un comprobante cuelga de su cliente, que cuelga de Clientes", () => {
    expect(migasDe({ tipo: "comprobante", comprobanteId: idFactura }, datos, corte)).toEqual([
      { miga: { que: "seccion", seccion: "clientes" }, destino: clientes },
      { miga: { que: "cliente", clienteId: clienteDeLaFactura }, destino: { tipo: "cliente", clienteId: clienteDeLaFactura } },
      { miga: { que: "comprobante", comprobanteId: idFactura }, destino: null },
    ]);
  });

  it("un comprobante que no está en los datos (una ruta armada a mano) no lanza: cuelga de Clientes", () => {
    expect(migasDe({ tipo: "comprobante", comprobanteId: "1-0003-99999999" }, datos, corte)).toEqual([
      { miga: { que: "seccion", seccion: "clientes" }, destino: clientes },
      { miga: { que: "comprobante", comprobanteId: "1-0003-99999999" }, destino: null },
    ]);
  });

  it("el desglose de una medida que no es del mes cuelga del Resumen; la miga lleva la clave y no hay mes", () => {
    expect(migasDe({ tipo: "desglose", clave: "mora" }, datos, corte)).toEqual([
      { miga: { que: "seccion", seccion: "resumen" }, destino: resumen },
      { miga: { que: "desglose", clave: "mora" }, destino: null },
    ]);
  });

  it("el desglose de una medida del mes cuelga de Meses y la miga lleva el mes resuelto: el pedido o, si no, el del corte", () => {
    expect(migasDe({ tipo: "desglose", clave: "facturacion-mes" }, datos, "2026-09-30")).toEqual([
      { miga: { que: "seccion", seccion: "meses" }, destino: meses },
      { miga: { que: "desglose", clave: "facturacion-mes", mes: "2026-09" }, destino: null },
    ]);
    expect(migasDe({ tipo: "desglose", clave: "cobranza-mes", mes: "2026-05" }, datos, corte)[1]).toEqual({ miga: { que: "desglose", clave: "cobranza-mes", mes: "2026-05" }, destino: null });
  });

  it("con `cliente=` suma una miga para el cliente, y la del desglose vuelve al desglose de todos (con su mes, sin `cliente=` ni `agrupar`)", () => {
    expect(migasDe({ tipo: "desglose", clave: "mora", clienteId: "C05", agrupar: "no" }, datos, corte)).toEqual([
      { miga: { que: "seccion", seccion: "resumen" }, destino: resumen },
      { miga: { que: "desglose", clave: "mora" }, destino: { tipo: "desglose", clave: "mora" } },
      { miga: { que: "cliente", clienteId: "C05" }, destino: null },
    ]);
    expect(migasDe({ tipo: "desglose", clave: "iva-mes", clienteId: "C05", mes: "2026-05" }, datos, corte)).toEqual([
      { miga: { que: "seccion", seccion: "meses" }, destino: meses },
      { miga: { que: "desglose", clave: "iva-mes", mes: "2026-05" }, destino: { tipo: "desglose", clave: "iva-mes", mes: "2026-05" } },
      { miga: { que: "cliente", clienteId: "C05" }, destino: null },
    ]);
  });

  it("el último paso nunca tiene destino y los demás siempre (no hay una miga que no lleve a ninguna parte)", () => {
    const rutas: readonly Ruta[] = [
      resumen,
      { tipo: "cliente", clienteId: "C05" },
      { tipo: "comprobante", comprobanteId: idFactura },
      { tipo: "desglose", clave: "mora", clienteId: "C05" },
      { tipo: "desglose", clave: "retenciones-mes", clienteId: "C05" },
      { tipo: "como-se-calcula" },
    ];
    for (const ruta of rutas) {
      const pasos = migasDe(ruta, datos, corte);
      expect(pasos.at(-1)?.destino, ruta.tipo).toBeNull();
      for (const paso of pasos.slice(0, -1)) expect(paso.destino, ruta.tipo).not.toBeNull();
    }
  });

  it("los destinos son rutas navegables que el enrutador vuelve a leer igual (se pueden usar en un enlace)", () => {
    const pasos = migasDe({ tipo: "comprobante", comprobanteId: idFactura }, datos, corte);
    for (const { destino } of pasos) {
      if (destino === null) continue;
      expect(resolverDireccion(aHash(destino, corte), datos).ruta).toEqual(destino);
    }
  });
});

describe("padreDe: a dónde va «Atrás» cuando no hay una pantalla anterior", () => {
  it("el cliente vuelve a Clientes; el comprobante, a su cliente; el desglose, a la sección de la que cuelga", () => {
    expect(padreDe({ tipo: "cliente", clienteId: "C05" }, datos, corte)).toEqual(clientes);
    expect(padreDe({ tipo: "comprobante", comprobanteId: idFactura }, datos, corte)).toEqual({ tipo: "cliente", clienteId: clienteDeLaFactura });
    expect(padreDe({ tipo: "desglose", clave: "mora" }, datos, corte)).toEqual(resumen);
    expect(padreDe({ tipo: "desglose", clave: "iva-mes", mes: "2026-05" }, datos, corte)).toEqual(meses);
  });

  it("el desglose de un cliente vuelve al desglose de todos, y conserva el mes", () => {
    expect(padreDe({ tipo: "desglose", clave: "mora", clienteId: "C05" }, datos, corte)).toEqual({ tipo: "desglose", clave: "mora" });
    expect(padreDe({ tipo: "desglose", clave: "iva-mes", clienteId: "C05", mes: "2026-05" }, datos, corte)).toEqual({ tipo: "desglose", clave: "iva-mes", mes: "2026-05" });
  });

  it("las raíces, «Cómo se calcula» y los errores vuelven al Resumen", () => {
    for (const ruta of [resumen, clientes, meses, { tipo: "comprobantes" }, { tipo: "como-se-calcula" }, { tipo: "desconocida" }, { tipo: "inexistente", vista: "cliente" }] as const) {
      expect(padreDe(ruta, datos, corte), ruta.tipo).toEqual(resumen);
    }
  });

  it("el padre siempre es una ruta navegable distinta de la que se mira (salvo las raíces, que están en el Resumen o son su propio nivel)", () => {
    for (const ruta of [{ tipo: "cliente", clienteId: "C05" }, { tipo: "comprobante", comprobanteId: idFactura }, { tipo: "desglose", clave: "mora", clienteId: "C05" }] as const) {
      expect(padreDe(ruta, datos, corte)).not.toEqual(ruta);
    }
  });
});

describe("ofreceAyudaEnLaBarra: la barra del celular no repite «Cómo se calcula» cuando «Atrás» ya lleva ahí", () => {
  it("en una pantalla raíz «Atrás» no se muestra, así que la ayuda siempre se ofrece", () => {
    expect(ofreceAyudaEnLaBarra(true, resumen)).toBe(true);
    expect(ofreceAyudaEnLaBarra(true, { tipo: "como-se-calcula" })).toBe(true);
  });

  it("fuera de las raíces se ofrece, salvo que «Atrás» lleve a «Cómo se calcula»", () => {
    expect(ofreceAyudaEnLaBarra(false, resumen)).toBe(true);
    expect(ofreceAyudaEnLaBarra(false, clientes)).toBe(true);
    expect(ofreceAyudaEnLaBarra(false, { tipo: "cliente", clienteId: "C05" })).toBe(true);
    expect(ofreceAyudaEnLaBarra(false, { tipo: "como-se-calcula" })).toBe(false);
  });
});
