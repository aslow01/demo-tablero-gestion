// Modelo de vista de Meses (docs/diseno-ui.md, 6.7 y 5.10) y las series que usan Resumen y Cliente: doce meses que terminan en el del corte, con lo
// facturado (con y sin IVA), lo cobrado y las retenciones de cada uno. Cada importe es una `medidaControlada` del mes (D2) y cada total es la suma
// de su columna (X6): el gráfico y la tabla salen de la misma lista, así que no pueden contradecirse.

import { sumarLista } from "../dominio/dinero.ts";
import type { Centavos } from "../dominio/dinero.ts";
import { mesDelCorte } from "../dominio/corte.ts";
import { docesMeses, medidaControlada } from "../dominio/medidas.ts";
import type { ClaveDeMedida, Datos, FechaCivil } from "../dominio/tipos.ts";
import { cifraDe } from "./tipos.ts";
import type { CifraDeMedida } from "./tipos.ts";

export interface MesDelCliente {
  /** `AAAA-MM`. */
  mes: string;
  /** Facturación sin IVA del mes (`facturacion-mes`). */
  facturacion: CifraDeMedida;
}

export interface MesDeLaEmpresa extends MesDelCliente {
  /** `facturado-con-iva-mes`: lo que compara el gráfico con lo cobrado (la cobranza incluye el IVA). */
  facturadoConIva: CifraDeMedida;
  /** `cobranza-mes`. */
  cobranza: CifraDeMedida;
  /** `retenciones-mes`: de lo cual, retenciones. */
  retenciones: CifraDeMedida;
}

export interface SerieDeMeses {
  /** Los doce meses que terminan en el del corte, en orden (menos si los datos empiezan después). */
  meses: MesDeLaEmpresa[];
  /** X6: la suma de cada columna. */
  totales: { facturacion: Centavos; facturadoConIva: Centavos; cobranza: Centavos; retenciones: Centavos };
  /** El mes del corte (el último de la lista): la fila marcada. */
  mesDelCorte: string;
  /** `false` si hay menos de doce porque los datos empiezan después: la pantalla avisa desde cuándo hay datos. */
  completa: boolean;
  /** El primer mes de los datos, `AAAA-MM`. */
  desde: string;
  /** Posición del mes de mayor facturado con IVA (el primero si hay empate): lo nombra la descripción del gráfico. `null` si no hay meses. */
  mayor: number | null;
}

/** El modelo de la sección Meses (y la serie de Resumen). */
export type VistaMeses = SerieDeMeses;

export interface FacturacionDelCliente {
  clienteId: string;
  meses: MesDelCliente[];
  total: Centavos;
  mesDelCorte: string;
  completa: boolean;
  desde: string;
  /** Posición del mes de mayor facturación sin IVA (el primero si hay empate). */
  mayor: number | null;
}

/** La posición del primer máximo; `null` si la lista está vacía. */
function posicionDelMayor(importes: readonly Centavos[]): number | null {
  let mayor: number | null = null;
  let mayorImporte = 0;
  for (const [i, importe] of importes.entries()) {
    if (mayor === null || importe > mayorImporte) {
      mayor = i;
      mayorImporte = importe;
    }
  }
  return mayor;
}

function delMes(datos: Datos, corte: FechaCivil, clave: ClaveDeMedida, mes: string, clienteId?: string): CifraDeMedida {
  return cifraDe(medidaControlada(datos, corte, clave, clienteId === undefined ? { mes } : { mes, clienteId }));
}

export function vistaMeses(datos: Datos, corte: FechaCivil): VistaMeses {
  const meses = docesMeses(corte, datos.desde).map(
    (mes): MesDeLaEmpresa => ({
      mes,
      facturacion: delMes(datos, corte, "facturacion-mes", mes),
      facturadoConIva: delMes(datos, corte, "facturado-con-iva-mes", mes),
      cobranza: delMes(datos, corte, "cobranza-mes", mes),
      retenciones: delMes(datos, corte, "retenciones-mes", mes),
    }),
  );
  const suma = (de: (m: MesDeLaEmpresa) => CifraDeMedida): Centavos => sumarLista(meses.map((m) => de(m).importe));
  return {
    meses,
    totales: { facturacion: suma((m) => m.facturacion), facturadoConIva: suma((m) => m.facturadoConIva), cobranza: suma((m) => m.cobranza), retenciones: suma((m) => m.retenciones) },
    mesDelCorte: mesDelCorte(corte),
    completa: meses.length === 12,
    desde: datos.desde.slice(0, 7),
    mayor: posicionDelMayor(meses.map((m) => m.facturadoConIva.importe)),
  };
}

/** La facturación sin IVA de un cliente en los mismos doce meses (la ficha del cliente). Lanza si el cliente no existe. */
export function facturacionDelCliente(datos: Datos, corte: FechaCivil, clienteId: string): FacturacionDelCliente {
  const meses = docesMeses(corte, datos.desde).map((mes): MesDelCliente => ({ mes, facturacion: delMes(datos, corte, "facturacion-mes", mes, clienteId) }));
  return {
    clienteId,
    meses,
    total: sumarLista(meses.map((m) => m.facturacion.importe)),
    mesDelCorte: mesDelCorte(corte),
    completa: meses.length === 12,
    desde: datos.desde.slice(0, 7),
    mayor: posicionDelMayor(meses.map((m) => m.facturacion.importe)),
  };
}
