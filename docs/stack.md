# Stack — Tablero de cobranzas (actualizado el 22/11/2026)

Elección de tecnología para la Demo 3. **Es la de la Demo 2 sin lo que sobra**: no hay una razón fuerte para cambiarla y
sí varias para repetirla (el estado reactivo, la CSP estricta y las piezas que se copian). Las versiones son las de la
Demo 2, ya revisadas con la skill `seguridad-aplicada`.

## 1. Qué tiene que soportar

- **Aplicación 100 % en el navegador**, sin servidor, sin login y **sin persistencia ni entrada del usuario** (no carga
  archivos ni escribe datos): el conjunto de ejemplo se genera al abrir.
- **Ocho pantallas con estado compartido** (el corte elegido): cambiar la fecha de corte recalcula el Resumen, Comprobantes,
  Clientes, Meses, el Cliente, el Comprobante y el Desglose (y «Cómo se calcula» da sus ejemplos con los mismos datos), y vive en la
  dirección (rutas por *hash* con parámetros). Eran cuatro vistas hasta el 25/11/2026 (prototipo «tipo app» aprobado por Matías).
- **Recalcular en el cliente**: generar (< 50 ms) y recalcular todas las medidas para un corte (< 20 ms, con los dos
  caminos de cálculo de cada cifra). Por eso no sirve precalcular en el *build* (por ejemplo con Astro): el corte elegible lo
  impide.
- **CSP estricta** como la Demo 2: `default-src 'none'`, todo en `'self'`, sin `'unsafe-inline'` ni `'unsafe-eval'`,
  `connect-src 'none'`.
- **TypeScript** de punta a punta y **lógica pura testeable** (`src/lib/dominio`, sin una línea de Svelte). El dinero lleva
  un **tipo con marca** (`Centavos`, `diseno.md`, sección 4): el compilador rechaza un `number` suelto donde se pide dinero.
- **Pocas dependencias**, con versión exacta y más de 14 días publicadas.
- **La herramienta se elige por el problema** (regla común de las demos): un tablero que recalcula en el navegador, escrito en
  TypeScript con una capa reactiva liviana.

## 2. Alternativas

| | A. Vite + TS sin framework (Demo 1) | **B. Vite + TS + Svelte 5, sin SvelteKit (Demo 2)** | C. Astro con datos precalculados | D. SvelteKit estático |
| --- | --- | --- | --- | --- |
| Dependencias de producción | 0 | 1 (`svelte`, compilado) | astro + framework de islas | 1 + kit |
| Corte elegible (recalcular al vuelo) | A mano: repintar tablas y gráficos en cada cambio | Reactivo (*runes*: `$state`, `$derived`) | Imposible sin una isla que recalcule todo: pierde el sentido de Astro | Igual que B |
| CSP estricta | Sin fricción | Sin fricción con las reglas de la sección 3 | Fricción (scripts de hidratación en línea) | Fricción (arranque en línea, *hashes* por compilación) |
| Reutilizar piezas de la Demo 2 | Hay que traducirlas | **Se copian tal cual** (componentes, tokens, CI, scripts) | Hay que traducirlas | Parcial |
| Señal para un líder técnico | "Sabe sin framework" (ya lo muestra la Demo 1) | "Misma herramienta que la Demo 2, con los componentes copiados y los tests verdes por su cuenta" | "Eligió el marco por la moda, no por el problema" | Sobredimensionado |

**Recomendación (y decisión S1): B.** El corte recalcula todo, los gráficos y las tablas se derivan de la misma medida y
las piezas de la Demo 2 se reutilizan sin traducirlas (se copia, no se enlaza: decisión S2).

## 3. Reglas para que Svelte cumpla la CSP (las de la Demo 2, medidas allá el 18/11/2026)

1. **Nada de atributo `style` en el marcado** (`<div style="…">`), por regla de la casa. Los valores
   dinámicos (alto de una barra, posición de una marca) van como **atributos SVG** (`x`, `y`, `width`, `height`, `transform`)
   o con la directiva **`style:propiedad`**, que asigna por CSSOM y la CSP permite. **Medido en E1 (22/11/2026, Chrome, con la CSP
   real):** un `style="…"` escrito en el marcado de Svelte, estático o con valores dinámicos, **no** da violación (Svelte lo
   clona desde una plantilla o lo asigna por CSSOM), así que la CSP no vigila esta regla: la vigila la revisión. Que la CSP está
   activa se comprueba de otra forma: `setAttribute("style", …)` y `innerHTML` con un `style` dan `style-src-attr`, un `<style>` inyectado da
   `style-src-elem` y un `<script>` inyectado da `script-src-elem`, y `fetch` falla por `connect-src`.
2. **CSS de los componentes a archivo** (`emitCss`, valor por defecto): la compilación de producción saca todo el CSS a
   `assets/*.css` (`style-src 'self'`).
3. **Prohibido `{@html}`**. Revisión por búsqueda en CI.
4. **Sin transiciones de Svelte** (`transition:`): el movimiento va por CSS con `prefers-reduced-motion`. El movimiento entre
   pantallas usa `document.startViewTransition` (JavaScript propio, `src/lib/estado/transicion.ts`, sin dependencias): los nombres de
   transición se ponen con una clase en la raíz y un atributo (`data-viajando`) que activan reglas de `src/estilos/movimiento.css`, no con
   `style` (ni en el marcado ni por CSSOM). Solo en Chrome y Chromium (agente de usuario con «Chrome/» o «Chromium/» y sin «CriOS/», «FxiOS/», «EdgiOS/» ni «OPiOS/»; `usaViewTransitions`): en Safari, Firefox, navegadores de iPhone, agentes desconocidos o vacíos y sin la API entra una animación de CSS, con el mismo resultado final; con movimiento reducido, nada.
5. **Gráficos en SVG propio**, sin biblioteca: el eje de importes empieza en 0 y los valores negativos (C5, T09) bajan del
   eje. Cada gráfico tiene su tabla equivalente ("Ver como tabla") y un `aria-label` con los valores.

CSP (`public/_headers`, partió de la de la Demo 2 y se acotó a lo que esta demo usa: sin `blob:` en las imágenes y sin `worker-src` ni `manifest-src`, que no usa y que caen en
`default-src 'none'`; `data:` sigue porque el ícono de la pestaña va en un `data:` de `index.html`):

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
```

## 4. Dependencias

Versiones **exactas** (sin `^`), publicadas hace más de 14 días al instalar. Todas, salvo Playwright, ya están aprobadas en
la Demo 2 y se usan iguales.

| Paquete | Tipo | Para qué | Nota |
| --- | --- | --- | --- |
| `svelte` **5.57.3** | producción (compilada) | Componentes y reactividad. | Entra en el paquete solo su *runtime*. **Única dependencia de producción.** |
| `vite` **8.3.5** | desarrollo | Servidor de desarrollo y compilación. | Igual que la Demo 2. |
| `vitest` **5.1.0** | desarrollo | Tests. | Igual. |
| `typescript` **6.0.3** | desarrollo | Tipos. | TypeScript 6 porque `svelte-check` 4.7.8 pide 5 o 6 (decisión S3 de la Demo 2). |
| `@sveltejs/vite-plugin-svelte` **7.3.1** | desarrollo | Compila `.svelte` y `.svelte.ts`. | Igual. |
| `svelte-check` **4.7.8** | desarrollo | Tipos dentro de los `.svelte` (CI). | Igual. |
| `@playwright/test` (versión exacta, publicada hace más de 14 días: **se fija en E1** con `npm view`) | desarrollo | Prueba de punta a punta del recorrido de 2 minutos contra el *build* servido con la CSP real. | Decisión 7: **sí si GitHub Actions anda**; si no, el mismo guion corrido a mano y documentado, como en la Demo 2. Se revisa con `seguridad-aplicada` (descarga de navegadores en la instalación) antes de sumarla. |
| ~~`fake-indexeddb`~~ | — | — | No hace falta: no hay persistencia. |

**No se usan** (y por qué): enrutador (uno propio por *hash*, con parámetros, copiado de la Demo 2); biblioteca de gráficos
(SVG propio); librería de fechas (las fechas civiles se calculan con `Date.UTC`, copiado de la Demo 2); `Intl.NumberFormat`
para dinero (los importes son enteros y se formatean con enteros, M1); kit de componentes ni paquete de íconos (sistema
visual y sprite propios); biblioteca de CSV (el extra P2 reutiliza el de la Demo 1).

## 5. Estructura del repositorio

```
demo-tablero-gestion/
├── index.html                 raíz, favicon, sprite de íconos
├── public/_headers            CSP y cabeceras de Cloudflare Pages
├── src/
│   ├── main.ts                monta la aplicación
│   ├── App.svelte             crea la aplicación (datos, dirección, movimiento) y dibuja el marco
│   ├── lib/
│   │   ├── dominio/           reglas puras (fechas, dinero, comprobantes, corte, antigüedad, agregados, partidas, medidas, controles, validadores, textos)
│   │   ├── datos/             azar, cuit, huella, clientes, plantados, generador, esperado
│   │   ├── estado/            enrutador por hash con parámetros, estado reactivo (*.svelte.ts) y movimiento entre pantallas (transicion.ts)
│   │   └── vistas/            modelos de vista: lo que cada pantalla muestra, calculado con las medidas controladas
│   ├── rutas/                 una pantalla por archivo (Resumen, Comprobantes, Clientes, Meses, Cliente, Comprobante, Desglose, ComoSeCalcula, errores)
│   ├── componentes/           presentación y gráficos SVG; `marco/` (lateral, barras, selector de corte, avisos, pie)
│   └── estilos/               tokens.css, base.css, movimiento.css, fuentes/ (tres familias alojadas con su licencia OFL)
├── tests/                     *.test.ts (dominio, generador, propiedades, enrutador), fixtures/ (datos mínimos escritos a mano) y e2e/
├── scripts/                   buscar-prohibidos.mjs (+ prohibidos.mjs, ensayo-buscar.mjs), contraste.mjs, servir-dist.mjs, test-tz.mjs, mutaciones.mjs (+ .json), oraculo.mjs, referencia.mjs, medir.mjs
├── docs/                      diseno.md, diseno-ui.md (especificación para los agentes que maquetan), stack.md, plan.md, registro.md, procedencia.md (desde E1)
└── .github/workflows/ci.yml
```

## 6. Verificación y CI

- `npm run check`: `svelte-check` + `tsc --noEmit`, 0 errores.
- `npm test`: Vitest. En CI con **matriz de zonas horarias** (`TZ=UTC`, `TZ=Asia/Tokyo`, `TZ=America/Los_Angeles`): el dominio
  no tiene reloj, pero la matriz protege `formatearFecha` y cualquier `Date` que se cuele por error. Incluye los tests de
  propiedad (dos cálculos independientes de cada cifra y controles cruzados) con sus mutaciones plantadas.
- `npm run build` + servir `dist/` con las cabeceras de `_headers` (`scripts/servir-dist.mjs`) sin violaciones de CSP en
  la consola.
- `npm audit --audit-level=high` sin altas ni críticas (si aparece una excepción de herramientas de desarrollo, se
  documenta con fecha de revisión).
- **Dinero:** la defensa principal es el tipo `Centavos` con marca y su constructor que valida (`diseno.md`, M1); un test de
  tipos con `@ts-expect-error` comprueba que un `number` suelto no compila. `npm run check` lo hace cumplir.
- `npm run buscar` (`scripts/buscar-prohibidos.mjs`): sin `{@html}`; sin `Math.random` y sin `new Date(` en `src/lib`;
  **de respaldo**, sin `parseFloat`, `toFixed`, `Math.round` ni `Number(` en `src/lib/dominio` (M1; excepción por archivo
  para `fechas.ts`; la búsqueda por texto se saltea con `+x` o `/ 100`, por eso no es la defensa principal); sin nombres de
  empresas reales ni correos que no sean de un dominio de ejemplo ni datos personales. Los nombres de terceros **no están en el
  repositorio, ni siquiera como huella** (un SHA-256 sin sal de una palabra corta se recupera probando un diccionario): salen de
  `scripts/prohibidos.local.json` (`{ "palabras": [...] }`, ignorado por git). Sin ese archivo (integración continua, clon ajeno) la regla
  se omite con un aviso y las otras corren igual; con el archivo roto, la búsqueda falla. Se corre en local antes de cada publicación.
- **Tamaño:** tope de **100 KB de JS comprimido con gzip** (la Demo 2 subió el suyo a 120 KB; acá, sin formularios ni persistencia, se
  espera menos). **Medido en E1 (22/11/2026):** página vacía, 9,3 KB de JS y 2,3 KB de CSS comprimidos (22,4 KB y 5,9 KB sin comprimir);
  con todos los componentes copiados montados (Aviso, Boton, Dialogo, Etiqueta, Panel), 19,6 KB de JS y 4,0 KB de CSS comprimidos.
  **Medido con las ocho pantallas y el movimiento (25/11/2026, `npm run peso`):** 80,7 KB de JS y 13,3 KB de CSS comprimidos (el movimiento
  sumó 0,9 KB de JS y 0,3 KB de CSS); más 201 KB de tipografías `woff2`, que no cuentan para el tope. **Al 26/11/2026** (tras las correcciones de la tanda 5):
  81,5 KB de JS (81.478 B) y 13,6 KB de CSS (13.565 B).
- **Recorrido de 2 minutos** (E6): `@playwright/test` si Actions anda (decisión 7); si no, guion manual en
  `docs/diseno-ui.md`.
- Visual: escritorio y 360 px, claro y oscuro, contraste medido con `scripts/contraste.mjs`.

## 7. Publicación

Cloudflare Pages, proyecto propio, subdominio `tablero.matiasormeno.com.ar` (lo hace el hilo principal con Matías). Rutas
por *hash*: no hace falta regla de reescritura. Primero, versión de prueba privada en `*.pages.dev`, como en las demos
anteriores. Repositorio `aslow01/demo-tablero-gestion`, privado hasta una revisión previa a publicar (todo el historial
revisado por secretos y datos personales). **No se publica antes que la Demo 2**, de la que copia piezas (S2). Licencia MIT.

## 8. Decisiones

| # | Pregunta | Opciones | Decisión |
| --- | --- | --- | --- |
| S1 | Stack | A sin framework · **B Svelte 5 sin Kit** · C Astro con datos precalculados · D SvelteKit | **B** (propuesto por la IA, aprobado por Matías el 22/11/2026): el corte elegible pide recalcular en el cliente y las piezas de la Demo 2 se copian sin traducir. |
| S2 | Reutilización de piezas | Paquete compartido · submódulos · **copiar con procedencia** | **Copiar** (propuesto por la IA): primera línea de cada archivo con su origen (la Demo 2); `docs/procedencia.md` con la lista y los cambios, y el commit de origen **recién cuando la Demo 2 sea pública** (hasta entonces, "pendiente de publicar"); los tests se copian con el código. Un paquete acopla los ciclos de versión y obliga a publicar en npm. Se reevalúa si la Demo 4 vuelve a copiar lo mismo. |
| S3 | Prueba de punta a punta | `@playwright/test` · guion manual | **`@playwright/test` si Actions anda** (decisión 7); si no, guion manual documentado. |
| S4 | Rutas | *Hash* · historial con reescritura | *Hash* (como la Demo 2): cada número tiene su enlace permanente, con el corte en la dirección, y funciona igual en la vista previa y en el dominio. |
| S5 | TypeScript | 7 · **6.0.3** | **6.0.3**: el mismo motivo que la Demo 2 (`svelte-check` no soporta 7 sin un alias experimental). Volver a mirar cuando soporte 7. |
| S6 | ¿Un `style="…"` plantado en el marcado de Svelte da violación de CSP? | Sí (supuesto de la Demo 2) · **No** | **No** (medido en E1, propuesto por la IA): la prueba de que la CSP está activa pasa a hacerse con `setAttribute`, `innerHTML`, `<style>` y `<script>` inyectados. La regla de no escribir `style` en el marcado se mantiene por la revisión, no por la CSP. Conviene avisar a la Demo 2, que dice lo contrario en su `stack.md`. |
| S7 | Enrutador: ¿copiarlo en E1? | Copiar · **escribirlo en E5** | **Escribirlo en E5** (propuesto por la IA): sus rutas y su perfil son de la Demo 2; ver `docs/procedencia.md`. |
| S8 | Reglas de `buscar-prohibidos.mjs` | Dentro del script · **en un módulo con tests** | **`scripts/reglas-codigo.mjs`** (propuesto por la IA): así cada llamada prohibida (`toFixed`, `Math.round`, `Number(`…) se planta en un test, que es el criterio del paso 1.4. |
