// La aplicación (docs/diseno-ui.md, secciones 2 y 8): el único lugar donde se juntan los datos de ejemplo, la dirección, la memoria de la vista y la
// verificación del cierre. El marco la crea una vez al arrancar y se la pasa a las pantallas; las pantallas no cargan nada ni calculan nada por su cuenta.
// - Si los datos no pasan las validaciones (`cargarDatosDeEjemplo`), es una aplicación **con error**: el marco muestra la pantalla de error de inicio y no
//   hay dirección ni cálculos.
// - Si está lista, `cierre` dice si el cierre del corte vigente cierra (controles cruzados X1 a X6, una vez por cierre): si no cierra, el marco muestra
//   la pantalla de error de cierre y ninguna pantalla muestra una cifra.
// Escrito de nuevo para esta demo (docs/procedencia.md).

import { cargarDatosDeEjemplo } from "../datos/cargar.ts";
import type { CargadoDeEjemplo } from "../datos/cargar.ts";
import type { Datos, FechaCivil } from "../dominio/tipos.ts";
import { crearVerificadorDeCierres } from "./cierre.ts";
import type { ResultadoDeCierre } from "./cierre.ts";
import { crearEstadoDeDireccion } from "./direccion.svelte.ts";
import type { EstadoDeDireccion, OpcionesDeDireccion } from "./direccion.svelte.ts";
import { crearMemoriaDeVista } from "./memoria-de-vista.svelte.ts";
import type { MemoriaDeVista } from "./memoria-de-vista.svelte.ts";
import type { Ubicacion } from "./ubicacion.ts";

export interface OpcionesDeAplicacion {
  /** De dónde salen los datos; por defecto, los datos de ejemplo (semilla publicada). Para los tests. */
  cargar?: () => CargadoDeEjemplo;
  /** Los controles del cierre; por defecto `exigirControles`. Para los tests. */
  controlar?: (datos: Datos, corte: FechaCivil) => void;
  /** Ver `OpcionesDeDireccion.alCambiarVista`: el movimiento entre pantallas. */
  alCambiarVista?: OpcionesDeDireccion["alCambiarVista"];
}

/** Los datos no pasaron las validaciones: `mensaje` es el texto para el usuario; no hay nada más. */
export type AplicacionConError = Extract<CargadoDeEjemplo, { estado: "error" }>;

/** Lista para usar. Trae también lo que entregue la carga de datos junto con `datos`: `plantados`, los alias de los casos de 5.3 → su id. */
export type AplicacionLista = Extract<CargadoDeEjemplo, { estado: "ok" }> & {
  readonly direccion: EstadoDeDireccion;
  readonly memoria: MemoriaDeVista;
  /** El cierre del corte vigente: `ok`, o el error de cierre del primer control que no cierra. Sigue al corte (reactivo). */
  readonly cierre: ResultadoDeCierre;
  /** Deja de escuchar la barra de direcciones. */
  destruir(): void;
};

export type Aplicacion = AplicacionConError | AplicacionLista;

export function crearAplicacion(ubicacion: Ubicacion, opciones: OpcionesDeAplicacion = {}): Aplicacion {
  const cargado = (opciones.cargar ?? cargarDatosDeEjemplo)();
  if (cargado.estado === "error") return cargado;

  const memoria = crearMemoriaDeVista();
  const direccion = crearEstadoDeDireccion(cargado.datos, ubicacion, {
    ...(opciones.alCambiarVista === undefined ? {} : { alCambiarVista: opciones.alCambiarVista }),
    alAplicar: (d) => memoria.alVerRuta(d.ruta),
  });
  memoria.alVerRuta(direccion.ruta);
  const verificar = crearVerificadorDeCierres(cargado.datos, opciones.controlar);

  return {
    ...cargado,
    direccion,
    memoria,
    get cierre() {
      return verificar(direccion.corte);
    },
    destruir: direccion.destruir,
  };
}
