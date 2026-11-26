// La aplicación (src/lib/estado/aplicacion.svelte.ts): carga los datos de ejemplo una vez y arma lo que usa el marco: la dirección, la memoria de la vista y la
// verificación del cierre vigente. Si los datos no pasan las validaciones, es una aplicación con error (pantalla de error al iniciar). Se llama
// *.svelte.test.ts para probar la reactividad con `$effect.root`.
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import type { CargadoDeEjemplo } from "../src/lib/datos/cargar.ts";
import { ErrorDeCierre } from "../src/lib/dominio/medidas.ts";
import type { FechaCivil } from "../src/lib/dominio/tipos.ts";
import { crearAplicacion } from "../src/lib/estado/aplicacion.svelte.ts";
import type { Aplicacion } from "../src/lib/estado/aplicacion.svelte.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { pesos } from "./fixtures/armarDatos.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

const datos = fixtureT12().datos;
const cargaCorrecta = (): CargadoDeEjemplo => ({ estado: "ok", datos, plantados: {} });

/** Un `exigirControles` falso que cuenta las llamadas y falla en los cortes que se le digan. */
function controles(fallan: readonly FechaCivil[] = []) {
  const llamadas: FechaCivil[] = [];
  return {
    llamadas,
    verificar: (_datos: unknown, corte: FechaCivil): void => {
      llamadas.push(corte);
      if (fallan.includes(corte)) throw new ErrorDeCierre("X2", pesos(5), pesos(4), "la suma de los vencidos");
    },
  };
}

function lista(app: Aplicacion) {
  if (app.estado !== "ok") throw new Error("se esperaba una aplicación lista");
  return app;
}

describe("arranque", () => {
  it("con los datos de ejemplo reales: lista, en el Resumen, con el corte por defecto y el cierre bien", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("")));
    expect(app.datos.clientes).toHaveLength(13);
    expect(app.direccion.ruta).toEqual({ tipo: "resumen" });
    expect(app.direccion.corte).toBe("2026-10-31");
    expect(app.cierre).toEqual({ estado: "ok" });
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toBeNull();
    app.destruir();
  });

  it("trae los casos plantados (alias → id) de los datos de ejemplo, y cada id existe en los datos", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("")));
    const id: string | undefined = app.plantados["T12-d91"];
    expect(id).toBeDefined();
    expect(app.datos.comprobantes.some((c) => c.id === id)).toBe(true);
    app.destruir();
  });

  it("los datos se cargan una vez", () => {
    let cargas = 0;
    const app = lista(
      crearAplicacion(ubicacionEnMemoria(""), {
        cargar: () => {
          cargas += 1;
          return cargaCorrecta();
        },
      }),
    );
    app.direccion.ir({ tipo: "clientes" });
    app.direccion.cambiarCorte("2026-09-30");
    expect(cargas).toBe(1);
  });

  it("lee la dirección de la barra desde el principio", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/comprobantes?corte=2026-09-30&tramo=vencidos&q=ab"), { cargar: cargaCorrecta }));
    expect(app.direccion.ruta).toEqual({ tipo: "comprobantes", tramo: "vencidos", q: "ab" });
    expect(app.direccion.corte).toBe("2026-09-30");
  });

  it("si los datos no pasan las validaciones es una aplicación con error de inicio: sin dirección, sin cálculos, y con el mensaje", () => {
    const ubicacion = ubicacionEnMemoria("#/clientes");
    const app = crearAplicacion(ubicacion, { cargar: () => ({ estado: "error", problemas: [], mensaje: "Los datos de ejemplo no pasan las validaciones." }) });
    expect(app.estado).toBe("error");
    if (app.estado !== "error") return;
    expect(app.mensaje).toBe("Los datos de ejemplo no pasan las validaciones.");
    expect("direccion" in app).toBe(false);
    expect("datos" in app).toBe(false);
    // No deja nada escuchando la barra.
    expect(() => ubicacion.irA("#/meses")).not.toThrow();
  });

  it("un hash que no es una dirección al cargar es una ruta desconocida (error de vista), no un error de inicio", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/nada"), { cargar: cargaCorrecta }));
    expect(app.direccion.ruta).toEqual({ tipo: "desconocida" });
    expect(app.cierre).toEqual({ estado: "ok" });
  });
});

describe("cierre del corte vigente (D3: ninguna pantalla muestra una cifra de un cierre que no cierra)", () => {
  it("sigue al corte: con un cierre malo es un error de cierre, con otro vuelve a estar bien", () => {
    const { verificar } = controles(["2026-09-30"]);
    const app = lista(crearAplicacion(ubicacionEnMemoria(""), { cargar: cargaCorrecta, controlar: verificar }));
    expect(app.cierre.estado).toBe("ok");
    app.direccion.cambiarCorte("2026-09-30");
    const malo = app.cierre;
    expect(malo.estado).toBe("error");
    if (malo.estado === "error") expect(malo.error.clave).toBe("X2");
    app.direccion.cambiarCorte("2026-08-31");
    expect(app.cierre.estado).toBe("ok");
  });

  it("verifica una vez por cierre aunque se lo lea mil veces o se vuelva a él", () => {
    const { verificar, llamadas } = controles();
    const app = lista(crearAplicacion(ubicacionEnMemoria(""), { cargar: cargaCorrecta, controlar: verificar }));
    for (let i = 0; i < 1000; i++) void app.cierre;
    app.direccion.cambiarCorte("2026-09-30");
    app.direccion.cambiarCorte("2026-10-31");
    app.direccion.cambiarCorte("2026-09-30");
    void app.cierre;
    expect(llamadas).toEqual(["2026-10-31", "2026-09-30"]);
  });

  it("un cierre malo no impide navegar: la dirección y el corte siguen respondiendo (el marco decide qué mostrar)", () => {
    const { verificar } = controles(["2026-09-30"]);
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/clientes?corte=2026-09-30"), { cargar: cargaCorrecta, controlar: verificar }));
    expect(app.cierre.estado).toBe("error");
    app.direccion.ir({ tipo: "meses" });
    expect(app.direccion.ruta).toEqual({ tipo: "meses" });
    expect(app.cierre.estado).toBe("error");
  });
});

describe("memoria de la vista conectada a la dirección", () => {
  it("la fila elegida se olvida al pasar de una pestaña a otra, empezando desde la pantalla con la que se arrancó", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/clientes?corte=2026-10-31"), { cargar: cargaCorrecta }));
    app.memoria.elegirFila({ clienteId: "C05" }, { tipo: "clientes" });
    app.direccion.ir({ tipo: "cliente", clienteId: "C05" });
    app.direccion.ir({ tipo: "clientes", filtro: "revisar" });
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toEqual({ clienteId: "C05" });
    app.direccion.ir({ tipo: "meses" });
    app.direccion.ir({ tipo: "clientes" });
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toBeNull();
  });

  it("una pantalla abierta con un enlace directo no marca una fila en la lista que está arriba de ella: nadie la abrió desde esa tabla", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/cliente/C05?corte=2026-10-31"), { cargar: cargaCorrecta }));
    expect(app.direccion.anterior).toBeNull();
    // Lo que hace la ficha del cliente al abrirse.
    app.memoria.elegirFila({ clienteId: "C05" }, app.direccion.anterior);
    app.direccion.atras(); // sin pantalla anterior va al padre (Clientes)
    expect(app.direccion.ruta).toEqual({ tipo: "clientes" });
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toBeNull();
  });

  it("lo mismo con un comprobante: abierto con un enlace directo, no queda marcado en la tabla de su cliente", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria(`#/comprobante/${datos.comprobantes[0]?.id}?corte=2026-10-31`), { cargar: cargaCorrecta }));
    app.memoria.elegirFila({ comprobanteId: datos.comprobantes[0]?.id ?? "", clienteId: datos.comprobantes[0]?.clienteId ?? "" }, app.direccion.anterior);
    app.direccion.atras();
    expect(app.direccion.ruta.tipo).toBe("cliente");
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toBeNull();
  });

  it("abierta desde una pantalla de la aplicación sí queda marcada al volver: la anterior es la que se abrió", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/clientes?corte=2026-10-31"), { cargar: cargaCorrecta }));
    app.direccion.ir({ tipo: "cliente", clienteId: "C05" });
    expect(app.direccion.anterior).toEqual({ tipo: "clientes" });
    app.memoria.elegirFila({ clienteId: "C05" }, app.direccion.anterior);
    app.direccion.atras();
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toEqual({ clienteId: "C05" });
  });

  it("si la pantalla anterior era un error, tampoco hay fila marcada", () => {
    const app = lista(crearAplicacion(ubicacionEnMemoria("#/nada?corte=2026-10-31"), { cargar: cargaCorrecta }));
    app.direccion.ir({ tipo: "cliente", clienteId: "C05" });
    expect(app.direccion.anterior).toBeNull();
  });

  it("un ancla no cuenta como navegar", () => {
    const ubicacion = ubicacionEnMemoria("#/clientes?corte=2026-10-31");
    const app = lista(crearAplicacion(ubicacion, { cargar: cargaCorrecta }));
    app.memoria.elegirFila({ clienteId: "C05" }, { tipo: "clientes" });
    ubicacion.irA("#principal");
    expect(app.memoria.filaElegidaEn(app.direccion.ruta)).toEqual({ clienteId: "C05" });
    expect(app.direccion.ruta).toEqual({ tipo: "clientes" });
  });
});

describe("el gancho del movimiento llega hasta la dirección", () => {
  it("`alCambiarVista` se llama al cambiar de pantalla y no al cambiar de corte", () => {
    let llamadas = 0;
    const app = lista(
      crearAplicacion(ubicacionEnMemoria(""), {
        cargar: cargaCorrecta,
        alCambiarVista: (aplicar) => {
          llamadas += 1;
          aplicar();
        },
      }),
    );
    app.direccion.cambiarCorte("2026-09-30");
    expect(llamadas).toBe(0);
    app.direccion.ir({ tipo: "meses" });
    expect(llamadas).toBe(1);
  });
});

describe("destruir", () => {
  it("deja de escuchar la barra", () => {
    const ubicacion = ubicacionEnMemoria("");
    const app = lista(crearAplicacion(ubicacion, { cargar: cargaCorrecta }));
    app.destruir();
    ubicacion.irA("#/meses");
    expect(app.direccion.ruta).toEqual({ tipo: "resumen" });
  });
});

describe("reactividad", () => {
  it("un efecto que lee el cierre se vuelve a correr cuando cambia el corte, no con una búsqueda", async () => {
    const { verificar } = controles(["2026-09-30"]);
    const ubicacion = ubicacionEnMemoria("#/clientes?corte=2026-10-31");
    const app = lista(crearAplicacion(ubicacion, { cargar: cargaCorrecta, controlar: verificar }));
    const vistas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        vistas.push(`${app.direccion.corte}:${app.cierre.estado}`);
      });
    });
    await tick();
    app.direccion.cambiarCorte("2026-09-30");
    await tick();
    app.direccion.cambiarCorte("2026-10-31");
    await tick();
    limpiar();
    expect(vistas).toEqual(["2026-10-31:ok", "2026-09-30:error", "2026-10-31:ok"]);
  });
});
