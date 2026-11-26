// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): src/componentes/anuncio.svelte.ts.
// Cambios: ninguno.
// Anuncio a lectores de pantalla desde una región `role="status"` (WCAG 4.1.3). Para que se diga, el texto tiene que ENTRAR a una región que ya existía vacía:
//  - Se vacía y se vuelve a escribir unos 80 ms después, así un mensaje igual al anterior («Novedad cargada.» dos veces) también cambia el DOM y se anuncia.
//  - Nunca nace junto con la región: el primero también entra con retraso.
// `origen` devuelve el texto y, aparte, un valor (`repetir`) que cambia cada vez que la pantalla emite un mensaje, aunque el texto sea el mismo.
// Se usa dentro de un componente (crea un `$effect`).
import { untrack } from "svelte";

export const ESPERA_ANUNCIO_MS = 80;

export function textoAnunciado(origen: () => { texto: string; repetir?: unknown }): { readonly valor: string } {
  let valor = $state("");
  $effect(() => {
    const { texto, repetir } = origen();
    void repetir;
    untrack(() => (valor = ""));
    if (texto === "") return;
    const plazo = setTimeout(() => (valor = texto), ESPERA_ANUNCIO_MS);
    return () => clearTimeout(plazo);
  });
  return {
    get valor() {
      return valor;
    },
  };
}
