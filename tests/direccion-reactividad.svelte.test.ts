// Este archivo se llama *.svelte.test.ts para que Svelte compile los runes (`$effect.root`): prueba la reactividad de verdad, la que van a usar las
// pantallas (un efecto que lee el estado se vuelve a correr cuando cambia). Mismo patrón que la Demo 2 (`tests/reactividad.svelte.test.ts`).
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import { crearEstadoDeDireccion } from "../src/lib/estado/direccion.svelte.ts";
import { ubicacionEnMemoria } from "../src/lib/estado/ubicacion.ts";
import { fixtureT12 } from "./fixtures/casos.ts";

describe("reactividad de la dirección", () => {
  it("un efecto que lee la ruta, el corte, la vista y los avisos se vuelve a correr cuando cambia la dirección", async () => {
    const ubicacion = ubicacionEnMemoria("#/?corte=2026-09-30");
    const estado = crearEstadoDeDireccion(fixtureT12().datos, ubicacion);
    const vistas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        vistas.push(`${estado.ruta.tipo}@${estado.corte}|${estado.vista}|${estado.avisos.length}`);
      });
    });
    await tick();
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    await tick();
    estado.cambiarCorte("2026-08-31");
    await tick();
    ubicacion.irA("#/cliente/C05?corte=hola"); // escrito a mano: aviso y corrección
    await tick();
    estado.cerrarAviso("corte");
    await tick();
    limpiar();
    expect(vistas).toEqual([
      "resumen@2026-09-30|resumen|0",
      "cliente@2026-09-30|cliente/C05|0",
      "cliente@2026-08-31|cliente/C05|0",
      "cliente@2026-10-31|cliente/C05|1",
      "cliente@2026-10-31|cliente/C05|0",
    ]);
    expect(ubicacion.entradas).toBe(4);
  });

  it("la sección, el destino de «Atrás» y el recorrido también son reactivos: un efecto que los lee se vuelve a correr cuando cambian", async () => {
    const ubicacion = ubicacionEnMemoria("#/resumen?corte=2026-09-30");
    const estado = crearEstadoDeDireccion(fixtureT12().datos, ubicacion);
    const filas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        filas.push(`${estado.seccion}|${estado.esRaiz}|${estado.destinoDeAtras.tipo}|${estado.recorrido.length}`);
      });
    });
    await tick();
    estado.ir({ tipo: "clientes" });
    await tick();
    estado.ir({ tipo: "cliente", clienteId: "C05" });
    await tick();
    estado.atras();
    await tick();
    limpiar();
    expect(filas).toEqual(["resumen|true|resumen|1", "clientes|true|resumen|2", "clientes|false|clientes|3", "clientes|true|resumen|2"]);
  });

  it("escribir en la búsqueda (`reemplazar`) actualiza la ruta sin cambiar la vista: el efecto de la vista no se vuelve a correr, el de la ruta sí", async () => {
    const ubicacion = ubicacionEnMemoria("#/clientes?corte=2026-09-30");
    const estado = crearEstadoDeDireccion(fixtureT12().datos, ubicacion);
    let porVista = 0;
    const consultas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        void estado.vista;
        porVista += 1;
      });
      $effect(() => {
        const r = estado.ruta;
        consultas.push(r.tipo === "clientes" ? (r.q ?? "") : "?");
      });
    });
    await tick();
    for (const q of ["s", "so", "sol"]) {
      estado.reemplazar({ tipo: "clientes", q });
      await tick();
    }
    limpiar();
    expect(porVista).toBe(1);
    expect(consultas).toEqual(["", "s", "so", "sol"]);
  });
});
