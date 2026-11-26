# CLAUDE.md — Demo 3: Tablero de cobranzas

Demo propia del portafolio de Matías Ariel Ormeño: tablero de cobranzas con datos ficticios. Diseño: `docs/diseno.md` y
`docs/diseno-ui.md`. Tecnología: `docs/stack.md`. Etapas: `docs/plan.md`. Historia de decisiones: `docs/registro.md`.

## Objetivo

Tablero de **facturación, cobranza y mora** de una empresa ficticia de servicios de flota ("Logística Andina Demo S.A.", la
misma de la Demo 2), con datos ficticios generados con semilla y calendario fijos (01/2025 a 10/2026). Ocho pantallas
(Resumen, Comprobantes, Clientes y Meses, que son pestañas; y Cliente, Comprobante, Desglose y «Cómo se calcula»), **fecha de corte elegible**
(cierres de mes) en la dirección y una regla que no se
negocia: **cada número se abre hasta el comprobante y la suma cierra al centavo**, lo que se prueba con dos cálculos
independientes de cada cifra y controles cruzados (el cierre no se muestra en pantalla). Dinero en centavos enteros con un
tipo con marca. En vivo en `https://tablero.matiasormeno.com.ar`.

## Qué NO hace

- No tiene servidor, login, base de datos ni IA. Nada sale del navegador. **No carga datos del usuario** (ni CSV ni Excel).
- **Datos ficticios; no se usa código, datos, documentos ni repositorios de terceros.** Las únicas fuentes son estos
  documentos y el código propio de las Demos 1 (lector de facturas) y 2 (control de flota), del mismo autor.
- No usa datos reales (empresas, CUIT, personas, montos). Todo sale del generador con semilla; los CUIT llevan la palabra
  "ficticio". Los importes son de ficción.
- No muestra en pantalla el control de cierre ni la semilla y la huella (viven en los tests y en el README).
- Fuera de alcance (ver `docs/diseno.md`, sección 3): intereses por mora, varias monedas, facturas B/C/E, feriados,
  contabilidad, conciliación bancaria, cheques diferidos, proyecciones, edición de datos.

## Agentes

Agentes de IA de trabajo (modelos con instrucciones distintas). **Un agente principal orquesta**: el modelo y el esfuerzo por
defecto de cada uno se ajustan en cada llamada según la tarea (lectura simple → modelo liviano). **Matías decide el contenido
y el negocio.**

| Agente | Para qué en esta demo |
| --- | --- |
| `disenador-ui` | `docs/diseno-ui.md`: tokens, componentes, estados, responsive; gráficos y sus tablas. Revisión visual contra la especificación. |
| `redactor-ux` | Rótulos, fórmulas en palabras, "Cómo se calcula", avisos y README, en español neutro. |
| `maquetador` | HTML/CSS y SVG desde la especificación, claro/oscuro, 360 px, accesible. No toca la lógica. |
| `programador` | Dominio y generador en TypeScript con TDD, sin dependencias nuevas. No toca estilos. |
| `revisor-codigo` | Revisión del diff (M2 y M3 con lupa: son el dinero). No edita. |
| `qa-destructor` | Cortes inválidos en la dirección, rutas hostiles, teclado, 360 px, consola, CSP. No edita. |
| `auditor-accesibilidad` | WCAG 2.2 AA con contraste medido; gráficos y tablas equivalentes. No edita. |
| `lector` / `Explore` | Inventarios, salidas largas, búsquedas. |

Flujo de una vista: `disenador-ui` + `redactor-ux` → `programador` (lógica) y `maquetador` (presentación), sin pisarse en los
mismos archivos → `revisor-codigo`, `qa-destructor` y `auditor-accesibilidad` en paralelo → correcciones →
Matías decide. En el registro, lo que decidió Matías se anota como tal y lo que propuso la IA, como
propuesto.

## Entorno

- Windows 11, PowerShell 7. Node 24, npm 11, git.
- Stack (decisión S1, `docs/stack.md`): Vite + TypeScript + Svelte 5 sin SvelteKit, la misma de la Demo 2. Dependencias con
  versión exacta y ≥ 14 días publicadas; sumar otra requiere justificarla. Única dependencia de
  producción: `svelte`. `@playwright/test` como dependencia de desarrollo solo si GitHub Actions anda (decisión 7).
- `npm run dev` en el puerto 5173 (si otra demo está corriendo, Vite toma el siguiente libre).
- Sin servicios locales ni secretos. Espacio en disco: despreciable (`node_modules` ~100–200 MB).
- Datos sensibles: ninguno. Todo es ficticio.

## Cómo se verifica

`npm run check` (0 errores), `npm run contraste` (0 fallas), `npm run peso` (JS con gzip bajo 100.000 B), `npm test` (con matriz de zonas horarias en CI: `npm run test:tz`), `npm run mutaciones` (cada uno de los cambios plantados en `scripts/mutaciones.json` tiene que hacer fallar algún test; 60 de 60 detectadas el 26/11/2026, en unos 7 minutos (6 min 49 s); edita `src/lib` mientras corre, así que no se toca en paralelo), `npm run build` servido con la
CSP real (`npm run servir`) sin violaciones, `npm audit --audit-level=high`, `npm run buscar` (sin `{@html}`, `Math.random`
ni `new Date(` en `src/lib`; de respaldo del tipo `Centavos`, sin `parseFloat`, `toFixed`, `Math.round` ni `Number(` en
`src/lib/dominio`; sin nombres reales) y la verificación de `docs/diseno-ui.md`. Tests con el identificador de la regla en el
nombre; la tabla de reglas de `docs/diseno.md` y la suite se cruzan por esos identificadores. Cada regla se prueba con un
fixture escrito a mano (`tests/fixtures/`); el resultado de la semilla publicada es una prueba de referencia, no una promesa
para toda semilla. La huella del conjunto de datos está fijada en un test: si cambia el generador, el test falla hasta que se
actualiza a propósito, con una línea en el registro. En los cierres de etapa se corren las verificaciones y se mira el
navegador (escritorio y 360 px, claro y oscuro, con y sin movimiento reducido; el movimiento entre pantallas se mira con Playwright contra el build servido).

## Cómo se retoma

Leer este archivo, el `README.md`, `docs/plan.md` y la última entrada de `docs/registro.md` (su "Próxima acción").
Conversación en rioplatense; **textos de la interfaz, README y documentos en español neutro**. Commits en español, uno por
paso, que dicen qué regla, caso o pantalla quedó hecha.
