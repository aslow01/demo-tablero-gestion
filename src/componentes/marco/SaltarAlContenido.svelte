<!-- Enlace «Ir al contenido»: lo primero que alcanza el teclado; se ve solo con el foco (la clase `.saltar` es de base.css). -->
<script lang="ts">
  // No cambia de ruta: lleva el foco al `h1` de la vista (o a `main` si todavía no hay) y deja la dirección como está. Sin script, el `href` es un ancla (la
  // aplicación ignora los cambios de hash que no son direcciones).
  import { TEXTO_MARCO } from "../textos-marco.ts";

  function saltar(evento: MouseEvent): void {
    evento.preventDefault();
    (document.querySelector<HTMLElement>("#principal h1") ?? document.getElementById("principal"))?.focus();
  }
</script>

<a class="saltar" id="saltar" href="#principal" onclick={saltar}>{TEXTO_MARCO.saltarAlContenido}</a>
