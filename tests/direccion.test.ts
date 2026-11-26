// Estado reactivo de la dirección (`src/lib/estado/direccion.svelte.ts`): une el enrutador (puro), los datos y la barra de direcciones (`Ubicacion`).
// Se prueba en Node con la ubicación en memoria. Reglas: S5 (aviso y corrección con `replaceState`, sin entrada nueva) y diseno-ui, sección 2 (cada
// cambio de vista o de corte es una entrada del historial; el aviso se quita al cambiar de corte o de vista).
import { describe, expect, it } from "vitest";
import { crearEstadoDeDireccion } from "../src/lib/estado/direccion.svelte.ts";
import type { OpcionesDeDireccion } from "../src/lib/estado/direccion.svelte.ts";
import { ofreceAyudaEnLaBarra } from "../src/lib/estado/navegacion.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { armarDatos, pesos } from "./fixtures/armarDatos.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

const T12 = fixtureT12();
const datos = T12.datos;
const AVISO_CORTE = "La fecha de corte de la dirección no es válida. Se muestra el 31/10/2026.";

function arrancar(hash: string, opciones?: OpcionesDeDireccion) {
  const ubicacion = ubicacionEnMemoria(hash);
  const estado = crearEstadoDeDireccion(datos, ubicacion, opciones);
  return { ubicacion, estado };
}

describe("ubicacionEnMemoria: se comporta como la barra del navegador (historial, atrás y adelante)", () => {
  it("`irA` agrega una entrada y avisa; `reemplazarHash` ni agrega ni avisa", () => {
    const u = ubicacionEnMemoria("#/");
    let avisos = 0;
    u.alCambiar(() => {
      avisos += 1;
    });
    u.irA("#/clientes");
    expect([u.leerHash(), u.entradas, avisos]).toEqual(["#/clientes", 2, 1]);
    u.reemplazarHash("#/meses");
    expect([u.leerHash(), u.entradas, avisos]).toEqual(["#/meses", 2, 1]);
  });

  it("`irA` al mismo hash no hace nada (como `location.hash = …` con el mismo valor)", () => {
    const u = ubicacionEnMemoria("#/clientes");
    let avisos = 0;
    u.alCambiar(() => {
      avisos += 1;
    });
    u.irA("#/clientes");
    expect([u.entradas, avisos]).toEqual([1, 0]);
  });

  it("`atras` vuelve a la entrada anterior y avisa; en la primera no hace nada", () => {
    const u = ubicacionEnMemoria("#/");
    let avisos = 0;
    u.alCambiar(() => {
      avisos += 1;
    });
    u.atras();
    expect([u.leerHash(), avisos]).toEqual(["#/", 0]);
    u.irA("#/clientes");
    u.irA("#/meses");
    u.atras();
    expect([u.leerHash(), u.entradas, avisos]).toEqual(["#/clientes", 3, 3]);
    u.atras();
    expect(u.leerHash()).toBe("#/");
  });

  it("`adelante` rehace lo deshecho; un `irA` después de `atras` descarta lo que había adelante", () => {
    const u = ubicacionEnMemoria("#/");
    u.irA("#/clientes");
    u.irA("#/meses");
    u.atras();
    u.adelante();
    expect(u.leerHash()).toBe("#/meses");
    u.adelante(); // no hay más
    expect(u.leerHash()).toBe("#/meses");
    u.atras();
    u.irA("#/comprobantes");
    expect(u.entradas).toBe(3);
    u.adelante();
    expect(u.leerHash()).toBe("#/comprobantes");
  });

  it("dejar de escuchar funciona", () => {
    const u = ubicacionEnMemoria("#/");
    let avisos = 0;
    const dejar = u.alCambiar(() => {
      avisos += 1;
    });
    dejar();
    u.irA("#/clientes");
    expect(avisos).toBe(0);
  });
});

describe("arranque: lee la dirección y la corrige si hace falta (S5)", () => {
  it("sin hash: Resumen al corte por defecto, sin aviso, y la barra no se toca", () => {
    const { ubicacion, estado } = arrancar("");
    expect(estado.ruta).toEqual({ tipo: "resumen" });
    expect(estado.corte).toBe("2026-10-31");
    expect(estado.avisos).toEqual([]);
    expect(ubicacion.hash).toBe("");
    expect(ubicacion.entradas).toBe(1);
  });

  it("corte válido: lo usa y no corrige nada", () => {
    const { ubicacion, estado } = arrancar("#/cliente/C05?corte=2026-09-30");
    expect(estado.ruta).toEqual({ tipo: "cliente", clienteId: "C05" });
    expect(estado.corte).toBe("2026-09-30");
    expect(ubicacion.hash).toBe("#/cliente/C05?corte=2026-09-30");
  });

  it("S5: corte inválido → corte por defecto, el aviso y la dirección corregida SIN entrada nueva en el historial", () => {
    const { ubicacion, estado } = arrancar("#/cliente/C05?corte=2026-10-15");
    expect(estado.corte).toBe("2026-10-31");
    expect(estado.avisos).toEqual([{ clase: "corte", texto: AVISO_CORTE }]);
    expect(estado.ruta).toEqual({ tipo: "cliente", clienteId: "C05" });
    expect(ubicacion.hash).toBe("#/cliente/C05?corte=2026-10-31");
    expect(ubicacion.entradas).toBe(1);
  });

  it("mes inválido en un desglose: aviso del mes y dirección corregida", () => {
    const { ubicacion, estado } = arrancar("#/desglose/iva-mes?corte=2026-09-30&mes=2030-01&agrupar=no");
    expect(estado.avisos.map((a) => a.clase)).toEqual(["mes"]);
    expect(ubicacion.hash).toBe("#/desglose/iva-mes?corte=2026-09-30&agrupar=no");
    expect(ubicacion.entradas).toBe(1);
  });

  it("una ruta desconocida o inexistente no se reescribe (no hay ruta que reconstruir) pero el aviso del corte sí se muestra", () => {
    const a = arrancar("#/cliente/C99?corte=hola");
    expect(a.estado.ruta).toEqual({ tipo: "inexistente", vista: "cliente" });
    expect(a.estado.avisos).toHaveLength(1);
    expect(a.ubicacion.hash).toBe("#/cliente/C99?corte=hola");
    const b = arrancar("#/nada");
    expect(b.estado.ruta).toEqual({ tipo: "desconocida" });
    expect(b.ubicacion.hash).toBe("#/nada");
  });
});

describe("navegar: cada cambio es una entrada del historial", () => {
  it("`ir` agrega una entrada, con el corte actual en la dirección, y la ruta cambia", () => {
    const { ubicacion, estado } = arrancar("#/?corte=2026-09-30");
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    expect(ubicacion.hash).toBe("#/cliente/C05?corte=2026-09-30");
    expect(ubicacion.entradas).toBe(2);
    expect(estado.ruta).toEqual({ tipo: "cliente", clienteId: "C05" });
    expect(estado.corte).toBe("2026-09-30");
  });

  it("`cambiarCorte` agrega una entrada, conserva la ruta y sus filtros, y devuelve true", () => {
    const { ubicacion, estado } = arrancar("#/desglose/cobranza-mes?corte=2026-10-31&cliente=C05&mes=2026-05");
    expect(estado.cambiarCorte("2026-08-31")).toBe(true);
    expect(ubicacion.hash).toBe("#/desglose/cobranza-mes?corte=2026-08-31&cliente=C05&mes=2026-05");
    expect(ubicacion.entradas).toBe(2);
    expect(estado.corte).toBe("2026-08-31");
  });

  it("`cambiarCorte` con algo que no es un cierre de mes del rango no navega y devuelve false", () => {
    const { ubicacion, estado } = arrancar("#/?corte=2026-09-30");
    for (const corte of ["2026-10-15", "hola", "", "2030-01-31", "2024-12-31"]) {
      expect(estado.cambiarCorte(corte), corte).toBe(false);
    }
    expect(ubicacion.entradas).toBe(1);
    expect(estado.corte).toBe("2026-09-30");
  });

  it("`cambiarCorte` al mismo corte no agrega una entrada repetida", () => {
    const { ubicacion, estado } = arrancar("#/cliente/C05?corte=2026-09-30");
    expect(estado.cambiarCorte("2026-09-30")).toBe(true);
    expect(ubicacion.entradas).toBe(1);
  });

  it("un cambio de la barra de direcciones que no hizo la aplicación («Atrás», «Adelante», un enlace) se refleja en el estado", () => {
    const { ubicacion, estado } = arrancar("#/?corte=2026-09-30");
    ubicacion.irA(`#/comprobante/${T12.id("d30")}?corte=2026-08-31`);
    expect(estado.ruta).toEqual({ tipo: "comprobante", comprobanteId: T12.id("d30") });
    expect(estado.corte).toBe("2026-08-31");
  });

  it("un hash escrito a mano con un corte inválido, después de navegar, vuelve a mostrar el aviso y a corregirse", () => {
    const { ubicacion, estado } = arrancar("#/?corte=2026-09-30");
    ubicacion.irA("#/cliente/C05?corte=hola");
    expect(estado.avisos).toHaveLength(1);
    expect(ubicacion.hash).toBe("#/cliente/C05?corte=2026-10-31");
    expect(ubicacion.entradas).toBe(2);
  });
});

describe("avisos: se quitan al cambiar de corte o de vista, o al cerrarlos", () => {
  it("al cambiar de corte", () => {
    const { estado } = arrancar("#/?corte=hola");
    expect(estado.avisos).toHaveLength(1);
    estado.cambiarCorte("2026-09-30");
    expect(estado.avisos).toEqual([]);
  });

  it("al cambiar de vista", () => {
    const { estado } = arrancar("#/?corte=hola");
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    expect(estado.avisos).toEqual([]);
  });

  it("`cerrarAviso(clase)` quita solo esa clase", () => {
    const { estado } = arrancar("#/desglose/iva-mes?corte=hola&mes=2030-01");
    expect(estado.avisos.map((a) => a.clase)).toEqual(["corte", "mes"]);
    estado.cerrarAviso("corte");
    expect(estado.avisos.map((a) => a.clase)).toEqual(["mes"]);
    estado.cerrarAviso("mes");
    expect(estado.avisos).toEqual([]);
    estado.cerrarAviso("mes"); // cerrar lo que no hay no falla
  });
});

describe("lo que lee el marco", () => {
  it("`cortes` son los 22 cierres de mes, en orden, del 31/01/2025 al 31/10/2026", () => {
    const { estado } = arrancar("");
    expect(estado.cortes).toHaveLength(22);
    expect(estado.cortes[0]).toBe("2025-01-31");
    expect(estado.cortes[21]).toBe("2026-10-31");
    expect(estado.cortes).toContain(estado.corte);
  });

  it("`enlace` arma el hash de una ruta con el corte actual (o con el que se le pida)", () => {
    const { estado } = arrancar("#/?corte=2026-09-30");
    expect(estado.enlace({ tipo: "cliente", clienteId: "C05" })).toBe("#/cliente/C05?corte=2026-09-30");
    expect(estado.enlace({ tipo: "desglose", clave: "mora", clienteId: "C05" }, "2026-08-31")).toBe("#/desglose/mora?corte=2026-08-31&cliente=C05");
  });

  it("`vista` cambia con la vista y el sujeto, y NO con el corte (diseno-ui, sección 2: el foco solo se mueve con la vista)", () => {
    const { estado } = arrancar("#/cliente/C05?corte=2026-09-30");
    const antes = estado.vista;
    estado.cambiarCorte("2026-08-31");
    expect(estado.vista).toBe(antes);
    estado.ir({ tipo: "cliente", clienteId: "C06" });
    expect(estado.vista).not.toBe(antes);
  });

  it("`destruir` deja de escuchar la barra de direcciones", () => {
    const { ubicacion, estado } = arrancar("#/?corte=2026-09-30");
    estado.destruir();
    ubicacion.irA("#/cliente/C05?corte=2026-09-30");
    expect(estado.ruta).toEqual({ tipo: "resumen" });
  });

  it("`ir` a la pantalla en la que ya se está no agrega una entrada, aunque la dirección estuviera escrita de otra forma (`#/` contra `#/resumen?corte=`)", () => {
    const { ubicacion, estado } = arrancar("#/?corte=2026-09-30");
    estado.ir({ tipo: "resumen" });
    expect(ubicacion.entradas).toBe(1);
    expect(ubicacion.hash).toBe("#/?corte=2026-09-30");
    estado.ir({ tipo: "clientes", filtro: "revisar" });
    estado.ir({ tipo: "clientes", filtro: "revisar" });
    expect(ubicacion.entradas).toBe(2);
  });

  it("las ocho secciones se leen y se escriben: `ir` a cada una y la ruta que se ve es esa", () => {
    const { ubicacion, estado } = arrancar("");
    for (const ruta of [
      { tipo: "comprobantes", tramo: "vencidos", q: "algarrobos" },
      { tipo: "clientes", filtro: "con-mora" },
      { tipo: "meses" },
      { tipo: "como-se-calcula" },
      { tipo: "resumen" },
    ] as const) {
      estado.ir(ruta);
      expect(estado.ruta).toEqual(ruta);
    }
    expect(ubicacion.hash).toBe("#/resumen?corte=2026-10-31");
  });
});

describe("`reemplazar`: cambiar la dirección sin una entrada nueva (la búsqueda y los filtros que se escriben)", () => {
  it("reemplaza la dirección, no agrega entrada, vuelve a leer la ruta y conserva el corte y la vista", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-09-30");
    const vista = estado.vista;
    estado.reemplazar({ tipo: "clientes", q: "sol" });
    expect(ubicacion.hash).toBe("#/clientes?corte=2026-09-30&q=sol");
    expect(ubicacion.entradas).toBe(1);
    expect(estado.ruta).toEqual({ tipo: "clientes", q: "sol" });
    expect(estado.corte).toBe("2026-09-30");
    expect(estado.vista).toBe(vista);
  });

  it("cada letra reemplaza a la anterior: «Atrás» no pasa por las letras intermedias", () => {
    const { ubicacion, estado } = arrancar("#/comprobantes?corte=2026-10-31");
    estado.ir({ tipo: "clientes" });
    for (const q of ["a", "al", "alg", "alga"]) estado.reemplazar({ tipo: "clientes", q });
    expect(ubicacion.entradas).toBe(2);
    expect(estado.recorrido).toHaveLength(2);
    ubicacion.atras();
    expect(estado.ruta.tipo).toBe("comprobantes");
  });

  it("acota la búsqueda como el enrutador (60 caracteres, sin romper un emoji) y la ruta que queda es la que se lee de la barra", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31");
    estado.reemplazar({ tipo: "clientes", q: `${"a".repeat(59)}😀😀` });
    expect(estado.ruta).toEqual({ tipo: "clientes", q: `${"a".repeat(59)}😀` });
    expect(ubicacion.hash.length).toBeLessThanOrEqual(512);
  });

  it("borrar la búsqueda deja la dirección sin `q`", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31&q=sol");
    estado.reemplazar({ tipo: "clientes" });
    expect(ubicacion.hash).toBe("#/clientes?corte=2026-10-31");
    expect(estado.ruta).toEqual({ tipo: "clientes" });
  });

  it("no toca los avisos que estén a la vista (duran hasta que cambia el corte o la vista, o se los cierra)", () => {
    const { estado } = arrancar("#/clientes?corte=hola");
    expect(estado.avisos).toHaveLength(1);
    estado.reemplazar({ tipo: "clientes", q: "a" });
    expect(estado.avisos).toHaveLength(1);
  });

  it("reemplazar por la misma dirección no hace nada", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31");
    estado.reemplazar({ tipo: "clientes" });
    expect(ubicacion.hash).toBe("#/clientes?corte=2026-10-31");
    expect(estado.recorrido).toEqual(["#/clientes?corte=2026-10-31"]);
  });
});

describe("un ancla (`#principal`, `#saldo-final`) no es una ruta: el estado la ignora", () => {
  it("un cambio de hash que no es una dirección no cambia la ruta, el corte, los avisos ni el recorrido", () => {
    const { ubicacion, estado } = arrancar("#/cliente/C05?corte=hola");
    expect(estado.avisos).toHaveLength(1);
    const antes = { ruta: estado.ruta, corte: estado.corte, vista: estado.vista, recorrido: estado.recorrido };
    for (const ancla of ["#principal", "#saldo-final", "#cc-saldo", "#cliente/C05", "#nada"]) {
      ubicacion.irA(ancla);
      expect(estado.ruta, ancla).toEqual(antes.ruta);
      expect(estado.corte, ancla).toBe(antes.corte);
      expect(estado.vista, ancla).toBe(antes.vista);
      expect(estado.recorrido, ancla).toEqual(antes.recorrido);
      expect(estado.avisos, ancla).toHaveLength(1);
    }
  });

  it("después de un ancla se puede seguir navegando: `ir` escribe la dirección aunque la barra diga otra cosa", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31");
    ubicacion.irA("#principal");
    estado.ir({ tipo: "clientes" }); // la misma pantalla, pero la barra ya no lo dice: la deja escrita
    expect(ubicacion.hash).toBe("#/clientes?corte=2026-10-31");
    estado.ir({ tipo: "meses" });
    expect(estado.ruta).toEqual({ tipo: "meses" });
  });

  it("«Atrás» desde un ancla vuelve a la pantalla de la que se salió y no cambia nada", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31");
    ubicacion.irA("#saldo-final");
    ubicacion.atras();
    expect(estado.ruta).toEqual({ tipo: "clientes" });
    expect(estado.recorrido).toEqual(["#/clientes?corte=2026-10-31"]);
  });

  it("al cargar la aplicación, lo que manda es el enrutador: un hash que no es una dirección es una ruta desconocida", () => {
    expect(arrancar("#principal").estado.ruta).toEqual({ tipo: "desconocida" });
  });
});

describe("«Atrás»: el recorrido de la sesión y el destino cuando no hay pantalla anterior", () => {
  it("el recorrido arranca con la dirección de llegada (ya corregida) y suma cada pantalla", () => {
    const { estado } = arrancar("#/cliente/C05?corte=hola");
    expect(estado.recorrido).toEqual(["#/cliente/C05?corte=2026-10-31"]);
    estado.ir({ tipo: "meses" });
    expect(estado.recorrido).toEqual(["#/cliente/C05?corte=2026-10-31", "#/meses?corte=2026-10-31"]);
  });

  it("con una pantalla anterior, `atras` retrocede en el historial (sin una entrada nueva) y la saca del recorrido", () => {
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31");
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    expect(estado.destinoDeAtras).toEqual({ tipo: "clientes" });
    estado.atras();
    expect(estado.ruta).toEqual({ tipo: "clientes" });
    expect(ubicacion.entradas).toBe(2);
    expect(estado.recorrido).toEqual(["#/clientes?corte=2026-10-31"]);
  });

  it("el destino de «Atrás» es la pantalla anterior real, no el padre: de Resumen a un cliente, «Atrás» dice Resumen", () => {
    const { estado } = arrancar("#/resumen?corte=2026-10-31");
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    expect(estado.destinoDeAtras).toEqual({ tipo: "resumen" });
    expect(estado.padre).toEqual({ tipo: "clientes" });
  });

  it("sin pantalla anterior (un enlace directo): `atras` va al padre, con una entrada nueva, y `destinoDeAtras` es el padre", () => {
    const { ubicacion, estado } = arrancar(`#/comprobante/${T12.id("d30")}?corte=2026-09-30`);
    const cliente = estado.padre;
    expect(cliente.tipo).toBe("cliente");
    expect(estado.destinoDeAtras).toEqual(cliente);
    estado.atras();
    expect(estado.ruta).toEqual(cliente);
    expect(estado.corte).toBe("2026-09-30");
    expect(ubicacion.entradas).toBe(2);
    expect(estado.recorrido).toHaveLength(2);
  });

  it("si la pantalla anterior era un error, el destino es el padre", () => {
    const { estado } = arrancar("#/nada?corte=2026-10-31");
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    expect(estado.recorrido).toHaveLength(2);
    expect(estado.destinoDeAtras).toEqual({ tipo: "clientes" });
  });

  it("ir a una pantalla y volver con «Atrás» deja el recorrido como estaba (no se acumula)", () => {
    const { estado } = arrancar("#/resumen?corte=2026-10-31");
    for (let i = 0; i < 5; i++) {
      estado.ir({ tipo: "meses" });
      estado.atras();
    }
    expect(estado.recorrido).toEqual(["#/resumen?corte=2026-10-31"]);
  });

  it("el mismo destino dos veces seguidas no repite el recorrido", () => {
    const { estado } = arrancar("#/resumen?corte=2026-10-31");
    estado.ir({ tipo: "meses" });
    estado.ir({ tipo: "meses" });
    expect(estado.recorrido).toHaveLength(2);
  });

  it("el recorrido guarda como mucho 60 pantallas (se olvidan las más viejas)", () => {
    const { estado } = arrancar("#/resumen?corte=2026-10-31");
    for (let i = 0; i < 80; i++) estado.ir(i % 2 === 0 ? { tipo: "comprobantes", q: `x${i}` } : { tipo: "clientes", q: `x${i}` });
    expect(estado.recorrido).toHaveLength(60);
    expect(estado.recorrido.at(-1)).toBe(`#/clientes?corte=2026-10-31&q=x79`);
  });

  it("limitación conocida: ir a la pantalla de hace dos pasos por un enlace se lee como volver y acorta el recorrido", () => {
    const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31");
    estado.ir({ tipo: "meses" });
    estado.ir({ tipo: "resumen" });
    expect(ubicacion.entradas).toBe(3);
    expect(estado.recorrido).toEqual(["#/resumen?corte=2026-10-31"]);
    // Consecuencia: ahí «Atrás» no tiene pantalla anterior y va al padre en lugar de retroceder en el historial.
    expect(estado.destinoDeAtras).toEqual({ tipo: "resumen" });
  });

  it("tres cambios de corte seguidos con la flecha: `atras` los deshace de a uno", () => {
    const { estado } = arrancar("#/resumen?corte=2026-10-31");
    estado.cambiarCorte("2026-09-30");
    estado.cambiarCorte("2026-08-31");
    estado.cambiarCorte("2026-07-31");
    estado.atras();
    expect(estado.corte).toBe("2026-08-31");
    estado.atras();
    expect(estado.corte).toBe("2026-09-30");
  });
});

describe("lo que lee el marco de la navegación: sección, raíz, padre y migas", () => {
  it("`seccion`, `esRaiz`, `padre` y `migas` siguen a la ruta", () => {
    const { estado } = arrancar("#/resumen?corte=2026-10-31");
    expect([estado.seccion, estado.esRaiz]).toEqual(["resumen", true]);
    estado.ir({ tipo: "desglose", clave: "iva-mes", clienteId: "C05" });
    expect([estado.seccion, estado.esRaiz]).toEqual(["meses", false]);
    expect(estado.padre).toEqual({ tipo: "desglose", clave: "iva-mes" });
    expect(estado.migas.map((p) => p.miga.que)).toEqual(["seccion", "desglose", "cliente"]);
    estado.ir({ tipo: "como-se-calcula" });
    expect([estado.seccion, estado.esRaiz]).toEqual([null, false]);
  });

  it("con una ruta de error no hay sección y el padre es el Resumen", () => {
    const { estado } = arrancar("#/cliente/C99");
    expect(estado.seccion).toBeNull();
    expect(estado.padre).toEqual({ tipo: "resumen" });
    expect(estado.migas).toEqual([{ miga: { que: "error" }, destino: null }]);
  });
});

describe("cambiar el cierre mirando «Otros» cuando en el nuevo cierre no existe", () => {
  // Seis deudores al 31/10/2026 (hay «Otros»); antes de la emisión (31/12/2025) no hay ninguno.
  const seis = armarDatos({
    comprobantes: ["C01", "C02", "C03", "C04", "C05", "C06"].map((cliente) => ({ clave: `v-${cliente}`, cliente, emision: "2026-01-05", neto: pesos(100_000) })),
  }).datos;
  const arrancarConOtros = (hash: string, opciones?: OpcionesDeDireccion) => {
    const ubicacion = ubicacionEnMemoria(hash);
    return { ubicacion, estado: crearEstadoDeDireccion(seis, ubicacion, opciones) };
  };

  it("lleva a la mora completa de ese cierre (no al error «No existe este desglose») y deja el motivo para que la pantalla avise", () => {
    const { ubicacion, estado } = arrancarConOtros("#/desglose/mora-otros?corte=2026-10-31");
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora-otros" });
    expect(estado.redireccion).toBeNull();
    expect(estado.cambiarCorte("2025-12-31")).toBe(true);
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora" });
    expect(estado.corte).toBe("2025-12-31");
    expect(ubicacion.hash).toBe("#/desglose/mora?corte=2025-12-31");
    expect(estado.redireccion).toEqual({ motivo: "sin-otros", corte: "2025-12-31" });
  });

  it("es una entrada nueva del historial: «Atrás» vuelve a «Otros» del cierre anterior y el motivo se va", () => {
    const { ubicacion, estado } = arrancarConOtros("#/desglose/mora-otros?corte=2026-10-31");
    estado.cambiarCorte("2025-12-31");
    expect(ubicacion.entradas).toBe(2);
    estado.atras();
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora-otros" });
    expect(estado.corte).toBe("2026-10-31");
    expect(estado.redireccion).toBeNull();
  });

  it("conserva `agrupar=no`", () => {
    const { estado } = arrancarConOtros("#/desglose/mora-otros?corte=2026-10-31&agrupar=no");
    estado.cambiarCorte("2025-12-31");
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora", agrupar: "no" });
  });

  it("si «Otros» existe en el nuevo cierre no cambia nada: sigue en «Otros» y no hay motivo", () => {
    const { estado } = arrancarConOtros("#/desglose/mora-otros?corte=2026-10-31");
    expect(estado.cambiarCorte("2026-09-30")).toBe(true);
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora-otros" });
    expect(estado.redireccion).toBeNull();
  });

  it("solo vale para «Otros»: otras pantallas no tienen motivo al cambiar de cierre", () => {
    const { estado } = arrancarConOtros("#/desglose/mora?corte=2026-10-31");
    estado.cambiarCorte("2025-12-31");
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora" });
    expect(estado.redireccion).toBeNull();
  });

  it("el motivo dura como los avisos: se va al cambiar de vista o de cierre, o al cerrarlo", () => {
    const hasta = (accion: (e: ReturnType<typeof arrancarConOtros>["estado"]) => void): unknown => {
      const { estado } = arrancarConOtros("#/desglose/mora-otros?corte=2026-10-31");
      estado.cambiarCorte("2025-12-31");
      expect(estado.redireccion).not.toBeNull();
      accion(estado);
      return estado.redireccion;
    };
    expect(hasta((e) => e.ir({ tipo: "meses" }))).toBeNull();
    expect(hasta((e) => e.cambiarCorte("2026-10-31"))).toBeNull();
    expect(hasta((e) => e.cerrarRedireccion())).toBeNull();
  });

  it("escribir a mano la dirección de «Otros» en un cierre donde no existe sigue siendo el desglose inexistente", () => {
    const { estado } = arrancarConOtros("#/desglose/mora-otros?corte=2025-12-31");
    expect(estado.ruta).toEqual({ tipo: "inexistente", vista: "desglose" });
    expect(estado.redireccion).toBeNull();
  });

  it("el motivo pasa por el gancho de la vista como el resto del cambio, y no se pierde si el cambio queda pendiente", () => {
    const pendientes: (() => void)[] = [];
    const { estado } = arrancarConOtros("#/desglose/mora-otros?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
    estado.cambiarCorte("2025-12-31");
    // «mora-otros» y «mora» son vistas distintas: el cambio espera a `aplicar`, y el motivo llega con él.
    expect(estado.redireccion).toBeNull();
    pendientes[0]?.();
    expect(estado.ruta).toEqual({ tipo: "desglose", clave: "mora" });
    expect(estado.redireccion).toEqual({ motivo: "sin-otros", corte: "2025-12-31" });
  });
});

describe("ganchos para el movimiento y para quien necesite enterarse (`alCambiarVista`, `alAplicar`)", () => {
  it("por defecto el cambio se aplica enseguida", () => {
    const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31");
    ubicacion.irA("#/meses?corte=2026-10-31");
    expect(estado.ruta).toEqual({ tipo: "meses" });
  });

  it("`alCambiarVista` recibe `aplicar` solo cuando cambia la vista, y el estado no cambia hasta que se lo llama", () => {
    const pendientes: (() => void)[] = [];
    const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
    ubicacion.irA("#/meses?corte=2026-10-31");
    expect(pendientes).toHaveLength(1);
    expect(estado.ruta).toEqual({ tipo: "resumen" });
    pendientes[0]?.();
    expect(estado.ruta).toEqual({ tipo: "meses" });
    expect(estado.recorrido).toHaveLength(2);
  });

  it("no interviene cuando cambia solo el corte, ni con una búsqueda, ni con un ancla (el corte se cambia sin animar)", () => {
    let llamadas = 0;
    const { ubicacion, estado } = arrancar("#/clientes?corte=2026-10-31", {
      alCambiarVista: (aplicar) => {
        llamadas += 1;
        aplicar();
      },
    });
    estado.cambiarCorte("2026-09-30");
    estado.reemplazar({ tipo: "clientes", q: "a" });
    estado.ir({ tipo: "clientes", filtro: "revisar" });
    ubicacion.irA("#principal");
    expect(llamadas).toBe(0);
    estado.ir({ tipo: "meses" });
    expect(llamadas).toBe(1);
    expect(estado.ruta).toEqual({ tipo: "meses" });
  });

  // El navegador llama a `aplicar` uno o dos cuadros después del cambio de la barra: en ese rato llegan otros cambios. El estado no puede quedar en una
  // dirección distinta de la de la barra (estaba pasando con «Atrás» enseguida de un clic).
  describe("un cambio que llega mientras otro espera su transición", () => {
    it("«Atrás» enseguida de un clic: el estado termina en la pantalla de la barra, no en la del clic", () => {
      const pendientes: (() => void)[] = [];
      const { ubicacion, estado } = arrancar("#/comprobantes?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
      ubicacion.irA("#/clientes?corte=2026-10-31");
      ubicacion.atras();
      // La barra volvió a Comprobantes: también es un cambio de pantalla respecto de la última (Clientes), así que espera su turno.
      expect(pendientes).toHaveLength(2);
      pendientes[0]?.();
      pendientes[1]?.();
      expect(estado.ruta).toEqual({ tipo: "comprobantes" });
      expect(ubicacion.leerHash()).toBe("#/comprobantes?corte=2026-10-31");
      expect(estado.recorrido).toEqual(["#/comprobantes?corte=2026-10-31"]);
    });

    it("los cambios se aplican en el orden en que llegaron, aunque el navegador llame a las devoluciones en otro orden", () => {
      const pendientes: (() => void)[] = [];
      const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
      ubicacion.irA("#/clientes?corte=2026-10-31");
      ubicacion.irA("#/meses?corte=2026-10-31");
      pendientes[1]?.();
      pendientes[0]?.();
      expect(estado.ruta).toEqual({ tipo: "meses" });
      expect(estado.recorrido).toEqual(["#/resumen?corte=2026-10-31", "#/clientes?corte=2026-10-31", "#/meses?corte=2026-10-31"]);
    });

    it("una devolución que se llama dos veces no aplica nada de más", () => {
      const pendientes: (() => void)[] = [];
      const vistas: string[] = [];
      const { ubicacion } = arrancar("#/resumen?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar), alAplicar: (d) => vistas.push(d.ruta.tipo) });
      ubicacion.irA("#/meses?corte=2026-10-31");
      pendientes[0]?.();
      pendientes[0]?.();
      expect(vistas).toEqual(["meses"]);
    });

    it("si un cambio lanza al aplicarse, los que esperaban atrás se aplican igual y el error no se traga", () => {
      const pendientes: (() => void)[] = [];
      const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", {
        alCambiarVista: (aplicar) => pendientes.push(aplicar),
        alAplicar: (d) => {
          if (d.ruta.tipo === "clientes") throw new Error("falló un oyente");
        },
      });
      ubicacion.irA("#/clientes?corte=2026-10-31");
      ubicacion.irA("#/meses?corte=2026-10-31");
      expect(() => pendientes[0]?.()).toThrow("falló un oyente");
      expect(estado.ruta).toEqual({ tipo: "meses" });
      expect(estado.recorrido).toEqual(["#/resumen?corte=2026-10-31", "#/clientes?corte=2026-10-31", "#/meses?corte=2026-10-31"]);
      pendientes[1]?.(); // la segunda devolución ya no tiene nada que aplicar
      expect(estado.ruta).toEqual({ tipo: "meses" });
    });

    it("una búsqueda escrita mientras espera un cambio de pantalla espera su turno y no se pierde ni pisa al cambio", () => {
      const pendientes: (() => void)[] = [];
      const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
      ubicacion.irA("#/comprobantes?corte=2026-10-31");
      // Para el estado, la pantalla más reciente es Comprobantes: escribir ahí no es un cambio de pantalla y no pasa por el gancho.
      estado.reemplazar({ tipo: "comprobantes", q: "arroyo" });
      expect(pendientes).toHaveLength(1);
      expect(estado.ruta).toEqual({ tipo: "resumen" }); // todavía se ve la anterior
      pendientes[0]?.();
      expect(estado.ruta).toEqual({ tipo: "comprobantes", q: "arroyo" });
      expect(estado.recorrido).toEqual(["#/resumen?corte=2026-10-31", "#/comprobantes?corte=2026-10-31&q=arroyo"]);
    });

    it("`ir` a la pantalla a la que ya se pidió ir no agrega una entrada repetida, y a la que se ve todavía sí lleva", () => {
      const pendientes: (() => void)[] = [];
      const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
      ubicacion.irA("#/clientes?corte=2026-10-31");
      estado.ir({ tipo: "clientes" });
      expect(ubicacion.entradas).toBe(2);
      estado.ir({ tipo: "resumen" }); // lo que se ve todavía es el Resumen, pero la barra ya está en Clientes: volver es un cambio de verdad
      expect(ubicacion.entradas).toBe(3);
      expect(ubicacion.leerHash()).toBe("#/resumen?corte=2026-10-31");
    });

    it("cambiar el corte mientras espera un cambio de pantalla parte de la pantalla de la barra, no de la que todavía se ve", () => {
      const pendientes: (() => void)[] = [];
      const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", { alCambiarVista: (aplicar) => pendientes.push(aplicar) });
      ubicacion.irA("#/clientes?corte=2026-10-31");
      estado.cambiarCorte("2026-09-30");
      expect(ubicacion.leerHash()).toBe("#/clientes?corte=2026-09-30");
      pendientes[0]?.();
      expect(estado.ruta).toEqual({ tipo: "clientes" });
      expect(estado.corte).toBe("2026-09-30");
    });
  });

  it("`alAplicar` se entera de cada dirección aplicada, con la ya corregida, y no de los anclas", () => {
    const vistas: string[] = [];
    const { ubicacion, estado } = arrancar("#/resumen?corte=2026-10-31", { alAplicar: (d) => vistas.push(`${d.ruta.tipo}@${d.corte}`) });
    estado.ir({ tipo: "clientes" });
    estado.cambiarCorte("2026-09-30");
    ubicacion.irA("#principal");
    ubicacion.irA("#/meses?corte=hola");
    expect(vistas).toEqual(["clientes@2026-10-31", "clientes@2026-09-30", "meses@2026-10-31"]);
  });
});

describe("`moverCorte`: dos clics seguidos en ‹ o › avanzan dos cierres, aunque la dirección todavía no se haya vuelto a leer", () => {
  /** Como el navegador: el aviso de cambio de la barra llega después (`hashchange` es asíncrono); el test lo suelta a mano con `soltar`. */
  function conAvisoDemorado(hash: string) {
    const base = ubicacionEnMemoria(hash);
    const demorados: (() => void)[] = [];
    const ubicacion = {
      ...base,
      alCambiar(oyente: () => void) {
        return base.alCambiar(() => demorados.push(oyente));
      },
    };
    const estado = crearEstadoDeDireccion(datos, ubicacion);
    const soltar = (): void => {
      for (const o of demorados.splice(0)) o();
    };
    return { base, estado, soltar };
  }

  it("dos pasos atrás seguidos llevan dos cierres atrás, sin perder el segundo", () => {
    const { base, estado, soltar } = conAvisoDemorado("#/clientes?corte=2026-10-31&filtro=con-mora");
    expect(estado.moverCorte(-1)).toBe(true);
    expect(estado.moverCorte(-1)).toBe(true);
    expect(base.leerHash()).toBe("#/clientes?corte=2026-08-31&filtro=con-mora");
    soltar();
    expect(estado.corte).toBe("2026-08-31");
    expect(estado.ruta).toEqual({ tipo: "clientes", filtro: "con-mora" });
  });

  it("uno adelante y otro atrás, seguidos, vuelven al mismo cierre", () => {
    const { base, estado, soltar } = conAvisoDemorado("#/resumen?corte=2026-08-31");
    expect(estado.moverCorte(1)).toBe(true);
    expect(estado.moverCorte(-1)).toBe(true);
    soltar();
    expect(base.leerHash()).toBe("#/resumen?corte=2026-08-31");
    expect(estado.corte).toBe("2026-08-31");
  });

  it("en el primer y en el último cierre no hay a dónde ir: devuelve false y no navega", () => {
    const { base, estado } = conAvisoDemorado("#/resumen?corte=2026-10-31");
    expect(estado.moverCorte(1)).toBe(false);
    expect(base.entradas).toBe(1);
    const primero = estado.cortes[0] as string;
    const { base: b2, estado: e2 } = conAvisoDemorado(`#/resumen?corte=${primero}`);
    expect(e2.moverCorte(-1)).toBe(false);
    expect(b2.entradas).toBe(1);
  });
});

describe("la barra del celular: «Atrás» y «Cómo se calcula» no se repiten", () => {
  it("de un ejemplo de «Cómo se calcula» a un comprobante, «Atrás» lleva a esa pantalla y la ayuda no se ofrece", () => {
    const { estado } = arrancar("#/como-se-calcula?corte=2026-10-31");
    estado.ir({ tipo: "comprobante", comprobanteId: T12.id("d30") });
    expect(estado.destinoDeAtras).toEqual({ tipo: "como-se-calcula" });
    expect(ofreceAyudaEnLaBarra(estado.esRaiz, estado.destinoDeAtras)).toBe(false);
  });

  it("en cualquier otro recorrido la ayuda se ofrece (también con un enlace directo al comprobante)", () => {
    const desdeClientes = arrancar("#/clientes?corte=2026-10-31").estado;
    desdeClientes.ir({ tipo: "cliente", clienteId: "C05" });
    expect(ofreceAyudaEnLaBarra(desdeClientes.esRaiz, desdeClientes.destinoDeAtras)).toBe(true);
    const directo = arrancar(`#/comprobante/${T12.id("d30")}?corte=2026-09-30`).estado;
    expect(ofreceAyudaEnLaBarra(directo.esRaiz, directo.destinoDeAtras)).toBe(true);
  });
});
