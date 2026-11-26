// Reglas de la búsqueda de código prohibido (docs/stack.md, sección 6; docs/plan.md, paso 1.4). Módulo puro, sin leer archivos ni
// escribir en consola: lo usa `buscar-prohibidos.mjs` y lo prueba `tests/reglas-codigo.test.ts` (que planta cada llamada prohibida).
// Origen: la lista de reglas sale de `scripts/buscar-prohibidos.mjs` de la Demo 2 (Control de flota, del mismo autor, MIT), partida acá
// en un módulo para poder probarla. Las reglas de dinero y de reloj son nuevas de esta demo.

/**
 * Cada regla: dónde mira (`donde`: expresión sobre la ruta relativa con `/`), qué prohíbe (`patron` sobre cada línea, o una función
 * `coincide(linea)`) y qué archivos exceptúa.
 */
export const REGLAS_DE_CODIGO = [
  { nombre: "{@html} (puerta del XSS y de la CSP)", donde: /^src\//, patron: /\{@html/, excepto: [] },
  { nombre: "innerHTML / outerHTML / insertAdjacentHTML con datos", donde: /^src\//, patron: /\b(innerHTML|outerHTML|insertAdjacentHTML)\b/, excepto: [] },
  { nombre: "eval / new Function", donde: /^src\//, patron: /\beval\s*\(|new Function\s*\(/, excepto: [] },
  { nombre: "Math.random en src/lib (todo sale del generador con semilla)", donde: /^src\/lib\//, patron: /Math\.random/, excepto: [] },
  { nombre: "new Date( en src/lib (el dominio no tiene reloj: las fechas son civiles y se calculan con Date.UTC)", donde: /^src\/lib\//, patron: /new Date\(/, excepto: [] },
  { nombre: "Date.now (no hay reloj en ninguna parte de src)", donde: /^src\//, patron: /Date\.now\s*\(/, excepto: [] },
  { nombre: "transiciones de Svelte (el movimiento va por CSS)", donde: /^src\/.*\.svelte$/, patron: /\b(transition|in|out|animate):[a-z]/, excepto: [] },
  // M1: respaldo del tipo `Centavos`. La defensa principal es el compilador.
  { nombre: "parseFloat en src/lib/dominio (M1: el dinero son centavos enteros)", donde: /^src\/lib\/dominio\//, patron: /\bparseFloat\b/, excepto: [] },
  { nombre: "toFixed en src/lib/dominio (M1: el formato se arma con enteros)", donde: /^src\/lib\/dominio\//, patron: /\.toFixed\s*\(/, excepto: [] },
  { nombre: "Math.round en src/lib/dominio (M1: el redondeo es el de M2, con enteros)", donde: /^src\/lib\/dominio\//, patron: /Math\.round\b/, excepto: [] },
  // parseInt es peor que Number( para importes (parseInt("12.50") da 12 sin avisar). Solo `leerIdRecibo` lee dígitos con parseInt.
  { nombre: "parseInt en src/lib/dominio (M1; excepción: comprobantes.ts, leerIdRecibo)", donde: /^src\/lib\/dominio\//, patron: /\bparseInt\b/, excepto: ["src/lib/dominio/comprobantes.ts"] },
  // fechas.ts lee los dígitos de una fecha ya validada con Number(); cuit.ts vive en datos/, fuera de esta regla.
  { nombre: "Number( en src/lib/dominio (M1; excepción: fechas.ts)", donde: /^src\/lib\/dominio\//, patron: /\bNumber\s*\(/, excepto: ["src/lib/dominio/fechas.ts"] },
  // Las dos puertas de la interfaz se hacen cumplir con esta búsqueda, no por convención. Fuera de `src/lib` nadie importa `medida` (solo
  // `medidaControlada`, que corre `controlar`), ni `generar` ni `validarDatos` (solo `cargarDatosDeEjemplo`, que valida y congela).
  // Los modelos de vista (`src/lib/vistas/`) viven dentro de `src/lib` pero son la última capa antes de la pantalla: cuentan como interfaz.
  {
    nombre: "importar medida, generar o validarDatos en la interfaz (H60 y H65: usar medidaControlada y cargarDatosDeEjemplo)",
    donde: /^src\/(?!lib\/(?!vistas\/))/,
    coincide: esImportacionDeUnaPuerta,
    excepto: [],
  },
];

const NOMBRES_DE_LAS_PUERTAS = /\b(medida|generar|validarDatos)\b/;

/**
 * `true` si la línea importa o reexporta `medida`, `generar` o `validarDatos` (con nombre, solo en una línea de una lista partida, o con `*` o
 * `import()` sobre medidas.ts, generador.ts o validadores.ts, que los traen consigo). `medidaControlada` no coincide: la palabra tiene que estar entera.
 */
function esImportacionDeUnaPuerta(linea) {
  if (/\b(import|export)\b/.test(linea) && NOMBRES_DE_LAS_PUERTAS.test(linea)) return true;
  if (/^\s*(type\s+)?(medida|generar|validarDatos)(\s+as\s+\w+)?\s*,?\s*(\/\/.*)?$/.test(linea)) return true;
  return /(import\s*\*|import\s*\(|export\s*\*)[^;]*["'][^"']*\/(medidas|generador|validadores)\.ts["']/.test(linea);
}

/**
 * Aplica las reglas a una lista de archivos `{ ruta, texto }` y devuelve los hallazgos `{ ruta, linea, regla, texto }` (línea desde 1).
 * Una regla trae `patron` (expresión sobre la línea) o `coincide(linea)`.
 */
export function hallazgosDe(archivos, reglas) {
  const salida = [];
  for (const r of reglas) {
    for (const f of archivos) {
      if (!r.donde.test(f.ruta) || r.excepto.includes(f.ruta)) continue;
      f.texto.split(/\r?\n/).forEach((linea, i) => {
        if (r.coincide ? r.coincide(linea) : r.patron.test(linea)) salida.push({ ruta: f.ruta, linea: i + 1, regla: r.nombre, texto: linea.trim() });
      });
    }
  }
  return salida;
}
