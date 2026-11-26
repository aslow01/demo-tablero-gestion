// Controles cruzados entre medidas (docs/diseno.md, D3 y A2): X1 a X6. Qué contrasta cada uno, sin exagerar:
//  - **X4 es el único que contrasta dos cuentas distintas**: la cuenta corriente y la posición del cliente (`corte.ts`, por listado) contra las
//    medidas por agregación. Es lo que atrapa un error de cuenta que `controlar` no ve porque lo comparte con el otro camino.
//  - **X1, X2, X3, X5 y X6 comparan dos usos de la misma agregación** (`agregados.ts`): prueban que la partición por ventanas de vencimiento, la
//    suma por cliente, la identidad neto + IVA = total y la suma de los doce meses son coherentes entre sí. Valen, pero no son un segundo cálculo.
//  - El contraste entre los dos caminos, cifra por cifra, es de `controlar` (medidas.ts, D2).
//
// Los controles usan los `valor` de las medidas, no sus partidas. Los valores llegan por una función (`ValorDeMedida`), y la posición del cliente
// por otra (`PosicionDe`), para que los tests puedan alterar uno a propósito y ver que el control falla.

import { valorDelPeriodo } from "./agregados.ts";
import { CLAVE_DE_MEDIDA_DEL_TRAMO, TRAMOS } from "./antiguedad.ts";
import { CLAVES_DEL_MES } from "./claves.ts";
import { cuentaDelCliente, posicionDelCliente } from "./corte.ts";
import type { PosicionDelCliente } from "./corte.ts";
import { restar, sumar, sumarLista } from "./dinero.ts";
import type { Centavos } from "./dinero.ts";
import { ErrorDeCierre, docesMeses, valorDeMedida } from "./medidas.ts";
import type { ClaveDeMedida, Datos, FechaCivil, FiltroDeMedida } from "./tipos.ts";

export type IdDeControl = "X1" | "X2" | "X3" | "X4" | "X5" | "X6";

export interface FalloDeControl {
  control: IdDeControl;
  /** Qué se comparó, en palabras: nombra la medida, el cliente o el mes. */
  detalle: string;
  /** El lado que se toma como referencia del control. */
  esperado: Centavos;
  /** El otro lado. */
  obtenido: Centavos;
}

/** El `valor` de una medida (camino por agregación) para el corte y el filtro dados. */
export type ValorDeMedida = (clave: ClaveDeMedida, filtro?: FiltroDeMedida) => Centavos;

/** La posición de un cliente al corte (`corte.ts`). Es un parámetro para que un test pueda plantar un error en ella; en uso normal es `posicionDelCliente`. */
export type PosicionDe = (datos: Datos, clienteId: string, corte: FechaCivil) => PosicionDelCliente;

/** Valores de las medidas de un corte, con memoria (cada medida se calcula una vez) y con el mismo filtro validado que `medida()`. */
export function valoresDe(datos: Datos, corte: FechaCivil): ValorDeMedida {
  const memoria = new Map<string, Centavos>();
  return (clave, filtro = {}) => {
    const llave = `${clave}|${filtro.clienteId ?? ""}|${filtro.mes ?? ""}`;
    const guardado = memoria.get(llave);
    if (guardado !== undefined) return guardado;
    const valor = valorDeMedida(datos, corte, clave, filtro);
    memoria.set(llave, valor);
    return valor;
  };
}

const TRAMOS_VENCIDOS = TRAMOS.filter((t) => t.clave !== "no-vencido").map((t) => CLAVE_DE_MEDIDA_DEL_TRAMO[t.clave]);
const TODOS_LOS_TRAMOS = TRAMOS.map((t) => CLAVE_DE_MEDIDA_DEL_TRAMO[t.clave]);
/** Las 12 claves de X3 (D3): saldo, mora, los cinco tramos y las cinco del mes. */
export const CLAVES_DEL_X3: readonly ClaveDeMedida[] = ["saldo", "mora", ...TODOS_LOS_TRAMOS, ...CLAVES_DEL_MES];
const CLAVES_DEL_X6 = ["facturacion-mes", "facturado-con-iva-mes", "cobranza-mes", "retenciones-mes"] as const;

/**
 * Los controles cruzados X1 a X6 (D3), con los valores de `valorDe` (por defecto, los de `valoresDe`). Devuelve los que no cierran; una
 * lista vacía es que todo cierra.
 * - **X1** Σ de los cinco tramos = saldo. **X2** Σ de los cuatro tramos vencidos = mora (A2).
 * - **X3** para saldo, mora, los cinco tramos y las cinco del mes, la medida de la empresa = Σ de la misma medida de cada cliente.
 * - **X4** en cada cliente, el saldo final de la cuenta corriente (`corte.ts`, otro cálculo) = saldo − pagos a cuenta − saldos a favor
 *   = saldo neto, y la posición del cliente de `corte.ts` (por listado) = las medidas (por agregación): S = saldo, A = pagos a cuenta + saldos a favor,
 *   y los mismos pagos a cuenta, saldos a favor y saldo neto; y la suma de los clientes = el saldo neto de la empresa.
 * - **X5** facturado con IVA = facturación + IVA, en la empresa y en cada cliente, en cada uno de los doce meses.
 * - **X6** el año (un solo cálculo sobre el período) = Σ de los doce meses, en las cuatro medidas que se muestran por mes.
 */
export function controlesCruzados(datos: Datos, corte: FechaCivil, valorDe: ValorDeMedida = valoresDe(datos, corte), posicionDe: PosicionDe = posicionDelCliente): FalloDeControl[] {
  const fallos: FalloDeControl[] = [];
  const comparar = (control: IdDeControl, detalle: string, esperado: Centavos, obtenido: Centavos): void => {
    if (esperado !== obtenido) fallos.push({ control, detalle, esperado, obtenido });
  };
  const suma = (claves: readonly ClaveDeMedida[], filtro: FiltroDeMedida = {}): Centavos => sumarLista(claves.map((c) => valorDe(c, filtro)));

  comparar("X1", "el saldo a cobrar y la suma de los cinco tramos de antigüedad", valorDe("saldo"), suma(TODOS_LOS_TRAMOS));
  comparar("X2", "la mora y la suma de los cuatro tramos vencidos", valorDe("mora"), suma(TRAMOS_VENCIDOS));

  for (const clave of CLAVES_DEL_X3) {
    const porCliente = sumarLista(datos.clientes.map((c) => valorDe(clave, { clienteId: c.id })));
    comparar("X3", `la medida ${clave} de la empresa y la suma de la misma medida de cada cliente`, valorDe(clave), porCliente);
  }

  for (const cliente of datos.clientes) {
    const filtro = { clienteId: cliente.id };
    const cuenta = cuentaDelCliente(datos, cliente.id, corte).saldoFinal;
    const identidad = restar(restar(valorDe("saldo", filtro), valorDe("pagos-a-cuenta", filtro)), valorDe("saldos-a-favor", filtro));
    const neto = valorDe("saldo-neto", filtro);
    comparar("X4", `en el cliente ${cliente.id}, el saldo final de la cuenta corriente y saldo − pagos a cuenta − saldos a favor`, cuenta, identidad);
    comparar("X4", `en el cliente ${cliente.id}, el saldo final de la cuenta corriente y el saldo neto`, cuenta, neto);
    // La posición del cliente de `corte.ts` (por listado: la que muestra la vista Cliente) contra las cuatro medidas (por agregación).
    const p = posicionDe(datos, cliente.id, corte);
    comparar("X4", `en el cliente ${cliente.id}, el saldo de la posición del cliente y la medida saldo`, p.saldo, valorDe("saldo", filtro));
    comparar("X4", `en el cliente ${cliente.id}, lo cobrado sin imputar de la posición del cliente y pagos a cuenta más saldos a favor`, p.aCuenta, sumar(valorDe("pagos-a-cuenta", filtro), valorDe("saldos-a-favor", filtro)));
    comparar("X4", `en el cliente ${cliente.id}, los pagos a cuenta de la posición del cliente y la medida pagos-a-cuenta`, p.pagosACuenta, valorDe("pagos-a-cuenta", filtro));
    comparar("X4", `en el cliente ${cliente.id}, los saldos a favor de la posición del cliente y la medida saldos-a-favor`, p.saldosAFavor, valorDe("saldos-a-favor", filtro));
    comparar("X4", `en el cliente ${cliente.id}, el saldo neto de la posición del cliente y la medida saldo-neto`, p.saldoNeto, neto);
  }
  comparar("X4", "el saldo neto de la empresa y la suma del saldo neto de cada cliente", valorDe("saldo-neto"), sumarLista(datos.clientes.map((c) => valorDe("saldo-neto", { clienteId: c.id }))));

  const meses = docesMeses(corte, datos.desde);
  for (const mes of meses) {
    const alcances: { nombre: string; filtro: FiltroDeMedida }[] = [{ nombre: "la empresa", filtro: { mes } }, ...datos.clientes.map((c) => ({ nombre: `el cliente ${c.id}`, filtro: { clienteId: c.id, mes } }))];
    for (const { nombre, filtro } of alcances) {
      const neto = valorDe("facturacion-mes", filtro);
      const iva = valorDe("iva-mes", filtro);
      comparar("X5", `en ${mes}, para ${nombre}, el facturado con IVA y la facturación más el IVA`, valorDe("facturado-con-iva-mes", filtro), sumar(neto, iva));
    }
  }

  const primero = meses[0];
  const ultimo = meses[meses.length - 1];
  if (primero !== undefined && ultimo !== undefined) {
    for (const clave of CLAVES_DEL_X6) {
      const anio = valorDelPeriodo(datos, corte, clave, primero, ultimo);
      comparar("X6", `la medida ${clave} de ${primero} a ${ultimo} y la suma de sus meses`, anio, sumarLista(meses.map((mes) => valorDe(clave, { mes }))));
    }
  }
  return fallos;
}

/** D2: lanza `ErrorDeCierre` con el primer control cruzado que no cierra; la interfaz muestra la pantalla de error y nunca el número. */
export function exigirControles(datos: Datos, corte: FechaCivil, valorDe: ValorDeMedida = valoresDe(datos, corte)): void {
  const [fallo] = controlesCruzados(datos, corte, valorDe);
  if (fallo !== undefined) throw new ErrorDeCierre(fallo.control, fallo.esperado, fallo.obtenido, `el otro lado (${fallo.detalle})`, fallo.detalle);
}
