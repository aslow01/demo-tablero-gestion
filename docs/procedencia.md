# Procedencia de las piezas copiadas

Esta demo copia algunas piezas de la Demo 2 (Control de flota, del mismo autor, licencia MIT) en lugar de enlazarlas (decisión S2 de
`docs/stack.md`). Todo se copió el 22/11/2026 de la rama de trabajo de la Demo 2.

**La columna "Commit de origen" está pendiente en todas las filas.** La Demo 2 es pública desde el 25/11/2026 (con el historial reescrito, así
que los commits de la rama de trabajo de la que se copió no existen en el repositorio público); por eso no se cita ningún commit y el origen
es el repositorio `aslow01/demo-control-flota` en general.

Cada archivo de código copiado lleva en su primera línea `Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): <ruta>.` y, si se
adaptó, una segunda con los cambios. Los que no admiten comentarios (`package-lock.json`, `tsconfig.json`, `.gitignore`, `LICENSE` y
`public/_headers`, donde la primera línea es parte del formato) se listan acá.

## Copiados

| Archivo en esta demo | Origen en la Demo 2 | Cambios | Commit de origen |
| --- | --- | --- | --- |
| `package-lock.json` | `package-lock.json` | Se quitó `fake-indexeddb` (no hay persistencia) y se cambió el nombre del paquete. Mismas versiones de todo lo demás. | pendiente |
| `tsconfig.json`, `.gitignore`, `LICENSE` | los mismos | Ninguno. | pendiente |
| `public/_headers` | `public/_headers` | Ninguno (la CSP es la de `docs/stack.md`, sección 3). | pendiente |
| `vite.config.ts` | `vite.config.ts` | Solo comentarios (se sacó la mención a la regla T2). | pendiente |
| `svelte.config.js` | `svelte.config.js` | Solo un comentario (la referencia a `docs/stack.md`). | pendiente |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | Mismos pasos. Comentarios nuevos (el estado y la descripción del flujo). | pendiente |
| `index.html` | `index.html` | Título y favicon propios; el sprite trae solo los 12 íconos de `docs/diseno-ui.md` 5.15: nueve copiados (`vencido`, `reloj`, `alerta`, `check`, `guion`, `cerrar`, `chevron`, `flecha-izq`, `ayuda`, sin cambios) y tres nuevos dibujados acá (`marca`, `chevron-izq`, `chevron-der`). | pendiente |
| `scripts/servir-dist.mjs` | `scripts/servir-dist.mjs` | Ninguno. | pendiente |
| `scripts/test-tz.mjs` | `scripts/test-tz.mjs` | Solo un comentario (regla T2). | pendiente |
| `scripts/contraste.mjs` | `scripts/contraste.mjs` | La lista de pares es la de `docs/diseno-ui.md` 3.3 (148 mediciones); se sacaron patente, peligro, horizonte y "hoy". La lectura de `tokens.css`, la fórmula de WCAG y la salida no cambiaron. | pendiente |
| `scripts/buscar-prohibidos.mjs` | `scripts/buscar-prohibidos.mjs` | Las reglas de código salieron a `reglas-codigo.mjs` (para probarlas) y se sumaron las de dinero y de reloj de esta demo (M1). Quedan acá la lectura de archivos, las reglas de nombres y de correos y la salida. Los nombres salen de `scripts/prohibidos.local.json` (ver abajo). | pendiente |
| `scripts/prohibidos.mjs`, `prohibidos.d.mts`, `ensayo-buscar.mjs`, `ensayo-buscar.d.mts` | los mismos (versión del 25/11/2026) | Sin `marcaPendienteDeConfirmar` (esta demo no tiene esa regla). Los nombres de terceros se leen de `scripts/prohibidos.local.json` (no versionado), sin huellas; `huellas-prohibidas.*` ya no existen. | pendiente |
| `src/lib/dominio/fechas.ts` | `src/lib/dominio/fechas.ts` | Sin todo lo del reloj (`hoyEnArgentina`, `fechaEnArgentina`, `parsearInstante`, `formatearInstante`, `formatearHora`, `Intl.DateTimeFormat`, tipo `Instante`) y sin `sumarAnios`, `diaDeLaSemana` ni `formatearFechaConDia` (nada las usa todavía). Quedan `parsearFechaCivil`, `diasEntre`, `sumarDias` y `formatearFecha`, sin cambios; **se agregó `sumarMeses` (propia de esta demo, E3)**, que lee dígitos con `Number(` y por eso vive acá (H5). | pendiente |
| `src/lib/datos/azar.ts` | `src/lib/datos/azar.ts` | Ninguno de código (un comentario). El orden de las llamadas es contrato (G1). | pendiente |
| `src/lib/datos/cuit.ts` | `src/lib/datos/cuit.ts` | Ninguno. | pendiente |
| `src/estilos/tokens.css` | `src/estilos/tokens.css` | Valores de `docs/diseno-ui.md` 3.1 a 3.6: acento azul tinta, tono `pendiente`, series, cinco tonos de tramo, `--t-cifra`, `--t-cifra-2`, `--t-centavos`. Se borraron los tokens sin uso (patente, parte, peligro, alias de tonos, `--ancho-parte`). | pendiente |
| `src/estilos/base.css` | `src/estilos/base.css` | Tonos de esta demo en lugar de los alias de la Demo 2; sin `.km`. El resto (reinicio, foco, utilidades, movimiento reducido) no cambió. | pendiente |
| `src/componentes/Icono.svelte` | `src/componentes/Icono.svelte` | Ninguno. | pendiente |
| `src/lib/estado/ubicacion.ts` | `src/lib/estado/ubicacion.ts` | Ninguno de código (se sumaron dos renglones de procedencia). `Ubicacion`, `ubicacionDelNavegador` y `ubicacionEnMemoria` quedan igual. | pendiente |
| `src/componentes/anuncio.svelte.ts` | `src/componentes/anuncio.svelte.ts` | Ninguno. | pendiente |
| `src/componentes/Boton.svelte` | `src/componentes/Boton.svelte` | Sin la variante `peligro` ni el estado `cargando` (`docs/diseno-ui.md` 5.1: sin acciones destructivas ni en curso). | pendiente |
| `src/componentes/Etiqueta.svelte` | `src/componentes/Etiqueta.svelte` | Sin la variante `texto` (solo la usaba "Puede salir"). | pendiente |
| `src/componentes/Aviso.svelte` | `src/componentes/Aviso.svelte` | Sin el aviso compacto de dos renglones (`partirAviso` y `accion`). | pendiente |
| `src/componentes/Panel.svelte` | `src/componentes/Panel.svelte` | Solo comentarios y ejemplos; el código no cambió. | pendiente |
| `src/componentes/Dialogo.svelte` | `src/componentes/Dialogo.svelte` | Sin lo de formularios: `hayCambios`, `bloqueado`, "Descartar cambios / Seguir editando" y `focoInicial="cancelar"`. Foco, Tab, Esc, bloqueo del fondo y doble clic no cambiaron. **Quitado el 26/11/2026: ninguna pantalla lo usa.** | quitado |
| `src/componentes/tipos.ts` | `src/componentes/tipos.ts` | Tonos e íconos de esta demo; sin los tipos del parte, la flota y la barra de la Demo 2. | pendiente |
| `src/componentes/textos-marco.ts` | `src/componentes/textos-marco.ts` | Solo la estructura y los tres textos que usan `Aviso` y `Dialogo`; el resto es nuevo y se arma en E5. | pendiente |
| `tests/azar.test.ts` | `tests/azar.test.ts` | Solo el identificador del primer test (D1 → G1). | pendiente |
| `tests/cuit.test.ts`, `tests/cabeceras.test.ts` | los mismos | Ninguno. | pendiente |
| `tests/zona-horaria.test.ts` | `tests/zona-horaria.test.ts` | Solo comentarios y nombres (sin la regla T2). | pendiente |
| `tests/prohibidos.test.ts` | `tests/prohibidos.test.ts` | Versión del 25/11/2026 (archivo local en lugar de huellas). Sin los tests de «a confirmar»; una frase de ejemplo de los falsos positivos; el caso «las demás reglas siguen corriendo» planta `eval`; se agregaron los tests de que `.gitignore` trae el archivo local y `.env*`, y de que ningún script trae 64 hexadecimales. | pendiente |
| `tests/fechas.test.ts` | `tests/fechas.test.ts` | Sin los tests del reloj y de las zonas horarias; los identificadores T1 a T7 pasan a nombres descriptivos porque acá T01 a T17 son casos de datos. Los tests que quedan no cambiaron; se agregaron los de `sumarMeses`. | pendiente |

## Escrito de nuevo en esta demo

| Archivo | Qué es |
| --- | --- |
| `scripts/reglas-codigo.mjs` y `.d.mts`, `tests/reglas-codigo.test.ts` | Las reglas de la búsqueda de código, con las de dinero (M1) y de reloj, y sus tests (cada llamada prohibida se planta). |
| `src/lib/estado/enrutador.ts`, `src/lib/estado/direccion.svelte.ts`, `tests/enrutador.test.ts`, `tests/direccion.test.ts`, `tests/direccion-reactividad.svelte.test.ts` | El enrutador por *hash* con parámetros, el estado reactivo de la dirección y sus tests (E5, paso 5.1). El patrón de `*.svelte.test.ts` y de `$effect.root` es el de `tests/reactividad.svelte.test.ts` de la Demo 2. |
| `src/lib/estado/transicion.ts`, `src/estilos/movimiento.css`, `tests/transicion.test.ts` | El movimiento entre pantallas (tanda 4): View Transitions, el nombre que viaja y el fallback de CSS. Escritos desde cero para esta demo; **no se copió nada de la Demo 2**. |
| `tests/iconos.test.ts` | El sprite de `index.html` y la lista `ICONOS` coinciden. |
| `src/lib/dominio/tipos.ts`, `src/main.ts`, `src/App.svelte` | Mínimos de E1 (el tipo `FechaCivil`, el montaje y la página vacía). |
| Íconos `marca`, `chevron-izq` y `chevron-der` | Dibujados para esta demo. |
| `src/lib/dominio/dinero.ts`, `comprobantes.ts`, `validadores.ts`, la ampliación de `tipos.ts`, `tests/fixtures/` y sus tests (E2) | Escritos desde cero a partir de `docs/diseno.md`. **No se copió nada de la Demo 2** en esta etapa. |

## No copiado

| Pieza | Por qué |
| --- | --- |
| Enrutador por *hash* (`src/lib/estado/enrutador.ts`) | Sus rutas, su perfil y sus parámetros son de la Demo 2 y esta demo lleva `corte`, `cliente`, `mes` y `agrupar` validados contra los datos: copiarlo era reescribirlo. **Escrito de nuevo en E5 (paso 5.1)**, con TDD y las mismas defensas de entrada (largo máximo, `decodeURIComponent` con `try`, nunca repetir lo escrito en la interfaz). De la Demo 2 se tomó solo la idea de la forma (una función pura de hash a ruta y otra de ruta a hash) y `ubicacion.ts`, que sí está copiado arriba. |
