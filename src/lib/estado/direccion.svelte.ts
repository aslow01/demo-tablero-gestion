// Estado reactivo de la dirección (docs/diseno-ui.md, sección 2; docs/diseno.md, S5). Une el enrutador (puro), los datos y la barra de direcciones
// (`Ubicacion`, reemplazable para probar en Node). No tiene reglas: las reglas son del enrutador, de la navegación y del dominio. Las pantallas LEEN de
// acá (ruta, corte, avisos, sección, migas, destino de «Atrás») y llaman a `ir`, `reemplazar`, `atras` y `cambiarCorte`; nada más toca `location.hash`.
//
// - Cada cambio de vista o de corte es una entrada nueva del historial (`ubicacion.irA`): «Atrás» deshace el último cambio.
// - Una dirección con corte o mes inválido se corrige con `reemplazarHash` (`history.replaceState`): sin entrada nueva. El aviso queda en el estado
//   hasta que cambia el corte o la vista, o se lo cierra.
// - Lo que se escribe en un campo (la búsqueda) se guarda con `reemplazar`: cambia la barra sin entrada nueva y el estado vuelve a leerla.
// - Un cambio de hash que no es una dirección de la aplicación (un ancla: `#principal`, `#saldo-final`) se ignora.
// - El recorrido (hasta 60 direcciones) dice si hay una pantalla anterior real: con ella «Atrás» usa el historial; sin ella (un enlace directo) va al padre.

import { cierresDeMes, resolverCorte } from "../dominio/corte.ts";
import { clavesExistentes } from "../dominio/medidas.ts";
import type { Datos, FechaCivil } from "../dominio/tipos.ts";
import { aHash, esAncla, esNavegable, idDeVista, resolverDireccion } from "./enrutador.ts";
import type { AvisoDeDireccion, Direccion, Ruta, RutaNavegable } from "./enrutador.ts";
import { esRaiz, llegoDesdeComprobantes, migasDe, padreDe, seccionDe } from "./navegacion.ts";
import type { PasoDeMigas, Seccion } from "./navegacion.ts";
import type { Ubicacion } from "./ubicacion.ts";

/** Cuántas direcciones recuerda el recorrido; las más viejas se olvidan. */
const LARGO_MAXIMO_DEL_RECORRIDO = 60;

/**
 * Por qué la aplicación cambió de pantalla por su cuenta. La pantalla lo lee y muestra un aviso; el texto no está acá.
 * `sin-otros`: se miraba el desglose de «Otros» y en el cierre al que se pasó (`corte`) ese grupo no existe; se muestra la mora de todos los clientes.
 */
export interface Redireccion {
  motivo: "sin-otros";
  corte: FechaCivil;
}

export interface OpcionesDeDireccion {
  /**
   * Envuelve el cambio cuando cambia la **vista** (no el corte, ni una búsqueda, ni un ancla): recibe `aplicar`, que hay que llamar una sola vez y
   * enseguida (por ejemplo dentro de `document.startViewTransition`). Por defecto la llama sin más. Lo usa el movimiento entre pantallas.
   */
  alCambiarVista?: (aplicar: () => void) => void;
  /** Se llama después de aplicar cada dirección nueva leída de la barra (no con los anclas), con la dirección ya corregida. */
  alAplicar?: (direccion: Direccion) => void;
}

export interface EstadoDeDireccion {
  /** La dirección resuelta: ruta, corte y avisos tal como los dio el enrutador al leer la barra. */
  readonly direccion: Direccion;
  /** La vista que hay que mostrar (incluye `inexistente` y `desconocida`: un estado de error de la vista, nunca una página en blanco). */
  readonly ruta: Ruta;
  /** El corte vigente: siempre un cierre de mes del rango. */
  readonly corte: FechaCivil;
  /** Los avisos que hay que mostrar ahora (S5 y el del mes); `cerrarAviso` los saca de a uno. */
  readonly avisos: readonly AvisoDeDireccion[];
  /** Los cierres de mes que ofrece el selector de corte, en orden (22 con el calendario fijo de la demo). */
  readonly cortes: readonly FechaCivil[];
  /** Identifica la vista y su sujeto: cuando cambia, el foco va al `h1`; si cambia solo el corte (o la búsqueda), no. Ver `idDeVista`. */
  readonly vista: string;
  /** Si el último cambio lo hizo la aplicación y no quien la usa; dura como los avisos: hasta que cambia el cierre o la vista, o se lo cierra. */
  readonly redireccion: Redireccion | null;
  /** La pestaña que queda marcada; `null` en «Cómo se calcula» y en los errores. */
  readonly seccion: Seccion | null;
  /** ¿Es una de las cuatro pantallas que son una pestaña? (en el celular, ahí no hay botón «Atrás»). */
  readonly esRaiz: boolean;
  /** El camino hasta la pantalla, sin texto (ver `navegacion.ts`). */
  readonly migas: readonly PasoDeMigas[];
  /** La pantalla de la que cuelga esta (la miga anterior, o el Resumen). */
  readonly padre: RutaNavegable;
  /** La pantalla anterior del recorrido si la hay y es una ruta válida; `null` si no hay (un enlace directo) o venía de un error. */
  readonly anterior: RutaNavegable | null;
  /** A dónde lleva «Atrás»: la pantalla anterior del recorrido si la hay (`anterior`); si no, el padre. */
  readonly destinoDeAtras: RutaNavegable;
  /** Las direcciones visitadas, de la más vieja a la actual (hasta 60). «Atrás» saca la última; una dirección nueva la suma. */
  readonly recorrido: readonly string[];
  /** Navega a una vista con el corte actual: una entrada nueva del historial. A la pantalla en la que ya se está no hace nada. */
  ir(ruta: RutaNavegable): void;
  /**
   * Cambia la dirección de la pantalla actual **sin entrada nueva** y vuelve a leerla (para lo que se escribe: la búsqueda). No es para cambiar de
   * vista. Los avisos que estén a la vista siguen ahí.
   */
  reemplazar(ruta: RutaNavegable): void;
  /** «Atrás»: con una pantalla anterior en el recorrido, vuelve en el historial; sin ella (un enlace directo), va al padre con una entrada nueva. */
  atras(): void;
  /** Cambia el corte conservando la vista y sus filtros: una entrada nueva. `false` (y no hace nada) si no es un cierre de mes del rango. */
  cambiarCorte(corte: string): boolean;
  /**
   * Pasa al cierre anterior (`-1`) o al siguiente (`1`) **del que dice la barra ahora**, no del que ya se dibujó: el navegador avisa del cambio de hash
   * un rato después, y un segundo clic en ‹ o › que llega antes tiene que contar. `false` (y no hace nada) si no hay cierre en esa dirección.
   */
  moverCorte(paso: -1 | 1): boolean;
  /** El hash de una ruta (para `href`), con el corte actual o con `corte` si se lo da. */
  enlace(ruta: RutaNavegable, corte?: FechaCivil): string;
  /** Cierra un aviso. Cerrar uno que no está no hace nada. */
  cerrarAviso(clase: AvisoDeDireccion["clase"]): void;
  /** Cierra el aviso de la redirección (el motivo deja de estar). */
  cerrarRedireccion(): void;
  /** Deja de escuchar la barra de direcciones. */
  destruir(): void;
}

export function crearEstadoDeDireccion(datos: Datos, ubicacion: Ubicacion, opciones: OpcionesDeDireccion = {}): EstadoDeDireccion {
  const cortes = cierresDeMes(datos);
  const alCambiarVista = opciones.alCambiarVista ?? ((aplicar: () => void): void => aplicar());

  /** Lee la barra y, si la dirección traía algo inválido que se puede corregir, la corrige sin agregar una entrada. */
  function leer(): Direccion {
    const hash = ubicacion.leerHash();
    const resuelta = resolverDireccion(hash, datos);
    if (resuelta.avisos.length > 0 && esNavegable(resuelta.ruta)) {
      const canonico = aHash(resuelta.ruta, resuelta.corte);
      if (canonico !== hash) ubicacion.reemplazarHash(canonico);
    }
    return resuelta;
  }

  const inicial = leer();
  let direccion = $state.raw<Direccion>(inicial);
  let avisos = $state.raw<readonly AvisoDeDireccion[]>(inicial.avisos);
  let recorrido = $state.raw<readonly string[]>([ubicacion.leerHash() || "#/"]);
  let redireccion = $state.raw<Redireccion | null>(null);
  /** El motivo del cambio que la aplicación acaba de pedir; lo recoge el próximo cambio de la barra (en el navegador llega después, por `hashchange`). */
  let pendiente: Redireccion | null = null;

  // `$derived` y no un getter sobre `direccion`: un efecto que lee la vista (o la sección) solo se vuelve a correr si cambia el valor, no con cada dirección
  // nueva. Es lo que impide que escribir en el buscador mueva el foco (R2).
  const vista = $derived(idDeVista(direccion.ruta));
  // Un comprobante cuelga de la lista de la que se salió (Comprobantes) o, si no hay origen (un enlace directo), de Clientes. La sección que marca el menú y
  // las migas salen de lo mismo, así que no pueden contradecirse. Es un booleano: escribir en un campo (que cambia el último elemento del recorrido) no lo mueve.
  const desdeComprobantes = $derived(
    direccion.ruta.tipo === "comprobante" && llegoDesdeComprobantes(recorrido.slice(0, -1).map((hash) => resolverDireccion(hash, datos).ruta)),
  );
  const seccion = $derived(seccionDe(direccion.ruta, desdeComprobantes));
  const raiz = $derived(esRaiz(direccion.ruta));

  /** Suma la dirección actual al recorrido, o saca la última si se volvió a la anterior. */
  function registrar(actual: string): void {
    if (recorrido.length > 1 && recorrido.at(-2) === actual) recorrido = recorrido.slice(0, -1);
    else if (recorrido.at(-1) !== actual) recorrido = [...recorrido, actual].slice(-LARGO_MAXIMO_DEL_RECORRIDO);
  }

  // El movimiento entre pantallas aplica el cambio *después* (el navegador llama a `aplicar` cuando toma la foto de «antes»): entre el cambio de la barra y
  // ese momento pasan uno o dos cuadros, y en ese rato puede llegar otro cambio («Atrás» enseguida, un segundo clic). Dos reglas para que el estado nunca
  // quede en una dirección distinta de la de la barra:
  // - Lo que se compara para saber si cambió la vista es la dirección MÁS RECIENTE (`ultima`), no la que ya se dibujó.
  // - Los cambios se aplican siempre en el orden en que llegaron: cada uno entra en `porAplicar`, y se aplican todos los que haya cuando el navegador
  //   llama a una de las devoluciones (el último manda). Un cambio de la misma pantalla (una búsqueda) espera atrás de los que estén esperando.
  let ultima: Direccion = inicial;
  const porAplicar: (() => void)[] = [];
  let esperando = 0;

  /** Aplica todo lo que espera, en orden. Si un cambio lanza, los siguientes se aplican igual y, al final, se vuelve a lanzar el primer error (no se traga). */
  function aplicarLoQueEspera(): void {
    let fallo: { error: unknown } | null = null;
    for (const aplicar of porAplicar.splice(0)) {
      try {
        aplicar();
      } catch (error) {
        fallo ??= { error };
      }
    }
    if (fallo !== null) throw fallo.error;
  }

  /** Pone `aplicar` en la cola. Si cambia la vista, pasa por el gancho del movimiento; si no, se aplica enseguida salvo que haya algo esperando. */
  function encolar(aplicar: () => void, cambiaLaVista: boolean): void {
    porAplicar.push(aplicar);
    if (cambiaLaVista) {
      esperando += 1;
      let llamada = false;
      alCambiarVista(() => {
        if (llamada) return;
        llamada = true;
        esperando -= 1;
        aplicarLoQueEspera();
      });
    } else if (esperando === 0) {
      aplicarLoQueEspera();
    }
  }

  const dejarDeEscuchar = ubicacion.alCambiar(() => {
    // Un ancla no es una ruta; no cambia nada (la vista que se ve sigue siendo la misma).
    if (esAncla(ubicacion.leerHash())) return;
    const nueva = leer();
    const hash = ubicacion.leerHash() || "#/";
    const motivo = pendiente;
    pendiente = null;
    const cambiaLaVista = idDeVista(nueva.ruta) !== idDeVista(ultima.ruta);
    ultima = nueva;
    encolar(() => {
      direccion = nueva;
      avisos = nueva.avisos;
      redireccion = motivo;
      registrar(hash);
      opciones.alAplicar?.(nueva);
    }, cambiaLaVista);
  });

  function navegar(hash: string): void {
    if (hash !== ubicacion.leerHash()) ubicacion.irA(hash);
  }

  /** El padre de la ruta actual (el Resumen si la ruta es un error). */
  function padre(): RutaNavegable {
    return padreDe(direccion.ruta, datos, direccion.corte, desdeComprobantes);
  }

  /** La pantalla anterior del recorrido si la hay y es una ruta válida; si no (un enlace directo, o venía de un error), `null`. */
  function anterior(): RutaNavegable | null {
    const previa = recorrido.length > 1 ? resolverDireccion(recorrido.at(-2) ?? "", datos).ruta : null;
    return previa !== null && esNavegable(previa) ? previa : null;
  }

  return {
    get direccion() {
      return direccion;
    },
    get ruta() {
      return direccion.ruta;
    },
    get corte() {
      return direccion.corte;
    },
    get avisos() {
      return avisos;
    },
    get vista() {
      return vista;
    },
    get redireccion() {
      return redireccion;
    },
    get seccion() {
      return seccion;
    },
    get esRaiz() {
      return raiz;
    },
    get migas() {
      return migasDe(direccion.ruta, datos, direccion.corte, desdeComprobantes);
    },
    get padre() {
      return padre();
    },
    get anterior() {
      return anterior();
    },
    get destinoDeAtras() {
      return anterior() ?? padre();
    },
    get recorrido() {
      return recorrido;
    },
    cortes,
    ir(ruta) {
      const destino = aHash(ruta, ultima.corte);
      const actual = ubicacion.leerHash();
      if (destino === actual) return;
      // Ya se está en esa pantalla (la barra dice lo mismo con otra forma, como `#/` y `#/resumen?corte=`): no se agrega una entrada repetida.
      if (!esAncla(actual) && esNavegable(ultima.ruta) && aHash(ultima.ruta, ultima.corte) === destino) return;
      ubicacion.irA(destino);
    },
    reemplazar(ruta) {
      const hash = aHash(ruta, ultima.corte);
      if (hash === ubicacion.leerHash()) return;
      ubicacion.reemplazarHash(hash);
      // La barra cambió sin avisar: se vuelve a leer a mano. No se tocan los avisos (siguen a la vista) ni se pasa por `alCambiarVista`.
      const nueva = resolverDireccion(hash, datos);
      ultima = nueva;
      encolar(() => {
        direccion = nueva;
        recorrido = [...recorrido.slice(0, -1), hash];
      }, false);
    },
    atras() {
      if (recorrido.length > 1) ubicacion.atras();
      else navegar(aHash(padre(), direccion.corte));
    },
    cambiarCorte(corte) {
      if (resolverCorte(corte, datos).aviso !== null) return false;
      // Una vista de error no tiene una dirección que reconstruir: con otro corte se vuelve al Resumen.
      const ruta: RutaNavegable = esNavegable(ultima.ruta) ? ultima.ruta : { tipo: "resumen" };
      // «Otros» no existe en todos los cierres. Quien lo mira y pasa a un cierre sin «Otros» no ve un error: ve la mora de todos, con el motivo.
      if (ruta.tipo === "desglose" && ruta.clave === "mora-otros" && !clavesExistentes(datos, corte).includes("mora-otros")) {
        const deTodos: RutaNavegable = ruta.agrupar === undefined ? { tipo: "desglose", clave: "mora" } : { tipo: "desglose", clave: "mora", agrupar: ruta.agrupar };
        pendiente = { motivo: "sin-otros", corte };
        navegar(aHash(deTodos, corte));
        return true;
      }
      navegar(aHash(ruta, corte));
      return true;
    },
    moverCorte(paso) {
      const hash = ubicacion.leerHash();
      // Un ancla no cambia la dirección: el corte vigente es el último que se leyó.
      const vigente = esAncla(hash) ? ultima.corte : resolverDireccion(hash, datos).corte;
      const destino = cortes[cortes.indexOf(vigente) + paso];
      return destino === undefined ? false : this.cambiarCorte(destino);
    },
    enlace(ruta, corte = direccion.corte) {
      return aHash(ruta, corte);
    },
    cerrarAviso(clase) {
      avisos = avisos.filter((a) => a.clase !== clase);
    },
    cerrarRedireccion() {
      redireccion = null;
    },
    destruir: dejarDeEscuchar,
  };
}
