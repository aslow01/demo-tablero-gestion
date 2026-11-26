// La propiedad que cruza todas las pantallas con el dominio. En cada uno de los 22 cierres de mes,
// con los datos de la semilla publicada, se arman los modelos de vista de las ocho secciones (Resumen, Comprobantes con sus siete filtros, Clientes con sus tres,
// Meses, los 13 clientes, los 690 comprobantes y los desgloses de todas las medidas, de la empresa y de cada cliente) y se comprueba:
//   1. Cada cifra con desglose (`CifraDeMedida`, `TotalDeColumna`) vale lo mismo que su medida en el dominio (agregación): lo recorre un buscador de cifras.
//   2. La misma cifra vale lo mismo en todas las pantallas: la mora (franja = Deudores = desglose = filtro «en mora» = columna de Clientes), el saldo (Σ tramos =
//      Σ comprobantes = Σ clientes = desglose), los tramos, el saldo neto (cuenta corriente), los meses (Σ clientes = empresa; Σ meses = el período, X6).
//   3. Cada total de una tabla es la suma de sus filas, al centavo, y los porcentajes suman 100,0 %.
//   4. El saldo de cada comprobante que dan sus movimientos es el de `saldoAlCorte` (S2), y lo que ve la lista, el cliente y el comprobante coincide.
//   5. En el cierre por defecto, los valores de `esperado.ts`.
// El tiempo se informa por consola y solo se acota con un tope muy holgado (120 s). Aparte: si `medidaControlada` o el saldo del dominio no cierran, ninguna vista entrega nada.
import { describe, expect, it, vi } from "vitest";
import { ESPERADO } from "../src/lib/datos/esperado.ts";
import { valorDelPeriodo } from "../src/lib/dominio/agregados.ts";
import { TRAMOS } from "../src/lib/dominio/antiguedad.ts";
import { esClaveDelMes } from "../src/lib/dominio/claves.ts";
import { cierresDeMes } from "../src/lib/dominio/corte.ts";
import { centavos } from "../src/lib/dominio/dinero.ts";
import { ErrorDeCierre, clavesExistentes, valorDeMedida } from "../src/lib/dominio/medidas.ts";
import type { ClaveDeMedida, FechaCivil } from "../src/lib/dominio/tipos.ts";
import { cantidadParaRevisar, vistaClientes } from "../src/lib/vistas/clientes.ts";
import { vistaCliente } from "../src/lib/vistas/cliente.ts";
import { vistaComprobante } from "../src/lib/vistas/comprobante.ts";
import { vistaComprobantes } from "../src/lib/vistas/comprobantes.ts";
import { vistaDesglose } from "../src/lib/vistas/desglose.ts";
import type { VistaDesglose } from "../src/lib/vistas/desglose.ts";
import { vistaMeses } from "../src/lib/vistas/meses.ts";
import { reglaDeTramos, vistaResumen } from "../src/lib/vistas/resumen.ts";
import { FILTROS_DE_TRAMO } from "../src/lib/vistas/tipos.ts";
import type { RefDeMedida } from "../src/lib/vistas/tipos.ts";
import { CORTE, DATOS } from "./fixtures/vistas.ts";

// Dos interruptores para la última prueba: hacer que `medidaControlada` o el saldo del dominio (S2) no cierren. Apagados, pasan todo tal cual.
const { forzar } = vi.hoisted(() => ({ forzar: { medida: false, saldo: false } }));
vi.mock("../src/lib/dominio/medidas.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/lib/dominio/medidas.ts")>();
  return {
    ...original,
    medidaControlada: (...argumentos: Parameters<typeof original.medidaControlada>) => {
      if (forzar.medida) throw new original.ErrorDeCierre("mora", centavos(100), centavos(99));
      return original.medidaControlada(...argumentos);
    },
  };
});
vi.mock("../src/lib/dominio/corte.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/lib/dominio/corte.ts")>();
  return {
    ...original,
    saldoAlCorte: (...argumentos: Parameters<typeof original.saldoAlCorte>) => centavos(original.saldoAlCorte(...argumentos) + (forzar.saldo ? 1 : 0)),
  };
});

const suma = (lista: readonly number[]): number => lista.reduce((s, x) => s + x, 0);

/** Lo que suman las filas de un desglose (por cliente o en lista). */
function sumaDelDesglose(v: VistaDesglose): number {
  if (v.modo === "vacio") return 0;
  return v.modo === "por-cliente" ? suma(v.filas.map((f) => f.importe.importe)) : suma(v.partidas.map((p) => p.importe));
}

interface Resultado {
  comparaciones: number;
  fallos: string[];
}

function verificarCierre(corte: FechaCivil): Resultado {
  const fallos: string[] = [];
  let comparaciones = 0;
  const igual = (actual: unknown, esperado: unknown, que: string): void => {
    comparaciones += 1;
    if (actual !== esperado && fallos.length < 12) fallos.push(`${corte} ${que}: ${String(actual)} y debería ser ${String(esperado)}`);
  };

  const memoria = new Map<string, number>();
  /** El valor de una medida en el dominio (camino por agregación), con memoria dentro del cierre. */
  const valor = (clave: ClaveDeMedida, clienteId?: string, mes?: string): number => {
    const llave = `${clave}|${clienteId ?? ""}|${mes ?? ""}`;
    const guardado = memoria.get(llave);
    if (guardado !== undefined) return guardado;
    const v = valorDeMedida(DATOS, corte, clave, { ...(clienteId === undefined ? {} : { clienteId }), ...(mes === undefined ? {} : { mes }) });
    memoria.set(llave, v);
    return v;
  };

  /** Busca en cualquier estructura las cifras con desglose (`{ medida, importe }`) y compara cada una con su medida del dominio. */
  const recorrer = (x: unknown, camino: string): void => {
    if (typeof x !== "object" || x === null) return;
    if (Array.isArray(x)) {
      x.forEach((y, i) => recorrer(y, `${camino}[${i}]`));
      return;
    }
    const o = x as Record<string, unknown>;
    const ref = o["medida"] as RefDeMedida | null | undefined;
    if (typeof o["importe"] === "number" && typeof ref === "object" && ref !== null && typeof ref.clave === "string") {
      igual(ref.mes !== undefined, esClaveDelMes(ref.clave), `${camino}: el mes va solo en las medidas del mes`);
      igual(o["importe"], valor(ref.clave, ref.clienteId, ref.mes), `${camino} (${ref.clave} ${ref.clienteId ?? ""} ${ref.mes ?? ""})`);
    }
    for (const [k, y] of Object.entries(o)) recorrer(y, `${camino}.${k}`);
  };

  const saldo = valor("saldo");
  const mora = valor("mora");
  const claves = clavesExistentes(DATOS, corte);

  // ---------------------------------------------------------------------------------------------------------------------------
  // Las secciones de la empresa
  // ---------------------------------------------------------------------------------------------------------------------------
  const resumen = vistaResumen(DATOS, corte);
  recorrer(resumen, "resumen");
  const meses = vistaMeses(DATOS, corte);
  recorrer(meses, "meses");
  const clientes = vistaClientes(DATOS, corte, { filtro: "todos", q: "" });
  const conMora = vistaClientes(DATOS, corte, { filtro: "con-mora", q: "" });
  const aRevisar = vistaClientes(DATOS, corte, { filtro: "revisar", q: "" });
  for (const [nombre, v] of [["clientes", clientes], ["con-mora", conMora], ["revisar", aRevisar]] as const) recorrer(v, nombre);
  const listas = new Map(FILTROS_DE_TRAMO.map((tramo) => [tramo, vistaComprobantes(DATOS, corte, { tramo, q: "" })] as const));
  for (const [tramo, v] of listas) recorrer(v, `comprobantes ${tramo}`);
  const todos = listas.get("todos");
  const vencidos = listas.get("vencidos");
  if (todos === undefined || vencidos === undefined) throw new Error("Faltan las listas «todos» y «vencidos».");

  // La mora: franja = Deudores = desglose = filtro «en mora» = columna de Clientes = Σ de los cuatro tramos vencidos (X2).
  const tramos = resumen.regla.filas.map((f) => f.cifra.importe);
  const deMora = vistaDesglose(DATOS, corte, { clave: "mora" });
  igual(resumen.mora.importe, mora, "la franja de la mora");
  igual(resumen.deudores.total, mora, "el total de Deudores");
  igual(suma(resumen.deudores.filas.map((f) => f.mora.importe)) + (resumen.deudores.otros?.mora.importe ?? 0), mora, "la suma de las filas de Deudores");
  igual(vencidos.total.importe, mora, "el filtro «en mora»");
  igual(suma(vencidos.filas.map((f) => f.saldo)), mora, "las filas del filtro «en mora»");
  igual(clientes.totales.mora.importe, mora, "la columna En mora de Clientes");
  igual(conMora.totales.mora.importe, mora, "la columna En mora de Clientes con mora");
  igual(suma(clientes.filas.map((f) => f.mora.importe)), mora, "las filas de la columna En mora");
  igual(deMora.importe, mora, "el desglose de la mora");
  igual(sumaDelDesglose(deMora), mora, "las partidas del desglose de la mora");
  igual(suma(tramos.slice(1)), mora, "los cuatro tramos vencidos suman la mora (X2)");

  // El saldo: Σ tramos = Σ comprobantes = Σ clientes = desglose (X1, X3).
  const deSaldo = vistaDesglose(DATOS, corte, { clave: "saldo" });
  igual(resumen.saldo.importe, saldo, "el saldo del resumen");
  igual(resumen.regla.total, saldo, "la regla suma el saldo (X1)");
  igual(suma(tramos), saldo, "los cinco tramos suman el saldo");
  igual(todos.total.importe, saldo, "el total de «todos» los comprobantes");
  igual(suma(todos.filas.map((f) => f.saldo)), saldo, "las filas de Comprobantes");
  igual(clientes.totales.saldo.importe, saldo, "la columna Saldo de Clientes");
  igual(deSaldo.importe, saldo, "el desglose del saldo");
  igual(sumaDelDesglose(deSaldo), saldo, "las partidas del desglose del saldo");

  // Cada tramo: la regla = su filtro de Comprobantes = su desglose; los conteos de las pastillas coinciden con las filas.
  resumen.regla.filas.forEach((f, i) => {
    const lista = listas.get(f.tramo);
    igual(lista?.total.importe, f.cifra.importe, `Comprobantes en ${f.tramo}`);
    igual(lista?.filas.length, f.cantidad, `la cantidad del tramo ${f.tramo}`);
    igual(todos.pastillas.find((p) => p.filtro === f.tramo)?.cantidad, f.cantidad, `la pastilla del tramo ${f.tramo}`);
    const d = vistaDesglose(DATOS, corte, { clave: `tramo-${f.tramo}` as ClaveDeMedida });
    igual(d.importe, f.cifra.importe, `el desglose de ${f.tramo}`);
    igual(d.cantidadDePartidas, f.cantidad, `las partidas del desglose de ${f.tramo}`);
    igual(f.cifra.importe, valor(`tramo-${TRAMOS[i]?.clave}` as ClaveDeMedida), `el tramo ${i}`);
  });
  igual(todos.pastillas[0]?.cantidad, suma(resumen.regla.filas.map((f) => f.cantidad)), "«todos» cuenta los cinco tramos");
  igual(todos.pastillas[1]?.cantidad, vencidos.filas.length, "«en mora» cuenta sus filas");
  if (saldo > 0) igual(suma(resumen.regla.filas.map((f) => f.milesimas ?? 0)), 1000, "la regla suma 100,0 %");

  // Deudores: cada cliente con su mora, sus días y su tramo; «Otros» por resta; los porcentajes suman 100,0 %.
  const clientesConMora = DATOS.clientes.filter((c) => valor("mora", c.id) > 0).length;
  igual(resumen.deudores.clientes, clientesConMora, "cuántos clientes tienen mora");
  igual(resumen.clientesEnMora, clientesConMora, "cuántos clientes tienen mora (resumen)");
  igual(conMora.filas.length, clientesConMora, "los clientes de «con mora»");
  igual(resumen.deudores.otros !== null, claves.includes("mora-otros"), "«Otros» existe cuando mora-otros existe");
  igual(resumen.deudores.filas.length, Math.min(5, clientesConMora), "hasta cinco deudores");
  if (resumen.deudores.otros !== null) {
    igual(resumen.deudores.otros.mora.importe, valor("mora-otros"), "el importe de «Otros»");
    igual(resumen.deudores.otros.clientes, clientesConMora - 5, "los clientes de «Otros»");
    igual(resumen.deudores.otros.comprobantes, vistaDesglose(DATOS, corte, { clave: "mora-otros" }).cantidadDePartidas, "los comprobantes de «Otros»");
  }
  for (const f of resumen.deudores.filas) {
    const lista = vistaDesglose(DATOS, corte, { clave: "mora", clienteId: f.clienteId });
    igual(lista.modo, "partidas", `la mora de ${f.clienteId} es una lista`);
    if (lista.modo === "partidas") {
      const masViejo = lista.partidas[0]?.detalle;
      igual(masViejo?.tipo === "saldo" ? masViejo.atraso : undefined, f.diasDelMasAtrasado, `los días del más atrasado de ${f.clienteId}`);
      igual(lista.partidas.length, f.comprobantes, `los comprobantes vencidos de ${f.clienteId}`);
    }
  }
  if (mora > 0) {
    igual(suma(resumen.deudores.filas.map((f) => f.milesimas ?? 0)) + (resumen.deudores.otros?.milesimas ?? 0), 1000, "Deudores suma 100,0 %");
    if (deMora.modo === "por-cliente") igual(suma(deMora.filas.map((f) => f.milesimas ?? 0)), 1000, "«Por cliente» de la mora suma 100,0 %");
  }

  // Para revisar: los totales son las medidas y los clientes son los mismos que pide revisar la lista de Clientes y la insignia.
  const revisar = resumen.paraRevisar;
  igual(suma(revisar.pagosACuenta.filas.map((f) => f.importe)), revisar.pagosACuenta.total.importe, "las filas de pagos a cuenta suman su total");
  igual(suma(revisar.saldosAFavor.filas.map((f) => f.importe)), revisar.saldosAFavor.total.importe, "las filas de saldos a favor suman su total");
  for (const f of [...revisar.pagosACuenta.filas, ...revisar.saldosAFavor.filas]) {
    if (f.desglose !== null) igual(f.importe, valor(f.desglose.clave, f.desglose.clienteId), `el desglose de ${f.reciboId} vale lo que la fila`);
  }
  const clientesPorRevisar = [...new Set([...revisar.pagosACuenta.filas, ...revisar.saldosAFavor.filas].map((f) => f.clienteId))].sort().join(",");
  igual(aRevisar.filas.map((f) => f.clienteId).sort().join(","), clientesPorRevisar, "Clientes «para revisar» son los de «Para revisar»");
  igual(cantidadParaRevisar(DATOS, corte), aRevisar.filas.length, "la insignia de Clientes");
  igual(clientes.pastillas.find((p) => p.filtro === "revisar")?.cantidad, aRevisar.filas.length, "la pastilla «para revisar»");
  igual(clientes.pastillas.find((p) => p.filtro === "con-mora")?.cantidad, clientesConMora, "la pastilla «con mora»");
  igual(clientes.pastillas.find((p) => p.filtro === "todos")?.cantidad, DATOS.clientes.length, "la pastilla «todos»");

  // El movimiento del mes y los doce meses.
  igual(resumen.movimiento.facturacion.importe, valor("facturacion-mes"), "la facturación del mes");
  igual(resumen.movimiento.comprobantes, vistaDesglose(DATOS, corte, { clave: "facturacion-mes" }).cantidadDePartidas, "los comprobantes del mes");
  igual(resumen.movimiento.cobranza.importe, valor("cobranza-mes"), "la cobranza del mes");
  igual(resumen.movimiento.recibos, vistaDesglose(DATOS, corte, { clave: "cobranza-mes" }).cantidadDePartidas, "los recibos del mes");
  igual(JSON.stringify(resumen.meses), JSON.stringify(meses), "el gráfico del Resumen es el de Meses");
  igual(meses.meses.at(-1)?.facturacion.importe, resumen.movimiento.facturacion.importe, "el último mes es el movimiento del mes");
  for (const [campo, clave] of [["facturacion", "facturacion-mes"], ["facturadoConIva", "facturado-con-iva-mes"], ["cobranza", "cobranza-mes"], ["retenciones", "retenciones-mes"]] as const) {
    const primero = meses.meses[0]?.mes;
    const ultimo = meses.meses.at(-1)?.mes;
    if (primero !== undefined && ultimo !== undefined) igual(meses.totales[campo], valorDelPeriodo(DATOS, corte, clave, primero, ultimo), `el total de ${clave} es el del período (X6)`);
    igual(meses.totales[campo], suma(meses.meses.map((m) => m[campo].importe)), `el total de ${clave} suma sus meses`);
  }

  // ---------------------------------------------------------------------------------------------------------------------------
  // Los 13 clientes
  // ---------------------------------------------------------------------------------------------------------------------------
  const delCliente = new Map(DATOS.clientes.map((c) => [c.id, vistaCliente(DATOS, corte, c.id)] as const));
  const hojasDeSaldo = new Map<string, { saldo: number; atraso: number }>();
  for (const [id, v] of delCliente) {
    recorrer(v, `cliente ${id}`);
    for (const f of v.comprobantesConSaldo.filas) hojasDeSaldo.set(f.comprobanteId, { saldo: f.saldo, atraso: f.atraso });
    igual(suma(v.comprobantesConSaldo.filas.map((f) => f.saldo)), v.saldo.importe, `las filas de saldo de ${id} suman su saldo`);
    igual(v.regla.total, v.saldo.importe, `los tramos de ${id} suman su saldo`);
    const aCuenta = v.recibos.totales.aCuenta;
    igual(v.cuentaCorriente.saldoFinal.importe, v.saldo.importe - aCuenta, `la cuenta corriente de ${id} termina en saldo − a cuenta`);
    igual(v.cuentaCorriente.movimientos.at(-1)?.saldo ?? 0, v.cuentaCorriente.saldoFinal.importe, `el último saldo corrido de ${id}`);
    igual(suma(v.cuentaCorriente.movimientos.map((m) => m.debe - m.haber)), v.cuentaCorriente.saldoFinal.importe, `debe − haber de ${id}`);
    igual(v.sinImputar === null, aCuenta === 0, `lo cobrado sin imputar de ${id}`);
    if (v.sinImputar !== null) {
      igual(v.sinImputar.importe.importe, aCuenta, `el importe sin imputar de ${id}`);
      igual(v.sinImputar.saldoNeto.importe, v.cuentaCorriente.saldoFinal.importe, `el saldo neto de ${id}`);
    }
    igual(suma(v.recibos.filas.map((f) => suma(f.medios.map((m) => m.importe)))), v.recibos.totales.imputado + aCuenta, `los recibos de ${id}: medios = imputado + a cuenta`);
    igual(v.facturacion.total, suma(v.facturacion.meses.map((m) => m.facturacion.importe)), `la facturación de ${id}`);
    const fila = clientes.filas.find((f) => f.clienteId === id);
    igual(fila?.saldo.importe, v.saldo.importe, `Clientes y la ficha de ${id}: saldo`);
    igual(fila?.mora.importe, v.mora.importe, `Clientes y la ficha de ${id}: mora`);
    igual(JSON.stringify(fila?.regla), JSON.stringify(v.regla), `Clientes y la ficha de ${id}: regla`);
    igual(fila?.estado === null, v.sinImputar === null, `Clientes y la ficha de ${id}: estado`);
  }
  const fichas = [...delCliente.values()];
  igual(suma(fichas.map((v) => v.saldo.importe)), saldo, "Σ saldo de los clientes = saldo de la empresa (X3)");
  igual(suma(fichas.map((v) => v.mora.importe)), mora, "Σ mora de los clientes = mora de la empresa (X3)");
  igual(suma(fichas.map((v) => v.cuentaCorriente.saldoFinal.importe)), valor("saldo-neto"), "Σ cuentas corrientes = saldo neto de la empresa (X4)");
  igual(suma(fichas.map((v) => v.facturacion.total)), meses.totales.facturacion, "Σ facturación de los clientes = la de la empresa (X3)");
  resumen.regla.filas.forEach((f, i) => igual(suma(fichas.map((v) => v.regla.filas[i]?.cifra.importe ?? 0)), f.cifra.importe, `Σ del tramo ${f.tramo} de los clientes`));
  meses.meses.forEach((m, i) => igual(suma(fichas.map((v) => v.facturacion.meses[i]?.facturacion.importe ?? 0)), m.facturacion.importe, `Σ clientes en ${m.mes}`));
  igual(JSON.stringify(reglaDeTramos(DATOS, corte)), JSON.stringify(resumen.regla), "la regla de la empresa es la misma en todas las pantallas");

  // ---------------------------------------------------------------------------------------------------------------------------
  // Los 690 comprobantes
  // ---------------------------------------------------------------------------------------------------------------------------
  const cierres = new Set(cierresDeMes(DATOS));
  const filasDeLaLista = new Map(todos.filas.map((f) => [f.comprobanteId, f] as const));
  let saldoDeLosComprobantes = 0;
  let conSaldo = 0;
  for (const c of DATOS.comprobantes) {
    const v = vistaComprobante(DATOS, corte, c.id);
    if (v.clase === "posterior-al-corte") {
      igual(c.emision > corte, true, `${c.id} es posterior al corte`);
      igual(cierres.has(v.verAl) && v.verAl >= c.emision && v.verAl.slice(0, 7) === c.emision.slice(0, 7), true, `«Verlo al» de ${c.id} es el cierre de su mes`);
    } else if (v.clase === "nota-de-credito") {
      igual(c.tipo === 3 && c.emision <= corte, true, `${c.id} es una nota de crédito que existe`);
    } else {
      const saldoDeMovimientos = suma(v.movimientos.map((m) => m.debe - m.haber));
      igual(v.situacion.saldo, saldoDeMovimientos, `el saldo de ${c.id} es el de sus movimientos`);
      igual(v.movimientos.at(-1)?.saldo, v.situacion.saldo, `el último saldo corrido de ${c.id}`);
      const fila = filasDeLaLista.get(c.id);
      if (v.situacion.estado === "con-saldo") {
        conSaldo += 1;
        saldoDeLosComprobantes += v.situacion.saldo;
        igual(fila?.saldo, v.situacion.saldo, `Comprobantes y la ficha de ${c.id}: saldo`);
        igual(fila?.atraso, v.situacion.atraso, `Comprobantes y la ficha de ${c.id}: atraso`);
        igual(fila?.tramo, v.situacion.tramo, `Comprobantes y la ficha de ${c.id}: tramo`);
        igual(hojasDeSaldo.get(c.id)?.saldo, v.situacion.saldo, `la hoja del cliente y la ficha de ${c.id}: saldo`);
        igual(hojasDeSaldo.get(c.id)?.atraso, v.situacion.atraso, `la hoja del cliente y la ficha de ${c.id}: atraso`);
      } else {
        igual(fila === undefined && !hojasDeSaldo.has(c.id), true, `${c.id} no tiene saldo y no figura en ninguna lista`);
      }
      for (const m of v.posteriores) igual(m.fecha > corte && m.saldo === null, true, `los posteriores de ${c.id} no cuentan`);
    }
  }
  igual(saldoDeLosComprobantes, saldo, "Σ saldo de los comprobantes = saldo de la empresa");
  igual(conSaldo, todos.filas.length, "los comprobantes con saldo son las filas de la lista");

  // ---------------------------------------------------------------------------------------------------------------------------
  // Los desgloses: todas las medidas de la empresa (y los doce meses de las del mes) y de cada cliente
  // ---------------------------------------------------------------------------------------------------------------------------
  for (const clave of claves) {
    for (const mes of esClaveDelMes(clave) ? meses.meses.map((m) => m.mes) : [undefined]) {
      const v = vistaDesglose(DATOS, corte, mes === undefined ? { clave } : { clave, mes });
      recorrer(v, `desglose ${clave} ${mes ?? ""}`);
      igual(v.importe, valor(clave, undefined, mes), `el desglose de ${clave} ${mes ?? ""}`);
      igual(sumaDelDesglose(v), v.importe, `las partidas del desglose de ${clave} ${mes ?? ""}`);
      if (v.modo === "por-cliente") igual(suma(v.filas.map((f) => f.cantidad)), v.cantidadDePartidas, `las partidas por cliente de ${clave} ${mes ?? ""}`);
    }
    if (clave === "mora-otros") continue;
    for (const c of DATOS.clientes) {
      const v = vistaDesglose(DATOS, corte, { clave, clienteId: c.id });
      recorrer(v, `desglose ${clave} ${c.id}`);
      igual(v.importe, valor(clave, c.id), `el desglose de ${clave} de ${c.id}`);
      igual(sumaDelDesglose(v), v.importe, `las partidas del desglose de ${clave} de ${c.id}`);
      igual(v.modo === "por-cliente", false, `el desglose de ${clave} de ${c.id} no se agrupa por cliente`);
    }
  }

  // ---------------------------------------------------------------------------------------------------------------------------
  // Los valores fijados de la semilla publicada
  // ---------------------------------------------------------------------------------------------------------------------------
  if (corte === ESPERADO.corte) {
    igual(resumen.mora.importe, ESPERADO.mora.importe, "esperado: la mora");
    igual(resumen.saldo.importe, ESPERADO.saldo, "esperado: el saldo");
    igual(resumen.moraSobreSaldo, ESPERADO.mora.milesimasDelSaldo, "esperado: la mora sobre el saldo");
    igual(suma(fichas.map((v) => v.cuentaCorriente.saldoFinal.importe)), ESPERADO.saldoNeto, "esperado: el saldo neto");
    for (const f of resumen.regla.filas) {
      igual(f.cifra.importe, ESPERADO.tramos[f.tramo], `esperado: el tramo ${f.tramo}`);
      igual(f.milesimas, ESPERADO.milesimasDeTramos[f.tramo], `esperado: el porcentaje del tramo ${f.tramo}`);
    }
    resumen.deudores.filas.forEach((f, i) => {
      const esperado = ESPERADO.deudores[i];
      igual(f.clienteId, esperado?.clienteId, `esperado: el deudor ${i + 1}`);
      igual(f.mora.importe, esperado?.importe, `esperado: la mora del deudor ${i + 1}`);
      igual(f.milesimas, esperado?.milesimas, `esperado: el porcentaje del deudor ${i + 1}`);
      igual(f.diasDelMasAtrasado, esperado?.diasDelMasAtrasado, `esperado: los días del deudor ${i + 1}`);
      igual(f.tramoMasAntiguo, esperado?.tramoMasAntiguo, `esperado: el tramo del deudor ${i + 1}`);
    });
    igual(resumen.deudores.otros?.mora.importe, ESPERADO.otros.importe, "esperado: «Otros»");
    igual(resumen.deudores.otros?.clientes, ESPERADO.otros.clientes, "esperado: los clientes de «Otros»");
    igual(resumen.paraRevisar.pagosACuenta.total.importe, ESPERADO.pagosACuenta.importe, "esperado: pagos a cuenta");
    igual(resumen.paraRevisar.saldosAFavor.total.importe, ESPERADO.saldosAFavor.importe, "esperado: saldos a favor");
    igual(resumen.movimiento.facturacion.importe, ESPERADO.octubre.facturacion, "esperado: facturación de octubre");
    igual(resumen.movimiento.cobranza.importe, ESPERADO.octubre.cobranza, "esperado: cobranza de octubre");
    igual(resumen.movimiento.retenciones.importe, ESPERADO.octubre.retenciones, "esperado: retenciones de octubre");
    igual(delCliente.get("C05")?.saldo.importe, ESPERADO.c05.saldo, "esperado: saldo de C05");
    igual(delCliente.get("C05")?.mora.importe, ESPERADO.c05.mora, "esperado: mora de C05");
    igual(delCliente.get("C05")?.cuentaCorriente.movimientos.length, ESPERADO.c05.movimientos, "esperado: movimientos de C05");
    igual(delCliente.get("C05")?.recibos.filas.length, ESPERADO.c05.recibos, "esperado: recibos de C05");
  }

  return { comparaciones, fallos };
}

describe("las pantallas contra el dominio, en los 22 cierres de mes (semilla publicada)", () => {
  const cierres = cierresDeMes(DATOS);
  let milisegundos = 0;
  let comparaciones = 0;

  it("son 22 cierres, con el 31/10/2026 al final", () => {
    expect(cierres).toHaveLength(22);
    expect(cierres.at(-1)).toBe(CORTE);
  });

  it.each(cierres)("cierre %s: cada cifra de cada pantalla es la del dominio y la misma cifra vale lo mismo en todas", { timeout: 60_000 }, (corte) => {
    const inicio = performance.now();
    const r = verificarCierre(corte);
    milisegundos += performance.now() - inicio;
    comparaciones += r.comparaciones;
    expect(r.fallos).toEqual([]);
    expect(r.comparaciones).toBeGreaterThan(1_000);
  });

  it("se hicieron miles de comparaciones", () => {
    console.log(`Propiedad de cifras: ${comparaciones} comparaciones en ${Math.round(milisegundos)} ms (22 cierres).`);
    expect(comparaciones).toBeGreaterThan(20_000);
  });

  // Tope de tiempo de pared muy holgado: solo detecta una regresión de orden de magnitud (en reposo tarda ~10 s); no es una garantía de velocidad.
  it("no se fue de orden de magnitud en tiempo (menos de 120 s)", () => {
    expect(milisegundos).toBeLessThan(120_000);
  });
});

describe("si algo no cierra, ninguna pantalla entrega números (D2)", () => {
  function conMedidaRota<T>(f: () => T): void {
    forzar.medida = true;
    try {
      expect(f).toThrow(ErrorDeCierre);
    } finally {
      forzar.medida = false;
    }
  }

  it("con una medida que no cierra, las secciones y los desgloses lanzan ErrorDeCierre en vez de mostrar una cifra", () => {
    conMedidaRota(() => vistaResumen(DATOS, CORTE));
    conMedidaRota(() => vistaMeses(DATOS, CORTE));
    conMedidaRota(() => vistaClientes(DATOS, CORTE, { filtro: "todos", q: "" }));
    conMedidaRota(() => vistaComprobantes(DATOS, CORTE, { tramo: "todos", q: "" }));
    conMedidaRota(() => vistaCliente(DATOS, CORTE, "C05"));
    conMedidaRota(() => vistaDesglose(DATOS, CORTE, { clave: "mora" }));
    conMedidaRota(() => reglaDeTramos(DATOS, CORTE));
  });

  it("con el saldo del dominio distinto del que dan los movimientos, la pantalla de un comprobante lanza ErrorDeCierre", () => {
    const id = DATOS.comprobantes.find((c) => c.tipo === 1)?.id ?? "";
    expect(() => vistaComprobante(DATOS, CORTE, id)).not.toThrow();
    forzar.saldo = true;
    try {
      expect(() => vistaComprobante(DATOS, CORTE, id)).toThrow(ErrorDeCierre);
    } finally {
      forzar.saldo = false;
    }
  });

  it("los interruptores quedan apagados: las vistas vuelven a funcionar", () => {
    expect(vistaResumen(DATOS, CORTE).mora.importe).toBe(ESPERADO.mora.importe);
  });
});
