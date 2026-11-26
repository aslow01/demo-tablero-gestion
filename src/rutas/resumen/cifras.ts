// Ayudas de las pantallas Resumen y Meses (y de su gráfico de 12 meses) para enlazar y nombrar cada cifra. No calculan nada: el importe y la medida llegan de los
// modelos de vista (`src/lib/vistas/resumen.ts` y `meses.ts`); acá solo se decide a dónde lleva cada cifra y cómo se llama.

import { tituloDeDesglose } from "../../lib/dominio/textos.ts";
import type { Datos, FechaCivil } from "../../lib/dominio/tipos.ts";
import type { RutaNavegable } from "../../lib/estado/enrutador.ts";
import { razonSocialDe } from "../../lib/vistas/rotulos.ts";
import type { RefDeMedida } from "../../lib/vistas/tipos.ts";

type RutaDeDesglose = Extract<RutaNavegable, { tipo: "desglose" }>;

const SEPARADOR_DE_CLIENTE = " · ";

/**
 * La ruta del desglose de una cifra. `conMes` pone `mes=` en la dirección: lo piden las celdas de la tabla de meses (cada fila es un mes
 * distinto); las cifras del movimiento del mes del corte no lo llevan (sin `mes=` rige el mes del corte).
 */
export function rutaDeDesglose(ref: RefDeMedida, conMes: boolean): RutaDeDesglose {
  const ruta: RutaDeDesglose = { tipo: "desglose", clave: ref.clave };
  if (ref.clienteId !== undefined) ruta.clienteId = ref.clienteId;
  if (conMes && ref.mes !== undefined) ruta.mes = ref.mes;
  return ruta;
}

/**
 * Cómo se llama una cifra-enlace para un lector de pantalla: el título completo de su desglose («En mora al 31/10/2026 · Algarrobos Demo S.A.»), el mismo
 * que lleva la pestaña del navegador cuando se la abre.
 */
export function nombreDeCifra(ref: RefDeMedida, corte: FechaCivil, datos: Pick<Datos, "clientes">): string {
  const titulo = tituloDeDesglose(ref.clave, corte, ref.mes);
  return ref.clienteId === undefined ? titulo : `${titulo}${SEPARADOR_DE_CLIENTE}${razonSocialDe(datos, ref.clienteId)}`;
}
