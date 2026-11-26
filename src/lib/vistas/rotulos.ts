// Rótulos de la interfaz que dependen de los datos: las migas, el nombre de cada pantalla,
// el rótulo de «Atrás», el título del documento, el anuncio al cambiar el corte, las etiquetas accesibles de la regla de tramos y del gráfico de meses, y los
// estados de las listas. Son funciones puras de `(ruta o modelo de vista, datos, corte)`: no leen el estado ni el DOM. Los textos fijos salen de
// `textos-marco.ts` y de `dominio/textos.ts`; acá solo se arman con los números que ya calcularon los modelos de vista y el dominio.
//
// **Nada de lo que escribió quien miró la dirección se repite acá:** una ruta que no existe (`inexistente`, `desconocida`) se llama «Error», sin su id, y
// el texto de la búsqueda (`q`) no entra en ningún rótulo.

import { TEXTO_COMPROBANTES, TEXTO_MARCO, TEXTO_RESUMEN } from "../../componentes/textos-marco.ts";
import { medidaControlada } from "../dominio/medidas.ts";
import type { Datos, FechaCivil, FiltroDeMedida, TipoCmp } from "../dominio/tipos.ts";
import {
  ROTULO_DE_TIPO,
  anuncioDeCorte,
  anuncioDeCorteConMora,
  anuncioDeCorteDeCliente,
  anuncioDeCorteDeComprobante,
  anuncioDeCorteDeDesglose,
  estadoDeListaDeClientes,
  estadoDeListaDeComprobantes,
  etiquetaDeLaRegla,
  etiquetaDelGrafico,
  etiquetaDelGraficoDeCliente,
  tituloCortoDeDesglose,
  tituloDeDesglose,
  tituloDelDocumento,
  tituloDelDocumentoDeDesglose,
  vacioDeClientes,
  vacioDeComprobantes,
} from "../dominio/textos.ts";
import type { Ruta, RutaNavegable } from "../estado/enrutador.ts";
import type { Miga, PasoDeMigas, Seccion } from "../estado/navegacion.ts";
import type { VistaClientes } from "./clientes.ts";
import { comprobantePorId, vistaComprobante } from "./comprobante.ts";
import { vistaComprobantes } from "./comprobantes.ts";
import type { VistaComprobantes } from "./comprobantes.ts";
import type { FacturacionDelCliente, VistaMeses } from "./meses.ts";
import type { ReglaDeTramos } from "./tipos.ts";

/** Lo que dice la miga de una vista de error y el título del documento: nunca el id ni la dirección que se escribió. */
export const ROTULO_DE_ERROR = TEXTO_MARCO.error;

const SEPARADOR_DE_CLIENTE = " · ";

/** El rótulo de cada sección (pestaña): el del lateral, el de las pestañas de abajo, el de la miga y el de «Atrás». */
export const ROTULO_DE_SECCION: Readonly<Record<Seccion, string>> = {
  resumen: TEXTO_MARCO.seccionResumen,
  comprobantes: TEXTO_MARCO.seccionComprobantes,
  clientes: TEXTO_MARCO.seccionClientes,
  meses: TEXTO_MARCO.seccionMeses,
};

// ---------------------------------------------------------------------------------------------------------------------------
// Nombres
// ---------------------------------------------------------------------------------------------------------------------------

const FORMA_DE_ID_DE_COMPROBANTE = /^[123]-(\d{4}-\d{8})$/;

/** `1-0003-00000562` → `0003-00000562`: el punto de venta y el número, que es lo que se lee y se busca. Un id que no tiene esa forma vuelve igual. */
export function codigoDeComprobante(id: string): string {
  return FORMA_DE_ID_DE_COMPROBANTE.exec(id)?.[1] ?? id;
}

/** «Factura A 0003-00000562»: el tipo en palabras y el código. */
export function nombreDeComprobante(c: { id: string; tipo: TipoCmp }): string {
  return `${ROTULO_DE_TIPO[c.tipo]} ${codigoDeComprobante(c.id)}`;
}

/** La razón social de un cliente de los datos. Lanza si no está: el enrutador ya filtró los ids que no existen. */
export function razonSocialDe(datos: Pick<Datos, "clientes">, clienteId: string): string {
  const cliente = datos.clientes.find((c) => c.id === clienteId);
  if (cliente === undefined) throw new Error(`Error interno: el cliente ${clienteId} no está en los datos.`);
  return cliente.razonSocial;
}

function nombreDelComprobanteDe(datos: Datos, comprobanteId: string): string {
  const c = comprobantePorId(datos, comprobanteId);
  if (c === undefined) throw new Error(`Error interno: el comprobante ${comprobanteId} no está en los datos.`);
  return nombreDeComprobante(c);
}

/**
 * Cómo se llama una pantalla: el nombre de la pestaña, la razón social del cliente, el tipo y el código del comprobante, o el título corto del desglose
 * (con « · » y el cliente si lo trae). Es el texto del botón «Atrás» y de la pestaña del navegador. `corte` solo hace falta para el mes de un desglose
 * de una medida del mes cuando la dirección no trae `mes=`. Lanza si el cliente o el comprobante no están en los datos: el enrutador ya los filtró.
 */
export function nombreDeRuta(ruta: RutaNavegable, datos: Datos, corte: FechaCivil): string {
  switch (ruta.tipo) {
    case "resumen":
    case "comprobantes":
    case "clientes":
    case "meses":
      return ROTULO_DE_SECCION[ruta.tipo];
    case "como-se-calcula":
      return TEXTO_MARCO.comoSeCalcula;
    case "cliente":
      return razonSocialDe(datos, ruta.clienteId);
    case "comprobante":
      return nombreDelComprobanteDe(datos, ruta.comprobanteId);
    case "desglose": {
      const corto = tituloCortoDeDesglose(ruta.clave, corte, ruta.mes);
      return ruta.clienteId === undefined ? corto : `${corto}${SEPARADOR_DE_CLIENTE}${razonSocialDe(datos, ruta.clienteId)}`;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Migas y «Atrás»
// ---------------------------------------------------------------------------------------------------------------------------

export interface MigaConRotulo {
  texto: string;
  /** A dónde lleva (un enlace); `null` en la actual, que no es un enlace. */
  destino: RutaNavegable | null;
  /** Es la última: la pantalla en la que se está (`aria-current="page"`). */
  actual: boolean;
}

function textoDeMiga(miga: Miga, datos: Datos, corte: FechaCivil): string {
  switch (miga.que) {
    case "seccion":
      return ROTULO_DE_SECCION[miga.seccion];
    case "como-se-calcula":
      return TEXTO_MARCO.comoSeCalcula;
    case "cliente":
      return razonSocialDe(datos, miga.clienteId);
    case "comprobante":
      return nombreDelComprobanteDe(datos, miga.comprobanteId);
    case "desglose":
      return tituloCortoDeDesglose(miga.clave, corte, miga.mes);
    case "error":
      return ROTULO_DE_ERROR;
  }
}

/** Le pone el texto a cada paso de `migasDe`. Solo la última miga es la actual. */
export function rotulosDeMigas(pasos: readonly PasoDeMigas[], datos: Datos, corte: FechaCivil): MigaConRotulo[] {
  return pasos.map((p, i) => ({ texto: textoDeMiga(p.miga, datos, corte), destino: p.destino, actual: i === pasos.length - 1 }));
}

export interface RotuloDeAtras {
  /** Lo que se ve en el botón: el nombre de la pantalla a la que lleva. */
  visible: string;
  /** El nombre accesible del botón: «Volver a …». */
  accesible: string;
}

/** El botón «Atrás» de la barra del celular: lleva a `destino` (`destinoDeAtras` del estado) y lo nombra. */
export function rotuloDeAtras(destino: RutaNavegable, datos: Datos, corte: FechaCivil): RotuloDeAtras {
  const nombre = nombreDeRuta(destino, datos, corte);
  return { visible: nombre, accesible: TEXTO_MARCO.volverA(nombre) };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Título del documento y anuncio del corte
// ---------------------------------------------------------------------------------------------------------------------------

/** El título de la pestaña del navegador: «Clientes · Tablero de cobranzas (demo)»; el Resumen dice «Cobranzas al …» y un desglose, «Desglose: …». */
export function tituloDelDocumentoDeRuta(ruta: Ruta, datos: Datos, corte: FechaCivil): string {
  switch (ruta.tipo) {
    case "resumen":
      return tituloDelDocumento(TEXTO_RESUMEN.titulo(corte));
    case "desglose": {
      const titulo = tituloDeDesglose(ruta.clave, corte, ruta.mes);
      return tituloDelDocumentoDeDesglose(ruta.clienteId === undefined ? titulo : `${titulo}${SEPARADOR_DE_CLIENTE}${razonSocialDe(datos, ruta.clienteId)}`);
    }
    case "inexistente":
    case "desconocida":
      return tituloDelDocumento(ROTULO_DE_ERROR);
    default:
      return tituloDelDocumento(nombreDeRuta(ruta, datos, corte));
  }
}

function filtroDeDesglose(ruta: Extract<RutaNavegable, { tipo: "desglose" }>): FiltroDeMedida {
  const filtro: FiltroDeMedida = {};
  if (ruta.clienteId !== undefined) filtro.clienteId = ruta.clienteId;
  if (ruta.mes !== undefined) filtro.mes = ruta.mes;
  return filtro;
}

/**
 * Lo que anuncia la región de estado cuando cambia el corte. El Resumen y las listas dicen la mora (la cifra que más importa); un cliente, su saldo; un
 * desglose, su total; un comprobante, su saldo, sus días de atraso y su tramo. Meses, «Cómo se calcula» y los errores no tienen una cifra propia que
 * decir: solo la fecha. Una nota de crédito y un comprobante emitido después del corte tampoco tienen saldo: solo la fecha.
 */
export function anuncioDeCorteDeRuta(ruta: Ruta, datos: Datos, corte: FechaCivil): string {
  switch (ruta.tipo) {
    case "resumen":
    case "comprobantes":
    case "clientes":
      return anuncioDeCorteConMora(corte, medidaControlada(datos, corte, "mora").valor);
    case "cliente":
      return anuncioDeCorteDeCliente(corte, medidaControlada(datos, corte, "saldo", { clienteId: ruta.clienteId }).valor);
    case "desglose":
      return anuncioDeCorteDeDesglose(corte, medidaControlada(datos, corte, ruta.clave, filtroDeDesglose(ruta)).valor);
    case "comprobante": {
      const v = vistaComprobante(datos, corte, ruta.comprobanteId);
      if (v.clase !== "comprobante") return anuncioDeCorte(corte);
      return v.situacion.estado === "con-saldo" ? anuncioDeCorteDeComprobante(corte, v.situacion.saldo, v.situacion.atraso) : anuncioDeCorteDeComprobante(corte, v.situacion.saldo, 0);
    }
    case "meses":
    case "como-se-calcula":
    case "inexistente":
    case "desconocida":
      return anuncioDeCorte(corte);
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Etiquetas accesibles de la regla y del gráfico
// ---------------------------------------------------------------------------------------------------------------------------

/** El `aria-label` de la barra de la regla de tramos: lo mismo que dice la lista de al lado. La de un cliente (`regla.clienteId`) lo nombra. */
export function etiquetaDeReglaDeTramos(regla: ReglaDeTramos, corte: FechaCivil, datos: Pick<Datos, "clientes">): string {
  const tramos = regla.filas.map((f) => ({ tramo: f.tramo, importe: f.cifra.importe, milesimas: f.milesimas }));
  return etiquetaDeLaRegla(corte, tramos, regla.clienteId === undefined ? undefined : razonSocialDe(datos, regla.clienteId));
}

/** El `aria-label` del gráfico de la empresa (facturado con IVA frente a cobrado). Lanza si no hay meses: los datos siempre tienen el del corte. */
export function etiquetaDelGraficoDeMeses(v: VistaMeses): string {
  const primero = v.meses[0];
  const ultimo = v.meses.at(-1);
  const mayor = v.mayor === null ? undefined : v.meses[v.mayor];
  if (primero === undefined || ultimo === undefined || mayor === undefined) throw new Error("Error interno: el gráfico de meses no tiene ningún mes.");
  return etiquetaDelGrafico({
    desde: primero.mes,
    hasta: ultimo.mes,
    cantidadDeMeses: v.meses.length,
    ultimoFacturado: ultimo.facturadoConIva.importe,
    ultimoCobrado: ultimo.cobranza.importe,
    mesDeMayorFacturado: mayor.mes,
    mayorFacturado: mayor.facturadoConIva.importe,
  });
}

/** El `aria-label` del gráfico de un cliente (facturación sin IVA). */
export function etiquetaDelGraficoDelCliente(f: FacturacionDelCliente): string {
  const primero = f.meses[0];
  const ultimo = f.meses.at(-1);
  const mayor = f.mayor === null ? undefined : f.meses[f.mayor];
  if (primero === undefined || ultimo === undefined || mayor === undefined) throw new Error("Error interno: el gráfico del cliente no tiene ningún mes.");
  return etiquetaDelGraficoDeCliente({
    desde: primero.mes,
    hasta: ultimo.mes,
    cantidadDeMeses: f.meses.length,
    ultimoFacturado: ultimo.facturacion.importe,
    mesDeMayorFacturado: mayor.mes,
    mayorFacturado: mayor.facturacion.importe,
  });
}

// ---------------------------------------------------------------------------------------------------------------------------
// Estados de las listas
// ---------------------------------------------------------------------------------------------------------------------------

/** El texto de la región `role="status"` de Comprobantes: «16 comprobantes en mora.» o, con búsqueda, «Se muestran 3 de 16 comprobantes en mora.». */
export function estadoDeLaListaDeComprobantes(v: VistaComprobantes): string {
  return estadoDeListaDeComprobantes(v.filas.length, v.cantidadDelFiltro, v.filtro, v.conBusqueda);
}

/** El texto de la región `role="status"` de Clientes: «13 clientes.», «6 clientes con mora.» o, con búsqueda, «Se muestran 1 de 13 clientes.». */
export function estadoDeLaListaDeClientes(v: VistaClientes): string {
  return estadoDeListaDeClientes(v.filas.length, v.cantidadDelFiltro, v.filtro, v.conBusqueda);
}

/** El texto del estado vacío de Comprobantes: la búsqueda no encontró nada, o el filtro no tiene ninguno a esa fecha. Úselo solo si `v.filas` está vacía. */
export function vacioDeLaListaDeComprobantes(v: VistaComprobantes): string {
  return vacioDeComprobantes(v.cantidadDelFiltro, v.filtro, v.corte);
}

/** El texto del estado vacío de Clientes. Úselo solo si `v.filas` está vacía. */
export function vacioDeLaListaDeClientes(v: VistaClientes): string {
  return vacioDeClientes(v.cantidadDelFiltro, v.filtro, v.corte);
}

/**
 * La segunda línea del vacío de Comprobantes, con el código de un comprobante que existe (el primero de la lista completa: el más atrasado). `null` si
 * no hay ningún comprobante con saldo a esa fecha: no se inventa un ejemplo.
 */
export function sugerenciaDeBusquedaDeComprobantes(datos: Datos, corte: FechaCivil): string | null {
  const primera = vistaComprobantes(datos, corte, { tramo: "todos", q: "" }).filas[0];
  return primera === undefined ? null : TEXTO_COMPROBANTES.sugerenciaDeBusqueda(codigoDeComprobante(primera.comprobanteId));
}
