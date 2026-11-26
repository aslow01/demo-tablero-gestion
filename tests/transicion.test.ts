// Movimiento entre pantallas (src/lib/estado/transicion.ts): cuándo hay transición, en qué orden pasan las cosas, qué viaja y qué no se anima nunca.
// Se prueba con un entorno de mentira que anota las llamadas; lo que toca el navegador de verdad lo mira el recorrido con el *build* servido.
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CargadoDeEjemplo } from "../src/lib/datos/cargar.ts";
import { crearAplicacion } from "../src/lib/estado/aplicacion.svelte.ts";
import type { AplicacionLista } from "../src/lib/estado/aplicacion.svelte.ts";
import { VENTANA_DEL_ORIGEN_MS, crearMovimiento, movimientoDelNavegador, usaViewTransitions } from "../src/lib/estado/transicion.ts";
import type { EntornoDeMovimiento } from "../src/lib/estado/transicion.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

/** Un navegador de mentira. `transiciones` guarda cada transición iniciada, con la devolución de llamada y cómo terminarla. */
function entornoDeMentira(opciones: { viewTransitions?: boolean; reducido?: boolean } = {}) {
  const registro: string[] = [];
  const transiciones: { actualizar: () => Promise<void>; terminar: () => void }[] = [];
  const estado = { reducido: opciones.reducido ?? false, reloj: 0 };
  const entorno: EntornoDeMovimiento = {
    iniciar:
      opciones.viewTransitions === false
        ? null
        : (actualizar) => {
            registro.push("iniciar");
            let terminar: () => void = () => undefined;
            const finished = new Promise<void>((resolver) => {
              terminar = resolver;
            });
            transiciones.push({ actualizar, terminar });
            return { ready: Promise.resolve(), finished };
          },
    movimientoReducido: () => estado.reducido,
    esperarElDibujo: () => {
      registro.push("dibujo");
      return Promise.resolve();
    },
    ahora: () => estado.reloj,
    enTransicion: (activa) => registro.push(activa ? "en-transicion" : "fuera-de-transicion"),
    soltarMarcas: () => registro.push("soltar"),
    marcarDestino: () => registro.push("destino"),
    entrarSinTransicion: () => registro.push("entra"),
  };
  return { entorno, registro, transiciones, estado };
}

/** Deja correr las promesas pendientes (la devolución de llamada es asíncrona y la transición termina después). */
const dejarCorrer = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe("alCambiarVista con View Transitions", () => {
  it("llama a `aplicar` una sola vez, dentro de la devolución de llamada del navegador, y espera el dibujo antes de dar el cambio por hecho", async () => {
    const { entorno, registro, transiciones } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    const orden: string[] = [];
    movimiento.alCambiarVista(() => orden.push("aplicar"));
    expect(orden).toEqual([]); // todavía no: lo llama el navegador cuando toma la foto de «antes»
    expect(transiciones).toHaveLength(1);
    await transiciones[0]?.actualizar();
    expect(orden).toEqual(["aplicar"]);
    expect(registro).toEqual(["soltar", "en-transicion", "iniciar", "dibujo"]);
  });

  it("mientras dura la transición la pantalla tiene nombre; al terminar se limpia todo", async () => {
    const { entorno, registro, transiciones } = entornoDeMentira();
    crearMovimiento(entorno).alCambiarVista(() => undefined);
    await transiciones[0]?.actualizar();
    transiciones[0]?.terminar();
    await dejarCorrer();
    expect(registro.slice(-2)).toEqual(["fuera-de-transicion", "soltar"]);
  });

  it("sin haber pulsado un origen no se marca ningún destino", async () => {
    const { entorno, registro, transiciones } = entornoDeMentira();
    crearMovimiento(entorno).alCambiarVista(() => undefined);
    await transiciones[0]?.actualizar();
    expect(registro).not.toContain("destino");
  });

  it("con un origen pulsado, el destino se marca después de que Svelte dibujó la pantalla nueva", async () => {
    const { entorno, registro, transiciones } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    const marcas: string[] = [];
    movimiento.alPulsarOrigen(() => marcas.push("origen"));
    movimiento.alCambiarVista(() => registro.push("aplicar"));
    await transiciones[0]?.actualizar();
    expect(marcas).toEqual(["origen"]);
    expect(registro.slice(-3)).toEqual(["aplicar", "dibujo", "destino"]);
  });

  it("pulsar un origen suelta antes las marcas viejas", () => {
    const { entorno, registro } = entornoDeMentira();
    crearMovimiento(entorno).alPulsarOrigen(() => registro.push("marcar"));
    expect(registro).toEqual(["soltar", "marcar"]);
  });

  it("el origen se usa una sola vez: el cambio de pantalla siguiente ya no lleva destino", async () => {
    const { entorno, registro, transiciones } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    movimiento.alPulsarOrigen(() => undefined);
    movimiento.alCambiarVista(() => undefined);
    await transiciones[0]?.actualizar();
    registro.length = 0;
    movimiento.alCambiarVista(() => undefined);
    await transiciones[1]?.actualizar();
    expect(registro).not.toContain("destino");
  });

  it("un origen que no llegó a un cambio de pantalla (un clic con Ctrl, un enlace a la misma pantalla) vence y no se usa", async () => {
    const { entorno, registro, transiciones, estado } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    movimiento.alPulsarOrigen(() => undefined);
    estado.reloj = VENTANA_DEL_ORIGEN_MS + 1;
    registro.length = 0;
    movimiento.alCambiarVista(() => undefined);
    // La marca vencida se suelta antes de que el navegador tome la foto de «antes».
    expect(registro.slice(0, 2)).toEqual(["soltar", "en-transicion"]);
    await transiciones[0]?.actualizar();
    expect(registro).not.toContain("destino");
  });

  it("un origen justo dentro de la ventana todavía se usa", async () => {
    const { entorno, registro, transiciones, estado } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    movimiento.alPulsarOrigen(() => undefined);
    estado.reloj = VENTANA_DEL_ORIGEN_MS;
    movimiento.alCambiarVista(() => undefined);
    await transiciones[0]?.actualizar();
    expect(registro).toContain("destino");
  });

  it("si empieza otra transición antes de que termine la anterior, la anterior no le borra las marcas a la nueva", async () => {
    const { entorno, registro, transiciones } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    movimiento.alCambiarVista(() => undefined);
    movimiento.alCambiarVista(() => undefined);
    registro.length = 0;
    transiciones[0]?.terminar(); // el navegador salta la primera al empezar la segunda
    await dejarCorrer();
    expect(registro).toEqual([]);
    transiciones[1]?.terminar();
    await dejarCorrer();
    expect(registro).toEqual(["fuera-de-transicion", "soltar"]);
  });

  it("si la transición falla de verdad (la devolución de llamada lanzó), se limpia y el error llega a la consola", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const { entorno, registro } = entornoDeMentira();
      const error = new Error("falló");
      const falla: EntornoDeMovimiento = {
        ...entorno,
        iniciar: () => ({ ready: Promise.resolve(), finished: Promise.reject(error) }),
      };
      crearMovimiento(falla).alCambiarVista(() => undefined);
      await dejarCorrer();
      expect(registro.slice(-2)).toEqual(["fuera-de-transicion", "soltar"]);
      expect(consola).toHaveBeenCalledTimes(1);
      expect(consola.mock.calls[0]).toContain(error);
    } finally {
      consola.mockRestore();
    }
  });

  it("si la transición se salta (AbortError), se limpia y no se avisa de ningún error", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const { entorno, registro } = entornoDeMentira();
      const saltada: EntornoDeMovimiento = {
        ...entorno,
        iniciar: () => ({ ready: Promise.resolve(), finished: Promise.reject(new DOMException("Transition was skipped", "AbortError")) }),
      };
      crearMovimiento(saltada).alCambiarVista(() => undefined);
      await dejarCorrer();
      expect(registro.slice(-2)).toEqual(["fuera-de-transicion", "soltar"]);
      expect(consola).not.toHaveBeenCalled();
    } finally {
      consola.mockRestore();
    }
  });

  it("una transición saltada (el navegador rechaza `ready` con «Transition was skipped») no deja un error sin atender: vitest falla ante una promesa rechazada suelta", async () => {
    const { entorno, registro } = entornoDeMentira();
    const saltada: EntornoDeMovimiento = {
      ...entorno,
      iniciar: () => ({ ready: Promise.reject(new Error("Transition was skipped")), finished: Promise.resolve() }),
    };
    crearMovimiento(saltada).alCambiarVista(() => undefined);
    await dejarCorrer();
    expect(registro.slice(-2)).toEqual(["fuera-de-transicion", "soltar"]);
  });
});

describe("sin movimiento", () => {
  it("con `prefers-reduced-motion` aplica el cambio de una vez, sin transición, sin entrada y sin marcas", () => {
    const { entorno, registro } = entornoDeMentira({ reducido: true });
    const movimiento = crearMovimiento(entorno);
    let aplicado = 0;
    movimiento.alPulsarOrigen(() => registro.push("marcar"));
    movimiento.alCambiarVista(() => (aplicado += 1));
    expect(aplicado).toBe(1);
    expect(registro).not.toContain("iniciar");
    expect(registro).not.toContain("marcar");
    expect(registro).not.toContain("entra");
    expect(registro).not.toContain("en-transicion");
  });

  it("el movimiento reducido se lee en cada cambio, no una sola vez al arrancar", () => {
    const { entorno, registro, estado } = entornoDeMentira();
    const movimiento = crearMovimiento(entorno);
    movimiento.alCambiarVista(() => undefined);
    expect(registro).toContain("iniciar");
    registro.length = 0;
    estado.reducido = true;
    movimiento.alCambiarVista(() => undefined);
    expect(registro).not.toContain("iniciar");
  });

  it("sin View Transitions aplica el cambio de una vez y entra con la animación de CSS", () => {
    const { entorno, registro } = entornoDeMentira({ viewTransitions: false });
    const movimiento = crearMovimiento(entorno);
    let aplicado = 0;
    movimiento.alPulsarOrigen(() => registro.push("marcar"));
    movimiento.alCambiarVista(() => (aplicado += 1));
    expect(aplicado).toBe(1);
    expect(registro).toContain("entra");
    expect(registro).not.toContain("marcar");
  });

  it("sin View Transitions y con movimiento reducido no entra nada", () => {
    const { entorno, registro } = entornoDeMentira({ viewTransitions: false, reducido: true });
    crearMovimiento(entorno).alCambiarVista(() => undefined);
    expect(registro).not.toContain("entra");
  });
});

describe("conectado a la dirección: se anima el cambio de pantalla, nunca el de corte", () => {
  const datos = fixtureT12().datos;
  const cargar = (): CargadoDeEjemplo => ({ estado: "ok", datos, plantados: {} });

  function conMovimiento(hash: string) {
    const mentira = entornoDeMentira();
    const movimiento = crearMovimiento(mentira.entorno);
    const app = crearAplicacion(ubicacionEnMemoria(hash), { cargar, alCambiarVista: movimiento.alCambiarVista });
    if (app.estado !== "ok") throw new Error("se esperaba una aplicación lista");
    return { ...mentira, movimiento, app: app as AplicacionLista };
  }

  it("cambiar el corte no inicia ninguna transición ni marca nada", () => {
    const { app, registro, transiciones } = conMovimiento("");
    app.direccion.cambiarCorte("2026-09-30");
    expect(app.direccion.corte).toBe("2026-09-30");
    expect(transiciones).toHaveLength(0);
    expect(registro).toEqual([]);
  });

  it("escribir en un filtro o en la búsqueda (la misma pantalla) no inicia ninguna transición", () => {
    const { app, transiciones } = conMovimiento("#/comprobantes?corte=2026-10-31");
    app.direccion.reemplazar({ tipo: "comprobantes", q: "tec" });
    expect(transiciones).toHaveLength(0);
  });

  it("cambiar de pantalla inicia una sola transición, y el estado cambia cuando el navegador llama a la devolución", async () => {
    const { app, transiciones } = conMovimiento("");
    app.direccion.ir({ tipo: "meses" });
    expect(transiciones).toHaveLength(1);
    expect(app.direccion.ruta).toEqual({ tipo: "resumen" }); // todavía la de antes
    await transiciones[0]?.actualizar();
    expect(app.direccion.ruta).toEqual({ tipo: "meses" });
  });

  it("«Atrás» también es un cambio de pantalla: lleva transición, sin nombre que viaje", async () => {
    const { app, registro, transiciones } = conMovimiento("");
    app.direccion.ir({ tipo: "meses" });
    await transiciones[0]?.actualizar();
    registro.length = 0;
    app.direccion.atras();
    await transiciones[1]?.actualizar();
    expect(app.direccion.ruta).toEqual({ tipo: "resumen" });
    expect(registro).not.toContain("destino");
  });
});

// Los agentes de usuario son los que mandan hoy los navegadores (versiones de ejemplo).
const UA = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
  chromeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/151.0.0.0 Mobile/15E148 Safari/604.1",
  firefoxIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/146.0 Mobile/15E148 Safari/605.1.15",
  webkitPlaywright: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15",
  edgeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/151.0.0.0 Mobile/15E148 Safari/605.1.15",
  operaIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/16.0.0 Mobile/15E148 Safari/9537.53",
  firefoxAndroid: "Mozilla/5.0 (Android 15; Mobile; rv:146.0) Gecko/146.0 Firefox/146.0",
  chromium: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/151.0.0.0 Chrome/151.0.0.0 Safari/537.36",
};

describe("usaViewTransitions: solo Chrome y Chromium (lista de permitidos)", () => {
  it("Chrome, Edge, Chrome de Android y Chromium la usan", () => {
    for (const ua of [UA.chrome, UA.edge, UA.chromeAndroid, UA.chromium]) expect(usaViewTransitions({ userAgent: ua }), ua).toBe(true);
  });

  it("Safari, el WebKit de Playwright y todo navegador de iPhone (que por dentro son Safari) no", () => {
    for (const ua of [UA.safariMac, UA.safariIphone, UA.chromeIphone, UA.firefoxIphone, UA.edgeIphone, UA.operaIphone, UA.webkitPlaywright]) {
      expect(usaViewTransitions({ userAgent: ua }), ua).toBe(false);
    }
  });

  it("Firefox, de escritorio o de Android, no (trae la API pero no se probó)", () => {
    for (const ua of [UA.firefox, UA.firefoxAndroid]) expect(usaViewTransitions({ userAgent: ua }), ua).toBe(false);
  });

  it("un agente vacío, desconocido o que solo dice «Chrome» sin barra no la usa; un navegador de iPhone que dijera «Chrome/» tampoco", () => {
    for (const ua of ["", "Mozilla/5.0", "Chrome", "rastreador/1.0", `${UA.chromeIphone} Chrome/151.0.0.0`, `${UA.edgeIphone} Chrome/151.0.0.0`]) {
      expect(usaViewTransitions({ userAgent: ua }), ua).toBe(false);
    }
  });
});

describe("movimientoDelNavegador según el navegador", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Un `document` mínimo con `startViewTransition` espiado, y el navegador que se diga. Devuelve cuántas transiciones se pidieron y cuántas entradas de CSS hubo. */
  function navegador(userAgent: string) {
    const cuenta = { transiciones: 0, entradas: 0 };
    const principal = {
      classList: {
        remove: () => undefined,
        add: (clase: string) => {
          if (clase === "entra") cuenta.entradas++;
        },
      },
      offsetWidth: 0,
    };
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("navigator", { userAgent, vendor: "" });
    vi.stubGlobal("document", {
      startViewTransition: (actualizar: () => Promise<void>) => {
        cuenta.transiciones++;
        const hecho = Promise.resolve(actualizar());
        return { ready: hecho, finished: hecho };
      },
      getAnimations: () => [],
      getElementById: () => principal,
      querySelector: () => null,
      querySelectorAll: () => [],
      documentElement: { classList: { toggle: () => undefined } },
    });
    return cuenta;
  }
  const dejarPasarElTurno = (): Promise<void> => new Promise((listo) => setTimeout(listo, 20));

  it("en Chromium el cambio de pantalla usa startViewTransition y el estado cambia dentro de ella", async () => {
    const cuenta = navegador(UA.chrome);
    let aplicado = 0;
    movimientoDelNavegador(() => Promise.resolve()).alCambiarVista(() => aplicado++);
    await dejarPasarElTurno();
    expect(cuenta.transiciones).toBe(1);
    expect(aplicado).toBe(1);
    expect(cuenta.entradas).toBe(0);
  });

  it("en Firefox no se usa startViewTransition aunque la tenga: el estado cambia en el momento y entra la animación de CSS", async () => {
    const cuenta = navegador(UA.firefox);
    let aplicado = 0;
    movimientoDelNavegador(() => Promise.resolve()).alCambiarVista(() => aplicado++);
    expect(aplicado).toBe(1);
    await dejarPasarElTurno();
    expect(cuenta.transiciones).toBe(0);
    expect(cuenta.entradas).toBe(1);
  });

  it("con un agente de usuario vacío tampoco", async () => {
    const cuenta = navegador("");
    movimientoDelNavegador(() => Promise.resolve()).alCambiarVista(() => undefined);
    await dejarPasarElTurno();
    expect(cuenta.transiciones).toBe(0);
    expect(cuenta.entradas).toBe(1);
  });

  it("en WebKit que no es Chromium no se usa startViewTransition: el estado cambia igual, en el momento, y entra la animación de CSS", async () => {
    const cuenta = navegador(UA.webkitPlaywright);
    let aplicado = 0;
    movimientoDelNavegador(() => Promise.resolve()).alCambiarVista(() => aplicado++);
    expect(aplicado).toBe(1);
    await dejarPasarElTurno();
    expect(cuenta.transiciones).toBe(0);
    expect(cuenta.entradas).toBe(1);
  });

  it("en un navegador de iPhone tampoco (por dentro es Safari)", async () => {
    const cuenta = navegador(UA.chromeIphone);
    movimientoDelNavegador(() => Promise.resolve()).alCambiarVista(() => undefined);
    await dejarPasarElTurno();
    expect(cuenta.transiciones).toBe(0);
    expect(cuenta.entradas).toBe(1);
  });

  it("en Safari o en Firefox, pulsar un origen que viajaría no marca nada (no habrá transición)", () => {
    for (const ua of [UA.safariMac, UA.firefox]) {
      navegador(ua);
      let marcado = false;
      movimientoDelNavegador(() => Promise.resolve()).alPulsarOrigen(() => (marcado = true));
      expect(marcado, ua).toBe(false);
    }
  });
});
