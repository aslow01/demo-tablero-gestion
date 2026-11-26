// Rótulos, fórmulas y avisos en español neutro, en un solo lugar (docs/diseno.md, sección 8). Funciones puras: reciben los números y
// devuelven el texto, para que la interfaz no arme frases.

import { tramoDe } from "./antiguedad.ts";
import type { Tramo } from "./antiguedad.ts";
import { esClaveDelMes } from "./claves.ts";
import { formatearImporte, formatearPorcentaje } from "./dinero.ts";
import type { Centavos, Milesimas } from "./dinero.ts";
import { formatearFecha } from "./fechas.ts";
import type { ClaveDeMedida, FechaCivil, Medio, Servicio, TipoCmp } from "./tipos.ts";

/** S5: la dirección trae un corte ausente de rango, que no es cierre de mes o repetido. */
export function avisoDeCorteInvalido(porDefecto: FechaCivil): string {
  return `La fecha de corte de la dirección no es válida. Se muestra el ${formatearFecha(porDefecto)}.`;
}

/**
 * Aviso al cambiar de cierre mirando el desglose «En mora: otros clientes» cuando ese grupo no existe en el cierre elegido: se pasa a la
 * lista completa de mora. `corte` es el cierre elegido.
 */
export function avisoDeOtrosInexistente(corte: FechaCivil): string {
  return `Al ${formatearFecha(corte)} no hay «Otros»: se muestra la mora de todos los clientes.`;
}

/** «El mes de la dirección no es válido. Se muestra octubre de 2026.» (docs/diseno-ui.md, 5.12): el mes que se muestra es el del corte. */
export function avisoDeMesInvalido(mesQueSeMuestra: string): string {
  return `El mes de la dirección no es válido. Se muestra ${nombreDelMes(mesQueSeMuestra)}.`;
}

/** A1: los rótulos de tramo de la interfaz (sección 7 de `diseno.md`). Con «a» y no con raya: los lectores de pantalla leen distinta la raya. */
export const ROTULO_DE_TRAMO: Readonly<Record<Tramo, string>> = {
  "no-vencido": "No vencido",
  "1-30": "1 a 30 días",
  "31-60": "31 a 60 días",
  "61-90": "61 a 90 días",
  "mas-90": "Más de 90 días",
};

/** Nota de una partida de saldo: los días de atraso si ya venció (S3: 1 o más), o el vencimiento si todavía no. */
export function notaDeSaldo(atraso: number, vencimiento: FechaCivil): string {
  if (atraso >= 1) return atraso === 1 ? "1 día de atraso" : `${atraso} días de atraso`;
  return `Vence el ${formatearFecha(vencimiento)}`;
}

const NOMBRE_DE_RETENCION: Readonly<Partial<Record<Medio, string>>> = {
  "retencion-iibb": "IIBB",
  "retencion-ganancias": "Ganancias",
  "retencion-iva": "IVA",
};

/** Nota de una partida de retenciones: «Retención IIBB $ 25.000,00 y Ganancias $ 15.000,00». Ignora lo que no es una retención. */
export function notaDeRetenciones(retenciones: readonly { medio: Medio; importe: Centavos }[]): string {
  const partes = retenciones.flatMap((r) => {
    const nombre = NOMBRE_DE_RETENCION[r.medio];
    return nombre === undefined ? [] : [`${nombre} ${formatearImporte(r.importe)}`];
  });
  if (partes.length === 0) return "";
  const ultimo = partes[partes.length - 1] as string;
  return `Retención ${partes.length === 1 ? ultimo : `${partes.slice(0, -1).join(", ")} y ${ultimo}`}`;
}

const NOMBRE_DEL_MES: Readonly<Record<string, string>> = {
  "01": "enero",
  "02": "febrero",
  "03": "marzo",
  "04": "abril",
  "05": "mayo",
  "06": "junio",
  "07": "julio",
  "08": "agosto",
  "09": "septiembre",
  "10": "octubre",
  "11": "noviembre",
  "12": "diciembre",
};

/** `2026-10` → «octubre de 2026». Lanza si no es `AAAA-MM`. */
export function nombreDelMes(mes: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  const nombre = m === null ? undefined : NOMBRE_DEL_MES[m[2] ?? ""];
  if (m === null || nombre === undefined) throw new Error(`El mes «${mes}» no tiene el formato AAAA-MM.`);
  return `${nombre} de ${m[1]}`;
}

/** Título de cada medida del catálogo (4.2), tal como lo lee quien mira el tablero. */
export const TITULO_DE_MEDIDA: Readonly<Record<ClaveDeMedida, string>> = {
  "facturacion-mes": "Facturación del mes",
  "facturado-con-iva-mes": "Facturado con IVA del mes",
  "iva-mes": "IVA facturado del mes",
  "cobranza-mes": "Cobranza del mes",
  "retenciones-mes": "De lo cual, retenciones",
  saldo: "Saldo a cobrar",
  mora: "En mora",
  "tramo-no-vencido": `Días de atraso: ${ROTULO_DE_TRAMO["no-vencido"]}`,
  "tramo-1-30": `Días de atraso: ${ROTULO_DE_TRAMO["1-30"]}`,
  "tramo-31-60": `Días de atraso: ${ROTULO_DE_TRAMO["31-60"]}`,
  "tramo-61-90": `Días de atraso: ${ROTULO_DE_TRAMO["61-90"]}`,
  "tramo-mas-90": `Días de atraso: ${ROTULO_DE_TRAMO["mas-90"]}`,
  "pagos-a-cuenta": "Pagos a cuenta sin imputar",
  "saldos-a-favor": "Saldos a favor",
  "saldo-neto": "Saldo neto",
  "mora-otros": "En mora: otros clientes",
};

/**
 * La fórmula de una medida en una frase de lenguaje llano, armada con la fecha del corte (y el mes, en las del mes: sin `mes` rige el mes
 * del corte, S7). Es lo que lee quien pregunta «¿de dónde sale este número?».
 */
export function formulaDeMedida(clave: ClaveDeMedida, corte: FechaCivil, mes?: string): string {
  const al = formatearFecha(corte);
  const delMes = esClaveDelMes(clave) ? nombreDelMes(mes ?? corte.slice(0, 7)) : "";
  switch (clave) {
    case "facturacion-mes":
      return `Suma del neto sin IVA de las facturas y notas de débito emitidas en ${delMes}, menos el neto de las notas de crédito.`;
    case "facturado-con-iva-mes":
      return `Suma del total con IVA de las facturas y notas de débito emitidas en ${delMes}, menos el total de las notas de crédito.`;
    case "iva-mes":
      return `Suma del IVA de cada factura y nota de débito emitidas en ${delMes}, menos el de las notas de crédito: es la suma de los IVA de cada comprobante, no el 21 % del neto del mes.`;
    case "cobranza-mes":
      return `Suma de todos los medios de cobro de los recibos de ${delMes}: transferencias, cheques y retenciones.`;
    case "retenciones-mes":
      return `Suma de las retenciones de IIBB, Ganancias e IVA incluidas en los recibos de ${delMes}.`;
    case "saldo":
      return `Suma del saldo pendiente de los comprobantes al ${al}.`;
    case "mora":
      return `Suma del saldo de los comprobantes con 1 día de atraso o más al ${al}.`;
    case "tramo-no-vencido":
      return `Suma del saldo de los comprobantes que al ${al} todavía no vencieron (vencen ese día o después).`;
    case "tramo-1-30":
      return `Suma del saldo de los comprobantes con 1 a 30 días de atraso al ${al}.`;
    case "tramo-31-60":
      return `Suma del saldo de los comprobantes con 31 a 60 días de atraso al ${al}.`;
    case "tramo-61-90":
      return `Suma del saldo de los comprobantes con 61 a 90 días de atraso al ${al}.`;
    case "tramo-mas-90":
      return `Suma del saldo de los comprobantes con más de 90 días de atraso al ${al}.`;
    case "pagos-a-cuenta":
      return `Suma de lo cobrado sin imputar a ningún comprobante, de los clientes que al ${al} todavía tienen saldo pendiente.`;
    case "saldos-a-favor":
      return `Suma de lo cobrado sin imputar a ningún comprobante, de los clientes que al ${al} no tienen saldo pendiente.`;
    case "saldo-neto":
      return `Saldo a cobrar menos los pagos a cuenta y los saldos a favor al ${al}.`;
    case "mora-otros":
      return `Mora de los clientes que no están entre los cinco mayores deudores al ${al}.`;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Textos de la interfaz que el dominio sabe armar.
// Todo lo que sigue es texto que el dominio sabe armar: rótulos de los datos, títulos de desglose, estados de lista, anuncios y etiquetas
// accesibles. Son funciones puras: reciben los números ya calculados y devuelven la frase. Los textos fijos de cada pantalla están en
// `src/componentes/textos-marco.ts`; la explicación de «Cómo se calcula», en `src/componentes/textos-como-se-calcula.ts`.
// ---------------------------------------------------------------------------------------------------------------------------------------

/** `1 cliente` / `13 clientes` (también `0 clientes`). */
export function cantidadDe(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** `2026-10` → «Octubre de 2026» (para el comienzo de una frase o de una celda). */
export function nombreDelMesCapitalizado(mes: string): string {
  const nombre = nombreDelMes(mes);
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;
}

/** Los tramos en minúscula, para armar frases («con 1 a 30 días de atraso»). Siguen a `ROTULO_DE_TRAMO`: si cambia la escritura de los rótulos, cambian las frases. */
function tramoEnMinuscula(tramo: Tramo): string {
  return ROTULO_DE_TRAMO[tramo].toLowerCase();
}

/** Servicio de cada comprobante, tal como lo lee quien factura. */
export const ROTULO_DE_SERVICIO: Readonly<Record<Servicio, string>> = {
  "alquiler-4x4": "Alquiler mensual de camioneta 4x4 con chofer",
  "traslado-personal": "Traslado de personal",
  "flete-liviano": "Flete liviano",
  "horas-espera": "Horas de espera",
  "km-excedentes": "Kilómetros excedentes",
};

/** Medio de cobro de un recibo. */
export const ROTULO_DE_MEDIO: Readonly<Record<Medio, string>> = {
  transferencia: "Transferencia",
  cheque: "Cheque",
  "retencion-iibb": "Retención IIBB",
  "retencion-ganancias": "Retención Ganancias",
  "retencion-iva": "Retención IVA",
};

/** Tipo de comprobante (códigos de ARCA 1, 2 y 3). */
export const ROTULO_DE_TIPO: Readonly<Record<TipoCmp, string>> = {
  1: "Factura A",
  2: "Nota de débito A",
  3: "Nota de crédito A",
};

/** Sigla del talón del comprobante: es solo decoración (la interfaz la oculta a los lectores de pantalla, que oyen el rótulo largo). */
export const SIGLA_DE_TIPO: Readonly<Record<TipoCmp, string>> = { 1: "FA", 2: "ND", 3: "NC" };

/** Detalle de una partida de facturación: «Factura A · Flete liviano». */
export function notaDeComprobanteDelMes(tipo: TipoCmp, servicio: Servicio): string {
  return `${ROTULO_DE_TIPO[tipo]} · ${ROTULO_DE_SERVICIO[servicio]}`;
}

/** Detalle de una partida de cobranza: los medios del recibo, separados por comas y sin repetir. */
export function notaDeCobranza(medios: readonly Medio[]): string {
  return [...new Set(medios)].map((m) => ROTULO_DE_MEDIO[m]).join(", ");
}

/** Detalle de la partida de un cobro sin imputar dentro del saldo neto (resta). */
export const NOTA_DE_COBRADO_SIN_IMPUTAR = "Cobrado sin imputar (resta)";

/**
 * Título completo de un desglose (el `h1`). Sin `mes` rige el mes del corte (S7); en las medidas que no son del mes el `mes` no se usa.
 * «Facturación» lleva «(sin IVA)» y «Facturado» lleva «con IVA»: es el vocabulario único de la interfaz (neto frente a total).
 */
export function tituloDeDesglose(clave: ClaveDeMedida, corte: FechaCivil, mes?: string): string {
  const al = `al ${formatearFecha(corte)}`;
  const delMes = esClaveDelMes(clave) ? nombreDelMes(mes ?? corte.slice(0, 7)) : "";
  switch (clave) {
    case "facturacion-mes":
      return `Facturación de ${delMes} (sin IVA)`;
    case "facturado-con-iva-mes":
      return `Facturado con IVA de ${delMes}`;
    case "iva-mes":
      return `IVA facturado de ${delMes}`;
    case "cobranza-mes":
      return `Cobranza de ${delMes}`;
    case "retenciones-mes":
      return `Retenciones incluidas en la cobranza de ${delMes}`;
    case "saldo":
      return `Saldo a cobrar ${al}`;
    case "mora":
      return `En mora ${al}`;
    case "tramo-no-vencido":
      return `Saldo no vencido ${al}`;
    case "tramo-1-30":
      return `Saldo con ${tramoEnMinuscula("1-30")} de atraso ${al}`;
    case "tramo-31-60":
      return `Saldo con ${tramoEnMinuscula("31-60")} de atraso ${al}`;
    case "tramo-61-90":
      return `Saldo con ${tramoEnMinuscula("61-90")} de atraso ${al}`;
    case "tramo-mas-90":
      return `Saldo con ${tramoEnMinuscula("mas-90")} de atraso ${al}`;
    case "pagos-a-cuenta":
      return `Pagos a cuenta sin imputar ${al}`;
    case "saldos-a-favor":
      return `Saldos a favor ${al}`;
    case "saldo-neto":
      return `Saldo neto ${al}`;
    case "mora-otros":
      return `En mora: otros clientes ${al}`;
  }
}

/** Título corto de un desglose, sin la fecha: migas, rótulo de «Atrás» y pestaña. En las del mes lleva el mes (sin él, dos meses se confundirían). */
export function tituloCortoDeDesglose(clave: ClaveDeMedida, corte: FechaCivil, mes?: string): string {
  const delMes = esClaveDelMes(clave) ? nombreDelMes(mes ?? corte.slice(0, 7)) : "";
  switch (clave) {
    case "facturacion-mes":
      return `Facturación de ${delMes}`;
    case "facturado-con-iva-mes":
      return `Facturado con IVA de ${delMes}`;
    case "iva-mes":
      return `IVA facturado de ${delMes}`;
    case "cobranza-mes":
      return `Cobranza de ${delMes}`;
    case "retenciones-mes":
      return `Retenciones de ${delMes}`;
    case "saldo":
      return "Saldo a cobrar";
    case "mora":
      return "En mora";
    case "tramo-no-vencido":
      return "Saldo no vencido";
    case "tramo-1-30":
      return `Saldo con ${tramoEnMinuscula("1-30")} de atraso`;
    case "tramo-31-60":
      return `Saldo con ${tramoEnMinuscula("31-60")} de atraso`;
    case "tramo-61-90":
      return `Saldo con ${tramoEnMinuscula("61-90")} de atraso`;
    case "tramo-mas-90":
      return `Saldo con ${tramoEnMinuscula("mas-90")} de atraso`;
    case "pagos-a-cuenta":
      return "Pagos a cuenta sin imputar";
    case "saldos-a-favor":
      return "Saldos a favor";
    case "saldo-neto":
      return "Saldo neto";
    case "mora-otros":
      return "En mora: otros clientes";
  }
}

/** Qué son las partidas de una medida (para «Solo los … de {cliente}»). El saldo neto mezcla comprobantes con saldo y cobros sin imputar. */
export function tipoDePartidas(clave: ClaveDeMedida): "comprobantes" | "recibos" | "comprobantes y recibos" {
  switch (clave) {
    case "cobranza-mes":
    case "retenciones-mes":
    case "pagos-a-cuenta":
    case "saldos-a-favor":
      return "recibos";
    case "saldo-neto":
      return "comprobantes y recibos";
    default:
      return "comprobantes";
  }
}

/** Criterios para ordenar las partidas de un desglose: el texto de la opción y el nombre que se anuncia al elegirla. */
export type CriterioDeOrden = "atraso" | "importe" | "fecha" | "referencia";
export const CRITERIOS_DE_ORDEN: Readonly<Record<CriterioDeOrden, { opcion: string; nombre: string }>> = {
  atraso: { opcion: "Atraso (el mayor primero)", nombre: "atraso" },
  importe: { opcion: "Importe (de mayor a menor)", nombre: "importe" },
  fecha: { opcion: "Fecha (la más antigua primero)", nombre: "fecha" },
  referencia: { opcion: "Referencia", nombre: "referencia" },
};

/** Anuncio al elegir un orden: «Ordenado por importe.» */
export function ordenadoPor(criterio: CriterioDeOrden): string {
  return `Ordenado por ${CRITERIOS_DE_ORDEN[criterio].nombre}.`;
}

/** Filtros de la lista de comprobantes con saldo: todos, los vencidos (en mora) o un tramo. */
export type FiltroDeComprobantes = "todos" | "vencidos" | Tramo;

/** El complemento del filtro, concordado en número: «en mora», «no vencido» / «no vencidos», «con 31 a 60 días de atraso». Vacío en «todos». */
function calificativoDeComprobantes(filtro: FiltroDeComprobantes, cantidad: number): string {
  if (filtro === "todos") return "";
  if (filtro === "vencidos") return " en mora";
  if (filtro === "no-vencido") return cantidad === 1 ? " no vencido" : " no vencidos";
  return ` con ${tramoEnMinuscula(filtro)} de atraso`;
}

/**
 * Estado de la lista de comprobantes (región `role="status"` del panel). Sin búsqueda: «13 comprobantes en mora.»; con búsqueda: «Se muestran
 * 1 de 13 comprobantes en mora.». `enElFiltro` es cuántos hay con el filtro y sin la búsqueda.
 */
export function estadoDeListaDeComprobantes(mostrados: number, enElFiltro: number, filtro: FiltroDeComprobantes, hayBusqueda: boolean): string {
  if (!hayBusqueda) return `${cantidadDe(mostrados, "comprobante", "comprobantes")}${calificativoDeComprobantes(filtro, mostrados)}.`;
  return `Se muestran ${mostrados} de ${cantidadDe(enElFiltro, "comprobante", "comprobantes")}${calificativoDeComprobantes(filtro, enElFiltro)}.`;
}

/** Texto del estado vacío de comprobantes: la búsqueda no encontró nada, o el filtro no tiene ninguno al corte. */
export function vacioDeComprobantes(enElFiltro: number, filtro: FiltroDeComprobantes, corte: FechaCivil): string {
  if (enElFiltro > 0) return "Ningún comprobante coincide con la búsqueda.";
  return `No hay comprobantes${calificativoDeComprobantes(filtro, 0)} al ${formatearFecha(corte)}.`;
}

/** Filtros de la lista de clientes. */
export type FiltroDeClientes = "todos" | "con-mora" | "revisar";

function calificativoDeClientes(filtro: FiltroDeClientes): string {
  if (filtro === "con-mora") return " con mora";
  if (filtro === "revisar") return " para revisar";
  return "";
}

/** Estado de la lista de clientes: «13 clientes.», «6 clientes con mora.», «Se muestran 1 de 13 clientes.». */
export function estadoDeListaDeClientes(mostrados: number, enElFiltro: number, filtro: FiltroDeClientes, hayBusqueda: boolean): string {
  if (!hayBusqueda) return `${cantidadDe(mostrados, "cliente", "clientes")}${calificativoDeClientes(filtro)}.`;
  return `Se muestran ${mostrados} de ${cantidadDe(enElFiltro, "cliente", "clientes")}${calificativoDeClientes(filtro)}.`;
}

/** Texto del estado vacío de clientes: la búsqueda no encontró nada, o el filtro no tiene ninguno al corte. */
export function vacioDeClientes(enElFiltro: number, filtro: FiltroDeClientes, corte: FechaCivil): string {
  if (enElFiltro > 0) return "Ningún cliente coincide con la búsqueda.";
  return `No hay clientes${calificativoDeClientes(filtro)} al ${formatearFecha(corte)}.`;
}

/** Anuncio al cambiar el corte en pantallas sin una cifra propia. */
export function anuncioDeCorte(corte: FechaCivil): string {
  return `Datos al ${formatearFecha(corte)}.`;
}

/** Anuncio al cambiar el corte en el resumen y en las listas: se dice la mora, que es la cifra que más importa. */
export function anuncioDeCorteConMora(corte: FechaCivil, mora: Centavos): string {
  return `${anuncioDeCorte(corte)} En mora: ${formatearImporte(mora)}.`;
}

/** Anuncio al cambiar el corte en la ficha de un cliente. */
export function anuncioDeCorteDeCliente(corte: FechaCivil, saldo: Centavos): string {
  return `${anuncioDeCorte(corte)} Saldo del cliente: ${formatearImporte(saldo)}.`;
}

/** Anuncio al cambiar el corte en un desglose. */
export function anuncioDeCorteDeDesglose(corte: FechaCivil, total: Centavos): string {
  return `${anuncioDeCorte(corte)} Total: ${formatearImporte(total)}.`;
}

/** Anuncio al cambiar el corte en un comprobante: con saldo dice los días de atraso y el tramo; cancelado, solo el saldo en cero. */
export function anuncioDeCorteDeComprobante(corte: FechaCivil, saldo: Centavos, atraso: number): string {
  const base = `${anuncioDeCorte(corte)} Saldo del comprobante: ${formatearImporte(saldo)}.`;
  if (saldo <= 0) return base;
  const tramo = tramoDe(atraso);
  return atraso >= 1 ? `${base} ${cantidadDe(atraso, "día", "días")} de atraso, tramo ${ROTULO_DE_TRAMO[tramo]}.` : `${base} ${ROTULO_DE_TRAMO[tramo]}.`;
}

/** Texto para lectores de pantalla cuando un porcentaje no se puede calcular (se ve «—»). */
export const SIN_PORCENTAJE = "Sin porcentaje";

/** Un tramo con su importe y su porcentaje, para la etiqueta de la regla. */
export interface TramoConImporte {
  tramo: Tramo;
  importe: Centavos;
  milesimas: Milesimas | null;
}

/**
 * Etiqueta accesible de la barra de la regla de tramos (`role="img"`): dice lo mismo que la lista de al lado, para quien no ve los colores.
 * `cliente` (razón social) la acota a un cliente.
 */
export function etiquetaDeLaRegla(corte: FechaCivil, tramos: readonly TramoConImporte[], cliente?: string): string {
  const de = cliente === undefined ? "" : ` de ${cliente}`;
  const partes = tramos.map((t) => `${tramoEnMinuscula(t.tramo)} ${formatearImporte(t.importe)} (${t.milesimas === null ? SIN_PORCENTAJE.toLowerCase() : formatearPorcentaje(t.milesimas)})`);
  return `Saldo a cobrar según días de atraso${de} al ${formatearFecha(corte)}: ${partes.join("; ")}.`;
}

/** Datos para describir el gráfico de los últimos meses con una frase. */
export interface ResumenDelGrafico {
  desde: string;
  hasta: string;
  cantidadDeMeses: number;
  /** El último mes del gráfico (el del corte). */
  ultimoFacturado: Centavos;
  mesDeMayorFacturado: string;
  mayorFacturado: Centavos;
}

/** Etiqueta accesible del gráfico de la empresa (facturado con IVA frente a cobrado). Los valores completos están en la tabla. */
export function etiquetaDelGrafico(r: ResumenDelGrafico & { ultimoCobrado: Centavos }): string {
  return (
    `Facturado y cobrado por mes, de ${nombreDelMes(r.desde)} a ${nombreDelMes(r.hasta)}, con IVA. ` +
    `${nombreDelMesCapitalizado(r.hasta)}: facturado ${formatearImporte(r.ultimoFacturado)}, cobrado ${formatearImporte(r.ultimoCobrado)}. ` +
    `Mayor facturado: ${nombreDelMes(r.mesDeMayorFacturado)}, ${formatearImporte(r.mayorFacturado)}. ` +
    `Los ${r.cantidadDeMeses} valores están en la tabla.`
  );
}

/** Etiqueta accesible del gráfico de un cliente (facturación sin IVA). */
export function etiquetaDelGraficoDeCliente(r: ResumenDelGrafico): string {
  return (
    `Facturación sin IVA por mes, de ${nombreDelMes(r.desde)} a ${nombreDelMes(r.hasta)}. ` +
    `Mayor facturación: ${nombreDelMes(r.mesDeMayorFacturado)}, ${formatearImporte(r.mayorFacturado)}. ` +
    `Los ${r.cantidadDeMeses} valores están en la tabla.`
  );
}

/** Cómo está el comprobante al corte, para armar la frase de «Situación». */
export type SituacionDelComprobante =
  | { estado: "cancelado"; fecha: FechaCivil; anulado: boolean }
  | { estado: "con-saldo"; atraso: number; vencimiento: FechaCivil; huboCobros: boolean };

/** Etiqueta de un comprobante sin saldo: «Cancelada» o «Anulada por nota de crédito». */
export function etiquetaDeCancelado(anulado: boolean): string {
  return anulado ? "Anulada por nota de crédito" : "Cancelada";
}

/** La frase de «Situación al {corte}» de un comprobante. `fecha` es la del último movimiento que dejó el saldo en cero. */
export function fraseDeSituacion(s: SituacionDelComprobante): string {
  if (s.estado === "cancelado") {
    const f = formatearFecha(s.fecha);
    return s.anulado ? `Anulada por la nota de crédito del ${f}.` : `Cancelada el ${f}.`;
  }
  const vence = formatearFecha(s.vencimiento);
  if (s.atraso >= 1) {
    const base = `Venció el ${vence}.`;
    return s.huboCobros ? `${base} El atraso se cuenta desde el vencimiento original, no desde el último pago.` : base;
  }
  if (s.atraso === 0) return `Vence el ${vence}, el mismo día del corte: todavía no está vencida.`;
  return `Vence el ${vence}.`;
}

/** Texto de la marca del ubicador: «12 días», «vence el día del corte», «faltan 9 días». */
export function rotuloDelUbicador(atraso: number): string {
  if (atraso >= 1) return cantidadDe(atraso, "día", "días");
  if (atraso === 0) return "vence el día del corte";
  return atraso === -1 ? "falta 1 día" : `faltan ${0 - atraso} días`;
}

/** Nombre de la demo en el título de la pestaña del navegador. */
export const NOMBRE_DE_LA_DEMO = "Tablero de cobranzas (demo)";

/** Título del documento: «Clientes · Tablero de cobranzas (demo)». */
export function tituloDelDocumento(pantalla: string): string {
  return `${pantalla} · ${NOMBRE_DE_LA_DEMO}`;
}

/** Título del documento de un desglose: «Desglose: En mora al 31/10/2026 · Tablero de cobranzas (demo)». */
export function tituloDelDocumentoDeDesglose(titulo: string): string {
  return tituloDelDocumento(`Desglose: ${titulo}`);
}
