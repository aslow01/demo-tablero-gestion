// Modelo de vista de la sección Comprobantes: los comprobantes con saldo al corte, del más atrasado al menos, con los filtros por
// tramo (con su conteo) y la búsqueda por cliente o número. Cada fila trae su saldo y su atraso del camino por listado (`partidasDe`) y el total de la tabla
// es la suma de las filas que se ven; cuando no hay búsqueda, ese total es una medida entera (saldo, mora o un tramo) y la pantalla lo puede enlazar.

import { CLAVE_DE_MEDIDA_DEL_TRAMO, tramoDe } from "../dominio/antiguedad.ts";
import type { Tramo } from "../dominio/antiguedad.ts";
import { sumarLista } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";
import { medidaControlada } from "../dominio/medidas.ts";
import { ordenarPartidas } from "../dominio/orden.ts";
import type { Datos, FechaCivil, TipoCmp } from "../dominio/tipos.ts";
import { comprobantePorId } from "./comprobante.ts";
import { normalizarBusqueda, normalizarTexto } from "./formato.ts";
import { reglaDeTramos } from "./resumen.ts";
import { FILTROS_DE_TRAMO, cifraDe, referenciaDeMedida } from "./tipos.ts";
import type { CifraDeMedida, ConsultaDeComprobantes, FiltroDeTramo, ReglaDeTramos, TotalDeColumna } from "./tipos.ts";

export interface PastillaDeTramo {
  filtro: FiltroDeTramo;
  /** Cuántos comprobantes con saldo tiene ese filtro (sin mirar la búsqueda). */
  cantidad: number;
}

export interface FilaDeComprobante {
  comprobanteId: string;
  tipo: TipoCmp;
  clienteId: string;
  /** La razón social (dato del cliente). */
  nombreDelCliente: string;
  emision: FechaCivil;
  vencimiento: FechaCivil;
  /** Lo que falta cobrar al corte (S2). */
  saldo: Centavos;
  /** S3: 0 o menos, no vencido. */
  atraso: number;
  tramo: Tramo;
}

export interface VistaComprobantes {
  corte: FechaCivil;
  /** El filtro que rige (uno desconocido se toma como `todos`). */
  filtro: FiltroDeTramo;
  /** El saldo a cobrar: «todos juntos suman» esto. */
  saldo: CifraDeMedida;
  /** La regla de tramos de la empresa, con la que se filtra. */
  regla: ReglaDeTramos;
  /** `todos`, `vencidos` y los cinco tramos, con su conteo. */
  pastillas: PastillaDeTramo[];
  /** Cuántos comprobantes tiene el filtro antes de buscar («Se muestran N de M»). */
  cantidadDelFiltro: number;
  /** `true` si lo escrito en el buscador, ya normalizado, no está vacío. */
  conBusqueda: boolean;
  /** Del más atrasado al menos (A: atraso, importe, fecha y referencia desempatan). */
  filas: FilaDeComprobante[];
  /** La suma de las filas; con `medida` si son todas las del filtro (sin búsqueda) y entonces vale lo mismo que esa medida. */
  total: TotalDeColumna;
}

export function vistaComprobantes(datos: Datos, corte: FechaCivil, consulta: ConsultaDeComprobantes): VistaComprobantes {
  const filtro: FiltroDeTramo = FILTROS_DE_TRAMO.includes(consulta.tramo) ? consulta.tramo : "todos";
  const saldo = medidaControlada(datos, corte, "saldo");
  const mora = medidaControlada(datos, corte, "mora");
  const regla = reglaDeTramos(datos, corte);
  const base = filtro === "todos" ? saldo : filtro === "vencidos" ? mora : medidaControlada(datos, corte, CLAVE_DE_MEDIDA_DEL_TRAMO[filtro]);
  const pastillas: PastillaDeTramo[] = [
    { filtro: "todos", cantidad: saldo.partidas.length },
    { filtro: "vencidos", cantidad: mora.partidas.length },
    ...regla.filas.map((f): PastillaDeTramo => ({ filtro: f.tramo, cantidad: f.cantidad })),
  ];

  const nombres = new Map(datos.clientes.map((c) => [c.id, c.razonSocial]));
  const q = normalizarBusqueda(consulta.q);
  const filas: FilaDeComprobante[] = [];
  for (const p of ordenarPartidas(base.partidas, "atraso")) {
    const c = comprobantePorId(datos, p.ref.id);
    if (c === undefined || p.atraso === undefined) throw new Error(`Error interno: la partida ${p.ref.id} no es de un comprobante con saldo.`);
    const nombreDelCliente = nombres.get(c.clienteId) ?? c.clienteId;
    if (q !== "" && !normalizarTexto(nombreDelCliente).includes(q) && !c.id.includes(q)) continue;
    filas.push({ comprobanteId: c.id, tipo: c.tipo, clienteId: c.clienteId, nombreDelCliente, emision: c.emision, vencimiento: c.vencimiento, saldo: p.importe, atraso: p.atraso, tramo: tramoDe(p.atraso) });
  }
  const entera = q === "";
  return {
    corte,
    filtro,
    saldo: cifraDe(saldo),
    regla,
    pastillas,
    cantidadDelFiltro: base.partidas.length,
    conBusqueda: !entera,
    filas,
    total: { importe: sumarLista(filas.map((f) => f.saldo)), medida: entera ? referenciaDeMedida(base) : null },
  };
}
