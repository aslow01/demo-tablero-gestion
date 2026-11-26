// Modelo de vista de la sección Clientes: la cartera por cliente al corte, del saldo más grande al más chico, con su mora, su
// regla mínima, su tramo más antiguo y si hay algo para revisar (un pago a cuenta sin imputar o un saldo a favor). Filtros (con su conteo) y búsqueda por
// nombre o CUIT. Lo cobrado sin imputar no se resta en las columnas: el saldo y la mora son los de las medidas (se ve en cada cliente).

import type { Tramo } from "../dominio/antiguedad.ts";
import { compararNombres, sumarLista } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";
import { posicionDelCliente } from "../dominio/corte.ts";
import { medidaControlada } from "../dominio/medidas.ts";
import type { Cliente, Datos, FechaCivil } from "../dominio/tipos.ts";
import { normalizarBusqueda, normalizarTexto } from "./formato.ts";
import { reglaDeTramos } from "./resumen.ts";
import { FILTROS_DE_CLIENTES, cifraDe } from "./tipos.ts";
import type { CifraDeMedida, ConsultaDeClientes, FiltroDeClientes, ReglaDeTramos, TotalDeColumna } from "./tipos.ts";

/** Qué hay para revisar de un cliente: lo cobrado sin imputar es «revisar imputación» si todavía debe y «saldo a favor» si no debe nada (R4). */
export type EstadoDeCliente = "revisar-imputacion" | "saldo-a-favor";

export interface FilaDeCliente {
  clienteId: string;
  /** La razón social (dato del cliente). */
  nombre: string;
  /** Once dígitos, sin guiones; la pantalla lo muestra con `formatearCuit` y el rótulo «(ficticio)». */
  cuit: string;
  plazoDias: Cliente["plazoDias"];
  /** El saldo a cobrar del cliente: abre `saldo` filtrada por él. */
  saldo: CifraDeMedida;
  /** Su mora: abre `mora` filtrada por él. */
  mora: CifraDeMedida;
  /** Sus cinco tramos: la regla mínima de la fila. */
  regla: ReglaDeTramos;
  /** El tramo de su comprobante más atrasado; `null` si no tiene saldo. */
  tramoMasAntiguo: Tramo | null;
  estado: EstadoDeCliente | null;
}

export interface PastillaDeClientes {
  filtro: FiltroDeClientes;
  cantidad: number;
}

export interface VistaClientes {
  corte: FechaCivil;
  /** El filtro que rige (uno desconocido se toma como `todos`). */
  filtro: FiltroDeClientes;
  /** `todos`, `con-mora` y `revisar`, con su conteo (sin mirar la búsqueda). */
  pastillas: PastillaDeClientes[];
  /** Cuántos clientes tiene el filtro antes de buscar. */
  cantidadDelFiltro: number;
  conBusqueda: boolean;
  /** Del saldo mayor al menor, los que no tienen saldo al final; el empate, por razón social. */
  filas: FilaDeCliente[];
  /** Las sumas de las filas que se ven; con `medida` cuando son todos los clientes que tienen esa medida (entonces valen lo mismo que ella). */
  totales: { saldo: TotalDeColumna; mora: TotalDeColumna };
}

/** Los 13 clientes con sus cifras al corte, en el orden de la cartera (saldo mayor primero, sin saldo al final, el empate por nombre). */
export function carteraDeClientes(datos: Datos, corte: FechaCivil): FilaDeCliente[] {
  const filas = datos.clientes.map((c): FilaDeCliente => {
    const saldo = medidaControlada(datos, corte, "saldo", { clienteId: c.id });
    const mora = medidaControlada(datos, corte, "mora", { clienteId: c.id });
    const regla = reglaDeTramos(datos, corte, c.id);
    const posicion = posicionDelCliente(datos, c.id, corte);
    const masViejo = [...regla.filas].reverse().find((f) => f.cantidad > 0);
    return {
      clienteId: c.id,
      nombre: c.razonSocial,
      cuit: c.cuit,
      plazoDias: c.plazoDias,
      saldo: cifraDe(saldo),
      mora: cifraDe(mora),
      regla,
      tramoMasAntiguo: masViejo?.tramo ?? null,
      estado: posicion.aCuenta > 0 ? (posicion.saldo > 0 ? "revisar-imputacion" : "saldo-a-favor") : null,
    };
  });
  return filas.sort((a, b) => Number(a.saldo.importe === 0) - Number(b.saldo.importe === 0) || b.saldo.importe - a.saldo.importe || compararNombres(a.nombre, b.nombre));
}

/** Cuántos clientes tienen algo para revisar al corte: es la insignia de la pestaña Clientes. */
export function cantidadParaRevisar(datos: Datos, corte: FechaCivil): number {
  return datos.clientes.filter((c) => posicionDelCliente(datos, c.id, corte).aCuenta > 0).length;
}

const ES_DEL_FILTRO: Readonly<Record<FiltroDeClientes, (f: FilaDeCliente) => boolean>> = {
  todos: () => true,
  "con-mora": (f) => f.mora.importe > 0,
  revisar: (f) => f.estado !== null,
};

/** La vista de la sección Clientes al corte, con el filtro y la búsqueda de la dirección. */
export function vistaClientes(datos: Datos, corte: FechaCivil, consulta: ConsultaDeClientes): VistaClientes {
  const filtro: FiltroDeClientes = FILTROS_DE_CLIENTES.includes(consulta.filtro) ? consulta.filtro : "todos";
  const cartera = carteraDeClientes(datos, corte);
  const delFiltro = cartera.filter(ES_DEL_FILTRO[filtro]);
  const q = normalizarBusqueda(consulta.q);
  const digitos = q.replace(/-/g, "");
  const filas = q === "" ? delFiltro : delFiltro.filter((f) => normalizarTexto(f.nombre).includes(q) || (digitos !== "" && f.cuit.includes(digitos)));
  const entera = q === "";
  const total = (de: (f: FilaDeCliente) => CifraDeMedida, clave: "saldo" | "mora", conMedida: boolean): TotalDeColumna => {
    const importe: Centavos = sumarLista(filas.map((f) => de(f).importe));
    return { importe, medida: conMedida ? { clave } : null };
  };
  return {
    corte,
    filtro,
    pastillas: FILTROS_DE_CLIENTES.map((f): PastillaDeClientes => ({ filtro: f, cantidad: cartera.filter(ES_DEL_FILTRO[f]).length })),
    cantidadDelFiltro: delFiltro.length,
    conBusqueda: !entera,
    filas,
    // Sumar el saldo de todos (o la mora de todos, o de los que tienen mora) es la medida entera; con «para revisar» o con búsqueda, solo esas filas.
    totales: { saldo: total((f) => f.saldo, "saldo", entera && filtro === "todos"), mora: total((f) => f.mora, "mora", entera && (filtro === "todos" || filtro === "con-mora")) },
  };
}
