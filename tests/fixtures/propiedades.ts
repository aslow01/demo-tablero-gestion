// Las dos propiedades (docs/diseno.md, D2 y D3) como funciones sobre un conjunto de datos, para correrlas con el generador mínimo de los tests
// (variedad: ND, recibos con varias imputaciones, retención de IVA) y con el generador de verdad (los datos que se publican).
import { CLAVES_DEL_CATALOGO, CLAVES_DEL_MES } from "../../src/lib/dominio/claves.ts";
import { controlesCruzados, valoresDe } from "../../src/lib/dominio/controles.ts";
import { cierresDeMes } from "../../src/lib/dominio/corte.ts";
import { ErrorDeCierre, clavesExistentes, controlar, docesMeses, medida } from "../../src/lib/dominio/medidas.ts";
import type { Datos, FiltroDeMedida } from "../../src/lib/dominio/tipos.ts";

/** 50 semillas en total (docs/plan.md, paso 3.5). Si el test llegara a pasar de 30 s en CI se bajan a 20 allá, anotado en el registro. */
export const SEMILLAS_DE_LA_PROPIEDAD = Array.from({ length: 50 }, (_, i) => 20261118 + i);

function revisar(datos: Datos, corte: string, clave: (typeof CLAVES_DEL_CATALOGO)[number] | "mora-otros", filtro: FiltroDeMedida): string | null {
  try {
    controlar(medida(datos, corte, clave, filtro));
    return null;
  } catch (e) {
    return `${clave} ${JSON.stringify(filtro)} al ${corte}: ${e instanceof ErrorDeCierre ? e.message : String(e)}`;
  }
}

/** D2: en los 22 cierres de mes, las 15 claves (y `mora-otros` si existe) de la empresa y de cada cliente, y las cinco del mes en cada uno de los doce meses: el valor y la suma de las partidas coinciden. Devuelve los primeros problemas. */
export function problemasDeD2(datos: Datos): string[] {
  const problemas: string[] = [];
  const filtros: FiltroDeMedida[] = [{}, ...datos.clientes.map((c) => ({ clienteId: c.id }))];
  for (const corte of cierresDeMes(datos)) {
    for (const clave of CLAVES_DEL_CATALOGO) {
      for (const filtro of filtros) {
        const p = revisar(datos, corte, clave, filtro);
        if (p !== null) problemas.push(p);
      }
    }
    if (clavesExistentes(datos, corte).includes("mora-otros")) {
      const p = revisar(datos, corte, "mora-otros", {});
      if (p !== null) problemas.push(p);
    }
    for (const mes of docesMeses(corte, datos.desde)) {
      for (const clave of CLAVES_DEL_MES) {
        const p = revisar(datos, corte, clave, { mes });
        if (p !== null) problemas.push(p);
      }
    }
    if (problemas.length > 5) break;
  }
  return problemas.slice(0, 5);
}

/** D3: en los 22 cierres de mes los controles cruzados X1 a X6 cierran. Devuelve los primeros fallos, con su corte. */
export function fallosDeD3(datos: Datos): string[] {
  const fallos: string[] = [];
  for (const corte of cierresDeMes(datos)) {
    for (const f of controlesCruzados(datos, corte, valoresDe(datos, corte))) fallos.push(`${corte}: ${f.control} ${f.detalle} (${f.esperado} y ${f.obtenido})`);
    if (fallos.length > 3) break;
  }
  return fallos.slice(0, 3);
}
