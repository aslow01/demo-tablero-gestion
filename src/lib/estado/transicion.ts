// Movimiento entre pantallas (docs/diseno-ui.md, 3.6). Propio de esta demo.
//
// - Al cambiar de **pantalla** (no de corte, ni una búsqueda, ni un ancla) el contenido sale y entra con una transición corta (View Transitions). Quien llama
//   es el estado de la dirección (`alCambiarVista`): recibe `aplicar`, que cambia el estado, y la devolución de llamada del navegador espera a que Svelte
//   dibuje (`esperarElDibujo`) antes de que el navegador tome la foto de «después»; sin esa espera hay un parpadeo.
// - El número de un comprobante o el nombre de un cliente **viaja** de la tabla al título: quien lo pulsa (`alPulsarOrigen`) queda marcado hasta el cambio de
//   pantalla y, ya dibujada la pantalla nueva, se marca su título (`marcarDestino`). Una marca que no llegó a un cambio de pantalla (un clic con Ctrl, un
//   enlace a la misma pantalla) vence a los `VENTANA_DEL_ORIGEN_MS` y no se usa.
// - **Al cambiar el corte no se anima nada** (no pasa por acá: el estado de la dirección solo llama a `alCambiarVista` cuando cambia la pantalla) y nada se
//   anima con `prefers-reduced-motion`. Sin View Transitions (todo navegador que no es Chrome ni Chromium, y los que no tienen la API: `usaViewTransitions`) entra una animación de CSS equivalente (`entrarSinTransicion`).
// - Todo lo que toca el navegador está en `movimientoDelNavegador`; el resto se prueba en Node con un entorno de mentira.

/** Cuánto puede pasar entre el clic en un origen y el cambio de pantalla para que el nombre viaje (el cambio de hash llega en pocos milisegundos). */
export const VENTANA_DEL_ORIGEN_MS = 1000;

/** Lo que usa este módulo de una transición del navegador (`ViewTransition`). */
export interface TransicionEnCurso {
  /** Se cumple cuando la transición ya se dibuja; **se rechaza si se la salta** (otra empezó antes de que termine, o la página no está a la vista). */
  readonly ready: Promise<unknown>;
  readonly finished: Promise<unknown>;
}

/** Lo que este módulo necesita del navegador. En Node, un reemplazo que anota las llamadas. */
export interface EntornoDeMovimiento {
  /** `document.startViewTransition`, o `null` si no se usa (el navegador no la tiene o no es Chrome ni Chromium). */
  iniciar: ((actualizar: () => Promise<void>) => TransicionEnCurso) | null;
  /** `prefers-reduced-motion: reduce`, leído en cada cambio (se puede activar con la página abierta). */
  movimientoReducido(): boolean;
  /** Se cumple cuando Svelte ya dibujó los cambios de estado pendientes (`tick`). */
  esperarElDibujo(): Promise<void>;
  /** Un reloj en milisegundos para medir la ventana del origen (`performance.now`). */
  ahora(): number;
  /** Mientras dura la transición, la pantalla (`main`) tiene nombre propio y entra y sale sin mover el resto del marco. */
  enTransicion(activa: boolean): void;
  /** Saca la marca de lo que viaja de todo elemento que la tenga. */
  soltarMarcas(): void;
  /** Marca el título de la pantalla nueva como destino de lo que viaja. */
  marcarDestino(): void;
  /** Animación de entrada de CSS, para cuando no hay View Transitions. */
  entrarSinTransicion(): void;
}

export interface Movimiento {
  /** Para `OpcionesDeDireccion.alCambiarVista`: llama a `aplicar` una sola vez, con o sin transición. */
  alCambiarVista(aplicar: () => void): void;
  /**
   * Un origen que puede viajar (una cifra-enlace de una tabla, un nombre) acaba de ser pulsado: `marcar` lo marca. No hace nada si no habrá transición
   * (movimiento reducido o sin View Transitions).
   */
  alPulsarOrigen(marcar: () => void): void;
}

/** El `AbortError` con el que el navegador rechaza una transición que se saltó (otra empezó antes de que terminara, o la página no estaba a la vista). */
function esTransicionSaltada(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export function crearMovimiento(entorno: EntornoDeMovimiento): Movimiento {
  /** Cuándo se marcó el último origen; `null` si no hay ninguno pendiente. */
  let origenDesde: number | null = null;
  /** La transición más reciente: solo ella limpia al terminar (si una nueva empieza, la anterior se salta y no debe borrarle las marcas a la nueva). */
  let ultima = 0;

  function conTransicion(): boolean {
    return entorno.iniciar !== null && !entorno.movimientoReducido();
  }

  return {
    alPulsarOrigen(marcar) {
      if (!conTransicion()) return;
      entorno.soltarMarcas();
      marcar();
      origenDesde = entorno.ahora();
    },

    alCambiarVista(aplicar) {
      const hayOrigen = origenDesde !== null && entorno.ahora() - origenDesde <= VENTANA_DEL_ORIGEN_MS;
      origenDesde = null;
      if (!hayOrigen) entorno.soltarMarcas();

      const iniciar = entorno.iniciar;
      if (iniciar === null || entorno.movimientoReducido()) {
        entorno.soltarMarcas();
        aplicar();
        if (iniciar === null && !entorno.movimientoReducido()) entorno.entrarSinTransicion();
        return;
      }

      const esta = ++ultima;
      const limpiar = (): void => {
        if (esta !== ultima) return;
        entorno.enTransicion(false);
        entorno.soltarMarcas();
      };
      entorno.enTransicion(true);
      const transicion = iniciar(async () => {
        aplicar();
        await entorno.esperarElDibujo();
        if (hayOrigen) entorno.marcarDestino();
      });
      // Saltar una transición (un segundo clic antes de que termine la primera) es normal: no es un error y no debe llegar a la consola.
      transicion.ready.catch(() => undefined);
      // Se limpia siempre. Si `finished` se rechaza porque la devolución de llamada lanzó (o `startViewTransition` falló), eso es un error real y se avisa por la consola;
      // el `AbortError` de una transición saltada, no.
      void transicion.finished.then(limpiar, (error: unknown) => {
        limpiar();
        if (!esTransicionSaltada(error)) console.error("La transición entre pantallas falló:", error);
      });
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// El navegador. Único lugar que toca `document`, `matchMedia` y `performance`.
// ---------------------------------------------------------------------------------------------------------------------------------------

/** Atributo que, con el CSS de `movimiento.css`, le da nombre de transición («viaja») al origen y al destino. */
const ATRIBUTO_VIAJANDO = "data-viajando";
/** Lo que puede viajar: lo marca el marcado de cada pantalla. */
const SELECTOR_DE_ORIGEN = "a[data-viaja]";
const SELECTOR_DE_DESTINO = "#principal h1[data-viaja]";
const CLASE_EN_TRANSICION = "en-transicion";
const CLASE_DE_ENTRADA = "entra";

/**
 * ¿Se usa `startViewTransition` en este navegador? Solo en Chrome y Chromium (lista de permitidos): el agente de usuario tiene que decir «Chrome/» o
 * «Chromium/» y no «CriOS/», «FxiOS/», «EdgiOS/» ni «OPiOS/» (los navegadores de iPhone, que por dentro son Safari). Todo lo demás (Safari, Firefox, un agente
 * desconocido o vacío) va por el camino directo, con la animación de CSS de respaldo, que anda en todos lados y deja el mismo resultado final (foco, título,
 * anuncio, página arriba). Motivo: la transición solo se probó en Chromium; el WebKit 26.5 de Playwright para Windows se cuelga («Page crashed») al navegar con
 * ella, no se pudo mirar en un Safari real y Firefox, que ya trae la API, no se probó.
 */
export function usaViewTransitions(navegador: { userAgent: string }): boolean {
  const ua = navegador.userAgent;
  if (/\b(CriOS|FxiOS|EdgiOS|OPiOS)\//.test(ua)) return false;
  return /\b(Chrome|Chromium)\//.test(ua);
}

/**
 * `document.startViewTransition`, pero en el turno siguiente (`setTimeout` de 0 ms) y no dentro del propio cambio de dirección, y con las transiciones de CSS
 * que estén corriendo ya terminadas (el fondo de una fila que se acaba de apuntar con el mouse, 120 ms: terminarlas no se ve). Esto nació para esquivar un
 * cuelgue del WebKit de Playwright, pero ese navegador ya no llega acá (`usaViewTransitions`): hoy solo corre en Chromium, donde no hace falta y no cambia lo que
 * se ve. Se deja para no cambiar el movimiento de Chromium; no se probó sacarlo y no se afirma que haga falta.
 * Si el navegador lanza al empezar, el cambio igual se aplica: sin transición, pero sin dejar la pantalla vieja.
 */
function iniciarEnElSiguienteTurno(actualizar: () => Promise<void>): TransicionEnCurso {
  const real = new Promise<TransicionEnCurso>((resolver, rechazar) => {
    setTimeout(() => {
      try {
        for (const animacion of document.getAnimations()) if (animacion instanceof CSSTransition) animacion.finish();
        resolver(document.startViewTransition(actualizar));
      } catch (error) {
        void actualizar();
        rechazar(error);
      }
    }, 0);
  });
  return { ready: real.then((t) => t.ready), finished: real.then((t) => t.finished) };
}

export interface MovimientoDelNavegador extends Movimiento {
  /** Escucha los clics en los orígenes que viajan. Devuelve cómo dejar de escuchar. */
  escuchar(): () => void;
}

/**
 * El movimiento del navegador. `esperarElDibujo` es `tick` de Svelte (se pasa de afuera para que este módulo no dependa de Svelte y se pruebe en Node).
 * Todo lo que se marca se marca con el atributo `data-viajando` y una clase en la raíz (nada de `style` en línea: la política de contenido lo vigila).
 */
export function movimientoDelNavegador(esperarElDibujo: () => Promise<void>): MovimientoDelNavegador {
  const reducido = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  // Sin la API, o fuera de Chrome y Chromium (Safari, Firefox, agente desconocido), `iniciar` es `null`: el cambio es directo y entra la animación de CSS.
  const iniciar = typeof document.startViewTransition === "function" && usaViewTransitions(navigator) ? iniciarEnElSiguienteTurno : null;

  const soltarMarcas = (): void => {
    for (const e of document.querySelectorAll(`[${ATRIBUTO_VIAJANDO}]`)) e.removeAttribute(ATRIBUTO_VIAJANDO);
  };

  const movimiento = crearMovimiento({
    iniciar,
    movimientoReducido: () => reducido === null || reducido.matches,
    esperarElDibujo,
    ahora: () => performance.now(),
    enTransicion: (activa) => document.documentElement.classList.toggle(CLASE_EN_TRANSICION, activa),
    soltarMarcas,
    marcarDestino() {
      const destino = document.querySelector(SELECTOR_DE_DESTINO);
      if (destino === null) return;
      // Dos elementos con el mismo nombre anulan la transición entera: si el origen sobrevivió al cambio de pantalla, pierde la marca.
      soltarMarcas();
      destino.setAttribute(ATRIBUTO_VIAJANDO, "");
    },
    entrarSinTransicion() {
      const principal = document.getElementById("principal");
      if (principal === null) return;
      principal.classList.remove(CLASE_DE_ENTRADA);
      void principal.offsetWidth; // reinicia la animación si ya estaba puesta
      principal.classList.add(CLASE_DE_ENTRADA);
    },
  });

  return {
    ...movimiento,
    escuchar() {
      const alPulsar = (e: MouseEvent): void => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const origen = e.target instanceof Element ? e.target.closest(SELECTOR_DE_ORIGEN) : null;
        if (origen !== null) movimiento.alPulsarOrigen(() => origen.setAttribute(ATRIBUTO_VIAJANDO, ""));
      };
      document.addEventListener("click", alPulsar);
      return () => document.removeEventListener("click", alPulsar);
    },
  };
}
