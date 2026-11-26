// Oráculo independiente de las cifras de la demo (docs/diseno.md, 5.4 y G3): recalcula las 15 medidas del catálogo desde los datos crudos con otra
// forma de contar, para verificar el resultado de referencia de la semilla publicada y, de paso, a los dos caminos de `src/lib/dominio`.
//
// Independencia: no importa NADA de `src/lib/dominio` (ni de `src/lib` en general). Trabaja con enteros de centavos y con días enteros contados desde
// 1970 (`Date.UTC` solo para pasar `AAAA-MM-DD` a un número de día) y arma un libro mayor: el saldo de una factura es lo que queda después de
// aplicarle sus notas de crédito y sus imputaciones, y de ahí se acumula por cliente y para la empresa en una sola pasada. No es código de
// producción: es la verificación de la verificación. Las claves de la salida son las del catálogo (4.2).

const diaDe = (fecha) => Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10))) / 86_400_000;
const ES_RETENCION = new Set(["retencion-iibb", "retencion-ganancias", "retencion-iva"]);
const CLAVES = ["saldo", "mora", "tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90", "pagos-a-cuenta", "saldos-a-favor", "saldo-neto", "facturacion-mes", "facturado-con-iva-mes", "iva-mes", "cobranza-mes", "retenciones-mes"];
const CLAVES_DE_TRAMO = ["tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90"];

/** Tramo (A1) de un atraso en días: 0 no vencido, 1 de 1 a 30, 2 de 31 a 60, 3 de 61 a 90, 4 más de 90. */
function tramoDe(atraso) {
  if (atraso <= 0) return 0;
  if (atraso <= 30) return 1;
  if (atraso <= 60) return 2;
  if (atraso <= 90) return 3;
  return 4;
}

const ceros = () => Object.fromEntries(CLAVES.map((k) => [k, 0]));

/**
 * El oráculo no se fía de los campos derivados de cada comprobante: recalcula con enteros el IVA (21 % del neto, la mitad hacia
 * arriba), el total (neto + IVA) y el vencimiento (emisión + plazo del cliente; la nota de crédito vence el día de su emisión) y, si no coinciden con
 * los del dato, lanza. Así un error de la numeración (M2, C4) no pasa de largo porque los dos caminos y el oráculo lean el mismo dato equivocado.
 */
function verificarDerivados(c, plazos) {
  const iva = Math.floor((c.neto * 21 + 50) / 100);
  if (c.iva !== iva) throw new Error(`Oráculo: el IVA de ${c.id} es ${c.iva} y recalculado da ${iva}.`);
  if (c.total !== c.neto + iva) throw new Error(`Oráculo: el total de ${c.id} es ${c.total} y neto + IVA da ${c.neto + iva}.`);
  const plazo = plazos[c.clienteId];
  if (plazo === undefined) throw new Error(`Oráculo: ${c.id} es de un cliente que no existe (${c.clienteId}).`);
  const vencimiento = new Date((diaDe(c.emision) + (c.tipo === 3 ? 0 : plazo)) * 86_400_000).toISOString().slice(0, 10);
  if (c.vencimiento !== vencimiento) throw new Error(`Oráculo: el vencimiento de ${c.id} es ${c.vencimiento} y recalculado da ${vencimiento}.`);
}

// Los datos no cambian: lo que cada factura recibe (notas de crédito e imputaciones) se arma una vez por conjunto.
const INDICES = new WeakMap();
function indiceDe(datos) {
  if (INDICES.has(datos)) return INDICES.get(datos);
  const notas = new Map();
  const imputaciones = new Map();
  const plazos = Object.fromEntries(datos.clientes.map((c) => [c.id, c.plazoDias]));
  for (const c of datos.comprobantes) {
    verificarDerivados(c, plazos);
    if (c.tipo === 3) notas.set(c.asociadoA, [...(notas.get(c.asociadoA) ?? []), { fecha: c.emision, importe: c.total }]);
  }
  for (const r of datos.recibos) {
    for (const i of r.imputaciones) imputaciones.set(i.comprobanteId, [...(imputaciones.get(i.comprobanteId) ?? []), { fecha: r.fecha, importe: i.importe }]);
  }
  const indice = { notas, imputaciones };
  INDICES.set(datos, indice);
  return indice;
}

/**
 * Las cifras de la empresa y de cada cliente al `corte` (cualquier fecha civil válida), cuántos comprobantes y clientes están en mora, y la mora de
 * cada cliente con su comprobante más atrasado.
 */
export function calcularOraculo(datos, corte) {
  const { notas, imputaciones } = indiceDe(datos);
  const hoy = diaDe(corte);
  const mes = corte.slice(0, 7);
  const empresa = ceros();
  const porCliente = Object.fromEntries(datos.clientes.map((c) => [c.id, ceros()]));
  const libro = Object.fromEntries(datos.clientes.map((c) => [c.id, { debe: 0, aCuenta: 0 }]));
  const moraPorCliente = {};
  let comprobantesEnMora = 0;
  /** Suma `importe` a la clave, en la empresa y en el cliente. */
  const sumar = (clienteId, clave, importe) => {
    empresa[clave] += importe;
    porCliente[clienteId][clave] += importe;
  };

  for (const f of datos.comprobantes) {
    if (f.emision > corte) continue;
    // Facturación del mes (sin IVA, IVA y con IVA): las notas de crédito restan.
    if (f.emision.slice(0, 7) === mes) {
      const signo = f.tipo === 3 ? -1 : 1;
      sumar(f.clienteId, "facturacion-mes", signo * f.neto);
      sumar(f.clienteId, "iva-mes", signo * f.iva);
      sumar(f.clienteId, "facturado-con-iva-mes", signo * f.total);
    }
    if (f.tipo === 3) continue;
    let saldo = f.total;
    for (const nc of notas.get(f.id) ?? []) if (nc.fecha <= corte) saldo -= nc.importe;
    for (const i of imputaciones.get(f.id) ?? []) if (i.fecha <= corte) saldo -= i.importe;
    libro[f.clienteId].debe += saldo;
    sumar(f.clienteId, "saldo", saldo);
    if (saldo <= 0) continue;
    const atraso = hoy - diaDe(f.vencimiento);
    sumar(f.clienteId, CLAVES_DE_TRAMO[tramoDe(atraso)], saldo);
    if (atraso >= 1) {
      sumar(f.clienteId, "mora", saldo);
      comprobantesEnMora += 1;
      const m = (moraPorCliente[f.clienteId] ??= { importe: 0, masAtrasado: { id: "", atraso: -Infinity } });
      m.importe += saldo;
      if (atraso > m.masAtrasado.atraso) m.masAtrasado = { id: f.id, atraso };
    }
  }

  for (const r of datos.recibos) {
    if (r.fecha > corte) continue;
    const cobrado = r.medios.reduce((s, m) => s + m.importe, 0);
    const imputado = r.imputaciones.reduce((s, i) => s + i.importe, 0);
    libro[r.clienteId].aCuenta += cobrado - imputado;
    if (r.fecha.slice(0, 7) === mes) {
      sumar(r.clienteId, "cobranza-mes", cobrado);
      sumar(r.clienteId, "retenciones-mes", r.medios.filter((m) => ES_RETENCION.has(m.medio)).reduce((s, m) => s + m.importe, 0));
    }
  }

  // El a cuenta de cada cliente va a «pagos a cuenta» si el cliente debe algo y a «saldos a favor» si no (R4: se decide por el cliente).
  for (const [id, { debe, aCuenta }] of Object.entries(libro)) {
    sumar(id, debe > 0 ? "pagos-a-cuenta" : "saldos-a-favor", aCuenta);
    sumar(id, "saldo-neto", debe - aCuenta);
  }
  return { empresa, porCliente, comprobantesEnMora, clientesEnMora: Object.keys(moraPorCliente).length, moraPorCliente };
}
