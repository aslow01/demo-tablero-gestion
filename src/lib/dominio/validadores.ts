// Validadores de un conjunto de datos (docs/diseno.md: C2, C3, R1, R3 y los de G5, más C4). No lanzan, tampoco con importes que no son
// enteros, que pasan el tope o con un plazo inválido: devuelven la lista de problemas, cada uno con la regla, el dato dañado (el id del
// comprobante, del recibo o del cliente) y un mensaje que lo nombra.
//
// Independencia: lo que este módulo calcula por su cuenta, a propósito, son los **saldos** (C3, R3, saldo ≥ 0). El id (C2), el vencimiento (C4)
// y el IVA (M2) se comparan con las mismas funciones con las que se numera y se calculan los datos (`idComprobante`, `vencimientoDe`,
// `calcularIva`): un error en ellas no lo vería este módulo, lo ven los tests de valores literales de esas funciones.
//
// Saldos: C3 y R3 piden el saldo de una factura «a la fecha» de una nota o de un recibo. `corte.ts` calcula el saldo al corte de
// otra manera; este módulo lo recorre por su cuenta, a propósito, para que el validador no dependa del código que valida. El orden de
// los hechos sobre una factura es el de la cuenta corriente (4.1): por fecha y, el mismo día, primero los comprobantes y después los
// recibos, y dentro de cada grupo por id. Cada hecho se compara con el saldo que quedó **antes** de él; el que se pasa se informa y no
// se descuenta. Como el saldo solo baja con esos hechos, «ningún hecho se pasa» es lo mismo que «saldo ≥ 0 en todos los cortes» (G5).
//
// Fuera de este módulo, a propósito: el rango de fechas (G2) y el desempate de la numeración del mismo día son del generador, no
// una propiedad de cualquier conjunto de datos.

import { comparar, idComprobante, leerIdRecibo, vencimientoDe } from "./comprobantes.ts";
import { TOPE_CENTAVOS, calcularIva, centavos, formatearImporte, restar, sumar, sumarLista } from "./dinero.ts";
import type { Centavos } from "./dinero.ts";
import { parsearFechaCivil } from "./fechas.ts";
import type { Comprobante, Datos, FechaCivil, TipoCmp } from "./tipos.ts";

export type ReglaValidada = "C2" | "C3" | "C4" | "R1" | "R3" | "G5";

export interface Problema {
  regla: ReglaValidada;
  /** El id del comprobante, del recibo o del cliente dañado (o el id repetido). */
  dato: string;
  mensaje: string;
}

const NOMBRE_DEL_TIPO: Record<TipoCmp, string> = { 1: "factura", 2: "nota de débito", 3: "nota de crédito" };
const PLURAL_DEL_TIPO: Record<TipoCmp, string> = { 1: "facturas", 2: "notas de débito", 3: "notas de crédito" };

/** Todos los problemas del conjunto, en un orden fijo: estructura (G5 y C4), numeración (C2), recibos (R1) y saldos (C3 y R3). */
export function validarDatos(datos: Datos): Problema[] {
  return [...validarEstructura(datos), ...validarNumeracion(datos), ...validarRecibos(datos), ...validarSaldos(datos)];
}

function primeroPorId(comprobantes: readonly Comprobante[]): Map<string, Comprobante> {
  const mapa = new Map<string, Comprobante>();
  for (const c of comprobantes) if (!mapa.has(c.id)) mapa.set(c.id, c);
  return mapa;
}

// ---------------------------------------------------------------------------------------------------------------------------
// G5 (ids únicos, cliente existente, fechas válidas, IVA y total según M2) y C4 (vencimiento)
// ---------------------------------------------------------------------------------------------------------------------------

function validarEstructura(datos: Datos): Problema[] {
  const problemas: Problema[] = [];
  const clientes = new Map(datos.clientes.map((c) => [c.id, c]));

  for (const cl of datos.clientes) {
    if (!plazoValido(cl.plazoDias)) {
      problemas.push({ regla: "G5", dato: cl.id, mensaje: `El cliente ${cl.id} tiene un plazo de ${cl.plazoDias} días: tiene que ser un entero de 0 o más.` });
    }
  }

  for (const [que, ids] of [
    ["comprobante", datos.comprobantes.map((c) => c.id)],
    ["recibo", datos.recibos.map((r) => r.id)],
  ] as const) {
    const veces = new Map<string, number>();
    for (const id of ids) veces.set(id, (veces.get(id) ?? 0) + 1);
    for (const [id, n] of veces) {
      if (n > 1) problemas.push({ regla: "G5", dato: id, mensaje: `El id ${id} está repetido: lo llevan ${n} ${que === "recibo" ? "recibos" : "comprobantes"}.` });
    }
  }

  for (const c of datos.comprobantes) {
    const cliente = clientes.get(c.clienteId);
    if (cliente === undefined) problemas.push({ regla: "G5", dato: c.id, mensaje: `El comprobante ${c.id} es de un cliente que no existe: ${c.clienteId}.` });
    const fechas: [string, string][] = [["emisión", c.emision], ["vencimiento", c.vencimiento]];
    const fechasValidas = fechas.map(([cual, f]) => {
      const ok = parsearFechaCivil(f) !== null;
      if (!ok) problemas.push({ regla: "G5", dato: c.id, mensaje: `El comprobante ${c.id} tiene una fecha de ${cual} que no existe: ${f}.` });
      return ok;
    });
    if (c.neto < 1) {
      problemas.push({ regla: "G5", dato: c.id, mensaje: `El comprobante ${c.id} tiene un neto de ${formatearImporte(c.neto)}: tiene que ser de 1 centavo o más.` });
    } else {
      const iva = ivaSeguro(c.neto);
      if (iva === null || iva !== c.iva) {
        problemas.push({ regla: "G5", dato: c.id, mensaje: `El IVA del comprobante ${c.id} es ${formatearImporte(c.iva)} y por M2 le corresponde ${iva === null ? "un valor que no se puede calcular" : formatearImporte(iva)}.` });
      }
    }
    if (sumaSegura(c.neto, c.iva) !== c.total) {
      problemas.push({ regla: "G5", dato: c.id, mensaje: `El total del comprobante ${c.id} es ${formatearImporte(c.total)} y no es su neto más su IVA (${formatearImporte(c.neto)} + ${formatearImporte(c.iva)}).` });
    }
    if (cliente !== undefined && plazoValido(cliente.plazoDias) && fechasValidas.every(Boolean)) {
      const esperado = vencimientoDe(c.tipo, c.emision, cliente.plazoDias);
      if (esperado !== c.vencimiento) {
        problemas.push({ regla: "C4", dato: c.id, mensaje: `El vencimiento del comprobante ${c.id} es ${c.vencimiento} y por C4 le corresponde ${esperado}.` });
      }
    }
  }

  for (const r of datos.recibos) {
    if (!clientes.has(r.clienteId)) problemas.push({ regla: "G5", dato: r.id, mensaje: `El recibo ${r.id} es de un cliente que no existe: ${r.clienteId}.` });
    if (parsearFechaCivil(r.fecha) === null) problemas.push({ regla: "G5", dato: r.id, mensaje: `El recibo ${r.id} tiene una fecha que no existe: ${r.fecha}.` });
  }
  return problemas;
}

function plazoValido(plazoDias: number): boolean {
  return Number.isInteger(plazoDias) && plazoDias >= 0;
}

/** Un importe que el dominio acepta como `Centavos`: entero seguro y dentro del tope (M1). */
function esImporteValido(n: number): boolean {
  return Number.isSafeInteger(n) && n >= -TOPE_CENTAVOS && n <= TOPE_CENTAVOS;
}

function ivaSeguro(neto: Centavos): Centavos | null {
  try {
    return calcularIva(neto);
  } catch {
    return null;
  }
}

function sumaSegura(a: Centavos, b: Centavos): Centavos | null {
  try {
    return sumar(a, b);
  } catch {
    return null;
  }
}

/** La suma de una lista de importes, o `null` si algún importe no es válido o la suma (o una suma parcial) pasa el tope. */
function sumaListaSegura(importes: readonly Centavos[]): Centavos | null {
  try {
    return sumarLista(importes);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// C2: numeración correlativa, sin saltos, en orden de emisión, por tipo y punto de venta (y los recibos, R-PV-número)
// ---------------------------------------------------------------------------------------------------------------------------

interface Numerado {
  id: string;
  numero: number;
  fecha: FechaCivil;
}

function validarNumeracion(datos: Datos): Problema[] {
  const problemas: Problema[] = [];

  const series = new Map<string, { nombre: string; items: Numerado[] }>();
  for (const c of datos.comprobantes) {
    let esperado: string | null = null;
    try {
      esperado = idComprobante(c.tipo, c.puntoVenta, c.numero);
    } catch {
      problemas.push({ regla: "C2", dato: c.id, mensaje: `El comprobante ${c.id} tiene un punto de venta o un número fuera de formato (${c.puntoVenta} y ${c.numero}).` });
    }
    if (esperado !== null && esperado !== c.id) {
      problemas.push({ regla: "C2", dato: c.id, mensaje: `El id ${c.id} no coincide con el tipo, el punto de venta y el número del comprobante (le corresponde ${esperado}).` });
    }
    const clave = `${c.tipo}|${c.puntoVenta}`;
    const serie = series.get(clave) ?? { nombre: `${PLURAL_DEL_TIPO[c.tipo]} del punto de venta ${c.puntoVenta}`, items: [] };
    serie.items.push({ id: c.id, numero: c.numero, fecha: c.emision });
    series.set(clave, serie);
  }

  const seriesDeRecibos = new Map<string, { nombre: string; items: Numerado[] }>();
  for (const r of datos.recibos) {
    const leido = leerIdRecibo(r.id);
    if (leido === null) {
      problemas.push({ regla: "C2", dato: r.id, mensaje: `El id de recibo ${r.id} no tiene el formato R-PV-número (cuatro dígitos de punto de venta y ocho de número, desde 1).` });
      continue;
    }
    const serie = seriesDeRecibos.get(String(leido.puntoVenta)) ?? { nombre: `recibos del punto de venta ${leido.puntoVenta}`, items: [] };
    serie.items.push({ id: r.id, numero: leido.numero, fecha: r.fecha });
    seriesDeRecibos.set(String(leido.puntoVenta), serie);
  }

  for (const { nombre, items } of [...series.values(), ...seriesDeRecibos.values()]) revisarSerie(nombre, items, problemas);
  return problemas;
}

function revisarSerie(nombre: string, items: readonly Numerado[], problemas: Problema[]): void {
  const ordenados = [...items].sort((a, b) => a.numero - b.numero);
  let esperado = 1;
  let anterior: Numerado | null = null;
  // El de fecha más alta entre los números anteriores: contra él se compara, así se informan todos los que quedan atrás y no solo el primero.
  let mayor: Numerado | null = null;
  for (const it of ordenados) {
    if (anterior !== null && it.numero === anterior.numero) {
      problemas.push({ regla: "C2", dato: it.id, mensaje: `El número ${it.numero} de las ${nombre} está repetido: ${it.id} y ${anterior.id}.` });
      continue;
    }
    if (it.numero > esperado) {
      const falta = it.numero - 1 === esperado ? `falta el número ${esperado}` : `faltan los números ${esperado} a ${it.numero - 1}`;
      problemas.push({ regla: "C2", dato: it.id, mensaje: `${it.id} salta la numeración de las ${nombre}: ${falta}.` });
    }
    if (mayor !== null && it.fecha < mayor.fecha) {
      problemas.push({ regla: "C2", dato: it.id, mensaje: `${it.id} está fuera de orden: tiene fecha ${it.fecha} y ${mayor.id}, de número menor, tiene fecha ${mayor.fecha}.` });
    }
    if (mayor === null || it.fecha > mayor.fecha) mayor = it;
    esperado = it.numero + 1;
    anterior = it;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// R1: Σ medios = Σ imputaciones + a cuenta, con a cuenta ≥ 0; importes ≥ 1; imputaciones a comprobantes del mismo cliente
// ---------------------------------------------------------------------------------------------------------------------------

/** Qué le pasa a un importe de un medio o de una imputación, dicho para completar «tiene un medio de …»; `null` si está bien (entero, dentro del tope y de 1 centavo o más). */
function defectoDelImporte(importe: number): string | null {
  if (!Number.isSafeInteger(importe)) return `con un importe que no es un entero de centavos (${importe})`;
  if (!esImporteValido(importe)) return `con un importe que supera el tope de ${formatearImporte(centavos(TOPE_CENTAVOS))}`;
  if (importe < 1) return `de ${formatearImporte(centavos(importe))}: los importes son de 1 centavo o más`;
  return null;
}

function validarRecibos(datos: Datos): Problema[] {
  const problemas: Problema[] = [];
  const porId = primeroPorId(datos.comprobantes);
  for (const r of datos.recibos) {
    if (r.medios.length === 0 && r.imputaciones.length === 0) {
      problemas.push({ regla: "R1", dato: r.id, mensaje: `El recibo ${r.id} no cobra nada: no tiene medios ni imputaciones.` });
    }
    for (const m of r.medios) {
      const defecto = defectoDelImporte(m.importe);
      if (defecto !== null) problemas.push({ regla: "R1", dato: r.id, mensaje: `El recibo ${r.id} tiene un medio (${m.medio}) ${defecto}.` });
    }
    for (const i of r.imputaciones) {
      const defecto = defectoDelImporte(i.importe);
      if (defecto !== null) problemas.push({ regla: "R1", dato: r.id, mensaje: `El recibo ${r.id} tiene una imputación a ${i.comprobanteId} ${defecto}.` });
      const c = porId.get(i.comprobanteId);
      if (c === undefined) problemas.push({ regla: "R1", dato: r.id, mensaje: `El recibo ${r.id} imputa al comprobante ${i.comprobanteId}, que no existe.` });
      else if (c.clienteId !== r.clienteId) {
        problemas.push({ regla: "R1", dato: r.id, mensaje: `El recibo ${r.id} es de ${r.clienteId} e imputa al comprobante ${c.id}, que es de otro cliente (${c.clienteId}).` });
      }
    }
    // Las sumas solo se comparan si cada importe ya es válido (los que no, ya se nombraron arriba); una suma que pasa el tope se informa.
    if (!r.medios.every((m) => esImporteValido(m.importe)) || !r.imputaciones.every((i) => esImporteValido(i.importe))) continue;
    const cobrado = sumaListaSegura(r.medios.map((m) => m.importe));
    const imputado = sumaListaSegura(r.imputaciones.map((i) => i.importe));
    if (cobrado === null) {
      problemas.push({ regla: "R1", dato: r.id, mensaje: `Los medios del recibo ${r.id} suman más que el tope de ${formatearImporte(centavos(TOPE_CENTAVOS))}.` });
    } else if (imputado === null) {
      problemas.push({ regla: "R1", dato: r.id, mensaje: `Las imputaciones del recibo ${r.id} suman más que el tope de ${formatearImporte(centavos(TOPE_CENTAVOS))}.` });
    } else if (imputado > cobrado) {
      problemas.push({ regla: "R1", dato: r.id, mensaje: `El recibo ${r.id} imputa ${formatearImporte(imputado)} pero cobra ${formatearImporte(cobrado)}: el a cuenta sería negativo (${formatearImporte(restar(cobrado, imputado))}).` });
    }
  }
  return problemas;
}

// ---------------------------------------------------------------------------------------------------------------------------
// C3 (notas) y R3 (imputaciones): nada se pasa del saldo de la factura a su fecha
// ---------------------------------------------------------------------------------------------------------------------------

interface Hecho {
  fecha: FechaCivil;
  /** 0 = comprobante (una NC), 1 = recibo: el mismo día, primero los comprobantes. */
  orden: 0 | 1;
  /** Id de la NC o del recibo. */
  id: string;
  importe: Centavos;
}

function validarSaldos(datos: Datos): Problema[] {
  const problemas: Problema[] = [];
  const porId = primeroPorId(datos.comprobantes);
  const hechosPorDestino = new Map<string, Hecho[]>();
  const agregar = (destino: string, hecho: Hecho): void => {
    const lista = hechosPorDestino.get(destino) ?? [];
    lista.push(hecho);
    hechosPorDestino.set(destino, lista);
  };

  for (const c of datos.comprobantes) {
    if (c.tipo === 1) continue;
    const nombre = NOMBRE_DEL_TIPO[c.tipo];
    if (c.asociadoA === null) {
      if (c.tipo === 3) problemas.push({ regla: "C3", dato: c.id, mensaje: `La nota de crédito ${c.id} está sin factura asociada: una NC siempre es de una factura.` });
      continue;
    }
    const factura = porId.get(c.asociadoA);
    if (factura === undefined) {
      problemas.push({ regla: "C3", dato: c.id, mensaje: `La ${nombre} ${c.id} está asociada a ${c.asociadoA}, que no existe.` });
    } else if (factura.tipo !== 1) {
      problemas.push({ regla: "C3", dato: c.id, mensaje: `La ${nombre} ${c.id} está asociada a ${factura.id}, que no es una factura sino una ${NOMBRE_DEL_TIPO[factura.tipo]}.` });
    } else if (factura.clienteId !== c.clienteId) {
      problemas.push({ regla: "C3", dato: c.id, mensaje: `La ${nombre} ${c.id} es de ${c.clienteId} y está asociada a la factura ${factura.id}, que es de otro cliente (${factura.clienteId}).` });
    } else if (c.tipo === 3 && c.emision < factura.emision) {
      problemas.push({ regla: "C3", dato: c.id, mensaje: `La nota de crédito ${c.id} (${c.emision}) es anterior a su factura ${factura.id} (${factura.emision}).` });
    } else if (c.tipo === 3 && esImporteValido(c.total) && c.total >= 1) {
      // Una NC con total dañado ya la nombra G5 (el total no es neto + IVA); acá no se puede restar.
      agregar(factura.id, { fecha: c.emision, orden: 0, id: c.id, importe: c.total });
    }
  }

  for (const r of datos.recibos) {
    for (const i of r.imputaciones) {
      const destino = porId.get(i.comprobanteId);
      if (destino === undefined) continue; // lo informa R1
      if (destino.tipo === 3) {
        problemas.push({ regla: "R3", dato: r.id, mensaje: `El recibo ${r.id} imputa al comprobante ${destino.id}, que es una nota de crédito: no tiene saldo para imputar.` });
        continue;
      }
      if (destino.emision > r.fecha) {
        problemas.push({ regla: "R3", dato: r.id, mensaje: `El recibo ${r.id} (${r.fecha}) imputa al comprobante ${destino.id}, emitido después, el ${destino.emision}.` });
      }
      // Un importe dañado (no entero, fuera del tope o menor que 1) ya lo nombra R1: no se resta del saldo.
      if (esImporteValido(i.importe) && i.importe >= 1) agregar(destino.id, { fecha: r.fecha, orden: 1, id: r.id, importe: i.importe });
    }
  }

  for (const [destinoId, hechos] of hechosPorDestino) {
    const destino = porId.get(destinoId);
    if (destino === undefined || !esImporteValido(destino.total)) continue; // un total dañado lo nombra G5
    const ordenados = [...hechos].sort((a, b) => comparar(a.fecha, b.fecha) || a.orden - b.orden || comparar(a.id, b.id));
    let saldo = destino.total;
    for (const h of ordenados) {
      if (h.importe > saldo) {
        problemas.push(
          h.orden === 0
            ? { regla: "C3", dato: h.id, mensaje: `La nota de crédito ${h.id} es de ${formatearImporte(h.importe)} y supera el saldo de su factura ${destino.id} a la fecha de la nota (${h.fecha}), que era de ${formatearImporte(saldo)}.` }
            : { regla: "R3", dato: h.id, mensaje: `El recibo ${h.id} imputa ${formatearImporte(h.importe)} al comprobante ${destino.id}, pero a la fecha del recibo (${h.fecha}) su saldo era de ${formatearImporte(saldo)}.` },
        );
      } else {
        saldo = restar(saldo, h.importe);
      }
    }
  }
  return problemas;
}
