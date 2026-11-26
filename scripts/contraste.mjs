// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): scripts/contraste.mjs.
// Cambios: la lista de pares es la de esta demo (docs/diseno-ui.md 3.3: tinta, enlace,
// franja de la mora, barra lateral, tonos, tramos de antigüedad, series y selector de corte marcado); se sacaron los pares de patente, peligro,
// horizonte y "hoy" y el cálculo de `peligro-hover`, que esta demo no tiene.
// Mide los contrastes de la paleta leyendo los valores reales de src/estilos/tokens.css,
// en claro y en oscuro. Fórmula de luminancia relativa de WCAG 2.x. Sale con código 1 si algún par no llega a su mínimo.
// Uso: npm run contraste   (con `-- --todo` muestra también los pares que pasan con holgura; por defecto lista todos igual).
// Un par "justo" (menos de 0,3 por encima del mínimo) se marca con "~" para mirarlo antes de tocar la paleta.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
// Se normaliza el fin de línea CRLF (checkout de Windows): con él no se encuentran los cortes de bloque.
const css = readFileSync(join(raiz, "src", "estilos", "tokens.css"), "utf8").replaceAll("\r\n", "\n");

// ---------- Lectura de tokens ----------
// Primer bloque `:root { ... }` = claro; bloque `:root` dentro de `@media (prefers-color-scheme: dark)` = oscuro (pisa al claro).
function declaraciones(bloque) {
  const salida = {};
  for (const m of bloque.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) salida[m[1]] = m[2].trim();
  return salida;
}
const abre = css.indexOf(":root {");
const cierraClaro = css.indexOf("\n}\n", abre);
const claro = declaraciones(css.slice(abre, cierraClaro));
const mediaOscuro = css.indexOf("prefers-color-scheme: dark");
const abreOscuro = css.indexOf(":root {", mediaOscuro);
const cierraOscuro = css.indexOf("\n  }\n", abreOscuro);
if ([abre, cierraClaro, mediaOscuro, abreOscuro, cierraOscuro].some((i) => i < 0)) {
  console.error("No se encontraron los bloques `:root` (claro y oscuro) en src/estilos/tokens.css: ¿cambió la estructura o la sangría del archivo?");
  process.exit(2);
}
const oscuro = { ...claro, ...declaraciones(css.slice(abreOscuro, cierraOscuro)) };

function resolver(tokens, nombre, profundidad = 0) {
  const valor = tokens[nombre];
  if (valor === undefined) throw new Error(`Falta el token --${nombre}`);
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(valor);
  if (alias !== null) {
    if (profundidad > 8) throw new Error(`Alias circular en --${nombre}`);
    return resolver(tokens, alias[1], profundidad + 1);
  }
  return valor;
}

function rgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (m === null) throw new Error(`Color no soportado: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminancia(color) {
  const [r, g, b] = color.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function razon(a, b) {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (oscura + 0.05);
}

/** Color de un token (en hex). */
function color(tokens, nombre) {
  return rgb(resolver(tokens, nombre));
}

// ---------- Pares (paleta de esta demo) ----------
const tonos = ["ok", "revisar", "diferencia", "neutro", "pendiente"];
const pares = []; // { grupo, a, b, minimo }
const par = (grupo, a, b, minimo) => pares.push({ grupo, a: `c-${a}`, b: `c-${b}`, minimo });

for (const f of ["superficie", "superficie-2", "escritorio", "fondo"]) for (const t of ["texto", "texto-2", "texto-3"]) par("Texto", t, f, 4.5);
par("Texto sobre la fila elegida y el hover de cifra-enlace", "texto", "acento-suave", 4.5);
par("Texto sobre la fila elegida y el hover de cifra-enlace", "texto-2", "acento-suave", 4.5);

for (const f of ["superficie", "superficie-2", "escritorio", "acento-suave"]) par("Enlace (texto)", "enlace", f, 4.5);
for (const f of ["superficie", "superficie-2", "escritorio"]) par("Tinta (texto e íconos de acción)", "tinta", f, 4.5);

par("Botón primario y pestaña o filtro elegidos", "sobre-tinta", "tinta", 4.5);
par("Botón primario y pestaña o filtro elegidos (hover)", "sobre-tinta", "tinta-hover", 4.5);
par("Franja de la mora (la cifra que manda)", "sobre-franja", "franja", 4.5);
par("Franja de la mora (hover)", "sobre-franja", "franja-hover", 4.5);
par("Franja de la mora: centavos de la cifra", "sobre-franja-2", "franja", 4.5);
par("Franja de la mora: centavos de la cifra (hover)", "sobre-franja-2", "franja-hover", 4.5);
par("Franja de la mora: anillo de foco (3:1)", "sobre-franja", "franja", 3);
par("Flecha del corte deshabilitada", "texto-3", "superficie-2", 4.5);
par("Flecha del corte deshabilitada", "texto-3", "superficie", 4.5);

// Barra lateral (escritorio). El hover es un velo del 8 % del texto: no se mide aparte, el texto queda más claro que sin velo.
par("Barra lateral", "lateral-texto", "lateral", 4.5);
par("Barra lateral", "lateral-texto-2", "lateral", 4.5);
par("Barra lateral: anillo de foco (3:1)", "lateral-foco", "lateral", 3);
par("Pestaña activa del lateral: texto sobre la página", "texto", "escritorio", 4.5);
par("Pestaña activa del lateral: ícono y marca (3:1)", "tinta", "escritorio", 3);

for (const f of ["superficie", "superficie-2", "escritorio"]) par("Bordes de controles (1.4.11)", "borde-fuerte", f, 3);
par("Borde del botón primario (1.4.11)", "tinta", "superficie", 3);
par("Solapa activa: franja superior (1.4.11)", "tinta", "superficie", 3);
par("Solapa inactiva: texto sobre su fondo", "texto-2", "superficie-2", 4.5);
par("Pestaña inactiva de la barra inferior: texto", "texto-2", "superficie", 4.5);

for (const t of tonos) par("Etiqueta (texto / fondo)", `${t}-t`, `${t}-f`, 4.5);
for (const t of tonos) par("Aviso y mensaje (texto del cuerpo / fondo del tono)", "texto", `${t}-f`, 4.5);
for (const t of tonos) par("Tono / superficie (mensajes)", `${t}-t`, "superficie", 4.5);
for (const t of tonos) par("Tono / página (insignias)", `${t}-t`, "escritorio", 4.5);
for (const t of ["ok", "revisar", "diferencia", "pendiente"]) par("Franja / superficie (3:1)", `${t}-r`, "superficie", 3);
par("Insignia de la pestaña: borde (3:1)", "revisar-r", "superficie", 3);
par("Insignia de la pestaña: borde (3:1)", "revisar-r", "escritorio", 3);

// Tramos y series: no son texto (cada tramo y cada serie lleva su rótulo escrito), así que el mínimo es 3:1.
for (let n = 0; n <= 4; n++) par("Tramo / superficie (3:1, no es texto)", `tramo-${n}`, "superficie", 3);
for (let n = 0; n <= 4; n++) par("Tramo / superficie-2 (pista de la regla)", `tramo-${n}`, "superficie-2", 3);
// Muestra de color dentro de la etiqueta de su tramo: no vencido es neutro, 1 a 60 días es revisar, 61 días o más es diferencia.
for (const [n, tono] of [[0, "neutro"], [1, "revisar"], [2, "revisar"], [3, "diferencia"], [4, "diferencia"]]) par("Muestra del tramo / fondo de su etiqueta (3:1)", `tramo-${n}`, `${tono}-f`, 3);
for (const s of ["facturado", "cobrado"]) par("Serie / superficie (3:1)", `serie-${s}`, "superficie", 3);
for (const s of ["facturado", "cobrado"]) par("Serie / superficie-2 (banda del mes de corte)", `serie-${s}`, "superficie-2", 3);
par("Marca del ubicador (texto / superficie)", "texto", "superficie", 3);
par("Marca del ubicador (texto / superficie-2)", "texto", "superficie-2", 3);

// Selector de corte marcado: borde y fondo del tono "revisar".
par("Selector marcado: borde", "revisar-r", "superficie", 3);
par("Selector marcado: borde", "revisar-r", "escritorio", 3);
par("Selector marcado: rótulo", "texto-2", "revisar-f", 4.5);
par("Selector marcado: texto", "texto", "revisar-f", 4.5);
par("Selector marcado: borde del select y de las flechas", "borde-fuerte", "revisar-f", 3);

for (const f of ["superficie", "superficie-2", "escritorio", "acento-suave"]) par("Foco (3:1)", "foco", f, 3);
for (const t of tonos) par("Foco sobre fondos de tono (3:1)", "foco", `${t}-f`, 3);
// ---------- Salida ----------
let fallos = 0;
let justos = 0;
let grupoActual = "";
const fmt = (n) => n.toFixed(2).replace(".", ",");
console.log("Contraste de la paleta (claro | oscuro). Marca: x falla, ~ justo (< 0,3 sobre el mínimo).\n");
for (const p of pares) {
  if (p.grupo !== grupoActual) {
    grupoActual = p.grupo;
    console.log(`\n${grupoActual}`);
  }
  const celdas = [claro, oscuro].map((tokens) => {
    const a = color(tokens, p.a);
    const b = color(tokens, p.b);
    const r = razon(a, b);
    const marca = r < p.minimo ? "x" : r < p.minimo + 0.3 ? "~" : " ";
    if (marca === "x") fallos++;
    if (marca === "~") justos++;
    return `${marca}${fmt(r).padStart(5)}`;
  });
  const nombre = `${p.a.slice(2)} / ${p.b.slice(2)}`;
  console.log(`  ${nombre.padEnd(40)} ${celdas[0]}  |  ${celdas[1]}   (mínimo ${p.minimo})`);
}
console.log(`\n${pares.length * 2} mediciones: ${fallos} fallan, ${justos} justas.`);
process.exit(fallos > 0 ? 1 : 0);
