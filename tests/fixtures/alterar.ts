// Altera a propósito una medida para ver que un control falla (docs/diseno.md, D2 y D3: «cada control se prueba también al revés»).
import type { ValorDeMedida } from "../../src/lib/dominio/controles.ts";
import type { ClaveDeMedida, FiltroDeMedida } from "../../src/lib/dominio/tipos.ts";

/** Una función de valores que suma `delta` centavos donde `donde(clave, filtro)` es verdadero y deja el resto como está. */
export function alterando(base: ValorDeMedida, donde: (clave: ClaveDeMedida, filtro: FiltroDeMedida) => boolean, delta = 1): ValorDeMedida {
  return (clave, filtro = {}) => {
    const v = base(clave, filtro);
    return donde(clave, filtro) ? ((v + delta) as typeof v) : v;
  };
}
