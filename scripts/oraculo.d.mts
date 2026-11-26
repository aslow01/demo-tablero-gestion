import type { Datos } from "../src/lib/dominio/tipos.ts";

export type CifrasDelOraculo = Record<
  | "saldo"
  | "mora"
  | "tramo-no-vencido"
  | "tramo-1-30"
  | "tramo-31-60"
  | "tramo-61-90"
  | "tramo-mas-90"
  | "pagos-a-cuenta"
  | "saldos-a-favor"
  | "saldo-neto"
  | "facturacion-mes"
  | "facturado-con-iva-mes"
  | "iva-mes"
  | "cobranza-mes"
  | "retenciones-mes",
  number
>;

export interface ResultadoDelOraculo {
  empresa: CifrasDelOraculo;
  porCliente: Record<string, CifrasDelOraculo>;
  comprobantesEnMora: number;
  clientesEnMora: number;
  moraPorCliente: Record<string, { importe: number; masAtrasado: { id: string; atraso: number } }>;
}

export function calcularOraculo(datos: Datos, corte: string): ResultadoDelOraculo;
