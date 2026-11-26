// Verificación de un cierre antes de mostrarlo (docs/diseno.md, D3; docs/diseno-ui.md, 8.1): los controles cruzados X1 a X6 corren **una vez por cierre**
// y el resultado se recuerda (38 a 66 ms por cierre, 566 ms los 22). Si un control no cierra, el marco muestra la pantalla de error de cierre y ninguna
// pantalla muestra ninguna cifra de ese cierre. Escrito de nuevo para esta demo (docs/procedencia.md).

import { exigirControles } from "../dominio/controles.ts";
import { ErrorDeCierre } from "../dominio/medidas.ts";
import type { Datos, FechaCivil } from "../dominio/tipos.ts";

export type ResultadoDeCierre = { estado: "ok" } | { estado: "error"; error: ErrorDeCierre };

const OK: ResultadoDeCierre = { estado: "ok" };

/**
 * Un verificador con su propia memoria para estos datos. `exigir` se puede reemplazar en los tests (por defecto `exigirControles`, D2/D3).
 * Un `ErrorDeCierre` es un resultado (y se recuerda); cualquier otro error es un bug y se lanza sin recordarlo.
 */
export function crearVerificadorDeCierres(datos: Datos, exigir: (datos: Datos, corte: FechaCivil) => void = exigirControles): (corte: FechaCivil) => ResultadoDeCierre {
  const recordados = new Map<FechaCivil, ResultadoDeCierre>();
  return (corte) => {
    const antes = recordados.get(corte);
    if (antes !== undefined) return antes;
    let resultado: ResultadoDeCierre = OK;
    try {
      exigir(datos, corte);
    } catch (e) {
      if (!(e instanceof ErrorDeCierre)) throw e;
      resultado = { estado: "error", error: e };
    }
    recordados.set(corte, resultado);
    return resultado;
  };
}
