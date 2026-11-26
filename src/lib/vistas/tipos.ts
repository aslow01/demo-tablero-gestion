// Tipos compartidos de los modelos de vista. Un modelo de vista es una función pura de `(datos, corte, consulta)` que
// entrega lo que una pantalla necesita ya calculado: importes `Centavos`, porcentajes en milésimas, referencias, banderas. **Sin texto visible**: los
// rótulos los arma `dominio/textos.ts` y los módulos de textos con estos números. Solo usan `medidaControlada`: ninguna cifra llega a la
// pantalla sin que `controlar` haya comparado sus dos caminos (D2), y si no cierran la excepción `ErrorDeCierre` sube hasta el marco.

import type { Tramo } from "../dominio/antiguedad.ts";
import type { Centavos, Milesimas } from "../dominio/dinero.ts";
import type { ClaveDeMedida, Medida, TipoCmp } from "../dominio/tipos.ts";

// ---------------------------------------------------------------------------------------------------------------------------
// Consultas (lo que llega de la dirección): lo mínimo que necesita cada modelo de vista.
// ---------------------------------------------------------------------------------------------------------------------------

/** Cuántos caracteres de la búsqueda se miran: el mismo tope que la dirección (60). */
export const LARGO_MAXIMO_DE_BUSQUEDA = 60;

/** El filtro de la lista de comprobantes (`tramo=`): todos los que tienen saldo, solo los vencidos (la mora) o uno de los cinco tramos. */
export type FiltroDeTramo = "todos" | "vencidos" | Tramo;
export const FILTROS_DE_TRAMO: readonly FiltroDeTramo[] = ["todos", "vencidos", "no-vencido", "1-30", "31-60", "61-90", "mas-90"];

/** El filtro de la lista de clientes (`filtro=`). */
export type FiltroDeClientes = "todos" | "con-mora" | "revisar";
export const FILTROS_DE_CLIENTES: readonly FiltroDeClientes[] = ["todos", "con-mora", "revisar"];

export interface ConsultaDeComprobantes {
  tramo: FiltroDeTramo;
  /** Lo escrito en el buscador (cliente o número); se normaliza y se recorta acá. */
  q: string;
}

export interface ConsultaDeClientes {
  filtro: FiltroDeClientes;
  /** Lo escrito en el buscador (nombre o CUIT); se normaliza y se recorta acá. */
  q: string;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Cifras con desglose
// ---------------------------------------------------------------------------------------------------------------------------

/**
 * Qué medida es una cifra: es lo que necesita el enlace al desglose (`#/desglose/{clave}?cliente=&mes=`) y lo que la prueba de cifras cruza con el
 * dominio. En las medidas del mes `mes` viene siempre (el del filtro o el del corte); `clienteId` solo si la cifra es de un cliente.
 */
export interface RefDeMedida {
  clave: ClaveDeMedida;
  clienteId?: string;
  mes?: string;
}

/** Un importe que se abre en su desglose. **Invariante:** `importe` es el `valor` de la medida `medida` al corte (la prueba de cifras lo comprueba). */
export interface CifraDeMedida {
  medida: RefDeMedida;
  importe: Centavos;
}

/** El total de una columna de una tabla: es una medida entera (`medida` != null, y entonces vale lo mismo) o solo la suma de las filas que se ven. */
export interface TotalDeColumna {
  importe: Centavos;
  medida: RefDeMedida | null;
}

/** La referencia de una medida ya construida, con su filtro validado. */
export function referenciaDeMedida(m: Medida): RefDeMedida {
  const ref: RefDeMedida = { clave: m.clave };
  if (m.filtro.clienteId !== undefined) ref.clienteId = m.filtro.clienteId;
  if (m.filtro.mes !== undefined) ref.mes = m.filtro.mes;
  return ref;
}

/** La cifra de una medida ya construida: su valor y de dónde sale. */
export function cifraDe(m: Medida): CifraDeMedida {
  return { medida: referenciaDeMedida(m), importe: m.valor };
}

// ---------------------------------------------------------------------------------------------------------------------------
// La regla de tramos (resumen, comprobantes, cliente)
// ---------------------------------------------------------------------------------------------------------------------------

export interface FilaDeTramo {
  tramo: Tramo;
  /** La medida del tramo (`tramo-1-30`…), con el cliente si la regla es de un cliente. */
  cifra: CifraDeMedida;
  /** M3 sobre el saldo, con el método del mayor resto: las cinco suman 1000. `null` en todas si el saldo es 0. */
  milesimas: Milesimas | null;
  /** Cuántos comprobantes con saldo tiene el tramo. */
  cantidad: number;
}

export interface ReglaDeTramos {
  /** Solo si es la regla de un cliente. */
  clienteId?: string;
  /** Los cinco tramos, de «no vencido» a «más de 90». */
  filas: FilaDeTramo[];
  /** La suma de los cinco importes: es el saldo a cobrar (X1). */
  total: Centavos;
  /** `true` si no hay saldo: la regla se dibuja vacía y no hay nada que abrir. */
  vacia: boolean;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Recibos y comprobantes enlazados
// ---------------------------------------------------------------------------------------------------------------------------

/** Un comprobante nombrado por su id y su tipo (el talón muestra «FA 0003-00000562»; el nombre largo lo pone la capa de textos). */
export interface RefDeComprobante {
  id: string;
  tipo: TipoCmp;
}
