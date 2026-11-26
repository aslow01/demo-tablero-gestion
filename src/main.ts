import { mount } from "svelte";
import "./estilos/tokens.css";
import "./estilos/base.css";
import "./estilos/movimiento.css";
import App from "./App.svelte";

const raiz = document.getElementById("app");
if (raiz === null) throw new Error("Falta el elemento #app en index.html.");

mount(App, { target: raiz });
