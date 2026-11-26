// «Cómo se calcula» (plan 4.2, fila 5.4): cada cifra de la página sale de las constantes (`esperado.ts`, `plantados.ts`) y coincide con el dominio. Los textos
// (`textos-como-se-calcula.ts`) son plantillas sin cifras; acá se comprueba hueco por hueco que lo que las llena es lo que dicen las constantes, que los
// ejemplos cuentan lo que de verdad pasa en los enlaces que traen, y que cada enlace lleva a una pantalla que existe.
import { describe, expect, it } from "vitest";
import {
  HUECOS,
  TEXTO_COMO_SE_CALCULA,
  llenarPlantilla,
  partirPlantilla,
  todasLasPlantillas,
} from "../src/componentes/textos-como-se-calcula.ts";
import type { HuecoDeComoSeCalcula } from "../src/componentes/textos-como-se-calcula.ts";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { COMPROBANTES_PLANTADOS, RECIBOS_PLANTADOS } from "../src/lib/datos/plantados.ts";
import { TRAMOS } from "../src/lib/dominio/antiguedad.ts";
import { cierresDeMes, saldoAlCorte } from "../src/lib/dominio/corte.ts";
import { centavos, formatearImporte, formatearPorcentaje, sumarLista } from "../src/lib/dominio/dinero.ts";
import { diasEntre, formatearFecha, sumarDias } from "../src/lib/dominio/fechas.ts";
import { valorDeMedida } from "../src/lib/dominio/medidas.ts";
import { ROTULO_DE_TRAMO } from "../src/lib/dominio/textos.ts";
import { aHash, resolverDireccion } from "../src/lib/estado/enrutador.ts";
import { comprobantePorId, reciboPorId, vistaComprobante } from "../src/lib/vistas/comprobante.ts";
import type { VistaComprobante } from "../src/lib/vistas/comprobante.ts";
import { vistaComoSeCalcula, valoresDeComoSeCalcula } from "../src/lib/vistas/como-se-calcula.ts";
import type { TrozoDeComoSeCalcula, ValorDeHueco } from "../src/lib/vistas/como-se-calcula.ts";
import { vistaDesglose } from "../src/lib/vistas/desglose.ts";
import { vistaResumen } from "../src/lib/vistas/resumen.ts";
import { codigoDeComprobante } from "../src/lib/vistas/rotulos.ts";
import { CORTE, DATOS, PLANTADOS, idPlantado } from "./fixtures/vistas.ts";

const NB = " ";
/** Pesos con la forma de M1, escrita a mano: «$ 363.000,00». */
const pesos = (texto: string): string => `$${NB}${texto}`;

const valores = valoresDeComoSeCalcula(DATOS, PLANTADOS);
const textoDe = (h: HuecoDeComoSeCalcula): string => valores[h].texto;
const enlaceDe = (h: HuecoDeComoSeCalcula): Extract<ValorDeHueco, { tipo: "enlace" }> => {
  const v = valores[h];
  if (v.tipo !== "enlace") throw new Error(`El hueco ${h} no es un enlace.`);
  return v;
};
const plano = (trozos: readonly TrozoDeComoSeCalcula[]): string => trozos.map((t) => t.texto).join("");
const razon = (clienteId: string): string => DATOS.clientes.find((c) => c.id === clienteId)?.razonSocial ?? `(no existe ${clienteId})`;
const recibo = (alias: string) => {
  const r = reciboPorId(DATOS, idPlantado(alias));
  if (r === undefined) throw new Error(`No hay recibo ${alias}`);
  return r;
};
const situacion = (v: VistaComprobante) => {
  if (v.clase !== "comprobante") throw new Error(`El comprobante ${v.datos.id} no tiene situación al corte (${v.clase}).`);
  return v.situacion;
};
/** La dirección del enlace, ida y vuelta por el enrutador: lo que se lee es lo que se escribió, sin avisos. */
const destinoDe = (h: HuecoDeComoSeCalcula) => {
  const e = enlaceDe(h);
  return resolverDireccion(aHash(e.ruta, e.corte), DATOS);
};

describe("los huecos", () => {
  it("la página llena exactamente los huecos que declaran las plantillas, cada uno del tipo declarado", () => {
    expect(Object.keys(valores).sort()).toEqual(Object.keys(HUECOS).sort());
    for (const [nombre, declarado] of Object.entries(HUECOS)) expect(valores[nombre as HuecoDeComoSeCalcula].tipo, nombre).toBe(declarado.tipo);
  });

  it("las plantillas no llevan ninguna cifra escrita: todo número que se ve entra por un hueco", () => {
    for (const p of todasLasPlantillas()) {
      for (const trozo of partirPlantilla(p)) if ("texto" in trozo) expect(trozo.texto, p).not.toMatch(/\d/);
    }
  });

  it("ningún valor queda vacío ni con una llave sin llenar", () => {
    for (const [nombre, v] of Object.entries(valores)) {
      expect(v.texto.trim(), nombre).not.toBe("");
      expect(v.texto, nombre).not.toMatch(/[{}]/);
    }
  });
});

describe("la fecha de corte y el alcance de los datos", () => {
  it("el corte de los ejemplos es el de por defecto, esperado.ts, escrito dd/mm/aaaa", () => {
    expect(ESPERADO.corte).toBe(CORTE);
    expect(textoDe("corte")).toBe("31/10/2026");
  });

  it("el período y la cantidad de cierres salen de los datos (22 cierres, de enero de 2025 a octubre de 2026)", () => {
    expect(textoDe("desde")).toBe("enero de 2025");
    expect(textoDe("hasta")).toBe("octubre de 2026");
    expect(textoDe("cierres")).toBe(String(cierresDeMes(DATOS).length));
    expect(textoDe("cierres")).toBe("22");
  });

  it("la empresa es la de los datos, no una escrita aparte", () => {
    expect(textoDe("empresa")).toBe(DATOS.empresa.nombre);
  });
});

describe("saldo y tramos al corte por defecto", () => {
  it("los cinco importes de los tramos son los de esperado.ts, en el orden de los tramos, y coinciden con las medidas del dominio", () => {
    const esperados = TRAMOS.map((t) => formatearImporte(centavos(ESPERADO.tramos[t.clave])));
    expect(textoDe("sumandosDeTramos")).toBe(esperados.join(" + "));
    expect(textoDe("sumandosDeTramos")).toBe(
      [pesos("22.207.180,82"), pesos("4.552.834,33"), pesos("23.241,68"), pesos("1.125.405,27"), pesos("605.000,00")].join(" + "),
    );
    for (const t of TRAMOS) expect(valorDeMedida(DATOS, CORTE, `tramo-${t.clave}`), t.clave).toBe(ESPERADO.tramos[t.clave]);
  });

  it("el saldo es el de esperado.ts y es la suma de los cinco tramos (X1), también en el dominio", () => {
    expect(textoDe("saldo")).toBe(pesos("28.513.662,10"));
    expect(textoDe("saldo")).toBe(formatearImporte(centavos(ESPERADO.saldo)));
    expect(sumarLista(TRAMOS.map((t) => centavos(ESPERADO.tramos[t.clave])))).toBe(ESPERADO.saldo);
    expect(valorDeMedida(DATOS, CORTE, "saldo")).toBe(ESPERADO.saldo);
  });

  it("los rótulos de los tramos son los de la interfaz, en orden, separados por comas y con «y» antes del último", () => {
    expect(textoDe("rotulosDeTramo")).toBe("No vencido, 1 a 30 días, 31 a 60 días, 61 a 90 días y Más de 90 días");
    expect(textoDe("rotulosDeTramo")).toBe(`${TRAMOS.slice(0, 4).map((t) => ROTULO_DE_TRAMO[t.clave]).join(", ")} y ${ROTULO_DE_TRAMO["mas-90"]}`);
    expect(textoDe("tramoNoVencido")).toBe(ROTULO_DE_TRAMO["no-vencido"]);
  });
});

describe("ejemplo T05: cobrada después del corte (S1)", () => {
  it("el total, la fecha del cobro y los días de atraso son los del dato plantado", () => {
    const f = COMPROBANTES_PLANTADOS.find((c) => c.clave === "T05-F");
    const r = RECIBOS_PLANTADOS.find((x) => x.clave === "T05-R");
    expect(f?.emision).toBe("2026-09-25");
    expect(textoDe("totalT05")).toBe(pesos("363.000,00"));
    expect(comprobantePorId(DATOS, idPlantado("T05-F"))?.total).toBe(36_300_000);
    expect(textoDe("fechaCobroT05")).toBe(formatearFecha(r?.fecha ?? ""));
    expect(textoDe("fechaCobroT05")).toBe("03/11/2026");
    // Vence 30 días después de la emisión (plazo de C05): 25/10; al 31/10 lleva 6 días.
    expect(diasEntre(sumarDias("2026-09-25", 30), CORTE)).toBe(6);
    expect(textoDe("atrasoT05")).toBe("6 días");
  });

  it("el ejemplo es verdad en el enlace: al corte sigue con saldo y 6 días de atraso, y el cobro es posterior al corte", () => {
    const e = enlaceDe("facturaT05");
    expect(e.ruta).toEqual({ tipo: "comprobante", comprobanteId: idPlantado("T05-F") });
    expect(e.corte).toBe(CORTE);
    const s = situacion(vistaComprobante(DATOS, e.corte, idPlantado("T05-F")));
    expect(s.estado).toBe("con-saldo");
    expect(s.saldo).toBe(36_300_000);
    if (s.estado === "con-saldo") expect(s.atraso).toBe(6);
    expect(recibo("T05-R").fecha > CORTE).toBe(true);
  });

  it("el texto del enlace dice el tipo en minúscula y el código: «factura A 0003-…»", () => {
    expect(enlaceDe("facturaT05").texto).toBe(`factura A ${codigoDeComprobante(idPlantado("T05-F"))}`);
    expect(enlaceDe("facturaT05").texto).toMatch(/^factura A \d{4}-\d{8}$/);
  });
});

describe("ejemplo T04: vence el día del corte (S3)", () => {
  it("el vencimiento es el corte y al corte está «No vencido» (atraso 0)", () => {
    expect(textoDe("vencimientoT04")).toBe(textoDe("corte"));
    expect(comprobantePorId(DATOS, idPlantado("T04-F"))?.vencimiento).toBe(CORTE);
    const e = enlaceDe("facturaT04");
    expect(e.ruta).toEqual({ tipo: "comprobante", comprobanteId: idPlantado("T04-F") });
    expect(e.corte).toBe(CORTE);
    const s = situacion(vistaComprobante(DATOS, e.corte, idPlantado("T04-F")));
    expect(s.estado).toBe("con-saldo");
    if (s.estado === "con-saldo") {
      expect(s.atraso).toBe(0);
      expect(s.tramo).toBe("no-vencido");
    }
  });
});

describe("ejemplo T02: pago parcial después de vencer (S2, S6)", () => {
  it("el pago es el segundo recibo plantado, el corte es el cierre de su mes y el atraso se cuenta desde el vencimiento original", () => {
    expect(textoDe("fechaPagoT02")).toBe("15/09/2026");
    expect(textoDe("fechaPagoT02")).toBe(formatearFecha(recibo("T02-R2").fecha));
    expect(textoDe("corteT02")).toBe("30/09/2026");
    // Emitida el 10/07 con plazo de 30 días: vence el 09/08; al 30/09 lleva 52 días, aunque el pago del 15/09 ya entró.
    expect(textoDe("atrasoT02")).toBe("52 días");
    expect(diasEntre(sumarDias("2026-07-10", 30), "2026-09-30")).toBe(52);
  });

  it("es verdad en el enlace: al corte del ejemplo recibió el pago, no está cancelada y tiene 52 días de atraso; el tercer pago es posterior", () => {
    const e = enlaceDe("facturaT02");
    expect(e.ruta).toEqual({ tipo: "comprobante", comprobanteId: idPlantado("T02-F") });
    expect(e.corte).toBe("2026-09-30");
    const s = situacion(vistaComprobante(DATOS, e.corte, idPlantado("T02-F")));
    expect(s.estado).toBe("con-saldo");
    if (s.estado === "con-saldo") expect(s.atraso).toBe(52);
    expect(recibo("T02-R2").fecha <= e.corte).toBe(true);
    expect(recibo("T02-R3").fecha > e.corte).toBe(true);
    expect(saldoAlCorte(DATOS, idPlantado("T02-F"), e.corte)).toBeGreaterThan(0);
  });
});

describe("ejemplo T08: recibo con retenciones (R2)", () => {
  it("el recibo, los importes de sus medios y su total son los del dato plantado, y el total es la suma de los medios", () => {
    const r = recibo("T08-R");
    expect(textoDe("reciboT08")).toBe(r.id);
    expect(textoDe("sumandosT08")).toBe([pesos("1.170.000,00"), pesos("25.000,00"), pesos("15.000,00")].join(" + "));
    expect(textoDe("totalT08")).toBe(pesos("1.210.000,00"));
    expect(textoDe("totalT08")).toBe(formatearImporte(sumarLista(r.medios.map((m) => m.importe))));
    expect(textoDe("mediosT08")).toBe("transferencia, retención IIBB y retención Ganancias");
  });

  it("el recibo cancela justo la factura: al cierre del mes del recibo la factura figura cancelada", () => {
    const e = enlaceDe("facturaT08");
    expect(e.ruta).toEqual({ tipo: "comprobante", comprobanteId: idPlantado("T08-F") });
    expect(e.corte).toBe("2026-04-30");
    expect(e.corte >= recibo("T08-R").fecha).toBe(true);
    expect(situacion(vistaComprobante(DATOS, e.corte, idPlantado("T08-F"))).estado).toBe("cancelado");
    expect(comprobantePorId(DATOS, idPlantado("T08-F"))?.total).toBe(121_000_000);
  });
});

describe("pagos a cuenta y saldos a favor (R4)", () => {
  it("los dos clientes y los dos importes son los de esperado.ts, y coinciden con las medidas del dominio", () => {
    expect(textoDe("importeT06")).toBe(pesos("50.000,00"));
    expect(textoDe("importeT07")).toBe(pesos("58.000,00"));
    expect(textoDe("importeT06")).toBe(formatearImporte(centavos(ESPERADO.pagosACuenta.importe)));
    expect(textoDe("importeT07")).toBe(formatearImporte(centavos(ESPERADO.saldosAFavor.importe)));
    expect(valorDeMedida(DATOS, CORTE, "pagos-a-cuenta")).toBe(ESPERADO.pagosACuenta.importe);
    expect(valorDeMedida(DATOS, CORTE, "saldos-a-favor")).toBe(ESPERADO.saldosAFavor.importe);
  });

  it("los enlaces llevan a la ficha de cada cliente y dicen su razón social", () => {
    expect(enlaceDe("clienteC07").ruta).toEqual({ tipo: "cliente", clienteId: ESPERADO.pagosACuenta.clienteId });
    expect(enlaceDe("clienteC07").texto).toBe(razon(ESPERADO.pagosACuenta.clienteId));
    expect(enlaceDe("clienteC09").ruta).toEqual({ tipo: "cliente", clienteId: ESPERADO.saldosAFavor.clienteId });
    expect(enlaceDe("clienteC09").texto).toBe(razon(ESPERADO.saldosAFavor.clienteId));
  });
});

describe("porcentajes de «Deudores» (M3)", () => {
  it("los seis porcentajes (cinco y «Otros») son los de esperado.ts, los mismos que muestra el Resumen, y suman 100,0 %", () => {
    expect(textoDe("sumandosDeDeudores")).toBe("54,7 + 18,8 + 14,9 + 8,4 + 2,1 + 1,1");
    expect(textoDe("totalDelReparto")).toBe(`100,0${NB}%`);
    expect(textoDe("totalDelReparto")).toBe(formatearPorcentaje(1000));

    const sinSigno = (m: number | null): string => formatearPorcentaje(m).replace(`${NB}%`, "");
    const d = vistaResumen(DATOS, CORTE).deudores;
    expect(d.otros).not.toBeNull();
    const delResumen = [...d.filas.map((f) => f.milesimas), d.otros?.milesimas ?? null];
    expect(textoDe("sumandosDeDeudores")).toBe(delResumen.map(sinSigno).join(" + "));
    expect(delResumen.reduce<number>((suma, m) => suma + (m ?? 0), 0)).toBe(1000);

    const deConstantes = [...ESPERADO.deudores.slice(0, 5).map((x) => x.milesimas), ESPERADO.deudores.slice(5).reduce((s, x) => s + x.milesimas, 0)];
    expect(deConstantes.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(textoDe("sumandosDeDeudores")).toBe(deConstantes.map(sinSigno).join(" + "));
  });
});

describe("ejemplo del cierre: del Resumen a la factura pasando por la mora de un cliente", () => {
  it("«Resumen» lleva al resumen; la mora del cliente con más mora lleva a su desglose; la factura T12 es el comprobante más atrasado", () => {
    expect(enlaceDe("resumen").ruta).toEqual({ tipo: "resumen" });
    expect(enlaceDe("resumen").texto).toBe("Resumen");
    expect(enlaceDe("moraDeC05").ruta).toEqual({ tipo: "desglose", clave: "mora", clienteId: ESPERADO.clienteConMasMora });
    expect(enlaceDe("moraDeC05").texto).toBe(`la mora de ${razon(ESPERADO.clienteConMasMora)}`);
    expect(enlaceDe("facturaT12").ruta).toEqual({ tipo: "comprobante", comprobanteId: idPlantado(ESPERADO.comprobanteMasAtrasado.alias) });
    expect(enlaceDe("facturaT12").corte).toBe(CORTE);
  });

  it("es verdad: el desglose de la mora de ese cliente trae esa factura entre sus partidas", () => {
    const v = vistaDesglose(DATOS, CORTE, { clave: "mora", clienteId: ESPERADO.clienteConMasMora });
    expect(v.modo).toBe("partidas");
    if (v.modo === "partidas") expect(v.partidas.map((p) => p.ref.id)).toContain(idPlantado("T12-d91"));
    const s = situacion(vistaComprobante(DATOS, CORTE, idPlantado("T12-d91")));
    if (s.estado === "con-saldo") expect(s.atraso).toBe(ESPERADO.comprobanteMasAtrasado.dias);
  });
});

describe("los enlaces", () => {
  const huecosEnlace = (Object.keys(HUECOS) as HuecoDeComoSeCalcula[]).filter((h) => HUECOS[h].tipo === "enlace");

  it("hay nueve enlaces de ejemplo y todos tienen texto visible", () => {
    expect(huecosEnlace).toHaveLength(9);
    for (const h of huecosEnlace) expect(enlaceDe(h).texto.trim(), h).not.toBe("");
  });

  it("cada enlace apunta a una pantalla que existe: ida y vuelta por el enrutador, sin avisos y con el mismo corte", () => {
    for (const h of huecosEnlace) {
      const e = enlaceDe(h);
      const d = destinoDe(h);
      expect(d.ruta, h).toEqual(e.ruta);
      expect(d.corte, h).toBe(e.corte);
      expect(d.avisos, h).toEqual([]);
      expect(cierresDeMes(DATOS), h).toContain(e.corte);
    }
  });

  it("los enlaces a comprobantes llevan a un comprobante de los datos, y los de clientes, a un cliente de los datos", () => {
    for (const h of huecosEnlace) {
      const { ruta } = enlaceDe(h);
      if (ruta.tipo === "comprobante") expect(comprobantePorId(DATOS, ruta.comprobanteId), h).toBeDefined();
      if (ruta.tipo === "cliente") expect(DATOS.clientes.some((c) => c.id === ruta.clienteId), h).toBe(true);
    }
  });
});

describe("la página armada", () => {
  const vista = vistaComoSeCalcula(DATOS, PLANTADOS);

  it("tiene el título, la bajada con el corte y las diez secciones del texto, en orden y con sus identificadores", () => {
    expect(vista.titulo).toBe("Cómo se calcula");
    expect(plano(vista.bajada)).toBe("Las reglas del tablero, en palabras y con ejemplos de los mismos datos. Los ejemplos están al 31/10/2026 salvo que digan otra fecha.");
    expect(vista.secciones.map((s) => s.id)).toEqual(TEXTO_COMO_SE_CALCULA.secciones.map((s) => s.id));
    expect(vista.secciones.map((s) => s.titulo)).toEqual(TEXTO_COMO_SE_CALCULA.secciones.map((s) => s.titulo));
  });

  it("cada párrafo y cada ejemplo es su plantilla llena con los valores, y no queda ninguna llave sin llenar", () => {
    const textos: Partial<Record<HuecoDeComoSeCalcula, string>> = Object.fromEntries(Object.entries(valores).map(([h, v]) => [h, v.texto]));
    vista.secciones.forEach((s, i) => {
      const origen = TEXTO_COMO_SE_CALCULA.secciones[i];
      expect(s.parrafos.map(plano)).toEqual((origen?.parrafos ?? []).map((p) => llenarPlantilla(p, textos)));
      expect(s.ejemplos.map(plano)).toEqual((origen?.ejemplos ?? []).map((p) => llenarPlantilla(p, textos)));
      for (const t of [...s.parrafos.flat(), ...s.ejemplos.flat()]) expect(t.texto).not.toMatch(/[{}]/);
    });
  });

  it("los trozos de texto vecinos vienen juntos: un enlace nunca queda pegado a otro trozo sin texto de por medio", () => {
    for (const s of vista.secciones) {
      for (const frase of [...s.parrafos, ...s.ejemplos]) {
        frase.forEach((t, i) => {
          if (i > 0) expect(frase[i - 1]?.tipo === "texto" && t.tipo === "texto").toBe(false);
        });
      }
    }
  });

  it("los ejemplos escritos completos (el golden de la página al corte por defecto)", () => {
    const cod = (alias: string): string => codigoDeComprobante(idPlantado(alias));
    const ejemplos = Object.fromEntries(vista.secciones.map((s) => [s.id, s.ejemplos.map(plano)]));
    expect(ejemplos["corte"]).toEqual([`La factura A ${cod("T05-F")}, de ${pesos("363.000,00")}, se cobró el 03/11/2026. Al 31/10/2026 sigue impaga, con 6 días de atraso.`]);
    expect(ejemplos["cobranza"]).toEqual([
      `La factura A ${cod("T08-F")} se canceló con el recibo ${idPlantado("T08-R")}: ${pesos("1.170.000,00")} + ${pesos("25.000,00")} + ${pesos("15.000,00")} = ${pesos("1.210.000,00")} (transferencia, retención IIBB y retención Ganancias).`,
    ]);
    expect(ejemplos["mora"]).toEqual([
      `La factura A ${cod("T04-F")} vence el 31/10/2026: al corte del 31/10/2026 está en «No vencido».`,
      `La factura A ${cod("T02-F")} recibió un pago parcial el 15/09/2026, después de vencer, y al 30/09/2026 sigue con 52 días de atraso.`,
      `Al 31/10/2026: ${pesos("22.207.180,82")} + ${pesos("4.552.834,33")} + ${pesos("23.241,68")} + ${pesos("1.125.405,27")} + ${pesos("605.000,00")} = ${pesos("28.513.662,10")}, el saldo a cobrar.`,
    ]);
    expect(ejemplos["a-cuenta"]).toEqual([`${razon("C07")} tiene ${pesos("50.000,00")} cobrados sin imputar; ${razon("C09")}, un saldo a favor de ${pesos("58.000,00")}.`]);
    expect(ejemplos["porcentajes"]).toEqual([`Deudores al 31/10/2026: 54,7 + 18,8 + 14,9 + 8,4 + 2,1 + 1,1 = 100,0${NB}%.`]);
    expect(ejemplos["cierre"]).toEqual([
      `Desde el Resumen abra la mora, después la mora de ${razon("C05")} y, dentro, la factura A ${cod("T12-d91")}: en cada paso, el total coincide con el importe que se abrió.`,
    ]);
  });

  it("los enlaces de la página son los mismos valores que los huecos (el texto que se ve es el del enlace)", () => {
    const enlaces = vista.secciones.flatMap((s) => [...s.parrafos, ...s.ejemplos].flat()).filter((t) => t.tipo === "enlace");
    expect(enlaces.length).toBeGreaterThanOrEqual(9);
    for (const e of enlaces) {
      if (e.tipo !== "enlace") continue;
      expect(Object.values(valores).some((v) => v.tipo === "enlace" && v.texto === e.texto && v.corte === e.corte && JSON.stringify(v.ruta) === JSON.stringify(e.ruta))).toBe(true);
    }
  });
});

describe("lo que no vale se rechaza en voz alta", () => {
  it("con otra semilla las constantes de esperado.ts no valen: lanza en vez de mostrar cifras que no son", () => {
    expect(() => valoresDeComoSeCalcula({ ...DATOS, semilla: 1 }, PLANTADOS)).toThrow(/semilla/);
  });

  it("si falta un caso plantado lanza y nombra cuál", () => {
    const { ["T08-R"]: _quitado, ...sinT08R } = PLANTADOS;
    expect(() => valoresDeComoSeCalcula(DATOS, sinT08R)).toThrow(/T08-R/);
  });

  it("un alias que apunta a un id que no está en los datos también lanza", () => {
    expect(() => valoresDeComoSeCalcula(DATOS, { ...PLANTADOS, "T05-F": "1-9999-99999999" })).toThrow(/T05-F/);
  });
});
