// Textos fijos de la interfaz.
// Español neutro: al lector se le habla de usted o en forma impersonal; sin voseo ni regionalismos. Todo dato es ficticio y la demo lo dice.
//
// Reglas de este archivo:
//  - Un texto que lleva un número, una fecha o un nombre es una función que lo recibe ya calculado: aquí no se calcula nada ni se escribe una cifra.
//  - Los textos que dependen del dominio (títulos de desglose, estados de lista, anuncios, etiquetas de la regla y del gráfico) están en
//    `src/lib/dominio/textos.ts`; la explicación de «Cómo se calcula», en `textos-como-se-calcula.ts`.
//  - Donde una frase termina con un enlace o una cifra que arma la pantalla (por ejemplo la bajada de Comprobantes), el texto va partido
//    en `...Inicio` y `...Fin`; la pantalla que lo arma no agrega palabras.
//  - Las funciones que reciben una fecha esperan una `FechaCivil` (AAAA-MM-DD) y la escriben dd/mm/aaaa.

import { formatearFecha } from "../lib/dominio/fechas.ts";
import { SIN_PORCENTAJE, cantidadDe, nombreDelMes, nombreDelMesCapitalizado } from "../lib/dominio/textos.ts";
import type { FechaCivil } from "../lib/dominio/tipos.ts";

/** Marco: barra, lateral, pestañas, selector de corte, avisos y «Atrás». */
export const TEXTO_MARCO = {
  cerrarAviso: "Cerrar aviso",
  /** Con dos avisos a la vez, cada botón de cierre dice cuál cierra. */
  cerrarAvisoDeCorte: "Cerrar el aviso de la fecha de corte",
  cerrarAvisoDelMes: "Cerrar el aviso del mes",
  cerrarAvisoDeOtros: "Cerrar el aviso de «Otros»",
  /** Lo que dicen la miga y el título del documento en una pantalla de error; el motivo está en el título de la pantalla. */
  error: "Error",
  /** Texto de una pantalla que todavía no tiene contenido. */
  pantallaEnPreparacion: "Esta pantalla está en preparación.",
  nombre: "Tablero de cobranzas",
  etiquetaDemo: "Demo con datos ficticios",
  /** Bajo la marca del lateral: la empresa viene de los datos (nunca escrita aquí). */
  empresa: (nombre: string) => `${nombre} (ficticia)`,
  marcaCorta: "Cobranzas",
  marcaDemoCorta: "Demo",
  /** Nombre accesible de la marca en la barra del celular (la sigla «Demo» visible se oculta a los lectores de pantalla). */
  marcaCortaAccesible: "Cobranzas (demo con datos ficticios)",
  saltarAlContenido: "Ir al contenido",
  navegacionDeSecciones: "Secciones",
  migas: "Ruta",
  seccionResumen: "Resumen",
  seccionComprobantes: "Comprobantes",
  seccionClientes: "Clientes",
  seccionMeses: "Meses",
  comoSeCalcula: "Cómo se calcula",
  /** Texto para lectores de pantalla junto a la insignia de «Clientes»: «Clientes, 3 para revisar». */
  clientesParaRevisar: (n: number) => `${n} para revisar`,
  fechaDeCorte: "Fecha de corte",
  cierreAnterior: (corte: FechaCivil) => `Cierre anterior: ${formatearFecha(corte)}`,
  cierreSiguiente: (corte: FechaCivil) => `Cierre siguiente: ${formatearFecha(corte)}`,
  sinCierreAnterior: "No hay cierre anterior",
  sinCierrePosterior: "No hay cierre posterior",
  volverAlCorte: (corte: FechaCivil) => `Volver al ${formatearFecha(corte)}`,
  /** Nombre del botón «Atrás» con el de la pantalla a la que lleva. */
  volverA: (nombre: string) => `Volver a ${nombre}`,
  preparando: "Preparando los datos de ejemplo…",
  /** Para lectores de pantalla, junto a la fila a la que se vuelve: «Algarrobos Demo S.A. (última fila abierta)». */
  ultimaFilaAbierta: "última fila abierta",
} as const;

/** Pie de todas las pantallas. La demo dice qué es, de dónde salen los datos y quién hizo qué. */
export const TEXTO_PIE = {
  /** «Datos ficticios de ejemplo, de enero de 2025 a octubre de 2026.» (los meses salen del conjunto de datos). */
  fuenteDeDatos: (desde: string, hasta: string) => `Datos ficticios de ejemplo, de ${nombreDelMes(desde)} a ${nombreDelMes(hasta)}.`,
  /** Qué es la demo, sin decir que reproduce el sistema de nadie. La empresa viene de los datos. */
  queEs: (empresa: string) =>
    `Los datos se generan en este navegador y son todos inventados: la empresa (${empresa}), los clientes, los CUIT y los importes. La demo no usa servidor ni guarda datos.`,
  otraDemoIntro: "Otra demo con la misma empresa ficticia:",
  otraDemoEnlace: "Control de flota",
  volverAlPortafolio: "Volver al portafolio",
  /** Solo se muestra cuando el repositorio es público. */
  codigoFuente: "Ver el código fuente",
  /** Autoría en una línea: concebida, diseñada y dirigida por Matías; desarrollada con IA. El detalle está en el README. */
  autoria: "Concebido, diseñado y dirigido por Matías Ariel Ormeño; desarrollado con IA.",
} as const;

/** Rótulos de columnas y filas de total que se repiten en varias tablas. */
export const TEXTO_TABLA = {
  cliente: "Cliente",
  comprobante: "Comprobante",
  recibo: "Recibo",
  fecha: "Fecha",
  mes: "Mes",
  emision: "Emisión",
  vencimiento: "Vencimiento",
  saldo: "Saldo",
  enMora: "En mora",
  atraso: "Atraso",
  tramo: "Tramo",
  tramoMasAntiguo: "Tramo más antiguo",
  /** Encabezado de la barra de tramos de la tabla Clientes: la columna no tiene números, es la regla en chico. */
  antiguedad: "Saldo según atraso",
  total: "Total",
  importe: "Importe",
  estado: "Estado",
  /** Cabeceras de la cuenta corriente y de los movimientos. */
  movimiento: "Movimiento",
  debe: "Debe",
  haber: "Haber",
  /** Total de una tabla: «Total (13 clientes)». */
  totalDeClientes: (n: number) => `Total (${cantidadDe(n, "cliente", "clientes")})`,
  totalDeComprobantes: (n: number) => `Total (${cantidadDe(n, "comprobante", "comprobantes")})`,
  totalDeRecibos: (n: number) => `Total (${cantidadDe(n, "recibo", "recibos")})`,
  /** «12 días»: celda de atraso y texto junto al tramo. */
  dias: (n: number) => cantidadDe(n, "día", "días"),
  sinAtraso: "—",
  /** Porcentaje que no se puede calcular (el total es 0): la raya se ve, y los lectores de pantalla oyen el texto. */
  sinPorcentaje: "—",
  sinPorcentajeDicho: SIN_PORCENTAJE,
  /** Botón de los estados vacíos de una búsqueda. */
  borrarBusqueda: "Borrar la búsqueda",
  /** Leyenda de las siglas del talón (FA, ND, NC) para las pantallas con una tabla de comprobantes; en cada sigla, el nombre completo va también como «title». */
  leyendaDeSiglas: "FA: factura A. ND: nota de débito A. NC: nota de crédito A.",
} as const;

/** Etiquetas de estado de las filas («Revisar imputación», «Saldo a favor», «Después de la fecha de corte»). */
export const TEXTO_ETIQUETAS = {
  revisarImputacion: "Revisar imputación",
  saldoAFavor: "Saldo a favor",
  despuesDelCorte: "Después de la fecha de corte",
  /** Aclaración junto a las filas posteriores al corte. */
  noCuentanParaElSaldo: (corte: FechaCivil) => `(no cuentan para el saldo al ${formatearFecha(corte)})`,
  sinSaldo: "Sin saldo",
  /** En la ficha del cliente, bajo «En mora $ 0,00». */
  sinSaldoACobrar: "Sin saldo a cobrar",
} as const;

/** Recibo desplegable (en la ficha del cliente, en el comprobante y en los desgloses). */
export const TEXTO_RECIBO = {
  nombre: "Recibo",
  totalDelRecibo: (total: string, fecha: FechaCivil) => `${total} en total, del ${formatearFecha(fecha)}`,
  medios: "Medios",
  imputadoA: "Imputado a",
  aCuenta: "A cuenta",
  ningunComprobante: "Ningún comprobante",
} as const;

/** Gráfico de meses (Resumen, Meses y ficha del cliente). */
export const TEXTO_GRAFICO = {
  leyendaDeLaEmpresa: "En millones de pesos, con IVA.",
  leyendaDelCliente: "Sin IVA, en millones de pesos.",
  serieFacturado: "Facturado",
  serieCobrado: "Cobrado",
  serieFacturacionSinIva: "Facturación sin IVA",
  /** «Octubre de 2026: facturado $ 1.900.415,59 · cobrado $ 2.384.759,05» (los importes llegan escritos). */
  renglonDelMes: (mes: string, facturado: string, cobrado: string) => `${nombreDelMesCapitalizado(mes)}: facturado ${facturado} · cobrado ${cobrado}`,
  hayDatosDesde: (mes: string) => `Hay datos desde ${nombreDelMes(mes)}.`,
  verLosMesesComoTabla: (n: number) => (n === 1 ? "Ver el mes como tabla" : `Ver los ${n} meses como tabla`),
  ultimosMeses: (n: number) => (n === 1 ? "Último mes" : `Últimos ${n} meses`),
  sinFacturacion: (n: number) => (n === 1 ? "Sin facturación en el último mes." : `Sin facturación en los últimos ${n} meses.`),
} as const;

/** Resumen: posición al corte, movimiento del mes, deudores, para revisar y gráfico. */
export const TEXTO_RESUMEN = {
  titulo: (corte: FechaCivil) => `Cobranzas al ${formatearFecha(corte)}`,
  /** Bajada del escritorio, para qué sirve el tablero; el celular antepone el nombre de la empresa. Que los datos son ficticios ya lo dicen la insignia y el pie. */
  bajada: "Quién debe, cuánto y desde cuándo, a la fecha de corte que se elija. Cada importe subrayado se abre hasta los comprobantes que lo forman.",
  posicion: (corte: FechaCivil) => `Posición al ${formatearFecha(corte)}`,
  enMora: "En mora",
  /** Para lectores de pantalla, antes de la cifra grande de la mora: «al 31/10/2026: ». */
  enMoraAl: (corte: FechaCivil) => `al ${formatearFecha(corte)}`,
  /** `porcentaje` llega escrito (formatearPorcentaje): «22,1 %». */
  fraseDeLaMora: (porcentaje: string, clientes: number) => `${porcentaje} de lo que hay por cobrar, en ${cantidadDe(clientes, "cliente", "clientes")}.`,
  sinMora: (corte: FechaCivil) => `Ningún cliente tiene saldo vencido al ${formatearFecha(corte)}.`,
  verDeDondeSale: "Ver de dónde sale este número",
  saldoACobrar: "Saldo a cobrar (con IVA)",
  saldoACobrarAl: (corte: FechaCivil) => `Saldo a cobrar al ${formatearFecha(corte)}`,
  movimientoDelMes: (mes: string) => `Movimiento de ${nombreDelMes(mes)}`,
  facturacionSinIva: "Facturación (sin IVA)",
  cobranza: "Cobranza",
  deLoCualRetenciones: "de lo cual, retenciones:",
  comprobantes: (n: number) => cantidadDe(n, "comprobante", "comprobantes"),
  recibos: (n: number) => cantidadDe(n, "recibo", "recibos"),
  deudores: "Deudores",
  deudoresEnMora: (n: number) => `${n} en mora`,
  porcentajeDeLaMora: "% de la mora",
  diasDelMasAntiguo: "Días del más antiguo",
  otros: (clientes: number) => `Otros (${cantidadDe(clientes, "cliente", "clientes")})`,
  totalEnMora: "Total en mora",
  verLosClientes: (n: number) => (n === 1 ? "Ver el cliente" : `Ver los ${n} clientes`),
  paraRevisar: "Para revisar",
  pagosACuentaSinImputar: "Pagos a cuenta sin imputar",
  saldosAFavor: "Saldos a favor",
  origen: "Origen",
  aCuenta: "A cuenta",
  sobrepagoEn: (recibo: string) => `Sobrepago en ${recibo}`,
  graficoTitulo: (meses: number) => (meses === 1 ? "Facturado y cobrado, último mes" : `Facturado y cobrado, últimos ${meses} meses`),
  abrirMeses: "Abrir Meses",
} as const;

/** Comprobantes con saldo: regla, filtros por tramo, búsqueda y tabla. */
export const TEXTO_COMPROBANTES = {
  titulo: (corte: FechaCivil) => `Comprobantes con saldo al ${formatearFecha(corte)}`,
  /** La bajada se completa con la cifra del saldo a cobrar (un enlace) y `bajadaFin`. */
  bajadaInicio: "Facturas y notas de débito con saldo pendiente al corte, de la más atrasada a la menos atrasada. Todas juntas suman el saldo a cobrar:",
  bajadaFin: ".",
  panel: "Por días de atraso",
  filtrarPorTramo: "Filtrar por tramo",
  filtroTodos: "Todos",
  filtroEnMora: "En mora",
  buscarPlaceholder: "Cliente o número",
  buscarEtiqueta: "Buscar por cliente o número de comprobante",
  /** `ejemplo` es el número de un comprobante que existe en los datos (para no inventar uno). */
  sugerenciaDeBusqueda: (ejemplo: string) => `Pruebe con otra parte del nombre del cliente o con el número del comprobante (por ejemplo, ${ejemplo}).`,
} as const;

/** Clientes: cartera con saldo y mora de cada uno. */
export const TEXTO_CLIENTES = {
  titulo: (corte: FechaCivil) => `Clientes al ${formatearFecha(corte)}`,
  bajada: "La columna Saldo muestra el saldo a cobrar de cada cliente, y la columna En mora, su mora. Lo cobrado sin imputar no se resta aquí: se ve en la ficha de cada cliente.",
  panel: "Cartera por cliente",
  orden: "del saldo mayor al menor",
  filtrarClientes: "Filtrar clientes",
  filtroTodos: "Todos",
  filtroConMora: "Con mora",
  filtroParaRevisar: "Para revisar",
  buscarPlaceholder: "Nombre o CUIT",
  buscarEtiqueta: "Buscar cliente por nombre o CUIT",
  sugerenciaDeBusqueda: "Pruebe con otra parte del nombre o con el CUIT sin guiones.",
  /** Bajo el nombre: «Plazo 30 días · CUIT 30-99000003-3 (ficticio)». El CUIT llega con guiones. */
  plazoYCuit: (plazo: number, cuit: string) => `Plazo ${cantidadDe(plazo, "día", "días")} · CUIT ${cuit} (ficticio)`,
} as const;

/** Meses: gráfico grande y tabla de los doce meses. */
export const TEXTO_MESES = {
  titulo: (desde: string, hasta: string) => `Facturado y cobrado, de ${nombreDelMes(desde)} a ${nombreDelMes(hasta)}`,
  bajada:
    "El gráfico compara lo facturado con IVA con lo cobrado, porque la cobranza incluye el IVA. La facturación sin IVA y las retenciones están en la tabla. Cada importe se abre en sus comprobantes o recibos.",
  panelDelGrafico: "Por mes",
  panelDeLaTabla: "Los mismos meses, en tabla",
  marcaDelCorte: "Resaltado: el mes del corte",
  facturacionSinIva: "Facturación sin IVA",
  facturadoConIva: "Facturado con IVA",
  cobrado: "Cobrado",
  deLoCualRetenciones: "De lo cual, retenciones",
  totalDeLosMeses: (n: number) => (n === 1 ? "Total del mes" : `Total de los ${n} meses`),
} as const;

/** Ficha del cliente: posición, facturación, solapas y cuenta corriente. */
export const TEXTO_CLIENTE = {
  /** `cuit` llega con guiones. */
  bajada: (cuit: string, plazo: number, corte: FechaCivil) => `CUIT ${cuit} (ficticio) · Plazo de pago: ${cantidadDe(plazo, "día", "días")} · al ${formatearFecha(corte)}`,
  posicion: (corte: FechaCivil) => `Posición del cliente al ${formatearFecha(corte)}`,
  saldoConIva: "Saldo (con IVA)",
  enMora: "En mora",
  porcentajeDelSaldo: (porcentaje: string) => `${porcentaje} del saldo`,
  pagosACuentaSinImputar: "Pagos a cuenta sin imputar",
  saldoAFavor: "Saldo a favor",
  saldoNeto: "Saldo neto",
  saldoNetoNota: "(con lo que termina la cuenta corriente)",
  antiguedad: "Saldo a cobrar según días de atraso",
  /** Lo que el lector de pantalla dice tras el rótulo de cada solapa; la cuenta corriente solo cuenta lo anterior al corte. */
  cantidadDeSolapa: {
    comprobantes: (n: number) => cantidadDe(n, "comprobante", "comprobantes"),
    recibos: (n: number) => cantidadDe(n, "recibo", "recibos"),
    movimientos: (n: number) => `${cantidadDe(n, "movimiento", "movimientos")} hasta la fecha de corte`,
  },
  facturacion: (meses: number) => (meses === 1 ? "Facturación, último mes" : `Facturación, últimos ${meses} meses`),
  detalleDelCliente: "Detalle del cliente",
  solapaComprobantes: "Comprobantes con saldo",
  solapaRecibos: "Recibos",
  solapaCuentaCorriente: "Cuenta corriente",
  imputado: "Imputado",
  aCuenta: "A cuenta",
  medios: "Medios",
  total: "Total",
  irAlSaldo: (corte: FechaCivil) => `Ir al saldo al ${formatearFecha(corte)}`,
  saldoAl: (corte: FechaCivil) => `Saldo al ${formatearFecha(corte)}`,
  notaDeCredito: "Nota de crédito",
  cobro: "Cobro",
  /** Sin saldo en la regla. */
  sinSaldoALaFecha: (corte: FechaCivil) => `Este cliente no tiene saldo a cobrar al ${formatearFecha(corte)}.`,
  vacioDeComprobantes: (corte: FechaCivil) => `No hay comprobantes con saldo al ${formatearFecha(corte)}.`,
  vacioDeRecibos: (corte: FechaCivil) => `No hay recibos de este cliente hasta el ${formatearFecha(corte)}.`,
  vacioDeMovimientos: (corte: FechaCivil) => `Sin movimientos hasta el ${formatearFecha(corte)}.`,
  /** Segunda línea de los vacíos que dependen de la fecha: qué hacer. */
  probarOtroCierre: "Elija un cierre posterior en «Fecha de corte» para ver más movimientos.",
} as const;

/** Comprobante: situación, datos y movimientos. */
export const TEXTO_COMPROBANTE = {
  situacion: (corte: FechaCivil) => `Situación al ${formatearFecha(corte)}`,
  saldo: "Saldo",
  diasDeAtraso: (n: number) => `${cantidadDe(n, "día", "días")} de atraso`,
  /** Unidad de la escala del ubicador (los números de la escala son los límites de los tramos). */
  escalaDeDias: "días",
  /** Una nota de crédito no tiene saldo propio. La frase se completa con el talón de la factura (un enlace) y `notaDeCreditoFin`. */
  notaDeCreditoInicio: (total: string) => `Una nota de crédito no tiene saldo propio: resta su total, ${total}, al saldo de`,
  notaDeCreditoFin: ".",
  datos: "Datos del comprobante",
  cliente: "Cliente",
  emision: "Emisión",
  vencimiento: "Vencimiento",
  vencimientoConPlazo: (vence: FechaCivil, plazo: number) => `${formatearFecha(vence)} (plazo de ${cantidadDe(plazo, "día", "días")})`,
  vencimientoDeNota: (vence: FechaCivil) => `${formatearFecha(vence)} (igual a la fecha de emisión)`,
  servicio: "Servicio",
  asociadaA: "Asociada a",
  notasDeCredito: "Notas de crédito",
  neto: "Neto",
  iva: "IVA 21 %",
  total: "Total",
  movimientos: "Movimientos",
  cantidadDeMovimientos: (n: number) => cantidadDe(n, "movimiento", "movimientos"),
  emisionDelMovimiento: "Emisión",
  cobro: "Cobro",
  cobroParcial: "Cobro parcial",
  notaDeCredito: "Nota de crédito",
  saldoAl: (corte: FechaCivil) => `Saldo al ${formatearFecha(corte)}`,
  /** Comprobante emitido después del corte (S1): qué pasó y qué hacer. */
  emitidoDespuesDelCorte: (emision: FechaCivil, corte: FechaCivil) =>
    `Este comprobante se emitió el ${formatearFecha(emision)}, después de la fecha de corte (${formatearFecha(corte)}). A esa fecha todavía no existía.`,
  verloAl: (fecha: FechaCivil) => `Verlo al ${formatearFecha(fecha)}`,
  irAlCliente: "Ir al cliente",
} as const;

/** Desglose: de dónde sale un número. */
export const TEXTO_DESGLOSE = {
  previo: "¿De dónde sale este número?",
  comoSeCalcula: "Cómo se calcula",
  /** «Solo los comprobantes de» + el nombre del cliente (enlace) + « · al 31/10/2026» o « · mayo de 2026». */
  soloLos: (tipo: "comprobantes" | "recibos" | "comprobantes y recibos") => `Solo los ${tipo} de`,
  alCorte: (corte: FechaCivil) => `al ${formatearFecha(corte)}`,
  delMes: (mes: string) => nombreDelMes(mes),
  bajadaDeOtros: "Los clientes con mora que no están entre los cinco primeros de «Deudores».",
  porCliente: "Por cliente",
  partidas: "Partidas",
  referencia: "Referencia",
  cliente: "Cliente",
  fecha: "Fecha",
  detalle: "Detalle",
  importe: "Importe",
  cantidadDePartidas: "Partidas",
  porcentaje: "%",
  totalPorCliente: (clientes: number, partidas: number) => `Total (${cantidadDe(clientes, "cliente", "clientes")}, ${cantidadDe(partidas, "partida", "partidas")})`,
  totalDePartidas: (n: number) => `Total (${cantidadDe(n, "partida", "partidas")})`,
  sinPartidas: (total: string) => `No hay partidas: el total es ${total}.`,
  ordenarPor: "Ordenar por",
} as const;

/** Errores y estados de falla. Cada uno dice qué pasó, por qué y qué hacer. */
export const TEXTO_ERRORES = {
  direccionDesconocida: { titulo: "Esta dirección no existe", cuerpo: "Puede que esté mal escrita. Desde el resumen puede llegar a cualquier pantalla." },
  clienteInexistente: { titulo: "No se encontró el cliente", cuerpo: "Puede que la dirección esté mal escrita. Elija un cliente desde la lista de clientes." },
  comprobanteInexistente: { titulo: "No se encontró el comprobante", cuerpo: "Puede que la dirección esté mal escrita. Elija un comprobante desde la lista de comprobantes." },
  desgloseInexistente: {
    titulo: "No existe este desglose",
    cuerpo: "Puede que la dirección esté mal escrita, o que ese número no exista a la fecha de corte elegida. Abra el desglose desde el resumen.",
  },
  irAlResumen: "Ir al resumen",
  /** Un control de cálculo no cierra (D2, D3): la demo no muestra las cifras de ese cierre, y el detalle dice qué cálculo falló, sin importes. */
  controlQueFalla: {
    titulo: "No se pueden mostrar las cifras de esta fecha de corte",
    cuerpo: (corte: FechaCivil) =>
      `Dos cálculos que deben dar lo mismo no coinciden al ${formatearFecha(corte)}, así que la demo no muestra las cifras de esa fecha. Es un error del programa, no de los datos. Puede elegir otra fecha de corte en la barra superior.`,
    detalle: (detalle: string) => `Cálculo que no coincide: ${detalle}`,
  },
  /** Los datos de ejemplo no se pudieron preparar. */
  falloAlIniciar: {
    titulo: "No se pudo iniciar la demo",
    cuerpo: "Recargue la página. Si el problema sigue, pruebe con otro navegador.",
    detalle: (mensaje: string) => `Detalle: ${mensaje}`,
    recargar: "Recargar la página",
  },
} as const;

/** Avisos de la dirección (los textos con el mes y la fecha están en `dominio/textos.ts`: `avisoDeCorteInvalido`, `avisoDeMesInvalido`). */
export const TEXTO_AVISOS = {
  region: "Avisos",
} as const;
