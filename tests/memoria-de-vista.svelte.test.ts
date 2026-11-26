// Memoria de la vista (src/lib/estado/memoria-de-vista.svelte.ts): lo que la pantalla recuerda entre una visita y la siguiente dentro de la sesión (la fila
// que se abrió, la solapa de cada cliente, el orden de cada medida). Vive en memoria: no se guarda en ningún almacenamiento ni en la dirección.
// Se llama *.svelte.test.ts para que Svelte compile los runes y se pueda probar la reactividad con `$effect.root`.
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import type { Ruta } from "../src/lib/estado/enrutador.ts";
import { SOLAPAS_DE_CLIENTE, crearMemoriaDeVista } from "../src/lib/estado/memoria-de-vista.svelte.ts";

const resumen: Ruta = { tipo: "resumen" };
const clientes: Ruta = { tipo: "clientes" };
const comprobantes: Ruta = { tipo: "comprobantes", tramo: "vencidos" };
const meses: Ruta = { tipo: "meses" };
const desgloseDeMora: Ruta = { tipo: "desglose", clave: "mora" };

describe("fila elegida: la última que se abrió, para marcarla al volver a la pantalla de la que salió", () => {
  it("empieza sin fila y recuerda un cliente o un comprobante (con su cliente)", () => {
    const m = crearMemoriaDeVista();
    expect(m.filaElegidaEn(resumen)).toBeNull();
    m.elegirFila({ clienteId: "C05" }, resumen);
    expect(m.filaElegidaEn(resumen)).toEqual({ clienteId: "C05" });
    m.elegirFila({ comprobanteId: "1-0003-00000001", clienteId: "C05" }, { tipo: "cliente", clienteId: "C05" });
    expect(m.filaElegidaEn({ tipo: "cliente", clienteId: "C05" })).toEqual({ comprobanteId: "1-0003-00000001", clienteId: "C05" });
  });

  it("`vaciarFila` la olvida", () => {
    const m = crearMemoriaDeVista();
    m.elegirFila({ clienteId: "C05" }, resumen);
    m.vaciarFila();
    expect(m.filaElegidaEn(resumen)).toBeNull();
  });

  it("abrir una fila sin pantalla de origen (un enlace directo) no deja ninguna marcada, y olvida la anterior", () => {
    const m = crearMemoriaDeVista();
    m.elegirFila({ clienteId: "C05" }, clientes);
    m.elegirFila({ clienteId: "C06" }, null);
    for (const ruta of [resumen, clientes, comprobantes, meses, desgloseDeMora, { tipo: "cliente", clienteId: "C06" }] as const) expect(m.filaElegidaEn(ruta), ruta.tipo).toBeNull();
  });

  it("la marca vale solo para la pantalla desde la que se abrió la fila, no para las otras", () => {
    const m = crearMemoriaDeVista();
    m.elegirFila({ clienteId: "C05" }, resumen);
    for (const otra of [clientes, comprobantes, meses, desgloseDeMora, { tipo: "cliente", clienteId: "C06" }] as const) expect(m.filaElegidaEn(otra), otra.tipo).toBeNull();
    expect(m.filaElegidaEn(resumen)).toEqual({ clienteId: "C05" });
  });

  it("Resumen → abrir un cliente desde Deudores → Resumen → «Ver de dónde sale»: en el desglose no hay fila marcada, al volver al Resumen sí", () => {
    const m = crearMemoriaDeVista();
    m.alVerRuta(resumen);
    m.alVerRuta({ tipo: "cliente", clienteId: "C05" });
    m.elegirFila({ clienteId: "C05" }, resumen); // lo que hace la ficha al abrirse: la pantalla anterior era el Resumen
    m.alVerRuta(resumen);
    expect(m.filaElegidaEn(resumen)).toEqual({ clienteId: "C05" });
    m.alVerRuta(desgloseDeMora);
    expect(m.filaElegidaEn(desgloseDeMora)).toBeNull();
    m.alVerRuta(resumen);
    expect(m.filaElegidaEn(resumen)).toEqual({ clienteId: "C05" });
  });

  it("la pantalla es la misma con otro filtro, otra búsqueda o otro corte, pero no con otra medida ni con otro cliente", () => {
    const m = crearMemoriaDeVista();
    m.elegirFila({ comprobanteId: "1-0003-00000001", clienteId: "C05" }, { tipo: "comprobantes", tramo: "vencidos" });
    expect(m.filaElegidaEn({ tipo: "comprobantes", tramo: "1-30", q: "a" })).not.toBeNull();
    m.elegirFila({ comprobanteId: "1-0003-00000001", clienteId: "C05" }, desgloseDeMora);
    expect(m.filaElegidaEn({ tipo: "desglose", clave: "mora", agrupar: "no" })).not.toBeNull();
    expect(m.filaElegidaEn({ tipo: "desglose", clave: "saldo" })).toBeNull();
    expect(m.filaElegidaEn({ tipo: "desglose", clave: "mora", clienteId: "C05" })).toBeNull();
  });

  it("se vacía al pasar de una sección a otra (de una pestaña a otra), no al entrar a un detalle ni al volver a la misma sección", () => {
    const m = crearMemoriaDeVista();
    m.alVerRuta(resumen);
    // Se abre un cliente desde los deudores del Resumen, y se vuelve: la fila sigue marcada.
    m.alVerRuta({ tipo: "cliente", clienteId: "C05" });
    m.elegirFila({ clienteId: "C05" }, resumen);
    m.alVerRuta({ tipo: "comprobante", comprobanteId: "1-0003-00000001" });
    m.alVerRuta(resumen);
    expect(m.filaElegidaEn(resumen)).toEqual({ clienteId: "C05" });
    // Se cambia de pestaña: se olvida, también si se vuelve al Resumen.
    m.alVerRuta(clientes);
    expect(m.filaElegidaEn(clientes)).toBeNull();
    m.alVerRuta(resumen);
    expect(m.filaElegidaEn(resumen)).toBeNull();
  });

  it("filtrar o buscar dentro de la misma lista no la vacía", () => {
    const m = crearMemoriaDeVista();
    m.alVerRuta(comprobantes);
    m.elegirFila({ comprobanteId: "1-0003-00000001", clienteId: "C05" }, comprobantes);
    m.alVerRuta({ tipo: "comprobantes", tramo: "1-30", q: "a" });
    m.alVerRuta({ tipo: "comprobantes" });
    expect(m.filaElegidaEn(comprobantes)).not.toBeNull();
  });

  it("«Cómo se calcula», los desgloses y los errores no cuentan como cambiar de sección", () => {
    const m = crearMemoriaDeVista();
    m.alVerRuta(resumen);
    m.elegirFila({ clienteId: "C05" }, resumen);
    for (const ruta of [{ tipo: "como-se-calcula" }, { tipo: "desglose", clave: "mora" }, { tipo: "desconocida" }, { tipo: "inexistente", vista: "cliente" }] as const) m.alVerRuta(ruta);
    expect(m.filaElegidaEn(resumen)).toEqual({ clienteId: "C05" });
    m.alVerRuta(meses);
    expect(m.filaElegidaEn(resumen)).toBeNull();
  });

  it("la primera pantalla que se ve no la vacía (no había nada) y una fila elegida antes de ver una raíz sobrevive a ella", () => {
    const m = crearMemoriaDeVista();
    m.elegirFila({ clienteId: "C05" }, clientes);
    m.alVerRuta(clientes);
    expect(m.filaElegidaEn(clientes)).toEqual({ clienteId: "C05" });
  });
});

describe("solapa de cada cliente", () => {
  it("por defecto es «saldo»; se recuerda por cliente", () => {
    const m = crearMemoriaDeVista();
    expect(m.solapaDe("C05")).toBe("saldo");
    m.elegirSolapa("C05", "recibos");
    m.elegirSolapa("C06", "cuenta");
    expect([m.solapaDe("C05"), m.solapaDe("C06"), m.solapaDe("C07")]).toEqual(["recibos", "cuenta", "saldo"]);
  });

  it("las tres solapas, en orden", () => {
    expect(SOLAPAS_DE_CLIENTE).toEqual(["saldo", "recibos", "cuenta"]);
  });

  it("no se vacía al cambiar de sección", () => {
    const m = crearMemoriaDeVista();
    m.alVerRuta(clientes);
    m.elegirSolapa("C05", "cuenta");
    m.alVerRuta(meses);
    expect(m.solapaDe("C05")).toBe("cuenta");
  });

  it("un id raro no rompe nada ni toca el prototipo de los objetos", () => {
    const m = crearMemoriaDeVista();
    m.elegirSolapa("__proto__", "cuenta");
    expect(m.solapaDe("__proto__")).toBe("cuenta");
    expect(m.solapaDe("constructor")).toBe("saldo");
    expect(({} as Record<string, unknown>)["cuenta"]).toBeUndefined();
  });
});

describe("orden de cada medida", () => {
  it("sin elegir, el orden por defecto de la medida: atraso en las de saldo, importe en las demás", () => {
    const m = crearMemoriaDeVista();
    expect(m.ordenDe("mora")).toBe("atraso");
    expect(m.ordenDe("saldo-neto")).toBe("atraso");
    expect(m.ordenDe("cobranza-mes")).toBe("importe");
  });

  it("lo elegido se recuerda por medida, sin afectar a las otras", () => {
    const m = crearMemoriaDeVista();
    m.elegirOrden("mora", "importe");
    expect(m.ordenDe("mora")).toBe("importe");
    expect(m.ordenDe("saldo")).toBe("atraso");
  });
});

describe("reactividad: un efecto que lee la memoria se vuelve a correr cuando cambia", () => {
  it("fila, solapa y orden", async () => {
    const m = crearMemoriaDeVista();
    const vistas: string[] = [];
    const limpiar = $effect.root(() => {
      $effect(() => {
        vistas.push(`${m.filaElegidaEn(resumen)?.clienteId ?? "-"}|${m.solapaDe("C05")}|${m.ordenDe("mora")}`);
      });
    });
    await tick();
    m.elegirFila({ clienteId: "C05" }, resumen);
    await tick();
    m.elegirSolapa("C05", "recibos");
    await tick();
    m.elegirOrden("mora", "importe");
    await tick();
    m.vaciarFila();
    await tick();
    limpiar();
    expect(vistas).toEqual(["-|saldo|atraso", "C05|saldo|atraso", "C05|recibos|atraso", "C05|recibos|importe", "-|recibos|importe"]);
  });
});
