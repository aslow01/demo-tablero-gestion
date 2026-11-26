// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): svelte.config.js.
// Cambios: la referencia a las reglas de CSP apunta a docs/stack.md, sección 3.
// Svelte 5 sin SvelteKit. Todos los componentes en modo runes (`$state`, `$derived`, `$props`).
// Reglas de CSP, `{@html}` y transiciones: docs/stack.md sección 3; las vigila `npm run buscar`.
export default {
  compilerOptions: {
    runes: true,
  },
};
