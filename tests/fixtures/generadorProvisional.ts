// Generador mínimo, solo para el test de propiedad de D2 y D3. El generador de verdad (`datos/generador.ts`)
// tiene su orden de azar, su huella y los casos plantados; este no tiene nada de eso, solo busca **variedad** para que las
// propiedades recorran todos los caminos: facturas de 1 a 4 por cliente y mes, cobros puntuales, lentos y morosos, cobros parciales,
// facturas sin cobrar, retenciones (C02), NC parciales y totales (C06), ND (C13), pagos a cuenta y saldos a favor (C07 y C09), un cliente
// que se va (C09) y un cobro posterior al calendario (C05). Los datos tienen que pasar `validarDatos` y el test lo comprueba.
import { crearAzar } from "../../src/lib/datos/azar.ts";
import { calcularIva, centavos, sumar } from "../../src/lib/dominio/dinero.ts";
import type { Centavos } from "../../src/lib/dominio/dinero.ts";
import { sumarDias } from "../../src/lib/dominio/fechas.ts";
import type { Medio, Servicio } from "../../src/lib/dominio/tipos.ts";
import { CLIENTES_DE_PRUEBA, armarDatos } from "./armarDatos.ts";
import type { Armado, ComprobanteDeFixture, ReciboDeFixture } from "./armarDatos.ts";

const HASTA = "2026-10-31";
const SERVICIOS: readonly Servicio[] = ["alquiler-4x4", "traslado-personal", "flete-liviano", "horas-espera", "km-excedentes"];

/** Los 22 meses del calendario fijo, 2025-01 a 2026-10. */
const MESES: string[] = Array.from({ length: 22 }, (_, i) => `${i < 12 ? 2025 : 2026}-${String((i % 12) + 1).padStart(2, "0")}`);

/** Corrimiento del cobro sobre el vencimiento, en días: puntual por defecto, lento, moroso (C05) o con retenciones (C02). */
const CORRIMIENTO: Readonly<Record<string, readonly [number, number]>> = {
  C02: [0, 20],
  C03: [10, 40],
  C05: [45, 90],
  C07: [10, 40],
  C10: [10, 40],
  C11: [10, 40],
};

const total = (neto: Centavos): Centavos => sumar(neto, calcularIva(neto));

export function generarProvisional(semilla: number): Armado {
  const azar = crearAzar(semilla);
  const comprobantes: ComprobanteDeFixture[] = [];
  const recibos: ReciboDeFixture[] = [];
  let numero = 0;

  /** Un recibo que cobra `importe` e imputa todo a `comprobante`; C02 paga con retenciones (R2). */
  const cobrar = (comprobante: string, cliente: string, fecha: string, importe: Centavos): void => {
    const medios: { medio?: Medio; importe: Centavos }[] = [];
    if (cliente === "C02") {
      const iibb = centavos(Math.floor(importe / 50));
      const ganancias = centavos(Math.floor(importe / 100));
      // Una de cada cuatro veces también retiene IVA (el tercer medio de retención, R2; el generador de verdad solo emite IIBB y Ganancias).
      const iva = azar.probabilidad(0.25) ? centavos(Math.floor(importe / 200)) : centavos(0);
      medios.push({ importe: centavos(importe - iibb - ganancias - iva) }, { medio: "retencion-iibb", importe: iibb }, { medio: "retencion-ganancias", importe: ganancias });
      if (iva > 0) medios.push({ medio: "retencion-iva", importe: iva });
    } else {
      medios.push({ medio: azar.probabilidad(0.1) ? "cheque" : "transferencia", importe });
    }
    recibos.push({ cliente, fecha, medios, imputaciones: [{ comprobante, importe }] });
  };

  for (const mes of MESES) {
    for (const cliente of CLIENTES_DE_PRUEBA) {
      if (cliente.id === "C09" && mes >= "2026-08") continue; // un cliente que se fue
      const cantidad = azar.entero(1, 4);
      for (let i = 0; i < cantidad; i++) {
        numero += 1;
        const clave = `F${numero}`;
        const emision = `${mes}-${String(azar.entero(1, 28)).padStart(2, "0")}`;
        const neto = centavos(azar.entero(2_000_000, 90_000_000));
        comprobantes.push({ clave, cliente: cliente.id, emision, neto, servicio: azar.elegir(SERVICIOS) });
        const vencimiento = sumarDias(emision, cliente.plazoDias);
        let aCobrar = total(neto);

        // C06: una de cada ocho facturas lleva una NC parcial o total, siempre antes del cobro.
        if (cliente.id === "C06" && azar.probabilidad(1 / 8)) {
          const ncNeto = centavos(Math.max(1, Math.floor((neto * azar.entero(10, 100)) / 100)));
          const fechaNc = sumarDias(emision, azar.entero(3, 25));
          if (fechaNc <= HASTA) {
            comprobantes.push({ clave: `${clave}-NC`, tipo: 3, cliente: cliente.id, emision: fechaNc, neto: ncNeto, asociadoA: clave });
            aCobrar = centavos(aCobrar - total(ncNeto));
          }
        }

        // C13: una de cada diez facturas tiene una ND, con su propio saldo, cobrada aparte la mayoría de las veces.
        if (cliente.id === "C13" && azar.probabilidad(1 / 10)) {
          const fechaNd = sumarDias(emision, azar.entero(2, 10));
          const ndNeto = centavos(azar.entero(100_000, 5_000_000));
          if (fechaNd <= HASTA) {
            comprobantes.push({ clave: `${clave}-ND`, tipo: 2, cliente: cliente.id, emision: fechaNd, neto: ndNeto, asociadoA: clave });
            const fechaCobroNd = sumarDias(fechaNd, azar.entero(20, 60));
            if (azar.probabilidad(0.7) && fechaCobroNd <= HASTA) cobrar(`${clave}-ND`, cliente.id, fechaCobroNd, total(ndNeto));
          }
        }

        const sinCobrar = cliente.id !== "C09" && azar.probabilidad(0.06); // C09 siempre paga: después de irse queda con saldo 0 y un saldo a favor
        if (aCobrar <= 0 || sinCobrar) continue; // sin cobrar: es la mora natural
        const [minimo, maximo] = CORRIMIENTO[cliente.id] ?? [-5, 0];
        const calculada = sumarDias(vencimiento, azar.entero(minimo, maximo));
        const fecha = calculada < emision ? emision : calculada;
        if (fecha > HASTA) continue;
        if (cliente.id !== "C06" && cliente.id !== "C09" && azar.probabilidad(0.15)) {
          // Cobro en dos partes; la segunda solo si cae dentro del calendario.
          const primera = centavos(Math.max(1, Math.floor((aCobrar * azar.entero(20, 80)) / 100)));
          cobrar(clave, cliente.id, fecha, primera);
          const segunda = sumarDias(fecha, azar.entero(1, 40));
          if (segunda <= HASTA && aCobrar > primera) cobrar(clave, cliente.id, segunda, centavos(aCobrar - primera));
        } else {
          cobrar(clave, cliente.id, fecha, aCobrar);
        }
      }
    }
  }

  // Un cobro posterior al calendario (S1, como T05): al 31/10 la factura sigue impaga.
  comprobantes.push({ clave: "F-posterior", cliente: "C05", emision: "2026-09-25", neto: centavos(30_000_000) });
  cobrar("F-posterior", "C05", "2026-11-03", total(centavos(30_000_000)));
  // Pagos sin imputar (R4): a cuenta si el cliente tiene saldo, saldo a favor si no.
  recibos.push({ cliente: "C07", fecha: "2026-10-20", medios: [{ importe: centavos(5_000_000) }] });
  recibos.push({ cliente: "C09", fecha: "2026-10-10", medios: [{ importe: centavos(5_800_000) }] });
  recibos.push({ cliente: "C09", fecha: "2025-09-15", medios: [{ importe: centavos(580_000) }] });
  recibos.push({ cliente: "C07", fecha: "2025-06-15", medios: [{ importe: centavos(1_234_567) }] });
  // Un pago anticipado con retención y sin imputar (C02): el a cuenta incluye la retención (R2).
  recibos.push({ cliente: "C02", fecha: "2026-03-10", medios: [{ importe: centavos(3_000_000) }, { medio: "retencion-iibb", importe: centavos(100_000) }] });

  return armarDatos({ comprobantes, recibos });
}
