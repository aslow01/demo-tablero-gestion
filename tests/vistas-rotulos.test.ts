// Rótulos de la interfaz que dependen de los datos (plan C1-P): migas, nombre de una pantalla, rótulo de «Atrás», título del documento, anuncio del
// corte, etiquetas accesibles de la regla y del gráfico, y estados de las listas. Todo con los datos de la semilla publicada y las cifras de `esperado.ts`.
import { describe, expect, it } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { TEXTO_COMPROBANTES, TEXTO_MARCO } from "../src/componentes/textos-marco.ts";
import { cierresDeMes } from "../src/lib/dominio/corte.ts";
import { centavos, formatearImporte } from "../src/lib/dominio/dinero.ts";
import { valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { SECCIONES } from "../src/lib/estado/navegacion.ts";
import { migasDe } from "../src/lib/estado/navegacion.ts";
import type { RutaNavegable } from "../src/lib/estado/enrutador.ts";
import { facturacionDelCliente, vistaMeses } from "../src/lib/vistas/meses.ts";
import { vistaClientes } from "../src/lib/vistas/clientes.ts";
import { vistaComprobantes } from "../src/lib/vistas/comprobantes.ts";
import { reglaDeTramos } from "../src/lib/vistas/resumen.ts";
import {
  ROTULO_DE_ERROR,
  ROTULO_DE_SECCION,
  anuncioDeCorteDeRuta,
  codigoDeComprobante,
  estadoDeLaListaDeClientes,
  estadoDeLaListaDeComprobantes,
  etiquetaDeReglaDeTramos,
  etiquetaDelGraficoDeMeses,
  etiquetaDelGraficoDelCliente,
  nombreDeComprobante,
  nombreDeRuta,
  rotuloDeAtras,
  rotulosDeMigas,
  sugerenciaDeBusquedaDeComprobantes,
  tituloDelDocumentoDeRuta,
  vacioDeLaListaDeClientes,
  vacioDeLaListaDeComprobantes,
} from "../src/lib/vistas/rotulos.ts";
import { CORTE, DATOS, idPlantado } from "./fixtures/vistas.ts";

const NB = " ";
const importe = (centavosDeImporte: number): string => formatearImporte(centavos(centavosDeImporte));
const razon = (clienteId: string): string => DATOS.clientes.find((c) => c.id === clienteId)?.razonSocial ?? `(no existe ${clienteId})`;
const C05 = ESPERADO.clienteConMasMora;
const T12 = idPlantado("T12-d91");
const T08 = idPlantado("T08-F");

describe("nombre de un comprobante", () => {
  it("el código es el punto de venta y el número, sin el tipo", () => {
    expect(codigoDeComprobante("1-0003-00000562")).toBe("0003-00000562");
    expect(codigoDeComprobante("3-0003-00000001")).toBe("0003-00000001");
  });

  it("un id que no tiene la forma de un comprobante no se recorta (no se inventa un código)", () => {
    expect(codigoDeComprobante("R-0003-00000045")).toBe("R-0003-00000045");
    expect(codigoDeComprobante("")).toBe("");
  });

  it("el nombre lleva el tipo en palabras: «Factura A 0003-…», «Nota de crédito A 0003-…»", () => {
    expect(nombreDeComprobante({ id: "1-0003-00000562", tipo: 1 })).toBe("Factura A 0003-00000562");
    expect(nombreDeComprobante({ id: "2-0003-00000010", tipo: 2 })).toBe("Nota de débito A 0003-00000010");
    expect(nombreDeComprobante({ id: "3-0003-00000011", tipo: 3 })).toBe("Nota de crédito A 0003-00000011");
  });
});

describe("rótulo de cada sección (las pestañas)", () => {
  it("hay uno por sección, con el texto del marco, y es el mismo que el nombre de la pantalla y el de la miga", () => {
    expect(ROTULO_DE_SECCION).toEqual({
      resumen: TEXTO_MARCO.seccionResumen,
      comprobantes: TEXTO_MARCO.seccionComprobantes,
      clientes: TEXTO_MARCO.seccionClientes,
      meses: TEXTO_MARCO.seccionMeses,
    });
    for (const seccion of SECCIONES) {
      expect(nombreDeRuta({ tipo: seccion }, DATOS, CORTE)).toBe(ROTULO_DE_SECCION[seccion]);
      expect(rotulosDeMigas(migasDe({ tipo: seccion }, DATOS, CORTE), DATOS, CORTE).at(-1)?.texto).toBe(ROTULO_DE_SECCION[seccion]);
    }
  });
});

describe("nombre de una pantalla (lo que dice «Atrás» y el título)", () => {
  it("las secciones llevan el nombre de la pestaña; «Cómo se calcula», el suyo", () => {
    expect(nombreDeRuta({ tipo: "resumen" }, DATOS, CORTE)).toBe(TEXTO_MARCO.seccionResumen);
    expect(nombreDeRuta({ tipo: "comprobantes", tramo: "vencidos", q: "algo" }, DATOS, CORTE)).toBe(TEXTO_MARCO.seccionComprobantes);
    expect(nombreDeRuta({ tipo: "clientes" }, DATOS, CORTE)).toBe(TEXTO_MARCO.seccionClientes);
    expect(nombreDeRuta({ tipo: "meses" }, DATOS, CORTE)).toBe(TEXTO_MARCO.seccionMeses);
    expect(nombreDeRuta({ tipo: "como-se-calcula" }, DATOS, CORTE)).toBe(TEXTO_MARCO.comoSeCalcula);
  });

  it("un cliente se llama por su razón social; un comprobante, por su tipo y su número", () => {
    expect(nombreDeRuta({ tipo: "cliente", clienteId: C05 }, DATOS, CORTE)).toBe(razon(C05));
    expect(nombreDeRuta({ tipo: "comprobante", comprobanteId: T12 }, DATOS, CORTE)).toBe(`Factura A ${codigoDeComprobante(T12)}`);
  });

  it("un desglose se llama por su título corto; con `cliente=`, le suma « · » y el cliente", () => {
    expect(nombreDeRuta({ tipo: "desglose", clave: "mora" }, DATOS, CORTE)).toBe("En mora");
    expect(nombreDeRuta({ tipo: "desglose", clave: "mora", clienteId: C05 }, DATOS, CORTE)).toBe(`En mora · ${razon(C05)}`);
  });

  it("el desglose de una medida del mes dice el mes: el pedido en la dirección o, si no, el del corte", () => {
    expect(nombreDeRuta({ tipo: "desglose", clave: "cobranza-mes" }, DATOS, CORTE)).toBe("Cobranza de octubre de 2026");
    expect(nombreDeRuta({ tipo: "desglose", clave: "cobranza-mes", mes: "2026-05" }, DATOS, CORTE)).toBe("Cobranza de mayo de 2026");
  });

  it("un comprobante o un cliente que no está en los datos es un error interno: no se inventa un nombre", () => {
    expect(() => nombreDeRuta({ tipo: "comprobante", comprobanteId: "1-9999-99999999" }, DATOS, CORTE)).toThrow(/Error interno/);
    expect(() => nombreDeRuta({ tipo: "cliente", clienteId: "C99" }, DATOS, CORTE)).toThrow(/Error interno/);
  });
});

describe("migas", () => {
  const migas = (ruta: RutaNavegable, corte = CORTE) => rotulosDeMigas(migasDe(ruta, DATOS, corte), DATOS, corte);

  it("una pantalla raíz es una sola miga, la actual, sin destino", () => {
    expect(migas({ tipo: "resumen" })).toEqual([{ texto: "Resumen", destino: null, actual: true }]);
    expect(migas({ tipo: "como-se-calcula" })).toEqual([{ texto: "Cómo se calcula", destino: null, actual: true }]);
  });

  it("un cliente: Clientes → su razón social", () => {
    expect(migas({ tipo: "cliente", clienteId: C05 })).toEqual([
      { texto: "Clientes", destino: { tipo: "clientes" }, actual: false },
      { texto: razon(C05), destino: null, actual: true },
    ]);
  });

  it("un comprobante: Clientes → el cliente → el comprobante", () => {
    expect(migas({ tipo: "comprobante", comprobanteId: T12 })).toEqual([
      { texto: "Clientes", destino: { tipo: "clientes" }, actual: false },
      { texto: razon(C05), destino: { tipo: "cliente", clienteId: C05 }, actual: false },
      { texto: `Factura A ${codigoDeComprobante(T12)}`, destino: null, actual: true },
    ]);
  });

  it("el desglose de una medida que no es del mes cuelga del Resumen", () => {
    expect(migas({ tipo: "desglose", clave: "mora" })).toEqual([
      { texto: "Resumen", destino: { tipo: "resumen" }, actual: false },
      { texto: "En mora", destino: null, actual: true },
    ]);
  });

  it("el desglose de una medida del mes cuelga de Meses; con `cliente=` lleva tres pasos y el del medio vuelve al desglose de todos", () => {
    expect(migas({ tipo: "desglose", clave: "cobranza-mes", mes: "2026-05", clienteId: C05 })).toEqual([
      { texto: "Meses", destino: { tipo: "meses" }, actual: false },
      { texto: "Cobranza de mayo de 2026", destino: { tipo: "desglose", clave: "cobranza-mes", mes: "2026-05" }, actual: false },
      { texto: razon(C05), destino: null, actual: true },
    ]);
  });

  it("solo la última miga es la actual, y es la única sin destino", () => {
    for (const ruta of [{ tipo: "comprobante", comprobanteId: T12 }, { tipo: "desglose", clave: "mora", clienteId: C05 }, { tipo: "meses" }] as const) {
      const m = migas(ruta);
      expect(m.map((x) => x.actual)).toEqual(m.map((_, i) => i === m.length - 1));
      expect(m.map((x) => x.destino === null)).toEqual(m.map((x) => x.actual));
    }
  });

  it("una vista de error es una sola miga, «Error», que no repite nada de la dirección", () => {
    expect(rotulosDeMigas(migasDe({ tipo: "desconocida" }, DATOS, CORTE), DATOS, CORTE)).toEqual([{ texto: ROTULO_DE_ERROR, destino: null, actual: true }]);
    expect(rotulosDeMigas(migasDe({ tipo: "inexistente", vista: "cliente" }, DATOS, CORTE), DATOS, CORTE)).toEqual([{ texto: ROTULO_DE_ERROR, destino: null, actual: true }]);
  });
});

describe("«Atrás»", () => {
  it("el texto visible es el nombre de la pantalla a la que lleva; el accesible, «Volver a …»", () => {
    expect(rotuloDeAtras({ tipo: "clientes" }, DATOS, CORTE)).toEqual({ visible: "Clientes", accesible: "Volver a Clientes" });
    expect(rotuloDeAtras({ tipo: "cliente", clienteId: C05 }, DATOS, CORTE)).toEqual({ visible: razon(C05), accesible: `Volver a ${razon(C05)}` });
    expect(rotuloDeAtras({ tipo: "desglose", clave: "mora" }, DATOS, CORTE).accesible).toBe("Volver a En mora");
  });
});

describe("título del documento", () => {
  const titulo = (ruta: Parameters<typeof tituloDelDocumentoDeRuta>[0], corte = CORTE) => tituloDelDocumentoDeRuta(ruta, DATOS, corte);

  it("el Resumen dice «Cobranzas al …»; las otras secciones, su nombre", () => {
    expect(titulo({ tipo: "resumen" })).toBe("Cobranzas al 31/10/2026 · Tablero de cobranzas (demo)");
    expect(titulo({ tipo: "clientes" })).toBe("Clientes · Tablero de cobranzas (demo)");
    expect(titulo({ tipo: "comprobantes" })).toBe("Comprobantes · Tablero de cobranzas (demo)");
    expect(titulo({ tipo: "meses" })).toBe("Meses · Tablero de cobranzas (demo)");
    expect(titulo({ tipo: "como-se-calcula" })).toBe("Cómo se calcula · Tablero de cobranzas (demo)");
  });

  it("cliente y comprobante llevan su nombre", () => {
    expect(titulo({ tipo: "cliente", clienteId: C05 })).toBe(`${razon(C05)} · Tablero de cobranzas (demo)`);
    expect(titulo({ tipo: "comprobante", comprobanteId: T12 })).toBe(`Factura A ${codigoDeComprobante(T12)} · Tablero de cobranzas (demo)`);
  });

  it("un desglose lleva «Desglose: », el título con la fecha y, si hay, el cliente", () => {
    expect(titulo({ tipo: "desglose", clave: "mora" })).toBe("Desglose: En mora al 31/10/2026 · Tablero de cobranzas (demo)");
    expect(titulo({ tipo: "desglose", clave: "mora", clienteId: C05 })).toBe(`Desglose: En mora al 31/10/2026 · ${razon(C05)} · Tablero de cobranzas (demo)`);
    expect(titulo({ tipo: "desglose", clave: "facturacion-mes", mes: "2026-05" })).toBe("Desglose: Facturación de mayo de 2026 (sin IVA) · Tablero de cobranzas (demo)");
  });

  it("un error dice «Error» y nada de lo escrito en la dirección", () => {
    expect(titulo({ tipo: "desconocida" })).toBe(`${ROTULO_DE_ERROR} · Tablero de cobranzas (demo)`);
    expect(titulo({ tipo: "inexistente", vista: "desglose" })).toBe(`${ROTULO_DE_ERROR} · Tablero de cobranzas (demo)`);
  });
});

describe("anuncio al cambiar el corte", () => {
  const anuncio = (ruta: Parameters<typeof anuncioDeCorteDeRuta>[0], corte = CORTE) => anuncioDeCorteDeRuta(ruta, DATOS, corte);
  const mora = importe(ESPERADO.mora.importe);

  it("Resumen, Comprobantes y Clientes dicen la mora, que es la cifra que importa", () => {
    for (const tipo of ["resumen", "comprobantes", "clientes"] as const) expect(anuncio({ tipo })).toBe(`Datos al 31/10/2026. En mora: ${mora}.`);
  });

  it("la mora que se dice es la del corte nuevo, no la del de por defecto", () => {
    const antes = anuncio({ tipo: "resumen" }, "2026-09-30");
    expect(antes).toBe(`Datos al 30/09/2026. En mora: ${importe(valorDeMedida(DATOS, "2026-09-30", "mora"))}.`);
    expect(antes).not.toContain(mora);
  });

  it("Meses, «Cómo se calcula» y los errores no tienen una cifra propia: solo la fecha", () => {
    for (const ruta of [{ tipo: "meses" }, { tipo: "como-se-calcula" }, { tipo: "desconocida" }, { tipo: "inexistente", vista: "cliente" }] as const) {
      expect(anuncio(ruta)).toBe("Datos al 31/10/2026.");
    }
  });

  it("un cliente dice su saldo", () => {
    expect(anuncio({ tipo: "cliente", clienteId: C05 })).toBe(`Datos al 31/10/2026. Saldo del cliente: ${importe(ESPERADO.c05.saldo)}.`);
  });

  it("un desglose dice su total, con el cliente y el mes que pide la dirección", () => {
    expect(anuncio({ tipo: "desglose", clave: "mora" })).toBe(`Datos al 31/10/2026. Total: ${mora}.`);
    expect(anuncio({ tipo: "desglose", clave: "mora", clienteId: C05 })).toBe(`Datos al 31/10/2026. Total: ${importe(ESPERADO.c05.mora)}.`);
    expect(anuncio({ tipo: "desglose", clave: "facturacion-mes" })).toBe(`Datos al 31/10/2026. Total: ${importe(ESPERADO.octubre.facturacion)}.`);
  });

  it("un comprobante con saldo dice el saldo, los días de atraso y el tramo", () => {
    expect(anuncio({ tipo: "comprobante", comprobanteId: T12 })).toBe(`Datos al 31/10/2026. Saldo del comprobante: ${importe(60_500_000)}. 91 días de atraso, tramo Más de 90 días.`);
  });

  it("un comprobante sin vencer dice solo el tramo, sin días de atraso", () => {
    expect(anuncio({ tipo: "comprobante", comprobanteId: idPlantado("T04-F") })).toBe(`Datos al 31/10/2026. Saldo del comprobante: ${importe(30_250_000)}. No vencido.`);
  });

  it("un comprobante cancelado dice el saldo en cero", () => {
    expect(anuncio({ tipo: "comprobante", comprobanteId: T08 })).toBe(`Datos al 31/10/2026. Saldo del comprobante: ${importe(0)}.`);
  });

  it("una nota de crédito y un comprobante emitido después del corte no tienen saldo que decir: solo la fecha", () => {
    expect(anuncio({ tipo: "comprobante", comprobanteId: idPlantado("T17-NC") })).toBe("Datos al 31/10/2026.");
    expect(anuncio({ tipo: "comprobante", comprobanteId: T12 }, "2026-06-30")).toBe("Datos al 30/06/2026.");
  });
});

describe("etiqueta accesible de la regla de tramos", () => {
  it("dice los cinco tramos, en orden, con su importe y su porcentaje (lo mismo que la lista de al lado)", () => {
    const t = ESPERADO.tramos;
    const p = (milesimas: number): string => `${Math.floor(milesimas / 10)},${milesimas % 10}${NB}%`;
    const m = ESPERADO.milesimasDeTramos;
    expect(etiquetaDeReglaDeTramos(reglaDeTramos(DATOS, CORTE), CORTE, DATOS)).toBe(
      "Saldo a cobrar según días de atraso al 31/10/2026: " +
        `no vencido ${importe(t["no-vencido"])} (${p(m["no-vencido"])}); ` +
        `1 a 30 días ${importe(t["1-30"])} (${p(m["1-30"])}); ` +
        `31 a 60 días ${importe(t["31-60"])} (${p(m["31-60"])}); ` +
        `61 a 90 días ${importe(t["61-90"])} (${p(m["61-90"])}); ` +
        `más de 90 días ${importe(t["mas-90"])} (${p(m["mas-90"])}).`,
    );
  });

  it("la de un cliente lo nombra", () => {
    const e = etiquetaDeReglaDeTramos(reglaDeTramos(DATOS, CORTE, C05), CORTE, DATOS);
    expect(e.startsWith(`Saldo a cobrar según días de atraso de ${razon(C05)} al 31/10/2026: no vencido `)).toBe(true);
    expect(e).toContain("más de 90 días");
  });

  it("los porcentajes de las cinco partes de la etiqueta suman 100,0 %", () => {
    const e = etiquetaDeReglaDeTramos(reglaDeTramos(DATOS, CORTE), CORTE, DATOS);
    const partes = [...e.matchAll(/\((\d+),(\d) %\)/g)].map((x) => Number(x[1]) * 10 + Number(x[2]));
    expect(partes).toHaveLength(5);
    expect(partes.reduce((a, b) => a + b, 0)).toBe(1000);
  });
});

describe("etiqueta accesible del gráfico de meses", () => {
  const v = vistaMeses(DATOS, CORTE);

  it("dice el rango, el último mes, el mayor facturado y cuántos valores hay en la tabla", () => {
    let mayor = v.meses[0]!;
    for (const m of v.meses) if (m.facturadoConIva.importe > mayor.facturadoConIva.importe) mayor = m;
    const nombreDelMayor = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][Number(mayor.mes.slice(5)) - 1]!;
    expect(etiquetaDelGraficoDeMeses(v)).toBe(
      "Facturado y cobrado por mes, de noviembre de 2025 a octubre de 2026, con IVA. " +
        `Octubre de 2026: facturado ${importe(ESPERADO.octubre.facturadoConIva)}, cobrado ${importe(ESPERADO.octubre.cobranza)}. ` +
        `Mayor facturado: ${nombreDelMayor} de ${mayor.mes.slice(0, 4)}, ${formatearImporte(mayor.facturadoConIva.importe)}. ` +
        "Los 12 valores están en la tabla.",
    );
  });

  it("con menos de doce meses (los datos empiezan después) dice cuántos hay", () => {
    const corto = vistaMeses(DATOS, "2025-03-31");
    expect(corto.meses.length).toBeLessThan(12);
    expect(etiquetaDelGraficoDeMeses(corto)).toContain(`Los ${corto.meses.length} valores están en la tabla.`);
    expect(etiquetaDelGraficoDeMeses(corto)).toContain("de enero de 2025 a marzo de 2025");
  });

  it("la del cliente habla de la facturación sin IVA", () => {
    const f = facturacionDelCliente(DATOS, CORTE, C05);
    const e = etiquetaDelGraficoDelCliente(f);
    expect(e.startsWith("Facturación sin IVA por mes, de noviembre de 2025 a octubre de 2026. Mayor facturación: ")).toBe(true);
    expect(e.endsWith("Los 12 valores están en la tabla.")).toBe(true);
    expect(e).toContain(formatearImporte(f.meses[f.mayor ?? 0]!.facturacion.importe));
  });
});

describe("estados de las listas", () => {
  it("Comprobantes sin búsqueda: cuántos hay y con qué filtro", () => {
    expect(estadoDeLaListaDeComprobantes(vistaComprobantes(DATOS, CORTE, { tramo: "vencidos", q: "" }))).toBe(`${ESPERADO.mora.comprobantes} comprobantes en mora.`);
  });

  it("Comprobantes con búsqueda: «Se muestran N de M …»", () => {
    const q = razon(C05).split(" ")[0]!.toLowerCase();
    const v = vistaComprobantes(DATOS, CORTE, { tramo: "vencidos", q });
    expect(v.filas.length).toBeGreaterThan(0);
    expect(v.filas.length).toBeLessThan(ESPERADO.mora.comprobantes);
    expect(estadoDeLaListaDeComprobantes(v)).toBe(`Se muestran ${v.filas.length} de ${ESPERADO.mora.comprobantes} comprobantes en mora.`);
  });

  it("Clientes: «13 clientes.», «6 clientes con mora.» y con búsqueda", () => {
    expect(estadoDeLaListaDeClientes(vistaClientes(DATOS, CORTE, { filtro: "todos", q: "" }))).toBe(`${DATOS.clientes.length} clientes.`);
    expect(estadoDeLaListaDeClientes(vistaClientes(DATOS, CORTE, { filtro: "con-mora", q: "" }))).toBe(`${ESPERADO.mora.clientes} clientes con mora.`);
    const v = vistaClientes(DATOS, CORTE, { filtro: "todos", q: razon(C05).toLowerCase() });
    expect(estadoDeLaListaDeClientes(v)).toBe(`Se muestran ${v.filas.length} de ${DATOS.clientes.length} clientes.`);
    expect(v.filas.length).toBe(1);
  });

  it("vacío por búsqueda: «Ningún … coincide con la búsqueda.»", () => {
    expect(vacioDeLaListaDeComprobantes(vistaComprobantes(DATOS, CORTE, { tramo: "todos", q: "zzzzz" }))).toBe("Ningún comprobante coincide con la búsqueda.");
    expect(vacioDeLaListaDeClientes(vistaClientes(DATOS, CORTE, { filtro: "todos", q: "zzzzz" }))).toBe("Ningún cliente coincide con la búsqueda.");
  });

  it("vacío por filtro: dice que no hay ninguno a esa fecha", () => {
    const corteSinMas90 = cierresDeMes(DATOS).find((c) => vistaComprobantes(DATOS, c, { tramo: "mas-90", q: "" }).cantidadDelFiltro === 0);
    expect(corteSinMas90).toBeDefined();
    const corte = corteSinMas90 ?? CORTE;
    const fecha = `${corte.slice(8)}/${corte.slice(5, 7)}/${corte.slice(0, 4)}`;
    expect(vacioDeLaListaDeComprobantes(vistaComprobantes(DATOS, corte, { tramo: "mas-90", q: "" }))).toBe(`No hay comprobantes con más de 90 días de atraso al ${fecha}.`);
  });

  it("la sugerencia de búsqueda trae el número de un comprobante que existe y que la búsqueda encuentra", () => {
    const texto = sugerenciaDeBusquedaDeComprobantes(DATOS, CORTE);
    expect(texto).not.toBeNull();
    const numero = /\d{4}-\d{8}/.exec(texto ?? "")?.[0];
    expect(numero).toBeDefined();
    expect(texto).toBe(TEXTO_COMPROBANTES.sugerenciaDeBusqueda(numero ?? ""));
    expect(vistaComprobantes(DATOS, CORTE, { tramo: "todos", q: numero ?? "" }).filas.length).toBeGreaterThan(0);
  });
});
