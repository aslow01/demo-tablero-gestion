// Reglas de la búsqueda de código prohibido (`scripts/reglas-codigo.mjs`, docs/plan.md paso 1.4). Son el respaldo del tipo `Centavos`
// (docs/diseno.md, M1): la defensa principal es el compilador; esta búsqueda por texto se saltea con `+x` o `/ 100`, por eso es solo un respaldo.
import { describe, expect, it } from "vitest";
import { REGLAS_DE_CODIGO, hallazgosDe } from "../scripts/reglas-codigo.mjs";

const archivo = (ruta: string, texto: string) => ({ ruta, texto });
const nombres = (archivos: { ruta: string; texto: string }[]) => hallazgosDe(archivos, REGLAS_DE_CODIGO).map((h) => h.ruta);

describe("M1: el dinero no se calcula con coma flotante ni se redondea a ojo (src/lib/dominio)", () => {
  it.each([
    ["toFixed", "const t = (x / 100).toFixed(2);"],
    ["Math.round", "const c = Math.round(valor * 100);"],
    ["parseFloat", "const n = parseFloat(texto);"],
    ["Number.parseFloat", "const n = Number.parseFloat(texto);"],
    ["Number(", "const n = Number(texto);"],
    ["parseInt", "const n = parseInt(texto, 10);"],
    ["Number.parseInt", "const n = Number.parseInt(texto, 10);"],
  ])("%s plantado en src/lib/dominio/dinero.ts falla", (_nombre, linea) => {
    expect(nombres([archivo("src/lib/dominio/dinero.ts", linea)])).toEqual(["src/lib/dominio/dinero.ts"]);
  });

  it("sin esas llamadas pasa (incluidos Number.isInteger y Number.isSafeInteger)", () => {
    const texto = "if (!Number.isInteger(n) || !Number.isSafeInteger(n)) throw new Error('x'); const e = Number.MAX_SAFE_INTEGER;";
    expect(nombres([archivo("src/lib/dominio/dinero.ts", texto)])).toEqual([]);
  });

  it("fechas.ts es la única excepción para Number( (lee dígitos de una fecha ya validada)", () => {
    expect(nombres([archivo("src/lib/dominio/fechas.ts", "const anio = Number(m[1]);")])).toEqual([]);
    // ...pero no para el resto de lo que prohíbe la regla:
    expect(nombres([archivo("src/lib/dominio/fechas.ts", "const t = x.toFixed(2);")])).toEqual(["src/lib/dominio/fechas.ts"]);
  });

  it("parseInt solo se permite en comprobantes.ts (lee los dígitos del id de recibo); en validadores.ts y el resto falla", () => {
    const linea = "const n = parseInt(partes[2], 10);";
    expect(nombres([archivo("src/lib/dominio/comprobantes.ts", linea)])).toEqual([]);
    expect(nombres([archivo("src/lib/dominio/validadores.ts", linea)])).toEqual(["src/lib/dominio/validadores.ts"]);
    // ...y comprobantes.ts sigue sin poder usar el resto de lo prohibido:
    expect(nombres([archivo("src/lib/dominio/comprobantes.ts", "const n = Number(texto);")])).toEqual(["src/lib/dominio/comprobantes.ts"]);
  });

  it("fuera de src/lib/dominio no se aplica (cuit.ts vive en datos/ y usa Number( para dígitos)", () => {
    expect(nombres([archivo("src/lib/datos/cuit.ts", "suma += Number(base10[i]) * peso;")])).toEqual([]);
    expect(nombres([archivo("tests/dinero.test.ts", "expect((1.005).toFixed(2)).toBe('1.00');")])).toEqual([]);
  });

  it("informa el número de línea y la regla", () => {
    const [h] = hallazgosDe([archivo("src/lib/dominio/m.ts", "const a = 1;\nconst b = x.toFixed(2);\n")], REGLAS_DE_CODIGO);
    expect(h).toMatchObject({ ruta: "src/lib/dominio/m.ts", linea: 2 });
    expect(h?.regla).toMatch(/toFixed/);
  });
});

describe("sin azar ni reloj en src/lib (todo sale del generador con semilla y del corte elegido)", () => {
  it("Math.random en src/lib falla", () => {
    expect(nombres([archivo("src/lib/datos/generador.ts", "const x = Math.random();")])).toEqual(["src/lib/datos/generador.ts"]);
  });

  it("new Date( en src/lib falla, con o sin argumentos", () => {
    expect(nombres([archivo("src/lib/dominio/corte.ts", "const h = new Date();")])).toEqual(["src/lib/dominio/corte.ts"]);
    expect(nombres([archivo("src/lib/dominio/corte.ts", "const h = new Date(2026, 9, 31);")])).toEqual(["src/lib/dominio/corte.ts"]);
  });

  it("Date.now falla en cualquier parte de src, y Date.UTC pasa", () => {
    expect(nombres([archivo("src/App.svelte", "const t = Date.now();")])).toEqual(["src/App.svelte"]);
    expect(nombres([archivo("src/lib/dominio/fechas.ts", "return Date.UTC(anio, mes - 1, dia);")])).toEqual([]);
  });

  it("en tests/ se puede usar Date y Math.random", () => {
    expect(nombres([archivo("tests/fechas.test.ts", "const d = new Date(0); const r = Math.random();")])).toEqual([]);
  });
});

describe("las dos puertas de la interfaz (`medidaControlada` y `cargarDatosDeEjemplo`) están forzadas, no son solo convención", () => {
  const vistas = ["src/App.svelte", "src/componentes/Resumen.svelte", "src/vistas/Cliente.svelte", "src/estado/corte.svelte.ts", "src/main.ts"];

  it.each([
    ["medida", 'import { medida } from "../lib/dominio/medidas.ts";'],
    ["medida junto a otras", 'import { clavesExistentes, medida, medidaControlada } from "../lib/dominio/medidas.ts";'],
    ["generar", 'import { generar } from "../lib/datos/generador.ts";'],
    ["validarDatos", 'import { validarDatos } from "../lib/dominio/validadores.ts";'],
    ["medida con otro nombre", 'import { medida as calcular } from "../lib/dominio/medidas.ts";'],
    ["medida reexportada", 'export { medida } from "../lib/dominio/medidas.ts";'],
    ["medida en una lista partida en varias líneas", "  clavesExistentes,\n  medida,\n  medidaControlada,"],
    ["todo medidas.ts con *", 'import * as medidas from "../lib/dominio/medidas.ts";'],
    ["medidas.ts con import dinámico", 'const m = await import("../lib/dominio/medidas.ts");'],
    ["todo generador.ts con *", 'import * as g from "../lib/datos/generador.ts";'],
  ])("importar %s en la interfaz falla (App, componentes, vistas, estado y main)", (_nombre, texto) => {
    for (const ruta of vistas) expect(nombres([archivo(ruta, texto)]), ruta).toEqual([ruta]);
  });

  it("las puertas (medidaControlada y cargarDatosDeEjemplo) y el resto de la lógica sí se pueden importar", () => {
    const texto = [
      'import { medidaControlada, clavesExistentes } from "../lib/dominio/medidas.ts";',
      'import { cargarDatosDeEjemplo } from "../lib/datos/cargar.ts";',
      'import type { Medida } from "../lib/dominio/medidas.ts";',
      'import { formatearImporte } from "../lib/dominio/dinero.ts";',
    ].join("\n");
    expect(nombres([archivo("src/componentes/Resumen.svelte", texto)])).toEqual([]);
    expect(nombres([archivo("src/App.svelte", "  medidaControlada,\n  cargarDatosDeEjemplo,")])).toEqual([]);
  });

  it("dentro de src/lib y en tests/ no se aplica (cargar.ts usa generar; medidaControlada usa medida)", () => {
    expect(nombres([archivo("src/lib/datos/cargar.ts", 'import { generar } from "./generador.ts";')])).toEqual([]);
    expect(nombres([archivo("src/lib/dominio/medidas.ts", "export function medida() {}")])).toEqual([]);
    expect(nombres([archivo("tests/medidas.test.ts", 'import { medida } from "../src/lib/dominio/medidas.ts";')])).toEqual([]);
  });

  it("los modelos de vista (src/lib/vistas) son parte de la interfaz: tampoco pueden importar medida, generar ni validarDatos", () => {
    const rutas = ["src/lib/vistas/resumen.ts", "src/lib/vistas/tipos.ts", "src/lib/vistas/sub/otro.ts"];
    for (const ruta of rutas) {
      expect(nombres([archivo(ruta, 'import { medida } from "../dominio/medidas.ts";')]), ruta).toEqual([ruta]);
      expect(nombres([archivo(ruta, 'import { generar } from "../datos/generador.ts";')]), ruta).toEqual([ruta]);
      expect(nombres([archivo(ruta, 'import { validarDatos } from "../dominio/validadores.ts";')]), ruta).toEqual([ruta]);
      expect(nombres([archivo(ruta, "  clavesExistentes,\n  medida,\n  medidaControlada,")]), ruta).toEqual([ruta]);
      expect(nombres([archivo(ruta, 'import { medidaControlada, clavesExistentes, porCliente } from "../dominio/medidas.ts";')]), ruta).toEqual([]);
    }
  });

  it("el resto de src/lib sigue exento: dominio y datos, y una carpeta que solo empieza con «vistas»", () => {
    for (const ruta of ["src/lib/dominio/controles.ts", "src/lib/datos/cargar.ts", "src/lib/estado/aplicacion.svelte.ts", "src/lib/vistasaparte/x.ts"]) {
      expect(nombres([archivo(ruta, 'import { medida } from "./medidas.ts";')]), ruta).toEqual([]);
    }
  });

  it("informa el número de línea de la importación prohibida", () => {
    const [h] = hallazgosDe([archivo("src/App.svelte", '<script lang="ts">\n  import { medida } from "./lib/dominio/medidas.ts";\n</script>')], REGLAS_DE_CODIGO);
    expect(h).toMatchObject({ ruta: "src/App.svelte", linea: 2 });
    expect(h?.regla).toMatch(/medida/);
  });
});

describe("la puerta del XSS y de la CSP", () => {
  it.each(["{@html datos}", "el.innerHTML = x;", "el.outerHTML = x;", "el.insertAdjacentHTML('beforeend', x);", "eval('1')", "new Function('return 1')"])(
    "%s en src/ falla",
    (linea) => {
      expect(nombres([archivo("src/componentes/X.svelte", linea)])).toEqual(["src/componentes/X.svelte"]);
    },
  );

  it("transition: / in: / out: / animate: en un .svelte falla (el movimiento va por CSS)", () => {
    expect(nombres([archivo("src/componentes/X.svelte", "<div transition:fade>")])).toEqual(["src/componentes/X.svelte"]);
  });
});
