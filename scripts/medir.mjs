// Mide G7 (docs/diseno.md, 6.7): generar los datos de ejemplo y recalcular las 15 medidas de la empresa para un corte con los dos caminos y `controlar`.
// Uso: node scripts/medir.mjs      (objetivos: generar < 50 ms, recalcular un corte < 20 ms; el test de CI tiene un tope 10 veces más holgado)
import { generar } from "../src/lib/datos/generador.ts";
import { CLAVES_DEL_CATALOGO } from "../src/lib/dominio/claves.ts";
import { controlar, medida } from "../src/lib/dominio/medidas.ts";

const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const medir = (f, veces) => {
  const ms = [];
  for (let i = 0; i < veces; i++) {
    const t0 = performance.now();
    f();
    ms.push(performance.now() - t0);
  }
  return { mediana: mediana(ms), minimo: Math.min(...ms), maximo: Math.max(...ms) };
};
const fmt = (r) => `mediana ${r.mediana.toFixed(1)} ms (mínimo ${r.minimo.toFixed(1)}, máximo ${r.maximo.toFixed(1)})`;

generar(1);
console.log("generar:", fmt(medir(() => generar(20261118), 30)));
const frio = [];
for (let i = 0; i < 30; i++) {
  const { datos } = generar(20261118 + i);
  const t0 = performance.now();
  for (const clave of CLAVES_DEL_CATALOGO) controlar(medida(datos, "2026-10-31", clave));
  frio.push(performance.now() - t0);
}
console.log("15 medidas de la empresa, un corte, datos nuevos (índices en frío):", fmt({ mediana: mediana(frio), minimo: Math.min(...frio), maximo: Math.max(...frio) }));
const { datos } = generar(20261118);
for (const clave of CLAVES_DEL_CATALOGO) medida(datos, "2026-09-30", clave);
console.log("15 medidas de la empresa, otro corte, índices ya armados:", fmt(medir(() => { for (const clave of CLAVES_DEL_CATALOGO) controlar(medida(datos, "2026-10-31", clave)); }, 30)));
