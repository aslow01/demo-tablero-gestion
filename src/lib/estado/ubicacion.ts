// Basado en la Demo 2 (Control de flota, del mismo autor, MIT): src/lib/estado/ubicacion.ts.
// Cambios (docs/procedencia.md): `atras()` en la interfaz y en la versión en memoria, que ahora lleva un historial de verdad (atrás, adelante, y un
// `irA` al mismo hash no hace nada, como en el navegador) para probar en Node el recorrido de la aplicación.
// La barra de direcciones como un objeto chico y reemplazable: así el estado de la aplicación se prueba en Node sin
// ventana. `ubicacionDelNavegador` es el único código que toca `window.location` y `history`.

export interface Ubicacion {
  /** El hash actual, con el '#' (o vacío). */
  leerHash(): string;
  /** Cambia de pantalla agregando una entrada al historial (dispara el aviso de cambio, como un clic en un enlace). */
  irA(hash: string): void;
  /** Corrige el hash sin agregar entrada ni avisar (formas canónicas y redirecciones). */
  reemplazarHash(hash: string): void;
  /** Vuelve a la entrada anterior del historial (el botón «Atrás» del navegador). Avisa del cambio, como cualquier cambio de hash. */
  atras(): void;
  /** Se llama cuando cambia el hash por navegación (enlaces, atrás/adelante). Devuelve cómo dejar de escuchar. */
  alCambiar(oyente: () => void): () => void;
}

export function ubicacionDelNavegador(): Ubicacion {
  return {
    leerHash: () => window.location.hash,
    irA(hash) {
      window.location.hash = hash;
    },
    reemplazarHash(hash) {
      window.history.replaceState(window.history.state, "", hash);
    },
    atras() {
      window.history.back();
    },
    alCambiar(oyente) {
      window.addEventListener("hashchange", oyente);
      return () => window.removeEventListener("hashchange", oyente);
    },
  };
}

/**
 * Para los tests: un historial en memoria. `entradas` cuenta las entradas del historial (empieza en 1; `irA` agrega una y descarta las de adelante,
 * `reemplazarHash` no agrega; `atras` y `adelante` no cambian la cuenta). Avisa de forma síncrona, a diferencia del navegador.
 */
export function ubicacionEnMemoria(inicial = ""): Ubicacion & { hash: string; entradas: number; adelante(): void } {
  const oyentes = new Set<() => void>();
  const historial: string[] = [inicial];
  let indice = 0;

  const avisar = (): void => {
    for (const o of [...oyentes]) o();
  };
  const u = {
    hash: inicial,
    entradas: 1,
    leerHash: () => u.hash,
    irA(hash: string) {
      if (hash === u.hash) return;
      historial.splice(indice + 1, historial.length, hash);
      indice = historial.length - 1;
      u.hash = hash;
      u.entradas = historial.length;
      avisar();
    },
    reemplazarHash(hash: string) {
      historial[indice] = hash;
      u.hash = hash;
    },
    atras() {
      if (indice === 0) return;
      indice -= 1;
      u.hash = historial[indice] ?? "";
      avisar();
    },
    adelante() {
      if (indice >= historial.length - 1) return;
      indice += 1;
      u.hash = historial[indice] ?? "";
      avisar();
    },
    alCambiar(oyente: () => void) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
  return u;
}
