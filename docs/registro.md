# Registro

Los roles que aparecen en este registro («programador», «maquetador», «diseñador», «redactor», «revisor», «QA»,
«auditor», «crítico») son agentes de IA con instrucciones distintas. Matías es el único humano: decide, prioriza y aprueba.
Convención: **«decidido por Matías»** es una decisión que él contestó; **«propuesto por IA»** es una propuesta de un agente
sin decisión de Matías registrada todavía. Los documentos los escribieron agentes en una sesión y él los revisó y decidió:
el historial de commits no es una prueba de proceso.

## 22/11/2026 — Etapa E0: diseño de la Demo 3 (propuesto por IA)

**Qué se hizo.** Se escribieron `CLAUDE.md`, `README.md` (provisional), `docs/diseno.md`, `docs/stack.md`, `docs/plan.md` y esta
entrada, a partir de un plan inicial de la demo y de la forma de trabajo de la Demo 2. `docs/diseno-ui.md` lo escribió el
diseñador en paralelo. Sin código todavía.

| Qué | Cómo quedó (después, ver la tercera entrada) |
| --- | --- |
| Reglas | 34 reglas con identificador y al menos un caso con números concretos: M1–M5, C1–C5, R1–R4, S1–S7, A1–A2, D1–D4 y G1–G7. Se sumaron M5 (rotulado de la base), S7 (mes del corte), G6 y G7 a las 30 del plan inicial. G6 se retiró después. |
| Casos plantados | T01 a T16 como constantes con alias, clientes, fechas e importes exactos. Después se movieron en su mayoría a fixtures. |
| Decisiones de alcance | Las ocho decisiones de alcance (calendario fijo, corte solo en cierres de mes, facturación sin IVA y saldos con IVA rotulado, días corridos, datos propios, `@playwright/test` si Actions anda, retenciones en el mínimo) las contestó Matías el 22/11/2026: la 1 la cambió él (la Demo 3 arranca ya, en paralelo con el cierre de la Demo 2) y en las otras siete aceptó la recomendación. Están en `diseno.md`, 11.1. |
| Decisiones propias | Catorce huecos o contradicciones del plan inicial resueltos con lo más simple, propuestos por IA (`diseno.md`, 11.2, H1 a H14): corte válido solo en cierres de mes (H1), tope 10^12 centavos porque M3 multiplica por 1000 (H2), T11 sobre el tramo 61–90 (H3), un único recibo posterior a `hasta` (H4), búsqueda de CI sobre `Math.round` y `Number(` (H5), saldo a favor solo si el cliente no tiene comprobantes con saldo (H7). |

**Verificación.** Los números de los casos (vencimientos, atrasos, IVA, porcentajes por mayor resto, sumas de tramos y de mora,
los tres vectores de FNV-1a) se comprobaron con un script descartable fuera del repositorio. No hay código que probar todavía.

## 22/11/2026 (segunda parte) — Cierre de E0: decisiones P1 a P3 y verificación independiente (propuesto por IA)

**Qué se hizo.** Se aplicaron las decisiones de Matías sobre `diseno-ui.md` (P1 a P3, en las tres aceptó la recomendación del
diseñador), se resolvieron ocho hallazgos de una verificación independiente de `diseno.md` y se alineó la sección 12 de
`diseno-ui.md` con las claves, filtros y partidas reales. Solo documentos; sin código.

| Qué | Cómo quedó |
| --- | --- |
| P1, P2, P3 | Decisiones 9, 10 y 11 de `diseno.md` (11.1), decididas por Matías. P1: nueva medida `facturado-con-iva-mes` (= `facturacion-mes + iva-mes`; la cifra principal sigue sin IVA). |
| Verificación | Un script aparte recalculó el resultado esperado de entonces y los casos T01–T16 y coincidió. Se repitió con T17 incluido. (Esos números del resultado esperado se retiraron en la tercera entrada.) |
| Decisiones nuevas | H15 a H26, propuestas por IA (`diseno.md`, 11.2): T17 sobre T12-d91 para el recorrido (H15), recibos agrupados por cliente y fecha (H17), cortes arbitrarios en las funciones (H18), R2/T08 reescrita (H20), a cuenta mayor que `S` sin partir (H22), desempates de numeración (H23), `mes=`, `mora-otros` y `agrupar=no` (H24), `clienteId` y % con negativos (H25), cifra Saldo de cada vista (H26). H16, H19 y H21 se retiraron en la tercera entrada. |

**T12-d91 (caso T17).** Neto 500.000,00 → **900.000,00**, IVA 189.000,00, total **1.089.000,00**; se le suman la NC T17-NC
(121.000,00, 20/07/2026), el recibo T17-R1 (12/08/2026: 242.000,00 = 234.000,00 + 5.000,00 de IIBB + 3.000,00 de Ganancias) y
T17-R2 (14/10/2026: 121.000,00). Saldo de T12-d91 968.000,00 / 726.000,00 / 726.000,00 / 605.000,00 al 31/07, 31/08, 30/09 y
31/10; atraso −1 / 30 / 60 / 91. Sigue valiendo.

## 22/11/2026 (tercera parte) — Ajuste de E0 tras la revisión del crítico (propuesto por IA, con decisiones de Matías)

**Por qué.** Una revisión independiente (de reclutador y de senior, hecha por una IA) encontró cuatro bloqueos antes de
escribir código. Matías decidió el 22/11 sobre los cuatro; lo demás que salió de la revisión son propuestas de IA que aún no tienen decisión suya.
Solo documentos; sin código.

| Qué | Cómo quedó | Quién |
| --- | --- | --- |
| El control no probaba nada | El valor de cada cifra se definía como la suma de sus partidas, así que comparar una con la otra no podía fallar. Ahora cada medida se obtiene por **dos caminos en módulos distintos** (`agregados.ts`: suma datos crudos; `partidas.ts`: lista comprobante por comprobante) y `controlar` los compara. Se suman los **controles cruzados** X1 a X6: tramos contra saldo, tramos vencidos contra mora, clientes contra total, cuenta corriente contra saldo neto, facturado con IVA contra facturación más IVA, año contra meses. Tres mutaciones plantadas, una por camino y una en el saldo de S2, tienen que hacer fallar su control. | Decidido por Matías (22/11) |
| El cierre y el sello en la pantalla | El renglón «la suma de las partidas cuadra ✓» y el sello de fecha de corte (semilla y huella) salen de la interfaz. El control vive en los tests y en «Cómo se calcula»; el pie trae una línea de fuente de datos. La pantalla de error de D2 subsiste para cuando un control falle. | Decidido por Matías (22/11) |
| «Exacto para toda semilla» | Se fija el resultado esperado **solo para la semilla publicada** (prueba de referencia, G3). Los casos borde pasan a **fixtures escritos a mano** (`diseno.md`, 5.5): T01, T03, T09, T10, T11, T12 (salvo T12-d91), T13 a T16 y R4. En la semilla quedan T02, T04, T05, T06, T07, T08 y T12-d91 con T17 (el recorrido). Se retiran G6, G8, H6, H16, H19, H21, D4, el cliente C14 (quedan 13) y el perfil `inactivo`. El generador vuelve a ser simple: cobros con atraso natural y sin acumular cobros el 31/10. Único ajuste: C09 deja de facturar el 01/08/2026 para que T07 siga siendo un saldo a favor. Quedan 32 reglas (M1–M5, C1–C5, R1–R4, S1–S7, A1–A2, D1–D3, G1–G5 y G7). | Decidido por Matías (22/11), salvo el retiro de D4 y el ajuste de C09 (propuestos por IA) |
| Importes | Sin cambios: 600.000 a 900.000 por mes por unidad. Son ficticios y el README lo dice. | Matías los revisó y los consideró plausibles (22/11) |
| Tipo del dinero | `Centavos` pasa de alias de `number` a número con marca, con constructor que valida; la búsqueda con grep queda de respaldo. | Propuesto por IA |
| Nombre | «Tablero de cobranzas» (el repositorio conserva `demo-tablero-gestion`). | Propuesto por IA |
| Documentos | Se quitan los vínculos con documentos que no están en este repositorio; `CLAUDE.md` y este registro quedan en neutro; las copias de la Demo 2 no citan commits hasta que la Demo 2 sea pública (y la Demo 3 no se publica antes); README de una pantalla; estimación gruesa (unas 35 h, entre 30 y 40) en lugar de un rango falso de precisión; una línea que explica la matriz de zonas horarias. | Propuesto por IA |

**Números.** Los del resultado esperado anterior (mora 2.964.500,00, ranking, tramos) **se retiraron**: dependían de los trucos
del generador. En su lugar, los fixtures tienen números exactos que un script aparte (fuera del repositorio) recalculó y
coincidieron: T12 (mora 2.238.500,00 en 6 comprobantes y 4 clientes; saldo 2.541.000,00; tramos 242.000,00 / 665.500,00 /
726.000,00 / 605.000,00 y no vencido 302.500,00; 88,1 %), T09 (−500.000,00 sin IVA y −605.000,00 con IVA), T10 (210,11 por
factura, 630,33 en el mes, 3.631,83 con IVA) y T11 (33,4 / 33,3 / 33,3). Los porcentajes de M3 del ranking de ejemplo (44,9 /
24,5 / 12,3 / 12,2 / 6,1) también coinciden.

**Verificación.** Revisión de coherencia numérica de `diseno.md` con el script, y búsqueda de nombres de empresas, correos, rutas de
otros repositorios y términos internos en `CLAUDE.md`, `README.md` y `docs/` (salvo `diseno-ui.md`, que se rehace en paralelo): sin
resultados.

**Queda para E4.** Calcular con el generador real y la semilla 20261118 los valores marcados «se fija en E4» (`diseno.md`,
5.4): mora, tramos, saldo, % de mora, ranking, facturación y cobranza de octubre, y la huella. Confirmar que C05 es el cliente con
más mora y T12-d91 su comprobante más atrasado, que hay más de cinco deudores y que los pagos a cuenta (50.000,00) y saldos a favor
(58.000,00) son los esperados; si no, se ajusta la historia del recorrido o los importes de los casos.

**Sin hacer.** Alinear `diseno-ui.md` con estos cambios (el diseñador, en paralelo): sin renglón de control ni sello, sin D4 ni
el anuncio «la suma no cambia», 13 clientes, cifras ilustrativas reales (a fijar en E4), recorrido sin la miga. E1 en adelante.
Pendientes de decisión de Matías: mover las decisiones H a un documento corto, sacar `iva-mes` y `agrupar=no` del catálogo,
subir los días promedio de cobro o la exportación a CSV, y reducir aún más la tabla de reglas.

**Próxima acción.** Que Matías revise estos ajustes y que `diseno-ui.md` quede alineado; después E1 (proyecto y piezas copiadas de
la Demo 2, con `docs/procedencia.md`).

## 22/11/2026 (cuarta parte) — Etapa E1: proyecto y piezas copiadas (propuesto por IA)

**Qué se hizo.** Se armó el proyecto (`package.json` con las versiones exactas de la Demo 2 y su `package-lock.json` sin `fake-indexeddb`, TypeScript
estricto, Vite y Svelte 5, Vitest con la zona horaria lejana por defecto), se copiaron las piezas de la lista del plan desde lo commiteado de la rama de
trabajo de la Demo 2 (no de los archivos del disco) y se escribió `docs/procedencia.md` con cada archivo, su origen y sus cambios (columna del
commit "pendiente de publicar la Demo 2"). `index.html` y `App.svelte` son una página vacía con el sprite de 12 íconos.

**Versiones (iguales a la Demo 2).** `svelte` 5.57.3 (única dependencia de producción); en desarrollo: `@sveltejs/vite-plugin-svelte` 7.3.1,
`svelte-check` 4.7.8, `typescript` 6.0.3, `vite` 8.3.5, `vitest` 5.1.0. El lockfile es el de la Demo 2 sin `fake-indexeddb`: las demás versiones,
transitivas incluidas, son idénticas. **No** se agregó `@playwright/test` (decisión 7: GitHub Actions no corre).

**Verificación (local).**

| Qué | Resultado |
| --- | --- |
| `npm ci` (y `npm ci --ignore-scripts`, como en el CI) | Limpio, 62 paquetes. |
| `npm audit --audit-level=high` | 0 vulnerabilidades. |
| `npm run check` | 0 errores, 0 advertencias. |
| `npm test` (TZ por defecto Asia/Tokyo) | 8 archivos, 87 tests en verde. |
| `npm run test:tz` | 87 tests en verde en UTC, Asia/Tokyo y America/Los_Angeles. |
| `npm run buscar` | Sin hallazgos (13 reglas). Con un `toFixed` plantado en `src/lib/dominio/` falla con el archivo y la línea; sin él pasa. |
| `npm run contraste` | 148 mediciones, 0 fallan, 6 justas (< 0,3 sobre el mínimo). Los valores coinciden con la tabla de `diseno-ui.md` 3.3. |
| `npm run build` | Sin errores. |
| Tamaño de la página vacía | JS 22.958 bytes (9,3 KB gzip), CSS 6.012 bytes (2,3 KB gzip). Tope del JS: 100 KB gzip. |
| Tamaño con todos los componentes copiados montados | JS 51,4 KB (19,6 KB gzip), CSS 14,5 KB (4,0 KB gzip). |
| CSP en el navegador (Chrome, `dist/` servido con `public/_headers` en el puerto 4740) | Con un componente temporal que monta Aviso, Boton, Dialogo, Etiqueta y Panel con `style:` dinámico: sin violaciones ni mensajes en la consola; el diálogo abre con el foco en el título, bloquea el fondo y Esc lo cierra. El componente temporal se borró y el servidor se apagó. |

**Hallazgo: el `style="…"` plantado no da violación.** El paso 1.5 pedía un `style="…"` plantado que diera violación como prueba de que la CSP está
activa. Medido: en Svelte 5 y Chrome un `style="…"` en el marcado, estático o con valores dinámicos, **no** da violación (se clona desde una
plantilla o se asigna por CSSOM). La CSP sí está activa: `setAttribute("style")` e `innerHTML` con `style` dan `style-src-attr`, un `<style>` inyectado
da `style-src-elem`, un `<script>` inyectado da `script-src-elem` y `fetch` falla (`connect-src`). Se documentó como S6 en `stack.md` y se corrigió
la regla 1 de la sección 3. La Demo 2 afirma lo contrario en su `stack.md`: conviene revisarlo allá.

**GitHub Actions.** `ci.yml` está escrito con los mismos pasos que el de la Demo 2 y dice en su cabecera que **nunca corrió**; el README y esta
entrada no afirman que corra. Pendiente (decisión 7, antes de E8): resolver la facturación o fijar a mano la verificación local como la oficial.

**Decisiones propias (propuestas por IA).** S6 (lo de arriba). S7: el enrutador no se copia, se escribe en E5. S8: las reglas de código van en
`scripts/reglas-codigo.mjs` con tests (cada llamada prohibida se planta), para cumplir el criterio de 1.4. Se redibujaron los íconos `marca`
(regla en cuatro tramos con una línea sobre el tercero, como pide 5.15), `chevron-izq` y `chevron-der` (idéntico a `chevron`, que 5.15 también lista).
Se quitó de `Boton`, `Dialogo`, `Etiqueta` y `Aviso` lo que solo servía a la Demo 2 (peligro, cambios sin guardar, variante texto, aviso de dos
renglones). `new Date(` queda prohibido en todo `src/lib` y `Date.now` en todo `src`. Los identificadores T1 a T7 de los tests de fechas pasaron a nombres
descriptivos porque acá T01 a T17 son casos.

**Queda para E2 y E5.** E2: `dinero.ts` (`Centavos`) y siguientes; `tipos.ts` solo tiene `FechaCivil`. E5: el enrutador con TDD (S7);
`Etiqueta` con marca opcional (muestra de tramo, o sin marca) y todos los textos del marco en `textos-marco.ts` (hoy solo tres); los pares de contraste se
vuelven a medir sobre lo maquetado; `i-chevron-der` e `i-chevron` son iguales (decidir si sobra uno). Antes de publicar: citar los commits de la Demo 2 en
`procedencia.md`; la Demo 2 tiene que ser pública primero.

**Próxima acción.** E2 (paso 2.1: `dominio/dinero.ts` con TDD: M1 a M4, y revisión de M2 y M3 con `revisor-codigo`).


## 22/11/2026 (quinta parte) — Etapa E2: dinero, comprobantes y recibos (propuesto por IA)

**Qué se hizo.** Los pasos 2.1 a 2.4 del plan con TDD (primero el test, visto fallar; después el código mínimo): `dominio/dinero.ts` (M1 a M4),
`dominio/comprobantes.ts` (C1, C2, C4, C5), `dominio/validadores.ts` (C2, C3, R1, R3 y de G5 lo que no es de rango, más C4), la función `armarDatos` y los
once fixtures de `diseno.md` 5.5 (T01, T03, T09 a T16 y R4) en `tests/fixtures/`. `tipos.ts` suma el modelo de la sección 4 (sin `Medida` ni `Partida`, que llegan
con el catálogo en E3). **No se copió nada de la Demo 2.** No se sumó ninguna dependencia.

**Tests: 87 antes, 276 después (+189), en 13 archivos.**

| Archivo | Tests | Qué cubre |
| --- | --- | --- |
| `tests/dinero.test.ts` | 67 | M1 (26: constructor, tope, `-0`, `sumar`/`restar`/`negar`, formato, test de tipos con `@ts-expect-error`), M2 (15: cada borde de la tabla como test propio, más 5.000 netos contra un cálculo aparte en BigInt), M3 (18: T11 en los dos órdenes de entrada, la tabla de cinco importes, desempate por importe y por nombre, total 0, negativo, propiedad de 500 casos, `porcentaje` con la mitad hacia arriba), M4 (8) |
| `tests/comprobantes.test.ts` | 39 | C1 (T01, T16), C4 (los cuatro vencimientos, NC, ND), C5 (T09, T13), formato de ids, numeración de comprobantes y de recibos con su desempate (H23) |
| `tests/armar-datos.test.ts` | 10 | `armarDatos`, los 13 clientes de 5.1 con CUIT ficticio de dígito válido |
| `tests/fixtures.test.ts` | 21 | Los once fixtures: importes, vencimientos, atrasos como días entre fechas, facturación por mes, T11 con M3 |
| `tests/validadores.test.ts` | 52 | Cada caso válido y cada rechazado de C2, C3, R1 y R3 de la tabla, más G5 y C4; los once fixtures pasan `validarDatos` sin problemas |

**Verificación (local).**

| Qué | Resultado |
| --- | --- |
| `npm run check` | 0 errores, 0 advertencias (204 archivos). Los `@ts-expect-error` de M1 son errores de tipo de verdad: `tsc` lo exige. |
| `npm test` | 13 archivos, 276 tests en verde. |
| `npm run test:tz` | 276 en verde en UTC, Asia/Tokyo y America/Los_Angeles. |
| `npm run buscar` | Sin hallazgos (13 reglas, 63 archivos): ni `parseFloat`, `toFixed`, `Math.round` ni `Number(` en `src/lib/dominio` (salvo `fechas.ts`). |
| `npm run build` | Sin errores; tamaño igual al de E1 (la lógica nueva todavía no la importa la interfaz). |
| Búsqueda literal de los nombres de terceros y de los correos personales prohibidos (sin `node_modules`, `dist` ni `.git`), además de la de huellas de `npm run buscar` | 0 coincidencias. |
| `npm audit` | No se corrió: no cambió ninguna dependencia. |

**Mutaciones a mano (no quedan en el repositorio).** Para ver que los tests muerden, se rompió una línea por vez y se confirmó que algún test fallaba: el `+ 50` de M2
(`+ 49`), el desempate por importe y el de nombre de M3, `faltan` en M3, el redondeo de `porcentaje`, el orden por cliente y por primer comprobante de
la numeración, el signo de la NC y su vencimiento, y once más en el validador (orden de hechos del mismo día, `>` por `>=`, el orden por fecha de C2, la
correlatividad desde 1, el a cuenta negativo, NC anterior a su factura, otro cliente, NC a una no factura, imputar a un comprobante posterior, neto < 1, C4). **Una sobrevivió** (que el cobro que
se pasa no se descuente): se agregó el test que la mata.

**Decisiones propias (propuestas por IA), en `diseno.md` 11.4 (H27 a H35).** `sumar` variádico y `sumarLista`, y lanza con una suma parcial que pase el tope; porcentaje con espacio duro
antes del `%`; `rankingConOtros` en lugar de `otros`; la numeración vive en `comprobantes.ts` (la usan `armarDatos` y usará el generador); el validador recorre los saldos por su
cuenta en el orden de la cuenta corriente y no descuenta el hecho que se pasa; NC anterior a su factura o asociada a una no factura se rechaza; `validarDatos` suma C4; `parseInt` sobre
dígitos validados para leer `R-0003-00000045`; los fixtures usan los 13 clientes de 5.1 escritos en `armarDatos.ts`.

**Desvíos del plan.** (1) M5 queda para E3 (el plan ya decía «después, con el catálogo»). (2) El paso 2.4 se hizo antes que el 2.3, porque los tests de los validadores necesitan
datos de base, y la numeración (C2) se escribió en 2.2. (3) **La revisión de M2 y M3 por `revisor-codigo` está pendiente**: el plan la pide antes de seguir y no se avanzó a E3. (4) Los
tests de C5 con T09 y T13 se escribieron primero con comprobantes a mano (en 2.2) y después se repitieron con los fixtures (2.4).

**Preguntas abiertas (para Matías o para la revisión; ninguna bloquea).**
1. **Espacio antes del `%`.** `diseno.md` escribe «33,3 %» sin decir qué espacio (M1 sí lo dice para el `$`). Se eligió el espacio duro (U+00A0) para que cifra y signo no se partan al envolver
   la línea; si se prefiere uno común, es una línea en `formatearPorcentaje` y sus tests (H28).
2. **R1 y un recibo sin medios.** La tabla pide importes ≥ 1 pero no que haya al menos un medio; un recibo vacío (sin medios ni imputaciones) hoy es válido. ¿Se rechaza?
3. **C3 va un poco más allá de la tabla** (H32): rechaza una NC con fecha anterior a su factura y una NC o ND asociada a una nota (no a una factura). Los datos del generador no los producen; si el diseño
   los quería permitidos, se quita.
4. **El mismo día, ¿quién entra primero?** C3 y R3 comparan con «el saldo a la fecha»; el mismo día se usó el orden de la cuenta corriente de 4.1 (primero los comprobantes, después los recibos). Con
   ese orden, una NC y un cobro del mismo día que juntos suman exactamente la factura son válidos (H31).
5. **Clientes de los fixtures duplicados.** `tests/fixtures/armarDatos.ts` repite razón social y plazo de la tabla 5.1 hasta que exista `datos/clientes.ts` (E4); conviene un test que compare ambos.
6. **T10 y T15 dicen «un cliente»:** se usó C04 en los dos (no entra en ningún otro caso).

**Archivos que `revisor-codigo` tiene que mirar para M2 y M3.** `src/lib/dominio/dinero.ts` (`calcularIva`, `totalConIva`, `porcentajes`, `porcentaje`, `formatearPorcentaje`, `rankingConOtros`,
`divisionEntera`) y `tests/dinero.test.ts` (describes de M2, M3 y M4).

**Próxima acción.** Que `revisor-codigo` revise M2 y M3 (los dos archivos de arriba) y, con sus hallazgos resueltos, arrancar E3 con el paso 3.1 (`dominio/corte.ts`: S1 a S3, S5 a S7, R4, cuenta corriente), que
usa `existeAlCorte`, los ids de `comprobantes.ts` y los fixtures de `tests/fixtures/casos.ts`.


## 22/11/2026 (sexta parte) — Correcciones de la revisión de E2 y etapa E3: corte, mora, antigüedad y desglose (propuesto por IA)

**Qué se hizo.** En dos tramos, con TDD (primero el test, visto fallar; después el código mínimo). **Tramo 1:** las correcciones del informe de `revisor-codigo` sobre E2
(informe interno, no publicado), con las cuatro decisiones del hilo principal (R1, C3, el orden del mismo día y `sumar`).
**Tramo 2:** los pasos 3.1 a 3.5 del plan: `corte.ts`, `antiguedad.ts`, `agregados.ts` y `partidas.ts` (los dos caminos de cada cifra, por separado), `medidas.ts`
y `controles.ts`, y la propiedad de D2 y D3 con las tres mutaciones plantadas. No se sumó ninguna dependencia ni se copió nada de la Demo 2 (`fechas.ts` ganó `sumarMeses`).

### Tramo 1: hallazgos de la revisión de E2

| Hallazgo | Estado | Qué se hizo |
| --- | --- | --- |
| **M-1** «mayor resto» sin test | Hecho | `[1999, 1001]` → `[666, 334]`, `[5, 5, 1, 1, 1, 1]` → `[357, 357, 72, 72, 71, 71]` y, en la propiedad de 500 casos, «quien recibe +1 tiene un resto mayor o igual que quien no» (resto en BigInt). **Las dos mutaciones del informe ahora fallan** (ordenar solo por importe: 3 tests; por importe y después por resto: 3 tests) y la reescritura de `porcentajes` también las mata (3 y 5). |
| **M-2** `porcentaje` y `formatearPorcentaje` | Hecho | `porcentaje` lanza con `total` negativo; `formatearPorcentaje` lanza con milésimas negativas, con decimales, `NaN` o infinito. Un test para cada uno. |
| B-1 los validadores lanzan | Hecho | R1 informa (no lanza) con importes que no son enteros, con sumas que pasan el tope y con un recibo dañado; C4 informa un cliente con plazo inválido (G5, con el id del cliente); el cálculo de saldos de C3 y R3 ignora los importes dañados que ya nombran R1 o G5. |
| B-2 «fuera de orden» | Hecho | Se compara con la fecha mayor vista hasta ese número: con fechas 1, 2, 3, 4, 3, 3 se informan el 5 y el 6. |
| B-3 `porcentajes` ilegible | Hecho | Arreglo de objetos `{ indice, nombre, importe, piso, resto }`; desaparecieron los `?? 0`. |
| B-4 `maximo` de `rankingConOtros` | Hecho | Lanza si no es un entero de 1 o más. |
| B-5 `sumar` con suma parcial | Hecho | Test `[TOPE, 1, −1]` lanza y `[TOPE, −1, 1]` da `TOPE`; el comentario de `sumar` lo dice (decisión: se mantiene, H42). |
| B-6 `parseInt` | Hecho | `leerIdRecibo` en `comprobantes.ts` (con test de ida y vuelta y de lo hostil); `parseInt` prohibido en `src/lib/dominio` en `buscar-prohibidos` con la excepción de ese solo archivo (la regla tiene su test). |
| B-7 un cast y dos valores por defecto | Hecho | `fechas: [string, string][]`; `obtener(mapa, clave, qué)` lanza un error interno si falta lo que ya se validó. |
| B-8 desempate de recibos | Hecho | Id menor entre los comprobantes imputados (no el primero de la lista); el recibo conserva sus imputaciones en el orden escrito. |
| B-9 independencia del validador | Hecho | La cabecera de `validadores.ts` dice que la independencia es solo de los saldos. |
| B-10 duplicación | Hecho | `pesos`, `NB` y `MENOS` en un solo lugar de los tests (`armarDatos.ts` y `tests/fixtures/formato.ts`); `comparar` compartido; sin el alias `dinero`; sin los desempates de índice (el `sort` es estable). |
| B-11 U+00A0 literal | Hecho | `ESPACIO_DURO = " "` con nombre. |
| **B-12** tipos sin marca (`Milesimas`, `FechaCivil`) | **No se hizo** | Es una sugerencia del propio informe («no deuda»). Marcar `Milesimas` obligaría a un constructor y a un cast en cada literal de los tests, y el hueco que abría (M-2) ya lo cierra el chequeo en `formatearPorcentaje`. Queda para decidir si se quiere. |

Decisiones del hilo principal aplicadas: **R1** rechaza el recibo sin medios ni imputaciones (H36, con su test); **C3** se mantiene conservador y H32 pasó a la fila C3 de `diseno.md`, con la asimetría de la ND (una ND anterior a su factura se acepta: test); el orden del mismo día en C3 y R3 se dejó; `sumar` se mantiene. Detalle en `diseno.md`, 11.5 (H36 a H42).

### Tramo 2: E3

**Tests: 276 antes (los de E2), 300 al cerrar el tramo 1 y 893 al cerrar E3, en 23 archivos.** Los 893 cuentan cada fila de la tabla de resultados esperados dos veces (una por camino) y las 50 semillas
de la propiedad una por una, para que un fallo diga qué semilla es.

| Archivo | Tests | Qué cubre |
| --- | --- | --- |
| `tests/corte.test.ts` | 54 | S5 (las ocho direcciones y los bordes), S1 (T05, T14), S2 (T01, T02, T17), S3 (T03, T04), S6, S7, R4 (fixture R4, T07, `S` = 100.000,00 y `A` = 150.000,00, borde de 1 centavo), cuenta corriente (D3: 242.000,00 → 92.000,00; orden del mismo día) |
| `tests/antiguedad.test.ts` | 16 | A1: cada borde (0, 1, 30, 31, 60, 61, 90, 91, ±400) con el fixture T12 y la propiedad −400…400 |
| `tests/agregados.test.ts` | 133 | El camino por agregación contra la tabla de esperados (`tests/fixtures/esperados.ts`, 120 filas escritas a mano desde `diseno.md`); `agregados.ts` no importa `partidas.ts` ni `corte.ts` (un test lee las importaciones); `mora-otros` (M4) |
| `tests/partidas.test.ts` | 136 | El camino por listado contra la misma tabla; D1 (6 partidas, 223.850.000 centavos, 4 clientes), notas, orden, retenciones, a cuenta |
| `tests/medidas.test.ts` | 41 | M5 (las 16 claves), D1, filtros `cliente` y `mes`, `docesMeses`, `controlar` y `ErrorDeCierre`, `porCliente` con la guarda de H25 |
| `tests/controles.test.ts` | 37 | X1 a X6 sin fallar en los fixtures y en los 22 cierres, y **cada uno fallando** con una medida alterada a propósito |
| `tests/propiedad-cierre.test.ts` | 101 | 50 semillas × 22 cierres × 15 claves × empresa y 13 clientes (+ `mora-otros` y los doce meses de las cinco medidas del mes): `controlar` no lanza |
| `tests/propiedad-cierre-cruzados.test.ts` | 50 | 50 semillas × 22 cierres: X1 a X6 cierran |
| `tests/mutaciones-d2.test.ts` | 14 | Las tres mutaciones plantadas (abajo) y un dato dañado a mano (NC mayor que el saldo) |
| `tests/textos.test.ts` | 9 | Nombre del mes, notas y las 16 fórmulas |

**Verificación (local, 22/11/2026).**

| Qué | Resultado |
| --- | --- |
| `npm run check` | 0 errores y 0 advertencias (226 archivos) |
| `npm test` | 23 archivos, 893 tests en verde |
| `npm run test:tz` | 893 en verde en UTC, Asia/Tokyo y America/Los_Angeles |
| `npm run buscar` | Sin hallazgos (14 reglas, 85 archivos; la regla nueva de `parseInt` incluida) |
| `npm run build` | Sin errores; el tamaño no cambia (la interfaz todavía no importa el dominio nuevo) |
| Búsqueda literal de nombres de terceros, correos personales y rutas personales (sin `node_modules`, `dist` ni `.git`) | 0 coincidencias |
| `npm audit` | No se corrió: no cambió ninguna dependencia |

**Las tres mutaciones plantadas de D2 (paso 3.5).** Cada una se prueba con el fixture T12 y con tres semillas del generador provisional (`tests/mutaciones-d2.test.ts`):

| Mutación | Qué lo detecta |
| --- | --- |
| (a) 1 centavo de más en una partida del tramo 31–60 (camino por listado) | `controlar` lanza `ErrorDeCierre` con la clave `tramo-31-60` y diferencia −1 |
| (b) 1 centavo de más en el `valor` de ese tramo (camino por agregación) | `controlar` lanza (diferencia +1) y fallan **X1 y X2** (también X3). Sin la mutación todo cierra. |
| (c) un saldo mal calculado en S2 (se olvidan las NC) sin tocar la agregación | `controlar` lanza en `saldo`, `mora`, `tramo-mas-90` y `saldo-neto`; con T01 al 31/05 la agregación da 0 y las partidas 605.000,00 |

Además se plantó cada error en el **código fuente** y se corrió la propiedad (D2 y D3), para ver que el test la detecta de verdad: olvidar las NC en `corte.ts` (falla en 49 tests), correr un día
la ventana de un tramo en `agregados.ts` (100), contar las retenciones al revés (50), sacar las retenciones del a cuenta de un recibo (100) y clasificar mal el saldo a favor (50). Tres sobrevivieron
la primera vez: dos mostraron huecos del generador provisional (un recibo con retención que deja saldo a cuenta, y un cliente que termina con saldo 0 y un a cuenta), se cubrieron y ahora mueren; la tercera es sacar `fecha <= corte` de las medidas del mes,
que la propiedad no puede ver porque solo mira cierres de mes (no hay nada posterior dentro del mes) y que cubren los tests con cortes a mitad de mes (T02 al 01/10, T14).
En las otras suites (`corte`, `antiguedad`, `agregados`, `partidas`, `medidas`, `controles`) se probaron unas 105 mutaciones puntuales con un script aparte (no queda en el repositorio); sobrevivieron 10: siete eran huecos reales y se cubrieron
(el día del corte, un recibo sin a cuenta, un deudor con mora 0, un recibo de otro cliente, el mes del corte, un valor positivo con un cliente en negativo, el borde `S` = 1 centavo). **Quedan tres equivalentes, a propósito:** el desempate «comprobantes antes que recibos» en la cuenta corriente y en el orden de las partidas
(el id ya ordena `1-`, `2-`, `3-` antes que `R-`) y `m.valor > 0` en `porCliente` (con valor 0 todos los subtotales son 0 y `porcentajes` ya devuelve «—»); se dejan escritos porque lo piden `diseno.md` (4.1 y H25).

**Tiempo del test de propiedad (G7 aparte).** 50 semillas × 22 cierres: D2 (con la validación de las 50 semillas) 10 a 15 s, D3 10 a 15 s, según cuánto compita la máquina (la suma llegó una vez a unos 30 s, la mejor a 21 s). Por eso la propiedad está en **dos archivos**, que Vitest corre en paralelo: el tiempo de reloj
de las dos juntas es de 11 a 18 s. **No se bajó de 50 semillas**: el plan lo pide si el test pasa de 30 s en CI, y GitHub Actions nunca corrió (decisión 7 pendiente), así que no hay una medición de CI. Si en CI pasa de 30 s, se cambia `SEMILLAS` (hoy 50) en los dos archivos
a 20 allá y se anota. Un dato de costo: cada semilla recalcula ~6.000 medidas (los dos caminos) en unos 250 ms, o sea unos 40 µs por medida.

**Decisiones propias (propuestas por IA), en `diseno.md` 11.6 (H43 a H54).** `resolverCorte` acepta una lista (el parámetro repetido) y devuelve `{ corte, aviso }`; el saldo de una NC o de un comprobante posterior al corte es 0; el a cuenta se clasifica con `S > 0`;
`medida()` lanza con filtros inválidos y guarda el `mes` resuelto; la mora por agregación es una sola ventana (así X2 compara dos cuentas distintas); orden y notas de las partidas; los controles cruzados usan los `valor` y devuelven la lista de fallos, y X4 cruza además la
posición del cliente de `corte.ts`; `docesMeses(corte, desde)`; `porCliente` lleva la guarda de H25; el proveedor de saldos inyectable para plantar la mutación (c); los casos de 5.3 como fixtures chicos y la propiedad con un generador provisional de los tests; `sumarMeses` en `fechas.ts`.

**Desvíos del plan.** (1) M5 se hizo con el catálogo (3.4). (2) Aparecieron `claves.ts` y `textos.ts` (títulos, fórmulas, notas); el diseño ya listaba `textos.ts`. (3) La propiedad se partió en dos archivos. (4) Los fixtures T02, T04, T05, T07, T08 y T17 son chicos, porque la semilla llega en E4. (5) **La revisión de `revisor-codigo` sobre E3 está pendiente**: no se avanza a E4 antes (el plan lo pide para 3.1).

**Preguntas abiertas (para Matías o para la revisión; ninguna bloquea).** Cada una se resolvió con la lectura conservadora y está en `diseno.md` 11.6.
1. **`S` negativo.** R4 no dice qué hacer con un cliente con `S < 0` (C3 y R3 lo impiden). Se lee como «no debe nada» (saldo a favor). ¿Alcanza, o conviene que el dominio lance?
2. **Saldo de un comprobante que no existe al corte.** `saldoAlCorte` da 0 (S1) y no lanza; la vista Comprobante tiene que mirar `existeAlCorte` antes para mostrar el aviso de H10. Si se prefiere que lance, es una línea.
3. **NC asociada a una ND.** Los validadores la rechazan (H32); por agregación, una NC así se ubicaría en la ventana del vencimiento de la ND, y por listado le bajaría el saldo a la ND. Los dos caminos coinciden, así que no se vería en un control; si el diseño la quisiera permitida hay que escribirlo.
4. **Retenciones en `retenciones-mes` y `cobranza-mes` de un recibo con a cuenta.** El recibo cuenta entero (todos sus medios) en la cobranza del mes; no se separa la parte imputada de la que queda a cuenta. Es lo que dice R2.
5. **Notas y títulos.** «Antigüedad: 31–60 días» (título de cada tramo), «N días de atraso» / «Vence el dd/mm/aaaa» y «Retención IIBB $ 25.000,00 y Ganancias $ 15.000,00» son redacción propia: el `redactor-ux` puede cambiarlos (están todos en `textos.ts`).
6. **X6 y X3.** X6 es solo de la empresa y X3 recorre las 11 claves que dice D3 (no incluye `pagos-a-cuenta`, `saldos-a-favor` ni `saldo-neto`, que cubre X4). ¿Se quiere más amplio? Cuesta tiempo de test.
7. **Las 50 semillas en CI** (ver el tiempo de arriba), a decidir cuando se resuelva la decisión 7.

**Archivos que `revisor-codigo` tiene que mirar en E3.** `src/lib/dominio/corte.ts` (el corazón: S1, S2, S3, S5, R4 y la cuenta corriente; el plan lo pide con lupa), `src/lib/dominio/agregados.ts` y `src/lib/dominio/partidas.ts` (que de verdad no compartan cuentas: `agregados.ts`
no importa `partidas.ts` ni `corte.ts`; las ventanas de vencimiento de cada tramo; la regla de clasificación de R4 escrita dos veces), `src/lib/dominio/medidas.ts` (`normalizarFiltro`, `porCliente`, `ErrorDeCierre`), `src/lib/dominio/controles.ts` (que cada control compare dos cuentas
distintas), `src/lib/dominio/textos.ts`, `tests/fixtures/esperados.ts` (la tabla de números escritos a mano: conviene recalcular algunas filas aparte) y `tests/mutaciones-d2.test.ts`. De las correcciones de E2: `validadores.ts` (la lógica nueva de informar en vez de lanzar) y `comprobantes.ts` (`leerIdRecibo`, desempate).

**Próxima acción.** Que `revisor-codigo` revise los archivos de arriba y, con sus hallazgos resueltos, arrancar E4 con el paso 4.1 (`datos/huella.ts`: FNV-1a 32 y JSON canónico con los tres vectores de G1). En E4 los fixtures de 5.3 se repiten sobre la semilla y `tests/fixtures/clientes` se compara con
`datos/clientes.ts` (H35).


## 22/11/2026 (séptima parte) — Correcciones de la revisión de E3 y etapa E4: generador, casos plantados, huella y resultado de referencia (propuesto por IA)

**Qué se hizo.** En dos tramos, con TDD (test visto fallar, código mínimo; donde el hueco era de cobertura, la mutación que antes sobrevivía y ahora muere). **Tramo 1:** las correcciones del informe de `revisor-codigo` sobre E3
(informe interno, no publicado), con las respuestas del hilo principal a las cuatro preguntas abiertas. **Tramo 2:** los pasos 4.1 a 4.5 del plan:
huella, clientes, plantados, generador, resultado de referencia y medición. No se sumó ninguna dependencia ni se copió nada de otro proyecto.

**Tests: 893 antes (E3), 1014 al cerrar el tramo 1 y 1429 al cerrar E4, en 37 archivos** (antes 23). La suite entera tarda 17 s (y `npm run test:tz`, tres pasadas de 19 s).

### Tramo 1: hallazgos de la revisión de E3

| Hallazgo | Estado | Qué se hizo |
| --- | --- | --- |
| **M-1** `retencion-iva` sin test | Hecho | Fixture con retención de IVA (`fixtureRetencionIva`) y sus tres filas esperadas; tabla de verdad de los cinco medios y un test por medio en los dos caminos (`tests/claves.test.ts`); `ES_RETENCION: Record<Medio, boolean>` obliga al compilador a clasificar cada medio. La mutación del informe, hecha de nuevo, hace fallar 7 tests (antes, ninguno). |
| **M-2** test de independencia | Hecho | `tests/independencia.test.ts` lee el grafo completo (importaciones en varias líneas, `export from`, sin nombres, dinámicas; las dos direcciones; transitivo) y fija **qué comparten los dos caminos**: `dinero`, `fechas` y `tipos` (utilidades), `antiguedad` (límites de A1, cruzados por `antiguedad.test.ts`) y `claves` (R2, probada con números). Las seis mutaciones (las dos del informe y cuatro transitivas) mueren; con el test viejo sobrevivían dos y las transitivas no se veían. |
| Pregunta 1: `S` negativo | Se deja | Decisión del 22/11 (H57). |
| Pregunta 2: `saldoAlCorte` de un posterior da 0 | Se deja | Decisión del 22/11 (H58); el test de vista de E6 (aviso de H10, no «saldado») quedó anotado en `docs/plan.md`, paso 6.3. |
| Pregunta 3: NC asociada a ND | Hecho | `datos/cargar.ts`: `cargarDatos` llama a `validarDatos` una vez y, si hay problemas, devuelve `{ estado: "error", problemas, mensaje }` sin los datos (H60). El test arma el dato dañado y comprueba que ni `controlar` ni X1 a X6 lo ven. |
| Pregunta 4 y **B-1**: cruce de X4 | Hecho | La posición entra a `controlesCruzados` por un parámetro (`PosicionDe`); un test altera cada uno de los cinco campos y las cinco comparaciones están entre las mutaciones (mueren). Se sumó la comparación de A (lo cobrado sin imputar). |
| **B-2** subtotal 0 en `porCliente` | Hecho | Test con una factura y su NC total junto a otro cliente en 100.000,00: milésimas `[1000, 0]`. |
| **B-3** nombre inventado | Hecho | `porCliente` lanza nombrando al cliente que no está en los datos. |
| **B-4** X3 y sus claves | Hecho | `CLAVES_DEL_X3` exportada; un test por cada una de las 12 claves. |
| **B-5** `medida()` con corte anterior a `desde` | Hecho (H56) | Sin `mes`, rige el del corte sea cual sea (cualquier fecha civil válida, H18); con `mes` dado, el error lo dice en llano. |
| **B-6** documentación | Hecho | X3 tiene 12 claves (H49), `saldo-neto` es `S − A` (4.2.1, H55) y la cabecera de `controles.ts` y `diseno.md` dicen que **solo X4 contrasta dos cuentas distintas**; X1, X2, X3, X5 y X6 comparan dos usos de la misma agregación. (Las entradas anteriores de este registro conservan su texto de entonces.) |
| **B-7** duplicación | Hecho | `exigirCorte` vive en `fechas.ts` (tres copias menos); `CATALOGO` es un literal con las 16 claves, sin `as`. |
| **B-8** datos mutables | Hecho | `congelar` a fondo (`datos/congelar.ts`); `cargar` y `armarDatos` lo usan (la suite entera pasa con los fixtures congelados: ningún test mutaba). |
| **B-9** `medida` + `controlar` | Hecho | `medidaControlada`: la puerta de la interfaz. |
| **B-10** mutaciones fuera del repo | Hecho | `scripts/mutaciones.mjs` (`npm run mutaciones`, sin dependencias) y `scripts/mutaciones.json`: **60 mutaciones**; un test vigila que la cadena de cada una aparezca exactamente una vez en su archivo (si no, «mueren» por error). Resultado: las 60 mueren. |
| **B-11** formato del mensaje | Hecho | La diferencia sale con el formato de M1 (`−$ 0,01`). |
| «De paso»: propiedades una sola vez en `test:tz` | **No se hizo** | Cada pasada tarda 19 s; con tres, un minuto. Excluir archivos por zona complica `test-tz.mjs` para ahorrar 40 s. Si CI llega a pasar de 30 s por pasada, se retoma. |
| «De paso»: el generador provisional | Hecho | Emite retención de IVA; las propiedades D2 y D3 se repitieron sobre el generador real (H76). |

### Tramo 2: E4

| Paso | Archivos | Qué cubre |
| --- | --- | --- |
| 4.1 | `datos/huella.ts`, `tests/huella.test.ts` (8) | FNV-1a 32 con los tres vectores de G1 y dos de UTF-8 calculados aparte (BigInt); JSON canónico en el orden de las interfaces. |
| 4.2 | `datos/clientes.ts`, `plantados.ts`, `constantes.ts`, `pesos.ts`; `tests/clientes.test.ts` (9), `plantados.test.ts` (23) | Los 13 clientes de 5.1 (con el test que los compara con los de `tests/fixtures/armarDatos.ts`, H35), CUIT del azar con verificador, y la tabla 5.3 como constantes (un test por caso con sus importes y fechas). |
| 4.3 | `datos/generador.ts`, `tests/generador.test.ts` (159) | G1 (misma huella, **fijada: `1d0dd05f`**), G2 y G5 sobre 50 semillas, G4, y las reglas del relleno. |
| 4.4 | `datos/esperado.ts`, `scripts/oraculo.mjs`, `scripts/referencia.mjs`; `tests/referencia.test.ts` (85), `oraculo.test.ts` (9) | La prueba de referencia G3 y el oráculo independiente. |
| 4.5 | `scripts/medir.mjs`, `tests/rendimiento.test.ts` (3) | G7. |
| H60, H76 | `datos/cargar.ts`, `tests/cargar.test.ts` (5), `tests/propiedad-cierre-real.test.ts`, `tests/propiedad-cierre-cruzados-real.test.ts` (100) | El punto de carga y las propiedades sobre el generador real. |

**La semilla publicada.** Semilla `20261118`, **huella `1d0dd05f`** (720 comprobantes, 642 recibos; 16 casos plantados). El resultado de referencia se fijó **después de generar**, con el oráculo (`scripts/oraculo.mjs`, que no importa nada del dominio y que a su vez se probó contra los números escritos a mano de los fixtures) y se verificó con los dos caminos y `controlar`, con X1 a X6 en los 22 cierres y con un reparto de milésimas calculado aparte con BigInt. Las cifras están en `src/lib/datos/esperado.ts` y en `diseno.md` 5.4.

**Lo que no salió como se esperaba (pregunta 1).** Con la semilla 20261118: **cuatro deudores** (C05, C10, C06 y C07), así que **«Otros» no existe** (M4: hace falta más de cinco) y el **tramo 61–90 queda en 0,00**. Se cumple lo demás: C05 es el cliente con más mora (el 52,0 %) y T12-d91, con 91 días, su comprobante más atrasado; los pagos a cuenta (50.000,00) y los saldos a favor (58.000,00) son los esperados; «Más de 90» es 605.000,00 exacto. No es un defecto del generador sino de la semilla: sobre las 50 semillas hay cuatro deudores solo en 5, cinco en 12, **seis en 27** y siete en 6, y C05 encabeza en 44. Se dejó como dio (el generador no fuerza ningún resultado, 5.2). **Decisión para Matías:** (a) dejarla y que el recorrido y `diseno-ui.md` se ajusten (sin «Otros» en el Resumen; la medida «Otros» queda cubierta solo por los fixtures); (b) publicar otra semilla: la primera con más de cinco deudores y C05 al frente es `20261119` (seis deudores: C05, C03, C11, C07, C10 y C06; mora 10.137.173,09; huella `d21810ae`; mismos pagos a cuenta y saldos a favor), y cambiarla son `SEMILLA_PUBLICADA`, la huella y `esperado.ts` (`node scripts/referencia.mjs 20261119` imprime las cifras; el test de referencia dice qué más cambiar); (c) tocar el relleno (por ejemplo, más facturas por mes), que cambia todas las semillas. Elegir (b) entre 50 semillas es elegir la que da el relato: se anota como tal.

**Verificación (local, 22/11/2026).**

| Qué | Resultado |
| --- | --- |
| `npm run check` | 0 errores y 0 advertencias (254 archivos) |
| `npm test` | 37 archivos, 1429 tests en verde, 17 s |
| `npm run test:tz` | 1429 en verde en UTC, Asia/Tokyo y America/Los_Angeles |
| `npm run buscar` | Sin hallazgos (14 reglas, 118 archivos) |
| `npm run build` | Sin errores. **JS: 22,95 KB (9,4 KB gzip)**, CSS 6,0 KB (2,3 KB gzip); el tope de `stack.md` es 100 KB gzip. No cambió: la interfaz todavía no importa el dominio ni los datos. |
| `npm run mutaciones` | **60 mutaciones: las 60 mueren**, ninguna sobrevive, ninguna vieja ni con error (unos 13 minutos) |
| Búsqueda literal de nombres de terceros, correos personales y rutas personales (sin `node_modules`, `dist` ni `.git`) | 0 coincidencias |
| `npm audit` | No se corrió: no cambió ninguna dependencia |

**Rendimiento (G7).** Generar: 3,2 ms (objetivo 50). Las 15 medidas de la empresa para un corte, con los dos caminos y `controlar`: 3,7 ms con datos nuevos y 1,7 ms con los índices ya armados (objetivo 20). El test de CI usa un tope de 500 y 200 ms. Medido en Node, no en el navegador.

**Decisiones propias (propuestas por IA), en `diseno.md` 11.7 (H55 a H67, del tramo 1) y 11.8 (H68 a H77).** Las que cambian algo visible: C01 y C02 por 3 y C03 por 2 (H68); la primera factura de cada mes es el alquiler y las demás salen de los otros cuatro servicios (H70); el cobro de C02 se calcula sobre el neto de la factura (H72); los recibos plantados no se mezclan con los de relleno (H73).

**Cosas que `diseno.md` decía y los datos no cumplen** (corregidas en el documento): 5.4 esperaba siete deudores (H77); la fila de T07-F de 5.4 decía «y 58.000,00 a favor» al 31/08, que vale en el fixture pero no en la semilla, donde C09 todavía tiene facturas sin cobrar y esos 58.000,00 son un pago a cuenta (H69); «unos 650 comprobantes y unos 600 recibos» son 720 y 642 (1 a 4 facturas por cliente y mes da 2,5 de promedio).

**Preguntas abiertas (para Matías o para la revisión; solo la 1 pide decidir).**
1. **La semilla publicada y «Otros»** (arriba).
2. **`claves.ts` no es lo único que comparten los dos caminos.** El hilo pidió que `claves.ts` fuera el único módulo compartido permitido, pero también comparten `antiguedad.ts` (`TRAMOS` en un camino y `tramoDe` en el otro, las dos copias de A1, que `antiguedad.test.ts` cruza) y las utilidades (`dinero`, `fechas`, `tipos`). El test lo dice con esos cinco; si se quiere más estricto, hay que duplicar `TRAMOS`, y se pierde el cruce que hoy hace la propiedad.
3. **El generador real no emite retención de IVA** (5.1 solo da IIBB y Ganancias para C02). El tercer medio queda cubierto por el fixture y el generador provisional; si se quiere en los datos publicados, es un cambio de 5.1, de la huella y del resultado de referencia.
4. **Probabilidades que 5.2 no fijaba** (H71): cheque 15 %, NC en una de cada ocho facturas de C06 (esta sí estaba), porcentaje 10 a 100, días 3 a 25. Si alguna no convence, es una constante en `generador.ts` y cambia la huella.
5. **La empresa tiene un CUIT fijo** y los clientes, uno del azar (H74): con ocho dígitos al azar, un CUIT puede coincidir con el de una empresa real por casualidad. Todos se muestran con «ficticio»; quitar el azar de los CUIT sería un cambio de 5.1.

**Cifras de `diseno-ui.md` que se fijan con esta etapa:** en la respuesta de la entrega (cada cifra con su valor real); `diseno-ui.md` no se editó (lo hace `disenador-ui`).

**Archivos que `revisor-codigo` tiene que mirar en E4.** `src/lib/datos/generador.ts` (el orden de los sorteos y la cobranza: lo que hace «realista» el relleno y lo que fija la huella), `src/lib/datos/clientes.ts`, `plantados.ts`, `huella.ts`, `esperado.ts`, `cargar.ts`, `congelar.ts`; `scripts/oraculo.mjs` (que de verdad no comparta nada con el dominio) y `referencia.mjs`; `tests/generador.test.ts`, `tests/referencia.test.ts`, `tests/oraculo.test.ts`, `tests/independencia.test.ts` y `tests/fixtures/grafoDeImportaciones.ts`; `scripts/mutaciones.mjs` y `mutaciones.json` (que las 60 sean mutaciones con sentido). Del tramo 1: `src/lib/dominio/medidas.ts` (`normalizarFiltro`, `medidaControlada`, `porCliente`), `controles.ts` (`PosicionDe`) y `claves.ts`.

**Próxima acción.** Que `revisor-codigo` revise los archivos de arriba; que Matías decida la pregunta 1 (la semilla publicada); y arrancar E5 (marco de la aplicación: enrutador por *hash*, estado del corte y avisos), con la interfaz pidiendo las cifras por `medidaControlada` y cargando los datos por `cargarDatosDeEjemplo`. `disenador-ui` actualiza `diseno-ui.md` con las cifras reales (o con las de la semilla que se elija).

## 25/11/2026 — Correcciones de la revisión de E4 y cambio de semilla (propuesto por IA, con la decisión de Matías sobre la semilla)

Rama `correcciones-e4` (sale de `main` en `a5e412e`). Fuente: la revisión de `revisor-codigo` (informe interno, no publicado). La semilla es **decisión de Matías (25/11/2026)**; lo demás lo hizo la IA.

**Huellas.** Semilla `20261118`: `1d0dd05f` (E4) → `bd970754` (con el M-1 de los CUIT, sin cambiar ningún importe) → **semilla `20261122`: `e9274f2c`** (la publicada ahora; 690 comprobantes y 618 recibos).

**Qué se corrigió.**
- **M-1 (CUIT).** La empresa usa `armarCuit("30", "99000003")` (30-99000003-0), como dice la sección 2 y usa la Demo 2 (antes `71000003`, en un bloque con empresas reales). Los clientes salen de las bases `99.100.000` a `99.999.999` (el bloque de la empresa, por encima de ella) y no de todo el espacio. `entero(a, b)` consume un solo sorteo sea cual sea el rango: **no cambió ningún importe** (el JSON de la semilla vieja, sin los CUIT, tiene el mismo SHA-256 antes y después). **No está comprobado que ese bloque esté libre**: baja el riesgo, no lo elimina; sigue pendiente la consulta a mano de los 14 CUIT antes de publicar (E8). `diseno.md` 5.1 y H74 corregidos; el CUIT de `plantados.test.ts` (que no tenía verificador válido) ahora es 30-99000003-0 y el test lo comprueba.
- **B-6 (puertas).** `scripts/reglas-codigo.mjs` tiene una regla nueva: fuera de `src/lib` (App, componentes, vistas, estado, `main.ts`) no se puede importar `medida`, `generar` ni `validarDatos` (con nombre, en una lista partida en líneas, reexportadas, con `*` o con `import()` de `medidas.ts`, `generador.ts` o `validadores.ts`); solo `medidaControlada` y `cargarDatosDeEjemplo`. 15 reglas en `buscar`.
- **B-4 (huella en cuatro lugares).** La huella está escrita en un solo lugar del código (`esperado.ts`); `generador.test.ts` la importa de ahí, y un test de `referencia.test.ts` exige que el README cite la semilla y la huella que da el generador.
- **B-1 (oráculo).** `oraculo.mjs` recalcula el IVA (21 %, mitad hacia arriba), el total y el vencimiento (emisión + plazo del cliente; la NC vence el día de su emisión) de cada comprobante y lanza si no coinciden con los del dato. `oraculo.test.ts` suma los números escritos a mano de T08 y de la retención de IVA (cobranza y retenciones), las pruebas de que lanza, y compara con el dominio sobre 8 semillas del generador real y 8 del provisional (que sí emite notas de débito y retención de IVA). Corrección al informe: el provisional **no** emite recibos con varias imputaciones en las semillas probadas; el test solo exige ND y retención de IVA.
- **B-2.** Un test exige al menos una NC del 100 % que anula la factura en las 50 semillas (hay tres) y que esa factura no tenga cobro.
- **B-3.** El máximo con la emisión queda con un comentario que dice que hoy es defensivo (con plazo 15 y corrimiento −5 no se toma); se sacó el mapa `plazoDe` y su `?? 0`: el plazo sale de `f.base.plazoDias`.
- **De paso.** JSDoc de `cargarDatos`: congela el objeto que recibe.

**Cambio de semilla (`20261122`).** Con `20261118` eran cuatro deudores, sin «Otros», y el tramo 61–90 en 0,00. Se verificó con el oráculo, para las semillas `20261118` a `20261135`, cuántos deudores hay y qué tramos tienen importe: **`20261122` es la primera, a partir de `20261118`, con más de cinco deudores y deuda en los cinco tramos** (`20261118` a `20261121` no cumplen las dos). Cambió `SEMILLA_PUBLICADA`, `esperado.ts`, el README (con una línea honesta sobre el criterio), `diseno.md` (5.2, 5.4, G1, G3, H11, H75, H77 y H78 nueva) y `tests/referencia.test.ts` (mismos controles; cifras nuevas del oráculo; títulos con las cantidades nuevas; «Otros» ahora existe y se prueba; un test nuevo exige deuda en los cinco tramos). Los casos plantados no cambian. **C05 sigue siendo el cliente con más mora y T12-d91 su comprobante más atrasado (91 días)**, así que el recorrido de 2 minutos y E6 no cambian en eso. Pagos a cuenta 50.000,00 (C07) y saldos a favor 58.000,00 (C09), iguales.

**Cifras de 5.4, antes y después** (corte 31/10/2026):

| Cifra | `20261118` | `20261122` |
| --- | --- | --- |
| Saldo a cobrar | 28.395.875,05 | 28.513.662,10 |
| Saldo neto | 28.287.875,05 | 28.405.662,10 |
| En mora | 5.504.036,30 (13 comprobantes, 4 clientes, 19,4 %) | 6.306.481,28 (16 comprobantes, 6 clientes, 22,1 %) |
| No vencido / 1–30 / 31–60 / 61–90 / Más de 90 | 22.891.838,75 · 2.962.040,47 · 1.936.995,83 · 0,00 · 605.000,00 | 22.207.180,82 · 4.552.834,33 · 23.241,68 · 1.125.405,27 · 605.000,00 |
| Deudores | C05, C10, C06, C07 (4; sin «Otros») | C05 3.446.078,79 · C11 1.184.628,72 · C10 942.051,55 · C03 530.282,50 · C02 131.663,73 · Otros 71.775,99 (C07) |
| Mayor deudor y su comprobante | C05 y T12-d91 (91 días) | C05 y T12-d91 (91 días) |
| Pagos a cuenta / saldos a favor | 50.000,00 / 58.000,00 | 50.000,00 / 58.000,00 |
| Octubre: facturación (sin IVA) | 16.251.807,00 (34 comprobantes) | 15.705.914,00 (30 comprobantes) |
| Octubre: IVA / con IVA | 3.412.879,47 / 19.664.686,47 | 3.298.241,94 / 19.004.155,94 |
| Octubre: cobranza / retenciones | 21.669.236,95 (35 recibos) / 89.603,89 | 23.847.590,51 (37 recibos) / 152.972,81 |

**Observaciones para el diseñador (no se tocó `diseno-ui.md` ni `plan.md`).** Con esta semilla «Otros» tiene un solo cliente (C07, un comprobante): la fila «Otros ({N} clientes)» queda con N = 1. El tramo 31–60 es chico (23.241,68, el 0,1 %) y todo es de C05: la barra de antigüedad va a mostrar un segmento casi invisible. `diseno-ui.md` dice «se esperan siete deudores» y trae marcas ‹E4› por llenar; `plan.md` (4.4 y la fila de riesgos de E4) todavía habla de la semilla `20261118`.

**Hallazgos bajos no corregidos, con su motivo.** B-5 (el comentario de `porCliente` desplazado en `medidas.ts`): es de `src/lib/dominio`, fuera de los archivos de esta rama y otros agentes trabajan en el repo; es mover un bloque de comentario. B-7 (la suite tarda el doble de lo declarado): es una decisión sobre la integración continua, no un defecto; sin cambios. B-8 (datos de prueba dentro de `src/`, números sin tipo en `esperado.ts`): ningún error, y `esperado.ts` va a alimentar «Cómo se calcula»; se deja. B-9 (a) la frase de 5.2 «se sortea siempre» es falsa para el porcentaje y los días de la NC: es texto de 5.2 que no cita huella ni CUIT; (b) criterio de 4.4 en `plan.md`: ahora se cumple con la semilla nueva, `plan.md` es del hilo principal; (c) matiz de «dos caminos independientes» en el README: el README solo se tocó donde cita la huella. **Entorno:** el worktree salió con finales de línea CRLF (`core.autocrlf=true`) y `tests/mutaciones-lista.test.ts` falla con CRLF (las cadenas de `mutaciones.json` llevan `\n`); se normalizó a LF el árbol de trabajo (el repositorio guarda LF, no cambia ningún commit). Un `.gitattributes` con `* text=auto eol=lf` lo evitaría en cualquier clon de Windows; no se agregó (fuera de los archivos de esta rama).

**Verificación.** `npm test`, `npm run test:tz`, `npm run check`, `npm run buscar` y `node scripts/oraculo.mjs` en verde (números en el informe de la entrega).

## 25/11/2026 (segunda parte) — Integración de E5: enrutador (5.1), gráficos (5.3) y fines de línea (propuesto por IA)

Tres ramas terminadas, fusionadas en `main` en este orden: `correcciones-e4` (avance rápido), `e5-enrutador` y `e5-graficos`. **No hubo conflictos** (las tres tocan archivos distintos; `docs/registro.md` y `docs/diseno.md` solo los tocó la primera). Las notas de las dos ramas de E5 se pasaron a este registro y a `diseno.md` y se borraron.

**E5, paso 5.1 (rama `e5-enrutador`): enrutador por hash y estado de la dirección.** `src/lib/estado/enrutador.ts` (puro: `resolverDireccion`, `aHash`, `idDeVista`) expresa las cuatro vistas de E6 (`#/`, `#/cliente/C05`, `#/comprobante/1-0003-…`, `#/desglose/{clave}` con `cliente`, `mes` y `agrupar`), las valida contra los datos y nunca repite lo escrito en la dirección. `src/lib/estado/direccion.svelte.ts` es el estado reactivo: aviso de S5 (probado con las ocho direcciones de la tabla en las cuatro vistas) y aviso del mes, corrección con `replaceState` sin entrada nueva, una entrada de historial por cambio de vista o de corte, y `vista` para decidir el foco. `ubicacion.ts` se copió de la Demo 2 (`procedencia.md`). +164 tests. JS: 22,95 kB sin usar el enrutador; con un `App` temporal que lo usa y carga los datos, pasa de 46,53 a 59,87 kB (+13 kB, +4,3 kB gzip). Decisiones propias: H79 a H89 de `diseno.md` (11.9), **pendientes de revisión**. Uso previsto en el marco: se crea con `crearEstadoDeDireccion(datos, ubicacionDelNavegador())`; la vista se elige por `estado.ruta.tipo` (`inexistente` y `desconocida` son el estado de error); los avisos salen de `estado.avisos`; todo `href` sale de `estado.enlace(ruta)`; el foco al `h1` se decide con un `$effect` sobre `estado.vista` (no cambia con el corte ni con `agrupar`); el anuncio por cambio de corte sale de observar `estado.corte`; `document.title` y el `h1` los arma la vista.

**E5, paso 5.3 (rama `e5-graficos`): componentes de gráfico con su tabla equivalente.**
- `GraficoMeses.svelte`: de una o dos series y hasta 12 meses, con SVG propio, eje desde 0, valores negativos que bajan del eje, tabla equivalente en un `details` («Ver los N meses») y tarjetas por debajo de 40 rem. Props: `subtitulo`, `series`, `meses`, `mesDeCorte`, `ariaLabel`, `renglonDeCorte?`, `avisoDesde?`, `tabla`, `textoDeTabla?` y el snippet `celda?`.
- `ReglaTramos.svelte`: los cinco tramos de antigüedad; un tramo en 0 no se dibuja (su ítem dice «$ 0,00»), caja de vacío y tres disposiciones de la lista (`completa`, `mediana`, `minima`). Props: `tramos`, `ariaLabel`, `variante?`, `textoVacio` y el snippet `cifra?`.
- `grafico-escala.ts` (geometría pura, con 19 tests en `tests/grafico-escala.test.ts`) y `tipos-graficos.ts` (los tipos de las props).
- Página de muestras **solo de desarrollo** (`muestras.html`, `src/muestras/`): se ve con `npm run dev` en `/muestras.html` y no sale en el build (`vite build` solo toma `index.html`). No se tocaron `App.svelte`, `main.ts`, `index.html` ni `vite.config.ts`. Para integrarla: el marco la ignora, o importa `Muestras.svelte` detrás de `import.meta.env.DEV` y se borra `muestras.html`.
- Verificación de la rama: `npm ci`, `check` (0 errores), `buscar`, `contraste` (0 fallan, 6 justas, sin tokens nuevos), `build` y `audit` (0) en verde. Con la CSP real (build temporal con `muestras.html` servido con `servir-dist.mjs`, Playwright): 0 violaciones, consola limpia, claro y oscuro a 360 y 1280 px; sin desplazamiento horizontal a 320, 360, 768 y 1280 px ni con el texto al 200 %. Teclado: Tab y Enter sobre `summary` y las cifras-enlace con anillo visible; el árbol de accesibilidad trae `table`, `caption`, `columnheader`, `rowheader` y `cell`.
- Peso: `index` sin cambios (9,37 kB de JS y 2,30 kB de CSS con gzip); los dos componentes con su runtime pesan 19,6 kB de JS y 3,95 kB de CSS con gzip (unos +10 kB de JS sobre el baseline). Tope: 100 kB.
- **Dudas de la especificación (para `disenador-ui`).** (1) La sección 12 de `diseno-ui.md` le asigna al programador la escala, las posiciones y el abreviado de los meses; no existían y se escribieron en `grafico-escala.ts`. Falta que el programador arme los `ariaLabel`, el renglón de corte y «Hay datos desde…» (las muestras traen versiones mínimas). (2) La tabla compacta de 5.9 (dos columnas) no está: el componente `Tabla` no existe y `GraficoMeses` trae la suya; a 768 px los meses parten renglón. (3) `celda` y `cifra` son snippets hasta que exista la cifra-enlace; la caja de vacío (5.13) está duplicada en `ReglaTramos` hasta que exista `Vacio`. (4) El título lo pone el `Panel`; el `figcaption` lleva subtítulo, leyenda, renglón de corte y aviso. (5) Decisiones del paso que no están en la especificación: el salto de rótulos de mes y la regla de años cuando se pisan con texto muy agrandado; un negativo de menos de 1 px se dibuja de 1 px hacia abajo; el `summary` dice «Ver los N meses».
- **Sin hacer en 5.3:** NVDA real; colores forzados a ojo (solo por CSS); la disposición compacta de la tabla; el `ariaLabel`, el renglón y el aviso desde la lógica; la integración en el enrutador y en las vistas (E6); la captura a 768 px solo se miró en capturas.

**Fines de línea.** Se agregó `.gitattributes` (`* text=auto eol=lf`, con los binarios marcados). Motivo: con `core.autocrlf=true` (esta PC) el árbol de trabajo salía con CRLF y fallaban 5 tests de `tests/mutaciones-lista.test.ts` (r3, a7, m8, g8, g11), porque las cadenas de `mutaciones.json` llevan `\n`. El repositorio ya guardaba LF: la renormalización no cambió ningún archivo versionado. Con el archivo, un clon limpio en Windows trae LF y los 5 tests pasan.

**Aviso del mes.** `avisoDeMesInvalido` se movió de `enrutador.ts` a `src/lib/dominio/textos.ts`, junto a `avisoDeCorteInvalido`; su test pasó a `tests/textos.test.ts`. Mismo texto: «El mes de la dirección no es válido. Se muestra octubre de 2026.» (pendiente de revisión por `redactor-ux`).

**Próxima acción.** Faltan de E5 el paso 5.2 (marco: barra, selector de cierres de mes, pie, avisos y la pantalla de error de cierre, con el enrutador y las muestras ya hechos) y el 5.4 («Cómo se calcula» con los números reales). `disenador-ui` ajusta `diseno-ui.md` (cifras de la semilla `20261122`, «siete deudores», marcas ‹E4› y las dudas de arriba); `revisor-codigo` mira el enrutador y los gráficos antes de cerrar E5.

## 25/11/2026 (tercera parte) — Seguridad: la lista de nombres de terceros sale del repositorio (propuesto por IA)

Rama `sin-huellas`. `scripts/huellas-prohibidas.mjs` guardaba el SHA-256 **sin sal** de dos términos que el repositorio no puede nombrar, con su longitud. Un hash sin sal de una palabra corta se recupera probando un diccionario en segundos: en un repositorio público equivale a publicar el nombre. La Demo 2 tenía el mismo mecanismo y se corrigió el mismo día; esta rama porta esa corrección (código propio, ya probado).

**Qué cambió.**
- Los términos salen de `scripts/prohibidos.local.json` (`{ "palabras": ["término", "frase de dos o tres palabras"] }`), **ignorado por git**. Si no existe (integración continua, clon ajeno), la regla de nombres de terceros se omite con un aviso por consola y `npm run buscar` no falla por eso (corre con una regla menos: 14 de 15). Si existe pero el JSON está roto o tiene otra forma, falla con el motivo. La búsqueda no revisa el propio archivo local.
- `huellas-prohibidas.mjs` y su `.d.mts` se borraron. `prohibidos.mjs` ya no tiene `crearHuella`, `huellasDeLiterales` ni `MAX_PALABRAS`: ahora `terminosDeJson` y `contieneProhibido` (una palabra se busca como trozo de cada palabra; una frase, como palabras consecutivas y exactas). El archivo viejo opcional `.prohibidos.local` desaparece.
- `scripts/ensayo-buscar.mjs` (nuevo, copiado de la Demo 2) corre `buscar-prohibidos.mjs` sobre una raíz temporal con un `src/plantado.ts`, con o sin archivo local, para probar la regla de punta a punta.
- `.gitignore` suma `scripts/prohibidos.local.json` y `.env*`.
- Tests (`tests/prohibidos.test.ts`): lectura del JSON (y errores), búsqueda con términos, siete casos de `npm run buscar` (con archivo: detecta término y frase, pasa limpio, no revisa el archivo local; sin archivo: avisa y no falla, las demás reglas siguen; archivo roto: falla), `.gitignore` con el archivo local y `.env*`, y ningún script con una cadena de 64 hexadecimales.
- Documentación al día: `docs/stack.md` (sección 6), `docs/diseno.md` (G4), `docs/procedencia.md`, `README.md` y el comentario de `ci.yml`.

**Decisión propia.** El archivo local se copió desde la Demo 2 (los términos son los mismos); no se escribió ningún término en un archivo versionado.

**Pendiente antes de publicar esta demo (decisión de Matías).** Las huellas siguen en el **historial** de git (los commits que agregaron `huellas-prohibidas.mjs`): un `git revert` no las saca. Hay que reescribir el historial (como se ensayó con la Demo 2) antes de hacer público el repositorio, y revisar de nuevo con `git log -p` que no queden cadenas de 64 hexadecimales ni los términos.

**26/11/2026 (resolución de lo anterior).** El repositorio público se arma **sin historial**, con un único commit sobre el árbol versionado de `main`, por lo que el historial de trabajo (donde estaban las huellas del archivo de huellas) no se publica. La entrada de arriba queda como registro de lo que se pensó entonces.

## 25/11/2026 (T4a) — Las ocho pantallas juntas: presentación y pedidos de la adenda (propuesto por IA)

Rama `tanda4-pre`, desde `main` en `64e35dc`. Se construyó, se sirvió el *build* con la CSP real y se recorrieron las ocho pantallas (Resumen, Comprobantes, Clientes, Meses, Cliente, Comprobante, Desglose y Cómo se calcula) a 360, 768 y 1280 px, en claro y oscuro, con Playwright por consola; consola sin errores ni violaciones de CSP.

**Incoherencias halladas y corregidas.** (1) El encabezado de pantalla estaba escrito siete veces: ahora hay un solo `componentes/Cabecera.svelte`; también un solo `EtiquetaDeTramo` y un solo mapa de números y tonos de tramo (`componentes/tramos.ts`, antes tres copias). Capturas idénticas pixel a pixel antes y después. (2) En «Datos del comprobante» la línea inferior del rótulo no seguía a la del valor cuando este ocupaba dos renglones. (3) La tabla de comprobantes de la ficha del cliente no tenía la leyenda de siglas (FA, ND, NC) que sí tienen Comprobantes y el Desglose: ahora la trae, con la pieza compartida `LeyendaDeSiglas`.

**Pedidos cerrados.** Fila de detalle en `Tabla` para los recibos (cuenta corriente, movimientos del comprobante, hoja de recibos, partidas del desglose). Umbral de tarjetas por tabla (`tarjetasDesde`, sin JavaScript; ver `diseno-ui.md` 5.9): barrido a ancho continuo, cada 8 px de 320 a 1440 y cada 4 px entre 680 y 1100, con solapas y recibos abiertos: ninguna tabla desborda su caja ni la página. `ReglaTramos`: una línea por tramo entre 26 y 40 rem de contenedor; el panel Posición baja de 450 a 314 px y a 1280 × 800 el panel Movimiento del mes entra entero. Pieza `OrdenarPor`. Leyenda de siglas. Unificación de `EtiquetaDeTramo`, `Cabecera` y los mapas de tramo.

**Diferencias con la especificación.** El umbral de las tarjetas pasa a depender de la tabla (5.9 decía 40 rem para todas). A 360 px la hoja de solapas de la ficha del cliente se desplaza en horizontal dentro de su fila con el desvanecido del prototipo (la tercera solapa queda a medias): es el diseño aprobado. Los textos no se tocaron.

**Para el programador / redactor.** Ver el informe de la tarea (textos listados, sin cambios).

## 25/11/2026 (T4) — Tanda 4: movimiento entre pantallas, textos residuales y documentos (propuesto por IA)

Rama `tanda4-pre`, desde `989a615`. Tres commits: los textos residuales, el movimiento y los documentos. Lo que decidió Matías ya estaba decidido (los textos «días de atraso», el prototipo «tipo app» con su transición); lo demás lo propuso la IA.

**1. Textos residuales.** «Por tramo de antigüedad» (panel de Comprobantes) pasa a «Por días de atraso» y la sección «Saldo, mora y antigüedad» de «Cómo se calcula» pasa a «Saldo, mora y días de atraso». Ninguna prueba fijaba esos dos textos: se agregó una que exige lo nuevo y otra que recorre **todos** los textos fijos de la interfaz y de «Cómo se calcula» y falla si alguno dice «antigüedad». Quedan a propósito dos usos internos: la descripción del control X1 (que no se muestra) y los nombres de archivo y de tipo del dominio (`antiguedad.ts`, la regla A1).

**2. Movimiento.** `src/lib/estado/transicion.ts` (lógica con un entorno reemplazable, probada en Node), `src/estilos/movimiento.css` y `tests/transicion.test.ts`.
- Al cambiar de **pantalla** hay una transición con `document.startViewTransition`: la pantalla sale en 110 ms y entra en 230 ms subiendo 10 px; el número de un comprobante o el nombre de un cliente viaja de la tabla (o de la bajada) al título en 320 ms, solo si se llegó pulsándolo. «Atrás» anima sin que nada viaje.
- **No se anima:** el cambio de corte, un filtro, una búsqueda ni un ancla (no pasan por el gancho `alCambiarVista`), ni las cifras, y el marco no se mueve. Con `prefers-reduced-motion` no hay transición, ni nombres, ni entrada; se lee en cada cambio. Sin View Transitions entra una animación de CSS equivalente.
- El estado cambia **dentro** de la devolución del navegador y se espera `tick()` de Svelte antes de la foto de «después» (el riesgo R1 del plan de la interfaz): sin parpadeo, foco en el `h1` y página arriba, como antes.
- **Desvíos del plan de la tanda.** (a) Los nombres de transición se activan con una **clase** en la raíz (`en-transicion`) y un **atributo** (`data-viajando`), no con `style.viewTransitionName` por CSSOM: no toca `style` ni siquiera por CSSOM, y se prueba mejor. (b) La clase de la raíz se pone mientras dura la transición y no siempre: un `main` con nombre fijo sería una capa aparte permanente. (c) No se tocó `Marco.svelte`: el movimiento se crea y se escucha en `App.svelte` (que es donde nace la aplicación, que recibe el gancho). (d) Las **barras fijas** (`BarraDeCorte`, `BarraMovil`, `PestanasInferiores`) llevan `data-fijo` y nombre propio durante la transición; sin eso, la foto de la pantalla, más alta que la ventana, se pintaba **encima** de la barra de arriba. (e) El título que recibe el nombre mide lo que mide su texto (`h1[data-viaja]`, `width: fit-content`): si no, la foto se estira hasta el borde.
- **Una carrera real del gancho (corregida).** El navegador aplica el cambio uno o dos cuadros después de la barra. Con «Atrás» enseguida de un clic, `direccion.svelte.ts` comparaba la vista nueva con la que **todavía se veía** y aplicaba directo el segundo cambio; la devolución del primero llegaba después y dejaba el estado en la pantalla del clic con la barra en otra (se vio en varias corridas de Playwright). Ahora la vista que cambió se compara con la dirección **más reciente** y los cambios se aplican siempre **en orden**, todos los que haya cuando el navegador llama a una devolución (el último manda). `ir`, `reemplazar` y `cambiarCorte` parten también de la dirección más reciente. Seis pruebas nuevas en `tests/direccion.test.ts`, que **fallan con el código anterior** (comprobado).
- **«Transition was skipped».** Un segundo clic antes de que termine la primera transición salta la primera y el navegador rechaza su promesa `ready`: llegaba a la consola como error sin atender. Se atiende (y hay una prueba: Vitest falla ante una promesa rechazada suelta).
- **WebKit de Playwright para Windows (26.5).** Se colgaba («Page crashed») con **cualquier** cambio de pantalla: la transición empezaba dentro del `hashchange` (se empieza ahora un turno después, con `setTimeout(0)`), y con un clic de mouse en una tabla, con una transición de CSS de 120 ms en marcha en la foto de «antes» o de «después» (se termina cualquiera que esté en marcha y no corren transiciones de CSS mientras dura la de pantalla). Con eso, los cambios de pantalla ordinarios (clic de mouse en una tabla, clic de código, teclado, el lateral, las siete rutas de destino) van bien en todas las corridas (seis maneras de pulsar y navegar, y tres pasadas de seis navegaciones por el lateral); **queda una secuencia artificial** (el mouse apunta a una fila y baja y sube el botón en menos de un cuadro) que en algunas corridas todavía lo cuelga. No se sabe si el Safari real lo hace. **Salida si aparece:** la opción B de la pregunta 4 del plan de la interfaz (dejar el movimiento solo con CSS, que ya existe como alternativa). A mirar en Safari real en la tanda 5.
- **Peso.** JS 79.772 → 80.658 B con gzip (+886 B); CSS 13.011 → 13.316 B (+305 B). Tope: 100.000 B.

**3. Documentos.** `README.md` reescrito para el público (qué es, capturas, las ocho pantallas, cómo se garantiza que cierra, datos ficticios, quién hizo qué, cómo correrlo y verificarlo con las cifras de esta versión, límites, origen y licencia); seis capturas nuevas en `docs/img/` tomadas del *build* servido con la CSP real (consola limpia, corte por defecto; escritorio y celular, claro y oscuro); `CLAUDE.md` (ocho pantallas, `contraste` y `peso` en la verificación), `docs/stack.md` (ocho pantallas, regla 4 con `startViewTransition`, estructura, peso medido), `docs/diseno-ui.md` (3.6 con el movimiento aprobado; la sección 11 sigue diciendo «sin animar cifras» y es lo que vale), `docs/plan.md` (5.2, 5.4 y E6 al día) y `docs/procedencia.md`.

**Verificación (local, 25/11/2026).**

| Qué | Resultado |
| --- | --- |
| `npm run check` | 0 errores y 0 advertencias (380 archivos) |
| `npm test` | 59 archivos, **2.210 pruebas** en verde (2.183 antes de la tanda: +27) |
| `npm run test:tz` | 2.210 en verde en UTC, Asia/Tokyo y America/Los_Angeles |
| `npm run buscar` | Sin hallazgos (15 reglas, 254 archivos) |
| `npm run contraste` | 206 mediciones, 0 fallan, 7 justas |
| `npm run build` y `npm run peso` | JS 80.658 B con gzip (tope 100.000 B); CSS 13.316 B |
| `npm run mutaciones` | **60 mutaciones: las 60 mueren**, ninguna sobrevive, ninguna vieja ni con error (13 minutos con la máquina compartida) |
| Navegador (Chromium, *build* servido con la CSP real) | 12 combinaciones (360, 768 y 1280 px × claro y oscuro × con y sin movimiento reducido), nueve rutas cada una: sin desplazamiento horizontal, un solo `h1`, consola y violaciones de CSP en 0; el talón y el nombre viajan (con la transición de `viaja` presente solo con movimiento), «Atrás» anima sin nombre, el cambio de corte no anima, el foco queda en el `h1` y la página arriba; con movimiento reducido no hay ninguna transición |
| Cuadros intermedios | Con la reproducción de animaciones al 4 % (CDP) se miraron los cuadros de la transición a 1280 claro y a 360 oscuro: las barras no quedan tapadas y el título recibe el nombre |
| WebKit de Playwright | Ver arriba: sin colgarse en los cambios de pantalla ordinarios; una secuencia artificial todavía lo cuelga |

**Diferencias con la especificación.** `diseno-ui.md` 3.6 decía «al cambiar de pantalla, nada»; ahora dice lo aprobado en el prototipo (transición corta y el nombre que viaja), con las prohibiciones que siguen valiendo. La sección 1.3 («ni animaciones de entrada») se acotó a las cifras y gráficos. Firefox y Safari reales, el lector de pantalla real y los colores forzados no se probaron.

**Para la tanda 5.** (1) Mirar el movimiento en **Safari y Firefox reales** (y el cuelgue de WebKit de arriba); si molesta, la salida es solo CSS. (2) `revisor-codigo` sobre `direccion.svelte.ts` (cola de cambios) y `transicion.ts`. (3) `qa-destructor`: tres clics rápidos en ‹, «Atrás» enseguida de un clic, `Tab` con las barras fijas durante la transición. (4) `auditor-accesibilidad`: el foco al `h1` dentro de la transición y el anuncio del corte. (5) El recorrido de 2 minutos (6.5) y la revisión del historial antes de publicar (términos, hexadecimales de 64, **los 14 CUIT inventados: las capturas de la ficha del cliente muestran uno**).

## 26/11/2026 — Movimiento: sin View Transitions en WebKit que no es Chromium (propuesto por IA)

Decisión: `document.startViewTransition` se usa solo en Chrome y Chromium (el agente de usuario dice «Chrome/» o «Chromium/» y no «CriOS/», «FxiOS/», «EdgiOS/» ni «OPiOS/»; lista de permitidos, corregida en la tanda 5: la primera versión dejaba pasar a Firefox). En Safari, en Firefox, en cualquier navegador de iPhone, con un agente desconocido o vacío y en navegadores sin la API, el cambio de pantalla es directo y entra la animación de CSS de respaldo (`#principal.entra`). Motivo: el WebKit 26.5 de Playwright para Windows se colgaba con la transición (ver T4) y no se pudo mirar en un Safari real; el mismo criterio se aplicó antes en la Demo 2. El resultado final es el mismo en los dos caminos (foco en el `h1`, página arriba, anuncio, título).

- `usaViewTransitions(navegador)` en `src/lib/estado/transicion.ts` (antes `esWebKitSinChromium`): función pura, probada con trece agentes de usuario (Chrome, Edge, Chrome de Android, Chromium, Firefox de escritorio y de Android, Safari de Mac y de iPhone, Chrome, Firefox, Edge y Opera de iPhone, el WebKit de Playwright) y con agentes vacíos o desconocidos. `movimientoDelNavegador` deja `iniciar` en `null` cuando da `false`; `crearMovimiento` ya sabía qué hacer con `null` (no marca orígenes, no inicia transición, entra la animación de CSS).
- Pruebas nuevas (+6, 2.210 → 2.216): la detección, y `movimientoDelNavegador` con un `document` de mentira en Chromium (inicia la transición), en WebKit de Playwright y en Chrome de iPhone (no la inicia, aplica el cambio y entra la animación) y que en WebKit un origen pulsado no se marca. (Tanda 5: la detección pasó a lista de permitidos y se sumaron pruebas de Firefox y de agente vacío; ver la entrada del 26/11 «Correcciones de la revisión de código».)
- Sigue en el código `iniciarEnElSiguienteTurno` (empezar un turno después y terminar las transiciones de CSS en marcha): en Chromium no cambia nada y ahora ya no llega a WebKit. No se sacó para no cambiar el movimiento de Chromium en esta tanda.
- Sin tocar: estilos y textos de la interfaz. `README.md`, `docs/stack.md` y `docs/diseno-ui.md` dicen ahora que la transición es solo de Chromium.

## 26/11/2026 — Tanda 5: correcciones de la revisión de código (propuestas por IA)

Rama `tanda4-pre`, desde `d480054`. Fuente: la revisión de `revisor-codigo` de la tanda 5 (informe interno, no publicado). Sin hallazgos de seguridad.

- **View Transitions, lista de permitidos.** `esWebKitSinChromium` dejaba pasar a Firefox, que ya trae la API y no se probó, así que «solo en Chromium» no era cierto. Ahora `usaViewTransitions` da `true` solo si el agente de usuario dice `Chrome/` o `Chromium/` y no `CriOS|FxiOS|EdgiOS|OPiOS`; Safari, Firefox, agentes desconocidos o vacíos van por el camino directo con la animación de CSS. Se dejó de mirar el fabricante (`vendor`). `README.md`, `docs/stack.md`, `docs/diseno-ui.md` y la entrada anterior de este registro dicen lo mismo.
- **`iniciarEnElSiguienteTurno`**: solo cambió el comentario (ya no cuenta el cuelgue de WebKit como motivo vigente: ese navegador no llega ahí). Sigue sin tocarse el comportamiento ni se afirma que haga falta. El comentario de `movimiento.css` (líneas 12-13) sigue contando el cuelgue de WebKit: no se tocó porque la tanda no toca CSS.
- **Rechazo real de la transición**: `finished` rechazado ya no se traga; se limpia igual y se hace `console.error`, salvo el `AbortError` de una transición saltada.
- **`aplicarLoQueEspera`**: si un cambio lanza al aplicarse, los siguientes se aplican igual y al final se relanza el primer error.
- **`ReciboDeLaTabla.svelte`**: la clave del `{#each}` vuelve a ser el id del comprobante; una prueba nueva asegura que ningún recibo de los datos de ejemplo imputa dos veces al mismo comprobante (Svelte falla con claves repetidas).
- **`scripts/servir-dist.mjs`**: un `%` mal formado responde 400 y el servidor sigue.
- **Referencias privadas**: fuera las rutas `docs/revisiones/…` y `docs/prototipos/…` y la «carpeta de trabajo del portafolio»; quedan como «informe interno, no publicado».
- Pruebas: 2.216 → 2.223 (+7), también en UTC, Asia/Tokyo y America/Los_Angeles. `check` 0 errores; `buscar` sin hallazgos. No se corrió `build` ni `peso`: la cifra de JS del README se actualiza al final de la tanda.
## 26/11/2026 — Tanda 5: correcciones de lógica tras la QA (propuestas por IA)

Rama `tanda4-pre`. Fuente: la QA de `qa-destructor` de la tanda 5 (informe interno, no publicado). Sin hallazgos de seguridad.

- **Singular.** «Último mes», «Ver el mes como tabla», «Total del mes», «Ver el cliente», «Sin facturación en el último mes» y «plazo de 1 día» (antes «últimos 1 meses», «1 días»). Una prueba por texto, con 1, 12 y 0 donde corresponde.
- **Clientes.** Los importes en cero de la tabla (saldo y mora) llevan ahora el nombre de la medida para lectores de pantalla, como los demás. Solo marcado.
- **Ficha de cliente.** Con saldo a favor, el rótulo no repite la etiqueta «Saldo a favor» (queda el rótulo de la fila).
- **`Dialogo.svelte`** (sin uso) fuera, junto con `TEXTO_DIALOGO` y la regla `html.dialogo-abierto`. `diseno-ui.md` 5.14 y 7.3 dicen que «Cómo se calcula» es una pantalla.
- **Segundo `#`.** `#/resumen?corte=2026-10-31#frag` se lee como el corte 31/10/2026. Cambio de efecto: `#/cliente/C05#otro` pasó de «desconocida» a la ficha de C05 (el fragmento se ignora igual que en las demás direcciones).
- **Doble clic en ‹ y ›.** Causa: los botones calculaban el cierre vecino desde el corte ya dibujado; `hashchange` y la actualización llegan después, así que un segundo clic inmediato calculaba el mismo destino que el primero y `location.hash = …` con el mismo valor no hace nada. Nuevo `moverCorte(paso)` en `direccion.svelte.ts`: cuenta desde el hash de la barra, que cambia al instante. No se tocó la cola de navegación.

## 26/11/2026 — Tanda 5: correcciones de presentación tras la revisión (propuestas por IA)

Rama `tanda4-pre`. Fuente: los informes de accesibilidad, QA y revisión de código de la tanda 5 (internos, no publicados). Solo CSS, marcado y textos; no se tocó la lógica de `src/lib`.

- **Gráfico de 12 meses.** Facturado y Cobrado contrastaban entre sí 1,63:1 (claro) y 2,20:1 (oscuro). Cobrado lleva trama diagonal y ribete de 1,5 px dibujado hacia adentro (los 2 px de aire entre barras, que ya existían en `grafico-escala.ts`, se conservan), y su muestra en la leyenda repite lo mismo. `--c-serie-cobrado` en oscuro sube de `#6E777F` a `#7F8890` (3,27 a 4,13 sobre la banda del mes de corte). No hay pares nuevos en `contraste.mjs`: la trama y el ribete usan el mismo token ya medido; las justas bajan de 7 a 6.
- **Objetivos de 24 px.** Cifras-enlace, nombres de cliente (tablas y panel de datos del comprobante), talones y los dos enlaces del pie: `inline-flex` con `min-height: 1.5rem`. En tablas, margen de −2 px arriba y abajo: las filas miden lo mismo (±0,5 px). Los enlaces dentro de una frase no se tocan (excepción de la 2.5.8).
- **Texto agrandado.** Los `select` («Ordenar por» y fecha de corte) llevan `width: 100%` con su `flex` (la opción más larga ya no fija el ancho mínimo); `Panel .controles` con `min-width: 0`; «Cómo se calcula» se parte en dos renglones; «Demo» baja a su renglón; el nombre de «Atrás» baja de renglón con la barra de menos de 18 rem. Sondeo con letra raíz al 150 % y al 200 % a 320, 360 y 390 px en las ocho pantallas: de 20 combinaciones con contenido fuera de la pantalla, a 0.
- **Sin JavaScript.** `<noscript>` en `index.html` con la clase `.sin-js` (sin `style=`).
- **Tamaños chicos.** «Demo» de 11 a 12 px; pestañas inferiores de 12 a 13 px (11,5 px a 320 px por el tope de la columna).
- **Pastillas de tramo.** Chrome solo mueve la fila si la pastilla enfocada no se ve nada, así que a 320 px quedaban pastillas enfocadas a medias (hasta 85 px fuera). `onfocus` con `scrollIntoView`, `scroll-padding` y desvanecido de a lo sumo el 10 % de la fila. Queda un caso: a 320 px con el texto al 200 %, «No vencido» y «1 a 30 días» son más anchas que la fila (206 px) y se leen desplazando.
- **`movimiento.css`.** El comentario ya no cuenta el cuelgue de WebKit como motivo vigente; `both` pasa a `backwards` (Firefox de Playwright: llega con opacidad 0 y 10 px abajo; a los 600 ms, opacidad 1, `transform: none` y sin animaciones sobre `#principal`).
- **CSP.** Fuera `blob:` de `img-src`, `worker-src` y `manifest-src` (grep sin usos; cae en `default-src 'none'`). Ocho pantallas con desplegable, orden, corte, filtro y Atrás, en Chromium (claro y oscuro, 1440 y 360 px) y en Firefox: 0 violaciones, 0 mensajes de consola. Un test fija la lista.
- **Ficha de cliente con saldo a favor.** Se deja solo el rótulo del renglón, sin etiqueta: la etiqueta repetía las mismas palabras. `diseno-ui.md` 6.2 y la tabla de etiquetas al día.
- **Documentos.** Seis capturas de `docs/img/` rehechas con el build y la CSP reales (escritorio 1280 × 800, celular 360 × 740 a 2×); README con 2.232 pruebas (también en las tres zonas horarias), JS 81,5 kB, CSS 13,6 kB, contraste con 6 justas, y la frase de navegadores (Firefox de Playwright probado; Safari real y lector de pantalla, no); `diseno-ui.md` (tokens y contrastes de la serie, trama de Cobrado, objetivos de 24 px, texto agrandado) y `stack.md` (CSP y peso).
- **No se hizo:** `npm run mutaciones` (no se tocó `src/lib`; la última corrida es anterior a las correcciones de lógica de la tanda 5), probar en Safari real ni con lector de pantalla, y los textos de estado «sin publicar» ni `CLAUDE.md`.

## 26/11/2026 — Comentarios, barra del celular, fila marcada y mutaciones (propuestas por IA)

Rama `tanda4-pre`. Fuente: la revisión previa a hacer pública la demo.

- **Comentarios.** En `src/`, `scripts/` y los títulos de `tests/`: fuera las referencias a informes, etapas, ramas, roles, fechas de decisión y códigos de hallazgo o de decisión (H…, B-…, E…). Cada comentario dice qué hace el código y por qué. Quedan solo los identificadores de reglas de `docs/diseno.md` (M, C, R, S, A, D, G, X y los casos T). El JS y el CSS del build no cambiaron (mismo SHA-256 antes y después). `scripts/mutaciones.json`: ancla de la mutación `i4` y nombres sin códigos.
- **Barra del celular.** Si «Atrás» ya lleva a «Cómo se calcula» (se llegó desde uno de sus ejemplos), no se muestra también el botón de ayuda. Función pura `ofreceAyudaEnLaBarra` en `navegacion.ts`, con prueba; el marcado solo suma un `{#if}`.
- **Fila «última fila abierta».** La memoria guarda desde qué pantalla se abrió la fila (la anterior del recorrido) y la marca vale solo ahí: `filaElegidaEn(ruta)` reemplaza a `filaElegida`. Resumen → cliente desde Deudores → Resumen → «Ver de dónde sale» ya no marca la fila en el desglose. Dos tablas de la misma pantalla se siguen contando como una. Probado en Chromium contra el build servido.
- **`CLAUDE.md`.** Fuera la fila del agente `critico-reclutador`, la sección «Respaldo» y la mención a skills.
- **Mutaciones.** 60 de 60 detectadas, 0 sobreviven, 6 min 49 s.
- Pruebas: 2.232 → 2.239 (+7), también en las tres zonas horarias. `check` 0 errores; `buscar` sin hallazgos; JS 81.807 B con gzip.

## 26/11/2026 — Bajada del Resumen, metadatos, capturas y README (propuestas por IA)

Rama `tanda4-pre`. Fuente: la revisión previa a hacer pública la demo.

- **Bajada del Resumen.** Ya no repite que los datos son ficticios (lo dicen la insignia, el pie del menú y el pie de página): «Quién debe, cuánto y desde cuándo, a la fecha de corte que se elija. Cada importe subrayado se abre hasta los comprobantes que lo forman.» En el celular sigue con el nombre de la empresa delante. «Subrayado» describe lo que se ve: las cifras-enlace llevan subrayado azul. `TEXTO_RESUMEN.bajada` pasó de función a texto fijo; prueba y `diseno-ui.md` al día (el umbral del nombre de la empresa en la bajada era 64 rem, no 56 como decía el documento).
- **Metadatos de `index.html`.** `description`, Open Graph (`title`, `description`, `type`, `url`, `image` con ancho, alto y texto alternativo) y `twitter:card`. La imagen es `public/og-resumen.png` (1200 × 630, 135 KiB, captura del Resumen en claro, sin bloques de texto en el PNG). Nada en línea; la política de seguridad no cambia. El servidor local sirve `.png` con su tipo.
- **Capturas de `docs/img/`.** Rehechas el desglose oscuro (traía el pie de autoría anterior) y el Resumen de escritorio y de celular (bajada nueva). Las otras tres, comparadas píxel por píxel con el build de ahora, no cambian.
- **Comentarios de CSS.** En `src/estilos/` y en los `<style>` de los componentes: fuera el prototipo, `app.css`, fechas de aprobación y las historias de arreglos («era de 12», «878 px»). El CSS compilado queda idéntico byte a byte (SHA-256 antes y después).
- **Menores.** La columna de la barra de tramos en Clientes se llama «Saldo según atraso» (no tiene números). El panel «Para revisar» dice «2 recibos» en lugar de un «2» suelto. «Otros (1 cliente)» **no se cambió**: `diseno-ui.md` 5.9.1 registra que, con un solo cliente, no se muestra su nombre en lugar de «Otros» (decisión del 25/11/2026); cambiarlo es cambiar esa decisión.
- **README.** Cifras al día (2.240 pruebas, JS 81,8 kB), sección «Arquitectura» con orden de lectura, aviso de que `docs/` son notas de trabajo, párrafo de View Transitions más corto y «Quién hizo qué» sin jerga.
- Pruebas: 2.239 → 2.240 (+1), también en las tres zonas horarias. `check` 0 errores; `buscar` sin hallazgos; JS 81.813 B con gzip; contraste 206 mediciones, 0 fallan.
