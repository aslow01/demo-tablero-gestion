// Imprime las cifras de referencia de una semilla al corte por defecto (docs/diseno.md, 5.4) para escribirlas en `src/lib/datos/esperado.ts`.
// Las **importes** salen del oráculo independiente (`scripts/oraculo.mjs`, que no importa nada del dominio) y las listas (ranking, plantados) de
// los datos crudos; solo los porcentajes (M3, mayor resto) usan `porcentajes` del dominio, y se comprueba que sumen 100,0.
// Uso: node scripts/referencia.mjs [semilla]     (Node 24 corre los .ts de src directamente)
import { SEMILLA_PUBLICADA } from "../src/lib/datos/constantes.ts";
import { generar } from "../src/lib/datos/generador.ts";
import { huellaDe } from "../src/lib/datos/huella.ts";
import { porcentajes } from "../src/lib/dominio/dinero.ts";
import { calcularOraculo } from "./oraculo.mjs";

const semilla = Number(process.argv[2] ?? SEMILLA_PUBLICADA);
const corte = "2026-10-31";
const g = generar(semilla);
const d = g.datos;
const o = calcularOraculo(d, corte);
const nombre = Object.fromEntries(d.clientes.map((c) => [c.id, c.razonSocial]));
const e = o.empresa;

const tramos = ["tramo-no-vencido", "tramo-1-30", "tramo-31-60", "tramo-61-90", "tramo-mas-90"];
const milesimasTramos = porcentajes(tramos.map((k) => ({ nombre: k, importe: e[k] })));
const ranking = Object.entries(o.moraPorCliente)
  .map(([id, m]) => ({ id, nombre: nombre[id], importe: m.importe, masAtrasado: m.masAtrasado }))
  .sort((a, b) => b.importe - a.importe || a.nombre.localeCompare(b.nombre, "es-AR"));
const milesimasDeudores = porcentajes(ranking.map((r) => ({ nombre: r.nombre, importe: r.importe })));

const delMes = (x) => x.startsWith(corte.slice(0, 7));
const octubre = {
  comprobantes: d.comprobantes.filter((c) => delMes(c.emision) && c.emision <= corte).length,
  recibos: d.recibos.filter((r) => delMes(r.fecha) && r.fecha <= corte).length,
};
const c05 = o.porCliente["C05"];
const salida = {
  semilla,
  huella: huellaDe(d),
  comprobantes: d.comprobantes.length,
  recibos: d.recibos.length,
  empresa: e,
  mora: { comprobantes: o.comprobantesEnMora, clientes: o.clientesEnMora, milesimasDelSaldo: Math.floor((e.mora * 2000 + e.saldo) / (2 * e.saldo)) },
  milesimasDeTramos: Object.fromEntries(tramos.map((k, i) => [k, milesimasTramos[i]])),
  ranking: ranking.map((r, i) => ({ ...r, milesimas: milesimasDeudores[i] })),
  octubre,
  c05,
  ids: g.plantados,
};
console.log(JSON.stringify(salida, null, 2));
if (milesimasTramos.reduce((s, m) => s + (m ?? 0), 0) !== 1000 || milesimasDeudores.reduce((s, m) => s + (m ?? 0), 0) !== 1000) {
  console.error("Los porcentajes no suman 100,0.");
  process.exit(1);
}
