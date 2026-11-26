// Prueba de mutaciones de la lógica del dominio (docs/diseno.md, D3: «cada control se prueba también al revés»).
// Cada mutación de `scripts/mutaciones.json` cambia una línea del código de `src/lib` (un `<=` por un `<`, una clave fuera de una lista, una
// importación que no debería estar), corre Vitest y comprueba que **algún test falla** (la mutación «muere»). Si todos pasan, la mutación
// «sobrevive»: hay un hueco en los tests. Al terminar cada una, el archivo vuelve a su texto original (también con Ctrl+C).
//
// Uso:
//   npm run mutaciones              todas (cada una corre solo los tests que declara, o toda la suite)
//   npm run mutaciones -- 06,b2     solo esas
//   npm run mutaciones -- --listar  muestra la lista sin correr nada
// Sin dependencias: Node y el Vitest del proyecto. Edita archivos del repositorio mientras corre: no toquen `src/lib` en paralelo.
// Código de salida: 0 si todas murieron; 1 si alguna sobrevive, quedó vieja (su cadena ya no está) o no se pudo correr.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { aplicar, apariciones, juzgar, problemasDeLaLista } from "./mutaciones-lib.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const vitest = join(raiz, "node_modules", "vitest", "vitest.mjs");
const lista = JSON.parse(readFileSync(join(raiz, "scripts", "mutaciones.json"), "utf8"));
const problemas = problemasDeLaLista(lista);
if (problemas.length > 0) {
  console.error(problemas.join("\n"));
  process.exit(1);
}

const argumentos = process.argv.slice(2);
if (argumentos.includes("--listar")) {
  for (const m of lista) console.log(`${m.id.padEnd(6)} ${m.archivo.padEnd(34)} ${m.nombre}`);
  process.exit(0);
}
const elegidas = argumentos.find((a) => !a.startsWith("--"))?.split(",");
const aCorrer = elegidas === undefined ? lista : lista.filter((m) => elegidas.includes(m.id));
if (aCorrer.length === 0) {
  console.error("Ninguna mutación coincide con lo pedido.");
  process.exit(1);
}

// El archivo que está mutado en este momento, para devolverlo a su texto aunque el proceso se corte.
let mutado = null;
function restaurar() {
  if (mutado !== null) {
    writeFileSync(mutado.ruta, mutado.original);
    mutado = null;
  }
}
process.on("exit", restaurar);
for (const senal of ["SIGINT", "SIGTERM"]) {
  process.on(senal, () => {
    restaurar();
    process.exit(130);
  });
}

const resultados = [];
for (const m of aCorrer) {
  const ruta = join(raiz, m.archivo);
  const original = readFileSync(ruta, "utf8");
  if (apariciones(original, m.desde) !== 1) {
    console.log(`${m.id.padEnd(6)} VIEJA      ${m.nombre} (la cadena aparece ${apariciones(original, m.desde)} veces en ${m.archivo})`);
    resultados.push("vieja");
    continue;
  }
  mutado = { ruta, original };
  writeFileSync(ruta, aplicar(original, m.desde, m.hasta));
  const corrida = spawnSync(process.execPath, [vitest, "run", "--reporter=dot", ...(m.tests ?? [])], { cwd: raiz, encoding: "utf8", timeout: 280_000 });
  restaurar();
  const veredicto = juzgar(`${corrida.stdout ?? ""}${corrida.stderr ?? ""}`, corrida.status);
  const etiqueta = { muerta: "muerta", sobrevive: "SOBREVIVE", error: "ERROR" }[veredicto];
  console.log(`${m.id.padEnd(6)} ${etiqueta.padEnd(10)} ${m.nombre}`);
  if (veredicto === "error") console.log(`${corrida.stdout ?? ""}${corrida.stderr ?? ""}`.split("\n").slice(-15).join("\n"));
  resultados.push(veredicto);
}

const cuenta = (v) => resultados.filter((r) => r === v).length;
console.log(`\n${resultados.length} mutaciones: ${cuenta("muerta")} muertas, ${cuenta("sobrevive")} sobreviven, ${cuenta("vieja")} viejas, ${cuenta("error")} con error.`);
process.exit(cuenta("muerta") === resultados.length ? 0 : 1);
