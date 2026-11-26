// «Cómo se calcula» (docs/diseno.md, 4.2.1 y G3): la explicación de las reglas del tablero, en lenguaje llano, con ejemplos de los mismos datos.
//
// **Aquí no hay cifras.** Cada frase es una plantilla con huecos entre llaves (`{saldo}`, `{facturaT05}`) y el código los llena con las constantes
// del dominio (`ESPERADO`, los comprobantes plantados, los rótulos de tramo): `src/lib/vistas/como-se-calcula.ts` arma los valores y
// `tests/como-se-calcula.test.ts` los compara con el dominio. Una prueba de este archivo (`tests/textos.test.ts`) vigila que ninguna plantilla
// contenga un dígito y que cada hueco esté declarado en `HUECOS`.
//
// Español neutro, de usted o impersonal. Todo es ficticio y el texto lo dice. Lo que se afirma aquí es lo que la demo hace (ver docs/diseno.md).

/**
 * Los huecos que usan las plantillas, con el tipo de valor que espera cada uno y de dónde sale.
 * - `texto`: un texto ya escrito (importe con `formatearImporte`, fecha con `formatearFecha`, porcentaje con `formatearPorcentaje`).
 * - `enlace`: un enlace a una pantalla de la demo; el valor trae el texto visible y el destino, y la vista lo dibuja como `<a>`.
 */
export const HUECOS = {
  empresa: { tipo: "texto", fuente: "Nombre de la empresa de los datos (`datos.empresa.nombre`)." },
  desde: { tipo: "texto", fuente: "Mes del primer dato, escrito con `nombreDelMes(DESDE.slice(0, 7))`: «enero de 2025»." },
  hasta: { tipo: "texto", fuente: "Mes del último dato, escrito con `nombreDelMes(HASTA.slice(0, 7))`: «octubre de 2026»." },
  cierres: { tipo: "texto", fuente: "Cantidad de cierres de mes elegibles (`cierresDeMes(datos).length`), como número." },
  corte: { tipo: "texto", fuente: "El corte por defecto, `ESPERADO.corte`, escrito dd/mm/aaaa." },

  facturaT05: { tipo: "enlace", fuente: "Comprobante plantado T05-F al corte por defecto; texto «factura A 0003-…» (tipo en minúscula)." },
  totalT05: { tipo: "texto", fuente: "Total con IVA de T05-F." },
  fechaCobroT05: { tipo: "texto", fuente: "Fecha del recibo T05-R (posterior al corte por defecto)." },
  atrasoT05: { tipo: "texto", fuente: "Días de atraso de T05-F al corte por defecto, escritos con unidad: «6 días»." },

  facturaT04: { tipo: "enlace", fuente: "T04-F al corte por defecto." },
  vencimientoT04: { tipo: "texto", fuente: "Vencimiento de T04-F (coincide con el corte por defecto)." },
  tramoNoVencido: { tipo: "texto", fuente: "`ROTULO_DE_TRAMO[\"no-vencido\"]`." },

  facturaT02: { tipo: "enlace", fuente: "T02-F, al corte `corteT02`." },
  fechaPagoT02: { tipo: "texto", fuente: "Fecha del recibo T02-R2 (el pago parcial posterior al vencimiento)." },
  corteT02: { tipo: "texto", fuente: "Cierre de mes en el que se muestra el ejemplo, escrito dd/mm/aaaa." },
  atrasoT02: { tipo: "texto", fuente: "Días de atraso de T02-F a `corteT02`, con unidad." },

  rotulosDeTramo: { tipo: "texto", fuente: "Los cinco `ROTULO_DE_TRAMO` en orden, separados por comas y con «y» antes del último." },
  sumandosDeTramos: { tipo: "texto", fuente: "Los cinco importes de los tramos al corte por defecto, unidos con « + » (`ESPERADO.tramos`)." },
  saldo: { tipo: "texto", fuente: "`ESPERADO.saldo`." },

  facturaT08: { tipo: "enlace", fuente: "T08-F al cierre de mes del recibo T08-R (para que se vea cancelada), no a uno anterior." },
  reciboT08: { tipo: "texto", fuente: "Identificador de T08-R." },
  sumandosT08: { tipo: "texto", fuente: "Los importes de los medios de T08-R, unidos con « + »." },
  totalT08: { tipo: "texto", fuente: "Total de T08-R." },
  mediosT08: { tipo: "texto", fuente: "Los medios de T08-R con `ROTULO_DE_MEDIO` en minúscula, unidos con comas y «y»." },

  clienteC07: { tipo: "enlace", fuente: "Ficha del cliente de `ESPERADO.pagosACuenta.clienteId`; texto: su razón social." },
  importeT06: { tipo: "texto", fuente: "`ESPERADO.pagosACuenta.importe`." },
  clienteC09: { tipo: "enlace", fuente: "Ficha del cliente de `ESPERADO.saldosAFavor.clienteId`; texto: su razón social." },
  importeT07: { tipo: "texto", fuente: "`ESPERADO.saldosAFavor.importe`." },

  totalDelReparto: { tipo: "texto", fuente: "El 100 % escrito con `formatearPorcentaje(1000)`." },
  sumandosDeDeudores: { tipo: "texto", fuente: "Los porcentajes de «Deudores» al corte por defecto (`ESPERADO.deudores` y «Otros»), unidos con « + » y sin el signo %." },

  resumen: { tipo: "enlace", fuente: "Pantalla Resumen; texto «Resumen»." },
  moraDeC05: { tipo: "enlace", fuente: "Desglose de la mora del cliente `ESPERADO.clienteConMasMora`; texto «la mora de {razón social}»." },
  facturaT12: { tipo: "enlace", fuente: "T12-d91 al corte por defecto." },
} as const;

/** El texto del enlace al desglose de la mora de un cliente (hueco `moraDeC05`): «la mora de Contratista Los Algarrobos Demo S.A.». */
export const textoDelEnlaceDeLaMoraDe = (razonSocial: string): string => `la mora de ${razonSocial}`;

export type HuecoDeComoSeCalcula =keyof typeof HUECOS;

export interface SeccionDeComoSeCalcula {
  /** Identificador del ancla (`cc-{id}`) y de la entrada del índice. */
  id: string;
  titulo: string;
  /** Párrafos de la regla, en orden. */
  parrafos: readonly string[];
  /** Ejemplos con los datos de la demo, bajo el rótulo `TEXTO_COMO_SE_CALCULA.rotuloDelEjemplo`. */
  ejemplos: readonly string[];
}

export const TEXTO_COMO_SE_CALCULA = {
  titulo: "Cómo se calcula",
  /** Bajada de la página. */
  bajada: "Las reglas del tablero, en palabras y con ejemplos de los mismos datos. Los ejemplos están al {corte} salvo que digan otra fecha.",
  indice: "En esta página",
  reglas: "Reglas",
  rotuloDelEjemplo: "Ejemplo con los datos",
  secciones: [
    {
      id: "demo",
      titulo: "Qué es esta demo",
      parrafos: [
        "Es un tablero de cobranzas de una empresa ficticia de servicios de flota ({empresa}). Es de solo lectura: no carga archivos, no usa servidor y no guarda datos.",
        "Los datos se generan en este navegador y son siempre los mismos, de {desde} a {hasta}. Todos los nombres, CUIT e importes son inventados.",
      ],
      ejemplos: [],
    },
    {
      id: "corte",
      titulo: "La fecha de corte",
      parrafos: [
        "Todo se calcula como si el día de hoy fuera el cierre elegido: lo emitido o cobrado después de esa fecha no existe. Al cambiar la fecha cambian los saldos, la mora y el tramo de cada comprobante.",
        "Solo se puede elegir el último día de cada mes: hay {cierres} cierres, de {desde} a {hasta}.",
      ],
      ejemplos: ["La {facturaT05}, de {totalT05}, se cobró el {fechaCobroT05}. Al {corte} sigue impaga, con {atrasoT05} de atraso."],
    },
    {
      id: "facturacion",
      titulo: "Facturación",
      parrafos: [
        "La facturación es el neto sin IVA, por fecha de emisión; las notas de crédito restan.",
        "El IVA se calcula comprobante por comprobante y se suma: no se calcula una sola vez sobre el neto de todo el mes.",
        "El gráfico de Meses compara lo facturado con IVA (el neto más el IVA) con lo cobrado, porque la cobranza incluye el IVA.",
      ],
      ejemplos: [],
    },
    {
      id: "cobranza",
      titulo: "Cobranza y retenciones",
      parrafos: [
        "Las retenciones que hace el cliente cancelan deuda igual que el dinero: cuentan en la cobranza y bajan el saldo. «De lo cual, retenciones» muestra cuánto de la cobranza fueron retenciones.",
      ],
      ejemplos: ["La {facturaT08} se canceló con el recibo {reciboT08}: {sumandosT08} = {totalT08} ({mediosT08})."],
    },
    {
      id: "mora",
      titulo: "Saldo, mora y días de atraso",
      parrafos: [
        "El saldo se calcula con IVA: es lo que cada comprobante debe al corte, después de descontar lo cobrado y las notas de crédito.",
        "Está en mora lo que tiene al menos un día de atraso; lo que vence el mismo día del corte no está vencido.",
        "El atraso se cuenta desde el vencimiento original: un pago parcial no lo reinicia. Según el atraso, cada saldo cae en uno de estos tramos: {rotulosDeTramo}. Los cinco tramos suman el saldo a cobrar.",
      ],
      ejemplos: [
        "La {facturaT04} vence el {vencimientoT04}: al corte del {corte} está en «{tramoNoVencido}».",
        "La {facturaT02} recibió un pago parcial el {fechaPagoT02}, después de vencer, y al {corteT02} sigue con {atrasoT02} de atraso.",
        "Al {corte}: {sumandosDeTramos} = {saldo}, el saldo a cobrar.",
      ],
    },
    {
      id: "a-cuenta",
      titulo: "Pagos a cuenta y saldos a favor",
      parrafos: [
        "Un pago a cuenta sin imputar es dinero cobrado que todavía no se aplicó a ningún comprobante. Baja el saldo neto del cliente, pero no la mora de ningún comprobante, y por eso queda marcado como «Revisar imputación».",
        "Si el cliente ya no debe nada, lo cobrado de más es un saldo a favor.",
      ],
      ejemplos: ["{clienteC07} tiene {importeT06} cobrados sin imputar; {clienteC09}, un saldo a favor de {importeT07}."],
    },
    {
      id: "porcentajes",
      titulo: "Porcentajes",
      parrafos: [
        "Los porcentajes de un reparto llevan un decimal y suman {totalDelReparto}. Si el redondeo no da, la décima que falta se suma al que tenía el resto más grande.",
        "El porcentaje de la mora sobre el saldo a cobrar es un solo cálculo, redondeado a la décima.",
      ],
      ejemplos: ["Deudores al {corte}: {sumandosDeDeudores} = {totalDelReparto}."],
    },
    {
      id: "cierre",
      titulo: "Cada total cuadra con sus partidas",
      parrafos: ["Cada importe subrayado se abre en su desglose, y el total de ese desglose es el mismo importe: la suma de sus partidas, al centavo."],
      ejemplos: ["Desde el {resumen} abra la mora, después {moraDeC05} y, dentro, la {facturaT12}: en cada paso, el total coincide con el importe que se abrió."],
    },
    {
      id: "controles",
      titulo: "Dos cálculos por cada cifra",
      parrafos: [
        "Cada importe se calcula dos veces, por caminos separados: uno suma los datos de origen y el otro recorre comprobante por comprobante, o recibo por recibo. Si los dos resultados no coinciden al centavo, la demo no muestra el número.",
        "Además, para cada fecha de corte se comprueba que los cinco tramos sumen el saldo a cobrar, que los cuatro tramos vencidos sumen la mora, que la suma de los clientes dé el total de la empresa, que la cuenta corriente de cada cliente termine en su saldo neto, que el neto más el IVA dé el total facturado y que la suma de los meses dé el total del período. Si alguno de estos controles falla, la demo no muestra ninguna cifra de esa fecha.",
        "Estos controles detectan errores de suma, no de criterio. Los criterios (qué cuenta como mora, desde cuándo se cuenta el atraso) se comprueban aparte, con casos armados a mano como los de los ejemplos de esta página.",
        "Las pruebas automáticas repiten estos controles con otros conjuntos de datos generados y con todos los cierres de mes.",
      ],
      ejemplos: [],
    },
    {
      id: "limites",
      titulo: "Límites",
      parrafos: [
        "Los vencimientos se cuentan en días corridos, sin feriados. Solo hay comprobantes tipo A (facturas, notas de débito y notas de crédito), en pesos. No hay intereses por mora, contabilidad ni conciliación bancaria.",
      ],
      ejemplos: [],
    },
  ],
} as const satisfies {
  titulo: string;
  bajada: string;
  indice: string;
  reglas: string;
  rotuloDelEjemplo: string;
  secciones: readonly SeccionDeComoSeCalcula[];
};

/** Un trozo de una plantilla ya partida: texto fijo o un hueco por llenar. */
export type TrozoDePlantilla = { texto: string } | { hueco: HuecoDeComoSeCalcula };

const PATRON_DE_HUECO = /\{([A-Za-z0-9]+)\}/g;

function esHuecoDeclarado(nombre: string): nombre is HuecoDeComoSeCalcula {
  return Object.prototype.hasOwnProperty.call(HUECOS, nombre);
}

/** Los nombres de hueco de una plantilla, en orden y con repeticiones. Lanza si usa uno que `HUECOS` no declara. */
export function huecosDe(plantilla: string): HuecoDeComoSeCalcula[] {
  return partirPlantilla(plantilla).flatMap((t) => ("hueco" in t ? [t.hueco] : []));
}

/** Parte una plantilla en texto fijo y huecos (para que la vista dibuje un enlace donde va un hueco de tipo `enlace`). */
export function partirPlantilla(plantilla: string): TrozoDePlantilla[] {
  const trozos: TrozoDePlantilla[] = [];
  let desde = 0;
  for (const m of plantilla.matchAll(PATRON_DE_HUECO)) {
    const nombre = m[1] as string;
    if (!esHuecoDeclarado(nombre)) throw new Error(`La plantilla usa el hueco «${nombre}», que no está declarado en HUECOS.`);
    const inicio = m.index as number;
    if (inicio > desde) trozos.push({ texto: plantilla.slice(desde, inicio) });
    trozos.push({ hueco: nombre });
    desde = inicio + m[0].length;
  }
  if (desde < plantilla.length) trozos.push({ texto: plantilla.slice(desde) });
  return trozos;
}

/** Llena una plantilla con valores de tipo `texto`. Lanza si falta un valor (nunca deja una llave sin llenar en pantalla). */
export function llenarPlantilla(plantilla: string, valores: Readonly<Partial<Record<HuecoDeComoSeCalcula, string>>>): string {
  return partirPlantilla(plantilla)
    .map((t) => {
      if ("texto" in t) return t.texto;
      const valor = valores[t.hueco];
      if (valor === undefined) throw new Error(`Falta el valor del hueco «${t.hueco}».`);
      return valor;
    })
    .join("");
}

/** Todas las plantillas de la página (bajada, párrafos y ejemplos), en orden de lectura. */
export function todasLasPlantillas(): string[] {
  const t = TEXTO_COMO_SE_CALCULA;
  return [t.bajada, ...t.secciones.flatMap((s) => [...s.parrafos, ...s.ejemplos])];
}
