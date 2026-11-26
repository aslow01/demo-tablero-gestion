<!-- Ordenar por: un `select` con su rótulo para elegir cómo se ordena una tabla (5.9: «Ordenar por», no cabeceras con flechas, que en tarjetas no existen). Va en la barra de controles de un
     `Panel` (`controles`). No ordena nada ni escribe un texto: recibe las opciones y el rótulo ya hechos y avisa con `alElegir`; el anuncio «Ordenado por …» lo da la barra de estado del panel.
     Antes vivía dentro de la pantalla del Desglose. -->
<script lang="ts" module>
  /** Una opción del orden: su valor (el criterio) y el texto que se ve. */
  export interface OpcionDeOrden<V extends string = string> {
    valor: V;
    texto: string;
  }
</script>

<script lang="ts" generics="V extends string">
  let {
    etiqueta,
    opciones,
    valor,
    alElegir,
    id = "orden",
    dato,
  }: {
    /** El rótulo del campo («Ordenar por»). */
    etiqueta: string;
    opciones: readonly OpcionDeOrden<V>[];
    /** La opción elegida. */
    valor: V;
    alElegir: (valor: V) => void;
    /** `id` del `select` (une el rótulo con el campo). Cambiarlo si hay dos en la misma pantalla. */
    id?: string;
    /** Atributo `data-orden` del `select` (qué tabla ordena): lo usan las pruebas y el foco. */
    dato?: string;
  } = $props();

  function alCambiar(e: Event & { currentTarget: HTMLSelectElement }): void {
    const elegida = opciones.find((o) => o.valor === e.currentTarget.value);
    if (elegida !== undefined) alElegir(elegida.valor);
  }
</script>

<span class="orden">
  <label for={id}>{etiqueta}</label>
  <select {id} data-orden={dato} data-foco="orden" value={valor} onchange={alCambiar}>
    {#each opciones as opcion (opcion.valor)}
      <option value={opcion.valor}>{opcion.texto}</option>
    {/each}
  </select>
</span>

<style>
  .orden {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-1) var(--e-2);
    min-width: 0;
    max-width: 100%;
  }
  label {
    color: var(--c-texto-2);
    font-size: var(--t-tabla);
    font-weight: 650;
  }
  select {
    /* Con el texto agrandado la opción más larga no entra en la pantalla: el selector se achica a su caja y corta lo que no entra; con lugar queda al lado del rótulo.
       El `width: 100%` no lo ensancha (manda el `flex` y el tope de 20rem): hace que el texto de la opción más larga no cuente como ancho mínimo de la barra. */
    flex: 1 1 12rem;
    width: 100%;
    min-width: 0;
    max-width: min(20rem, 100%);
    min-height: var(--alto-tactil);
    padding: 0 var(--e-2);
    border: 1.5px solid var(--c-borde-fuerte);
    border-radius: var(--r-1);
    background: var(--c-superficie);
    color: var(--c-texto);
  }
  @media (min-width: 64rem) {
    select {
      min-height: 2.5rem;
    }
  }
</style>
