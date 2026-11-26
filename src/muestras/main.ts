// SOLO DESARROLLO: monta la galería de piezas (`muestras.html`). No lo importa nadie de la aplicación.
import { mount } from "svelte";
import indexHtml from "../../index.html?raw";
import "../estilos/tokens.css";
import "../estilos/base.css";
import Muestras from "./Muestras.svelte";

const raiz = document.getElementById("app");
if (raiz === null) throw new Error("Falta el elemento #app en muestras.html.");

// El componente Icono apunta al sprite de index.html: se copia acá (con el analizador, sin armar HTML con texto) para que la galería muestre los mismos íconos.
const bloque = /<svg class="sprite"[\s\S]*?<\/svg>/.exec(indexHtml);
if (bloque === null) throw new Error("No se encontró el sprite en index.html.");
const sprite = new DOMParser().parseFromString(bloque[0], "image/svg+xml").documentElement;
document.body.prepend(document.importNode(sprite, true));

mount(Muestras, { target: raiz });
