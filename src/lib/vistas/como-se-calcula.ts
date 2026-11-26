// «Cómo se calcula» con sus cifras. El texto (`textos-como-se-calcula.ts`) son
// plantillas sin una sola cifra, con huecos entre llaves; este módulo calcula lo que va en cada hueco y arma la página lista para dibujar: párrafos y
// ejemplos partidos en trozos de texto y enlaces. Cada cifra sale de una constante de la semilla publicada (`esperado.ts`) o de los datos (el dominio y los
// casos plantados); `tests/como-se-calcula.test.ts` las compara con las dos fuentes y comprueba que cada ejemplo cuenta lo que pasa en el enlace que trae.
//
// Solo vale para la semilla publicada: con otros datos, `esperado.ts` no describe lo que se ve, así que lanza en vez de mostrar cifras que no son.

import { TEXTO_COMO_SE_CALCULA, partirPlantilla, textoDelEnlaceDeLaMoraDe } from "../../componentes/textos-como-se-calcula.ts";
import type { HuecoDeComoSeCalcula } from "../../componentes/textos-como-se-calcula.ts";
import { TEXTO_MARCO } from "../../componentes/textos-marco.ts";
import { ESPERADO } from "../datos/esperado.ts";
import type { Plantados } from "../datos/plantados.ts";
import { TRAMOS } from "../dominio/antiguedad.ts";
import { cierresDeMes } from "../dominio/corte.ts";
import { centavos, formatearImporte, formatearPorcentaje } from "../dominio/dinero.ts";
import { formatearFecha } from "../dominio/fechas.ts";
import { ROTULO_DE_MEDIO, ROTULO_DE_TIPO, ROTULO_DE_TRAMO, cantidadDe, nombreDelMes } from "../dominio/textos.ts";
import type { Comprobante, Datos, FechaCivil, Recibo } from "../dominio/tipos.ts";
import type { RutaNavegable } from "../estado/enrutador.ts";
import { comprobantePorId, detalleDeRecibo, reciboPorId, vistaComprobante } from "./comprobante.ts";
import { ultimoDiaDelMes } from "./formato.ts";
import { codigoDeComprobante, razonSocialDe } from "./rotulos.ts";

/**
 * Lo que va en un hueco, o un trozo de la página: un texto, o un enlace a otra pantalla. El enlace trae la ruta y el corte con el que se abre (cada ejemplo
 * se mira a su fecha); la dirección la arma la interfaz con `estado.enlace(ruta, corte)`.
 */
export type ValorDeHueco = { tipo: "texto"; texto: string } | { tipo: "enlace"; texto: string; ruta: RutaNavegable; corte: FechaCivil };
export type TrozoDeComoSeCalcula = ValorDeHueco;

export interface SeccionDeLaPagina {
  /** Es el identificador del ancla (`cc-{id}`) y de la entrada del índice. */
  id: string;
  titulo: string;
  /** Cada párrafo de la regla, en trozos. */
  parrafos: TrozoDeComoSeCalcula[][];
  /** Cada ejemplo con los datos, en trozos. */
  ejemplos: TrozoDeComoSeCalcula[][];
}

export interface VistaComoSeCalcula {
  titulo: string;
  bajada: TrozoDeComoSeCalcula[];
  secciones: SeccionDeLaPagina[];
}

// ---------------------------------------------------------------------------------------------------------------------------
// Los casos plantados
// ---------------------------------------------------------------------------------------------------------------------------

function idPlantado(plantados: Plantados, alias: string): string {
  const id = plantados[alias];
  if (id === undefined) throw new Error(`Error interno: «Cómo se calcula» necesita el caso plantado ${alias} y no está.`);
  return id;
}

function comprobanteDe(datos: Datos, plantados: Plantados, alias: string): Comprobante {
  const c = comprobantePorId(datos, idPlantado(plantados, alias));
  if (c === undefined) throw new Error(`Error interno: el caso plantado ${alias} no está en los datos.`);
  return c;
}

function reciboDe(datos: Datos, plantados: Plantados, alias: string): Recibo {
  const r = reciboPorId(datos, idPlantado(plantados, alias));
  if (r === undefined) throw new Error(`Error interno: el caso plantado ${alias} no está en los datos.`);
  return r;
}

/** Los días de atraso del comprobante a esa fecha, tal como los muestra su pantalla. Lanza si ya no tiene saldo: el ejemplo diría otra cosa. */
function atrasoAl(datos: Datos, comprobanteId: string, corte: FechaCivil): number {
  const v = vistaComprobante(datos, corte, comprobanteId);
  if (v.clase !== "comprobante" || v.situacion.estado !== "con-saldo") throw new Error(`Error interno: el ejemplo supone que ${comprobanteId} tiene saldo al ${formatearFecha(corte)}.`);
  return v.situacion.atraso;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Pequeños armadores
// ---------------------------------------------------------------------------------------------------------------------------

const texto = (t: string): ValorDeHueco => ({ tipo: "texto", texto: t });
const enlace = (t: string, ruta: RutaNavegable, corte: FechaCivil): ValorDeHueco => ({ tipo: "enlace", texto: t, ruta, corte });

const enMinusculaInicial = (t: string): string => `${t.charAt(0).toLowerCase()}${t.slice(1)}`;

/** `a, b y c`; con uno solo, ese. */
function unirConY(items: readonly string[]): string {
  const ultimo = items.at(-1);
  if (ultimo === undefined) return "";
  return items.length === 1 ? ultimo : `${items.slice(0, -1).join(", ")} y ${ultimo}`;
}

/** «factura A 0003-00000562»: el tipo en minúscula y el código, para el medio de una frase. */
const nombreEnFrase = (c: Comprobante): string => `${enMinusculaInicial(ROTULO_DE_TIPO[c.tipo])} ${codigoDeComprobante(c.id)}`;

const importe = (centavosDeImporte: number): string => formatearImporte(centavos(centavosDeImporte));

/** `54,7 %` → `54,7`: los sumandos de un reparto no llevan el signo; el total sí. */
const sinSigno = (milesimas: number): string => formatearPorcentaje(milesimas).replace(/ %$/, "");

// ---------------------------------------------------------------------------------------------------------------------------
// Los valores de los huecos
// ---------------------------------------------------------------------------------------------------------------------------

/** Lo que va en cada hueco de las plantillas, con los datos y los casos plantados de la semilla publicada. Lanza si los datos son de otra semilla o falta un caso. */
export function valoresDeComoSeCalcula(datos: Datos, plantados: Plantados): Readonly<Record<HuecoDeComoSeCalcula, ValorDeHueco>> {
  if (datos.semilla !== ESPERADO.semilla) {
    throw new Error("Error interno: «Cómo se calcula» usa las cifras de la semilla publicada (esperado.ts) y estos datos son de otra semilla.");
  }
  const corte = ESPERADO.corte;

  const t05 = comprobanteDe(datos, plantados, "T05-F");
  const t04 = comprobanteDe(datos, plantados, "T04-F");
  const t02 = comprobanteDe(datos, plantados, "T02-F");
  const t08 = comprobanteDe(datos, plantados, "T08-F");
  const t12 = comprobanteDe(datos, plantados, ESPERADO.comprobanteMasAtrasado.alias);
  const reciboT05 = reciboDe(datos, plantados, "T05-R");
  const pagoT02 = reciboDe(datos, plantados, "T02-R2");
  const reciboT08 = detalleDeRecibo(datos, reciboDe(datos, plantados, "T08-R").id);

  // T02: el cierre del mes del segundo pago, para que se vea el pago parcial y todavía no el tercero.
  const corteT02 = ultimoDiaDelMes(pagoT02.fecha);
  // T08: el cierre del mes del recibo, para que se vea cancelada y no en un cierre anterior.
  const corteT08 = ultimoDiaDelMes(reciboT08.fecha);

  // «Deudores»: los cinco mayores y «Otros» (el resto), con los porcentajes de esperado.ts.
  const cincoMayores = ESPERADO.deudores.slice(0, 5).map((d) => d.milesimas);
  const delResto = ESPERADO.deudores.slice(5).map((d) => d.milesimas);
  const sumandosDeDeudores = [...cincoMayores, ...(ESPERADO.hayOtros ? [delResto.reduce((suma, m) => suma + m, 0)] : [])];

  const clienteConMasMora = razonSocialDe(datos, ESPERADO.clienteConMasMora);

  return {
    empresa: texto(datos.empresa.nombre),
    desde: texto(nombreDelMes(datos.desde.slice(0, 7))),
    hasta: texto(nombreDelMes(datos.hasta.slice(0, 7))),
    cierres: texto(String(cierresDeMes(datos).length)),
    corte: texto(formatearFecha(corte)),

    facturaT05: enlace(nombreEnFrase(t05), { tipo: "comprobante", comprobanteId: t05.id }, corte),
    totalT05: texto(formatearImporte(t05.total)),
    fechaCobroT05: texto(formatearFecha(reciboT05.fecha)),
    atrasoT05: texto(cantidadDe(atrasoAl(datos, t05.id, corte), "día", "días")),

    facturaT04: enlace(nombreEnFrase(t04), { tipo: "comprobante", comprobanteId: t04.id }, corte),
    vencimientoT04: texto(formatearFecha(t04.vencimiento)),
    tramoNoVencido: texto(ROTULO_DE_TRAMO["no-vencido"]),

    facturaT02: enlace(nombreEnFrase(t02), { tipo: "comprobante", comprobanteId: t02.id }, corteT02),
    fechaPagoT02: texto(formatearFecha(pagoT02.fecha)),
    corteT02: texto(formatearFecha(corteT02)),
    atrasoT02: texto(cantidadDe(atrasoAl(datos, t02.id, corteT02), "día", "días")),

    rotulosDeTramo: texto(unirConY(TRAMOS.map((t) => ROTULO_DE_TRAMO[t.clave]))),
    sumandosDeTramos: texto(TRAMOS.map((t) => importe(ESPERADO.tramos[t.clave])).join(" + ")),
    saldo: texto(importe(ESPERADO.saldo)),

    facturaT08: enlace(nombreEnFrase(t08), { tipo: "comprobante", comprobanteId: t08.id }, corteT08),
    reciboT08: texto(reciboT08.id),
    sumandosT08: texto(reciboT08.medios.map((m) => formatearImporte(m.importe)).join(" + ")),
    totalT08: texto(formatearImporte(reciboT08.total)),
    mediosT08: texto(unirConY([...new Set(reciboT08.medios.map((m) => enMinusculaInicial(ROTULO_DE_MEDIO[m.medio])))])),

    clienteC07: enlace(razonSocialDe(datos, ESPERADO.pagosACuenta.clienteId), { tipo: "cliente", clienteId: ESPERADO.pagosACuenta.clienteId }, corte),
    importeT06: texto(importe(ESPERADO.pagosACuenta.importe)),
    clienteC09: enlace(razonSocialDe(datos, ESPERADO.saldosAFavor.clienteId), { tipo: "cliente", clienteId: ESPERADO.saldosAFavor.clienteId }, corte),
    importeT07: texto(importe(ESPERADO.saldosAFavor.importe)),

    totalDelReparto: texto(formatearPorcentaje(1000)),
    sumandosDeDeudores: texto(sumandosDeDeudores.map(sinSigno).join(" + ")),

    resumen: enlace(TEXTO_MARCO.seccionResumen, { tipo: "resumen" }, corte),
    moraDeC05: enlace(textoDelEnlaceDeLaMoraDe(clienteConMasMora), { tipo: "desglose", clave: "mora", clienteId: ESPERADO.clienteConMasMora }, corte),
    facturaT12: enlace(nombreEnFrase(t12), { tipo: "comprobante", comprobanteId: t12.id }, corte),
  };
}

// ---------------------------------------------------------------------------------------------------------------------------
// La página
// ---------------------------------------------------------------------------------------------------------------------------

/** Parte una plantilla en trozos de texto y enlaces, con los huecos llenos. Los textos vecinos se juntan en uno solo. */
function trozosDe(plantilla: string, valores: Readonly<Record<HuecoDeComoSeCalcula, ValorDeHueco>>): TrozoDeComoSeCalcula[] {
  const trozos: TrozoDeComoSeCalcula[] = [];
  for (const parte of partirPlantilla(plantilla)) {
    const nuevo = "hueco" in parte ? valores[parte.hueco] : texto(parte.texto);
    const ultimo = trozos.at(-1);
    if (nuevo.tipo === "texto" && ultimo?.tipo === "texto") trozos[trozos.length - 1] = texto(ultimo.texto + nuevo.texto);
    else trozos.push(nuevo);
  }
  return trozos;
}

/** La página «Cómo se calcula» al corte por defecto, lista para dibujar. Lanza en los mismos casos que `valoresDeComoSeCalcula`. */
export function vistaComoSeCalcula(datos: Datos, plantados: Plantados): VistaComoSeCalcula {
  const valores = valoresDeComoSeCalcula(datos, plantados);
  const t = TEXTO_COMO_SE_CALCULA;
  return {
    titulo: t.titulo,
    bajada: trozosDe(t.bajada, valores),
    secciones: t.secciones.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      parrafos: s.parrafos.map((p) => trozosDe(p, valores)),
      ejemplos: s.ejemplos.map((e) => trozosDe(e, valores)),
    })),
  };
}
