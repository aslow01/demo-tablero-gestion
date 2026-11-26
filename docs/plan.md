# Plan de implementación — Tablero de cobranzas (actualizado el 25/11/2026)

**Nota del 26/11/2026:** este plan es el de trabajo y conserva lo que se pensó en cada momento. Hoy: la Demo 2 es pública desde el 25/11/2026; la Demo 3 se publica
sin historial en `https://tablero.matiasormeno.com.ar`; la verificación se corre en local (el flujo de `.github/workflows/ci.yml` hace lo mismo en cada push).

Etapas E0 a E8, cada una con su criterio de terminado y su estimación. **TDD en toda la lógica**: primero el test que falla
(con el identificador de la regla en el nombre), después el código mínimo, después limpiar. Los identificadores (M, C, R, S,
A, D, G, X) y los casos (T01 a T17) son los de `docs/diseno.md`; los casos borde viven en fixtures escritos a mano (5.5).

**Base de la estimación.** La Demo 2 tardó unas 19 horas de reloj desde el diseño hasta el paso 4.4, con varios agentes y
sin publicar. La Demo 3 no tiene persistencia, formularios ni comandos (cerca del 40 % de la Demo 2), pero suma gráficos y
reglas de dinero. Estimación gruesa en **horas-agente** (error esperado de ±20 %); el reloj depende de cuántos agentes
corran en paralelo.

Fuentes: estos documentos y el código propio de las Demos 1 (lector de facturas) y 2 (control de flota), del mismo autor.
Nada de terceros: ni código, ni datos, ni documentos.

Agentes de IA que intervienen (cada uno con instrucciones distintas): `programador` (lógica, TDD), `maquetador`
(presentación), `disenador-ui`, `redactor-ux`, `revisor-codigo`, `qa-destructor`, `auditor-accesibilidad`,
`critico-reclutador`. Un hilo principal los orquesta y decide el modelo y el esfuerzo de cada llamada; **Matías decide el
contenido y el negocio**.

---

## E0 — Diseño en el repositorio nuevo (4 h)

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 0.1 | `CLAUDE.md`, `README.md` provisional y `docs/registro.md`. | Hecho el 22/11/2026. |
| 0.2 | `docs/diseno.md`: modelo de datos, generador con casos plantados, resultado esperado y reglas con casos numéricos. | Hecho el 22/11/2026. **Cada regla tiene identificador y al menos un caso con números concretos.** |
| 0.3 | `docs/stack.md` y este plan. | Hecho el 22/11/2026. |
| 0.4 | `docs/diseno-ui.md` (`disenador-ui`, en paralelo): pantallas, tokens, estados, responsive. | Escrito y consistente con los identificadores de la sección 7 de `diseno.md`. |
| 0.5 | Revisión de `critico-reclutador` sobre los documentos. | Hecha el 22/11/2026 (`registro.md`). |
| 0.6 | Decisiones de Matías sobre el alcance. | Contestadas el 22/11/2026 (`diseno.md`, 11.1). |
| 0.7 | Ajuste tras la revisión: dos cálculos independientes por cifra y controles cruzados (4.2.1); control y sello fuera de la interfaz; resultado fijado solo para la semilla publicada y casos borde en fixtures (5.5); tipo `Centavos` con marca. | Hecho el 22/11/2026 (`diseno.md`, 11.3). `diseno-ui.md` se alinea en paralelo. |

## E1 — Proyecto y piezas copiadas (1,5 h)

**Hecho el 22/11/2026** (detalle, números y desvíos en `docs/registro.md`). Desvíos respecto de la tabla: el enrutador no se copia, se escribe en E5 (S7); la prueba del paso 1.5 se hace con `setAttribute`, `innerHTML`, `<style>` y `<script>` inyectados porque un `style="…"` en el marcado de Svelte no da violación (S6); GitHub Actions **no corrió** (paso 1.6): la verificación es local, a decidir antes de E8 (decisión 7).

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 1.1 | `package.json` (versiones exactas de `stack.md`), `tsconfig.json` estricto, `vite.config.ts` con Svelte, Vitest y el truco de `TZ`, `svelte.config.js`, `.gitignore`. Se fija la versión de `@playwright/test` si corresponde (decisión 7). Revisión de dependencias con `seguridad-aplicada`. | `npm ci` limpio; `npm audit` sin altas ni críticas (o excepción documentada con fecha). |
| 1.2 | Piezas copiadas de la Demo 2: `fechas.ts` (sin lo del reloj), `azar.ts`, `cuit.ts`, patrón del enrutador, `tokens.css`, `base.css`, íconos, `Dialogo`, `Aviso`, `Boton`, `Etiqueta`, `Panel`, `buscar-prohibidos.mjs`, `contraste.mjs`, `servir-dist.mjs`, `test-tz.mjs`, `public/_headers`, `ci.yml`. **Con sus tests.** Primera línea de cada archivo: `// Copiado de la Demo 2 (Control de flota, del mismo autor, MIT): <ruta>.` | `check` con 0 errores y los tests copiados en verde, en la matriz de zonas horarias. |
| 1.3 | `docs/procedencia.md`: archivo, origen y cambios. **La Demo 2 todavía no es pública**, así que no se cita ningún commit de un repositorio que nadie puede abrir: la columna "commit" queda "pendiente de publicar la Demo 2" y se completa cuando se publique. **La Demo 3 no se publica antes que la Demo 2.** | Lista completa y verificable contra el código. |
| 1.4 | Reglas nuevas en `buscar-prohibidos.mjs`, como respaldo del tipo `Centavos`: `parseFloat`, `toFixed`, `Math.round`, `Number(` en `src/lib/dominio` (M1, con la excepción de `fechas.ts`). | La búsqueda falla con un `toFixed` plantado y pasa sin él. |
| 1.5 | CSP con Svelte: componente de prueba con `style:` y un `style="…"` plantado que **sí** da violación (prueba de que la CSP está activa); se borra después. | `npm run build` + `servir-dist`: consola sin violaciones. |
| 1.6 | CI en GitHub Actions (`check`, `test` con matriz de `TZ`, `build`, `audit`, `buscar`) **si la cuenta lo permite** (la Demo 2 anotó un problema de facturación de Actions). Medición del tamaño de la compilación vacía. | Un *push* de prueba en verde, o la verificación local documentada con decisión explícita. Tamaño anotado en el registro. |

## E2 — Dinero, comprobantes y recibos (3 h)

**Hecho el 22/11/2026, con la revisión de M2 y M3 por `revisor-codigo` pendiente** (no se avanza a E3 antes; detalle, números y desvíos en `docs/registro.md`). Desvíos respecto de la tabla: M5 queda para E3 (necesita el catálogo); la numeración (C2) y los ids se escribieron en `comprobantes.ts` (paso 2.2) porque `armarDatos` y el generador la comparten; el paso 2.4 se hizo antes que el 2.3 porque los tests de los validadores necesitan datos de base; `validarDatos` suma C4 y los controles de G5 que no son de rango (decisiones H27 a H35 de `diseno.md`).

| Paso | Módulo | Tests primero | Hecho cuando |
| --- | --- | --- | --- |
| 2.1 | `dominio/dinero.ts` | M1 (el tipo `Centavos` con marca: `centavos` lanza con 1.5, `NaN`, `2**53` y 10^12 + 1; un `number` suelto no compila, con `@ts-expect-error`; `sumar`; formato), M2 (T10 y los bordes del redondeo), M3 (T11, 2/3 y 1/3, total 0, negativo), M4 (siete importes), M5 (después, con el catálogo). | Verde. `revisor-codigo` revisa M2 y M3 antes de seguir. |
| 2.2 | `dominio/comprobantes.ts` | C1 (firmado), C4 (los cuatro vencimientos), C5 (T09 y T13 con sus fixtures). | Verde. |
| 2.3 | `dominio/validadores.ts` | C2, C3, R1, R3: cada caso válido y cada caso rechazado de la tabla; el validador **nombra** el dato dañado. | Verde. |
| 2.4 | `tests/fixtures/armarDatos.ts` | Función que arma un `Datos` mínimo a mano (numera, calcula IVA y total con M2). | Los fixtures de `diseno.md`, 5.5, se escriben con ella. |

## E3 — Corte, mora, antigüedad y desglose (4 h)

**Hecho el 22/11/2026, con la revisión de `revisor-codigo` pendiente** (detalle, números y desvíos en `docs/registro.md`). Antes de empezar se cerraron las correcciones de la revisión de E2 (`diseno.md`, 11.5). Desvíos respecto de la tabla: M5 se hizo acá, con el catálogo (3.4); aparecieron `claves.ts` (las claves agrupadas, que comparten los dos caminos) y `textos.ts` (títulos, fórmulas y notas de las medidas); los fixtures de 5.3 (T02, T04, T05, T07, T08, T17) se escribieron chicos en `tests/fixtures/casos.ts` porque la semilla llega en E4; la propiedad de 3.5 se partió en dos archivos (D2 y D3) para que corran en paralelo y no hizo falta bajar de 50 semillas.

| Paso | Módulo | Tests primero | Hecho cuando |
| --- | --- | --- | --- |
| 3.1 | `dominio/corte.ts` | S1 (T05 y el fixture T14), S2 (fixture T01, T02), S3 (fixture T03, T04), S5 (las ocho direcciones de la tabla), S6 (T02 al 30/09), S7, R4 (fixture R4 y T07) y la cuenta corriente, con los fixtures de 5.5. | Verde. Es el corazón de la demo: se revisa con `revisor-codigo`. |
| 3.2 | `dominio/antiguedad.ts` | A1 (cada borde con el fixture T12 y la propiedad −400…400). | Verde. |
| 3.3 | `dominio/partidas.ts` y `dominio/agregados.ts` | **Los dos caminos, por separado** (`diseno.md`, 4.2.1): cada uno contra los números de los fixtures (T12: mora 2.238.500,00; D3: el ejemplo chico). `agregados.ts` no importa `partidas.ts` ni el saldo por comprobante. | Verde, cada camino por su cuenta. |
| 3.4 | `dominio/medidas.ts` y `dominio/controles.ts` | D1 (catálogo y `base`), `controlar` y `ErrorDeCierre`, controles cruzados X1 a X6 (D3, A2). | Verde. |
| 3.5 | Propiedad D2/D3 sobre **50 semillas × 22 cierres de mes × 15 claves × empresa y 13 clientes**, con un generador provisional mínimo. **Tres mutaciones plantadas** (D2): 1 centavo de más en una partida; 1 centavo de más en el `valor`; un saldo mal calculado en S2 sin tocar la agregación. Cada una hace fallar su control. | Verde, y cada mutación lo hace fallar. Si el test tarda más de 30 s en CI se baja a 20 semillas en CI y 50 en local, anotado en el registro. |

## E4 — Generador, casos plantados, huella y resultado de referencia (2,5 h)

El generador es simple: no fuerza ningún resultado (`diseno.md`, 5.2).

**Hecho el 22/11/2026, con la revisión de `revisor-codigo` pendiente** (detalle, números y desvíos en `docs/registro.md`, séptima parte). Antes de empezar se cerraron las correcciones de la revisión de E3 (`diseno.md`, 11.7). Desvíos respecto de la tabla: aparecieron `constantes.ts`, `pesos.ts`, `congelar.ts` y `cargar.ts` (el punto de carga con `validarDatos`, H60); la verificación independiente de 4.4 es `scripts/oraculo.mjs` (con su test); las propiedades D2 y D3 se repitieron sobre el generador real; **la semilla publicada `20261118` no cumplía «más de cinco deudores»** (eran cuatro y «Otros» no existía): se dejó como daba y quedó como pregunta para Matías (H77). **Resuelto el 25/11/2026:** Matías decidió cambiar a la semilla `20261122` (H78), con seis deudores («Otros» existe) y deuda en los cinco tramos; el criterio de 4.4 ahora se cumple.

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 4.1 | `datos/huella.ts` (FNV-1a 32 y JSON canónico) con los tres vectores del test de G1. | Verde. |
| 4.2 | `datos/clientes.ts` (los 13 clientes literales con su perfil de pago, CUIT desde el azar) y `datos/plantados.ts` (tabla 5.3 como constantes, alias → id). | Un test por caso plantado con sus importes y fechas. |
| 4.3 | `datos/generador.ts`: relleno por mes y cliente, cobros con el atraso de cada perfil (sin cobro si cae después del 31/10), numeración C2 después de juntar todo. | G1 (dos llamadas, misma huella; la huella queda fijada), G2 (un solo recibo posterior a `hasta`), G5 (validadores sobre 50 semillas). |
| 4.4 | `datos/esperado.ts` y la prueba de referencia G3: con el generador real y la semilla publicada (`20261122` desde el 25/11/2026; antes `20261118`) se calculan los valores "se fija en E4" de la sección 5.4 de `diseno.md`, **se verifican con un script independiente** y se escriben en el documento. Se confirma que C05 es el cliente con más mora y T12-d91 su comprobante más atrasado, que hay más de cinco deudores (hay "Otros"; **con `20261122` se cumple**, con `20261118` no: eran cuatro), y que los pagos a cuenta (50.000,00) y los saldos a favor (58.000,00) son los esperados. Si algo no se cumple, se ajusta la historia del recorrido o los importes de los casos, y se anota. | Verde para la semilla publicada. |
| 4.5 | Medición de G7 (< 50 ms al generar, < 20 ms por corte, con los dos caminos). | Números en el registro; test de CI con tope holgado. |

## E5 — Marco de la aplicación (4 h)

**Hecho (25/11/2026): los pasos 5.1 y 5.3 en la segunda parte del registro; el marco (5.2) y «Cómo se calcula» (5.4) en las tandas 2 y 3 de la interfaz «tipo app», y el movimiento entre pantallas en la tanda 4 (`docs/registro.md`, 25/11/2026, T4).** Detalle, números y desvíos en `docs/registro.md` (25/11/2026, segunda parte). Las decisiones propias del enrutador son H79 a H89 de `diseno.md` (11.9), pendientes de revisión.

**25/11/2026: primera tanda de la interfaz tipo app fusionada en `main`** (ramas `c0-textos`, `c0-tokens`, `c0-rutas` y `c0-modelos`, según el plan de construcción, informe interno no publicado). Puerta: 56 archivos y 2103 pruebas en verde (también en UTC, Asia/Tokyo y America/Los_Angeles), `check` con 0 errores, `buscar` sin hallazgos (15 reglas, 177 archivos), contraste 206 mediciones con 0 fallas, JS de 9,3 kB con gzip (tope 100 kB), `npm audit` sin vulnerabilidades y 60 mutaciones muertas de 60.

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 5.1 | Programador: enrutador por *hash* con parámetros (`corte`, `cliente`, `mes`, `agrupar`) y estado reactivo del corte (S5: aviso y corte por defecto). | **Hecho el 25/11/2026** (rama `e5-enrutador`). Tests de rutas válidas e inválidas; el aviso de S5 con las ocho direcciones. Desvíos: el aviso del mes (`mes=` inválido) se sumó al de S5; `ubicacion.ts` se copió de la Demo 2 (en 1.2 solo se había previsto el patrón); el texto del aviso del mes vive en `dominio/textos.ts`; 11 decisiones propias (H79 a H89). Todavía no está conectado a `App.svelte` (eso es 5.2). |
| 5.2 | **Hecho** (tandas 2 y 3 de la interfaz «tipo app»). Maquetador: marco (barra, selector de cierres de mes, "Cómo se calcula", pie con la línea de fuente de datos y el enlace a la Demo 2), avisos y la pantalla de error de cierre (D2), que solo se ve si un control falla. Con una página de muestras solo en desarrollo. | Teclado y foco al `h1` en cada cambio de ruta; corte inválido → aviso S5; contraste medido; claro y oscuro a 360 y 1280 px. |
| 5.3 | Componentes de gráfico (barras de 12 meses de facturación y cobranza, barra apilada de antigüedad) con su tabla equivalente y `aria-label`. | **Hecho el 25/11/2026** (rama `e5-graficos`). El eje empieza en 0 y un valor negativo baja del eje (con datos de prueba); sin violaciones de CSP. Desvíos: `GraficoMeses` y `ReglaTramos` traen su propia tabla y su propia caja de vacío (no existen `Tabla` ni `Vacio`); la tabla compacta de dos columnas (5.9) no está; los `ariaLabel`, el renglón de corte y el aviso «Hay datos desde…» los arma la lógica y falta (las muestras traen versiones mínimas); página de muestras solo de desarrollo (`muestras.html`), que 5.2 integra o borra. +19 tests de la escala. |
| 5.4 | **Hecho** (`ComoSeCalcula.svelte`, con su test contra las constantes). "Cómo se calcula" con los números reales (incluida la explicación de los dos cálculos y los controles cruzados) y un test que los compara con las constantes (como `textos-marco.test.ts` en la Demo 2). | Verde. |

## E6 — Pantallas (9 h)

Una por vez: primero la lógica del contenedor (programador) y después la vista (maquetador), sin pisarse en los mismos
archivos. Cada una a 360 y 1280 px, en claro y oscuro, con los números de la prueba de referencia (5.4). **Ninguna pantalla
muestra un renglón de control**: antes de mostrar una cifra se pide con `medidaControlada` (`medida` + `controlar`, H65) y, si lanza, se muestra el error.

**Estado (25/11/2026, tanda 4):** las ocho pantallas están hechas (6.1 a 6.4 y las nuevas Comprobantes, Clientes y Meses, de la interfaz «tipo app» aprobada por Matías) y llevan el movimiento entre pantallas (`docs/diseno-ui.md`, 3.6). Queda el recorrido de 2 minutos (6.5), con guion manual mientras GitHub Actions no ande, y la revisión cruzada (E7, tanda 5).

| Paso | Vista | Hecho cuando |
| --- | --- | --- |
| 6.1 (3 h) | **Resumen**: protagonista "En mora al …", cuatro cifras, gráfico de 12 meses, antigüedad, deudores con "Otros", pagos a cuenta y saldos a favor. | Con el corte por defecto muestra los valores de 5.4 (mora, comprobantes y clientes fijados en E4); cada número es un enlace a su desglose. |
| 6.2 (2,5 h) | **Cliente** (`#/cliente/C05?corte=…`): datos, saldo, mora, antigüedad, facturación de 12 meses, comprobantes con saldo, recibos y cuenta corriente. | C05 al 31/10 con su mora fijada en E4; el saldo acumulado final de la cuenta corriente coincide con su saldo neto (X4, probado en el test). |
| 6.3 (1,5 h) | **Comprobante**: cabecera, movimientos, saldo, atraso y tramo; movimientos posteriores al corte en gris. | T02 al 30/09: saldo 410.000,00, atraso 52, tramo 31–60, el cobro del 12/10 aparece en gris. **Test de vista (H58):** un comprobante emitido después del corte muestra el aviso de H10 (todavía no existe), nunca «saldado» ni un saldo en 0 (`saldoAlCorte` da 0 sin lanzar: la vista mira `existeAlCorte` antes). |
| 6.4 (2 h) | **Desglose**: fórmula en palabras y partidas con enlaces. | Todas las medidas del catálogo cierran (test); un desglose forzado a no cerrar muestra el error y no el número. |
| 6.5 | **Recorrido de 2 minutos** de punta a punta (`@playwright/test` si Actions anda, si no guion manual). | Pasa contra el *build* servido con la CSP real. |

## E7 — Revisión y correcciones (5 h)

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 7.1 | `revisor-codigo`, `qa-destructor` y `auditor-accesibilidad` en paralelo sobre todo lo anterior. | Informes en `docs/`. |
| 7.2 | Correcciones por gravedad. | Altas y medias cerradas o anotadas con decisión de Matías. |
| 7.3 | `disenador-ui` revisa contra `diseno-ui.md`; `critico-reclutador` mira como reclutador y como técnico. | Diferencias resueltas o decididas por Matías. |

## E8 — Cierre del mínimo y publicación privada (2,5 h)

| Paso | Qué | Hecho cuando |
| --- | --- | --- |
| 8.1 | README completo: qué es, enlace en vivo y captura; cómo se garantiza que las cifras cierran (los dos cálculos, los controles cruzados y la mutación plantada); las reglas principales con enlace a su test; qué hizo Matías y qué hizo la IA; cómo correrlo; límites y **origen** (qué se copió de la Demo 2). Capturas con el corte por defecto, licencia MIT. | Revisado por Matías. |
| 8.2 | Verificación de nombres inventados (que no coincidan con empresas o proyectos reales) y de que todo el historial no tenga secretos ni datos personales. **La Demo 2 ya es pública** (para poder completar `procedencia.md`). | Revisión previa a publicar pasada. |
| 8.3 | Versión privada en `*.pages.dev`, mirada por Matías; después subdominio `tablero.` y ficha en el portafolio. | Criterio de terminado de la ficha. |

## Resumen

| Etapa | Horas-agente |
| --- | --- |
| E0 diseño | 4 |
| E1 proyecto y piezas | 1,5 |
| E2 dinero, comprobantes y recibos | 3 |
| E3 corte, mora, antigüedad y desglose | 4 |
| E4 generador y casos | 2,5 |
| E5 marco | 4 |
| E6 pantallas | 9 |
| E7 revisión | 5 |
| E8 cierre | 2,5 |
| **Total del mínimo** | **unas 35 (estimación gruesa: entre 30 y 40)** |
| Extras P2 (después de publicar el mínimo, con aprobación) | CSV, corte en cualquier día (relaja S5, H1), por servicio e impresión: unas 6 |

Tiempo de Matías: unos 30 minutos para las decisiones (hechas), 30 para mirar la versión de prueba y 20 para aprobar el
README y la publicación.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un número que no cierra por punto flotante. | Tipo `Centavos` con marca, centavos enteros, búsqueda en CI de respaldo, dos cálculos independientes de cada cifra con test de propiedad D2 y mutaciones plantadas, y lanzar antes que mostrar mal. |
| Que el control compare un número consigo mismo y no pruebe nada. | Dos caminos en módulos distintos (`agregados.ts` no importa `partidas.ts`), controles cruzados y tres mutaciones que tienen que fallar. |
| Crecimiento del alcance (un tablero invita a sumar gráficos sin fin). | Tope: 4 vistas. Lo demás va a extras, con aprobación. |
| El relleno natural no deja el recorrido como se espera (C05 sin ser el que más mora, "Otros" ausente). | E4.4 lo confirma con el generador real y, si no, se ajustan los importes de los casos o la historia del recorrido. **Resuelto el 25/11/2026** con la semilla `20261122` (H78). |
| GitHub Actions no corre en la cuenta. | Resolverlo antes de E8; si no, verificación local documentada y decisión explícita (decisión 7). |
| El test de propiedad D2 tarda demasiado. | Calcular las medidas de los 13 clientes en una sola pasada; si no alcanza, bajar semillas en CI (E3.5). |
| Copias de la Demo 2 que se desvían de su origen. | `procedencia.md`; revisión al cerrar cada demo; la Demo 3 no se publica antes que la Demo 2. |
| Nombres ficticios que coinciden con empresas reales, o un CUIT con dígito verificador válido que existe. | Búsqueda antes de E8; el CUIT siempre rotulado "ficticio". |
| Datos "viejos" en 2027 por el calendario fijo. | El README dice el rango de fechas de los datos. Una v2 de datos es un cambio de una línea más la huella. |

## Cómo se retoma

Leer `CLAUDE.md`, `README.md`, este plan y la última entrada de `docs/registro.md`. Cada paso termina con tests verdes,
`npm run check` limpio y un commit en español que dice qué regla, caso o pantalla quedó hecha.
