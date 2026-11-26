<!-- El `switch` de rutas: de la ruta vigente a la pantalla que la dibuja. Lo único que decide es QUÉ pantalla; el foco, el desplazamiento y los errores son del marco.
     Qué recibe cada pantalla:
       Resumen, Meses, ComoSeCalcula   → { app }
       Comprobantes, Clientes          → { app, ruta }   (ruta: { tipo, tramo? | filtro?, q? })
       Cliente, Comprobante, Desglose  → { app, ruta }   (ruta: con el id, la clave, `cliente`, `mes` y `agrupar` ya validados)
       ErrorDeVista                    → { ruta, enlaceAlResumen }   (ruta: `inexistente` o `desconocida`)
     `app` es la aplicación lista (`AplicacionLista`): `app.datos`, `app.direccion` (ruta, corte, ir, reemplazar, enlace…), `app.memoria` y `app.cierre`.
     Todo lo que lean de `app` o de `ruta` es reactivo: la pantalla se actualiza en el lugar cuando cambian el corte o la consulta (un filtro, una búsqueda). -->
<script lang="ts">
  // `{#key}` sobre `direccion.vista`, que NO cambia con el corte ni con `tramo`, `filtro`, `q` o `agrupar` (ver `idDeVista`): cambiar de cliente, de comprobante o de
  // desglose arma la pantalla de nuevo (sin estado local del anterior: un recibo abierto, una solapa); filtrar o escribir actualiza el DOM en el lugar, y el foco
  // sigue en la pastilla o en el campo.
  import type { AplicacionLista } from "../lib/estado/aplicacion.svelte.ts";
  import Clientes from "./Clientes.svelte";
  import Cliente from "./Cliente.svelte";
  import ComoSeCalcula from "./ComoSeCalcula.svelte";
  import Comprobante from "./Comprobante.svelte";
  import Comprobantes from "./Comprobantes.svelte";
  import Desglose from "./Desglose.svelte";
  import ErrorDeVista from "./ErrorDeVista.svelte";
  import Meses from "./Meses.svelte";
  import Resumen from "./Resumen.svelte";

  let { app }: { app: AplicacionLista } = $props();

  const ruta = $derived(app.direccion.ruta);
</script>

{#key app.direccion.vista}
  {#if ruta.tipo === "resumen"}
    <Resumen {app} />
  {:else if ruta.tipo === "comprobantes"}
    <Comprobantes {app} {ruta} />
  {:else if ruta.tipo === "clientes"}
    <Clientes {app} {ruta} />
  {:else if ruta.tipo === "meses"}
    <Meses {app} />
  {:else if ruta.tipo === "cliente"}
    <Cliente {app} {ruta} />
  {:else if ruta.tipo === "comprobante"}
    <Comprobante {app} {ruta} />
  {:else if ruta.tipo === "desglose"}
    <Desglose {app} {ruta} />
  {:else if ruta.tipo === "como-se-calcula"}
    <ComoSeCalcula {app} />
  {:else}
    <ErrorDeVista {ruta} enlaceAlResumen={app.direccion.enlace({ tipo: "resumen" })} />
  {/if}
{/key}
