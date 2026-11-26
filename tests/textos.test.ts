// Textos del dominio (docs/diseno.md, sección 8): rótulos, fórmulas y notas en español neutro, armados con los números del corte.
import { describe, expect, it } from "vitest";
import { centavos } from "../src/lib/dominio/dinero.ts";
import { TODAS_LAS_CLAVES } from "../src/lib/dominio/claves.ts";
import {
  CRITERIOS_DE_ORDEN,
  NOTA_DE_COBRADO_SIN_IMPUTAR,
  ROTULO_DE_MEDIO,
  ROTULO_DE_SERVICIO,
  ROTULO_DE_TIPO,
  ROTULO_DE_TRAMO,
  SIGLA_DE_TIPO,
  anuncioDeCorte,
  anuncioDeCorteConMora,
  anuncioDeCorteDeCliente,
  anuncioDeCorteDeComprobante,
  anuncioDeCorteDeDesglose,
  avisoDeCorteInvalido,
  avisoDeMesInvalido,
  avisoDeOtrosInexistente,
  cantidadDe,
  estadoDeListaDeClientes,
  estadoDeListaDeComprobantes,
  etiquetaDeCancelado,
  etiquetaDeLaRegla,
  etiquetaDelGrafico,
  etiquetaDelGraficoDeCliente,
  formulaDeMedida,
  nombreDelMes,
  nombreDelMesCapitalizado,
  notaDeCobranza,
  notaDeComprobanteDelMes,
  notaDeRetenciones,
  notaDeSaldo,
  ordenadoPor,
  rotuloDelUbicador,
  tipoDePartidas,
  tituloCortoDeDesglose,
  tituloDeDesglose,
  tituloDelDocumento,
  tituloDelDocumentoDeDesglose,
  vacioDeClientes,
  vacioDeComprobantes,
  fraseDeSituacion,
} from "../src/lib/dominio/textos.ts";
import {
  TEXTO_AVISOS,
  TEXTO_CLIENTE,
  TEXTO_CLIENTES,
  TEXTO_COMPROBANTE,
  TEXTO_COMPROBANTES,
  TEXTO_DESGLOSE,
  TEXTO_ERRORES,
  TEXTO_ETIQUETAS,
  TEXTO_GRAFICO,
  TEXTO_MARCO,
  TEXTO_MESES,
  TEXTO_PIE,
  TEXTO_RECIBO,
  TEXTO_RESUMEN,
  TEXTO_TABLA,
} from "../src/componentes/textos-marco.ts";
import {
  HUECOS,
  TEXTO_COMO_SE_CALCULA,
  huecosDe,
  llenarPlantilla,
  partirPlantilla,
  todasLasPlantillas,
} from "../src/componentes/textos-como-se-calcula.ts";
import { NB } from "./fixtures/formato.ts";

/** Voseo y regionalismos que no van en un texto de la web (español neutro: de usted o impersonal). Las letras con tilde no cuentan como límite de palabra. */
const VOSEO =
  /(?<![\p{L}])(vos|acá|podés|tenés|querés|sabés|sos|hacé|mirá|fijate|elegí|abrí|probá|pedí|tomá|volvé|vení|andá|pasá|cliqueá|tocá|ponete|che)(?![\p{L}])/iu;
/** Espacios duros e invisibles: en un texto fijo no deben aparecer (los importes los escribe `formatearImporte` en tiempo de ejecución). */
const INVISIBLES = new RegExp("[\\u00A0\\u200B-\\u200F\\u2028\\u2029\\u2060\\uFEFF]");

describe("textos: nombre del mes, avisos y notas", () => {
  it("D1: el nombre de cada mes en español, con el año", () => {
    expect(nombreDelMes("2026-10")).toBe("octubre de 2026");
    expect(nombreDelMes("2025-01")).toBe("enero de 2025");
    expect(nombreDelMes("2025-12")).toBe("diciembre de 2025");
    expect(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => nombreDelMes(`2026-${m}`).split(" ")[0])).toEqual([
      "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]);
  });

  it("A1: los rótulos de tramo llevan «a» y no raya", () => {
    expect(Object.values(ROTULO_DE_TRAMO)).toEqual(["No vencido", "1 a 30 días", "31 a 60 días", "61 a 90 días", "Más de 90 días"]);
  });

  it("el aviso de «Otros» inexistente nombra el cierre nuevo y dice qué se muestra", () => {
    expect(avisoDeOtrosInexistente("2026-08-31")).toBe("Al 31/08/2026 no hay «Otros»: se muestra la mora de todos los clientes.");
  });

  it("D1: un mes que no es AAAA-MM lanza", () => {
    expect(() => nombreDelMes("2026-13")).toThrow(/mes/);
    expect(() => nombreDelMes("hola")).toThrow(/mes/);
  });

  it("S5: el aviso de corte inválido es el del diseño, con el corte por defecto en dd/mm/aaaa", () => {
    expect(avisoDeCorteInvalido("2026-10-31")).toBe("La fecha de corte de la dirección no es válida. Se muestra el 31/10/2026.");
  });

  it("el aviso de mes inválido nombra el mes que se muestra (el del corte), con año", () => {
    expect(avisoDeMesInvalido("2026-10")).toBe("El mes de la dirección no es válido. Se muestra octubre de 2026.");
    expect(avisoDeMesInvalido("2026-09")).toBe("El mes de la dirección no es válido. Se muestra septiembre de 2026.");
  });

  it("S3: la nota de una partida de saldo dice los días de atraso si ya venció (1 día, 2 días) y el vencimiento si no", () => {
    expect(notaDeSaldo(1, "2026-10-31")).toBe("1 día de atraso");
    expect(notaDeSaldo(2, "2026-10-31")).toBe("2 días de atraso");
    expect(notaDeSaldo(91, "2026-10-31")).toBe("91 días de atraso");
    expect(notaDeSaldo(0, "2026-10-31")).toBe("Vence el 31/10/2026");
    expect(notaDeSaldo(-9, "2026-08-09")).toBe("Vence el 09/08/2026");
  });

  it("R2: la nota de retenciones junta con «y» las que hay, en el orden dado, con importes en pesos", () => {
    expect(notaDeRetenciones([{ medio: "retencion-iibb", importe: centavos(2_500_000) }, { medio: "retencion-ganancias", importe: centavos(1_500_000) }])).toBe(`Retención IIBB $${NB}25.000,00 y Ganancias $${NB}15.000,00`);
    expect(notaDeRetenciones([{ medio: "retencion-iva", importe: centavos(300) }])).toBe(`Retención IVA $${NB}3,00`);
    expect(notaDeRetenciones([{ medio: "retencion-iibb", importe: centavos(100) }, { medio: "retencion-ganancias", importe: centavos(200) }, { medio: "retencion-iva", importe: centavos(300) }])).toBe(
      `Retención IIBB $${NB}1,00, Ganancias $${NB}2,00 y IVA $${NB}3,00`,
    );
  });

  it("R2: lo que no es una retención no entra en la nota, y sin retenciones la nota es vacía", () => {
    expect(notaDeRetenciones([{ medio: "transferencia", importe: centavos(100) }])).toBe("");
    expect(notaDeRetenciones([])).toBe("");
    expect(notaDeRetenciones([{ medio: "transferencia", importe: centavos(100) }, { medio: "retencion-iva", importe: centavos(300) }])).toBe(`Retención IVA $${NB}3,00`);
  });
});

describe("textos: la fórmula en palabras de cada medida (D1)", () => {
  it("D1: cada una de las 16 claves tiene una fórmula con la fecha del corte (o el mes, en las del mes), sin voseo", () => {
    for (const clave of TODAS_LAS_CLAVES) {
      const f = formulaDeMedida(clave, "2026-10-31", "2026-10");
      expect(f.length, clave).toBeGreaterThan(20);
      expect(f.endsWith("."), clave).toBe(true);
      expect(f, clave).not.toMatch(/\b(vos|tenés|podés|fijate|mirá)\b/i);
      expect(/31\/10\/2026|octubre de 2026/.test(f), clave).toBe(true);
    }
  });

  it("D1: las del mes nombran el mes pedido y las de saldo, la fecha del corte", () => {
    expect(formulaDeMedida("facturacion-mes", "2026-10-31", "2026-09")).toContain("septiembre de 2026");
    expect(formulaDeMedida("cobranza-mes", "2026-10-31", "2026-09")).toContain("septiembre de 2026");
    expect(formulaDeMedida("saldo", "2026-09-30", undefined)).toContain("30/09/2026");
    expect(formulaDeMedida("tramo-31-60", "2026-09-30", undefined)).toContain("31 a 60 días");
  });

  it("D1: la fórmula del IVA dice que es la suma de los IVA de cada comprobante (M2), no un porcentaje del neto", () => {
    expect(formulaDeMedida("iva-mes", "2026-10-31", "2026-10")).toMatch(/IVA de cada/);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// Textos de la interfaz que arma el dominio: rótulos de datos, títulos de desglose, estados, anuncios y etiquetas accesibles.
// ---------------------------------------------------------------------------------------------------------------------------------------

describe("textos de la interfaz: rótulos de los datos", () => {
  it("cada servicio, medio y tipo de comprobante tiene su rótulo, y el vocabulario es el de la interfaz", () => {
    expect(Object.keys(ROTULO_DE_SERVICIO)).toHaveLength(5);
    expect(Object.keys(ROTULO_DE_MEDIO)).toHaveLength(5);
    expect(ROTULO_DE_SERVICIO["alquiler-4x4"]).toBe("Alquiler mensual de camioneta 4x4 con chofer");
    expect(ROTULO_DE_MEDIO["retencion-iibb"]).toBe("Retención IIBB");
    expect(ROTULO_DE_TIPO).toEqual({ 1: "Factura A", 2: "Nota de débito A", 3: "Nota de crédito A" });
    expect(SIGLA_DE_TIPO).toEqual({ 1: "FA", 2: "ND", 3: "NC" });
    for (const t of [...Object.values(ROTULO_DE_SERVICIO), ...Object.values(ROTULO_DE_MEDIO), ...Object.values(ROTULO_DE_TIPO)]) {
      expect(t).not.toMatch(VOSEO);
      expect(t).not.toMatch(INVISIBLES);
    }
  });

  it("la nota de un comprobante del mes junta tipo y servicio; la de una cobranza junta los medios sin repetir", () => {
    expect(notaDeComprobanteDelMes(1, "flete-liviano")).toBe("Factura A · Flete liviano");
    expect(notaDeComprobanteDelMes(3, "horas-espera")).toBe("Nota de crédito A · Horas de espera");
    expect(notaDeCobranza(["transferencia", "retencion-iibb", "transferencia"])).toBe("Transferencia, Retención IIBB");
    expect(notaDeCobranza([])).toBe("");
    expect(NOTA_DE_COBRADO_SIN_IMPUTAR).toBe("Cobrado sin imputar (resta)");
  });

  it("cantidadDe concuerda en número y el mes capitalizado empieza con mayúscula", () => {
    expect(cantidadDe(1, "cliente", "clientes")).toBe("1 cliente");
    expect(cantidadDe(0, "cliente", "clientes")).toBe("0 clientes");
    expect(cantidadDe(13, "cliente", "clientes")).toBe("13 clientes");
    expect(nombreDelMesCapitalizado("2026-10")).toBe("Octubre de 2026");
  });
});

describe("textos de la interfaz: títulos de desglose", () => {
  it("el título lleva el vocabulario único: «Facturación (sin IVA)» frente a «Facturado con IVA»", () => {
    expect(tituloDeDesglose("facturacion-mes", "2026-10-31", "2026-05")).toBe("Facturación de mayo de 2026 (sin IVA)");
    expect(tituloDeDesglose("facturado-con-iva-mes", "2026-10-31", "2026-05")).toBe("Facturado con IVA de mayo de 2026");
    expect(tituloDeDesglose("cobranza-mes", "2026-10-31")).toBe("Cobranza de octubre de 2026");
    expect(tituloDeDesglose("retenciones-mes", "2026-10-31")).toBe("Retenciones incluidas en la cobranza de octubre de 2026");
    expect(tituloDeDesglose("mora", "2026-10-31")).toBe("En mora al 31/10/2026");
    expect(tituloDeDesglose("saldo", "2026-09-30")).toBe("Saldo a cobrar al 30/09/2026");
    expect(tituloDeDesglose("tramo-no-vencido", "2026-10-31")).toBe("Saldo no vencido al 31/10/2026");
    expect(tituloDeDesglose("tramo-mas-90", "2026-10-31")).toBe("Saldo con más de 90 días de atraso al 31/10/2026");
    expect(tituloDeDesglose("mora-otros", "2026-10-31")).toBe("En mora: otros clientes al 31/10/2026");
  });

  it("los títulos de tramo siguen a ROTULO_DE_TRAMO (si cambia la escritura de los rótulos, cambian solos)", () => {
    for (const [clave, tramo] of [["tramo-1-30", "1-30"], ["tramo-31-60", "31-60"], ["tramo-61-90", "61-90"]] as const) {
      expect(tituloDeDesglose(clave, "2026-10-31")).toBe(`Saldo con ${ROTULO_DE_TRAMO[tramo].toLowerCase()} de atraso al 31/10/2026`);
      expect(tituloCortoDeDesglose(clave, "2026-10-31")).toBe(`Saldo con ${ROTULO_DE_TRAMO[tramo].toLowerCase()} de atraso`);
    }
  });

  it("el título corto no lleva fecha de corte y las del mes llevan el mes (dos meses no se confunden)", () => {
    expect(tituloCortoDeDesglose("mora", "2026-10-31")).toBe("En mora");
    expect(tituloCortoDeDesglose("facturacion-mes", "2026-10-31", "2026-05")).toBe("Facturación de mayo de 2026");
    expect(tituloCortoDeDesglose("iva-mes", "2026-10-31")).toBe("IVA facturado de octubre de 2026");
    expect(tituloCortoDeDesglose("retenciones-mes", "2026-10-31", "2026-09")).toBe("Retenciones de septiembre de 2026");
  });

  it("las 16 claves tienen título y título corto, sin voseo, y los largos llevan la fecha o el mes", () => {
    for (const clave of TODAS_LAS_CLAVES) {
      const largo = tituloDeDesglose(clave, "2026-10-31", "2026-10");
      const corto = tituloCortoDeDesglose(clave, "2026-10-31", "2026-10");
      expect(largo.length, clave).toBeGreaterThan(5);
      expect(corto.length, clave).toBeGreaterThan(5);
      expect(largo, clave).not.toMatch(VOSEO);
      expect(/31\/10\/2026|octubre de 2026/.test(largo), clave).toBe(true);
      expect(corto, clave).not.toContain("31/10/2026");
    }
  });

  it("de qué son las partidas: recibos para la cobranza y los cobros sin imputar; el saldo neto mezcla las dos cosas", () => {
    expect(tipoDePartidas("mora")).toBe("comprobantes");
    expect(tipoDePartidas("facturacion-mes")).toBe("comprobantes");
    expect(tipoDePartidas("cobranza-mes")).toBe("recibos");
    expect(tipoDePartidas("retenciones-mes")).toBe("recibos");
    expect(tipoDePartidas("pagos-a-cuenta")).toBe("recibos");
    expect(tipoDePartidas("saldos-a-favor")).toBe("recibos");
    expect(tipoDePartidas("saldo-neto")).toBe("comprobantes y recibos");
  });

  it("los criterios de orden tienen su opción y el anuncio dice el nombre sin el paréntesis", () => {
    expect(Object.keys(CRITERIOS_DE_ORDEN).sort()).toEqual(["atraso", "fecha", "importe", "referencia"]);
    expect(CRITERIOS_DE_ORDEN.importe.opcion).toBe("Importe (de mayor a menor)");
    expect(ordenadoPor("importe")).toBe("Ordenado por importe.");
    expect(ordenadoPor("fecha")).toBe("Ordenado por fecha.");
    expect(ordenadoPor("atraso")).toBe("Ordenado por atraso.");
    expect(ordenadoPor("referencia")).toBe("Ordenado por referencia.");
  });
});

describe("textos de la interfaz: estados de las listas", () => {
  it("comprobantes: concuerda en número («1 comprobante no vencido», «3 comprobantes no vencidos») y dice el filtro", () => {
    expect(estadoDeListaDeComprobantes(13, 13, "todos", false)).toBe("13 comprobantes.");
    expect(estadoDeListaDeComprobantes(1, 1, "no-vencido", false)).toBe("1 comprobante no vencido.");
    expect(estadoDeListaDeComprobantes(3, 3, "no-vencido", false)).toBe("3 comprobantes no vencidos.");
    expect(estadoDeListaDeComprobantes(16, 16, "vencidos", false)).toBe("16 comprobantes en mora.");
    expect(estadoDeListaDeComprobantes(2, 2, "31-60", false)).toBe(`2 comprobantes con ${ROTULO_DE_TRAMO["31-60"].toLowerCase()} de atraso.`);
    expect(estadoDeListaDeComprobantes(2, 2, "mas-90", false)).toBe("2 comprobantes con más de 90 días de atraso.");
  });

  it("comprobantes con búsqueda: «Se muestran N de M», también con 0 y con un solo comprobante en el filtro", () => {
    expect(estadoDeListaDeComprobantes(1, 13, "vencidos", true)).toBe("Se muestran 1 de 13 comprobantes en mora.");
    expect(estadoDeListaDeComprobantes(0, 13, "todos", true)).toBe("Se muestran 0 de 13 comprobantes.");
    expect(estadoDeListaDeComprobantes(0, 1, "todos", true)).toBe("Se muestran 0 de 1 comprobante.");
  });

  it("comprobantes vacíos: la búsqueda no encontró nada o el filtro no tiene ninguno a esa fecha", () => {
    expect(vacioDeComprobantes(13, "todos", "2026-10-31")).toBe("Ningún comprobante coincide con la búsqueda.");
    expect(vacioDeComprobantes(0, "no-vencido", "2026-08-31")).toBe("No hay comprobantes no vencidos al 31/08/2026.");
    expect(vacioDeComprobantes(0, "vencidos", "2026-01-31")).toBe("No hay comprobantes en mora al 31/01/2026.");
    expect(vacioDeComprobantes(0, "todos", "2025-01-31")).toBe("No hay comprobantes al 31/01/2025.");
  });

  it("clientes: estado con y sin búsqueda, y vacíos", () => {
    expect(estadoDeListaDeClientes(13, 13, "todos", false)).toBe("13 clientes.");
    expect(estadoDeListaDeClientes(1, 1, "con-mora", false)).toBe("1 cliente con mora.");
    expect(estadoDeListaDeClientes(6, 6, "con-mora", false)).toBe("6 clientes con mora.");
    expect(estadoDeListaDeClientes(2, 2, "revisar", false)).toBe("2 clientes para revisar.");
    expect(estadoDeListaDeClientes(1, 13, "todos", true)).toBe("Se muestran 1 de 13 clientes.");
    expect(estadoDeListaDeClientes(0, 6, "con-mora", true)).toBe("Se muestran 0 de 6 clientes con mora.");
    expect(vacioDeClientes(13, "todos", "2026-10-31")).toBe("Ningún cliente coincide con la búsqueda.");
    expect(vacioDeClientes(0, "revisar", "2025-02-28")).toBe("No hay clientes para revisar al 28/02/2025.");
  });
});

describe("textos de la interfaz: anuncios y etiquetas accesibles", () => {
  const imp = (c: number) => `$${NB}${c.toLocaleString("es-AR")},00`; // solo para armar el esperado de importes redondos

  it("anuncio al cambiar el corte: dice la fecha y la cifra de cada pantalla", () => {
    expect(anuncioDeCorte("2026-09-30")).toBe("Datos al 30/09/2026.");
    expect(anuncioDeCorteConMora("2026-10-31", centavos(630_648_128))).toBe(`Datos al 31/10/2026. En mora: $${NB}6.306.481,28.`);
    expect(anuncioDeCorteDeCliente("2026-10-31", centavos(487_604_469))).toBe(`Datos al 31/10/2026. Saldo del cliente: $${NB}4.876.044,69.`);
    expect(anuncioDeCorteDeDesglose("2026-10-31", centavos(100))).toBe(`Datos al 31/10/2026. Total: $${NB}1,00.`);
    expect(imp(1)).toContain("1,00");
  });

  it("anuncio en un comprobante: con atraso dice los días y el tramo; sin atraso, el tramo; cancelado, solo el saldo", () => {
    expect(anuncioDeCorteDeComprobante("2026-10-31", centavos(60_500_000), 61)).toBe(
      `Datos al 31/10/2026. Saldo del comprobante: $${NB}605.000,00. 61 días de atraso, tramo ${ROTULO_DE_TRAMO["61-90"]}.`,
    );
    expect(anuncioDeCorteDeComprobante("2026-10-31", centavos(60_500_000), 1)).toContain("1 día de atraso, tramo");
    expect(anuncioDeCorteDeComprobante("2026-10-31", centavos(60_500_000), 0)).toBe(
      `Datos al 31/10/2026. Saldo del comprobante: $${NB}605.000,00. ${ROTULO_DE_TRAMO["no-vencido"]}.`,
    );
    expect(anuncioDeCorteDeComprobante("2026-10-31", centavos(0), 40)).toBe(`Datos al 31/10/2026. Saldo del comprobante: $${NB}0,00.`);
  });

  it("etiqueta de la regla: los cinco tramos con importe y porcentaje, y el cliente si lo hay", () => {
    const tramos = [
      { tramo: "no-vencido", importe: centavos(10_000), milesimas: 500 },
      { tramo: "mas-90", importe: centavos(10_000), milesimas: 500 },
    ] as const;
    expect(etiquetaDeLaRegla("2026-10-31", tramos)).toBe(
      `Saldo a cobrar según días de atraso al 31/10/2026: no vencido $${NB}100,00 (50,0${NB}%); más de 90 días $${NB}100,00 (50,0${NB}%).`,
    );
    expect(etiquetaDeLaRegla("2026-10-31", tramos, "Cliente Demo S.A.")).toContain("días de atraso de Cliente Demo S.A. al 31/10/2026");
  });

  it("etiqueta de la regla: un porcentaje nulo se dice «sin porcentaje», no «raya»", () => {
    const e = etiquetaDeLaRegla("2026-10-31", [{ tramo: "no-vencido", importe: centavos(0), milesimas: null }]);
    expect(e).toContain("(sin porcentaje)");
    expect(e).not.toContain("—");
  });

  it("textos de la antigüedad: se rotula por días de atraso y la ficha dice «Sin saldo a cobrar»", () => {
    expect(TEXTO_CLIENTE.antiguedad).toBe("Saldo a cobrar según días de atraso");
    expect(TEXTO_TABLA.antiguedad).toBe("Saldo según atraso");
    expect(TEXTO_ETIQUETAS.sinSaldo).toBe("Sin saldo");
    expect(TEXTO_ETIQUETAS.sinSaldoACobrar).toBe("Sin saldo a cobrar");
    expect(TEXTO_TABLA.sinPorcentaje).toBe("—");
    expect(TEXTO_TABLA.sinPorcentajeDicho).toBe("Sin porcentaje");
  });

  it("textos residuales: el panel de Comprobantes y la sección de «Cómo se calcula» también dicen «días de atraso»", () => {
    expect(TEXTO_COMPROBANTES.panel).toBe("Por días de atraso");
    expect(TEXTO_COMO_SE_CALCULA.secciones.find((s) => s.id === "mora")?.titulo).toBe("Saldo, mora y días de atraso");
  });

  it("ningún texto fijo de la interfaz rotula por «antigüedad» (se dice «días de atraso»)", () => {
    const textos: string[] = [];
    const juntar = (valor: unknown): void => {
      if (typeof valor === "string") textos.push(valor);
      else if (Array.isArray(valor)) valor.forEach(juntar);
      else if (typeof valor === "object" && valor !== null) Object.values(valor).forEach(juntar);
    };
    juntar(GRUPOS);
    juntar(TEXTO_COMO_SE_CALCULA);
    expect(textos.length).toBeGreaterThan(200);
    expect(textos.filter((t) => /antig(ü|u)edad/i.test(t))).toEqual([]);
  });

  it("cantidades de las solapas del cliente: la cuenta corriente aclara «hasta la fecha de corte»", () => {
    expect(TEXTO_CLIENTE.cantidadDeSolapa.comprobantes(3)).toBe("3 comprobantes");
    expect(TEXTO_CLIENTE.cantidadDeSolapa.recibos(1)).toBe("1 recibo");
    expect(TEXTO_CLIENTE.cantidadDeSolapa.movimientos(12)).toBe("12 movimientos hasta la fecha de corte");
    expect(TEXTO_CLIENTE.cantidadDeSolapa.movimientos(1)).toBe("1 movimiento hasta la fecha de corte");
  });

  it("etiqueta del gráfico: facturado con IVA frente a cobrado, y la del cliente, facturación sin IVA", () => {
    const base = { desde: "2025-11", hasta: "2026-10", cantidadDeMeses: 12, ultimoFacturado: centavos(190_041_559), mesDeMayorFacturado: "2026-03", mayorFacturado: centavos(250_000_000) };
    const empresa = etiquetaDelGrafico({ ...base, ultimoCobrado: centavos(238_475_905) });
    expect(empresa).toContain("de noviembre de 2025 a octubre de 2026, con IVA");
    expect(empresa).toContain("Octubre de 2026: facturado $");
    expect(empresa).toContain("Mayor facturado: marzo de 2026");
    expect(empresa).toContain("Los 12 valores están en la tabla.");
    const cliente = etiquetaDelGraficoDeCliente(base);
    expect(cliente).toContain("Facturación sin IVA por mes");
    expect(cliente).toContain("Mayor facturación: marzo de 2026");
    expect(cliente).not.toContain("cobrado");
  });

  it("situación de un comprobante: cancelado, anulado, con atraso, vence el día del corte y todavía no vence", () => {
    expect(etiquetaDeCancelado(false)).toBe("Cancelada");
    expect(etiquetaDeCancelado(true)).toBe("Anulada por nota de crédito");
    expect(fraseDeSituacion({ estado: "cancelado", fecha: "2026-04-30", anulado: false })).toBe("Cancelada el 30/04/2026.");
    expect(fraseDeSituacion({ estado: "cancelado", fecha: "2026-07-20", anulado: true })).toBe("Anulada por la nota de crédito del 20/07/2026.");
    expect(fraseDeSituacion({ estado: "con-saldo", atraso: 91, vencimiento: "2026-08-01", huboCobros: false })).toBe("Venció el 01/08/2026.");
    expect(fraseDeSituacion({ estado: "con-saldo", atraso: 91, vencimiento: "2026-08-01", huboCobros: true })).toBe(
      "Venció el 01/08/2026. El atraso se cuenta desde el vencimiento original, no desde el último pago.",
    );
    expect(fraseDeSituacion({ estado: "con-saldo", atraso: 0, vencimiento: "2026-10-31", huboCobros: false })).toBe(
      "Vence el 31/10/2026, el mismo día del corte: todavía no está vencida.",
    );
    expect(fraseDeSituacion({ estado: "con-saldo", atraso: -9, vencimiento: "2026-11-09", huboCobros: false })).toBe("Vence el 09/11/2026.");
    // «hoy» sería falso: el corte no es el día de hoy
    expect(fraseDeSituacion({ estado: "con-saldo", atraso: 0, vencimiento: "2026-10-31", huboCobros: false })).not.toMatch(/\bhoy\b/);
  });

  it("marca del ubicador: días de atraso, el día del corte o los que faltan, en singular y plural", () => {
    expect(rotuloDelUbicador(12)).toBe("12 días");
    expect(rotuloDelUbicador(1)).toBe("1 día");
    expect(rotuloDelUbicador(0)).toBe("vence el día del corte");
    expect(rotuloDelUbicador(-1)).toBe("falta 1 día");
    expect(rotuloDelUbicador(-9)).toBe("faltan 9 días");
  });

  it("título del documento: pantalla y nombre de la demo", () => {
    expect(tituloDelDocumento("Clientes")).toBe("Clientes · Tablero de cobranzas (demo)");
    expect(tituloDelDocumentoDeDesglose("En mora al 31/10/2026")).toBe("Desglose: En mora al 31/10/2026 · Tablero de cobranzas (demo)");
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// Textos fijos del marco y de las ocho secciones (`src/componentes/textos-marco.ts`).
// ---------------------------------------------------------------------------------------------------------------------------------------

const GRUPOS = {
  TEXTO_MARCO,
  TEXTO_PIE,
  TEXTO_TABLA,
  TEXTO_ETIQUETAS,
  TEXTO_RECIBO,
  TEXTO_GRAFICO,
  TEXTO_RESUMEN,
  TEXTO_COMPROBANTES,
  TEXTO_CLIENTES,
  TEXTO_MESES,
  TEXTO_CLIENTE,
  TEXTO_COMPROBANTE,
  TEXTO_DESGLOSE,
  TEXTO_ERRORES,
  TEXTO_AVISOS,
} as const;

/** Recorre un grupo y separa los textos fijos de las funciones (con su ruta, `TEXTO_ERRORES.controlQueFalla.cuerpo`). */
function recorrer(nombre: string, valor: unknown, fijos: [string, string][], funciones: string[]): void {
  if (typeof valor === "string") fijos.push([nombre, valor]);
  else if (typeof valor === "function") funciones.push(nombre);
  else if (typeof valor === "object" && valor !== null) for (const [k, v] of Object.entries(valor)) recorrer(`${nombre}.${k}`, v, fijos, funciones);
}

const C = "2026-10-31";
const M = "2026-10";
/** Una llamada de muestra por cada función de texto: la prueba de cobertura obliga a sumar la de una función nueva. */
const LLAMADAS: Record<string, () => string> = {
  "TEXTO_MARCO.empresa": () => TEXTO_MARCO.empresa("Empresa Demo S.A."),
  "TEXTO_MARCO.clientesParaRevisar": () => TEXTO_MARCO.clientesParaRevisar(3),
  "TEXTO_MARCO.cierreAnterior": () => TEXTO_MARCO.cierreAnterior("2026-09-30"),
  "TEXTO_MARCO.cierreSiguiente": () => TEXTO_MARCO.cierreSiguiente("2026-10-31"),
  "TEXTO_MARCO.volverAlCorte": () => TEXTO_MARCO.volverAlCorte(C),
  "TEXTO_MARCO.volverA": () => TEXTO_MARCO.volverA("Clientes"),
  "TEXTO_PIE.fuenteDeDatos": () => TEXTO_PIE.fuenteDeDatos("2025-01", M),
  "TEXTO_PIE.queEs": () => TEXTO_PIE.queEs("Empresa Demo S.A."),
  "TEXTO_TABLA.totalDeClientes": () => TEXTO_TABLA.totalDeClientes(13),
  "TEXTO_TABLA.totalDeComprobantes": () => TEXTO_TABLA.totalDeComprobantes(1),
  "TEXTO_TABLA.totalDeRecibos": () => TEXTO_TABLA.totalDeRecibos(45),
  "TEXTO_TABLA.dias": () => TEXTO_TABLA.dias(1),
  "TEXTO_ETIQUETAS.noCuentanParaElSaldo": () => TEXTO_ETIQUETAS.noCuentanParaElSaldo("2026-09-30"),
  "TEXTO_RECIBO.totalDelRecibo": () => TEXTO_RECIBO.totalDelRecibo(`$${NB}1.000,00`, "2026-10-14"),
  "TEXTO_GRAFICO.renglonDelMes": () => TEXTO_GRAFICO.renglonDelMes(M, `$${NB}1,00`, `$${NB}2,00`),
  "TEXTO_GRAFICO.hayDatosDesde": () => TEXTO_GRAFICO.hayDatosDesde("2025-01"),
  "TEXTO_GRAFICO.verLosMesesComoTabla": () => TEXTO_GRAFICO.verLosMesesComoTabla(12),
  "TEXTO_GRAFICO.ultimosMeses": () => TEXTO_GRAFICO.ultimosMeses(12),
  "TEXTO_GRAFICO.sinFacturacion": () => TEXTO_GRAFICO.sinFacturacion(12),
  "TEXTO_RESUMEN.titulo": () => TEXTO_RESUMEN.titulo(C),
  "TEXTO_RESUMEN.posicion": () => TEXTO_RESUMEN.posicion(C),
  "TEXTO_RESUMEN.enMoraAl": () => TEXTO_RESUMEN.enMoraAl(C),
  "TEXTO_RESUMEN.fraseDeLaMora": () => TEXTO_RESUMEN.fraseDeLaMora(`22,1${NB}%`, 1),
  "TEXTO_RESUMEN.sinMora": () => TEXTO_RESUMEN.sinMora(C),
  "TEXTO_RESUMEN.saldoACobrarAl": () => TEXTO_RESUMEN.saldoACobrarAl(C),
  "TEXTO_RESUMEN.movimientoDelMes": () => TEXTO_RESUMEN.movimientoDelMes(M),
  "TEXTO_RESUMEN.comprobantes": () => TEXTO_RESUMEN.comprobantes(30),
  "TEXTO_RESUMEN.recibos": () => TEXTO_RESUMEN.recibos(1),
  "TEXTO_RESUMEN.deudoresEnMora": () => TEXTO_RESUMEN.deudoresEnMora(6),
  "TEXTO_RESUMEN.otros": () => TEXTO_RESUMEN.otros(1),
  "TEXTO_RESUMEN.verLosClientes": () => TEXTO_RESUMEN.verLosClientes(13),
  "TEXTO_RESUMEN.sobrepagoEn": () => TEXTO_RESUMEN.sobrepagoEn("R-0003-00000045"),
  "TEXTO_RESUMEN.graficoTitulo": () => TEXTO_RESUMEN.graficoTitulo(12),
  "TEXTO_COMPROBANTES.titulo": () => TEXTO_COMPROBANTES.titulo(C),
  "TEXTO_COMPROBANTES.sugerenciaDeBusqueda": () => TEXTO_COMPROBANTES.sugerenciaDeBusqueda("0003-00000562"),
  "TEXTO_CLIENTES.titulo": () => TEXTO_CLIENTES.titulo(C),
  "TEXTO_CLIENTES.plazoYCuit": () => TEXTO_CLIENTES.plazoYCuit(30, "30-99000003-3"),
  "TEXTO_MESES.titulo": () => TEXTO_MESES.titulo("2025-11", M),
  "TEXTO_MESES.totalDeLosMeses": () => TEXTO_MESES.totalDeLosMeses(12),
  "TEXTO_CLIENTE.bajada": () => TEXTO_CLIENTE.bajada("30-99000003-3", 30, C),
  "TEXTO_CLIENTE.posicion": () => TEXTO_CLIENTE.posicion(C),
  "TEXTO_CLIENTE.porcentajeDelSaldo": () => TEXTO_CLIENTE.porcentajeDelSaldo(`70,7${NB}%`),
  "TEXTO_CLIENTE.facturacion": () => TEXTO_CLIENTE.facturacion(12),
  "TEXTO_CLIENTE.irAlSaldo": () => TEXTO_CLIENTE.irAlSaldo(C),
  "TEXTO_CLIENTE.saldoAl": () => TEXTO_CLIENTE.saldoAl(C),
  "TEXTO_CLIENTE.sinSaldoALaFecha": () => TEXTO_CLIENTE.sinSaldoALaFecha(C),
  "TEXTO_CLIENTE.vacioDeComprobantes": () => TEXTO_CLIENTE.vacioDeComprobantes(C),
  "TEXTO_CLIENTE.vacioDeRecibos": () => TEXTO_CLIENTE.vacioDeRecibos("2025-01-31"),
  "TEXTO_CLIENTE.vacioDeMovimientos": () => TEXTO_CLIENTE.vacioDeMovimientos("2025-01-31"),
  "TEXTO_COMPROBANTE.situacion": () => TEXTO_COMPROBANTE.situacion(C),
  "TEXTO_COMPROBANTE.diasDeAtraso": () => TEXTO_COMPROBANTE.diasDeAtraso(1),
  "TEXTO_COMPROBANTE.notaDeCreditoInicio": () => TEXTO_COMPROBANTE.notaDeCreditoInicio(`$${NB}1.210,00`),
  "TEXTO_COMPROBANTE.vencimientoConPlazo": () => TEXTO_COMPROBANTE.vencimientoConPlazo("2026-08-01", 30),
  "TEXTO_COMPROBANTE.vencimientoDeNota": () => TEXTO_COMPROBANTE.vencimientoDeNota("2026-07-20"),
  "TEXTO_CLIENTE.cantidadDeSolapa.comprobantes": () => TEXTO_CLIENTE.cantidadDeSolapa.comprobantes(2),
  "TEXTO_CLIENTE.cantidadDeSolapa.recibos": () => TEXTO_CLIENTE.cantidadDeSolapa.recibos(2),
  "TEXTO_CLIENTE.cantidadDeSolapa.movimientos": () => TEXTO_CLIENTE.cantidadDeSolapa.movimientos(2),
  "TEXTO_COMPROBANTE.cantidadDeMovimientos": () => TEXTO_COMPROBANTE.cantidadDeMovimientos(1),
  "TEXTO_COMPROBANTE.saldoAl": () => TEXTO_COMPROBANTE.saldoAl(C),
  "TEXTO_COMPROBANTE.emitidoDespuesDelCorte": () => TEXTO_COMPROBANTE.emitidoDespuesDelCorte("2026-11-03", C),
  "TEXTO_COMPROBANTE.verloAl": () => TEXTO_COMPROBANTE.verloAl("2026-11-30"),
  "TEXTO_DESGLOSE.soloLos": () => TEXTO_DESGLOSE.soloLos("comprobantes y recibos"),
  "TEXTO_DESGLOSE.alCorte": () => TEXTO_DESGLOSE.alCorte(C),
  "TEXTO_DESGLOSE.delMes": () => TEXTO_DESGLOSE.delMes(M),
  "TEXTO_DESGLOSE.totalPorCliente": () => TEXTO_DESGLOSE.totalPorCliente(1, 1),
  "TEXTO_DESGLOSE.totalDePartidas": () => TEXTO_DESGLOSE.totalDePartidas(16),
  "TEXTO_DESGLOSE.sinPartidas": () => TEXTO_DESGLOSE.sinPartidas(`$${NB}0,00`),
  "TEXTO_ERRORES.controlQueFalla.cuerpo": () => TEXTO_ERRORES.controlQueFalla.cuerpo(C),
  "TEXTO_ERRORES.controlQueFalla.detalle": () => TEXTO_ERRORES.controlQueFalla.detalle("La mora y la suma de los cuatro tramos vencidos"),
  "TEXTO_ERRORES.falloAlIniciar.detalle": () => TEXTO_ERRORES.falloAlIniciar.detalle("No se pudieron generar los datos."),
};

describe("textos de la interfaz: el marco y las ocho secciones", () => {
  const fijos: [string, string][] = [];
  const funciones: string[] = [];
  for (const [nombre, grupo] of Object.entries(GRUPOS)) recorrer(nombre, grupo, fijos, funciones);

  it("hay una llamada de muestra por cada función de texto, y ninguna de más", () => {
    expect([...funciones].sort()).toEqual(Object.keys(LLAMADAS).sort());
  });

  it("ningún texto fijo está vacío ni trae espacios duros o invisibles; tampoco puntuación doble ni espacios de más", () => {
    expect(fijos.length).toBeGreaterThan(150);
    for (const [ruta, texto] of fijos) {
      expect(texto.trim().length, ruta).toBeGreaterThan(0);
      expect(texto, ruta).not.toMatch(INVISIBLES);
      expect(texto, ruta).not.toMatch(/ {2}|\.\.(?!\.)|,,/);
      expect(texto, ruta).toBe(texto.trim().replace(/^ +| +$/g, "") === texto ? texto : texto.trim());
    }
  });

  it("ninguna función devuelve un texto vacío, «undefined», «NaN» ni una llave sin llenar", () => {
    for (const [ruta, llamar] of Object.entries(LLAMADAS)) {
      const t = llamar();
      expect(t.length, ruta).toBeGreaterThan(0);
      expect(t, ruta).not.toMatch(/undefined|NaN|\[object|\{|\}/);
    }
  });

  it("sin voseo ni regionalismos en ningún texto de la interfaz (se habla de usted o en forma impersonal)", () => {
    const todos = [...fijos, ...Object.entries(LLAMADAS).map(([ruta, f]): [string, string] => [ruta, f()])];
    for (const [ruta, texto] of todos) expect(texto, ruta).not.toMatch(VOSEO);
  });

  it("los textos que concuerdan en número lo hacen: 1 cliente, 1 recibo, 1 día, 1 partida, 1 movimiento", () => {
    expect(TEXTO_RESUMEN.otros(1)).toBe("Otros (1 cliente)");
    expect(TEXTO_RESUMEN.otros(2)).toBe("Otros (2 clientes)");
    expect(TEXTO_RESUMEN.fraseDeLaMora(`22,1${NB}%`, 1)).toBe(`22,1${NB}% de lo que hay por cobrar, en 1 cliente.`);
    expect(TEXTO_RESUMEN.fraseDeLaMora(`22,1${NB}%`, 6)).toBe(`22,1${NB}% de lo que hay por cobrar, en 6 clientes.`);
    expect(TEXTO_RESUMEN.recibos(1)).toBe("1 recibo");
    expect(TEXTO_TABLA.dias(1)).toBe("1 día");
    expect(TEXTO_COMPROBANTE.diasDeAtraso(1)).toBe("1 día de atraso");
    expect(TEXTO_COMPROBANTE.diasDeAtraso(2)).toBe("2 días de atraso");
    expect(TEXTO_DESGLOSE.totalPorCliente(1, 1)).toBe("Total (1 cliente, 1 partida)");
    expect(TEXTO_DESGLOSE.totalPorCliente(6, 16)).toBe("Total (6 clientes, 16 partidas)");
    expect(TEXTO_DESGLOSE.totalDePartidas(1)).toBe("Total (1 partida)");
    expect(TEXTO_COMPROBANTE.cantidadDeMovimientos(1)).toBe("1 movimiento");
  });

  it("el marco: fechas en dd/mm/aaaa, cierres vecinos y «Atrás» con el nombre de la pantalla", () => {
    expect(TEXTO_MARCO.cierreAnterior("2026-09-30")).toBe("Cierre anterior: 30/09/2026");
    expect(TEXTO_MARCO.cierreSiguiente("2026-10-31")).toBe("Cierre siguiente: 31/10/2026");
    expect(TEXTO_MARCO.volverAlCorte(C)).toBe("Volver al 31/10/2026");
    expect(TEXTO_MARCO.volverA("Clientes")).toBe("Volver a Clientes");
    expect(TEXTO_MARCO.empresa("Empresa Demo S.A.")).toBe("Empresa Demo S.A. (ficticia)");
    expect(TEXTO_MARCO.cerrarAvisoDeCorte).not.toBe(TEXTO_MARCO.cerrarAvisoDelMes);
    expect(TEXTO_MARCO.cerrarAvisoDeOtros).not.toBe(TEXTO_MARCO.cerrarAvisoDeCorte);
    expect(TEXTO_MARCO.cerrarAvisoDeOtros).not.toBe(TEXTO_MARCO.cerrarAvisoDelMes);
  });

  it("los títulos de las secciones llevan la fecha de corte («al dd/mm/aaaa»)", () => {
    expect(TEXTO_RESUMEN.titulo(C)).toBe("Cobranzas al 31/10/2026");
    expect(TEXTO_COMPROBANTES.titulo(C)).toBe("Comprobantes con saldo al 31/10/2026");
    expect(TEXTO_CLIENTES.titulo(C)).toBe("Clientes al 31/10/2026");
    expect(TEXTO_MESES.titulo("2025-11", M)).toBe("Facturado y cobrado, de noviembre de 2025 a octubre de 2026");
  });

  it("la bajada del Resumen dice para qué sirve el tablero y no repite que los datos son ficticios (lo dicen la insignia y el pie)", () => {
    expect(TEXTO_RESUMEN.bajada).toBe(
      "Quién debe, cuánto y desde cuándo, a la fecha de corte que se elija. Cada importe subrayado se abre hasta los comprobantes que lo forman.",
    );
    expect(TEXTO_RESUMEN.bajada).not.toMatch(/ficticio/i);
  });

  it("el pie dice de dónde salen los datos, qué es la demo y quién hizo qué, sin atribuirle código a Matías", () => {
    expect(TEXTO_PIE.fuenteDeDatos("2025-01", M)).toBe("Datos ficticios de ejemplo, de enero de 2025 a octubre de 2026.");
    const que = TEXTO_PIE.queEs("Empresa Demo S.A.");
    expect(que).toContain("inventados");
    expect(que).toContain("no usa servidor");
    expect(que).toContain("Empresa Demo S.A.");
    expect(TEXTO_PIE.otraDemoEnlace).toBe("Control de flota");
    expect(TEXTO_PIE.volverAlPortafolio).toBe("Volver al portafolio");
    expect(TEXTO_PIE.autoria).toContain("Matías Ariel Ormeño");
    expect(TEXTO_PIE.autoria).toBe("Concebido, diseñado y dirigido por Matías Ariel Ormeño; desarrollado con IA.");
    expect(TEXTO_PIE.autoria).not.toMatch(/Matías[^.]*(código|programó|escribió)/i);
    expect(TEXTO_PIE.autoria).not.toMatch(/escrit[oa]s? por IA|escribió/i);
  });

  it("los errores dicen qué pasó y qué hacer, y no repiten lo que vino en la dirección", () => {
    for (const e of [TEXTO_ERRORES.direccionDesconocida, TEXTO_ERRORES.clienteInexistente, TEXTO_ERRORES.comprobanteInexistente, TEXTO_ERRORES.desgloseInexistente]) {
      expect(e.titulo.length).toBeGreaterThan(10);
      expect(e.cuerpo).toMatch(/dirección|escrita/);
    }
    expect(TEXTO_ERRORES.irAlResumen).toBe("Ir al resumen");
    expect(TEXTO_ERRORES.falloAlIniciar.cuerpo).toContain("Recargue la página");
    expect(TEXTO_ERRORES.controlQueFalla.cuerpo(C)).toContain("31/10/2026");
    expect(TEXTO_ERRORES.controlQueFalla.cuerpo(C)).toContain("error del programa");
    expect(TEXTO_ERRORES.controlQueFalla.cuerpo(C)).toContain("otra fecha de corte");
    expect(TEXTO_ERRORES.controlQueFalla.cuerpo(C)).not.toMatch(/ninguna cifra/);
    expect(TEXTO_ERRORES.controlQueFalla.detalle("la suma de los vencidos")).toBe("Cálculo que no coincide: la suma de los vencidos");
  });

  it("el comprobante posterior al corte dice qué pasó y la nota de crédito no tiene saldo propio", () => {
    expect(TEXTO_COMPROBANTE.emitidoDespuesDelCorte("2026-11-03", C)).toBe(
      "Este comprobante se emitió el 03/11/2026, después de la fecha de corte (31/10/2026). A esa fecha todavía no existía.",
    );
    expect(TEXTO_COMPROBANTE.verloAl("2026-11-30")).toBe("Verlo al 30/11/2026");
    expect(TEXTO_COMPROBANTE.notaDeCreditoInicio(`$${NB}1.210,00`)).toBe(`Una nota de crédito no tiene saldo propio: resta su total, $${NB}1.210,00, al saldo de`);
  });

  it("el vocabulario único: «En mora», «Saldo a cobrar (con IVA)», «Facturación (sin IVA)», «Cobranza» y «Cómo se calcula»", () => {
    expect(TEXTO_RESUMEN.enMora).toBe("En mora");
    expect(TEXTO_RESUMEN.saldoACobrar).toBe("Saldo a cobrar (con IVA)");
    expect(TEXTO_RESUMEN.facturacionSinIva).toBe("Facturación (sin IVA)");
    expect(TEXTO_RESUMEN.cobranza).toBe("Cobranza");
    expect(TEXTO_MARCO.comoSeCalcula).toBe("Cómo se calcula");
    expect(TEXTO_COMO_SE_CALCULA.titulo).toBe("Cómo se calcula");
    expect(TEXTO_MESES.facturadoConIva).toBe("Facturado con IVA");
    expect(TEXTO_ETIQUETAS.revisarImputacion).toBe("Revisar imputación");
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// «Cómo se calcula»: plantillas con huecos; ni una cifra escrita a mano.
// ---------------------------------------------------------------------------------------------------------------------------------------

describe("«Cómo se calcula»: plantillas sin cifras escritas a mano", () => {
  const plantillas = todasLasPlantillas();
  const textoFijo = (p: string) =>
    partirPlantilla(p)
      .flatMap((t) => ("texto" in t ? [t.texto] : []))
      .join("");

  it("ninguna plantilla tiene un dígito fuera de los huecos: los números los pone el código", () => {
    expect(plantillas.length).toBeGreaterThan(20);
    for (const p of plantillas) expect(textoFijo(p), p).not.toMatch(/\d/);
  });

  it("ningún título, rótulo ni párrafo tiene dígitos (la bajada y los ejemplos se llenan con huecos)", () => {
    const t = TEXTO_COMO_SE_CALCULA;
    for (const s of [t.titulo, t.indice, t.reglas, t.rotuloDelEjemplo, ...t.secciones.map((x) => x.titulo)]) expect(s).not.toMatch(/\d/);
  });

  it("cada hueco usado está declarado en HUECOS, y cada hueco declarado se usa", () => {
    const usados = new Set(plantillas.flatMap((p) => huecosDe(p)));
    expect([...usados].sort()).toEqual(Object.keys(HUECOS).sort());
  });

  it("cada hueco dice de dónde sale su valor y si es texto o enlace", () => {
    for (const [nombre, h] of Object.entries(HUECOS)) {
      expect(["texto", "enlace"], nombre).toContain(h.tipo);
      expect(h.fuente.length, nombre).toBeGreaterThan(10);
    }
  });

  it("los huecos de enlace y de texto se distinguen y los ejemplos siempre refieren a los datos (llevan al menos un hueco)", () => {
    for (const s of TEXTO_COMO_SE_CALCULA.secciones) for (const e of s.ejemplos) expect(huecosDe(e).length, e).toBeGreaterThan(0);
  });

  it("partirPlantilla separa el texto y los huecos; llenarPlantilla los reemplaza y lanza si falta uno o si no está declarado", () => {
    expect(partirPlantilla("Al {corte}: {saldo}.")).toEqual([{ texto: "Al " }, { hueco: "corte" }, { texto: ": " }, { hueco: "saldo" }, { texto: "." }]);
    expect(llenarPlantilla("Al {corte}: {saldo}.", { corte: "31/10/2026", saldo: "$ 1,00" })).toBe("Al 31/10/2026: $ 1,00.");
    expect(llenarPlantilla("Sin huecos.", {})).toBe("Sin huecos.");
    expect(() => llenarPlantilla("Al {corte}.", {})).toThrow(/corte/);
    expect(() => partirPlantilla("Un {inventado}.")).toThrow(/inventado/);
    expect(() => partirPlantilla("Un {__proto__}.")).not.toThrow(); // el patrón solo admite letras y dígitos
  });

  it("con todos los huecos de texto llenos, ninguna plantilla deja llaves ni «undefined» (los de enlace se llenan con su texto visible)", () => {
    const valores = Object.fromEntries(Object.keys(HUECOS).map((h) => [h, `[${h}]`]));
    for (const p of plantillas) {
      const lleno = llenarPlantilla(p, valores);
      expect(lleno, p).not.toMatch(/[{}]|undefined/);
    }
  });

  it("las secciones tienen identificador único, título, y cubren la explicación de los dos cálculos y de los controles cruzados", () => {
    const ids = TEXTO_COMO_SE_CALCULA.secciones.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of TEXTO_COMO_SE_CALCULA.secciones) {
      expect(s.titulo.length, s.id).toBeGreaterThan(3);
      expect(s.parrafos.length, s.id).toBeGreaterThan(0);
    }
    expect(ids).toEqual(["demo", "corte", "facturacion", "cobranza", "mora", "a-cuenta", "porcentajes", "cierre", "controles", "limites"]);
    const controles = TEXTO_COMO_SE_CALCULA.secciones.find((s) => s.id === "controles")?.parrafos.join(" ") ?? "";
    expect(controles).toContain("dos veces, por caminos separados");
    expect(controles).toContain("no muestra el número");
    expect(controles).toContain("no de criterio");
  });

  it("sin voseo ni regionalismos; no dice que la demo guarda datos ni que usa servidor; dice que es de solo lectura y con datos inventados", () => {
    const todo = plantillas.join(" ");
    expect(todo).not.toMatch(VOSEO);
    expect(todo).not.toMatch(INVISIBLES);
    expect(todo).toContain("solo lectura");
    expect(todo).toContain("inventados");
    expect(todo).toContain("no guarda datos");
  });
});

describe("textos con cantidad variable: el singular y el cero se leen bien", () => {
  it("meses: con 1 es «el último mes», con 12 «los últimos 12 meses»", () => {
    expect(TEXTO_GRAFICO.verLosMesesComoTabla(1)).toBe("Ver el mes como tabla");
    expect(TEXTO_GRAFICO.verLosMesesComoTabla(12)).toBe("Ver los 12 meses como tabla");
    expect(TEXTO_GRAFICO.ultimosMeses(1)).toBe("Último mes");
    expect(TEXTO_GRAFICO.ultimosMeses(12)).toBe("Últimos 12 meses");
    expect(TEXTO_GRAFICO.sinFacturacion(1)).toBe("Sin facturación en el último mes.");
    expect(TEXTO_GRAFICO.sinFacturacion(12)).toBe("Sin facturación en los últimos 12 meses.");
    expect(TEXTO_RESUMEN.graficoTitulo(1)).toBe("Facturado y cobrado, último mes");
    expect(TEXTO_RESUMEN.graficoTitulo(12)).toBe("Facturado y cobrado, últimos 12 meses");
    expect(TEXTO_CLIENTE.facturacion(1)).toBe("Facturación, último mes");
    expect(TEXTO_CLIENTE.facturacion(12)).toBe("Facturación, últimos 12 meses");
    expect(TEXTO_MESES.totalDeLosMeses(1)).toBe("Total del mes");
    expect(TEXTO_MESES.totalDeLosMeses(12)).toBe("Total de los 12 meses");
  });

  it("clientes: «Ver el cliente» con 1 y «Ver los 13 clientes» con varios", () => {
    expect(TEXTO_RESUMEN.verLosClientes(1)).toBe("Ver el cliente");
    expect(TEXTO_RESUMEN.verLosClientes(13)).toBe("Ver los 13 clientes");
  });

  it("plazos: «1 día» en singular, «0 días» y «30 días» en plural", () => {
    expect(TEXTO_CLIENTES.plazoYCuit(1, "30-99000003-3")).toContain("Plazo 1 día ·");
    expect(TEXTO_CLIENTES.plazoYCuit(0, "30-99000003-3")).toContain("Plazo 0 días ·");
    expect(TEXTO_CLIENTE.bajada("30-99000003-3", 1, C)).toContain("Plazo de pago: 1 día ·");
    expect(TEXTO_CLIENTE.bajada("30-99000003-3", 30, C)).toContain("Plazo de pago: 30 días ·");
    expect(TEXTO_COMPROBANTE.vencimientoConPlazo("2026-08-01", 1)).toContain("(plazo de 1 día)");
    expect(TEXTO_COMPROBANTE.vencimientoConPlazo("2026-08-01", 30)).toContain("(plazo de 30 días)");
  });
});
