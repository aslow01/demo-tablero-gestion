// Tipos de presentación de los gráficos y de la regla de tramos (docs/diseno-ui.md, 5.6 y 5.10). Solo lo que hace falta para pintar:
// nada de reglas de negocio. Los importes son `Centavos` (dominio) y los porcentajes, milésimas (`Milesimas`, M3); los rótulos, las frases y los destinos de los enlaces los arma
// la lógica (los modelos de vista y `rotulos.ts`): las piezas no importan textos ni leen el estado.
import type { Tramo } from "../lib/dominio/antiguedad.ts";
import type { Centavos, Milesimas } from "../lib/dominio/dinero.ts";

// ---------------------------------------------------------------------------------------------------------------------------
// Gráfico de 12 meses
// ---------------------------------------------------------------------------------------------------------------------------

/** Una serie del gráfico de meses: su rótulo (leyenda) y su color. El orden del arreglo es el de las barras, de izquierda a derecha. */
export interface SerieDelGrafico {
  rotulo: string;
  clase: "facturado" | "cobrado";
}

/** Un mes del gráfico: `AAAA-MM` y un importe por serie (en el mismo orden que `series`). Del más viejo al más nuevo, hasta 12. */
export interface MesDelGrafico {
  mes: string;
  valores: readonly Centavos[];
}

/**
 * La tabla equivalente del gráfico. `columnas` son los rótulos (sin el de "Mes"); cada fila trae un importe por columna. El total lo calcula la lógica.
 * `claves` (opcional) son los nombres cortos de las columnas (`fa`, `fi`, `co`, `re`): van al atributo `data-col` de cada celda, para que la verificación cruce
 * cada importe con su medida.
 */
export interface TablaDelGrafico {
  /** Nombre de la tabla para lectores de pantalla (`caption` oculto). */
  titulo: string;
  columnas: readonly string[];
  claves?: readonly string[];
  /** `rotulo` (opcional) es el nombre del mes que se lee en la fila («Octubre de 2026»); sin él, la pieza lo arma con `nombreDelMes`. */
  filas: readonly { mes: string; rotulo?: string; importes: readonly Centavos[] }[];
  total?: { rotulo: string; importes: readonly Centavos[] };
}

/** Lo que recibe el contenido de una celda de importe cuando la pantalla lo reemplaza (por ejemplo con una cifra-enlace al desglose del mes). */
export interface CeldaDeImporte {
  mes: string;
  columna: number;
  importe: Centavos;
}

/** El renglón del mes de corte: un texto entero o, para resaltar el mes («**Octubre de 2026:** facturado $ … · cobrado $ …»), su título y el resto. */
export type RenglonDeCorte = string | { titulo: string; texto: string };

/** Alto del lienzo: `normal` (Resumen y Cliente) o `alto` (la página Meses, donde el gráfico es lo principal). */
export type AltoDelGrafico = "normal" | "alto";

// ---------------------------------------------------------------------------------------------------------------------------
// Regla de tramos y ubicador
// ---------------------------------------------------------------------------------------------------------------------------

/** Un tramo de la regla de antigüedad: su clave (A1), su importe y su porcentaje del saldo a cobrar (M3; `null` si el total es 0). */
export interface TramoDeRegla {
  clave: Tramo;
  importe: Centavos;
  porcentaje: Milesimas | null;
  /** Nombre escrito del tramo («1 a 30 días»). Si falta, la pieza usa el de `ROTULO_DE_TRAMO` (la galería y las pruebas no lo pasan). */
  rotulo?: string;
  /**
   * A dónde lleva la fila (el desglose del tramo; en la regla de «Otros», la mora completa cuando «Otros» no existe: lo decide el modelo de vista).
   * Sin destino, o con importe 0, la fila no es un enlace.
   */
  href?: string;
  /** Va al `data-m` de la fila (medida|cliente|mes|corte): identifica la cifra para la verificación. */
  medida?: string;
}

export type VarianteDeRegla = "completa" | "mediana" | "minima";

/** De qué lado se alinea el rótulo de la marca del ubicador cuando la marca está cerca de un borde (lo calcula `ubicadorDe`). */
export type BordeDelUbicador = "izquierdo" | "derecho" | null;
