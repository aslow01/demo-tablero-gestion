# Diseño de interfaz — Tablero de cobranzas (22/11/2026; cifras de la semilla publicada al 25/11/2026)

> **Aviso (25/11/2026): esta especificación quedó superada en navegación, estructura y aspecto** por el prototipo «tipo app» aprobado por Matías ese día y por el plan de construcción que lo lleva al repositorio (informe interno, no publicado). Donde este documento diga «cuatro vistas», «sin pestañas», «sin píldoras» o «sin animar», manda el prototipo: ocho secciones, cuatro pestañas, filtros en pastillas y una transición corta entre pantallas. Los textos nuevos están en `src/componentes/textos-marco.ts`, `src/componentes/textos-como-se-calcula.ts` y `src/lib/dominio/textos.ts`. Se reescribirá al cerrar la construcción; hasta entonces, no se usa para decidir cómo se ve ni cómo se navega. Las reglas de negocio no cambian (`docs/diseno.md`).

**Especificación para los agentes que implementan** (maquetador: marcado y CSS; programador: TypeScript, estado, rutas
y foco). Las reglas de negocio están en `docs/diseno.md` (identificadores M, C, R, S, A, D, G): este documento **no
cambia ninguna regla**, solo cómo se ve, cómo se ordena y cómo se usa. Cuando acá aparece una regla entre paréntesis (S5,
D2, M3…) es para ubicarla, no para redefinirla. Si los dos documentos dicen cosas distintas, manda `diseno.md` y se
corrige este.

Fuentes: el plan de la demo (alcance y decisiones, resumidos en la sección 11 de `diseno.md`) y el sistema visual de la
Demo 2 del mismo autor (Control de flota: su `docs/diseno-ui.md` y su `src/estilos/tokens.css`). Acá se **repiten los
valores** que hacen falta para no tener que abrir el otro repositorio. Escrito desde cero, con datos ficticios; no usa
código, datos ni documentos de terceros.

Textos de interfaz en **español neutro** (se trata al lector de usted o en forma impersonal; sin voseo). Todo dato es
ficticio. Si algo de acá no alcanza para implementar sin adivinar, es un defecto de este documento: preguntar antes de
inventar.

---

## 0. Encuadre

| | |
| --- | --- |
| **Quién lo evalúa** | (a) **Jefe o responsable de administración o cobranzas** (y el gerente de logística que pasa por la misma ficha), en la demo en vivo, en escritorio y a veces en el celular: "¿esta persona entiende facturación, cobranza y mora como yo?". (b) **Líder técnico**, en el repositorio y abriendo la demo: "¿cada número es trazable hasta el comprobante?". |
| **Quién lo usaría (ficción)** | El responsable de cobranzas de "Logística Andina Demo S.A.", una vez por semana y al cierre de cada mes: a quién llamar, por cuánto y desde cuándo. |
| **Qué se entiende en 10 segundos** | "Al 31/10/2026 hay $ 6.306.481,28 en mora, en 6 clientes, y así se reparte por antigüedad. Este mes se facturaron $ 15.705.914,00 (sin IVA) y se cobraron $ 23.847.590,51 (de lo cual, $ 152.972,81 en retenciones). Cada importe se abre." |
| **Acción principal** | Abrir un número para ver de dónde sale (el Desglose). Secundarias: entrar a un cliente, a un comprobante y cambiar la fecha de corte. |
| **Prioridad de lectura del Resumen** | 1) la mora (cuánto, qué parte, cuántos clientes); 2) de qué antigüedad es; 3) quién la debe; 4) cómo vino el mes (facturación y cobranza); 5) los 12 meses; 6) lo que hay que revisar (pagos a cuenta, saldos a favor); 7) todos los clientes. |
| **Lo que se lleva** | **Cada número se abre hasta el comprobante, y la fecha de corte mueve todo de forma coherente** (se ve en la regla de tramos). Y la demo habla su idioma: neto sin IVA, retenciones, pagos a cuenta sin imputar, saldo a favor, Debe y Haber, antigüedad en tramos. |

---

## 1. Dirección visual: "Regla de tramos"

Una herramienta de administración sobria, **de la misma familia que las Demos 1 y 2** (escritorio gris apenas cálido,
paneles blancos con barra de título, tipografía del sistema con cifras tabulares, color reservado al estado), con un
rasgo propio que sale de la pregunta central de cobranzas, **"¿desde cuándo me deben?"**: la **regla de tramos**, la
antigüedad de saldos dibujada como una regla horizontal partida en cinco tramos (No vencido, 1 a 30, 31 a 60, 61 a 90 y
Más de 90 días), del gris al rojo oscuro.

**Por qué esta (3 líneas):**
1. Nace del informe que todo jefe de cobranzas ya lee (el *aged receivables* de Xero o QuickBooks): se reconoce sin
   explicación y su vocabulario es el del evaluador.
2. Es una sola pieza que se repite en cuatro escalas con un solo sentido (cuánto hace que venció), así la demo se
   aprende una vez y se reconoce en una captura.
3. Hace visible el momento más fuerte del recorrido: al cambiar la fecha de corte, el comprobante **cambia de tramo en
   la regla** (de "Más de 90" a "31 a 60"), sin animación y sin texto extra.

Tres piezas propias:

1. **La regla de tramos** (5.6), en cuatro variantes: **completa** (Resumen: cómo se reparte el saldo a cobrar),
   **mediana** (Cliente), **mínima** (una columna de la tabla Clientes) y **ubicador** (Comprobante: los cinco tramos
   de igual ancho, solo el del comprobante pintado, y una marca en sus días de atraso).
2. **El color de tramo como hilo**: la misma muestra de color acompaña a la etiqueta de tramo en cada tabla (5.7), así
   una fila de "Deudores" y un tramo de la regla se leen como la misma cosa.
3. **Cifras exactas, siempre abribles** (5.3 y 5.4): importes al centavo con los centavos un poco más chicos, en cifras
   tabulares, y cada uno con el mismo subrayado que dice "esto se abre". Nada de "$ 2,9 M" en un número que se puede
   abrir.

Color propio: **azul tinta** como acento (enlaces, foco, botón primario, serie "Facturado"). La Demo 2 usa azul
petróleo; la Demo 3 se distingue con un azul más frío y más oscuro. Ámbar, naranja y rojo quedan **solo** para los
tramos de antigüedad: la mora es el estado normal de una cartera y no se pinta todo de rojo.

Referencias reales (para mirar cómo resuelven, no para copiar):

- **Xero, informe "Aged Receivables Summary"**, y el resumen de antigüedad de saldos de **QuickBooks**: tramos 1–30,
  31–60, 61–90 y más de 90, con el total por cliente. Es el origen de la regla y de su vocabulario.
- **Stripe Dashboard, "Balances" y "Payouts"**: cada total se abre en la lista de movimientos que lo componen; los
  centavos con menos peso visual que los enteros.
- **Our World in Data**, cualquier gráfico: la misma información como gráfico y como tabla; de ahí "Ver como tabla".
- **Financial Times, guía de gráficos (Visual Vocabulary)**: barras que empiezan en 0, ejes con pocas marcas, rótulos
  directos en lugar de leyendas lejanas.
- **GOV.UK Design System, "Summary list"**: pares rótulo-valor para la cabecera de un comprobante.
- **Linear**: densidad cómoda en tablas y foco de teclado visible sin ruido (igual que en la Demo 2).

### 1.1 Alternativas consideradas

| Dirección | Qué es | Por qué no |
| --- | --- | --- |
| B. "Tablero de indicadores" | Fila de cuatro o cinco tarjetas con cifras grandes, flechas de variación en verde y rojo, un velocímetro de mora y una dona de antigüedad. | Es el cliché del tablero (y la "fila de cifras gigantes" ya se rechazó en la web). Las flechas exigen comparar con otro período (fuera del mínimo), la dona no deja comparar tramos y nada de eso dice "se abre". |
| C. "Hoja de cálculo" | Todo en tablas densas tipo planilla, con celdas y bordes en todas partes, sin gráficos. | Honesta y parecida al trabajo diario, pero el gerente no encuentra la respuesta en 10 segundos: lee una grilla. Y no tiene nada que se reconozca en una captura. |

Elegida A: el gerente ve una frase y una regla de tramos; el técnico ve que cada cifra lleva a sus partidas y que la
regla se recalcula con la fecha de corte.

### 1.2 Qué hereda de la Demo 2 y qué es propio

| Hereda (igual o con el mismo valor) | Propio de esta demo |
| --- | --- |
| Base de color (escritorio, superficies, textos, bordes), tonos de estado `ok`, `revisar`, `diferencia`, `neutro` (3.1). | Acento azul tinta y tono `pendiente` rehecho sobre él (3.2). |
| Tipografía, escala, espaciado, radios, sombras, movimiento (3.4 a 3.6). | Escala de cinco tonos de tramo y dos series de gráfico (3.2). |
| Panel con barra de título y barra de estado (5.5). Etiqueta rectangular con texto (5.7), y la etiqueta "Demo con datos ficticios" de la barra superior. | Regla de tramos en cuatro variantes, con el ubicador del comprobante (5.6). |
| Tabla que pasa a tarjetas por consulta de contenedor (5.9). `select` "Ordenar por". | Cifra con centavos menores y cifra-enlace (5.3, 5.4). Selector de fecha de corte que se marca fuera del corte por defecto (5.2). Gráfico de 12 meses con su tabla (5.10). Línea de fuente de datos (5.11). |
| Diálogo nativo (`<dialog>`), aviso global, vacío con borde punteado, foco al `h1` sin anillo (como en la Demo 2). | Filas "Después de la fecha de corte" (5.9.3). Recibo desplegable dentro de una tabla (5.9.4). |
| Lo que NO se hace (sección 11). | Marca: una regla partida en tramos con una marca encima. |

Las piezas de la Demo 2 se copian según la lista de `docs/stack.md` (`tokens.css`, `base.css`, `Panel`, `Etiqueta`,
`Aviso`, `Boton`, sprite de íconos, `scripts/contraste.mjs`), con el acento y los tonos de esta sección.

### 1.3 Diferencia con lo rechazado en la web del portafolio

No usa ninguna de las siete direcciones rechazadas ni sus piezas: ni mapa, ni hoja de ruta, ni remitos, ni sellos de
goma, ni papel rayado ni textura de libro contable, ni máquina de escribir, ni animaciones de entrada de las cifras o de los gráficos (sí hay una transición corta al cambiar de pantalla, 3.6), ni violeta, ni
vidrio, ni gradientes, ni bento, ni fila de tres cifras gigantes. La regla de tramos es un `div` con `span` de color
plano (y en el ubicador, una marca de 2 px), no una ilustración.

---

## 2. Rutas y estructura de la aplicación

Una sola página con rutas por *hash* (como la Demo 2). La fecha de corte va **siempre** en la dirección: cada número
tiene su enlace permanente y se puede mandar por correo.

| Ruta | Vista | `h1` |
| --- | --- | --- |
| `#/?corte=2026-10-31` (por defecto; `#/` sin corte = corte por defecto) | Resumen | "Cobranzas al 31/10/2026" |
| `#/cliente/C05?corte=…` | Cliente | razón social ("Contratista Los Algarrobos Demo S.A.") |
| `#/comprobante/1-0003-{número}?corte=…` | Comprobante | "Factura A 0003-{número}" (el número lo da la numeración del generador, `diseno.md` 5.2) |
| `#/desglose/{clave}?corte=…[&cliente=C05][&mes=2026-05]` | Desglose | título de la medida ("En mora al 31/10/2026") |

Tope: **cuatro vistas**. Recibos, tramos y meses no tienen vista propia: se ven dentro de estas (5.9.4, 5.6, 5.10).
Si `diseno.md` conserva `agrupar=no`, la ruta lo respeta (partidas planas con su columna Cliente), pero **la interfaz no
lo ofrece con un enlace** (6.4).

- **`document.title`** = "{h1} · Tablero de cobranzas (demo)". En el Desglose: "Desglose: {título} · Tablero de
  cobranzas (demo)".
- **Cambio de vista o de sujeto** (cambia la ruta, el cliente, el comprobante, la clave, `cliente=` o `mes=`): el foco va
  al `h1` (`tabindex="-1"`), la página sube al principio sin desplazamiento suave y el `h1` **no dibuja anillo**
  (`h1[tabindex="-1"]:focus { outline: none; }`, la misma excepción de la Demo 2).
- **Cambio solo de `corte`** (misma vista, mismo sujeto): **el foco no se mueve** y la página no se desplaza. Una región
  `role="status"` lo anuncia (5.2). Es lo que pide WCAG 3.2.2: elegir un valor en un control no cambia de contexto.
- **Historial:** cada cambio (de vista o de corte) es una entrada nueva (`location.hash = …`): "Atrás" deshace el último
  cambio, incluido el de corte. Así cada estado que se ve tiene su dirección.
- **Ruta desconocida, cliente, comprobante o clave inexistentes:** estado de error de la vista (8.2), nunca una página
  en blanco.
- **Corte inválido o fuera de rango (S5):** se muestra el corte por defecto, la dirección se corrige con
  `history.replaceState` (sin entrada nueva) y aparece el aviso global de 5.12.

**Cómo se lee una dirección escrita a mano** (lo resuelve el enrutador; `diseno.md` 11.9, H79 a H89; acá solo lo que se
ve):

| Caso | Qué se ve | Dirección |
| --- | --- | --- |
| `#/` sin corte (H79) | Resumen al 31/10/2026, sin aviso. | **No se reescribe**. Los enlaces que arma la demo llevan siempre `corte`, también el por defecto. |
| Corte inválido (S5) en una ruta que existe (H80) | La vista con el corte por defecto y el aviso del corte. | Se corrige con `replaceState`. |
| Corte inválido en una ruta desconocida o inexistente (H80) | El error de la vista (8.2) **y** el aviso del corte. | No se corrige: no hay dirección buena que poner. |
| `mes=` mal escrito, repetido o fuera de rango en una medida del mes (H82) | El mes del corte y el aviso del mes. Con el corte también inválido, los dos avisos (5.12). | Se corrige con `replaceState`. |
| `mes=` en una medida que no es del mes; `cliente=` fuera del Desglose; `agrupar` con un valor que no es `no`; parámetros desconocidos (H81 a H83) | Como si no estuvieran, sin aviso. | No se corrige. |
| `cliente=` vacío, repetido o de un cliente que no existe, en el Desglose (H81) | Error "desglose inexistente" (8.2). | No se corrige. |
| `mora-otros` en un corte con 5 deudores o menos (H85) | Error "desglose inexistente" (8.2). | No se corrige. |
| `mora-otros` con `cliente=` (escrita a mano: la interfaz nunca arma ese enlace, 6.4) | Error "desglose inexistente" (8.2). Resuelto en el enrutador (H90 de `diseno.md`). | No se corrige. |
| Comprobante emitido después del corte (H86) | La vista Comprobante con su estado de error "posterior al corte" (7.2). | Sin cambios. |
| Más de 200 caracteres (H84) | Error "Esta dirección no existe", con el corte por defecto y **sin** aviso. | No se corrige. |

- **Nunca se repite en pantalla lo que vino escrito en la dirección** (ni el id de cliente o de comprobante, ni la
  clave, ni el mes, ni el corte mal escritos): los errores dicen qué falló, no qué se escribió (7.2). Lo que sí aparece
  (el corte y el mes que se muestran) sale de los datos, no de la dirección.
- **Avisos (H88):** duran hasta que cambia el corte o la vista, o hasta que se los cierra (5.12).

**Una regla de navegación, en todas las tablas y textos** (se aprende una vez):

| Lo que se pulsa | Adónde lleva |
| --- | --- |
| **Nombre de un cliente** (en cualquier tabla, bajada o tarjeta) | Siempre a la vista **Cliente**, con el mismo corte. |
| **Importe subrayado** (cifra-enlace) | Siempre a su **Desglose**; en una fila de cliente, al desglose de esa medida **filtrado por ese cliente** (`&cliente=`). Única excepción: en el desglose de "Otros", a `mora` con `&cliente=` (6.4). |
| **Número de comprobante** ("FA 0003-…") | Siempre a la vista **Comprobante**. |
| **Número de recibo** ("R-0003-…") | Despliega el recibo en su lugar (5.9.4): no navega. |
| **Migas** | Solo para **subir** un nivel o volver al Resumen. Ningún paso del recorrido depende de una miga para bajar. |

Orden del DOM (= orden de tabulación): "Ir al contenido" → `header` (barra superior; barra de la aplicación con el corte
y "Cómo se calcula"; avisos globales) → `main#principal` → `footer`.
---

## 3. Tokens

Propiedades personalizadas en `:root`, bloque oscuro en `@media (prefers-color-scheme: dark)`. Sin selector de tema
(como las Demos 1 y 2: sigue al dispositivo). Prefijos: `--c-` color, `--t-` tipografía, `--e-` espaciado, `--r-`
radio, `--s-` sombra, `--m-` movimiento. Se parte del `tokens.css` de la Demo 2 (copiado, ver `docs/stack.md`) y se
cambian o agregan solo los valores de esta sección.

### 3.1 Color heredado (mismos valores que la Demo 2)

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--c-escritorio` | `#E9EAE3` | `#0C0E10` | Fondo de `body`, barra superior y pie. |
| `--c-fondo` | `#F5F5F1` | `#111417` | Zonas hundidas: filas "Después de la fecha de corte", detalle desplegado de un recibo. |
| `--c-superficie` | `#FFFFFF` | `#181C20` | Paneles, tablas, diálogos, gráficos. |
| `--c-superficie-2` | `#EEEEE8` | `#20252A` | Cabecera de tabla, hover de fila, pista de la regla, tramos apagados del ubicador, banda del mes de corte en el gráfico. |
| `--c-ventana-barra` | `#F6F6F2` | `#1D2226` | Barras de título y de estado de paneles y diálogos. |
| `--c-ventana-borde` | `#CBCCC3` | `#343B42` | Marco de panel. |
| `--c-ventana-control-hover` | `#E7E8E1` | `#2A3036` | Hover de botones de ícono. |
| `--c-texto` | `#1C1F23` | `#E8EBED` | Texto principal, cifras, marca del ubicador. |
| `--c-texto-2` | `#4D545B` | `#AEB6BD` | Secundario, centavos de las cifras grandes, filas posteriores al corte. |
| `--c-texto-3` | `#62686F` | `#8F98A0` | Ayudas, rótulos, marcas de eje y de la regla (nunca menos de 13 px salvo rótulos de 12 px en mayúsculas). |
| `--c-borde` | `#DCDDD5` | `#2D3339` | Separadores, líneas de grilla del gráfico, borde de los tramos apagados del ubicador. |
| `--c-borde-fuerte` | `#7D8288` | `#6E777F` | Borde de controles (`select`, botones secundarios), línea superior del total de una tabla, rayitas de la regla del ubicador. |

Tonos de estado (texto `-t`, fondo `-f`, franja o marca `-r`), mismos valores que la Demo 2 salvo `pendiente`:

| Tono | Claro t / f / r | Oscuro t / f / r | Uso en esta demo |
| --- | --- | --- | --- |
| `ok` | `#1D6A39` / `#E3F1E7` / `#2F8A50` | `#86D6A1` / `#16301F` / `#45B26E` | Etiqueta "Cancelado" (comprobante con saldo 0 al corte). |
| `revisar` | `#774700` / `#FBEED3` / `#B57A06` | `#F1C46E` / `#33280F` / `#D9A030` | Etiquetas de 1–30 y 31–60 días, "Revisar imputación", aviso S5, **selector de corte marcado** (5.2). |
| `diferencia` | `#9E2620` / `#FAE5E2` / `#C4372E` | `#F59B91` / `#3A1B18` / `#E2665B` | Etiquetas de 61–90 y Más de 90 días, error de la demo (8.1). |
| `neutro` | `#4D545B` / `#ECEDE7` / `#8E949A` | `#AEB6BD` / `#23282D` / `#7A838B` | "No vencido", "Después de la fecha de corte", "Anulada por NC", tipo de comprobante. |
| `pendiente` | **`#1D4F84` / `#E6EEF7` / `#1F5A96`** | **`#A9CBF0` / `#16263A` / `#8CB8E8`** | Saldo a favor, pago a cuenta (como dato, no como alerta). Rehecho sobre el azul tinta. |

### 3.2 Color propio de esta demo

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--c-acento` | `#1F5A96` | `#8CB8E8` | Enlaces, subrayado de cifra-enlace, botón primario, serie "Facturado", línea elegida. |
| `--c-acento-hover` | `#17497C` | `#AACBF0` | Hover y activo del primario y de los enlaces. |
| `--c-acento-texto` | `#FFFFFF` | `#0B1A2A` | Texto sobre acento. |
| `--c-acento-suave` | `#E6EEF7` | `#16263A` | Hover de cifra-enlace dentro de tablas (= `--c-pendiente-f`). |
| `--c-foco` | `#1F5A96` | `#8CB8E8` | Anillo de foco (= acento). |
| `--c-serie-facturado` | `#1F5A96` | `#8CB8E8` | Barras "Facturado" (= acento). |
| `--c-serie-cobrado` | `#737A80` | `#7F8890` | Barras "Cobrado" (valores de `tokens.css`; el oscuro subió de `#6E777F` el 26/11/2026: 3,27 a 4,13 sobre la banda del mes de corte). Gris: se distingue del azul por saturación y luminosidad, **y además por la trama y el ribete** (5.10): azul y gris pegados contrastan 1,63 (claro) y 2,20 (oscuro), así que el color no es el único canal. |
| `--c-tramo-0` | `#737980` | **`#6B747C`** | No vencido (gris: no es mora todavía). |
| `--c-tramo-1` | `#A97C00` | **`#8F711F`** | 1 a 30 días. |
| `--c-tramo-2` | `#C45A12` | **`#C86A2E`** | 31 a 60 días. |
| `--c-tramo-3` | `#B8312A` | **`#EB665C`** | 61 a 90 días. |
| `--c-tramo-4` | `#7A1A16` | **`#FF9A90`** | Más de 90 días. |
| `--c-velo` | `rgb(12 14 16 / .45)` | `rgb(0 0 0 / .6)` | `::backdrop` del diálogo. |

**Escala de antigüedad:** de ámbar a rojo, con **el contraste contra el fondo creciendo con la gravedad en los dos
modos** (en claro, cada tramo es más oscuro que el anterior; en oscuro, cada tramo es **más claro** que el anterior). Así
"Más de 90 días" es siempre lo que más se ve y el orden se lee también en escala de grises o con daltonismo rojo-verde.
Entre tramos vecinos el contraste es bajo (claro 1,16 a 1,77; oscuro 1,19 a 1,56): por eso **nunca** se distinguen solo
por color: van separados por 2 px de pista, siempre en el mismo orden de izquierda a derecha y con su rótulo escrito
(5.6). El tramo 0 es gris a propósito: lo no vencido no es mora, y queda fuera de la progresión.

Se borran del `tokens.css` copiado los tokens que esta demo no usa (`--c-edicion`, `--c-patente-*`, `--c-hoy`,
`--c-mes-r`, los alias `critico`, `semana`, `quincena`, `mes`, `vigente`, `--alto-barra-envio`, `--alto-segmento`,
`--ancho-parte`, `--t-patente-*`, `--c-peligro-*`): no hay patentes, ni parte diario, ni acciones destructivas.

### 3.3 Contrastes calculados sobre los tokens

Calculados el 22/11/2026 **sobre los valores de 3.1 y 3.2** (todavía no hay CSS), con la fórmula de luminancia relativa
de WCAG 2.x de `scripts/contraste.mjs` de la Demo 2. Ese script se copia en E1 con esta lista de pares y **se vuelve a
correr sobre lo maquetado** en E5 y E7: los valores de acá son de la paleta, no una medición de la página.

| Par | Claro | Oscuro | Mínimo |
| --- | --- | --- | --- |
| texto · texto-2 · texto-3 / superficie | 16,54 · 7,68 · 5,63 | 14,31 · 8,34 · 5,85 | 4,5 |
| texto · texto-2 · texto-3 / superficie-2 | 14,20 · 6,59 · 4,84 | 12,90 · 7,52 · 5,27 | 4,5 |
| texto · texto-2 · texto-3 / escritorio | 13,66 · 6,34 · 4,65 | 16,15 · 9,42 · 6,60 | 4,5 |
| texto-2 · texto-3 / fondo (filas posteriores al corte) | 7,03 · 5,15 | 9,00 · 6,31 | 4,5 |
| texto-2 · texto-3 / ventana-barra | 7,09 · 5,20 | 7,81 · 5,47 | 4,5 |
| acento (enlace) / superficie · superficie-2 · escritorio · ventana-barra | 7,09 · 6,09 · 5,86 · 6,55 | 8,27 · 7,46 · 9,33 · 7,74 | 4,5 |
| acento / acento-suave (hover de cifra-enlace) · texto / acento-suave | 6,06 · 14,13 | 7,39 · 12,78 | 4,5 |
| acento-texto / acento · / acento-hover (botón primario) | 7,09 · 9,21 | 8,48 · 10,46 | 4,5 |
| borde-fuerte / superficie · superficie-2 (controles, total de tabla, rayitas de la regla) | 3,87 · 3,33 | 3,76 · 3,39 | 3 |
| etiqueta t / f: ok · revisar · diferencia · neutro · pendiente | 5,67 · 6,80 · 6,31 · 6,52 · 7,16 | 8,23 · 8,86 · 7,39 · 7,24 · 9,10 | 4,5 |
| tono t / ventana-barra (conteos en barras): ok · rev · dif · neu · pend | 6,11 · 7,22 · 7,04 · 7,09 · 7,74 | 9,28 · 9,82 · 7,62 · 7,81 · 9,54 | 4,5 |
| **tramo / superficie:** 0 · 1 · 2 · 3 · 4 | 4,40 · 3,77 · 4,36 · 5,98 · 10,57 | **3,60 · 3,71 · 4,53 · 5,37 · 8,38** | 3 (no texto) |
| **tramo / superficie-2 (pista):** 0 · 1 · 2 · 3 · 4 | 3,78 · 3,24 · 3,74 · 5,14 · 9,07 | **3,25 · 3,35 · 4,09 · 4,85 · 7,56** | 3 (no texto) |
| **marca del ubicador** (texto) / superficie · superficie-2 | 16,54 · 14,20 | 14,31 · 12,90 | 3 |
| **selector marcado:** borde revisar-r / superficie · superficie-2 | 3,65 · 3,14 | 7,36 · 6,64 | 3 |
| **selector marcado:** rótulo texto-2 / revisar-f · texto / revisar-f | 6,68 · 14,39 | 7,05 · 12,08 | 4,5 |
| **selector marcado:** borde-fuerte / revisar-f (borde del `select` y de las flechas) · foco / revisar-f | 3,37 · 6,17 | 3,18 · 6,99 | 3 |
| **serie / superficie:** facturado · cobrado | 6,90 · 4,23 | 8,35 · 4,80 | 3 (no texto) |
| **serie / superficie-2 (banda del mes de corte):** facturado · cobrado | 5,65 · 3,46 | 7,18 · 4,13 | 3 (no texto) |
| foco / superficie · superficie-2 · escritorio | 7,09 · 6,09 · 5,86 | 8,27 · 7,46 · 9,33 | 3 |
| foco / fondos de tono -f (anillo sobre una etiqueta) | 5,87 a 6,17 | 6,86 a 7,51 | 3 |

**Rampa de tramos en oscuro (corrección del 22/11):** la anterior (`#D8B04A`, `#E8874A`, `#E8615A`, `#D9453B`) daba
8,34 · 6,52 · 5,13 · 3,97: "Más de 90" era el tramo **menos** visible. La nueva da 3,71 · 4,53 · 5,37 · 8,38, creciente
como en claro (3,77 · 4,36 · 5,98 · 10,57).

Regla: **el color nunca va solo** (1.4.1). Cada tramo tiene su rótulo escrito; cada serie del gráfico, su leyenda pegada
y su columna en la tabla; cada etiqueta, su texto; el selector marcado, el botón "Volver al 31/10/2026" y la fecha en el
`h1`.

### 3.4 Tipografía (heredada de la Demo 2, con dos usos nuevos)

Sin fuentes externas (CSP `font-src 'self'`; no hace falta ninguna fuente propia).

```
--t-familia: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif;
--t-familia-titulo: "Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif;
--t-mono: ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

| Token | Tamaño | Alto de línea | Peso | Uso |
| --- | --- | --- | --- | --- |
| `--t-cifra` | `clamp(2rem, 1.45rem + 2.4vw, 3.25rem)` | 1.05 | 700 | **Cambia:** cifra protagonista (la mora). Mínimo 2rem para que una cifra de nueve dígitos enteros ("$ 999.999.999,99") entre en 296 px (5.3). `letter-spacing: -0.02em`. |
| `--t-cifra-2` | `1.5rem` (`1.375rem` a < 40rem) | 1.15 | 650 | **Nuevo:** cifras del bloque "Movimiento del mes", saldo a cobrar, saldo de un comprobante, valor del Desglose debajo de su `h1`. |
| `--t-h1` | `clamp(1.75rem, 1.35rem + 1.8vw, 2.5rem)` | 1.15 | 700 | Título de vista. |
| `--t-h2` | `1.375rem` | 1.25 | 650 (600 sin fuente variable) | Títulos fuera de panel (casi no se usan). |
| `--t-h3` | `1.125rem` | 1.3 | 600 | Grupos dentro de un panel. |
| `--t-cuerpo` | `1rem` | 1.5 | 400 | Texto general. |
| `--t-tabla` | `0.875rem` | 1.4 | 400 | Celdas. |
| `--t-chico` | `0.8125rem` | 1.4 | 400/600 | Etiquetas, ayudas, segunda línea, rótulos del gráfico y de la regla. |
| `--t-rotulo` | `0.75rem` | 1.3 | 600 | Cabeceras de tabla, rótulos en mayúsculas (`letter-spacing: 0.06em`). Solo ahí. |
| **`--t-centavos`** | `0.62em` del contexto | — | el del contexto | **Nuevo:** parte decimal de `--t-cifra` y `--t-cifra-2` (",00"), en `--c-texto-2`, misma línea base. **Solo** en esas dos cifras; en tablas y textos los centavos van del mismo tamaño. |

Cifras (importes, porcentajes, días, conteos, fechas en tablas): siempre `font-variant-numeric: tabular-nums
lining-nums`. Códigos (número de comprobante "0003-00000123", recibo "R-0003-00000045", CUIT): `--t-mono`. Importes en
tablas: alineados a la derecha, `white-space: nowrap`. Párrafos: `max-width: 62ch`.

**Formato** (lo da la lógica, `es-AR`; acá solo para que el maquetador sepa qué espera): `$ 1.234,56` con espacio duro
entre el signo y la cifra; negativo `−$ 1.234,56` (signo menos U+2212, no guion, y **sin rojo**: negativo no es mora,
M1); porcentaje `44,9 %` con espacio duro; total 0 → `—` (M3); fechas `dd/mm/aaaa`; meses en títulos "octubre de 2026",
cortos "oct. 2026", en el eje "oct".

### 3.5 Espaciado, radios, sombras (heredados)

- Espaciado base 4 px: `--e-1: .25rem; --e-2: .5rem; --e-3: .75rem; --e-4: 1rem; --e-5: 1.5rem; --e-6: 2rem; --e-7: 3rem; --e-8: 4rem;`
- Medianil lateral (`--gutter`): 16 px (< 40rem), 24 px (40–68.74rem), 32 px (≥ 68.75rem). Ancho máximo del contenido:
  `76rem`.
- Entre paneles: `--e-5` (≥ 40rem) / `--e-4` (< 40rem). Relleno interior de panel: `--e-5` (≥ 68.75rem) / `--e-4` /
  `--e-3` (< 24rem de contenedor).
- Radios: `--r-1: 4px` (etiquetas, muestras de color) · `--r-2: 6px` (botones, `select`, grupo del corte) · `--r-3:
  10px` (paneles) · `--r-4: 14px` (diálogos). **Sin píldoras.** La regla de tramos, el ubicador y las barras del gráfico
  **sin radio** (un extremo redondeado hace que un importe chico parezca más chico).
- Sombras: `--s-ventana` en paneles y `--s-flotante` en diálogos, con los valores de la Demo 2 (claro
  `0 1px 2px rgb(16 24 32 / .06), 0 6px 16px -4px rgb(16 24 32 / .10)` / oscuro
  `inset 0 1px 0 rgb(255 255 255 / .03), 0 8px 20px -6px rgb(0 0 0 / .6)`; flotante claro
  `0 8px 24px rgb(16 24 32 / .16), 0 2px 6px rgb(16 24 32 / .08)` / oscuro `0 8px 24px rgb(0 0 0 / .5), 0 0 0 1px #2D3339`).
- `--alto-tactil: 2.75rem` (44 px, mínimo de todo lo que se pulsa salvo cifras-enlace dentro de texto corrido y de
  tablas, que miden al menos 24 px de alto: 2.5.8).

### 3.6 Movimiento (heredado)

`--m-rapido: 120ms; --m-medio: 200ms; --m-lento: 320ms; --m-curva: cubic-bezier(.2, .7, .2, 1);`

- Hover y foco: `--m-rapido`. Diálogo: opacidad en `--m-medio`; hoja inferior a < 40rem sube en `--m-lento`.
- **Al cambiar el corte no se anima nada**: ni barras que crecen, ni cifras que cuentan, ni la marca del ubicador que se
  desliza, ni destellos. Los números, el tramo pintado y la marca cambian de una vez; el anuncio lo hace la región de
  estado (5.2) y lo que se marca es el selector.
- **Al cambiar de pantalla** (no de corte, ni de filtro, ni una búsqueda, ni un ancla) hay una transición corta, aprobada con el prototipo
  «tipo app» del 25/11/2026: la pantalla (`main`) sale en 110 ms con un fundido y entra en 230 ms subiendo 10 px; el lateral, las barras y el
  pie no se mueven. El número de un comprobante o el nombre de un cliente **viaja** de la tabla (o de la bajada) al título en 320 ms, solo
  cuando se llegó pulsándolo (no con «Atrás»). Es `document.startViewTransition`: el estado cambia dentro de la devolución del navegador y
  se espera el dibujo de Svelte antes de la foto de «después» (`src/lib/estado/transicion.ts`); los nombres de transición se activan con una
  clase en la raíz y un atributo, y las reglas están en `src/estilos/movimiento.css` (`stack.md`, sección 3, regla 4). Las barras fijas tienen
  nombre propio para que la foto de la pantalla, que es más alta que la ventana, no las tape. Solo en Chrome y Chromium (el agente de usuario dice «Chrome/» o «Chromium/» y no «CriOS/», «FxiOS/», «EdgiOS/» ni «OPiOS/»; `usaViewTransitions`): en Safari, en Firefox,
  en los navegadores de iPhone, con un agente desconocido o vacío y sin la API entra una animación de CSS
  equivalente, con el mismo resultado final (foco, título, anuncio, página arriba). Mientras dura, no corre ninguna transición de CSS.
- `@media (prefers-reduced-motion: reduce)`: nada de lo anterior (ni transición, ni nombres, ni entrada), y transiciones y animaciones a
  `0.01ms`, sin subida de la hoja. Se lee en cada cambio de pantalla, no una sola vez.
- Prohibido: contadores animados (una cifra que cuenta muestra importes falsos mientras cuenta), barras que "crecen" al aparecer, animaciones
  al desplazar, parpadeos, rebotes.

---

## 4. El marco (común a las cuatro vistas)

### 4.1 Barra superior (`header`, fondo `--c-escritorio`, `min-height: 56px`, no fija)

| Ancho | Contenido |
| --- | --- |
| ≥ 40rem | Izquierda: ícono `i-marca` (20 px, trazo `--c-acento`) + "Tablero de cobranzas" (`--t-cuerpo` 600) + etiqueta **"Demo con datos ficticios"** (la de la Demo 2: `--t-rotulo` mayúsculas, `--c-texto-2`, borde 1 px `--c-borde-fuerte`, `--r-1`, relleno `0 .375rem`, alto 1.375rem). Derecha: enlace "← Volver al portafolio" (≥ 56rem) o "← Portafolio" (40–56rem). |
| < 40rem | Marca + "Tablero de cobranzas" + "← Portafolio". La etiqueta baja al encabezado de cada vista (arriba del `h1`), como en la Demo 2. |

La etiqueta **no lleva fecha** (así nunca queda una fecha fija pegada a la fecha de corte elegida del `h1`). Fila
`display: flex; flex-wrap: wrap; align-items: center; column-gap: var(--e-3); row-gap: var(--e-1);`; la etiqueta lleva
`white-space: normal; max-width: 100%`. La marca no es un enlace. Favicon: `i-marca` como SVG en `data:` (la CSP
permite `img-src data:`).

### 4.2 Barra de la aplicación (fondo `--c-superficie`, borde inferior `--c-borde`, `min-height: 52px`)

```
 ≥ 56rem, corte por defecto:
 │ Empresa: Logística Andina Demo S.A. (ficticia)          Fecha de corte [‹][ 31/10/2026 ▾ ][›]      (?) Cómo se calcula │
 ≥ 56rem, otro corte (grupo marcado, 5.2):
 │ Empresa: Logística Andina Demo S.A. (ficticia)   ┌Fecha de corte [‹][ 30/09/2026 ▾ ][›]┐ Volver al 31/10/2026  (?) Cómo se calcula │
 < 40rem:
 │ Fecha de corte                                 │
 │ [‹][ 31/10/2026               ▾ ][›]       (?) │
 │ Volver al 31/10/2026                           │   ← solo si el corte no es el por defecto
```

- **Izquierda (≥ 56rem):** "Empresa: Logística Andina Demo S.A. (ficticia)" en `--t-chico` `--c-texto-2`. A < 56rem
  pasa a la bajada del Resumen (6.1) y desaparece de la barra (en Cliente, Comprobante y Desglose no hace falta: las
  migas ya ubican).
- **Derecha:** selector de fecha de corte (5.2) y "Cómo se calcula": botón-texto con `i-ayuda` desde 40rem; a < 40rem
  solo el ícono (botón de 44 × 44, nombre accesible "Cómo se calcula"). Siempre el último control de la barra, en el
  mismo lugar en todas las vistas (WCAG 3.2.6, ayuda consistente).
- No hay pestañas de navegación: hay una sola sección de primer nivel (Resumen). La ubicación la dan las migas, dentro de
  `main` (4.4).

### 4.3 Avisos globales (debajo de la barra de la aplicación, dentro del ancho máximo)

Dos variantes del mismo aviso (5.12): corte inválido (S5) y, en el Desglose de una medida del mes, mes inválido
(`diseno.md`, 4.3). Nunca los dos a la vez.

### 4.4 Encabezado de vista (dentro de `main`)

```
 Resumen / Contratista Los Algarrobos Demo S.A. / Factura A 0003-{número}   ← migas, nav aria-label="Ruta" (no en el Resumen)
 [DEMO CON DATOS FICTICIOS]                                                 ← solo < 40rem
 Factura A 0003-{número}                                                    ← h1
 Contratista Los Algarrobos Demo S.A. · al 31/10/2026                       ← bajada, --t-chico --c-texto-2 (el nombre es enlace a Cliente)
```

- **Migas:** `nav aria-label="Ruta"` con `ol`; separador "/" en `--c-texto-3` dibujado con CSS (`::before`), no en el
  texto; la última es el lugar actual (`aria-current="page"`, sin enlace). Cada miga conserva el corte en su enlace. A
  < 40rem se muestra **solo la miga anterior** como "‹ {nombre}" (enlace, 44 px de alto). Son para **subir**:
  - Cliente: "Resumen / {Cliente}".
  - Comprobante: "Resumen / {Cliente} / {Comprobante}" (el comprobante es del cliente: subir al cliente es subir).
    Si se llegó desde la lista de Comprobantes: "Comprobantes / {Comprobante}". Si se llegó desde un desglose (un clic en
    una partida): el camino de ese desglose y el comprobante, "Resumen / {Título corto} / {Comprobante}" (con `cliente=`:
    "Resumen / {Título corto} / {Cliente} / {Comprobante}"; con una medida del mes, "Meses / …"); la miga de ese desglose
    lleva de vuelta a él, con su filtro. El menú marca la misma sección que dice la primera miga (Comprobantes, Resumen
    o Meses en esos casos; Clientes si se llegó de otro lado o con un enlace directo, que no tiene origen).
    El origen se mira en el recorrido de la sesión, saltando clientes y comprobantes; se pierde al recargar.
    Límites conocidos: (1) si se abre un comprobante desde un desglose, se va a la lista de Comprobantes con el menú y se
    abre el mismo comprobante, el recorrido lo toma como un «Atrás» y la miga sigue mostrando el desglose de antes; (2) si
    el origen es el desglose de «Otros» y desde el comprobante se cambia a un cierre que no tiene «Otros», la miga y el
    menú pasan a Clientes.
  - Desglose de toda la empresa: "Resumen / {Título corto de la medida}" ("En mora").
  - Desglose con `cliente=`: "Resumen / {Título corto} / {Cliente}": la miga del medio lleva al **mismo desglose sin el
    filtro** (es el nivel de arriba); el nombre del cliente en la bajada lleva a la vista Cliente (regla de la sección 2).
  - Desglose con `mes=`: "Resumen / {Título con el mes}" ("Facturación de mayo de 2026").
- **La fecha de corte aparece siempre en el `h1` o en la bajada**: nunca hay una cifra en pantalla sin que se vea "al
  dd/mm/aaaa" en el encabezado.

### 4.5 Pie

Fondo `--c-escritorio`, borde superior `--c-borde`, `--t-chico`, `--c-texto-2`, relleno `--e-5` vertical. Cuatro
renglones de texto común (sin monoespaciada, sin marcos, sin íconos):

1. **Fuente de los datos** (5.11): "Datos ficticios de ejemplo, de enero de 2025 a octubre de 2026."
2. "Demo escrita desde cero, con datos ficticios de una empresa inventada (Logística Andina Demo S.A.); no usa código,
   datos ni documentos de terceros. No usa servidor: todo se calcula en este navegador."
3. "Otra demo con la misma empresa ficticia: Control de flota" (enlace) · "Código fuente" (oculto mientras el
   repositorio sea privado) · "Volver al portafolio".
4. "Concebido, diseñado y dirigido por Matías Ariel Ormeño; desarrollado con IA."

**Prohibido** en el pie y en cualquier texto: decir que la demo reproduce el sistema de una empresa, nombrar empleadores
o clientes reales, mostrar semilla, huella o versión del conjunto de datos (van en el README y en las pruebas).

---

## 5. Componentes

Estados comunes: normal, hover (solo dentro de `@media (hover: hover)`), foco visible, activo y los propios de cada uno.
**Foco visible en todo lo operable:** `outline: 2px solid var(--c-foco); outline-offset: 2px;`. Nunca `outline: none`
sin reemplazo (única excepción: el `h1[tabindex="-1"]`, sección 2). En `@media (forced-colors: active)` el foco usa
`outline-color: Highlight`. Ningún contenedor lleva `overflow: hidden` (cortaría anillos), salvo los envoltorios de
tablas indicados.

### 5.1 Botones (heredados)

| Variante | Normal | Hover | Activo | Deshabilitado |
| --- | --- | --- | --- | --- |
| Primario | fondo `--c-acento`, texto `--c-acento-texto`, 600 | `--c-acento-hover` | `translateY(1px)` | No se usa. |
| Secundario | `--c-superficie`, borde `--c-borde-fuerte`, texto `--c-texto` | `--c-superficie-2` | ídem | Solo en las flechas del corte (5.2). |
| Texto | sin fondo, `--c-acento`, subrayado 1 px, `text-underline-offset: 3px`, `padding-inline: 0` | subrayado 2 px | — | — |
| Ícono | 44 × 44, caja visual 2rem, ícono 18–20 px `--c-texto-2` | fondo `--c-ventana-control-hover`, ícono `--c-texto` | ídem | ver 5.2 |
| Desplegable (recibo, 5.9.4) | como Texto, con `i-chevron` 16 px a la izquierda que gira 90° con `aria-expanded="true"` (sin transición si hay movimiento reducido) | ídem | — | — |

Tamaño normal `min-height: 2.75rem`, relleno `0 1rem`. **No hay botones de peligro**: la demo es de solo lectura.

### 5.2 Selector de fecha de corte

```
 corte por defecto:
 Fecha de corte  [ ‹ ] [ 31/10/2026          ▾ ] [ › ]
                  44px   select nativo, min 9.5rem  44px

 otro corte (grupo marcado + botón para volver):
 ┌─────────────────────────────────────────────────────────┐
 │ Fecha de corte  [ ‹ ] [ 30/09/2026          ▾ ] [ › ]   │   ← fondo --c-revisar-f, borde 1px --c-revisar-r, --r-2
 └─────────────────────────────────────────────────────────┘
   Volver al 31/10/2026                                         ← botón-texto, fuera del grupo
```

- **Marcado:** `div.corte` con `label for="corte"` visible "Fecha de corte" (`--t-chico` 600 `--c-texto-2`) + `button`
  "‹" + `select#corte` + `button` "›". `display: flex; gap: var(--e-1); align-items: center`.
- **Opciones:** los 22 cierres de mes, del más nuevo al más viejo, agrupados por año (`optgroup label="2026"`,
  `"2025"`). Texto de cada opción: solo la fecha, "31/10/2026" (**sin** "(por defecto)": no entra en el `select` cerrado
  a 360 px y "Volver al 31/10/2026" ya dice cuál es el por defecto). El valor es la fecha ISO (`2026-10-31`).
- **`select`:** alto 2.75rem, borde 1 px `--c-borde-fuerte`, `--r-2`, fondo `--c-superficie`, texto `--t-cuerpo`
  cifras tabulares, flecha nativa (`appearance: auto`; no se dibuja una propia). Hover: borde `--c-texto-2`. Foco:
  anillo estándar.
- **Flechas:** botones de ícono (`i-chevron-izq`, `i-chevron-der`) con borde como el secundario y fondo
  `--c-superficie`. Nombre accesible con el destino: "Cierre anterior: 30/09/2026" / "Cierre siguiente: 30/11/2026"… En
  el primer o el último cierre la flecha correspondiente queda `disabled` (ícono `--c-texto-3`, borde `--c-borde`,
  `cursor: not-allowed`) y su nombre pasa a "No hay cierre anterior" / "No hay cierre posterior". **Si la flecha que
  tiene el foco queda deshabilitada al pulsarla, el foco pasa al `select`** (si no, el foco se pierde en el `body`).
- **Estado "otro corte"** (`data-estado="otro"` en `div.corte` cuando el corte no es el por defecto): fondo
  `--c-revisar-f`, borde 1 px `--c-revisar-r`, `--r-2`, relleno `var(--e-1) var(--e-2)`. El `select` y las flechas
  conservan su fondo `--c-superficie` (sus bordes miden 3,37 · 3,18 sobre el ámbar, 3.3). Es la señal de "estás mirando
  otra fecha" mientras dure; no es una alerta (sin ícono, sin texto rojo). En colores forzados: borde `CanvasText`.
- **"Volver al 31/10/2026":** botón-texto **fuera** del grupo marcado, a su derecha (≥ 40rem) o en un renglón propio
  debajo (< 40rem), solo cuando el corte no es el por defecto. Al pulsarlo, el foco pasa al `select` (el botón
  desaparece).
- **Al cambiar el corte** (con el `select`, las flechas o "Volver"): se actualiza la dirección (entrada nueva en el
  historial), se recalcula y se vuelve a dibujar la vista **sin mover el foco ni el desplazamiento**. Una región
  `role="status"` visualmente oculta, dentro de la barra, dice: "Datos al 30/09/2026. En mora: $ {mora}." (Resumen y
  Desglose de mora), "Datos al 30/09/2026. Saldo del cliente: $ …" (Cliente), "Datos al 30/09/2026. Saldo del
  comprobante: $ 726.000,00. 60 días de atraso, tramo 31 a 60 días." (Comprobante), "Datos al 30/09/2026. Total: $ …"
  (otros desgloses). Un solo anuncio por cambio.
- **Desde una vista de error** (ruta desconocida o inexistente, 8.2), cambiar el corte lleva al **Resumen** con ese
  corte (H87): no hay dirección que reconstruir. Es un cambio de vista, así que rige la regla de la sección 2 (foco al
  `h1`), no la de arriba. Caso conocido: desde el desglose de "Otros" (`mora-otros`), pasar a un cierre donde no hay
  "Otros" (con los datos de ejemplo, por ejemplo el 31/08/2026) muestra el error "desglose inexistente"; un cambio de
  corte más lleva al Resumen. Es el comportamiento actual; la alternativa está en 13.3 (pregunta 2).
- **`mes=` que queda fuera de rango al cambiar el corte** (H87): aparece el aviso del mes (5.12) y se muestra el mes del
  nuevo corte.
- **Rango:** solo cierres de mes del 31/01/2025 al 31/10/2026 (decisión 3 de `diseno.md`). El corte en cualquier día es
  un extra (P2): si se hace, el `select` se reemplaza por `input type="date"` con `min` y `max` y el resto no cambia.

### 5.3 Cifra (`Cifra.svelte`)

Muestra un importe en `--t-cifra` o `--t-cifra-2`. Recibe centavos y la variante; el formato lo da la lógica.

```
 $ 1.234.567,89          ← "$ 1.234.567" en la cifra, ",00" en --t-centavos y --c-texto-2
```

- Marcado: `<span class="cifra"><span class="entero">$ 1.<wbr>234.<wbr>567</span><span class="centavos">,89</span></span>`.
  El `<wbr>` después de cada separador de miles permite que, **solo con el texto agrandado** (200 %, 1.4.4) o a 320 px,
  la cifra baje de renglón por un punto en lugar de desbordar la página. Con tamaño normal tiene que entrar entera en
  una línea (estimado: "$ 999.999.999,99" en 2rem con los centavos al 0.62em ocupa unos 250 px; el panel deja 296 px a
  360). Se mide en E5 con la fuente real; si no entra, se baja el mínimo de `--t-cifra`, no se corta la cifra.
- Negativo: "−$ 1.234,56" con el mismo color (sin rojo).
- Total 0: "$ 0,00" (las cifras en pesos sí muestran 0; el "—" es para porcentajes con total 0, M3).
- Para lectores no hace nada especial: el texto se lee seguido ("$ 1.234.567,89").

### 5.4 Cifra-enlace (todo número abrible)

Cada importe que tiene desglose (D1) es un **enlace al Desglose**. Mismo aspecto en todas partes, para que se aprenda
una vez:

| Estado | Aspecto |
| --- | --- |
| Normal | Texto `--c-texto` (la cifra no se tiñe), `text-decoration: underline 1px var(--c-acento)`, `text-underline-offset: 0.22em`, `text-decoration-skip-ink: none`. |
| Hover | Subrayado 2 px; en tablas, además fondo `--c-acento-suave` en la cifra (relleno `0 .125rem`, `--r-1`). |
| Foco | Anillo estándar alrededor de la cifra. |
| Visitado | Igual que normal (no se distingue: se vuelve a abrir el mismo número muchas veces). |
| Activo | Subrayado 2 px `--c-acento-hover`. |

- **Nombre accesible:** la cifra sola no dice qué es. El enlace lleva antes un texto visualmente oculto con la medida:
  `<a href="#/desglose/mora?corte=2026-10-31"><span class="solo-lectores">En mora al 31/10/2026: </span>$ 6.306.481,28</a>`.
  En una fila de cliente, la medida y el cliente: "En mora de Contratista Los Algarrobos Demo S.A.: ".
- **En una fila de cliente**, la cifra lleva al desglose de esa medida **con `cliente=`** (regla de la sección 2). El
  nombre del cliente, en la misma fila, lleva a la vista Cliente.
- **Qué NO es cifra-enlace:** conteos ("{N} clientes" sí es enlace, pero de texto normal, 5.1 Texto, al desglose por
  cliente), porcentajes (el enlace es el importe al lado), marcas de eje, días de atraso, los importes de la cabecera de
  un comprobante (son datos, no medidas) y el total de una tabla (5.8).
- La bajada del Resumen enseña la convención una vez: "Cada importe subrayado se abre hasta los comprobantes que lo forman."

### 5.5 Panel (heredado de la Demo 2, sin plegar)

```
 ┌─────────────────────────────────────────────────────────────────────┐ ← 1px --c-ventana-borde, --r-3, --s-ventana
 │ [ícono] Título del panel │ dato breve                    [control] │ ← barra de título: min 44px, --c-ventana-barra
 ├─────────────────────────────────────────────────────────────────────┤
 │ (herramientas opcionales: Ordenar por)                              │
 ├─────────────────────────────────────────────────────────────────────┤
 │ interior                                                            │ ← --c-superficie
 ├─────────────────────────────────────────────────────────────────────┤
 │ barra de estado (role="status") — mide 0 si está vacía              │
 └─────────────────────────────────────────────────────────────────────┘
```

- `<section class="panel" aria-labelledby="{id del h2}">`; título `h2` `1rem/1.3` 600 `--t-familia-titulo`; dato
  (`.panel-meta`) `--t-chico` `--c-texto-2`, cifras tabulares, separado por un divisor vertical de 1 px × 1rem (a < 24rem
  de contenedor baja a un renglón propio).
- La barra de estado siempre en el DOM; vacía: `min-height: 0; padding-block: 0; border-top-color: transparent`.
- `:focus-within`: borde `--c-borde-fuerte` y línea superior interior de 2 px `--c-acento` en la barra de título.
- **Sin franja de color en ningún panel de esta demo.** La mora es el estado normal de una cartera: el color queda en la
  regla de tramos.

### 5.6 Regla de tramos (pieza propia)

Una sola pieza con un solo sentido: **cuánto hace que venció**. Cuatro variantes.

#### 5.6.1 Regla de reparto (completa, mediana y mínima)

Muestra cómo se reparte un saldo a cobrar (Σ saldos positivos) entre los cinco tramos de A1. **Es un resumen gráfico**:
la información completa está en la lista de tramos que va debajo, que es parte del componente.

```
 Variante completa (Resumen, panel "Posición al 31/10/2026"; cifras de la semilla publicada, `diseno.md` 5.4; "Más de 90" es exacto por construcción: solo T12-d91):

 ┌─────────────────────────────────────────────────────────┬────────────┬─┬───┬──┐
 │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│▓▓▓▓▓▓▓▓▓▓▓▓│▌│███│██│   ← barra 1.5rem, sin texto adentro
 └─────────────────────────────────────────────────────────┴────────────┴─┴───┴──┘
   No vencido                                                1 a 30      ↑  61–90 · +90
   2 px de pista entre tramos; el ancho de cada tramo es proporcional a su importe.
   ↑ 31 a 60 días: 0,1 % del saldo. A su proporción mediría menos de 1 px; se dibuja con el ancho mínimo (3 px).

 ■ No vencido        ■ 1 a 30 días     ■ 31 a 60 días    ■ 61 a 90 días    ■ Más de 90 días
   $ 22.207.180,82     $ 4.552.834,33    $ 23.241,68       $ 1.125.405,27    $ 605.000,00
   77,9 %              16,0 %            0,1 %             3,9 %             2,1 %
```

- **Barra:** `div.regla` con `display: flex; gap: 2px; height: 1.5rem; background: var(--c-superficie-2)` (la pista se
  ve en los 2 px entre tramos). Cada tramo con importe > 0 es un `span` con `flex-basis: 0; flex-shrink: 1` en la hoja
  de estilos y el crecimiento puesto con **la directiva `style:flex-grow={centavos}` de Svelte** (asigna por CSSOM y no
  viola la CSP; prohibido el atributo `style` en el marcado), más `min-width: 3px` (un tramo de $ 1 se ve; la proporción
  exacta está escrita debajo). Fondo `--c-tramo-N`. Sin texto adentro (no entra a 360 y no tendría contraste parejo).
  Tramos en 0: no se dibujan.
- **Tramo muy chico (decisión del 25/11/2026; caso real: al 31/10/2026, "31 a 60 días" tiene $ 23.241,68, el 0,1 %
  del saldo a cobrar).** A su proporción mediría menos de 1 px a cualquier ancho (unos 0,6 px a 1280 y 0,2 px a 360); se dibuja con el **ancho mínimo de
  3 px** que ya tiene el componente, siempre entre sus 2 px de pista y en su lugar (el orden de los cinco tramos no
  cambia). Contra la pista mide 3,74 (claro) y 4,09 (oscuro) de contraste (3.3): se ve como un tramo, no como un borde.
  Motivo: que un tramo con deuda **nunca desaparezca** de la regla (el que mira la barra tiene que ver que hay algo
  entre 31 y 60 días) sin deformar la proporción de los otros (3 px son un 1 % de la barra a 360, menos a anchos mayores). **No se
  agrega** rótulo, llamada, flecha ni lupa sobre la barra, ni un ancho mínimo mayor: la cifra exacta está en la lista
  de abajo ("$ 23.241,68 · 0,1 %"), en el `aria-label` y en el desglose del tramo, y la regla sigue siendo un resumen.
  - **Porcentaje que redondea a 0,0 %** con importe > 0 (no pasa al corte por defecto; puede pasar en otro): se escribe
    "0,0 %" tal como lo da M3 (los cinco suman 100,0 %); el importe al lado dice que no es cero. Nada de "< 0,1 %".
  - **Variante mínima** (columna «Saldo según atraso», 6rem): el mismo mínimo de 3 px. Con los cinco tramos en el mínimo quedan
    15 px de tramos más 8 px de pista de 96: entra.
  - Lo cumple `ReglaTramos.svelte` tal como está (`min-width: 3px` en `.tramo`); **no hay que cambiarlo**. Se verifica
    en la pasada de 12.1 (captura a 360 y 1280, claro, oscuro y colores forzados: el tramo de 3 px se distingue).
- **Lista de tramos:** `ul` en grilla de 5 columnas (≥ 40rem de contenedor) o lista de renglones (< 40rem). Cada ítem:
  muestra de color 0.75rem × 0.75rem `--r-1` del tramo (decorativa, `aria-hidden`), rótulo (`--t-chico` 600
  `--c-texto`), importe como **cifra-enlace** al desglose del tramo (`--t-tabla`) y porcentaje (`--t-chico`
  `--c-texto-2`). Los porcentajes salen de M3 (suman 100,0 %). Tramo en 0: el ítem se muestra igual con "$ 0,00" y
  "0,0 %", sin enlace (decirlo también informa).
- **Sin renglón de verificación ni total debajo de la lista**: el saldo a cobrar ya está escrito arriba de la regla
  (6.1, 6.2) y la explicación de que los tramos suman ese saldo está en "Cómo se calcula" (7.3).
- **Accesibilidad:** la barra es `role="img"` con `aria-label` que arma la lógica con los cinco valores: "Saldo a cobrar según días de
  atraso al 31/10/2026: no vencido $ …; 1 a 30 días $ … (…); …". La lista de abajo repite los datos con
  enlaces: el lector de pantalla tiene las dos.
- **Colores forzados:** `forced-color-adjust: none` en los tramos (son datos; si el sistema los borra no queda barra) y
  `outline: 1px solid CanvasText` en cada uno. Las muestras de la lista, igual.
- **Vacío:** saldo a cobrar 0 → sin barra; en su lugar, la caja de vacío (5.13) "No hay saldo a cobrar al 31/10/2026." y
  la lista no se muestra.

| Variante | Dónde | Alto de barra | Lista |
| --- | --- | --- | --- |
| Completa | Resumen (panel "Posición") | 1.5rem | 5 columnas / renglones |
| Mediana | Cliente (panel "Posición del cliente") | 1rem | Igual |
| Mínima | Columna "Saldo según atraso" de la tabla Clientes del Resumen (solo desde 66rem de contenedor) | 0.5rem, ancho 6rem | No; `aria-hidden="true"` (la fila dice el tramo más antiguo en texto) |

#### 5.6.2 Ubicador (Comprobante)

La misma regla, pero en **escala de días**: los cinco tramos de **igual ancho**, solo el tramo del comprobante pintado
con su color, y una marca en sus días de atraso. Va en el panel "Situación al {corte}" de la vista Comprobante (6.3),
debajo de la etiqueta de tramo. Es el lugar donde se ve que la fecha de corte mueve las cosas: con el corte en
31/10/2026 la factura del recorrido está en el último tramo; con el 30/09/2026, en el tercero.

```
 al 31/10/2026 (91 días):                         al 30/09/2026 (60 días):
                                  91 días                           60 días
                                     │                                 │
 ┌───────┬───────┬───────┬───────┬───┼───┐        ┌───────┬───────┬───────┼───────┬───────┐
 │░░░░░░░│░░░░░░░│░░░░░░░│░░░░░░░│███████│        │░░░░░░░│░░░░░░░│███████│░░░░░░░│░░░░░░░│
 └───────┴───────┴───────┴───────┴───────┘        └───────┴───────┴───────┴───────┴───────┘
         0      30      60      90   días                 0      30      60      90   días
```

- **Pista:** `div.ubicador` (`aria-hidden="true"`: lo que dice está escrito al lado, 6.3), `display: grid;
  grid-template-columns: repeat(5, 1fr); gap: 2px; height: 1rem; position: relative`, ancho 100 % del panel hasta
  `24rem`. Tramos apagados: fondo `--c-superficie-2`, borde 1 px `--c-borde`. Tramo del comprobante: fondo
  `--c-tramo-N`, sin borde.
- **Marcas de escala:** debajo de la pista, en los tres cortes internos y el cuarto ("0" entre No vencido y 1–30, "30",
  "60", "90"), una rayita de 1 px × 0.375rem `--c-borde-fuerte` y el número en `--t-chico` `--c-texto-3` centrado en la
  rayita; "días" al final, a la derecha. A 360 px el ubicador mide unos 264 px: cada número tiene 53 px.
- **Marca del atraso:** línea vertical de 2 px `--c-texto` que sobresale 0.375rem por arriba y por abajo de la pista,
  con el rótulo "{N} días" (`--t-chico` 600 `--c-texto`) encima, centrado en la línea y sin salirse del panel (si cae a
  menos de 3rem de un borde, el rótulo se alinea a ese borde). La posición horizontal es `left: {fracción × 100} %`,
  puesta con **`style:left` de Svelte** (CSSOM, sin atributo `style`).
- **Fracción** (la calcula la lógica, `posicionEnRegla(atraso)`, pura y con test): tramo `k` (0 a 4) y rango de días
  `[a, b]` del tramo: No vencido `[−29, 0]`, 1–30 `[1, 30]`, 31–60 `[31, 60]`, 61–90 `[61, 90]`, Más de 90 `[91, 180]`;
  el atraso se acota a `[−29, 180]`; `fracción = (k + (d − a + 0,5) ÷ (b − a + 1)) ÷ 5`. Así la marca cae siempre
  **dentro** del tramo pintado (91 días → 0,8011; 60 días → 0,5967; 0 días → 0,1967), nunca sobre un corte.
- **Sin ubicador** cuando el comprobante tiene saldo 0 al corte (cancelado o anulado), en una nota de crédito y en un
  comprobante posterior al corte: la etiqueta y la frase de situación alcanzan.
- **Colores forzados:** `forced-color-adjust: none` en la pista; tramos apagados con borde `CanvasText`; marca en
  `CanvasText`.
- **Al cambiar el corte**, el tramo pintado y la marca cambian de lugar **sin transición** (3.6).

### 5.7 Etiqueta de estado (heredada)

Rectángulo `--r-1`, alto 1.5rem, relleno `0 .5rem`, `--t-chico` 600, `gap: .375rem`, colores `-t` sobre `-f`,
atributo `data-tono`. En lugar del ícono de forma de la Demo 2, las etiquetas de tramo llevan la **muestra del tramo**
(0.625rem cuadrada, `--c-tramo-N`, `aria-hidden`), para que la etiqueta de una fila y el tramo de la regla se lean como
la misma cosa. El texto siempre dice el tramo: el color no va solo.

| Situación | Texto | Tono | Marca |
| --- | --- | --- | --- |
| No vencido | "No vencido" | neutro | muestra tramo 0 |
| 1 a 30 días | "1 a 30 días" | revisar | muestra tramo 1 |
| 31 a 60 días | "31 a 60 días" | revisar | muestra tramo 2 |
| 61 a 90 días | "61 a 90 días" | diferencia | muestra tramo 3 |
| Más de 90 días | "Más de 90 días" | diferencia | muestra tramo 4 |
| Cancelado al corte (saldo 0) | "Cancelado" | ok | `i-check` |
| Factura anulada por NC total (estado defensivo: sin caso en los datos de ejemplo) | "Anulada por NC" | neutro | `i-guion` |
| Pago a cuenta sin imputar (R4) | "Revisar imputación" | revisar | `i-alerta` |
| Saldo a favor (R4) | "Saldo a favor" (en tablas: Clientes; en la ficha del cliente va solo el rótulo del renglón, sin etiqueta) | pendiente | `i-flecha-izq` |
| Movimiento posterior al corte | "Después de la fecha de corte" | neutro | `i-reloj` |
| Tipo de comprobante (en la cabecera) | "Factura A" · "Nota de débito A" · "Nota de crédito A" | neutro | sin marca |

Los días de atraso **no** van en la etiqueta: van en su columna ("91 días"), para que la etiqueta tenga siempre el
mismo ancho por tramo y la columna se pueda leer de arriba abajo.

### 5.8 Total de una tabla

Al pie de toda tabla que suma (Desglose, deudores, clientes, cuenta corriente, comprobantes con saldo, movimientos de un
comprobante, tabla de los 12 meses): un total de tabla común y corriente.

```
 │ …                                                     │                $ …          │
 ├───────────────────────────────────────────────────────┼─────────────────────────────┤ ← 1px --c-borde-fuerte, toda la fila
 │ TOTAL (9 PARTIDAS)                                    │               $ 3.446.078,79 │ ← 600
```

(Ejemplo: el desglose de la mora de C05 al 31/10/2026, `diseno.md` 5.4 y `esperado.ts`.)

- `tfoot` con una fila: `th scope="row"` con el rótulo (sección 7: "Total ({N} partidas)", "Total en mora", "Saldo al
  31/10/2026"…) y el importe en su columna, en 600. Fila con `border-top: 1px solid var(--c-borde-fuerte)` a todo el
  ancho, fondo `--c-superficie`, sin hover.
- El importe del total **no es enlace** (el número ya está abierto: es la tabla misma) y **no lleva** raya doble, tilde,
  color ni renglón de verificación debajo.
- En tarjetas (< 40rem): el total queda como último bloque, a todo el ancho, con la misma línea superior y la cifra
  alineada a la derecha con su rótulo a la izquierda.
- Colores forzados: la línea en `CanvasText`.

Que cada total sea exactamente la suma de sus partidas lo garantizan las pruebas (D2) y lo explica "Cómo se calcula"
(7.3, "Cada total cuadra con sus partidas"). En la pantalla no hay ninguna pieza dedicada a eso.

### 5.9 Tablas

Una sola estructura (`table`) con tres disposiciones por **consulta de contenedor** (`container: tabla / inline-size`),
como en las Demos 1 y 2:

| Contenedor | Disposición |
| --- | --- |
| ≥ 66rem | Tabla completa. |
| 40–65.99rem | Compacta: columnas agrupadas de a dos, en dos líneas por celda (definidas en cada tabla). |
| < 37,5rem (la tabla puede subir su umbral: `tarjetasDesde`; ver abajo) | Tarjetas: `display: block` con roles explícitos (`role="table"`, `row`, `cell`, `rowheader`, `columnheader`); cada fila, una tarjeta; los rótulos de columna (`data-etiqueta`) solo para lectores, salvo los importes, que llevan rótulo visible corto a la izquierda ("Saldo", "Debe", "Haber") porque varias cifras juntas sin rótulo no se distinguen. |

Comunes: cabecera `th scope="col"` `--t-rotulo` mayúsculas `--c-texto-2` sobre `--c-superficie-2`; ninguna cabecera se
parte dentro de una palabra (`overflow-wrap: normal; hyphens: manual`). Fila: alto mínimo 2.75rem, divisor 1 px
`--c-borde`, hover `--c-superficie-2`. Importes a la derecha y `nowrap`. **Sin `min-width` en tablas** y sin
desplazamiento horizontal de la página a ningún ancho. Ordenar: un `select` "Ordenar por" en la barra de herramientas
del panel (no cabeceras con flechas, que en tarjetas no existen); al cambiar, la barra de estado del panel dice
"Ordenado por {criterio}." (nada más).

**Umbral de las tarjetas por tabla (T4a, 25/11/2026).** El piso es 37,5 rem (600 px) y cada tabla puede pedir más con `tarjetasDesde` (rem) según lo que necesita su disposición compacta, medido a ancho continuo de 320 a 1440 px: Comprobantes 43,5, Clientes 41,5, Meses 40,5, movimientos (cuenta corriente y comprobante) 40; las demás, 37,5. Con un umbral único desbordaban esas cuatro entre ~650 y 840 px de pantalla, y con uno alto Deudores pasaba a tarjetas a 1280 px. En la disposición compacta los encabezados pueden partirse entre palabras. El detalle de un recibo es una fila con `colspan` debajo de la fila (5.9.4), no un bloque dentro de la celda.

**Cliente en una fila** (todas las tablas): nombre = enlace a la vista Cliente (`--t-tabla` 600); su importe =
cifra-enlace al desglose con `cliente=` (sección 2).

#### 5.9.1 Tabla "Deudores" (Resumen)

Columnas (≥ 66rem): Cliente · En mora · % de la mora · Tramo más antiguo · Días del más antiguo.

- Cliente: enlace a la vista Cliente.
- En mora: cifra-enlace al desglose de mora con `cliente=`.
- % de la mora: "{%}" + barra de proporción de 4rem × 0.375rem (pista `--c-superficie-2`, relleno `--c-acento`,
  ancho con `style:width`, `aria-hidden`). Los porcentajes suman 100,0 % (M3).
- Tramo más antiguo: etiqueta (5.7). Días: "91 días".
- **Hasta cinco filas.** Con más de 5 deudores (M4) se agrega la fila "Otros": sin enlace de cliente, su importe es
  cifra-enlace a `#/desglose/mora-otros?corte=…`, su porcentaje lleva la barra de proporción como cualquier fila, y las
  celdas de tramo y días quedan vacías (es un agregado: no tiene un tramo propio). Al corte por defecto hay **6
  deudores**: "Otros" existe y tiene **un solo cliente** (C07, un comprobante, $ 71.775,99; `diseno.md` 5.4).
- **Rótulo de "Otros" (decisión del 25/11/2026):** concuerda en número: **"Otros (1 cliente)"** con uno y **"Otros ({N}
  clientes)"** con dos o más. Con un solo cliente **no** se muestra su nombre en lugar de "Otros" ni se agrega una sexta
  fila con nombre: la regla de cuándo existe "Otros" es de `diseno.md` (M4: solo con más de 5 deudores, por resta, con
  su propia lista) y del código (`rankingConOtros`, `clavesExistentes`, H85), y esta especificación no la cambia. Motivo:
  la fila sigue diciendo la verdad (es la mora que queda fuera de los cinco mayores), el desglose la abre en un clic y
  ahí aparece el nombre (6.4), y la semilla se eligió para que "Otros" exista al corte por defecto (H78). Con los datos
  de ejemplo no es un caso raro: en 10 de los 15 cierres donde hay "Otros", tiene un solo cliente. Cambiar la regla es
  la pregunta 1 de 13.3.
- `tfoot`: "Total en mora" + importe (5.8).
- Compacta: (Cliente + tramo) · (En mora + %) · Días. Tarjetas: renglón 1 cliente; renglón 2 etiqueta + "91 días";
  renglón 3 "En mora" + cifra-enlace + "{%}".   
- Vacío: caja de vacío "Ningún cliente tiene saldo vencido al 31/10/2026." (sin tabla).

Al 31/10/2026 (semilla publicada; ranking, importes, porcentajes, tramos y días de `diseno.md` 5.4 y `esperado.ts`):

| Cliente | En mora | % | Tramo más antiguo | Días |
| --- | --- | --- | --- | --- |
| Contratista Los Algarrobos Demo S.A. (C05) | $ 3.446.078,79 | 54,7 % | Más de 90 días | 91 días |
| Camiones del Norte Demo S.A. (C11) | $ 1.184.628,72 | 18,8 % | 1 a 30 días | 25 días |
| Servicios Cerro Plata Demo S.R.L. (C10) | $ 942.051,55 | 14,9 % | 1 a 30 días | 16 días |
| Minera Cordón Azul Demo S.A. (C03) | $ 530.282,50 | 8,4 % | 1 a 30 días | 10 días |
| Operadora Arroyo Escondido Demo S.A. (C02) | $ 131.663,73 | 2,1 % | 1 a 30 días | 15 días |
| Otros (1 cliente) | $ 71.775,99 | 1,1 % | | |
| **Total en mora** | **$ 6.306.481,28** | | | |

(Los ids entre paréntesis son para ubicarse; en pantalla va solo la razón social. Los empates se ordenan por razón
social, como en `diseno.md` 4.2. El "91 días" de la primera fila sale de T12-d91, que es de C05. Los porcentajes suman
100,0 % (M3).)

#### 5.9.2 Otras tablas (columnas a ≥ 66rem)

| Tabla | Vista | Columnas | Compacta (40–66rem) | Orden por defecto |
| --- | --- | --- | --- | --- |
| Clientes (13) | Resumen | Cliente · Plazo · Saldo · En mora · Saldo según atraso (regla mínima) · Tramo más antiguo | (Cliente + plazo) · (Saldo + En mora) · Tramo | Saldo, de mayor a menor; los de saldo 0, si los hay, al final por nombre. |
| Pagos a cuenta sin imputar | Resumen | Cliente · Recibo · Fecha · A cuenta · Estado ("Revisar imputación") | (Cliente + recibo) · (Fecha + importe) · Estado | Fecha. |
| Saldos a favor | Resumen | Cliente · Saldo a favor · Origen ("Sobrepago en R-0003-{número}") | (Cliente + origen) · Importe | Importe. |
| Comprobantes con saldo | Cliente | Comprobante · Emisión · Vence · Total · Saldo · Atraso · Tramo | (Comprobante + emisión/vence) · (Total + Saldo) · (Atraso + Tramo) | Vencimiento, el más viejo primero. |
| Recibos | Cliente | Recibo · Fecha · Medios · Imputado · A cuenta | (Recibo + fecha) · Medios · (Imputado + A cuenta) | Fecha, el más nuevo primero. |
| Cuenta corriente | Cliente | Fecha · Movimiento · Debe · Haber · Saldo | (Fecha + Movimiento) · (Debe/Haber + Saldo) | **Cronológico ascendente** (como un libro). |
| Movimientos | Comprobante | Fecha · Movimiento · Debe · Haber · Saldo | ídem | Cronológico ascendente. |
| Partidas | Desglose | Referencia · Cliente (solo sin `cliente=`) · Fecha · Detalle · Importe | (Referencia + cliente) · (Fecha + detalle) · Importe | **En las medidas de saldo** (las que traen `partida.atraso`: `mora`, `mora-otros`, los cinco tramos, `saldo`, `saldo-neto`; `diseno.md` 4.3): atraso, el mayor primero; en el empate, importe mayor; las partidas sin atraso (los pagos a cuenta y saldos a favor de `saldo-neto`) al final, por importe. **En las demás:** importe, de mayor a menor; en el empate, la fecha más vieja primero. (Cambio del 25/11/2026: ver 6.4.) |
| Por cliente | Desglose (medida de toda la empresa) | Cliente · Partidas · Importe · % | (Cliente + partidas) · (Importe + %) | Importe, de mayor a menor. |

- **Comprobante** (en cualquier tabla): tipo corto + número en `--t-mono` como enlace a su vista: "FA 0003-00000123",
  "ND 0003-00000004", "NC 0003-00000019". El nombre accesible completo va oculto: "Factura A 0003-00000123".
- **Recibo:** "R-0003-00000045" en `--t-mono`; desplegable (5.9.4), no enlace.
- **Medios** (tabla Recibos): "Transferencia $ 1.170.000,00 · Retención IIBB $ 25.000,00 · Retención Ganancias
  $ 15.000,00", cada medio `nowrap`, y el renglón puede partirse entre medios. Las retenciones en `--c-texto` (son
  dinero, R2), con el nombre completo, sin abreviar "Ret.".
- **Debe / Haber:** factura y nota de débito al Debe; cobro imputado y nota de crédito al Haber; columna vacía = "" (no
  "0,00" ni "—"). Saldo acumulado con signo si es negativo (saldo a favor).
- **Cuenta corriente larga:** arriba de la tabla, enlace "Ir al saldo al 31/10/2026" que lleva al `tfoot` (`id`,
  `tabindex="-1"`, recibe el foco). Se muestran todos los movimientos (unos 80 a 100 en 22 meses): no hay paginación.

#### 5.9.3 Filas "Después de la fecha de corte"

En Cuenta corriente y en Movimientos, los registros con fecha posterior al corte (S1) **se muestran pero no cuentan**:

- Van en una **segunda tabla** debajo de la primera, con las mismas columnas y anchos, dentro del mismo panel (en HTML
  el `tfoot` tiene que ser lo último de una tabla; y una tabla aparte, con su `caption`, se anuncia mejor). Margen
  superior `--e-4`.
- `caption` (alineado a la izquierda, no centrado): la etiqueta neutra "Después de la fecha de corte" + "(no cuentan
  para el saldo al 31/10/2026)" en `--t-chico` `--c-texto-2`. Sin `thead` visible (las columnas son las de arriba; el
  `thead` existe con la clase `solo-lectores`).
- Filas: fondo `--c-fondo`, texto `--c-texto-2` (7,03 · 9,00 de contraste: legible, no "deshabilitado"), importes en
  su columna Debe/Haber y **Saldo vacío** (no se acumula).
- Sin tachado ni transparencia (bajarían el contraste).
- Si no hay posteriores, el grupo no se dibuja.

#### 5.9.4 Recibo desplegable (dentro de una tabla)

Un recibo no tiene vista propia. Donde aparece como partida o movimiento, su número es un botón desplegable:

```
 │ ›  R-0003-{n}   12/08/2026   Cobro parcial                        │          │ $ 242.000,00 │ $ 726.000,00 │
 │ ⌄  R-0003-{n}   12/08/2026   Cobro parcial                        │          │ $ 242.000,00 │ $ 726.000,00 │
 │    ┌ Recibo de $ 242.000,00 en total ─────────────────────────────────────────────────────────────┐
 │    │ Medios: Transferencia $ 234.000,00 · Retención IIBB $ 5.000,00 · Retención Ganancias $ 3.000,00 │ ← --c-fondo
 │    │ Imputado a: FA 0003-{n} $ 242.000,00                                                         │
 │    │ A cuenta: $ 0,00                                                                             │
 │    └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- `button` con `aria-expanded` y `aria-controls` hacia una fila siguiente (`tr` con una celda `colspan`) que se agrega o
  se quita del DOM (no `hidden` con animación de alto). Fondo `--c-fondo`, relleno `--e-3 --e-4`, `--t-chico`.
- Contenido: total del recibo, medios con importe (R2), imputaciones (enlaces a comprobante) y "A cuenta" (R4; si es
  > 0, etiqueta "Revisar imputación").
- En la vista Comprobante, el renglón "Haber" del cobro muestra **lo imputado a este comprobante**; el detalle dice el
  total del recibo, que puede ser mayor (imputó a varios).
- Al abrir, el foco se queda en el botón.

### 5.10 Gráfico de 12 meses con su tabla (`GraficoMeses.svelte`)

Barras verticales agrupadas por mes, en **SVG propio**, sin biblioteca. Dos usos:

| Uso | Series | Vista |
| --- | --- | --- |
| Facturado y cobrado | 2: "Facturado (con IVA)" `--c-serie-facturado` y "Cobrado" `--c-serie-cobrado` | Resumen |
| Facturación del cliente | 1: "Facturación sin IVA" `--c-serie-facturado` | Cliente |

> **Por qué "Facturado (con IVA)" en el gráfico del Resumen** (P1, decidida el 22/11/2026; sección 13): la cobranza
> incluye el IVA y la facturación sin IVA no; dibujarlas lado a lado haría parecer que todos los meses se cobra un 21 %
> más de lo que se factura. Un evaluador de administración lo ve en un segundo. La cifra "Facturación del mes" sigue
> siendo **sin IVA** (decisión 4 de `diseno.md`); el gráfico compara iguales y su tabla trae las columnas. Las series
> salen de las medidas `facturado-con-iva-mes` y `cobranza-mes` de `diseno.md` (4.2), una por mes.

```
 Facturado y cobrado, últimos 12 meses                                       ← h2 del panel (figcaption)
 En millones de pesos, con IVA. ■ Facturado  ■ Cobrado                       ← subtítulo y leyenda pegada (HTML, no SVG)
 Octubre de 2026: facturado $ 19.004.155,94 · cobrado $ 23.847.590,51        ← renglón del mes de corte (HTML; facturado CON IVA, como la serie)
    15 ┤                                                                ← marcas ilustrativas: las calcula la lógica
       ┤             ▆▆                                             ┃▓▓▓┃
    10 ┤ ▆▆ ▆▆ ▆▆ ▆▆ ██▆ ▆▆ ▆▆ ▆▆ ▆▆ ▆▆ ▆▆                           ┃▓▓▓┃   ← banda --c-superficie-2 en el mes de corte
       ┤ ██ ██ ██ ██ ███ ██ ██ ██ ██ ██ ██                           ┃█▓▓┃
     5 ┤ ██ ██ ██ ██ ███ ██ ██ ██ ██ ██ ██                           ┃█▓▓┃
       ┤ ██ ██ ██ ██ ███ ██ ██ ██ ██ ██ ██                           ┃█▓▓┃
     0 ┼──────────────────────────────────────────────────────────────────   ← línea de 0: 1px --c-texto-2
       nov dic ene  feb mar abr may jun jul ago sep                   oct
       2025    2026
 ▸ Ver los 12 meses como tabla                                               ← details/summary
```

- **Tamaño:** el SVG mide el ancho real del contenedor (`bind:clientWidth` en el envoltorio) y su `viewBox` se arma en
  esos píxeles, así el texto no se escala con el dibujo. Alto: 15rem (≥ 40rem) / 12.5rem (< 40rem). Margen izquierdo
  para el eje: 2.5rem; inferior: 2.5rem (dos renglones: mes y año).
- **Eje de importes:** empieza en **0** siempre. Marcas "redondas" (1, 2 o 5 × 10ⁿ millones), entre 3 y 5 marcas; rótulo
  en millones sin "$" ni "M" ("0", "5", "10", "15"; la unidad está en el subtítulo). Líneas de grilla 1 px `--c-borde`;
  la de 0, 1 px `--c-texto-2`. Si hay valores negativos (posible solo en el gráfico de Cliente; estado defensivo, sin caso en los datos de ejemplo), el eje baja hasta la marca
  redonda siguiente y las barras negativas **bajan** desde la línea de 0, mismo color.
- **Barras:** `rect` con `x`, `y`, `width`, `height` como **atributos** (CSP: nada de `style="…"`); color por clase
  (`.serie-facturado { fill: var(--c-serie-facturado); }`). Sin radio, sin borde, sin degradé. Grupo por mes: ancho de
  grupo = ancho útil / 12; barras = 38 % del grupo cada una con 2 px entre ellas (2 series) o 60 % (1 serie). Orden fijo:
  facturado a la izquierda, cobrado a la derecha. **Canal que no es el color (26/11/2026, 1.4.1 y 1.4.11):** Facturado
  es liso; **Cobrado lleva trama diagonal de 4 px (rayas de 2 px a 45°) y un ribete de 1,5 px en `--c-serie-cobrado`,
  dibujado hacia adentro** (el rectángulo se achica 0,75 px por lado para que los 2 px de aire entre las barras sigan
  siendo 2). Una barra de Cobrado demasiado chica para el ribete (3 px o menos de ancho o de alto) se dibuja lisa. El
  cuadradito de la leyenda repite lo mismo (14 px, ribete de 1,5 px y la misma trama con `repeating-linear-gradient`).
  Con colores forzados, el ribete y las rayas pasan a `CanvasText`. Un valor > 0 que mide menos de 1 px se dibuja de 1 px hacia arriba
  desde la línea de 0; uno < 0, de 1 px hacia abajo (así lo hace `grafico-escala.ts`; un valor 0 no dibuja barra). Es
  el mismo criterio que el tramo muy chico de la regla (5.6.1): nada con importe distinto de 0 desaparece del dibujo, y
  el valor exacto está en la tabla. Sin cambios en el componente.
- **Mes de corte:** banda `--c-superficie-2` detrás de su grupo, de alto completo, y su rótulo en 600 `--c-texto`. Los
  demás rótulos de mes en `--c-texto-3`.
- **Rótulos de mes:** "nov", "dic", "ene"… (`--t-chico`) y el año debajo del primer mes de cada año ("2025", "2026"). Si
  el ancho del grupo es menor que 2.25 veces el tamaño de letra calculado (a 360 px, o con el texto agrandado), se usa
  la inicial ("N", "D", "E"…), con los años igual. Nunca rótulos inclinados.
- **Sin valores sobre las barras ni *tooltips*** (WCAG 1.4.13 y la regla de la Demo 2: nada solo al pasar el mouse). El
  valor exacto del mes de corte está en el renglón de arriba; todos los valores, en la tabla.
- **Las barras no son interactivas** (serían blancos de 9 px a 360). Los enlaces están en la tabla.
- **Menos de 12 meses** (corte entre el 31/01/2025 y el 30/11/2025): se dibujan solo los meses que hay, cada grupo con
  el mismo ancho que tendría con 12 (no se estiran), alineados a la derecha, y debajo del subtítulo: "Hay datos desde
  enero de 2025."
- **Accesibilidad:** `figure` con `figcaption` (título + subtítulo); el SVG `role="img"` con `aria-label` corto que arma
  la lógica: "Facturado y cobrado por mes, de noviembre de 2025 a octubre de 2026, con IVA. Octubre de 2026: facturado
  $ …, cobrado $ …. Mayor facturación: {mes}, $ …. Los 12 valores están en la tabla siguiente." No se meten los 24
  importes en el `aria-label`: leídos de corrido no se pueden comparar; la tabla sí se recorre por celdas. Los `text`
  del SVG van con `aria-hidden="true"`.
- **Colores forzados:** `forced-color-adjust: none` en el SVG; líneas de eje y grilla en `CanvasText` con CSS dentro
  de `@media (forced-colors: active)`.

**"Ver los 12 meses como tabla":** `details` nativo debajo del gráfico (cerrado por defecto; sin JavaScript, compatible
con la CSP). `summary` con `i-chevron` y el texto; alto 44 px. Adentro, tabla con:

| Mes | Facturación sin IVA | Facturado con IVA | Cobrado | De lo cual, retenciones |
| --- | --- | --- | --- | --- |
| octubre de 2026 | cifra-enlace | cifra-enlace | cifra-enlace | cifra-enlace |

(en el gráfico de Cliente: Mes · Facturación sin IVA). Cada importe es cifra-enlace al desglose del mes
(`&mes=2026-05`; claves `facturacion-mes`, `facturado-con-iva-mes`, `cobranza-mes` y `retenciones-mes` de `diseno.md`,
4.2 y 4.3). `tfoot` "Total de los 12 meses" (5.8; suma de la columna, no es una medida del catálogo). Pasa a tarjetas a
< 40rem como cualquier tabla. Si el visitante abre el `details`, queda abierto al cambiar el corte.

### 5.11 Línea de fuente de datos

Un renglón de texto, igual que cualquier otro texto del pie o de una bajada: **no es un componente con aspecto propio**.

| Dónde | Texto | Aspecto |
| --- | --- | --- |
| Primer renglón del pie (4.5) | "Datos ficticios de ejemplo, de enero de 2025 a octubre de 2026." | `--t-chico` `--c-texto-2`, familia común. |
| Bajada del Resumen (6.1) | No repite la fuente de los datos (ya está en la insignia, en el pie del menú y en el pie de página): "Quién debe, cuánto y desde cuándo, a la fecha de corte que se elija. Cada importe subrayado se abre hasta los comprobantes que lo forman." | La de la bajada (`--t-chico` `--c-texto-2`). |

Sin borde, sin recuadro, sin monoespaciada, sin mayúsculas, sin ícono, sin rotación, sin semilla, huella, versión ni
fecha de corte en ese renglón (la fecha de corte está en el `h1`). El texto lo arma la lógica desde `desde` y `hasta`
del conjunto de datos.

### 5.12 Aviso global (heredado): corte inválido (S5) y mes inválido

Franja a lo ancho del contenido, `--r-2`, borde izquierdo 4 px `--c-revisar-r`, fondo `--c-revisar-f`, texto
`--c-texto` (14,39 · 12,08), `i-alerta` 18 px `--c-revisar-t`, relleno `--e-3 --e-4`. Texto: "La fecha de corte de la
dirección no es válida. Se muestra el 31/10/2026." `role="status"`. Botón de ícono `i-cerrar` "Cerrar aviso" a la
derecha. **Variante del mes** (`&mes=` fuera del rango de enero de 2025 al mes del corte, o mal escrito, en un desglose
de una medida del mes): "El mes de la dirección no es válido. Se muestra octubre de 2026." (el mes del corte), con la
misma forma. Se quita solo al cambiar de corte o de vista, o con su botón (no con tiempo; H88). No mueve el foco (el
`h1` lo recibe igual, y el aviso se anuncia por su región). **Los dos a la vez** (corte inválido y `mes=` inválido en la
misma dirección, H82): uno debajo del otro, con `--e-2` entre ellos, en el orden en que los da el enrutador (primero el
del corte, después el del mes, que entonces nombra el mes del corte por defecto); cada uno con su botón, que cierra solo ese.
Con los dos en pantalla los botones no pueden llamarse igual: "Cerrar el aviso de la fecha de corte" y "Cerrar el aviso
del mes" (con uno solo puede quedar "Cerrar aviso"; mejor usar siempre los nombres largos, así no cambian). Los textos viven en `dominio/textos.ts` (`avisoDeCorteInvalido`, `avisoDeMesInvalido`; H89).

### 5.13 Vacío, cargando y error (piezas, heredadas)

- **Vacío:** caja con borde punteado 1 px `--c-borde-fuerte`, `--r-2`, relleno `--e-4`, `i-guion` 24 px `--c-texto-3` +
  frase `--t-cuerpo` `--c-texto-2`. La acción, si la hay, afuera de la caja, debajo. Sin ilustraciones.
- **Cargando el arranque:** nada durante 300 ms (generar tarda menos de 50 ms: casi nunca se verá); después, en `main`,
  "Preparando los datos de ejemplo…" + `<progress>` sin valor (`accent-color: var(--c-acento)`). Sin esqueletos con
  brillo.
- **Recalcular por cambio de corte** (< 20 ms): ningún indicador.
- **Error de vista:** panel sin barra de título, borde izquierdo 4 px `--c-diferencia-r`, `h1` adentro en `--c-texto`,
  `i-vencido` 24 px `--c-diferencia-t` a su izquierda, texto y una acción (8.2).

### 5.14 Sin diálogos

La demo no tiene ventanas modales. "Cómo se calcula" es una **pantalla** propia (ruta `#/como-se-calcula`, sección 7.3), con
su título, sus secciones `h3` y **un ejemplo con números de los datos**; se llega desde la barra y se vuelve con "Atrás" o
con las migas. El componente `Dialogo` copiado de la Demo 2 se quitó el 26/11/2026 por no tener ningún uso (junto con sus
textos y la regla `html.dialogo-abierto`). Si alguna vez hace falta un diálogo, se vuelve a copiar de la Demo 2.

### 5.15 Íconos

Sprite SVG en `index.html` (`<svg hidden><symbol id="i-…">`), 24 × 24, trazo 1.75, `currentColor`, dibujados a mano
(los que sirvan se copian de la Demo 2). `aria-hidden="true"` y `focusable="false"` en cada uso. Lista: `i-marca`,
`i-check`, `i-alerta`, `i-vencido`, `i-guion`, `i-reloj`, `i-ayuda`, `i-cerrar`, `i-chevron` (derecha; rotado para
abajo), `i-chevron-izq`, `i-chevron-der`, `i-flecha-izq`. **`i-marca`:** una barra horizontal partida en cuatro tramos
(rectángulos de contorno, 4 × 4 px de alto, en la mitad inferior) con una línea vertical corta que cruza el tercero: la
regla con su marca.

---

## 6. Pantallas

Cortes (heredados): `< 40rem` una columna; `40rem – 68.74rem` intermedio; `≥ 68.75rem` escritorio, grilla de 12
columnas con `gap: var(--e-5)`. Las tablas cambian por **consulta de contenedor**. Sin desplazamiento horizontal de la
página a ningún ancho (`scrollWidth <= innerWidth`); nada fijo arriba.

**Números de los dibujos** (al día el 25/11/2026): son los de la **semilla publicada `20261122`** al corte por defecto,
tomados de `diseno.md` 5.3 (casos plantados: T02, T04, T05, T06, T07, T08 y T12-d91 con T17) y 5.4 (mora, tramos, saldo
a cobrar, deudores y "Otros", pagos a cuenta, saldos a favor, octubre), y de `src/lib/datos/esperado.ts` (además, lo de
C05: saldo, comprobantes con saldo, recibos y movimientos). Lo que ninguna de esas dos fuentes fija se escribe con una
llave: **{número}** o **{n}** es un número de comprobante o de recibo que da la numeración del generador, o una cantidad
que da la lógica y no es parte de la referencia (por ejemplo, las partidas de cada deudor salvo C05). Los casos de borde
que `diseno.md` 5.5 pasó a fixtures de prueba no están en los datos publicados: aquí aparecen solo como estados
defensivos, sin cifras. El maquetador **no copia** estos valores en el código: muestra lo que da la lógica; sirven para
comparar la pantalla con la especificación. Si `diseno.md` 5.4 o `esperado.ts` cambian, mandan sus números.

### 6.1 Resumen (`#/?corte=2026-10-31`)

Jerarquía: 1) mora; 2) antigüedad; 3) movimiento del mes; 4) deudores; 5) 12 meses; 6) revisar; 7) clientes.

**Escritorio, 1280 px**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▭▭┼▭ Tablero de cobranzas  [DEMO CON DATOS FICTICIOS]                         ← Volver al portafolio │ 56 escritorio
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Empresa: Logística Andina Demo S.A. (ficticia)       Fecha de corte [‹][31/10/2026 ▾][›]  (?) Cómo se calcula │ 52
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Cobranzas al 31/10/2026                                                                         (h1) │
│ Quién debe, cuánto y desde cuándo, a la fecha de corte que se elija. Cada importe subrayado se abre  │
│ hasta los comprobantes que lo forman.                                                                │
│                                                                                                      │
│ ┌ Posición al 31/10/2026 ────────────────────────────────────────┐ ┌ Movimiento de octubre de 2026 ┐ │
│ │ EN MORA                                                        │ │ FACTURACIÓN (SIN IVA)         │ │
│ │ $ 6.306.481,28                                    (--t-cifra)  │ │ $ 15.705.914,00  (--t-cifra-2)│ │
│ │ 22,1 % de lo que hay por cobrar, en 6 clientes.                │ │ 30 comprobantes               │ │
│ │ Ver de dónde sale este número →                                │ │ ───────────────────────────── │ │
│ │                                                                │ │ COBRANZA                      │ │
│ │ Saldo a cobrar (con IVA): $ 28.513.662,10         (--t-cifra-2)│ │ $ 23.847.590,51               │ │
│ │                                                                │ │ de lo cual, retenciones:      │ │
│ │ ANTIGÜEDAD DEL SALDO A COBRAR                           (h3)   │ │ $ 152.972,81                  │ │
│ │ [▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│▓▓▓▓▓▓▓▓▓│▌│██│█] │ │ 37 recibos                    │ │
│ │ ■ No vencido        ■ 1 a 30 días      ■ 31 a 60 días          │ │                               │ │
│ │ $ 22.207.180,82     $ 4.552.834,33     $ 23.241,68             │ │                               │ │
│ │ 77,9 %              16,0 %             0,1 %                   │ │                               │ │
│ │ ■ 61 a 90 días      ■ Más de 90 días                           │ │                               │ │
│ │ $ 1.125.405,27      $ 605.000,00                               │ │                               │ │
│ │ 3,9 %               2,1 %                                      │ │                               │ │
│ └───────────────────────── columnas 1–8 ─────────────────────────┘ └──────── columnas 9–12 ────────┘ │
│ ┌ Deudores │ 6 en mora ──────────────────────────────────────────┐ ┌ Para revisar │ 2 recibos ─────┐ │
│ │ CLIENTE · EN MORA · % DE LA MORA · TRAMO MÁS ANTIGUO · DÍAS    │ │ PAGOS A CUENTA SIN IMPUTAR    │ │
│ │ Contratista Los…  $ 3.446.078,79 54,7 % ▬▬▬ ■ Más de 90 días 91│ │ Montajes Sierra Chica…        │ │
│ │ Camiones del No…  $ 1.184.628,72 18,8 % ▬   ■ 1 a 30 días    25│ │ R-0003-{n} · 20/10/2026       │ │
│ │ Servicios Cerro…    $ 942.051,55 14,9 % ▬   ■ 1 a 30 días    16│ │ $ 50.000,00                   │ │
│ │ Minera Cordón A…    $ 530.282,50 8,4 % ▏    ■ 1 a 30 días    10│ │ [! Revisar imputación]        │ │
│ │ Operadora Arroy…    $ 131.663,73 2,1 % ▏    ■ 1 a 30 días    15│ │ SALDOS A FAVOR (h3)           │ │
│ │ Otros (1 cliente)    $ 71.775,99 1,1 % ▏                       │ │ Perforaciones del Oeste…      │ │
│ │ TOTAL EN MORA     $ 6.306.481,28                               │ │ $ 58.000,00                   │ │
│ └───────────────────────── columnas 1–8 ─────────────────────────┘ └──────── columnas 9–12 ────────┘ │
│ ┌ Facturado y cobrado, últimos 12 meses ────────────────────────────────────────────── 12 columnas ─┐ │
│ │ (gráfico 5.10) · ▸ Ver los 12 meses como tabla                                                    │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Clientes │ 13 ────────────────────────────────────────────────────────────────── 12 columnas ─────┐ │
│ │ Ordenar por [Saldo ▾]                                                                             │ │
│ │ CLIENTE   PLAZO   SALDO   EN MORA   ANTIGÜEDAD   TRAMO MÁS ANTIGUO                                │ │
│ │ … 13 filas (los de saldo 0, si los hay, al final) … · TOTAL = saldo a cobrar                      │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ pie (fuente de los datos, texto, enlaces, autoría)                                                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Posición al {corte}** (panel, columnas 1–8). Es el protagonista: rótulo "EN MORA" (`--t-rotulo`), cifra
  (`--t-cifra`, cifra-enlace al desglose de mora), frase "{%} de lo que hay por cobrar, en {N} clientes." (`--t-cuerpo`;
  "{N} clientes" es enlace de texto al mismo desglose, que lista por cliente), y el enlace de texto **"Ver de dónde sale
  este número →"** (el paso de los 10 segundos tiene que ser obvio). Para lectores, un solo `p`: "En mora al
  31/10/2026: $ {mora}, el {%} de lo que hay por cobrar, en {N} clientes." Debajo, "Saldo a cobrar (con IVA)" con
  `--t-cifra-2` cifra-enlace, y la regla de tramos completa (5.6.1) con su `h3`.
  **Con mora 0:** cifra "$ 0,00", frase "Ningún cliente tiene saldo vencido al {F}." (sin porcentaje). Sin
  enlace "Ver de dónde sale" (el desglose existe igual, la cifra sigue siendo enlace). No es solo defensivo: con los
  datos de ejemplo pasa en el primer cierre, el 31/01/2025 (Deudores muestra su caja de vacío).
- **Movimiento de {mes}** (panel, columnas 9–12): dos bloques separados por un divisor 1 px `--c-borde`. Facturación
  (sin IVA) `--t-cifra-2` cifra-enlace + "{N} comprobantes" (`--t-chico` `--c-texto-2`). Cobranza `--t-cifra-2`
  cifra-enlace + "de lo cual, retenciones:" + cifra-enlace `--t-tabla` + "{N} recibos". Si la facturación del mes es
  negativa (posible solo por cliente; estado defensivo), se muestra con signo, sin recortar. Este panel separa **flujo del mes** de
  **posición al corte** (P2, decidida el 22/11/2026; sección 13).
- **Deudores** (panel, columnas 1–8; 12 si "Para revisar" no aparece): tabla 5.9.1.
- **Para revisar** (panel, columnas 9–12): solo si hay pagos a cuenta sin imputar o saldos a favor; cada grupo con su
  `h3` y solo si tiene filas. Dato del panel: cantidad total de renglones, con su unidad (un renglón es un recibo; al corte por defecto, **«2 recibos»**: C07 con un pago
  a cuenta de $ 50.000,00, T06, y C09 con un saldo a favor de $ 58.000,00, T07; `diseno.md` 5.4). Sin ninguno: el panel
  no se dibuja.
- **Facturado y cobrado, últimos 12 meses** (12 columnas): 5.10.
- **Clientes** (12 columnas): tabla 5.9.2; incluye a los de saldo 0 (por ejemplo C09, T07, que tiene saldo a favor). El `tfoot`
  cierra con "Total" = saldo a cobrar (5.8). La columna **Saldo** es el saldo de comprobantes del cliente (`saldo` con
  `cliente=`, nunca negativo; `diseno.md` 4.3). Un cliente con saldo a favor (C09) muestra "Saldo $ 0,00" y la etiqueta
  "Saldo a favor"; uno con pago a cuenta (C07), la etiqueta "Revisar imputación". Su importe a cuenta se abre en
  `pagos-a-cuenta` o `saldos-a-favor` con `cliente=`; no se resta en esta columna.

**Tableta, 768 px:** Posición y Movimiento uno debajo del otro, a todo el ancho; Movimiento con sus dos bloques en dos
columnas. Deudores y Para revisar, uno debajo del otro. Regla con la lista en 5 columnas (el contenedor mide unos
670 px). Tablas en disposición compacta. Barra de la aplicación: "Empresa: …" pasa a la bajada; selector y "Cómo se
calcula" en un renglón; "Volver al 31/10/2026", si aparece, al lado del grupo.

**Teléfono, 360 px**

```
┌──────────────────────────────┐
│ ▭▭┼▭ Tablero de cobranzas     │ 56 (marca y "← Portafolio" pueden
│                  ← Portafolio │     partir en dos renglones)
│ Fecha de corte                │
│ [‹][ 31/10/2026      ▾][›] (?)│ 52 (select flexible: flex 1 1 auto, min-width 0; "31/10/2026" entra entero)
├──────────────────────────────┤
│ [DEMO CON DATOS FICTICIOS]    │ etiqueta, sin fecha
│ Cobranzas al 31/10/2026       │ h1 (la única fecha de corte en pantalla)
│ Logística Andina Demo S.A.    │
│ (ficticia). Quién debe,       │
│ cuánto y desde cuándo, a la   │
│ fecha de corte que se elija.  │
│ Cada importe subrayado se     │
│ abre hasta los comprobantes   │
│ que lo forman.                │
│┌ Posición al 31/10/2026 ─────┐│
││ EN MORA                     ││
││ $ 6.306.481,28              ││ 2rem: entra en 296 px
││ 22,1 % de lo que hay por    ││
││ cobrar, en 6 clientes.      ││
││ Ver de dónde sale este      ││
││ número →                    ││
││ Saldo a cobrar (con IVA)    ││
││ $ 28.513.662,10             ││
││ ANTIGÜEDAD DEL SALDO        ││
││ [▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│▓▓▓│▌│█│█]││ barra a todo el ancho; 31 a 60 con su mínimo de 3 px
││ ■ No vencido $ 22.207.180,82││ lista: la disposición (renglones o apilada) la elige
││                       77,9 %││ ReglaTramos por el ancho de su contenedor (18rem)
││ ■ 1 a 30 días $ 4.552.834,33││
││                       16,0 %││
││ ■ 31 a 60 días   $ 23.241,68││
││                        0,1 %││
││ … (61 a 90 y Más de 90)     ││
│└─────────────────────────────┘│
│┌ Movimiento de octubre ──────┐│
││ FACTURACIÓN (SIN IVA)       ││
││ $ 15.705.914,00             ││
││ 30 comprobantes             ││
││ ─────────────────────────── ││
││ COBRANZA                    ││
││ $ 23.847.590,51             ││
││ de lo cual, retenciones:    ││
││ $ 152.972,81 · 37 recibos   ││
│└─────────────────────────────┘│
│┌ Deudores │ 6 ───────────────┐│
││┌ Contratista Los Algarrobos┐││ tarjeta: el nombre es enlace a Cliente
│││ Demo S.A.                 │││
│││ [■ Más de 90 días] 91 días│││
│││ En mora  $ 3.446.078,79   │││ la cifra es enlace al desglose con cliente=
│││          54,7 %           │││
││└───────────────────────────┘││
││ … (4 tarjetas más y "Otros" ││
││ (1 cliente)", sin enlace de ││
││ cliente)                    ││
││ ─────────────────────────── ││
││ Total en mora               ││
││              $ 6.306.481,28 ││
│└─────────────────────────────┘│
│ Para revisar · 12 meses ·     │
│ Clientes (tarjetas)           │
│ pie                           │
└──────────────────────────────┘
```

- La barra de la aplicación a 360: `label` arriba, en su renglón; abajo `‹`, `select` (`flex: 1 1 auto; min-width: 0`),
  `›` y el ícono de ayuda: 44 + 4 + select + 4 + 44 + 4 + 44 = 144 px fijos, el `select` se queda con unos 184 px, y
  "31/10/2026" con la flecha nativa ocupa unos 120 px: **entra entero**. Con otro corte, el grupo marcado envuelve el
  rótulo y los tres controles (el relleno de 0.5rem a cada lado sale del `select`, que se queda con unos 168 px) y
  "Volver al 31/10/2026" va en su renglón, debajo.
- Arriba del `h1` hay una sola etiqueta y **no tiene fecha**: la fecha de corte aparece una vez, en el `h1`.

### 6.2 Cliente (`#/cliente/C05?corte=…`)

Jerarquía: 1) quién es y cuánto debe al corte; 2) qué comprobantes tiene con saldo y desde cuándo; 3) cómo factura; 4)
qué pagó; 5) la cuenta corriente completa.

**Escritorio, 1280 px**

```
│ Resumen / Contratista Los Algarrobos Demo S.A.                                              (migas) │
│ Contratista Los Algarrobos Demo S.A.                                                           (h1) │
│ CUIT {cuit} (ficticio) · Plazo de pago: 30 días · al 31/10/2026                            (bajada) │
│ ┌ Posición del cliente al 31/10/2026 ──────────────────────────┐ ┌ Facturación, últimos 12 meses ─┐ │
│ │ SALDO (CON IVA)          EN MORA                             │ │ Sin IVA, en millones de pesos.  │ │
│ │ $ 4.876.044,69           $ 3.446.078,79 · 70,7 % del saldo   │ │ (gráfico 1 serie, alto 12.5rem) │ │
│ │ (--t-cifra-2, enlaces con cliente=C05)                       │ │ ▸ Ver los 12 meses como tabla   │ │
│ │ ANTIGÜEDAD (regla mediana + lista)                           │ │                                 │ │
│ └──────────────────────────── columnas 1–7 ────────────────────┘ └──────── columnas 8–12 ─────────┘ │
│ ┌ Comprobantes con saldo │ 13 ────────────────────────────────────────────────── 12 columnas ─────┐ │
│ │ COMPROBANTE        EMISIÓN     VENCE       TOTAL            SALDO          ATRASO   TRAMO        │ │
│ │ FA 0003-{n}        02/07/2026  01/08/2026  $ 1.089.000,00   $ 605.000,00   91 días  ■ Más de 90  │ │
│ │ … 12 más, por vencimiento: los otros 8 vencidos (7 de relleno y T05-F: vence 25/10/2026, 6 días, │ │
│ │   $ 363.000,00, ■ 1 a 30) y 4 sin vencer                                                         │ │
│ │ TOTAL                                                       $ 4.876.044,69                      │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Recibos │ 45 ─────────────────────────── 12 columnas ─────────────────────────────────────────────┐ │
│ │ RECIBO (desplegable)  FECHA  MEDIOS  IMPUTADO  A CUENTA                                         │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Cuenta corriente │ 102 movimientos ── 12 columnas ── [Ir al saldo al 31/10/2026] ──────────────┐ │
│ │ FECHA       MOVIMIENTO                         DEBE             HABER            SALDO          │ │
│ │ …           FA 0003-{n} · {servicio}           $ …                               $ …            │ │
│ │ …           › R-0003-{n} · Cobro                                $ …              $ …            │ │
│ │ SALDO AL 31/10/2026                                                              $ 4.876.044,69 │ │
│ │ [◷ DESPUÉS DE LA FECHA DE CORTE] (no cuentan para el saldo al 31/10/2026)    (fondo --c-fondo)  │ │
│ │ 03/11/2026  › R-0003-{n} · Cobro                                $ 363.000,00                    │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │
```

(Cifras de C05 al 31/10/2026 de `esperado.ts` (`c05`): saldo $ 4.876.044,69; en mora $ 3.446.078,79, el 70,7 % del
saldo; 13 comprobantes con saldo, de los cuales 9 vencidos; 45 recibos hasta el corte y 102 movimientos en la cuenta
corriente, que cierra en el saldo neto, igual al saldo porque C05 no tiene importes a cuenta. Los dos vencidos fijos son
T12-d91 y T05-F de `diseno.md` 5.3; el recibo del 03/11/2026 es el de T05 y no está entre los 45. T12-d91 es el primero
por vencimiento porque el atraso del relleno no pasa de 89 días.)

- **Posición del cliente** (columnas 1–7): dos cifras `--t-cifra-2` lado a lado (Saldo y En mora, cifras-enlace con
  `cliente=`: medidas `saldo` y `mora`), el porcentaje "{%} del saldo" (`--t-chico`), regla de tramos mediana. Si el
  cliente tiene un importe a cuenta (`diseno.md`, 4.3), debajo de las cifras va un renglón más: "Pagos a cuenta sin
  imputar" con la etiqueta "Revisar imputación" (C07, T06) o, sin etiqueta, "Saldo a favor" (C09, T07: el rótulo del
  renglón ya lo dice y repetirlo en una etiqueta dejaba «Saldo a favor» dos veces seguidas; la etiqueta de tono
  `pendiente` queda para las tablas, donde no hay rótulo de renglón), con su importe como
  cifra-enlace (`pagos-a-cuenta` o `saldos-a-favor` con `cliente=`), y "Saldo neto" (`saldo-neto`), que es el saldo con
  que termina la cuenta corriente. Cliente con saldo a favor (C09): "Saldo $ 0,00", "En mora $ 0,00", el renglón "Saldo
  a favor $ 58.000,00" y, en lugar de la regla, la caja de vacío "Este cliente no tiene saldo a cobrar al
  31/10/2026.".
- **Facturación, últimos 12 meses** (columnas 8–12): gráfico de una serie (5.10), con meses negativos bajo el eje si los hubiera (estado defensivo, sin caso en los datos de ejemplo).
- **Comprobantes con saldo:** solo los de saldo ≠ 0 al corte. Vacío: "No hay comprobantes con saldo al 31/10/2026."
- **Recibos**, **Cuenta corriente:** 5.9.2 a 5.9.4.
- **Pagos a cuenta del cliente:** si los hay, la fila del recibo en Recibos lleva la etiqueta "Revisar imputación" en la
  columna A cuenta; en la cuenta corriente el recibo va al Haber completo (baja el saldo, R4).
- **Cliente sin facturación reciente** (estado defensivo: ningún cliente de los datos de ejemplo lo tiene): cifras
  "$ 0,00", gráfico con la línea de 0 y "Sin facturación en los últimos 12 meses." en lugar de las barras, "No hay
  comprobantes con saldo al 31/10/2026." y, en Recibos y Cuenta corriente, su historial anterior. Las cajas "Todavía no tiene comprobantes.", "Todavía no tiene
  recibos." y "Sin movimientos hasta el {F}." son para un cliente sin ningún movimiento hasta el corte elegido (estados
  defensivos: con los datos de ejemplo no se llega a ellos).

**Tableta, 768 px:** Posición y Facturación uno debajo del otro; tablas compactas.

**Teléfono, 360 px**

```
│ ‹ Resumen                    │ miga anterior, 44 px
│ [DEMO CON DATOS FICTICIOS]    │
│ Contratista Los Algarrobos    │ h1
│ Demo S.A.                     │
│ CUIT {cuit} (ficticio)        │
│ Plazo de pago: 30 días        │
│ al 31/10/2026                 │
│┌ Posición del cliente ───────┐│
││ SALDO (CON IVA)             ││
││ $ 4.876.044,69              ││ las dos cifras apiladas
││ EN MORA                     ││
││ $ 3.446.078,79 · 70,7 %     ││
││ (regla mediana + lista)     ││
│└─────────────────────────────┘│
│┌ Facturación, 12 meses ──────┐│ rótulos de mes con inicial
│└─────────────────────────────┘│
│┌ Comprobantes con saldo ─────┐│
││┌ FA 0003-{n}               ┐││ tarjeta: renglón 1 comprobante (enlace)
│││ Vence 01/08/2026 · 91 días│││ renglón 2
│││ [■ Más de 90 días]        │││ renglón 3
│││ Total  $ 1.089.000,00     │││ rótulo visible + cifra a la derecha
│││ Saldo    $ 605.000,00     │││
││└───────────────────────────┘││
│└─────────────────────────────┘│
│ Recibos · Cuenta corriente    │ tarjetas: "Debe"/"Haber" (el que tenga) + "Saldo"
```

### 6.3 Comprobante (`#/comprobante/1-0003-{número}?corte=…`)

Jerarquía: 1) qué comprobante es y cuánto queda al corte, y en qué tramo (ubicador); 2) cómo se llegó a ese saldo
(movimientos); 3) lo que pasó después del corte.

**Escritorio, 1280 px** (la factura del recorrido, T12-d91 con su historia T17)

```
│ Resumen / Contratista Los Algarrobos Demo S.A. / Factura A 0003-{n}                         (migas) │
│ [Factura A]  Factura A 0003-{n}                                               (etiqueta neutra + h1) │
│ Contratista Los Algarrobos Demo S.A. · al 31/10/2026                                       (bajada) │
│ ┌ Datos del comprobante ──────────────────────────┐ ┌ Situación al 31/10/2026 ─────────────────────┐ │
│ │ Emisión        02/07/2026                       │ │ SALDO                                        │ │
│ │ Vencimiento    01/08/2026 (plazo de 30 días)    │ │ $ 605.000,00                    (--t-cifra-2)│ │
│ │ Servicio       {servicio}                       │ │ 91 días de atraso · [■ Más de 90 días]       │ │
│ │ Neto             $ 900.000,00                   │ │                                  91 días     │ │
│ │ IVA 21 %         $ 189.000,00                   │ │ ┌──────┬──────┬──────┬──────┬───┼──┐         │ │
│ │ ─────────────────────────────                   │ │ │░░░░░░│░░░░░░│░░░░░░│░░░░░░│██████│ (ubicador)│ │
│ │ Total          $ 1.089.000,00                   │ │ └──────┴──────┴──────┴──────┴──────┘         │ │
│ │ Notas de crédito: NC 0003-{n}                   │ │        0     30     60     90  días          │ │
│ │                                                 │ │ Venció el 01/08/2026. El atraso se cuenta    │ │
│ │                                                 │ │ desde el vencimiento original, no desde el   │ │
│ │                                                 │ │ último pago.                                 │ │
│ └──────────────── columnas 1–7 ───────────────────┘ └──────────────── columnas 8–12 ────────────────┘ │
│ ┌ Movimientos │ 4 ─────────────────────────────────────────────────────────────── 12 columnas ─────┐ │
│ │ FECHA       MOVIMIENTO                               DEBE            HABER            SALDO      │ │
│ │ 02/07/2026  Emisión                                  $ 1.089.000,00                   $ 1.089.000,00│
│ │ 20/07/2026  NC 0003-{n} · Nota de crédito                            $ 121.000,00     $ 968.000,00 │
│ │ 12/08/2026  › R-0003-{n} · Cobro parcial                             $ 242.000,00     $ 726.000,00 │
│ │             (desplegado: Transferencia $ 234.000,00 · Retención IIBB $ 5.000,00 ·                │ │
│ │              Retención Ganancias $ 3.000,00)                                                     │ │
│ │ 14/10/2026  › R-0003-{n} · Cobro parcial                             $ 121.000,00     $ 605.000,00 │
│ │ ───────────────────────────────────────────────────────────────────────────────────────────────  │ │
│ │ SALDO AL 31/10/2026                                                                   $ 605.000,00 │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
```

**El mismo comprobante con el corte en 30/09/2026** (lo que cambia; el resto, igual):

```
│ Situación al 30/09/2026                    │   Movimientos │ 3
│ SALDO                                      │   … 02/07 Emisión · 20/07 NC · 12/08 Cobro parcial …
│ $ 726.000,00                               │   SALDO AL 30/09/2026                    $ 726.000,00
│ 60 días de atraso · [■ 31 a 60 días]       │   [◷ DESPUÉS DE LA FECHA DE CORTE] (no cuentan para el saldo al 30/09/2026)
│                    60 días                 │   14/10/2026  › R-0003-{n} · Cobro parcial       $ 121.000,00
│ ┌──────┬──────┬──────┼──────┬──────┐       │
│ │░░░░░░│░░░░░░│██████│░░░░░░│░░░░░░│       │   (barra de la aplicación: grupo del corte marcado
│ └──────┴──────┴──────┴──────┴──────┘       │    en ámbar y "Volver al 31/10/2026" a su lado)
│        0     30     60     90  días        │
```

- **Datos del comprobante:** lista de pares (`dl`, patrón "Summary list" de GOV.UK): rótulo `--t-chico` 600
  `--c-texto-2` a la izquierda (8rem), valor `--c-texto` a la derecha; importes alineados a la derecha en una columna
  de ancho fijo para que Neto, IVA y Total se sumen con la vista. Total en 600 con una línea de 1 px `--c-borde-fuerte`
  encima (la misma del total de tabla, 5.8). **Los importes de esta cabecera no son enlaces** (son datos del
  comprobante, no medidas).
  - Nota de crédito: "Asociada a: FA 0003-{n}" (enlace) y vencimiento = emisión (C4).
  - Nota de débito: "Asociada a: FA …" y su propio vencimiento.
  - Factura con NC asociada: renglón "Notas de crédito: NC 0003-{n} (enlace)".
- **Situación al corte:** saldo `--t-cifra-2` (**texto, no enlace**: el saldo de un comprobante no es una medida del
  catálogo; su desglose son los Movimientos de esta misma vista, `diseno.md` 4.3) + "{N} días de atraso" + etiqueta de
  tramo + **ubicador** (5.6.2) + frase: "Venció el 01/08/2026." / "Vence el 15/11/2026." / "Vence hoy, 31/10/2026: no
  está vencido." (T04, S3) / "Cancelado el {F}." / "Anulada por la NC 0003-{n} del {F}." (estado defensivo). Pago
  parcial (S6): "El atraso se cuenta desde el vencimiento original, no desde el último pago."
- **Movimientos:** 5.9.2 a 5.9.4. Las NC asociadas aparecen como movimiento al Haber ("NC 0003-{n} · Nota de crédito",
  enlace). `tfoot` "Saldo al {F}" (5.8).

**Tableta, 768 px:** "Datos del comprobante" y "Situación" uno al lado del otro (el contenedor mide unos 720 px; el
ubicador mide hasta 24rem); Movimientos en disposición compacta.

**Teléfono, 360 px:** orden: **Situación primero** (saldo, días, etiqueta, ubicador a todo el ancho del panel, unos
264 px, frase), después "Datos del comprobante" (rótulo a la izquierda de 6.5rem y valor a la derecha; rótulo arriba y
valor abajo si el contenedor mide < 20rem), después Movimientos en tarjetas (fecha + movimiento; "Debe" o "Haber" con
rótulo; "Saldo"). Así, al cambiar el corte en el teléfono, el tramo pintado y la marca se ven sin desplazar (el
encabezado y el panel Situación miden unos 420 px a 360 × 780, debajo de las dos barras).

### 6.4 Desglose (`#/desglose/mora?corte=…[&cliente=C05]`)

"¿De dónde sale este número?" Jerarquía: 1) qué número es y cuánto vale; 2) cómo se calcula, en palabras; 3) las
partidas.

**Escritorio, 1280 px (medida de toda la empresa: por cliente)**

```
│ Resumen / En mora                                                                           (migas) │
│ ¿De dónde sale este número?                                                (p, --t-chico --c-texto-2)│
│ En mora al 31/10/2026                                                                          (h1) │
│ $ 6.306.481,28                                                               (--t-cifra-2, no enlace)│
│ ┌ Cómo se calcula ──────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Suma de los saldos al 31/10/2026 de los comprobantes vencidos (con al menos 1 día de atraso).     │ │
│ │ Lo que vence el mismo día del corte no está en mora. Los pagos a cuenta sin imputar no la bajan. │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ Por cliente │ 6 ─────────────────────────────────────────────────── [Ordenar por: Importe ▾] ───────┐ │
│ │ CLIENTE                                PARTIDAS   IMPORTE              %                          │ │
│ │ Contratista Los Algarrobos Demo S.A.   9          $ 3.446.078,79       54,7 %                     │ │
│ │ Camiones del Norte Demo S.A.           {n}        $ 1.184.628,72       18,8 %                     │ │
│ │ Servicios Cerro Plata Demo S.R.L.      {n}        $ 942.051,55         14,9 %                     │ │
│ │ Minera Cordón Azul Demo S.A.           {n}        $ 530.282,50         8,4 %                      │ │
│ │ Operadora Arroyo Escondido Demo S.A.   {n}        $ 131.663,73         2,1 %                      │ │
│ │ Montajes Sierra Chica Demo S.R.L.      1          $ 71.775,99          1,1 %                      │ │
│ │ ───────────────────────────────────────────────────────────────────────────────────────────────── │ │
│ │ TOTAL (6 CLIENTES, 16 PARTIDAS)                   $ 6.306.481,28                                  │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
   nombre → vista Cliente · importe (subrayado) → este desglose con &cliente=
```

(Acá van los seis clientes con mora: "Por cliente" no agrupa en "Otros", eso es solo de la tabla "Deudores" del
Resumen. C05 tiene 9 partidas y C07 1, de `esperado.ts`; las de los otros cuatro suman 6 y su reparto lo da la lógica.)

**Con `cliente=` (o medida de un solo cliente): partidas**

```
│ Resumen / En mora / Contratista Los Algarrobos Demo S.A.                                    (migas) │
│ ¿De dónde sale este número?                                                                          │
│ En mora al 31/10/2026 · Contratista Los Algarrobos Demo S.A.                                   (h1) │
│ $ 3.446.078,79                                                                                       │
│ Solo los comprobantes de Contratista Los Algarrobos Demo S.A. · al 31/10/2026   (bajada; nombre = enlace a Cliente)
│ (Cómo se calcula)                                                                                    │
│ ┌ Partidas │ 9 ─────────────────────────────────────────────────────── [Ordenar por: Atraso ▾] ────────┐ │
│ │ REFERENCIA      FECHA        DETALLE                                              IMPORTE         │ │
│ │ FA 0003-{n}     02/07/2026   Venció el 01/08/2026 · 91 días · [■ Más de 90 días]  $ 605.000,00     │ │
│ │ … las otras 8, de la más atrasada a la menos: 7 facturas de relleno y, entre ellas, T05-F:       │ │
│ │ FA 0003-{n}     25/09/2026   Venció el 25/10/2026 · 6 días · [■ 1 a 30 días]      $ 363.000,00     │ │
│ │ ───────────────────────────────────────────────────────────────────────────────────────────────── │ │
│ │ TOTAL (9 PARTIDAS)                                                                $ 3.446.078,79   │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
```

- **Encabezado:** "¿De dónde sale este número?" como renglón previo (`p`, no encabezado), `h1` con el título de la
  medida (y el cliente o el mes, si hay filtro: "Facturación de mayo de 2026 (sin IVA)"), cifra `--t-cifra-2` (no es
  enlace: ya se está en su desglose). Con `cliente=`, la bajada "Solo los comprobantes de {Cliente} · al {F}" con el
  nombre como enlace a la vista Cliente (regla de la sección 2).
- **Cómo se calcula:** panel sin barra de título, borde izquierdo 4 px `--c-acento`, fondo `--c-superficie`,
  `--t-cuerpo`, con `medida.formula` (texto de la lógica). Máximo 62ch.
- **Por cliente** (medida de toda la empresa cuyas partidas son de más de un cliente): una fila por cliente con la
  cantidad de partidas (texto) y el subtotal. **El nombre lleva a la vista Cliente; el subtotal es cifra-enlace al mismo
  desglose con `cliente=`** (la misma regla que en "Deudores"). Porcentajes con M3 ("—" en todas las filas si algún
  subtotal es negativo, `diseno.md` H25). No hay enlace a "partidas sin agrupar": para bajar, se filtra por cliente
  desde la cifra.
- **Partidas:** Referencia (enlace a comprobante, o recibo desplegable) · Cliente (solo sin `cliente=`; enlace a
  Cliente) · Fecha · Detalle (`partida.nota` de la lógica, más días y etiqueta de tramo cuando aplica) · Importe
  **firmado** (las partidas que restan, con "−$", sin rojo). Orden: `select` "Ordenar por" con "Importe (de mayor a
  menor)", "Fecha (la más vieja primero)", "Referencia" y, solo en las medidas de saldo, "Atraso (el mayor primero)";
  al cambiar, la barra de estado dice "Ordenado por fecha.".
- **Orden por defecto de las partidas (cambio del 25/11/2026):** en las medidas de saldo (`mora`, `mora-otros`, los
  cinco tramos, `saldo`, `saldo-neto`), **por atraso, el mayor primero** (desempate y partidas sin atraso: 5.9.2); en
  las demás, por importe. Motivo: es la pregunta de cobranzas ("¿desde cuándo me deben?") y es como se lee un informe
  de antigüedad. Y con los datos reales el orden por importe rompía el recorrido (10): C05 tiene facturas de relleno
  vencidas con más saldo que T12-d91, así que la factura de 91 días no quedaba primera (verificado con el dominio sobre
  la semilla publicada el 25/11/2026). Con el atraso, T12-d91 es siempre la primera de C05 al 31/10/2026: ningún
  comprobante de relleno pasa de 89 días (`diseno.md` 5.4).
- **Subir:** con `cliente=`, la miga del medio ("En mora") vuelve a la medida de toda la empresa. No hay botón extra.
- **Medida de tramo** (desde la regla de tramos): igual, con "Detalle" = días de atraso y la etiqueta del tramo.
- **Medida "Otros"** (`mora-otros`; M4, solo con más de 5 deudores): `h1` "En mora: otros clientes al {F}" y la
  bajada "Los clientes con mora que no están entre los cinco primeros de «Deudores»." Con dos o más clientes, la tabla
  "Por cliente"; **con uno solo, sus partidas directamente, con la columna Cliente** (la regla de `diseno.md` 4.3: con
  partidas de un solo cliente se muestran las partidas). Es el caso al 31/10/2026: una partida de Montajes Sierra Chica
  Demo S.R.L. (C07), $ 71.775,99, 21 días, 1 a 30 días; total "Total (1 partida)". Así el nombre que la fila "Otros (1
  cliente)" no dice aparece a un clic. **En la tabla "Por cliente" de "Otros", el subtotal de cada fila lleva a
  `#/desglose/mora?corte=…&cliente={id}`** (la mora de ese cliente, que es su parte entera de "Otros"), no a
  `mora-otros` con `cliente=`: esa medida no admite filtro por cliente (el dominio lanza: `agregados.ts` y `partidas.ts`). Con 5 deudores o menos la clave no existe (H85): error "desglose inexistente"
  (8.2).

**Teléfono, 360 px:** encabezado igual (la cifra en `--t-cifra-2` de 1.375rem); "Cómo se calcula" a todo el ancho;
tablas en tarjetas: "Por cliente" → renglón 1 cliente (enlace a Cliente), renglón 2 "{N} partidas · {%}", renglón 3
"Importe" + cifra-enlace (filtra); "Partidas" → renglón 1 referencia, renglón 2 fecha · detalle, renglón 3 "Importe" +
cifra firmada. Total al pie (5.8).

---

## 7. Textos de interfaz (español neutro; los pule `redactor-ux` sin cambiarles el sentido)

### 7.1 Marco y vistas

| Dónde | Texto |
| --- | --- |
| Marca | "Tablero de cobranzas" |
| Etiqueta de la barra | "Demo con datos ficticios" |
| Fuente de los datos | "Datos ficticios de ejemplo, de {mes de aaaa} a {mes de aaaa}." ("de enero de 2025 a octubre de 2026") |
| Barra | "Empresa: Logística Andina Demo S.A. (ficticia)" · "Fecha de corte" · "Cierre anterior: {F}" / "Cierre siguiente: {F}" / "No hay cierre anterior" / "No hay cierre posterior" · "Volver al {F por defecto}" · "Cómo se calcula" |
| Opción del `select` | "{dd/mm/aaaa}" (sin agregados) |
| Anuncio al cambiar el corte | "Datos al {F}. En mora: {$}." (Resumen) · "Datos al {F}. Saldo del cliente: {$}." · "Datos al {F}. Saldo del comprobante: {$}. {N} días de atraso, tramo {tramo}." (si tiene saldo; si no, "… Saldo del comprobante: $ 0,00.") · "Datos al {F}. Total: {$}." (Desglose) |
| Aviso S5 | "La fecha de corte de la dirección no es válida. Se muestra el 31/10/2026." · "Cerrar aviso" |
| Aviso del mes | "El mes de la dirección no es válido. Se muestra {mes de aaaa}." |
| `h1` Resumen | "Cobranzas al {F}" |
| Bajada Resumen | "Quién debe, cuánto y desde cuándo, a la fecha de corte que se elija. Cada importe subrayado se abre hasta los comprobantes que lo forman." (a < 64rem, antes: "Logística Andina Demo S.A. (ficticia).") |
| Paneles Resumen | "Posición al {F}" · "Movimiento de {mes de aaaa}" · "Deudores" · "Para revisar" · "Facturado y cobrado, últimos 12 meses" · "Clientes" |
| Protagonista | "En mora" · "{%} de lo que hay por cobrar, en {N} clientes." (1: "en 1 cliente.") · "Ver de dónde sale este número →" · "Saldo a cobrar (con IVA)" · sin mora: "Ningún cliente tiene saldo vencido al {F}." |
| Regla | `h3` "Saldo a cobrar según días de atraso" · "No vencido" · "1 a 30 días" · "31 a 60 días" · "61 a 90 días" · "Más de 90 días" |
| Ubicador | "{N} días" (marca) · "0" · "30" · "60" · "90" · "días" (escala) |
| Movimiento del mes | "Facturación (sin IVA)" · "{N} comprobantes" · "Cobranza" · "de lo cual, retenciones:" · "{N} recibos" |
| Deudores | "Cliente" · "En mora" · "% de la mora" · "Tramo más antiguo" · "Días del más antiguo" · "Otros (1 cliente)" / "Otros ({N} clientes)" · "Total en mora" · vacío "Ningún cliente tiene saldo vencido al {F}." |
| Para revisar | dato del panel "{N} recibos" ("1 recibo") · `h3` "Pagos a cuenta sin imputar" · "Saldos a favor" · etiqueta "Revisar imputación" · origen "Sobrepago en {recibo}" |
| Gráfico | subtítulo "En millones de pesos, con IVA." · leyenda "Facturado" · "Cobrado" · renglón "{Mes de aaaa}: facturado {$} · cobrado {$}" · "Ver los 12 meses como tabla" · "Hay datos desde enero de 2025." · "Total de los 12 meses" · Cliente: "Facturación, últimos 12 meses" · "Sin IVA, en millones de pesos." · "Sin facturación en los últimos 12 meses." |
| Clientes | "Cliente" · "Plazo" ("30 días") · "Saldo" · "En mora" · "Saldo según atraso" (la barra de tramos no lleva números) · "Tramo más antiguo" · "Total" |
| `h1` Cliente / bajada | "{Razón social}" · "CUIT {cuit} (ficticio) · Plazo de pago: {N} días · al {F}" |
| Paneles Cliente | "Posición del cliente al {F}" · "Saldo (con IVA)" · "En mora" · "{%} del saldo" · "Comprobantes con saldo" · "Recibos" · "Cuenta corriente" · "Ir al saldo al {F}" · "Saldo al {F}" · "Pagos a cuenta sin imputar" · "Saldo a favor" · "Saldo neto" · "Total" |
| Vacíos Cliente | "Este cliente no tiene saldo a cobrar al {F}." · "No hay comprobantes con saldo al {F}." · "Todavía no tiene comprobantes." · "Todavía no tiene recibos." · "Sin movimientos hasta el {F}." |
| `h1` Comprobante | "Factura A {PV-número}" · "Nota de débito A {…}" · "Nota de crédito A {…}" |
| Comprobante | "Datos del comprobante" · "Emisión" · "Vencimiento" ("{F} (plazo de {N} días)") · "Servicio" · "Neto" · "IVA 21 %" · "Total" · "Asociada a:" · "Notas de crédito:" · "Situación al {F}" · "Saldo" · "{N} días de atraso" · frases de situación (6.3) · "Movimientos" · "Emisión" · "Cobro" · "Cobro parcial" · "Nota de crédito" · "Saldo al {F}" |
| Grupo posterior | "Después de la fecha de corte" · "(no cuentan para el saldo al {F})" |
| Recibo desplegado | "Recibo de {$} en total" · "Medios:" · "Imputado a:" · "A cuenta:" |
| Medios | "Transferencia" · "Cheque" · "Retención IIBB" · "Retención Ganancias" · "Retención IVA" |
| Servicios | "Alquiler mensual de camioneta 4x4 con chofer" · "Traslado de personal" · "Flete liviano" · "Horas de espera" · "Kilómetros excedentes" |
| Desglose | "¿De dónde sale este número?" · "Cómo se calcula" · "Solo los comprobantes de {Cliente} · al {F}" · "Por cliente" · "Partidas" · "Referencia" · "Fecha" · "Detalle" · "Importe" · "Total ({N} clientes, {M} partidas)" · "Total ({N} partidas)" (con 1, en singular: "1 cliente", "1 partida") · "Ordenar por" · "Atraso (el mayor primero)" (solo en medidas de saldo) · "Ordenado por {criterio}." · `mora-otros`: bajada "Los clientes con mora que no están entre los cinco primeros de «Deudores»." · vacío "No hay partidas: el total es $ 0,00." |
| Pie | ver 4.5 |

### 7.2 Errores y estados

| Dónde | Texto |
| --- | --- |
| Arranque | "Preparando los datos de ejemplo…" |
| Falla al iniciar | `h1` "No se pudo iniciar la demo" · "Recargue la página. Si el problema sigue, pruebe con otro navegador." · "Recargar la página" |
| Control que falla (D2, D3) | `h1` "No se puede mostrar este número" · "Su total no cuadra con la suma de sus partidas, así que la demo no lo muestra: es un error de programación, no de los datos. Medida: {clave}, corte {F}." · "Volver al resumen" |
| Ruta desconocida (incluye la de más de 200 caracteres, H84) | `h1` "Esta dirección no existe" · "Puede estar mal escrita." · "Ir al resumen" |
| Cliente inexistente | `h1` "No se encontró el cliente" · "Puede que la dirección esté mal escrita." · "Ir al resumen" (sin el id: la pantalla no repite lo que vino en la dirección, sección 2) |
| Comprobante inexistente | `h1` "No se encontró el comprobante" · ídem |
| Comprobante posterior al corte (S1) | `h1` "{Factura A …}" · "Este comprobante se emitió el {F emisión}, después de la fecha de corte ({F corte}). A esa fecha todavía no existía." · primario "Verlo al {último día del mes de emisión}" |
| Desglose inexistente (clave que no existe; `cliente=` vacío, repetido o de un cliente que no existe; `mora-otros` sin "Otros" a ese corte; `mora-otros` con `cliente=`: H81, H85, H90) | `h1` "No existe este desglose" · "Puede que la dirección esté mal escrita, o que ese número no exista a la fecha de corte elegida." · "Ir al resumen" (sin la clave ni el cliente escritos; el enrutador no distingue entre los cuatro casos) |

### 7.3 "Cómo se calcula" (pantalla; ejemplos con números de los datos)

| `h3` | Contenido (resumen; el texto final lo escribe `redactor-ux` con los números reales) |
| --- | --- |
| Qué es esta demo | Tablero de cobranzas de una empresa ficticia de servicios de flota. Solo lectura. Datos ficticios generados en el navegador, de enero de 2025 a octubre de 2026; se generan siempre iguales, así que lo que muestra la captura del README es lo que se ve acá. |
| La fecha de corte | Todo se calcula "como si hoy fuera" el cierre elegido: lo emitido o cobrado después no existe. Ejemplo T05: una factura de $ 363.000,00 se cobró el 03/11/2026; al 31/10/2026 sigue impaga. |
| Facturación | Neto sin IVA, por fecha de emisión; las notas de crédito restan. El IVA se calcula por comprobante y se suma, no sobre el neto total del mes. |
| Cobranza y retenciones | Las retenciones cancelan deuda como el dinero. Ejemplo T08 ($ 1.170.000,00 + $ 25.000,00 + $ 15.000,00 = $ 1.210.000,00). |
| Saldo, mora y días de atraso | Saldo con IVA; mora = saldos con al menos un día de atraso; lo que vence el día del corte no está en mora (T04); los cinco tramos; un pago parcial no reinicia el atraso (T02). Los cinco tramos suman el saldo a cobrar. |
| Pagos a cuenta y saldos a favor | Un pago a cuenta baja el saldo del cliente pero no la mora de cada comprobante (T06). Un sobrepago deja saldo a favor (T07). |
| Porcentajes | Un decimal y suman 100,0 %: si el redondeo no suma, el resto se reparte entre los mayores restos (M3). |
| Cada total cuadra con sus partidas | Cada importe es la suma de sus partidas, al centavo: el total de la tabla de un desglose es el mismo número que se abrió. Las pruebas automáticas de la demo lo comprueban para todas las medidas y todas las fechas de corte, y además controlan con cálculos separados que los cinco tramos sumen el saldo a cobrar, que los clientes sumen la empresa y que los meses sumen el año (D3). Si un control fallara, la demo no muestra el número. |
| Límites | Vencimientos en días corridos, sin feriados. Solo facturas A, en pesos. Sin intereses por mora. Sin contabilidad ni conciliación bancaria. |

---

## 8. Estados por vista

### 8.1 Error de la demo (D2) y falla al iniciar

Un solo componente de error (5.13) que reemplaza el contenido de `main`. Si una medida lanza porque no cuadra, **no se
muestra ninguna cifra de esa vista** (ni las que sí cuadraban: una vista con un número sospechoso no sirve). Textos en
7.2. Aparece **solo si un control falla** (D2 o los cruzados X1 a X6, D3). Con los datos de ejemplo no se llega a este
estado: es la defensa del principio, y en la pantalla normal no hay ninguna pieza que lo recuerde.

### 8.2 Tabla de estados

| Vista | Cargando | Vacío | Sin datos en el período | Error |
| --- | --- | --- | --- | --- |
| Marco | Arranque (5.13) | — | — | Falla al iniciar · corte inválido (aviso S5, la vista se muestra con el corte por defecto; también sobre una vista de error, sin corregir la dirección: H80) · desde una vista de error, cambiar el corte lleva al Resumen (H87, 5.2). |
| Resumen | — | Mora 0 (6.1; pasa al 31/01/2025); Deudores, Para revisar (no se dibuja) | Corte de los primeros meses: gráfico con "Hay datos desde enero de 2025."; movimiento del mes en 0 | D2 (8.1). |
| Cliente | — | Saldo 0, saldo a favor, sin comprobantes con saldo (6.2) | Sin movimientos (estado defensivo) | Cliente inexistente · D2. |
| Comprobante | — | Saldo 0: sin ubicador, etiqueta "Cancelado" o "Anulada por NC" | — | Inexistente · posterior al corte (S1) · D2. |
| Desglose | — | 0 partidas: "No hay partidas: el total es $ 0,00." (sin tabla) | — | Desglose inexistente (7.2), un solo error para cuatro casos: clave inexistente · `cliente=` vacío, repetido o inexistente (H81) · `mora-otros` con 5 deudores o menos (H85) · `mora-otros` con `cliente=` (H90). `mes=` mal escrito, repetido o fuera de 01/2025 al mes del corte: no es error, vuelve al mes del corte con el aviso del mes (en una medida que no es del mes se descarta sin aviso) · D2. |

---

## 9. Teclado, foco y accesibilidad (WCAG 2.2 AA como piso)

- **Puntos de referencia:** `header`, `nav` (Ruta), `main`, `footer`. Un `h1` por vista; `h2` por panel; `h3` por grupo.
- **Foco al cambiar de vista:** al `h1` (`tabindex="-1"`, sin anillo; sección 2). **Al cambiar solo el corte:** no se
  mueve; anuncio en la región de estado (5.2).
- **Orden de tabulación** = orden visual: "Ir al contenido" → "← Volver al portafolio" → `‹` → `select` → `›` →
  "Volver al {F}" (si está) → "Cómo se calcula" → migas → contenido → pie. Ningún `tabindex` positivo. En el teléfono, el
  panel Situación va antes que Datos del comprobante **también en el DOM** (6.3), no solo con `order`.
- **Flechas del corte:** si la que tiene el foco queda deshabilitada, el foco va al `select` (5.2).
- **Desplegables y diálogo:** Enter y Espacio abren el recibo; Esc cierra el diálogo y devuelve el foco. `details` del
  gráfico, nativo.
- **"Ir al saldo al {F}":** el destino recibe el foco (no solo el desplazamiento).
- **Tamaño de objetivos (2.5.8):** 44 × 44 en botones, flechas, `select`, migas y `summary`. Las cifras-enlace, los
  nombres de cliente, los talones y los dos enlaces del pie miden **al menos 24 px de alto** (`min-height: 1.5rem` con
  `inline-flex`; desde el 26/11/2026: medían de 16 a 22 px y cumplían solo por la excepción de espaciado). Dentro de una
  tabla un margen de −2 px arriba y abajo devuelve a la fila lo que suma el mínimo: las filas miden lo mismo que antes.
  Las de texto corrido (la frase del protagonista, la bajada con el nombre del cliente) cumplen por la excepción de
  enlaces dentro de una oración y no se tocan.
- **Contraste (1.4.3, 1.4.11):** sección 3.3. Se vuelve a medir lo maquetado.
- **Uso del color (1.4.1):** tramos con rótulo, series con leyenda y tabla, etiquetas con texto, enlaces con subrayado,
  selector marcado con botón "Volver al {F}" y fecha en el `h1`.
- **Contenido no textual (1.1.1):** regla y gráfico con `role="img"` y `aria-label`; datos completos en la lista de
  tramos y en la tabla del gráfico. El ubicador es `aria-hidden`: su contenido ("{N} días de atraso", la etiqueta del
  tramo) está escrito al lado.
- **Tablas (1.3.1):** `th` con `scope`; en tarjetas, roles explícitos; `tfoot` con `th scope="row"`.
- **Estado (4.1.3):** región del corte; barras de estado de los paneles al ordenar; aviso S5.
- **Reflujo y texto (1.4.10, 1.4.4, 1.4.12):** a 320 px y con zoom de 400 %, sin desplazamiento horizontal (las tablas
  pasan a tarjetas; las cifras grandes pueden partir en los `<wbr>`). Texto al 200 % a 360 px (`html { font-size: 200%
  }`): sin superposiciones ni desplazamiento; los rótulos del gráfico pasan a inicial (5.10); el rótulo de la marca del
  ubicador se alinea al borde (5.6.2). **Nada queda cortado** con la letra raíz al 150 % y al 200 % a 320, 360 y 390 px
  (verificado el 26/11/2026 en las ocho pantallas; `overflow-x: clip` en `html` y `body` impide desplazarse, así que lo
  que no entra tiene que bajar de renglón): los `select` («Ordenar por», la fecha de corte) llevan `width: 100%` con su
  `flex` y su tope, de modo que el texto de su opción más larga no fija el ancho mínimo de la barra; «Cómo se calcula»
  de la barra del celular puede partirse en dos renglones; «Demo» baja a su renglón; el nombre de «Atrás» baja de
  renglón cuando la barra mide menos de 18 rem (con el texto de siempre se acorta con «…»). Excepción conocida: a 320 px
  con el texto al 200 %, dos pastillas de tramo (Comprobantes) son más anchas que la fila visible (206 px) y se leen
  desplazando la fila; la enfocada con teclado se trae a la vista.
- **Tamaño del texto de las etiquetas de la barra del celular:** «Demo» 12 px; rótulos de las pestañas inferiores 13 px
  (11,5 px a 320 px: el tope es el 3,6 % del ancho de la barra para que «Comprobantes» no se parta con el texto agrandado).
- **Colores forzados:** foco `Highlight`; tramos, barras, marca y líneas con `forced-color-adjust: none` o `CanvasText`.
- **Movimiento:** `prefers-reduced-motion` respetado (3.6); no hay nada animado que transmita información.
- **Idioma:** `<html lang="es">`.
- **Lectores de pantalla:** la cifra protagonista es una frase; cada cifra-enlace dice qué medida es (y de qué cliente);
  la regla y el gráfico tienen su resumen; el cambio de corte en el Comprobante anuncia saldo, días y tramo.

---

## 10. El recorrido de 2 minutos (paso a paso)

Es la prueba de punta a punta de E6 (Playwright o a mano) y el guion del README. Con el corte por defecto y **con los
datos de ejemplo** (semilla `20261122`; cifras de `diseno.md` 5.3 y 5.4 y de `esperado.ts`). Cuatro clics hasta el momento más fuerte,
que llega a los 50 segundos. Ningún paso baja de nivel por una miga.

| Segundo | Hace | Ve | Foco y dirección |
| --- | --- | --- | --- |
| 0 | Abre `tablero.matiasormeno.com.ar`. | `h1` "Cobranzas al 31/10/2026" y la bajada con la fuente de los datos. Panel "Posición": **"En mora $ 6.306.481,28 — 22,1 % de lo que hay por cobrar, en 6 clientes."** Debajo, el saldo a cobrar ($ 28.513.662,10) y **la regla de tramos**: No vencido $ 22.207.180,82 · 1 a 30 días $ 4.552.834,33 · 31 a 60 $ 23.241,68 (el tramo de 3 px, 5.6.1) · 61 a 90 $ 1.125.405,27 · Más de 90 $ 605.000,00 (T12-d91, exacto). A la derecha, facturación de octubre (sin IVA) $ 15.705.914,00 y cobranza $ 23.847.590,51 con $ 152.972,81 de retenciones. | La dirección queda como entró: sin corte no se reescribe (H79); los enlaces de la vista ya llevan `corte=2026-10-31`. Foco en el `h1`. |
| 10 | Hace clic en la cifra de la mora (o en "Ver de dónde sale este número →"). | Desglose: "¿De dónde sale este número?", `h1` "En mora al 31/10/2026", $ 6.306.481,28, la fórmula en palabras y "Por cliente": una fila por cliente con mora (seis), la primera **Contratista Los Algarrobos Demo S.A., 9 partidas, $ 3.446.078,79, 54,7 %**; total $ 6.306.481,28 (6 clientes, 16 partidas). | `#/desglose/mora?corte=2026-10-31`. Foco en el `h1`. |
| 20 | Hace clic en el **importe** de la primera fila ($ 3.446.078,79). | El mismo desglose filtrado: `h1` "En mora al 31/10/2026 · Contratista Los Algarrobos Demo S.A.", sus 9 facturas vencidas **de la más atrasada a la menos** (orden por defecto de las medidas de saldo, 6.4): primero T12-d91 (91 días · Más de 90 · $ 605.000,00), después 7 de relleno y T05-F (6 días · 1 a 30 · $ 363.000,00); total $ 3.446.078,79. | `…&cliente=C05`. Foco en el `h1`. |
| 30 | Hace clic en la primera factura (la de 91 días, T12-d91 con su historia T17). | Vista Comprobante: "Situación al 31/10/2026": **saldo $ 605.000,00 · 91 días de atraso · Más de 90 días**, y el **ubicador con el último tramo pintado** y la marca en "91 días". Al lado, neto $ 900.000,00 + IVA $ 189.000,00 = total $ 1.089.000,00. Movimientos: emisión, nota de crédito ($ 121.000,00) y **dos cobros parciales** ($ 242.000,00 y $ 121.000,00). | `#/comprobante/1-0003-{n}?corte=2026-10-31`. Foco en el `h1`. |
| 40 | Despliega el cobro del 12/08/2026. | **"Transferencia $ 234.000,00 · Retención IIBB $ 5.000,00 · Retención Ganancias $ 3.000,00"**: las retenciones cancelan deuda como el dinero. | El foco se queda en el botón del recibo. |
| 50 | Pulsa `‹` ("Cierre anterior: 30/09/2026"). | **El mismo comprobante a otra fecha**: en el ubicador, el tramo pintado pasa de "Más de 90" al tercero ("31 a 60") y la marca a "60 días"; el saldo sube a $ 726.000,00; la etiqueta dice "31 a 60 días"; el cobro del 14/10 ($ 121.000,00) pasa al grupo "Después de la fecha de corte". El selector queda marcado en ámbar y aparece "Volver al 31/10/2026". La bajada dice "al 30/09/2026". | `?corte=2026-09-30`. El foco **se queda** en `‹`. Se anuncia "Datos al 30/09/2026. Saldo del comprobante: $ 726.000,00. 60 días de atraso, tramo 31 a 60 días." |
| 70 | Hace clic en la miga del cliente (**sube** a su cliente). | Vista Cliente al 30/09/2026: Contratista Los Algarrobos Demo S.A., CUIT ficticio, plazo de 30 días, su regla mediana y sus comprobantes con saldo a esa fecha, por vencimiento (la factura del recorrido en 31 a 60; T05-F no vencida; más los de relleno que dé la lógica: al 30/09 no están en la referencia de 5.4). | `#/cliente/C05?corte=2026-09-30`. Foco en el `h1`. |
| 85 | Hace clic en "Resumen" en las migas. | El Resumen al 30/09/2026: otra mora, otra regla de tramos, el gráfico termina en septiembre con su banda. | `#/?corte=2026-09-30`. Foco en el `h1`. |
| 100 | Pulsa "Volver al 31/10/2026". | El Resumen del principio; el selector deja de estar marcado y el botón desaparece. | `?corte=2026-10-31`. Foco en el `select`. |
| 110 | Abre "Cómo se calcula". | Las reglas con ejemplos reales, entre ellas "Cada total cuadra con sus partidas" y "La fecha de corte". | Diálogo con foco en su título; Esc vuelve al botón. |

Lo que se lleva en 2 minutos: **cada número se abre hasta el comprobante, y la fecha de corte mueve todo de forma
coherente: la misma factura cambia de tramo en la regla.**

---

## 11. Lo que NO hay que hacer

- Fila o grilla de tarjetas de indicadores tipo "bento"; flechas de variación ▲▼ en verde y rojo; velocímetros,
  medidores circulares, donas o tortas (la antigüedad es una regla, no una dona); gráficos 3D; mapas; ilustraciones;
  emojis.
- **Piezas de verificación en pantalla**: renglones "suma de … = total ✓", tildes verdes junto a un total, doble raya
  contable debajo de un importe, textos "cierra" o "cuadra" en las vistas. La comprobación vive en las pruebas y se
  explica solo en "Cómo se calcula" (7.3).
- **Sellos de datos**: renglones con semilla, huella, versión o fecha de los datos con aspecto de sello o firma
  (monoespaciada, recuadro, mayúsculas, rotación, tinta). La fuente de los datos es una frase común (5.11).
- Una fecha fija en la etiqueta de la barra o en cualquier lugar donde quede pegada a la fecha de corte del `h1`.
- "(por defecto)" u otros agregados dentro de las opciones del `select` de corte.
- Que el nombre de un cliente lleve a destinos distintos según la tabla, o que un paso del recorrido dependa de una miga
  para bajar de nivel.
- Pintar de rojo la cifra de la mora, el panel protagonista o las filas: el rojo es del tramo, en la regla y en las
  etiquetas.
- Mostrar los negativos en rojo (negativo no es mora: M1, C5) o entre paréntesis.
- Redondear o abreviar un importe abrible ("$ 2,9 M", "3 millones"): las abreviaturas solo en las marcas del eje.
- *Tooltips* o información solo al pasar el mouse; valores dentro de las barras o de los tramos; barras interactivas.
- Gráfico de facturación sin IVA al lado de la cobranza con IVA (5.10).
- Eje de importes que no empiece en 0; ejes dobles; líneas suavizadas; barras o tramos con radio, borde o degradé (salvo
  el borde de los tramos apagados del ubicador).
- Animar cifras, barras que crecen, la marca del ubicador que se desliza, destellos al cambiar el corte, esqueletos con
  brillo, animaciones al desplazar.
- Mover el foco al cambiar el corte; dejar el foco en una flecha deshabilitada.
- Tachado o transparencia en los movimientos posteriores al corte (bajan el contraste); ocultarlos (son la prueba de S1).
- Papel rayado, texturas de libro contable, tipografía de máquina de escribir, sellos de goma.
- Gradientes, vidrio esmerilado, violeta, brillos, sombras grandes, píldoras, mayúsculas fuera de rótulos, cabeceras y
  la etiqueta de la barra.
- `min-width` en tablas o desplazamiento horizontal de la página a cualquier ancho.
- Atributo `style` en el marcado, `{@html}`, `innerHTML` para el SVG, `<foreignObject>`, fuentes, íconos, scripts o
  bibliotecas de gráficos de un CDN o de npm.
- Una quinta vista (recibos, meses o tramos se ven dentro de las cuatro).
- Botones visibles que no hacen nada o que no aplican; "Exportar" o "Imprimir" antes de que existan (P2).
- Nombrar empleadores o clientes reales, decir que la demo reproduce el sistema de una empresa, usar nombres de
  proyectos o empresas reales.

---

## 12. Reparto de trabajo (para que programador y maquetador no se pisen)

Igual que en la Demo 2; los nombres de archivos los fija `docs/plan.md`.

| Quién | Qué |
| --- | --- |
| Programador | Dominio, medidas, generador, formateo (`es-AR`, partes entero/centavos para `Cifra`), textos (`textos.ts`, incluida la frase de fuente de los datos desde `desde` y `hasta`), rutas con `corte`/`cliente`/`mes`, foco al `h1`, región de anuncio del corte, `aria-label` de la regla y del gráfico, escalas del gráfico (marcas redondas, posiciones de barras en px), el cálculo de "inicial o abreviatura" de los meses y **`posicionEnRegla(atraso)`** (5.6.2, con test de los bordes: −30, 0, 1, 30, 31, 60, 61, 90, 91, 180 y 400). |
| Maquetador | `tokens.css` (sección 3), `base.css`, sprite de íconos y los componentes de presentación: `Cifra`, `CifraEnlace`, `Panel`, `Etiqueta`, `ReglaTramos` (variantes completa, mediana y mínima), `Ubicador`, `Tabla` (tres disposiciones y total de tabla), `ReciboDesplegable`, `GraficoMeses` (marcado SVG y estilos; recibe las posiciones ya calculadas), `SelectorCorte` (con el estado "otro corte"), `Aviso`, `Vacio`, `Dialogo`. Reciben datos por `props`; no leen el estado global. |
| Los dos (acuerdo previo) | `src/componentes/tipos.ts`: lo escribe el programador primero; el maquetador pide cambios. |

Lo que la vista **necesita de la lógica**, confirmado en `diseno.md` (4.2 y 4.3) el 22/11/2026 (acá solo nombres y
referencias):

| Necesidad de la vista | Nombre o regla real |
| --- | --- |
| Claves de medida | `mora`, `saldo`, `saldo-neto`, `facturacion-mes` (sin IVA), `facturado-con-iva-mes` (P1), `cobranza-mes`, `retenciones-mes`, `tramo-no-vencido`, `tramo-1-30`, `tramo-31-60`, `tramo-61-90`, `tramo-mas-90`, `pagos-a-cuenta`, `saldos-a-favor` y `mora-otros` ("Otros" de deudores; solo con más de 5). `iva-mes`, si `diseno.md` la conserva, no aparece en ninguna pantalla. |
| Filtros | `cliente=C01…C13` en cualquier medida; `mes=AAAA-MM` solo en las cinco medidas del mes, válido de 2025-01 al mes del corte. |
| Cliente de cada partida | `partida.clienteId`; además `partida.fecha` y, en las medidas de saldo, `partida.atraso` (el tramo sale de él). |
| Detalle de cada partida | `partida.nota`, texto armado por la lógica. |
| "Por cliente" | `porCliente(medida)`: una fila por cliente con partidas y subtotal; el % es "—" en todas las filas si algún subtotal es negativo. |
| Saldo de un comprobante | No es una medida: texto; su desglose son los Movimientos. Además, su atraso y su tramo para el ubicador. |
| Columna Saldo de "Clientes" | `saldo` con `cliente=` (nunca negativo); el a cuenta y el saldo neto van aparte. |
| Serie "Facturado" del gráfico | `facturado-con-iva-mes` por mes; "Cobrado": `cobranza-mes`. Total de 12 meses: suma de la columna. |

Orden sugerido (las etapas están en `docs/plan.md`): tokens y `contraste.mjs` → `Cifra`, `ReglaTramos`, `Ubicador`,
`Tabla` con datos de ejemplo → marco con el selector → Resumen → Desglose → Comprobante → Cliente → pasada a 360, 768
y 1280 en claro y oscuro.

### 12.1 Verificación de la maquetación

- 320, 360, 768, 1024 y 1280 px, claro y oscuro, con el corte por defecto, con 30/09/2026 (selector marcado) y con
  31/01/2025 (un solo mes de datos): sin desplazamiento horizontal.
- El recorrido de la sección 10, con mouse y **solo con teclado**.
- A 360 px con el corte en 30/09/2026: el `select` muestra "30/09/2026" entero, "Volver al 31/10/2026" en su renglón y
  una sola fecha de corte arriba del contenido (la del `h1`).
- Texto al 200 % a 360 px; zoom 400 %; espaciado de texto aumentado; colores forzados; movimiento reducido.
- Contraste de lo maquetado medido otra vez (`npm run contraste`, con los pares de 3.3 agregados al script copiado; en
  oscuro, "Más de 90" tiene que ser el tramo de mayor contraste).
- Consola sin errores ni violaciones de CSP con el build servido con `public/_headers`.
- NVDA + Chrome: protagonista como frase, cifras-enlace con su medida y su cliente, regla y gráfico con su resumen,
  tablas en tarjetas con encabezados, anuncio al cambiar el corte en el Comprobante con saldo, días y tramo.
- Metas medidas a 1280 × 800: protagonista, regla y "Movimiento del mes" visibles sin desplazar; en el Comprobante, la
  Situación con el ubicador sin desplazar. A 360 × 780: la cifra de la mora y su frase visibles sin desplazar (la cifra
  en un renglón); en el Comprobante, saldo, etiqueta y ubicador sin desplazar.
- Búsqueda en el texto renderizado y en `src/`: no aparecen "✓", "cierra", "cuadra" (salvo en "Cómo se calcula" y en el
  error 8.1), "semilla" ni "huella".

---

## 13. Decisiones

### 13.1 Preguntas para Matías, contestadas el 22/11/2026

Matías decidió las tres según la recomendación (columna "Decisión"). Aplicadas: P1 en 5.10 y en la medida
`facturado-con-iva-mes` de `diseno.md` (decisión 9); P2 en 6.1 (decisión 10); P3 en 3.2 (decisión 11).

| # | Pregunta | Opciones | Recomendación | Decisión (22/11/2026) |
| --- | --- | --- | --- | --- |
| P1 | En el gráfico del Resumen, ¿qué se compara con la cobranza? | (a) Facturado **con IVA** contra cobrado (la tabla trae también la facturación sin IVA). (b) Facturación sin IVA contra cobrado. | **(a).** Con (b) parece que todos los meses se cobra un 21 % más de lo que se factura, y un evaluador de administración lo marca. La cifra principal sigue sin IVA (decisión 4). | **Decidida: (a).** Aplicada. |
| P2 | ¿Cómo se presentan los cuatro números? | (a) Dos paneles: "Posición al corte" (mora protagonista + saldo a cobrar + antigüedad) y "Movimiento del mes" (facturación y cobranza con retenciones). (b) La mora arriba y debajo una fila de cuatro cifras iguales. | **(a).** Separa flujo del mes de posición al corte, no repite la mora dos veces y evita la "fila de cifras" que ya se rechazó en la web. | **Decidida: (a).** Aplicada. |
| P3 | Color de acento | (a) Azul tinta propio (`#1F5A96`). (b) El azul petróleo de la Demo 2. | **(a).** Misma familia y se distingue a simple vista en el portafolio, donde las demos van una al lado de la otra. | **Decidida: (a).** Aplicada. |

### 13.2 Revisión del 22/11/2026 (decidida por Matías)

- Dirección visual "Regla de tramos": la antigüedad de saldos es la pieza propia, con el ubicador del Comprobante.
- Los totales se muestran como total de tabla común: no hay renglones de verificación ni doble raya en pantalla. La
  comprobación queda en las pruebas (D2) y se explica en "Cómo se calcula".
- La fuente de los datos es una frase común ("Datos ficticios de ejemplo, de enero de 2025 a octubre de 2026."); la
  semilla, la huella y la versión del conjunto quedan en el README y en las pruebas. La fecha de corte sigue igual
  (selector, dirección y `h1`).
- Correcciones de la revisión de E0: números de los dibujos solo si son exactos por construcción (`diseno.md` 5.4: tramo
  "Más de 90" $ 605.000,00) y una marca de "se fija en E4" para el resto, con "Otros" esperado al corte por defecto
  (las marcas se reemplazaron por las cifras reales el 25/11/2026: 13.4); rampa oscura de tramos con el contraste creciendo con la gravedad (3.3); una sola regla de
  navegación (nombre → Cliente, importe → Desglose; recorrido sin migas para bajar); etiqueta de la barra sin fecha y
  `select` sin "(por defecto)", con el selector marcado fuera del corte por defecto; nombre "Tablero de cobranzas".

Decidido acá sin preguntar (reversible, de interfaz): sin franja roja en el protagonista; cuenta corriente en orden
cronológico ascendente con enlace al saldo; recibo como desplegable y no como vista; `aria-label` del gráfico con
resumen y no con los 24 importes; `details` para "Ver como tabla"; foco que no se mueve al cambiar el corte; Situación
antes que Datos en el Comprobante a 360 px; sin enlace a "partidas sin agrupar".

### 13.3 Preguntas para Matías (25/11/2026)

| # | Pregunta | Opciones | Recomendación |
| --- | --- | --- | --- |
| 1 | En la tabla "Deudores", cuando fuera de los cinco primeros queda **un solo cliente**, ¿se lo agrupa igual en "Otros (1 cliente)"? Pasa al corte por defecto (C07) y en 10 de los 15 cierres que tienen "Otros". | (a) Sí, como hoy: "Otros (1 cliente)", y el nombre aparece al abrirlo. (b) Cambiar la regla M4 para que "Otros" exista solo con 2 clientes o más (con 6 deudores se verían 6 filas con nombre). | **(a).** La fila no miente y el nombre está a un clic. (b) cambia una regla de negocio y su código y pruebas (`rankingConOtros`, `clavesExistentes`, H85, la referencia) y, al corte por defecto, "Otros" dejaría de existir: justo lo que la semilla `20261122` se eligió para tener (H78). |
| 2 | Si se está mirando el desglose de "Otros" y se cambia a un cierre donde "Otros" no existe (por ejemplo, del 30/09/2026 al 31/08/2026), hoy aparece "No existe este desglose". ¿Se deja así? | (a) Dejarlo (H87 tal como está). (b) Que en ese caso se pase al desglose de la mora completa a ese cierre, con un aviso ("Al 31/08/2026 no hay «Otros»: se muestra la mora de todos los clientes."). | **(b).** Cambiar el corte con la flecha no debería llevar a una pantalla de error. Es un cambio chico del programador en `direccion.svelte.ts` (más un texto en `textos.ts` y su test), no de una regla de negocio; mientras no se decida, vale (a). |

### 13.4 Cambios del 25/11/2026

Ajuste de la especificación a la semilla publicada `20261122` (decisión de Matías del 25/11/2026, `diseno.md` H78) y
revisión de las decisiones del enrutador (H79 a H89). No cambia ninguna regla de negocio.

1. **Cifras reales en lugar de las 77 marcas de "se fija en E4"**: en el encuadre, la cifra-enlace, la regla de tramos,
   el total de tabla, "Deudores", el gráfico, el Resumen (1280 y 360), el Cliente C05, el Desglose y el recorrido. Salen
   de `diseno.md` 5.4 y `esperado.ts`; lo que esas fuentes no fijan queda con llave (`{n}`), no inventado.
2. **"Seis deudores" en lugar de "se esperan siete"** (5.9.1): "Otros" existe y tiene un cliente.
3. **Rótulo "Otros (1 cliente)"** en singular (5.9.1, 7.1); la regla M4 no cambia (pregunta 1). El desglose de "Otros"
   con un solo cliente muestra sus partidas con la columna Cliente (6.4, regla de `diseno.md` 4.3).
4. **Tramo muy chico** (5.6.1): "31 a 60 días" es el 0,1 % y a su proporción no llega a 1 px; queda el ancho mínimo de
   3 px que ya tiene `ReglaTramos.svelte`, sin rótulos sobre la barra; "0,0 %" si un tramo redondea a cero. El gráfico
   de meses usa el mismo criterio (1 px; 5.10). **Sin cambios en los componentes.**
5. **Orden por defecto de las partidas en las medidas de saldo: por atraso** (5.9.2, 6.4). Con el orden por importe,
   la factura de 91 días no quedaba primera en el desglose de C05 y el paso 30 del recorrido fallaba.
6. **Enrutador (H79 a H89) reflejado en la especificación:** tabla de direcciones escritas a mano (2), `#/` sin corte
   no se reescribe (recorrido, paso 0), cambio de corte desde una vista de error (5.2, 8.2), dos avisos a la vez con
   nombres de botón distintos (5.12), errores que no repiten lo escrito en la dirección y un solo error para el
   desglose inexistente (7.2, 8.2).
7. **Mora 0 es alcanzable** (6.1, 8.2): pasa al 31/01/2025, el primer cierre.
8. **"Otros" con `cliente=`** (2, 6.4): el subtotal de cada cliente en el desglose de "Otros" lleva a `mora` con
   `cliente=`; la dirección `mora-otros&cliente=` escrita a mano debe dar "desglose inexistente" (resuelto en el
   enrutador: H90 de `diseno.md`).
