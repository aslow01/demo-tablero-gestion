// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/componentes/tipos.ts.
// Cambios: los tonos son los de esta demo; la lista de íconos es la del sprite de esta demo; se sacaron los tipos del parte,
// de la flota y de la barra de la aplicación de la Demo 2; se suma `NumeroDeTramo` (la muestra de color de las etiquetas de tramo).
// Tipos de presentación compartidos por los componentes (docs/diseno-ui.md, sección 12).
// Solo lo que hace falta para pintar: nada de reglas de negocio. El mapeo "dato del dominio -> tono, ícono y texto" lo arma la pantalla que usa el componente.

/** Tonos de estado. El color nunca va solo: cada uso lleva texto y una marca de forma distinta (un ícono o la muestra de un tramo). */
export type Tono = "ok" | "revisar" | "diferencia" | "neutro" | "pendiente";

/** Tramo de antigüedad como número: 0 no vencido, 1 de 1 a 30 días, 2 de 31 a 60, 3 de 61 a 90, 4 más de 90. Elige el color `--c-tramo-N`. */
export type NumeroDeTramo = 0 | 1 | 2 | 3 | 4;

/** Íconos del sprite de `index.html`. `marca` va en la barra superior y en el lateral; `atras` dibuja lo mismo que `chevron-izq` (otro uso). */
export const ICONOS = [
  "marca",
  "resumen",
  "comprobantes",
  "clientes",
  "meses",
  "vencido",
  "reloj",
  "alerta",
  "check",
  "guion",
  "cerrar",
  "buscar",
  "chevron",
  "chevron-izq",
  "atras",
  "flecha",
  "flecha-izq",
  "ayuda",
] as const;

export type NombreIcono = (typeof ICONOS)[number];
