# Diseño — Tablero de cobranzas (actualizado el 25/11/2026, E5)

Escrito antes del código, **desde cero**: modelo de datos, generador, reglas de negocio y casos con números, a partir de
un plan de alcance propio y de la forma de trabajo de la Demo 2 (Control de flota, del mismo autor). Donde había un hueco o
una contradicción, la sección 11 dice qué se decidió y quién. No usa código, datos ni documentos de terceros. Todos los datos
son ficticios.

Autoría: idea, alcance, decisiones y revisión, de Matías; especificación, código y tests, de agentes de IA bajo su
dirección (cada decisión dice quién la tomó: sección 11).

Documentos hermanos: `docs/diseno-ui.md` (pantallas y sistema visual: especificación para los agentes que maquetan),
`docs/stack.md` (tecnología), `docs/plan.md` (etapas), `docs/registro.md` (qué se hizo y cuándo). Si algo de acá no alcanza
para programar sin adivinar, es un defecto de este documento: se pregunta antes de inventar.

---

## 1. Problema y lectores

La demo anterior de la misma empresa ficticia (Control de flota) responde "¿qué unidad puede salir hoy?". Esta responde
la pregunta del otro escritorio: **"¿cuánto facturamos, cuánto cobramos y quién nos debe, desde cuándo?"**, a una fecha
de corte que se puede cambiar, con un principio que no se negocia: **cada número se abre hasta el comprobante y la suma
cierra al centavo**. Ese cierre no se exhibe en pantalla: se prueba con dos cálculos independientes de cada cifra y se
explica en "Cómo se calcula" (4.2.1).

| Lector | Qué tiene que poder verificar |
| --- | --- |
| Administración o cobranzas (en la demo en vivo, 2 minutos) | Que la demo habla su idioma: neto sin IVA, retenciones, pagos a cuenta sin imputar, saldo a favor, mora por días de atraso. Que cada cifra tiene su "¿de dónde sale?" hasta el comprobante. Que al cambiar la fecha de corte cambian los números y una factura cobrada en octubre vuelve a estar impaga al 30/09. |
| Líder técnico (en el repositorio) | Reglas con identificador (M, C, R, S, A, D, G), cada una con su caso y su test con el identificador en el nombre; dinero en centavos enteros con un tipo con marca; **cada cifra calculada por dos caminos independientes y controles cruzados** (con una mutación plantada que los hace fallar); reproducibilidad (la huella del conjunto de datos, en el test y el README); CSP estricta, una sola dependencia de producción. |

Recorrido de 2 minutos (el que la prueba de punta a punta repite, ver `plan.md`, E6): portada con "En mora al 31/10/2026"
→ clic en la mora → desglose por cliente → el cliente con más mora (se espera **C05**; se confirma en E4, 5.4) → su
comprobante de más atraso, **T12-d91** (factura con una nota de crédito parcial, dos cobros parciales, uno de ellos con
retenciones, y 91 días de atraso; caso T17) → cambiar el corte a 30/09/2026, donde es **el mismo comprobante** con saldo
726.000,00, atraso 60 y tramo 31–60, y el cobro de octubre pasa a "Después de la fecha de corte" (H15).

## 2. Universo compartido con la Demo 2, datos propios

Es **la misma empresa ficticia**, "Logística Andina Demo S.A.", vista desde administración. Se comparten los **nombres**
(empresa, las dos operadoras de los proyectos de la Demo 2, los servicios de una empresa de flota) y **no los datos**: esta
demo no lee, importa ni enlaza nada de la otra (decisión 6). El pie solo trae un enlace: "Otra demo con la misma empresa
ficticia: Control de flota". CUIT de la empresa: el mismo que usa la Demo 2 (`armarCuit("30", "99000003")`), siempre
rotulado "ficticio".

## 3. Alcance

| Prioridad | Qué entra |
| --- | --- |
| **P1 (mínimo publicable)** | Datos ficticios con semilla y calendario fijos. Cuatro vistas: **Resumen, Cliente, Comprobante** y **Desglose** ("¿De dónde sale este número?"). Todo número es un enlace a su desglose. **Fecha de corte en la dirección y selector de cierres de mes** (decisión 3). Retenciones (decisión 8). **Línea de fuente de datos en el pie** ("Datos de ejemplo ficticios"; la semilla y la huella van en el README y en un test, no en la pantalla). "Cómo se calcula" en lenguaje llano. Claro y oscuro, 360 a 1280 px, WCAG 2.2 AA. |
| **P2 (extras)** | Exportar a CSV el desglose que se está viendo (con neutralización de fórmulas). Corte en cualquier día. Facturación por servicio. Impresión del resumen. |
| **P3** | Días promedio de cobro ponderados por importe. Comparación con el mismo mes del año anterior. |
| **No hace** | Cargar datos del usuario (ni CSV ni Excel). Login, roles, servidor, IA. Proyecciones. Varias monedas. Facturas B, C o E (solo A: todos los clientes son responsables inscriptos). Intereses por mora ni notas de débito automáticas. Feriados. Contabilidad (asientos, libro IVA). Conciliación bancaria. Cheques diferidos (el cheque cancela a la fecha del recibo). Editar datos: es de solo lectura. |

## 4. Modelo de datos

Tipos en TypeScript (orientativos: los nombres finales los fija el programador, sin cambiar el significado). Se guarda
solo `Datos`. Todo lo demás se calcula con funciones puras de `(datos, corte)`. No hay persistencia ni "hoy": **el dominio
no necesita reloj**, lo que elimina de raíz los errores de zona horaria del "hoy".

```ts
// Entero seguro con |valor| ≤ 10^12 (H2). Número con marca: no se puede pasar un `number` suelto donde se pide `Centavos`.
type Centavos = number & { readonly __marca: 'Centavos' };
// Único constructor: lanza si n no es un entero seguro o supera el tope. `sumar` y `restar` también lanzan (M1).
declare function centavos(n: number): Centavos;
type FechaCivil = string;    // 'AAAA-MM-DD', validada con parsearFechaCivil (copiada de la Demo 2)

interface Empresa { nombre: string; cuit: string; puntoVenta: number }      // PV 3, ficticio

interface Cliente {
  id: string;                 // 'C01'…'C13'
  razonSocial: string;        // inventada, con "Demo"
  cuit: string;               // ficticio, DV válido, rotulado "ficticio"
  plazoDias: 15 | 30 | 45 | 60;
}                             // el perfil de pago de cada cliente es una constante del generador, no un dato (Aj7)

type TipoCmp = 1 | 2 | 3;     // Factura A, Nota de débito A, Nota de crédito A (códigos de ARCA)
type Servicio = 'alquiler-4x4' | 'traslado-personal' | 'flete-liviano' | 'horas-espera' | 'km-excedentes';

interface Comprobante {
  id: string;                 // '1-0003-00000123' (tipo-PV de 4 dígitos-número de 8 dígitos)
  tipo: TipoCmp;
  puntoVenta: number; numero: number;
  clienteId: string;
  emision: FechaCivil;
  vencimiento: FechaCivil;    // emisión + plazo del cliente (C4); en una NC = emisión
  servicio: Servicio;         // uno por comprobante en P1; NC y ND llevan el de la factura asociada
  neto: Centavos; iva: Centavos; total: Centavos;   // neto ≥ 1; siempre positivos; el signo lo da el tipo
  asociadoA: string | null;   // NC: id de la factura (obligatorio). ND: id de la factura o null
}

type Medio = 'transferencia' | 'cheque' | 'retencion-iibb' | 'retencion-ganancias' | 'retencion-iva';

interface Recibo {
  id: string;                 // 'R-0003-00000045'
  clienteId: string;
  fecha: FechaCivil;
  medios: { medio: Medio; importe: Centavos }[];             // importes ≥ 1
  imputaciones: { comprobanteId: string; importe: Centavos }[];
  // aCuenta = Σ medios − Σ imputaciones (derivado, ≥ 0; R1)
}

interface Datos {
  version: 1; semilla: number;
  desde: FechaCivil; hasta: FechaCivil;   // 2025-01-01 y 2026-10-31
  empresa: Empresa; clientes: Cliente[]; comprobantes: Comprobante[]; recibos: Recibo[];
}

// Toda cifra del tablero es una Medida: la base del "¿De dónde sale este número?"
type Base = 'sin-iva' | 'con-iva' | 'iva';
interface Partida {
  ref: { tipo: 'comprobante' | 'recibo'; id: string };
  clienteId: string;          // cliente del comprobante o del recibo: agrupa la tabla «Por cliente» (4.3, H25)
  fecha: FechaCivil;          // emisión del comprobante o fecha del recibo
  importe: Centavos;          // firmado
  atraso?: number;            // solo en las medidas de saldo: días de atraso al corte (S3); el tramo sale de A1
  nota?: string;              // detalle en palabras, armado por la lógica (textos.ts)
}
interface Medida {
  clave: string; titulo: string; base: Base; formula: string;
  valor: Centavos;            // camino por agregación (4.2.1)
  partidas: Partida[];        // camino por listado (4.2.1); controlar(medida) los compara (D2)
  filtro: { clienteId?: string; mes?: string };   // 'AAAA-MM'; ver 4.3
}
```

### 4.1 Cómo se calcula cada cosa (definiciones que las reglas usan)

Para un corte `K` (fecha civil):

- **Existe al corte** (S1): un comprobante con `emision ≤ K`; un recibo con `fecha ≤ K`.
- **Saldo de un comprobante** (S2): `total − Σ imputaciones de recibos que existen al corte − Σ total de las NC asociadas que existen al corte`.
  Una NC o una ND asociada a una factura **no cambia el saldo de otra**: la ND tiene su propio saldo; la NC solo resta a la
  factura a la que está asociada. Una NC no tiene saldo propio (su saldo se toma como 0 y no se lista). Por C3 y R3, el
  saldo **nunca es negativo**.
- **Atraso** (S3): `diasEntre(vencimiento, K)`. Vencido si es ≥ 1.
- **A cuenta de un recibo**: `Σ medios − Σ imputaciones`.
- **Del cliente** (para un corte): `S` = Σ saldos de sus comprobantes; `A` = Σ a cuenta de sus recibos que existen al corte.
  Si `S > 0` y `A > 0`, `A` es **pago a cuenta sin imputar**, **entero, aunque sea mayor que `S`** (no se parte en una
  parte "a cuenta" y otra "a favor"; H22). Si `S = 0` y `A > 0`, `A` es **saldo a favor** (R4). Se decide por el cliente,
  nunca por el recibo.
  **Saldo neto del cliente** = `S − A` (puede ser negativo; es lo que cierra la cuenta corriente, D3).
- **Cuenta corriente del cliente**: movimientos que existen al corte, ordenados por fecha y, en la misma fecha, primero los
  comprobantes y después los recibos, y dentro de cada grupo por id. Factura y ND suman su total; NC resta su total; un
  recibo resta la suma de **todos** sus medios (retenciones incluidas). El saldo acumulado final es el saldo neto del cliente.
- **Mes del corte** (S7): el mes calendario que contiene `K`. Con los cortes de P1 (siempre cierre de mes) es el mes completo.
- **Qué fechas acepta cada función** (H18): `existeAlCorte`, `saldoAlCorte`, `atraso`, `cuentaDelCliente` y las medidas
  aceptan **cualquier fecha civil válida** como corte (también un día que no es cierre de mes, como el 15/05 de T01 y el
  30/07 de T03, o una posterior a `hasta`, como el 01/11 de T04 y el 03/11 de T05): son funciones puras de `(datos, corte)`
  y no saben de calendario. **Solo `resolverCorte`, que lee la dirección, exige un cierre de mes del rango (S5).** Los
  tests de propiedad (D2, D3, A2) recorren únicamente los 22 cierres de mes; los casos T01, T03, T04 y T05 llaman a las
  funciones con su fecha, no a la dirección. Con un corte a mitad de mes, "el mes del corte" va del día 1 a `K` (S1).

### 4.2 Catálogo de medidas (D1)

Cada cifra que aparece en pantalla sale de una de estas medidas, **por empresa o filtrada por un cliente** (y, en las del
mes, por un mes: 4.3). Son **16 claves**: 15 del catálogo y `mora-otros`, que existe solo con más de 5 deudores (M4). El
`valor` y las `partidas` de cada medida salen de **dos caminos distintos** (4.2.1), que `controlar` compara (D2).

| Clave | Título | Base | Qué mide (`valor`) | Partidas (importe firmado) |
| --- | --- | --- | --- | --- |
| `facturacion-mes` | Facturación del mes | sin IVA | Σ neto de facturas y ND del mes del corte − Σ neto de NC del mes (C5) | Un comprobante emitido en el mes: neto (positivo en F y ND, negativo en NC). |
| `facturado-con-iva-mes` | Facturado con IVA del mes | con IVA | Σ total de facturas y ND del mes − Σ total de NC del mes (decisión 9). **Es `facturacion-mes + iva-mes`, al centavo** (D3, X5) | Un comprobante emitido en el mes: su total con el mismo signo que en `facturacion-mes`. |
| `iva-mes` | IVA facturado del mes | IVA | Σ IVA de facturas y ND − Σ IVA de NC del mes (M2) | Un comprobante emitido en el mes: su IVA con el mismo signo. |
| `cobranza-mes` | Cobranza del mes | con IVA | Σ de todos los medios de los recibos del mes (R2) | Un recibo del mes: la suma de sus medios. |
| `retenciones-mes` | De lo cual, retenciones | con IVA | Σ de los medios de retención de los recibos del mes | Un recibo del mes **con retención**: la suma de sus retenciones; `nota` con el detalle (IIBB, Ganancias, IVA). |
| `saldo` | Saldo a cobrar | con IVA | Σ saldos de los comprobantes (S4) | Un comprobante con saldo > 0: su saldo. |
| `mora` | En mora | con IVA | Σ saldos de los comprobantes con atraso ≥ 1 (S4) | Un comprobante vencido con saldo > 0: su saldo (`nota`: días de atraso). |
| `tramo-no-vencido`, `tramo-1-30`, `tramo-31-60`, `tramo-61-90`, `tramo-mas-90` | Un tramo de antigüedad | con IVA | Σ saldos del tramo (A1) | Un comprobante del tramo: su saldo. |
| `pagos-a-cuenta` | Pagos a cuenta sin imputar | con IVA | Σ a cuenta de los clientes con `S > 0` | Un recibo con a cuenta > 0: su a cuenta. |
| `saldos-a-favor` | Saldos a favor | con IVA | Σ a cuenta de los clientes con `S = 0` | Un recibo con a cuenta > 0: su a cuenta. |
| `saldo-neto` | Saldo neto | con IVA | `saldo − pagos-a-cuenta − saldos-a-favor` (D3, X4) | Un comprobante con saldo (+) y un recibo con a cuenta (−). |
| `mora-otros` | En mora: otros clientes | con IVA | `mora` − Σ `mora` de los 5 mayores deudores (M4). Solo existe si hay más de 5 clientes con mora; si no, la clave es inexistente. | Los comprobantes vencidos con saldo de los clientes que no entraron en los 5 primeros (`nota`: días de atraso). |

Los rankings (deudores, aporte de cada cliente a un tramo) y los porcentajes salen de estas medidas con M3 y M4. La
`formula` es una frase en lenguaje llano armada con los números del corte (por ejemplo "Suma del saldo de los comprobantes
con 1 día de atraso o más al 31/10/2026."). **Los 5 mayores deudores** se ordenan por `mora` de mayor a menor y, en el
empate, por razón social (orden alfabético `es-AR`), el mismo criterio de desempate de M3.

### 4.2.1 Dos cálculos independientes de cada cifra (D2, D3)

Comparar una cifra con la suma de sus propias partidas no prueba nada si esa suma *es* su definición: el control no podría
fallar nunca. Por eso cada `Medida` se obtiene por **dos caminos que no comparten las cuentas de saldo**, escritos en
módulos distintos (`agregados.ts` y `partidas.ts`):

| | Camino por agregación → `valor` | Camino por listado → `partidas` |
| --- | --- | --- |
| Cómo trabaja | Suma campos de los datos crudos ("debe menos haber"), sin calcular el saldo de cada comprobante ni armar listas. | Recorre comprobante por comprobante (y recibo por recibo): saldo (S2), atraso (S3), tramo (A1), a cuenta. |
| Medidas del mes | Σ de neto, IVA, total o medios de lo emitido o cobrado en el mes. | Una partida por comprobante o recibo del mes. |
| `saldo` | Por cliente: Σ total de F y ND − Σ total de NC − Σ imputaciones, todo lo que existe al corte; después, Σ de los clientes. | El saldo de cada comprobante con saldo > 0. |
| `mora` y los cinco tramos | La misma cuenta por cliente, restringida a las F y ND cuyo **vencimiento** cae en la ventana del tramo (por ejemplo, 31–60 días de atraso = vencimiento entre `K−60` y `K−31`); la NC y las imputaciones cuentan en la ventana de su factura. | Los comprobantes con saldo > 0 cuyo atraso (S3) cae en el tramo (A1). |
| `pagos-a-cuenta`, `saldos-a-favor` | Por cliente: Σ medios − Σ imputaciones de sus recibos; va a una medida o a la otra según `S` del cliente (R4). | Los recibos con a cuenta > 0. |
| `saldo-neto` | Por cliente, `S − A`: lo que se debe menos lo cobrado sin imputar (H55). Es algebraicamente el saldo acumulado final de la cuenta corriente de 4.1, pero no se calcula con esa cuenta: esa cuenta es otra (`cuentaDelCliente`, en `corte.ts`) y la cruza X4. | Un comprobante con saldo (+) y un recibo con a cuenta (−). |

- `controlar(medida)` compara `valor` con la suma de `partidas` y, si difieren, lanza `ErrorDeCierre` (clave, los dos
  valores y la diferencia). **La interfaz llama a `controlar` antes de mostrar cada cifra**: si lanza, muestra la pantalla de
  error de `diseno-ui.md` (8.2) y nunca el número. En el uso normal no se ve ningún control: el cierre se prueba en los
  tests (D2, D3) y se explica en "Cómo se calcula".
- Además hay **controles cruzados entre medidas** (D3, X1 a X6): tramos contra saldo, clientes contra total, cuenta corriente y
  posición del cliente contra saldo neto, año contra doce meses. **Solo X4 contrasta dos cuentas distintas** (la cuenta corriente y
  la posición del cliente, por listado, contra las medidas, por agregación); X1, X2, X3, X5 y X6 comparan dos usos de la misma
  agregación: valen porque prueban que las ventanas de vencimiento, la suma por cliente y los doce meses son coherentes, pero no
  son un segundo cálculo. El contraste de cada cifra con su segundo cálculo es de `controlar` (D2).
- **Qué prueba y qué no.** Contrasta la *cuenta*: si un camino suma mal, el otro lo delata. No contrasta la *definición*
  (ambos usan "existe al corte", S1, y las definiciones de 4.1): esa la prueban los casos con números (5.3 y 5.5).

### 4.3 Filtros, partidas y lo que cada vista pide a la lógica (H24 a H26)

Lo que `diseno-ui.md` necesita confirmado; no cambia ninguna regla de la sección 6.

- **Filtros.** Toda medida se calcula como `medida(datos, corte, clave, filtro)` con `filtro = { clienteId?, mes? }`.
  `clienteId` (`C01` a `C13`) deja solo los comprobantes y recibos de ese cliente; `S` y `A` se evalúan por cliente igual.
  `mes` (`AAAA-MM`) solo tiene sentido en las cinco medidas del mes (`facturacion-mes`, `facturado-con-iva-mes`, `iva-mes`,
  `cobranza-mes`, `retenciones-mes`); sin `mes` rige el mes del corte (S7). **Un `mes` es válido entre el de `desde`
  (`2025-01`) y el del corte, ambos inclusive.** Un mes anterior al del corte es el mes completo y no cambia con el corte (no
  hay nada de ese mes posterior al corte). En la dirección, un `mes` mal escrito o fuera de ese rango vuelve al mes del
  corte con el aviso "El mes de la dirección no es válido. Se muestra {mes de aaaa}."; en una medida que no es del mes, el
  `mes` se descarta sin aviso (no aplica). `cliente` inexistente o clave inexistente: error de vista (`diseno-ui.md`, 8.2).
- **Doce meses.** `docesMeses(corte)` da los 12 meses que terminan en el del corte (menos, si empezarían antes de
  `2025-01`). La tabla "Ver los 12 meses" pide a cada fila `facturacion-mes`, `facturado-con-iva-mes`, `cobranza-mes` y
  `retenciones-mes` con su `mes`. Su renglón "Total de los 12 meses" es la suma de la columna con `sumar` (X6: año = Σ
  meses), no una medida del catálogo; la cifra de cada celda sí es un enlace a su medida con `mes`.
- **Partidas.** Cada partida lleva el `clienteId` del comprobante o del recibo, su `fecha` y, en las medidas de saldo
  (`saldo`, `mora`, `mora-otros`, los cinco tramos, `saldo-neto`), el `atraso` en días; el tramo sale de `tramoDe(atraso)`.
  La `nota` es el detalle en palabras ("Vence el 15/07/2026", "Retención IIBB 25.000,00 y Ganancias 15.000,00") y la arma
  `textos.ts`.
- **Por cliente.** `porCliente(medida)` agrupa las partidas por `clienteId`: una fila por cliente con su cantidad de
  partidas y su subtotal (Σ de sus importes). Que la medida de la empresa sea la suma de la misma medida por cada cliente se
  prueba con el control cruzado X3 (con `valor`, no con estos subtotales). Orden por defecto: subtotal de
  mayor a menor y, en el empate, razón social. **Porcentaje de cada fila** (M3) sobre el valor, solo si todos los
  subtotales son ≥ 0 y el valor > 0; si no (la facturación de un mes puede ser negativa para un cliente, C5), la
  columna muestra "—" en todas las filas (H25). Se muestra "Por cliente" en una medida de toda la empresa con partidas de
  más de un cliente; con `cliente=`, o con partidas de uno solo, se muestran las partidas.
- **Sin agrupar.** `agrupar=no` (único valor válido; cualquier otro se ignora) muestra en una medida de toda la empresa
  las partidas planas, con su columna Cliente: el enlace "Ver las N partidas sin agrupar".
- **Saldo de un comprobante: no es una medida.** Se muestra como texto; su desglose es la tabla de Movimientos de la misma
  vista, que cierra con el saldo (S2: lo prueba el test, no la pantalla).
- **Tabla "Clientes" del Resumen.** "Saldo" = `saldo` con `cliente=`, o sea `S` (≥ 0): la suma de la columna es el saldo
  a cobrar (X3). "En mora" = `mora` con `cliente=`. Un cliente con `A > 0` lleva en su fila la etiqueta "Revisar
  imputación" (si `S > 0`) o "Saldo a favor" (si `S = 0`) y su `A` se abre con `pagos-a-cuenta` o `saldos-a-favor` y
  `cliente=`; **no se resta en la columna Saldo** (H26).
- **Vista Cliente.** "Saldo (con IVA)" = `saldo`, "En mora" = `mora`, "% del saldo" = `mora ÷ saldo` (S4, un valor solo:
  M3). Si el cliente tiene `A > 0`, un renglón más con `pagos-a-cuenta` ("Revisar imputación") o `saldos-a-favor`, y
  "Saldo neto" = `saldo-neto` con `cliente=`, que es lo que cierra la cuenta corriente (X4). Con `S = 0` y `A = 0`: "$ 0,00".

## 5. Datos de ejemplo y generador

### 5.1 Identidades inventadas

- **Empresa:** "Logística Andina Demo S.A.", punto de venta 3.
- **Clientes** (13; plazo en días corridos; el perfil de pago es una constante del generador):

| Id | Razón social (inventada) | Plazo | Perfil de pago | Qué vive ahí |
| --- | --- | --- | --- | --- |
| C01 | Operadora Piedra Lunar Demo S.A. | 45 | puntual | T04 |
| C02 | Operadora Arroyo Escondido Demo S.A. | 60 | con retenciones | T08 |
| C03 | Minera Cordón Azul Demo S.A. | 30 | lento | T02 |
| C04 | Constructora Valle Hondo Demo S.R.L. | 30 | puntual | — |
| C05 | Contratista Los Algarrobos Demo S.A. | 30 | moroso | T05, T12-d91 y T17: se espera que sea **el cliente con más mora** (5.4) |
| C06 | Obras Cumbre Demo S.A. | 45 | con NC | — |
| C07 | Montajes Sierra Chica Demo S.R.L. | 30 | lento | T06 |
| C08 | Transportes Altiplano Demo S.A. | 15 | puntual | — |
| C09 | Perforaciones del Oeste Demo S.A. | 60 | puntual, **sin relleno desde 2026-08-01** (un cliente que se fue) | T07 |
| C10 | Servicios Cerro Plata Demo S.R.L. | 30 | lento | — |
| C11 | Camiones del Norte Demo S.A. | 30 | lento | — |
| C12 | Ingeniería Paso Largo Demo S.R.L. | 45 | puntual | — |
| C13 | Estructuras Río Seco Demo S.R.L. | 30 | puntual | — |

  Los tres más grandes son C01, C02 y C03 (importes del relleno por 2 a 3: C01 y C02 por 3, C03 por 2, H68). **Antes de publicar se verifica que ningún
  nombre coincida con una empresa o un proyecto real** (búsqueda simple; G4). Los CUIT: prefijo `30`, ocho dígitos que
  salen del azar **entre 99.100.000 y 99.999.999** (el bloque de la empresa, H74) y dígito verificador válido (`armarCuit`;
  si la base no tiene verificador válido, se pasa a la siguiente). Se muestran siempre con la palabra "ficticio".
- **Servicios** (neto del relleno, en pesos enteros): `alquiler-4x4` mensual con chofer, 600.000 a 900.000;
  `traslado-personal`, 120.000 a 350.000 (más frecuente en enero y febrero: estacionalidad leve para que el gráfico tenga
  forma); `flete-liviano`, 60.000 a 180.000; `horas-espera`, 20.000 a 80.000; `km-excedentes`, 15.000 a 90.000. El IVA sale
  siempre de M2. **Los importes son ficticios**; Matías los revisó y los consideró plausibles (Aj4). El README lo aclara.
- **Retenciones del relleno** (solo C02): IIBB 2,5 % y Ganancias 1,5 % del neto imputado, redondeadas al centavo con la
  misma regla de M2. **Son valores de ficción, no alícuotas vigentes de ninguna jurisdicción** (el README lo dice).

### 5.2 Calendario, volumen y forma del relleno

El generador es simple y busca que los datos se vean como los de una empresa real: cada cliente factura todos los meses y
cobra con su atraso habitual. **No fuerza ningún resultado**: lo que dé, da (los resultados de 5.4 se fijan para la semilla
publicada, no para toda semilla; Aj3).

- **Calendario fijo**, del 2025-01-01 al 2026-10-31 (22 meses; `desde` y `hasta`). El corte por defecto es el
  **2026-10-31**. A diferencia de la Demo 2 las fechas **no se corren con hoy**: el número de la captura del README es el
  de la demo en vivo (decisión 2). La interfaz rotula "Datos de ejemplo (ficticios)"; el rango de fechas va en el README.
- **Cortes válidos en P1:** los 22 cierres de mes, del 2025-01-31 al 2026-10-31 (S5).
- **Volumen:** 13 clientes, de 1 a 4 facturas de relleno por cliente y mes (unos 30 comprobantes por mes, unos 650 en
  total) y unos 600 recibos (casi uno por comprobante cobrado: solo se agrupan los cobros del mismo cliente y el mismo día,
  hasta 3; H17). Generar en menos de 50 ms y recalcular todo para un corte en menos de 20 ms (G7).
- **Azar:** `azar.ts` (mulberry32, copiado de la Demo 2), semilla `20261122` (H78; la primera fue `20261118`). Nada de `Math.random()`. **El orden de las
  llamadas al azar es parte del contrato**: primero los CUIT de los clientes en orden de id; después, mes por mes y dentro
  de cada mes cliente por cliente en orden de id, el relleno de comprobantes; después, por cada comprobante de relleno en
  el **orden de emisión** (emisión, id de cliente, orden de generación), sus sorteos de cobro, siempre en este orden: (solo
  C06) si lleva NC, su porcentaje y sus días; el corrimiento del cobro; el medio. **Se sortea siempre**, aunque el
  resultado se descarte después (una NC fuera de fecha, un cobro posterior al corte), así el orden no depende de los
  datos. Los casos plantados **no usan el azar** (son constantes) y se agregan al final, en el orden de la tabla 5.3.
  Si se cambia el orden, cambia la huella y se actualiza el test a propósito, con una línea en el registro.
- **Numeración y desempates** (C2, H23). Comprobantes: se juntan relleno y plantados (los plantados **después** del
  relleno, en el orden de la tabla 5.3) y se ordenan por (fecha de emisión, id de cliente, orden de generación); se numera
  por separado cada tipo (`1-0003-…` facturas, `2-0003-…` ND, `3-0003-…` NC). Recibos: se numeran después, por (fecha, id
  de cliente, id **menor** de los comprobantes que imputan —vacío si no imputan—, orden de generación; H38). `Datos.comprobantes` y
  `Datos.recibos` quedan en ese orden de numeración y `clientes` por id: es el orden de la huella.
- **Cobros del relleno.** Cada factura de relleno se cobra **entera, en un solo cobro, sin "a cuenta"** (descontada su
  NC, si la tiene), y los recibos de relleno solo imputan comprobantes de relleno. Corrimiento sobre el vencimiento:
  puntual, de −5 a 0 días; lento, de +10 a +40; moroso (C05), de +45 a +90; con retenciones (C02), de 0 a +20 y con
  retenciones en cada cobro (IIBB 2,5 % y Ganancias 1,5 % del neto cobrado, con el redondeo de M2: `(neto × tasa + 500) ÷
  1000`, tasa 25 y 15); con NC (C06), de 0 a +15. El medio es transferencia o, a veces, cheque (cancela a la fecha del recibo).
- **Fecha del cobro del relleno.** `calculada = máximo(vencimiento + corrimiento, emisión)`. Si `calculada ≤ 2026-10-31`,
  el cobro lleva esa fecha. Si es posterior, **no hay cobro**: los datos terminan el 31/10 y la factura figura impaga (es la
  mora natural del relleno, sin ningún tratamiento especial). Nunca se crea un recibo posterior a `hasta` (G2).
- **NC del relleno de C06.** Una de cada ocho facturas de relleno de C06 lleva una NC parcial: neto de la NC = el 10 al
  100 % (porcentaje entero) del neto de la factura, con el IVA de M2; fecha = emisión + 3 a 25 días. **Se descarta** (la
  factura se cobra entera) una NC con fecha posterior al 2026-10-31 (G2); el azar se consumió igual. La NC es siempre
  anterior al cobro (el cobro va desde el vencimiento, 45 días después de emitir), así que cumple C3. Una NC del 100 %
  anula la factura: no hay cobro ni recibo.
- **Recibos del relleno (H17).** Un recibo reúne los cobros de **un mismo cliente con la misma fecha**, hasta 3
  comprobantes en el orden de emisión (el cuarto va a otro recibo del mismo día). Fecha del recibo = la de sus cobros, así
  que cumple R3 (nunca antes de la emisión). Sus `medios` suman por medio los de sus cobros, en el orden del tipo `Medio`;
  sus `imputaciones`, en el orden de emisión.
- **Único ajuste del relleno por un caso:** C09 deja de facturar el 2026-08-01, como un cliente que se fue. Así, con sus
  facturas ya cobradas puntualmente, el sobrepago de T07 es un saldo a favor y no un pago a cuenta. Es un dato del cliente,
  no una excepción de reglas.
- **Huella:** FNV-1a de 32 bits sobre los bytes UTF-8 del JSON canónico de `Datos` (claves en el orden de las interfaces de
  la sección 4, sin espacios, listas en el orden de numeración de arriba), en hexadecimal de 8 cifras en minúscula. Va
  fijada en un test y se publica en el README; **no se muestra en la interfaz**.
- **Pie de la interfaz:** una línea de fuente de datos ("Datos de ejemplo ficticios, generados por el propio proyecto"),
  sin semilla, huella ni fecha de corte.

### 5.3 Casos plantados en la semilla publicada

Son los que el visitante ve en el recorrido y en "Cómo se calcula". Comprobantes y recibos **literales** (no usan el azar).
Cada uno tiene un alias estable para los tests (el generador exporta `PLANTADOS`, un mapa alias → id). Los resultados **por
comprobante** de estos casos no dependen de la semilla (el relleno nunca los toca); los de **conjunto** (mora, tramos,
rankings) sí, y se fijan en E4 (5.4). Importes en pesos con centavos; en el código, centavos enteros. Todos los cobros son
por transferencia salvo que se diga otra cosa; "venc." es emisión + plazo del cliente (C4).

| Alias | Cliente | Tipo | Emisión | Venc. | Neto | IVA | Total | Cobros |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T02-F | C03 | F | 2026-07-10 | 2026-08-09 | 1.000.000,00 | 210.000,00 | 1.210.000,00 | 2026-07-31: 400.000,00 · 2026-09-15: 400.000,00 · 2026-10-12: 410.000,00 |
| T04-F | C01 | F | 2026-09-16 | 2026-10-31 | 250.000,00 | 52.500,00 | 302.500,00 | ninguno |
| T05-F | C05 | F | 2026-09-25 | 2026-10-25 | 300.000,00 | 63.000,00 | 363.000,00 | **2026-11-03**: 363.000,00 |
| T06-R | C07 | recibo | 2026-10-20 | — | — | — | — | transferencia 50.000,00 y ninguna imputación → a cuenta 50.000,00 |
| T07-F | C09 | F | 2026-06-15 | 2026-08-14 | 200.000,00 | 42.000,00 | 242.000,00 | ver T07-R |
| T07-R | C09 | recibo | 2026-08-10 | — | — | — | — | transferencia 300.000,00; imputa 242.000,00 a T07-F → a cuenta 58.000,00 |
| T08-F | C02 | F | 2026-02-14 | 2026-04-15 | 1.000.000,00 | 210.000,00 | 1.210.000,00 | ver T08-R |
| T08-R | C02 | recibo | 2026-04-30 | — | — | — | — | transferencia 1.170.000,00 + retención IIBB 25.000,00 + retención Ganancias 15.000,00 = 1.210.000,00; imputa 1.210.000,00 a T08-F |
| T12-d91 | C05 | F | 2026-07-02 | 2026-08-01 | 900.000,00 | 189.000,00 | 1.089.000,00 | **T17-NC** (121.000,00, 2026-07-20) · **T17-R1** 2026-08-12: 242.000,00 (transferencia 234.000,00 + retención IIBB 5.000,00 + retención Ganancias 3.000,00; imputa 242.000,00) · **T17-R2** 2026-10-14: transferencia 121.000,00 (imputa 121.000,00). Saldo al 31/10: 605.000,00 |
| T17-NC | C05 | NC | 2026-07-20 | — | 100.000,00 | 21.000,00 | 121.000,00 | asociada a T12-d91 |

| Caso | Qué planta | Reglas |
| --- | --- | --- |
| T02 | Factura cobrada en 3 pagos, el segundo y el tercero después del vencimiento. Cortes: 31/07 saldo 810.000,00 sin atraso (−9); 31/08 saldo 810.000,00 con atraso 22 (tramo 1–30); **30/09 saldo 410.000,00 con atraso 52 (tramo 31–60)**, aunque el último pago fue 15 días antes del corte; 31/10 saldo 0. | S2, S6 |
| T04 | Factura que vence exactamente el 31/10/2026: al corte por defecto atraso 0, **no vencida**, su saldo 302.500,00 va a "No vencido". Con corte 01/11 (solo la función; la interfaz no lo ofrece) tendría atraso 1. | S3 |
| T05 | Cobro del 03/11/2026, posterior al calendario: al 31/10 la factura sigue impaga, con saldo 363.000,00 y atraso 6. Es el único dato posterior al calendario, puesto a propósito. | S1 |
| T06 | Pago a cuenta sin imputar de C07 (50.000,00): baja en 50.000,00 el saldo neto del cliente pero **no** la mora; aparece en "Pagos a cuenta sin imputar" con "Revisar imputación". C07 siempre tiene saldo (factura todos los meses y cobra después del vencimiento), así que el sobrepago no es un saldo a favor. | R4 |
| T07 | Sobrepago de C09: queda con saldo a favor de 58.000,00, sin comprobantes con saldo (dejó de facturar el 01/08 y pagó puntual), fuera de la mora y del ranking de deudores. | R4 |
| T08 | Factura de 1.210.000,00 cancelada con 1.170.000,00 de transferencia + 25.000,00 de IIBB + 15.000,00 de Ganancias. Al 30/04 el saldo es 0; contando solo el banco quedarían 40.000,00 "en mora" (atraso 15). | R2 |
| T17 | **El comprobante del recorrido de 2 minutos**, sobre T12-d91: factura de 1.089.000,00 con una NC parcial de 121.000,00 (20/07), un cobro parcial de 242.000,00 con retenciones (12/08) y otro de 121.000,00 (14/10). Saldo y atraso: 31/07 → 968.000,00 / −1 (No vencido) · 31/08 → 726.000,00 / 30 (1–30) · **30/09 → 726.000,00 / 60 (31–60)** · 13/10 → 726.000,00 / 73 · **31/10 → 605.000,00 / 91 (Más de 90)**. Al 30/09 el recibo del 14/10 no existe (S1) y la vista lo lista "Después de la fecha de corte". El atraso se cuenta desde el vencimiento original (S6). | C1, C3, R2, R3, S1, S2, S6 |

### 5.4 Resultado esperado con el corte por defecto (2026-10-31), semilla publicada

Es la **prueba de referencia** (G3): un test con los valores de esta tabla, solo para la semilla `20261122` (H78). **No se exige
"exacto para toda semilla"** (Aj3): lo que vale para cualquier semilla son los invariantes (D2, D3, A2, G2, G5), que no
necesitan valores. Los valores marcados "se fija en E4" se calculan con el generador real y se escriben acá y en
`esperado.ts`; una verificación independiente (un script aparte que recalcula desde los datos generados) se repite como se
hizo con los casos plantados.

| Medida | Estado | Valor esperado |
| --- | --- | --- |
| El comprobante del recorrido (T17) | Exacto: solo depende del propio comprobante | T12-d91 al 31/10: saldo 605.000,00, atraso 91, Más de 90; al 30/09: 726.000,00, 60, 31–60 |
| Tramo "Más de 90" | Exacto por construcción, **confirmado en E4**: el atraso máximo del relleno es 89 (el corrimiento máximo es 90 y el cobro posterior no existe) | 605.000,00 (solo T12-d91) |
| Pagos a cuenta sin imputar | Por construcción (los recibos de relleno no dejan a cuenta), **confirmado en E4** | 50.000,00 (1 cliente: C07, recibo de T06; "Revisar imputación") |
| Saldos a favor | Ídem (C09 no factura desde el 01/08 y pagó puntual), **confirmado en E4** | 58.000,00 (1 cliente: C09, recibo de T07) |
| En mora: importe, comprobantes y clientes | **Fijado en E4** (`esperado.ts`) | **6.306.481,28** en 16 comprobantes de 6 clientes; 22,1 % del saldo a cobrar |
| Tramos 1–30 (incluye T05-F, 363.000,00), 31–60, 61–90 y no vencido (incluye T04-F, 302.500,00) | **Fijado en E4** | No vencido 22.207.180,82 (77,9 %) · 1–30 días 4.552.834,33 (16,0 %) · 31–60 días 23.241,68 (0,1 %) · **61–90 días 1.125.405,27 (3,9 %)** · Más de 90 días 605.000,00 (2,1 %). Hay deuda en los cinco tramos (el de 31–60 es muy chico: 0,1 %). Los cinco suman el saldo y los cuatro vencidos suman la mora (A2). |
| Saldo a cobrar y % de mora | **Fijado en E4** | Saldo 28.513.662,10; saldo neto 28.405.662,10 (menos 50.000,00 y 58.000,00); mora 22,1 % |
| Ranking de deudores y "Otros" | **Fijado en E4 con la semilla `20261122` (H78): se cumple lo esperado en lo que importa:** seis clientes con mora, o sea más de cinco, y «Otros» existe (es C07, un comprobante). El diseño esperaba siete; con esta semilla son seis. | C05 3.446.078,79 (54,7 %, 91 días, Más de 90) · C11 1.184.628,72 (18,8 %, 25 días, 1–30) · C10 942.051,55 (14,9 %, 16 días, 1–30) · C03 530.282,50 (8,4 %, 10 días, 1–30) · C02 131.663,73 (2,1 %, 15 días, 1–30) · **Otros** 71.775,99 (1,1 %; C07, 21 días, 1–30). Total 6.306.481,28. |
| Cliente con más mora y su comprobante más atrasado | **Confirmado con la semilla `20261122`** | **C05** (3.446.078,79; el 54,7 % de la mora) y **T12-d91** (91 días, el único por encima de 90). Siguen siendo los mismos que con la semilla anterior. |
| Facturación y cobranza de octubre | **Fijado en E4**; `cobranza-mes` ≥ `retenciones-mes` y cierra (D2) | Facturación (sin IVA) 15.705.914,00 en 30 comprobantes; IVA 3.298.241,94; facturado con IVA 19.004.155,94. Cobranza 23.847.590,51 en 37 recibos, de lo cual retenciones 152.972,81. |

Resultados por comprobante en otros cortes (los de los casos de la semilla, exactos para cualquier semilla; fijados en tests):

| Comprobante | Corte | Saldo | Atraso | Tramo |
| --- | --- | --- | --- | --- |
| T02-F | 2026-07-31 / 08-31 / 09-30 / 10-31 | 810.000,00 / 810.000,00 / 410.000,00 / 0 | −9 / 22 / 52 / — | No vencido / 1–30 / 31–60 / — |
| T05-F | 2026-10-31 / 2026-11-03 (solo función) | 363.000,00 / 0 | 6 / — | 1–30 / — |
| T07-F | 2026-07-31 / 08-31 | 242.000,00 / 0 (en el fixture T07; en la semilla, al 31/08 C09 todavía tiene facturas de relleno sin cobrar y esos 58.000,00 son un pago a cuenta, no un saldo a favor: R4 se decide por el cliente, H69) | −14 / — | No vencido / — |
| T08-F | 2026-03-31 / 04-30 | 1.210.000,00 / 0 | −15 / — | No vencido / — |
| T12-d91 | 2026-07-31 / 08-31 / 09-30 / 10-31 | 968.000,00 / 726.000,00 / 726.000,00 / 605.000,00 | −1 / 30 / 60 / 91 | No vencido / 1–30 / 31–60 / Más de 90 |

### 5.5 Fixtures de prueba (datos escritos a mano)

Los casos borde **no viven en el generador**: cada regla tiene su fixture, un `Datos` mínimo armado a mano en
`tests/fixtures/` (con una función `armarDatos` que numera y calcula IVA y total con M2), de pocos comprobantes, con
resultado esperado exacto. Los alias T01 a T16 se conservan para poder cruzar con las reglas; los que están también en la
semilla (T02, T04 a T08, T17) se prueban además allá (5.3).

| Alias | Prueba | Contenido mínimo | Resultado esperado |
| --- | --- | --- | --- |
| T01 | C1, S2 | C06 (plazo 45). T01-F: emisión 2026-05-12, venc. 2026-06-26, neto 500.000,00 (total 605.000,00), sin cobros. T01-NC: 2026-05-20, total 605.000,00, asociada. | Facturación de mayo con el par = sin el par (500.000,00 − 500.000,00). Saldo de T01-F: al 15/05 605.000,00 (atraso −42); al 31/05 0. |
| T03 | S3 | C08 (plazo 15). T03-F: emisión 2026-07-16, venc. 2026-07-31, total 242.000,00, cobrada el 2026-07-31. | Al 30/07 saldo 242.000,00 y atraso −1; al 31/07 saldo 0 y atraso 0: nunca entra en mora. |
| T09 | C5, D3 | C06. T09-F: 2026-06-10, neto 800.000,00 (total 968.000,00). T09-NC: 2026-07-14, total 968.000,00, asociada a T09-F. T09-F2: 2026-07-03, neto 300.000,00, cobrada el 2026-08-17. | Facturación de C06 en julio (sin IVA): **−500.000,00** (se muestra "−$ 500.000,00"). `facturado-con-iva-mes` = 363.000,00 − 968.000,00 = **−605.000,00** = −500.000,00 de neto + (−105.000,00) de IVA. T09-F: saldo 968.000,00 al 30/06 (atraso −25), 0 al 31/07. |
| T10 | M2, D3 | Un cliente con tres facturas de neto 1.000,50 en febrero de 2025 y ningún otro comprobante ese mes. | IVA de cada una 210,11; `iva-mes` 630,33 (no 630,32, que sería el 21 % de 3.001,50); `facturado-con-iva-mes` 3.631,83 (= 3.001,50 + 630,33). |
| T11 | M3 | Tres clientes (C05, C10, C11) con una factura impaga de 363.000,00 cada uno, con atraso 61, 75 y 90 al 31/10. | Cada uno aporta 363.000,00 al tramo 61–90; porcentajes 33,3 (C05) + 33,3 (C10) + 33,4 (C11, "Camiones…" antes que "Contratista…" y "Servicios…") = 100,0. |
| T12 | A1, A2, S4, D1 | Fixture de antigüedad, todas sin cobros y con plazo 30, salvo T04-F. **d30** (C07): emisión 2026-09-01, neto 200.000,00. **d31** (C03): 2026-08-31, 150.000,00. **d60** (C07): 2026-08-02, 400.000,00. **d61** (C05): 2026-08-01, 300.000,00. **d90** (C11): 2026-07-03, 300.000,00. **d91f** (C05): 2026-07-02, 500.000,00. **T04-F** (C01, plazo 45): 2026-09-16, 250.000,00. | Al 31/10: atrasos 30, 31, 60, 61, 90, 91 y 0; tramos 1–30 (242.000,00), 31–60 (181.500,00 + 484.000,00 = 665.500,00), 61–90 (363.000,00 + 363.000,00 = 726.000,00), Más de 90 (605.000,00), no vencido (302.500,00). **Mora 2.238.500,00** en 6 comprobantes y 4 clientes (C07 726.000,00, C05 968.000,00, C03 181.500,00, C11 363.000,00); saldo 2.541.000,00; % de mora 88,1. |
| T13 | C5 | C12 (plazo 45). T13-F1: 2025-12-31, neto 100.000,00. T13-F2: 2026-01-01, neto 120.000,00. Un recibo del 2026-02-13 de 266.200,00 que imputa 121.000,00 y 145.200,00. | F1 pertenece a diciembre de 2025 y F2 a enero de 2026; el año 2025 incluye solo la primera. Saldos al 31/01: 121.000,00 y 145.200,00 (atraso −14 y −15); al 28/02: 0. |
| T14 | S1, S7 | C08 (plazo 15). T14-F1: 2026-09-30, neto 100.000,00, cobrada el 2026-10-15. T14-F2: 2026-10-01, neto 100.000,00, cobrada el 2026-10-16. | Corte 30/09: existe solo T14-F1 y `facturacion-mes` la incluye. Corte 31/10: existen las dos; `facturacion-mes` incluye T14-F2 y no T14-F1; saldo de T14-F2 al 31/10 = 0. |
| T15 | D3 | Un cliente con su último comprobante de octubre de 2025 y su último recibo de noviembre de 2025, ya cobrado. | Al 31/10/2026: saldo 0, ausente de la facturación del mes, presente en la lista de clientes y sin comprobantes con saldo. |
| T16 | C1 | C13 (plazo 30). T16-F: 2026-03-10, neto 600.000,00, cobrada el 2026-04-09. T16-ND: 2026-04-02, neto 24.000,00 (total 29.040,00), asociada a T16-F, cobrada el 2026-06-15. | La ND suma 24.000,00 a la facturación de abril; vence el 02/05. T16-ND: saldo 29.040,00 al 30/04 (atraso −2) y al 31/05 (atraso 29), 0 al 30/06. T16-F: saldo 0 al 31/05. |
| R4 | R4, T06 | C07 con **d30** y **d60** de T12 y un recibo de 50.000,00 sin imputar. | Mora de C07 726.000,00 (con o sin el recibo); `pagos-a-cuenta` 50.000,00; saldo neto 676.000,00. |

## 6. Reglas de negocio (tabla verificable)

Cada regla tiene un identificador y al menos un caso de test con entrada y resultado esperado. Los tests llevan el
identificador en su nombre (`it('S3: vence el día del corte → no vencido')`), así la tabla y la suite se pueden cruzar.
Los importes de las tablas están en pesos; en el código y en los tests, centavos enteros. `K` = corte; el corte por
defecto es **2026-10-31**. Los casos usan los fixtures de 5.5 o, donde se dice, la semilla publicada (5.3 y 5.4).

### 6.1 Dinero (M)

| ID | Regla | Caso de test |
| --- | --- | --- |
| M1 | Los importes son **centavos enteros** en todo el dominio, con tope \|valor\| ≤ 10^12 (H2), y tienen tipo `Centavos` (número con marca, sección 4): solo se crean con `centavos(n)`, que lanza si `n` no es un entero seguro o supera el tope. Una cuenta hecha con `+`, `-` o `/` da un `number` suelto que **no compila** donde se pide `Centavos`. Se formatean en `es-AR` solo al mostrarlos, **armando el texto con enteros** (miles con punto, decimales con coma, sin `Intl` ni división por 100). El espacio entre `$` y la cifra es un espacio duro (U+00A0); el signo menos es `−` (U+2212) y va antes del `$`. Toda suma pasa por `sumar`, que lanza si el resultado supera el tope. **Respaldo:** la búsqueda de CI (`scripts/buscar-prohibidos.mjs`) rechaza `parseFloat`, `toFixed`, `Math.round` y `Number(` en `src/lib/dominio` (se exceptúa `fechas.ts` para `Number(`; H5). | `formatearImporte(30)` → "$ 0,30" · `formatearImporte(-123456)` → "−$ 1.234,56" · `formatearImporte(0)` → "$ 0,00" · `formatearImporte(100000000)` → "$ 1.000.000,00" · `sumar(10, 20)` = 30 (nunca 0,30000000000000004) · `centavos` lanza con 1.5, `NaN`, `2**53` y 10^12 + 1 · test de tipos: pasar un `number` suelto a una función de dinero es un error de compilación (`@ts-expect-error`). |
| M2 | **IVA por comprobante:** `iva = redondeo(neto × 21 / 100)` al centavo, **la mitad hacia arriba**, en aritmética entera: `iva = (neto × 21 + 50) ÷ 100` con división entera. `total = neto + iva`. El IVA de un período es **la suma de los IVA** de sus comprobantes, nunca el 21 % del neto del período. `neto` ≥ 1 (si no, lanza). | T10: 100050 centavos → IVA 21011 (210,11), total 121061; tres comprobantes → 63033 (630,33), no 63032 · neto 50 → 11 · neto 250 → 53 · neto 5 → 1 · neto 1 → 0 · neto 10.000.000 (100.000,00) → 2.100.000 · neto 0, −5 y 1,5 → lanza. |
| M3 | Los porcentajes se muestran con **un decimal y suman 100,0 %** (método del mayor resto, sobre milésimas: `piso(importe × 1000 ÷ total)`; los que faltan para 1000 van a los mayores restos). Desempate entre restos iguales: primero el importe mayor, después el nombre (orden alfabético `es-AR`). Con total 0 se muestra "—" (nunca "NaN %" ni "0 %"). Con un importe negativo lanza (los aportes son ≥ 0). El porcentaje de **un solo** valor (el "% de mora") se redondea a la milésima con la mitad hacia arriba. | T11 → C11 33,4 · C05 33,3 · C10 33,3 · 2 y 1 de 3 → 66,7 y 33,3 · importes 1.331.000,00 · 726.000,00 · 363.000,00 · 363.000,00 · 181.500,00 → 44,9 / 24,5 / 12,3 / 12,2 / 6,1 (suman 100,0: los pisos dan 448 + 244 + 122 + 122 + 61 = 997 y los 3 restos van a .980, .898 y, en el empate de los dos de 363.000,00, al de nombre "Camiones…") · total 0 → "—" · un valor de 1 sobre 3 → 33,3 % · 2 sobre 3 → 66,7 % · importe −1 → lanza. |
| M4 | "Otros" en un ranking = total − la suma de los mostrados (por resta), y se abre en su propia lista. Solo existe si hay más de 5 filas. | Importes 900, 800, 700, 600, 500, 300 y 200: los 5 primeros suman 3.500, **Otros = 500** (300 + 200, lista propia) y total 4.000; porcentajes 22,5 · 20,0 · 17,5 · 15,0 · 12,5 · 12,5 = 100,0. Con 5 filas no hay "Otros". |
| M5 | **Rotulado de la base:** la facturación es **sin IVA**; la cobranza, los saldos, la mora y la antigüedad son **con IVA**; el IVA se rotula aparte. Toda `Medida` lleva su `base` y la pantalla la muestra en el rótulo o en "Cómo se calcula" (decisión 4). | Test sobre el catálogo (16 claves): `facturacion-mes` → `sin-iva`; `iva-mes` → `iva`; las otras 14 (incluidas `facturado-con-iva-mes` y `mora-otros`) → `con-iva`. |

### 6.2 Comprobantes (C)

| ID | Regla | Caso de test |
| --- | --- | --- |
| C1 | Factura A (1) y Nota de débito A (2) **suman**; Nota de crédito A (3) **resta** en la facturación y, en el saldo, cancela (en todo o en parte) la factura asociada. La ND tiene su propio saldo y vencimiento. | Fixture T01: facturación de mayo con el par = sin el par (500.000,00 − 500.000,00) · fixture T16: la ND suma 24.000,00 a la facturación de abril, vence el 02/05 y al 31/05 tiene saldo 29.040,00 con atraso 29. |
| C2 | Numeración **correlativa y sin saltos** por tipo y punto de venta, en orden de emisión (es lo primero que pregunta un auditor). Vale también para los recibos (`R-PV-número`). El id es `tipo-PV-número` (`1-0003-00000123`). **Misma fecha:** comprobantes por (id de cliente, orden de generación, con los plantados después del relleno); recibos por (id de cliente, **id menor** de los comprobantes que imputan, orden de generación) (H23, H38). | Validador sobre el conjunto generado. Casos del validador: números 1, 2, 4 → "salto"; 1, 2, 2 → "repetido"; el número 5 con fecha anterior a la del 4 → "fuera de orden". Desempate: dos recibos del mismo día de C03 y C01 → el de C01 lleva el número menor; dos del mismo día y cliente → el que imputa al comprobante de id menor. |
| C3 | Una NC siempre está asociada a una **factura del mismo cliente** y su total no supera el saldo de esa factura **a la fecha de la NC**. Una ND que dice estar asociada apunta a una factura del mismo cliente. **También se rechaza (H32, decisión del 22/11):** una NC con emisión anterior a la de su factura (no tiene un saldo definible a esa fecha: la factura no existe para ese corte, S1) y una NC o una ND asociada a un comprobante que no es una factura. Una ND con emisión anterior a su factura se acepta: no cambia ningún saldo. | Factura con saldo 121.000,00: NC de total 121.000,00 → válida; **NC de 121.000,01 → el validador la rechaza**; NC de una factura de otro cliente → rechazada; NC sin `asociadoA` → rechazada · NC del 2026-03-01 de una factura del 2026-03-05 → rechazada · NC asociada a una ND → rechazada. |
| C4 | Vencimiento = emisión + plazo del cliente, en **días corridos**. No se corre por feriados ni fines de semana (límite declarado; decisión 5). En una NC es la emisión. | Emisión 2026-01-30 + 30 → 2026-03-01 · 2025-12-15 + 45 → 2026-01-29 · 2026-08-31 + 30 → 2026-09-30 · 2026-09-16 + 45 → 2026-10-31 (T04). |
| C5 | La **facturación** de un mes es el **neto sin IVA** de facturas y notas de débito, menos el de las NC, **por fecha de emisión**. Puede ser negativa para un cliente en un mes y se muestra con signo, sin recortar a 0. Un cliente aparece en la facturación del mes si tiene al menos un comprobante emitido en ese mes. | Fixture T09: facturación de C06 en julio de 2026 = 300.000,00 − 800.000,00 = **−500.000,00** (se muestra "−$ 500.000,00") · fixture T13: T13-F1 pertenece a diciembre de 2025 y T13-F2 a enero de 2026 (y a ningún otro mes); el año 2025 incluye solo la primera. |

### 6.3 Recibos e imputación (R)

| ID | Regla | Caso de test |
| --- | --- | --- |
| R1 | En un recibo, Σ medios = Σ imputaciones + a cuenta, con a cuenta ≥ 0; los importes de medios e imputaciones son ≥ 1; todas las imputaciones son a comprobantes del mismo cliente del recibo; **un recibo cobra algo: tiene al menos un medio o una imputación** (H36). Los validadores informan estos problemas aunque el importe no sea un entero o la suma pase el tope; no lanzan (H37). | Validador sobre todo el conjunto. Medios 100.000,00 + 50.000,00 = 150.000,00, imputaciones 120.000,00 → a cuenta 30.000,00 (válido) · imputaciones 160.000,00 → rechazado (a cuenta negativo) · sin medios ni imputaciones → rechazado («no cobra nada»). |
| R2 | **Las retenciones cancelan deuda** igual que el dinero. La cobranza del mes es la suma de los recibos del mes (todos sus medios) y se muestra "de lo cual, retenciones: $ Y". | T08, sobre **el recibo del 30/04** (no sobre el mes): sus medios suman 1.170.000,00 de transferencia + 25.000,00 + 15.000,00 de retenciones = 1.210.000,00, así que **al 30/04 el saldo de T08-F es 0**; contando solo el banco quedarían 40.000,00 con atraso 15. En las medidas de abril de toda la empresa, la partida de ese recibo vale 1.210.000,00 en `cobranza-mes` y 40.000,00 en `retenciones-mes` (el total del mes suma además los otros recibos de abril, que dependen de la semilla). T17-R1: 242.000,00 = 234.000,00 + 5.000,00 + 3.000,00 baja el saldo de T12-d91 en 242.000,00. |
| R3 | La imputación a un comprobante **no supera su saldo a la fecha del recibo** y nunca va a un comprobante emitido **después** del recibo. | Recibo que imputa 121.000,01 a un comprobante con saldo 121.000,00 → el validador lo rechaza · recibo del 2026-05-09 que imputa a un comprobante emitido el 2026-05-10 → rechazado. |
| R4 | El **pago a cuenta** baja el saldo neto del cliente pero **no** la mora por comprobante. Si el cliente tiene comprobantes con saldo (`S > 0`) se muestra aparte como "Pagos a cuenta sin imputar", con el aviso "Revisar imputación". Si no los tiene (`S = 0`), es **saldo a favor**: ese cliente no tiene mora, no entra en el ranking de deudores y sí en "Saldos a favor". El saldo a favor **no se aplica solo a facturas futuras** (límite declarado). **Se decide por el cliente y el a cuenta no se parte** (H22): con `S > 0` el a cuenta es siempre "pago a cuenta sin imputar", aunque supere a `S`. | Fixture R4 (T06): C07 mantiene 726.000,00 de mora, aparece en "Pagos a cuenta sin imputar" con 50.000,00 y "Revisar imputación", saldo neto 676.000,00 · T07 (semilla): C09 con `S` = 0 y a cuenta 58.000,00 → "Saldos a favor 58.000,00", mora 0, fuera del ranking · **`S` = 100.000,00 y `A` = 150.000,00: `pagos-a-cuenta` = 150.000,00 (entero), `saldos-a-favor` = 0, saldo neto = −50.000,00** (la cuenta corriente lo muestra con signo). |

### 6.4 Fecha de corte y mora (S)

| ID | Regla | Caso de test |
| --- | --- | --- |
| S1 | Todo es una función de `(datos, corte)`. Los comprobantes emitidos y los recibos fechados **después del corte no existen para ese corte** en ningún cálculo ni medida. La vista de un comprobante puede **listar** los movimientos posteriores al corte (rotulados "Después de la fecha de corte"), pero nunca suman. | T05 (semilla): al 31/10 el saldo de T05-F es 363.000,00 aunque el recibo del 03/11 exista en los datos; con corte 03/11 (función) es 0 · fixture T14: con corte 2026-09-30 existe T14-F1 (emitido ese día) y no T14-F2 (01/10); con corte 10/31 existen los dos. |
| S2 | Saldo de un comprobante al corte = total − imputaciones con fecha ≤ corte − NC asociadas con emisión ≤ corte (4.1). | Fixture T01: T01-F al 2026-05-15 → 605.000,00; al 2026-05-31 → 0 · T02 (semilla): saldo 810.000,00 al 31/08 y 410.000,00 al 30/09. |
| S3 | Días de atraso = `diasEntre(vencimiento, corte)`. Si son 0 o menos, el comprobante **no está vencido**: lo que vence el día del corte no está en mora. | Fixture T03: cobro el día del vencimiento → al 30/07 atraso −1 y al 31/07 saldo 0, nunca mora · T04 (semilla): vence 2026-10-31, corte 2026-10-31 → atraso 0, "No vencido". |
| S4 | **Mora** = suma de los saldos con atraso ≥ 1. **% de mora** = mora ÷ saldo a cobrar (Σ saldos de los comprobantes); si ese saldo es 0, se muestra "—". | Fixture T12 al 2026-10-31: mora 2.238.500,00 en 6 comprobantes y 4 clientes, saldo 2.541.000,00 → "88,1 %" · mora 1.000 y saldo 3.000 → "33,3 %" · mora 0 y saldo 5.000 → "0,0 %" · saldo 0 → "—". |
| S5 | El corte válido es **un cierre de mes** entre el 2025-01-31 y el 2026-10-31 (decisión 3; H1). Un corte ausente en la dirección usa el de por defecto sin avisar. Un corte inválido, fuera de rango, que no es cierre de mes o repetido en la dirección vuelve al corte por defecto con el aviso "La fecha de corte de la dirección no es válida. Se muestra el 31/10/2026.". | `?corte=2026-09-30` → válido · `?corte=2026-02-30` → aviso · `?corte=2030-01-01` → aviso · `?corte=hola` → aviso · `?corte=2026-10-15` (no es cierre de mes) → aviso · `?corte=2024-12-31` → aviso · `?corte=2026-09-30&corte=2026-08-31` → aviso · sin `corte` → 2026-10-31 sin aviso. **Solo `resolverCorte` exige esto**: `saldoAlCorte`, `existeAlCorte`, `atraso` y las medidas aceptan cualquier fecha civil válida (H18): `saldoAlCorte(T01-F, 2026-05-15)` → 605.000,00 y `existeAlCorte(T05-R, 2026-11-03)` → verdadero, mientras `resolverCorte("2026-05-15")` → aviso. |
| S6 | En un pago parcial, el tramo sale del **vencimiento original**, no del último pago. | T02 al 2026-09-30: último pago el 15/09 (15 días antes) pero el atraso es 52, tramo 31–60 (no 1–30). |
| S7 | Las medidas "del mes" (`facturacion-mes`, `facturado-con-iva-mes`, `iva-mes`, `cobranza-mes`, `retenciones-mes`) usan el **mes calendario que contiene el corte**, con comprobantes y recibos que existen al corte. | Fixture T14, corte 2026-09-30: `facturacion-mes` incluye T14-F1 y no T14-F2 · corte 2026-10-31: incluye T14-F2 y no T14-F1. Vale también para `facturado-con-iva-mes`. Con `mes=2026-09` y corte 2026-10-31, `facturacion-mes` incluye T14-F1 (mes completo, 4.3). |

### 6.5 Antigüedad de saldos (A)

En la interfaz el concepto se llama «Saldo a cobrar según días de atraso» (columna «Días de atraso»): los tramos se cuentan desde el vencimiento, no desde la emisión (decisión de Matías, 25/11/2026). «Antigüedad» queda solo como término interno, en el código y en estas reglas. Un porcentaje que no se puede calcular se ve «—» y los lectores de pantalla oyen «Sin porcentaje»; en la ficha del cliente, bajo «En mora $ 0,00», se lee «Sin saldo a cobrar»; la solapa Cuenta corriente dice «N movimientos hasta la fecha de corte».

| ID | Regla | Caso de test |
| --- | --- | --- |
| A1 | Tramos **excluyentes** sobre los días de atraso `d`: No vencido (`d ≤ 0`), 1 a 30, 31 a 60, 61 a 90, Más de 90 (`d ≥ 91`). Claves `no-vencido`, `1-30`, `31-60`, `61-90`, `mas-90`. Rótulos en pantalla: «No vencido», «1 a 30 días», «31 a 60 días», «61 a 90 días», «Más de 90 días» (decisión de Matías, 25/11/2026: antes se escribían con raya). | Fixture T12 en cada borde: d = 0 → No vencido · 1 → 1–30 · **30 → 1–30 · 31 → 31–60 · 60 → 31–60 · 61 → 61–90 · 90 → 61–90 · 91 → Más de 90** · −400 → No vencido · 400 → Más de 90. Propiedad: para todo d en [−400, 400] hay exactamente un tramo. |
| A2 | Σ tramos = saldo a cobrar, al centavo (control cruzado X1: los tramos salen de la agregación por ventana de vencimiento y el saldo, de la agregación por cliente). | Fixture T12 al 2026-10-31: 242.000,00 + 665.500,00 + 726.000,00 + 605.000,00 = 2.238.500,00 = mora; con el no vencido (302.500,00), 2.541.000,00 = saldo. Propiedad sobre todas las semillas y cortes (D3). |

### 6.6 Desglose e invariantes (D)

| ID | Regla | Caso de test |
| --- | --- | --- |
| D1 | Cada número de la pantalla es una `Medida` del catálogo (4.2): valor, `base`, fórmula en palabras y partidas con importe firmado. Toda partida enlaza a su comprobante o recibo. | Cada clave del catálogo tiene su medida, por empresa y por cliente. `mora` del fixture T12 al 2026-10-31: 6 partidas, suma 223.850.000 centavos, agrupadas en 4 clientes. Cada partida lleva `clienteId` y `fecha` (4.3). |
| D2 | **Dos cálculos independientes de cada cifra concuerdan** (4.2.1): para toda medida, `controlar` compara el `valor` (agregación) con la suma de las `partidas` (listado) y lanza `ErrorDeCierre` si difieren. La interfaz **nunca muestra** una cifra cuyo control lance; en el uso normal el control no se ve. | **Propiedad:** 50 semillas × 22 cierres de mes × 15 claves × empresa y 13 clientes, más los meses de la tabla de 12 meses para las cinco claves del mes: `controlar` no lanza. **Mutaciones plantadas, una en cada camino:** (a) sumar 1 centavo a una partida del tramo 31–60 → falla `controlar`; (b) sumar 1 centavo al `valor` de ese tramo → falla `controlar` y los controles X1 y X2; (c) romper el saldo de un comprobante en S2 (por ejemplo, olvidar las NC) sin tocar la agregación → falla `controlar`. Un dato dañado a mano (una NC mayor que el saldo) → el validador (G5) y `controlar` lo nombran. |
| D3 | **Controles cruzados** entre medidas (solo X4 contrasta dos cuentas distintas; los demás prueban que la partición, la suma por cliente, la identidad neto + IVA = total y los doce meses son coherentes entre sí, H49): **X1** Σ de los cinco tramos = `saldo`; **X2** Σ de los cuatro tramos vencidos = `mora`; **X3** para `saldo`, `mora`, los cinco tramos y las cinco del mes, la medida de la empresa = Σ de la misma medida `cliente=` de cada uno de los 13 clientes; **X4** en cada cliente, saldo acumulado final de la cuenta corriente = `saldo − pagos-a-cuenta − saldos-a-favor` = `saldo-neto` (y Σ clientes = el de la empresa); **X5** `facturado-con-iva-mes = facturacion-mes + iva-mes` (tres sumas distintas: neto, IVA y total; empresa y cada cliente, cada mes); **X6** año = Σ de los 12 meses. | Ejemplo chico: factura de 242.000,00 (1/03) y recibo del 20/03 con transferencia de 150.000,00 que imputa 100.000,00 (a cuenta 50.000,00): cuenta corriente 242.000,00 → 92.000,00; `S` = 142.000,00, `A` = 50.000,00, saldo neto 92.000,00 ✓ (X4). Fixture T15: el cliente sin movimientos recientes al 31/10/2026 → saldo 0, fuera de la facturación de octubre, presente en la lista de clientes. Propiedad X1 a X6 sobre 50 semillas y los 22 cierres. Cada control se prueba también al revés: con una medida alterada a propósito, falla. |

D4 se retiró el 22/11 (Aj7): "ordenar una lista no cambia su total" no prueba nada; su mitad útil, "la empresa es la suma de
sus clientes", es el control cruzado X3. El identificador no se reutiliza.

### 6.7 Generador (G)

| ID | Regla | Caso de test |
| --- | --- | --- |
| G1 | `generar(semilla)` es determinista; la huella (FNV-1a 32) es la del conjunto. | Dos llamadas con la semilla publicada (20261122) → la misma huella, **fijada en el test** (y publicada en el README, no en la pantalla). Vectores de la función: `fnv1a("")` = `811c9dc5`, `fnv1a("a")` = `e40c292c`, `fnv1a("foobar")` = `bf9cf968`. Semilla distinta → huella distinta. Los 5 primeros valores de `azar` con la semilla 20261118 (la de la Demo 2, que no es la publicada) son los del test copiado de la Demo 2. |
| G2 | Calendario fijo: todo comprobante emitido en `[2025-01-01, 2026-10-31]` y todo recibo fechado en ese rango **salvo exactamente uno**, el de T05-F (2026-11-03). | Validador de fechas sobre las 50 semillas: un solo recibo posterior a `hasta`. |
| G3 | **Prueba de referencia de la semilla publicada:** están los casos plantados de 5.3 con sus importes y fechas, y se cumple la tabla de 5.4 (lo exacto desde ya y lo que se fija en E4). **Solo para la semilla publicada (20261122)**: para las otras 49 valen los invariantes, no los valores. | Un test por caso plantado y uno de referencia. T17: saldo de T12-d91 = 968.000,00 / 726.000,00 / 726.000,00 / 605.000,00 en los cortes 31/07, 31/08, 30/09 y 31/10. En E4, además: C05 es el cliente con más mora y T12-d91 su comprobante más atrasado. |
| G4 | Es ficticio y se nota: "Demo" en los nombres, CUIT con dígito verificador válido rotulado "ficticio" y nombres que no coinciden con reales (se verifica antes de publicar con la lista local `scripts/prohibidos.local.json`, que no se versiona: ningún nombre de terceros en el repositorio, ni escrito ni como huella). | `cuitValido` en los 14 CUIT (empresa y clientes); búsqueda de nombres antes de E8. |
| G5 | El conjunto generado pasa los validadores C2, C3, R1 y R3, y además: ids únicos, `iva` y `total` de cada comprobante según M2, fechas válidas, y todo comprobante con saldo ≥ 0 en todos los cortes de fin de mes. | Validador sobre las 50 semillas. Con un dato dañado a propósito (un número salteado, una NC de más, una imputación excedida) el validador lo nombra. |
| G7 | Rendimiento: generar < 50 ms; recalcular todas las medidas de la empresa para un corte < 20 ms (los dos caminos de 4.2.1 incluidos). | Medidos en E4 (`node scripts/medir.mjs`): generar 3 ms; las 15 medidas de la empresa para un corte con los dos caminos y `controlar`, 4 ms con datos nuevos y 2 ms con los índices armados. El test de CI (`tests/rendimiento.test.ts`) usa un tope 10 veces más holgado (500 y 200 ms). |

G6 ("el relleno no aporta mora al corte por defecto") y G8 ("C14 quieto") se retiraron el 22/11 (Aj3): existían solo para
garantizar resultados exactos con cualquier semilla y volvían menos real el relleno. Los identificadores no se reutilizan.

## 7. Pantallas

El diseño de las pantallas es de `docs/diseno-ui.md`. Acá solo quedan **las reglas de las que las pantallas dependen**, por
identificador, sin decir cómo se ven:

- **S5**: dirección con corte inválido → corte por defecto y el aviso de esa regla. **S1**: movimientos posteriores al corte,
  rotulados y fuera de toda suma. **S7**: qué mes muestran las cifras "del mes".
- **D1 y D2**: toda cifra es una `Medida` con su desglose; antes de mostrarla se llama a `controlar` y, si lanza, se muestra
  la pantalla de error de programación y nunca el número. **No hay renglón de control ni "cuadra ✓" en la pantalla**: el
  cierre se prueba en los tests y se explica en "Cómo se calcula". **M1 y M5**: cómo se escriben los importes y qué base lleva
  el rótulo de cada cifra.
- **M3 y M4**: porcentajes y "Otros" en los rankings (deudores, aporte de cada cliente a un tramo).
- **4.3**: filtros `cliente` y `mes`, `agrupar=no`, agrupación "Por cliente", qué cifra muestra cada vista (H24 a H26).
- **R2**: "de lo cual, retenciones". **R4**: "Pagos a cuenta sin imputar" con "Revisar imputación" y "Saldos a favor".
- **C5**: la facturación negativa se muestra con signo y el gráfico baja del eje (la semilla puede no tener un mes negativo;
  el fixture T09 lo cubre).
- **A1**: rótulos de tramo "No vencido", "1 a 30 días", "31 a 60 días", "61 a 90 días", "Más de 90 días" (decisión de Matías, 25/11/2026).
- **G1**: nada en pantalla; el pie trae solo la línea de fuente de datos. **G3**: los números del "Cómo se calcula" salen de
  las mismas constantes que el dominio y un test los compara (como `textos-marco.test.ts` en la Demo 2).

## 8. Módulos

| Archivo | Hace | Puro |
| --- | --- | --- |
| `src/lib/dominio/fechas.ts` | `parsearFechaCivil`, `diasEntre`, `sumarDias`, `formatearFecha` (copiado de la Demo 2; sin lo del reloj) y `sumarMeses` (propia de esta demo). | Sí |
| `src/lib/dominio/dinero.ts` | `Centavos`, `centavos`, `TOPE_CENTAVOS`, `sumar`, `sumarLista`, `restar`, `negar`, `calcularIva`, `totalConIva`, `formatearImporte`, `porcentajes` (mayor resto), `porcentaje`, `formatearPorcentaje`, `rankingConOtros` (M1–M4; M5 llega con el catálogo, E3). | Sí |
| `src/lib/dominio/comprobantes.ts` | `vencimientoDe`, `importeFirmado`, `facturacionDelMes`, `comprobantesDelMes`, `clientesQueFacturaron`, ids (`idComprobante`, `idRecibo`) y numeración (`numerarComprobantes`, `numerarRecibos`) (C1, C2, C4, C5). | Sí |
| `src/lib/dominio/validadores.ts` | `validarDatos`: C2, C3, R1, R3, C4 y los de G5 que no son de rango (ids únicos, cliente existente, fechas válidas, IVA y total con M2, saldo ≥ 0). Devuelve problemas `{ regla, dato, mensaje }`, no lanza. | Sí |
| `src/lib/dominio/corte.ts` | `resolverCorte(texto, datos)` (S5; **la única que exige cierre de mes**), `cierresDeMes`, `existeAlCorte`, `saldoAlCorte`, `saldosAlCorte`, `atraso`, `posicionDelCliente`, `cuentaDelCliente`, `mesDelCorte` (S1–S4, S6, S7, R4; aceptan cualquier fecha civil, H18). | Sí |
| `src/lib/dominio/antiguedad.ts` | `tramoDe(d)` y `TRAMOS` con sus límites (A1). | Sí |
| `src/lib/dominio/claves.ts` | Las claves del catálogo agrupadas (`CLAVES_DEL_MES`, `CLAVES_DEL_CATALOGO`, `TODAS_LAS_CLAVES`) y qué medios son retenciones (R2): nombres, no cálculos, compartidos por los dos caminos. | Sí |
| `src/lib/dominio/agregados.ts` | Camino por agregación: el `valor` de cada medida (4.2.1). **No importa `partidas.ts` ni el saldo por comprobante de `corte.ts`.** | Sí |
| `src/lib/dominio/partidas.ts` | Camino por listado: las `partidas` de cada medida (4.2.1). | Sí |
| `src/lib/dominio/orden.ts` | Orden por defecto de las partidas de un desglose (`ordenPorDefecto`, `ordenarPartidas`, `esMedidaDeSaldo`; `diseno-ui.md` 5.9.2, H91). No toca importes: el cierre no depende del orden. | Sí |
| `src/lib/dominio/medidas.ts` | El catálogo de la sección 4.2 con su base (M5) y sus filtros validados (4.3), `medida`, `valorDeMedida`, `clavesExistentes`, `docesMeses`, `porCliente` (con la guarda de H25), `controlar` y `ErrorDeCierre` (D1, D2). | Sí |
| `src/lib/dominio/controles.ts` | Los controles cruzados X1 a X6 (D3, A2): `controlesCruzados` devuelve los que no cierran, `exigirControles` lanza `ErrorDeCierre`. | Sí |
| `src/lib/dominio/textos.ts` | Rótulos de tramo, títulos y fórmulas de las 16 medidas, notas de las partidas y avisos en español neutro, en un solo lugar. | Sí |
| `src/lib/datos/azar.ts`, `cuit.ts` | Copiados (sección 9 de `stack.md`). | Sí |
| `src/lib/datos/huella.ts` | FNV-1a 32 y JSON canónico (G1). | Sí |
| `src/lib/datos/clientes.ts`, `plantados.ts`, `generador.ts`, `esperado.ts` | Clientes literales con su perfil de pago y su CUIT del azar, casos plantados (5.3), relleno con semilla (`generar` devuelve los datos y el mapa alias → id), resultado esperado de la semilla publicada (5.4) (G1–G3). | Sí |
| `src/lib/datos/constantes.ts`, `pesos.ts`, `congelar.ts`, `cargar.ts` | La semilla publicada y el calendario fijo; pesos enteros a centavos; congelado a fondo (H64); el punto de carga: `validarDatos` una vez y los datos congelados (H60). | Sí |
| `scripts/oraculo.mjs`, `referencia.mjs`, `medir.mjs`, `mutaciones.mjs` | Oráculo independiente que no importa el dominio (5.4); imprime las cifras de referencia de una semilla; mide G7; prueba de mutaciones (H67). | Sí |
| `tests/fixtures/*.ts` | `armarDatos` y los fixtures de 5.5. | Sí |
| `src/lib/estado/*.svelte.ts` | Enrutador por *hash* con parámetros (`corte`, `cliente`, `mes`, `agrupar`; 4.3) y estado reactivo. | No |
| `src/rutas/*.svelte`, `src/componentes/*.svelte` | Interfaz (ver `diseno-ui.md`). | No |

## 9. Tests

Vitest, en Node. La lógica de dominio y el generador con TDD (primero el test que falla, con el identificador de la regla en
el nombre). **Cada regla se prueba con su fixture** (5.5), pequeño y con resultado escrito a mano. Matriz de zonas horarias
en CI (`TZ=UTC`, `Asia/Tokyo`, `America/Los_Angeles`) para las fechas. Tests de propiedad D2 y D3 (X1 a X6) sobre 50 semillas y
los 22 cierres de mes (si tarda más de 30 s en CI se pasa a 20 semillas en CI y 50 en local, con una línea en el registro),
con las **tres mutaciones plantadas de D2**. Prueba de referencia de la semilla publicada (G3). Test de tipos de `Centavos`
(M1). Búsqueda en CI, de respaldo: `parseFloat`, `toFixed`, `Math.round`, `Number(` en `src/lib/dominio` (M1), `{@html}`,
`Math.random` y `new Date(` en `src/lib`. La interfaz se verifica en el navegador (ver `diseno-ui.md`) y con la prueba de
punta a punta del recorrido de 2 minutos (decisión 7).

## 10. Seguridad y límites conocidos

- **Seguridad (modelo exprés):** sin activos reales. La demo **no carga datos del usuario**: no hay entrada externa más que la
  dirección (`corte` y el id de la ruta), que se validan con las funciones del dominio (S5) y se muestran como texto. CSP
  `default-src 'none'` con todo en `'self'` y `connect-src 'none'`; prohibido `{@html}`; una sola dependencia de producción.
- **Límites (van al README):** días corridos, sin feriados (decisión 5). Solo facturas, ND y NC A, una moneda. Sin intereses
  por mora ni ND automáticas. Cheques cancelan a la fecha del recibo. El saldo a favor no se aplica solo a facturas
  futuras (R4). Los datos terminan el 31/10/2026 y el corte en P1 es solo cierre de mes; una factura cuyo cobro caería
  después figura impaga. Las alícuotas de retención y los importes son de ficción. Los datos de ejemplo se generan, no son de
  nadie.

## 11. Decisiones

### 11.1 Decididas por Matías el 22/11/2026 (alcance)

La 1 la cambió él (la Demo 3 arranca ya, en paralelo con el cierre de la Demo 2); de la 2 a la 8 aceptó la recomendación.
Repositorio `aslow01/demo-tablero-gestion` (privado hasta publicar), subdominio `tablero.`, licencia MIT y vista previa
privada, confirmados.

| # | Decisión | Dónde se aplica |
| --- | --- | --- |
| 1 | Arranca ya, en paralelo con el cierre de la Demo 2. | `plan.md` |
| 2 | Datos con **calendario fijo**, de 01/2025 a 10/2026. | 5.2, G2, S5 |
| 3 | Corte elegible en el mínimo, **solo en cierres de mes** (cualquier día, extra P2). | S5, H1 |
| 4 | Facturación sin IVA y saldos con IVA, **rotulado** en pantalla. | M5, 4.2 |
| 5 | Vencimientos en **días corridos**, declarado como límite (sin feriados). | C4, 10 |
| 6 | **No** se usan los datos de la Demo 2: universo compartido, datos propios. | 2 |
| 7 | `@playwright/test` como dependencia de desarrollo **si Actions anda**; si no, el mismo script corrido a mano y documentado. | `stack.md` |
| 8 | Retenciones en el mínimo. | R2, T08 |

Decisiones sobre `diseno-ui.md` (P1 a P3), también del 22/11/2026: Matías aceptó la recomendación del diseñador (IA) en las tres.

| # | Decisión | Dónde se aplica |
| --- | --- | --- |
| 9 | P1: el gráfico del Resumen compara el **facturado con IVA** contra lo cobrado; la cifra principal de facturación sigue siendo **sin IVA**. | Medida `facturado-con-iva-mes` (4.2), D3 (X5), M5 |
| 10 | P2: el Resumen va en **dos paneles**, "Posición al corte" (mora, saldo, antigüedad) y "Movimiento del mes" (facturación y cobranza con retenciones). | `diseno-ui.md`, 6.1 |
| 11 | P3: acento **azul tinta propio**. | `diseno-ui.md`, 3.2 |

### 11.2 Decisiones propias del diseño (huecos y contradicciones del plan inicial)

Propuestas por la IA al escribir el diseño: cada una elige lo más simple y honesto. Si alguna no convence, se cambia acá y
en el código a la vez. H6, H16, H19 y H21 se retiraron el 22/11 (11.3) y sus identificadores no se reutilizan.

| # | Hueco o contradicción | Decisión |
| --- | --- | --- |
| H1 | El plan decía que el corte válido va "de `desde` a `hasta`" (S5) pero también que el selector solo ofrece cierres de mes (decisión 3). ¿Qué pasa con `?corte=2026-10-15`? | En P1 el corte válido es **un cierre de mes** del rango. Cualquier otro valor vuelve al corte por defecto con el mismo aviso. En P2 ("cualquier día") se relaja a `[desde, hasta]`. |
| H2 | El plan fijaba \|valor\| ≤ 10^13 centavos, pero M3 multiplica por 1000 (10^16, más que el entero seguro 9,007 × 10^15). | Tope **10^12 centavos** (10.000 millones de pesos; el conjunto generado tiene facturación total del orden de 10^10 centavos). El tope se comprueba en cada suma y M3 queda con margen (10^15). |
| H3 | T11 decía "tres clientes con exactamente un tercio del saldo vencido de un mes", pero eso exige que solo esos tres tengan mora. | T11 es el **aporte de cada cliente al tramo 61–90** en un fixture de tres clientes con 363.000,00 cada uno (5.5). La función M3 se prueba además con tres importes iguales sueltos. |
| H4 | G2 dice "todas las fechas en rango" y `hasta` = 2026-10-31, pero T05 pone un recibo el 2026-11-03. | Se acepta **exactamente un** recibo posterior a `hasta` (el de T05-F); el validador G2 lo comprueba. `hasta` limita las emisiones y el corte, no el recibo de T05. |
| H5 | M1 prohibía `parseFloat` y `toFixed`, pero `cuit.ts` y `fechas.ts` de la Demo 2 usan `Number(` para dígitos. | La búsqueda de CI (respaldo del tipo `Centavos`) prohíbe `parseFloat`, `toFixed`, `Math.round` y `Number(` en `src/lib/dominio`, con una lista corta de excepciones por archivo (`fechas.ts`). `cuit.ts` vive en `datos/`, fuera de la búsqueda. |
| H7 | R4 dice que el sobrepago deja al cliente "fuera de la mora", pero S4 define la mora por comprobante (un cliente con una factura vencida y un a cuenta mayor quedaría en ambos lados). | Se define por el cliente: con `S > 0` el a cuenta es "pago a cuenta sin imputar" (la mora no cambia); con `S = 0` es "saldo a favor". Así el saldo a favor nunca coincide con mora. |
| H8 | T10 ("un mes con tres facturas de neto 1.000,50, IVA del mes 630,33") no se puede aislar en la semilla: el IVA del mes incluye el relleno. | Es un fixture de tres facturas (5.5) y se prueba también con `calcularIva` sobre un conjunto de comprobantes. |
| H9 | T14 pone un comprobante "al día siguiente del corte", que sería posterior al 31/10/2026, fuera del calendario. | El par vive en el corte 2026-09-30: T14-F1 el 30/09 y T14-F2 el 01/10 (fixture). |
| H10 | El plan mostraba en gris los movimientos posteriores al corte, y S1 dice que "no existen". | S1: no existen **para ningún cálculo**; la vista puede listarlos rotulados. Un comprobante emitido después del corte se ve con el aviso correspondiente (lo especifica `diseno-ui.md`). |
| H11 | El plan decía "semilla 20261118" igual a la de la Demo 2 y "datos propios". | Se mantiene: mismo mulberry32, orden de llamadas distinto, datos distintos. La coincidencia del número es un guiño, no un acople. **Desde el 25/11/2026 la semilla publicada es otra (H78)**: el guiño se pierde, sin consecuencia. |
| H12 | G4 pide CUIT con dígito verificador válido; en el módulo 11 el resto 1 no tiene verificador. | El generador pasa a la siguiente base cuando `armarCuit` devuelve `null` (consume el azar en un orden fijo). |
| H13 | El dato `perfil` del cliente solo lo usa el generador pero estaba en `Datos` (entraba en la huella). | **Resuelta (Aj7):** el perfil de pago es una constante del generador (`clientes.ts`) y sale de `Datos`. |
| H14 | M4 pide "Top 5 + Otros". | Con el relleno natural se esperan siete clientes con mora, así que "Otros" aparece en la semilla (E4 lo confirma); M4 se prueba además con una lista de 7 importes. |
| H15 | El recorrido de 2 minutos prometía "un comprobante con cobros parciales" del cliente con más mora (C05), pero ninguno de sus comprobantes plantados los tenía. | **T17 sobre T12-d91**: neto 900.000,00 (total 1.089.000,00) con una NC parcial de 121.000,00, un cobro parcial con retenciones y otro de octubre; su saldo al 31/10 es 605.000,00, atraso 91. Al 30/09 es el mismo comprobante con saldo 726.000,00 y tramo 31–60. Descartada: un comprobante nuevo con saldo 0 (no se llega desde la mora). |
| H17 | "Un recibo cubre de 1 a 3 comprobantes" no decía qué fecha lleva sin violar R3. | Un recibo agrupa los cobros de **un mismo cliente con la misma fecha**, hasta 3 (el cuarto va a otro recibo). Su fecha es la de sus cobros: R3 vale sin más reglas. Volumen: unos 600 recibos. |
| H18 | T01 (15/05), T03 (30/07), T04 (01/11) y T05 (03/11) usan cortes que no son cierre de mes. | Las funciones del dominio aceptan **cualquier fecha civil válida**; solo `resolverCorte` exige el cierre de mes (S5). Las propiedades recorren los 22 cierres. |
| H20 | La frase de R2/T08 mezclaba el recibo con el mes (se leía como `retenciones-mes` de abril de toda la empresa). | Reescrita: los 40.000,00 son **del recibo del 30/04** y su partida en las medidas de abril; el mes completo suma además otros recibos. |
| H22 | Cliente con `S > 0` y a cuenta mayor que `S`: ¿pago a cuenta, saldo a favor o los dos? | Se decide por el cliente y el a cuenta **no se parte**: con `S > 0` todo es "pago a cuenta sin imputar" (saldo neto negativo, con signo en la cuenta corriente). No ocurre en los datos; se prueba con un caso armado (R4). |
| H23 | La numeración no decía cómo desempatar recibos de la misma fecha, y los plantados no tenían lugar frente al relleno. | Comprobantes: (emisión, cliente, generación; plantados después del relleno). Recibos: (fecha, cliente, id **menor** de los comprobantes imputados, generación; corregido en H38). Es también el orden de las listas de la huella. |
| H24 | `diseno-ui.md` necesitaba el parámetro `mes=`, la clave de "Otros" y el enlace "Ver las partidas sin agrupar". | `mes=AAAA-MM` válido entre 2025-01 y el mes del corte, solo en las cinco medidas del mes (aviso propio si es inválido); `mora-otros` (M4); `agrupar=no` (4.3). |
| H25 | "Por cliente" necesitaba el cliente de cada partida y M3 no admite negativos, pero la facturación de un cliente en un mes puede serlo (T09). | `Partida` lleva `clienteId`, `fecha` y `atraso`; el % de la tabla "Por cliente" es "—" en todas las filas si algún subtotal es negativo. |
| H26 | `diseno-ui.md` mostraba un saldo con signo para un cliente con saldo a favor y no distinguía el saldo del comprobante. | La columna Saldo de "Clientes" es `S` (≥ 0, suma al `saldo`); el a cuenta y el saldo neto van aparte (4.3). El saldo de un comprobante no es una medida: se explica con sus Movimientos. |

### 11.3 Ajustes del 22/11/2026 tras la revisión de E0

Una revisión independiente (de reclutador y de senior, hecha por una IA) encontró cuatro bloqueos antes de escribir código.
Quién decidió cada cosa:

| # | Ajuste | Quién | Dónde se aplica |
| --- | --- | --- | --- |
| Aj1 | **El renglón "la suma de las partidas cuadra ✓" y el sello de fecha de corte salen de la interfaz.** El control vive en los tests y en el texto de "Cómo se calcula"; el pie trae una línea de fuente de datos. La pantalla de error de D2 subsiste para cuando un control falle, sin ser una pieza visible; la interfaz queda más simple para quien lee administración. | Decidido por Matías (22/11) | 1, 3, 5.2, 7, D1, D2, G1 |
| Aj2 | **Dos cálculos independientes de cada cifra y controles cruzados.** El control original comparaba un número consigo mismo (el valor se definía como la suma de sus partidas), así que no podía fallar. Hallazgo de la revisión (IA). | Decidido por Matías (22/11) | 4.2.1, D2, D3, A2, 8 |
| Aj3 | **Resultado fijado solo para la semilla publicada; los casos borde, en fixtures escritos a mano.** Se retiran G6, G8, H6, H16, H19, H21, el cliente C14 y el perfil `inactivo`; los casos T01, T03, T09, T10, T11, T12 (salvo T12-d91), T13 a T16 pasan a fixtures. El generador vuelve a ser simple, con cobros de atraso natural y sin acumular cobros el 31/10. Los valores de 5.4 se fijan en E4 con el generador real. | Decidido por Matías (22/11) | 5.2 a 5.5, G3, 9 |
| Aj4 | Los rangos de importes de 5.1 (por ejemplo, alquiler mensual de 600.000 a 900.000) se mantienen: son ficticios (el README lo dice). | Matías los revisó y los consideró plausibles (22/11) | 5.1 |
| Aj5 | `Centavos` pasa a ser un número con marca, con constructor que valida; la búsqueda con grep queda de respaldo. | Propuesto por la revisión (IA); sin decisión de Matías registrada | 4, M1, `stack.md` |
| Aj6 | El producto se llama **Tablero de cobranzas** (el repositorio conserva `demo-tablero-gestion`). | Propuesto por la revisión (IA); sin decisión de Matías registrada | todo el repositorio |
| Aj7 | Se quitan los vínculos con documentos que no están en este repositorio, `perfil` sale de `Datos` (cierra H13) y se retira D4 ("ordenar una lista no cambia su total"; su mitad útil es X3). | Propuesto por la revisión (IA); sin decisión de Matías registrada | todo el repositorio, 4 |

### 11.4 Decisiones propias de E2 (22/11/2026, dinero, comprobantes y validadores)

Propuestas por la IA al escribir el código con TDD: cada una elige lo más simple y honesto donde el diseño no decía. Si alguna no
convence, se cambia acá y en el código a la vez. Las que dejan una pregunta para Matías están en `docs/registro.md` (E2).

| # | Hueco | Decisión |
| --- | --- | --- |
| H27 | M1 dice «`sumar(10, 20)` = 30», pero con el tipo con marca `sumar` pide `Centavos`. ¿`sumar` suma dos o muchos? | `sumar(...sumandos)` toma cualquier cantidad y `sumarLista(lista)` una lista de cualquier largo (sin desparramar argumentos). **Lanza si una suma parcial supera el tope**, no solo la final (la lectura más estricta de «lanza si el resultado supera el tope»). Los casos de tablas se escriben con `centavos(10)`. |
| H28 | M3 no dice cómo se escribe el porcentaje con su unidad. | `formatearPorcentaje(449)` → `44,9 %` con **espacio duro (U+00A0)** antes del `%`, como el del `$` de M1. Sin porcentaje (`null`, total 0) → «—». Las milésimas son enteros; el resto de M3 se compara como entero, sin dividir. |
| H29 | El módulo se llamaba `otros` (sección 8), pero devuelve un ranking entero. | `rankingConOtros(filas, maximo = 5)` → `{ mostrados, otros, total }` (M4). El orden es el de M3: importe mayor y, en el empate, nombre `es-AR`. |
| H30 | Dónde vive la numeración (C2): el generador (E4) y `armarDatos` (E2) necesitan la misma. | **Una sola**, en `comprobantes.ts`: `numerarComprobantes` y `numerarRecibos` toman *borradores* con una `clave` (el alias del caso) porque los ids recién existen después de numerar. El validador C2 es la comprobación independiente: revisa correlatividad, repetidos y orden por fecha, **no** el desempate del mismo día (H23), que es del generador y no una propiedad de cualquier dato. |
| H31 | C3 y R3 piden el saldo «a la fecha» de una NC o de un recibo, y `corte.ts` (E3) todavía no existe. | `validadores.ts` recorre los hechos de cada factura por su cuenta, en el orden de la cuenta corriente (4.1: por fecha y, el mismo día, primero los comprobantes y después los recibos, y por id). Cada hecho se compara con el saldo previo; **el que se pasa se informa y no se descuenta**. Como el saldo solo baja con esos hechos, esto cubre también «saldo ≥ 0 en todos los cortes» de G5. |
| H32 | C3 no dice qué pasa con una NC anterior a su factura, ni con una NC o una ND asociada a algo que no es una factura. | Se rechazan (C3), nombrando la nota y la factura. Una ND sin `asociadoA` es válida (4.1). Una NC no tiene saldo propio: imputarle un recibo se rechaza (R3). |
| H33 | G5 pedía validar IVA y total según M2 y ids únicos; C4 no estaba entre los validadores. | `validarDatos` valida además el vencimiento (regla `C4`: emisión + plazo, y la emisión misma en una NC) y el cliente existente. Quedan fuera, a propósito, el rango de fechas (G2) y el desempate del mismo día (H23): son del generador (E4). |
| H34 | `Number(` está prohibido en `src/lib/dominio` salvo `fechas.ts` (H5), pero el validador lee los dígitos de `R-0003-00000045`. | **Corregida en H39:** `leerIdRecibo` en `comprobantes.ts` (junto a `idRecibo`) lee los dígitos con `parseInt(dígitos, 10)` sobre dígitos ya validados por una expresión regular. No toca dinero. |
| H35 | El plan ponía `armarDatos` (2.4) después de los validadores (2.3), pero los tests de los validadores necesitan datos válidos de base. | Se hizo en el orden 2.2, numeración, 2.4 y 2.3. Los fixtures de 5.5 usan los clientes de la tabla 5.1 (razón social y plazo) escritos en `tests/fixtures/armarDatos.ts`; en E4, cuando exista `datos/clientes.ts`, conviene que un test compare los dos para que no se desvíen. |

Verificación de los números: un script aparte (fuera del repositorio) recalculó los casos de 5.3 y los fixtures de 5.5
(T09, T10, T11, T12 y R4) y los porcentajes de M3; coinciden con lo escrito. No hay código todavía.

### 11.5 Correcciones de la revisión de E2 (22/11/2026)

Hallazgos de `revisor-codigo` sobre E2 (informe interno, no publicado). Las decisiones 1 a 4 las tomó el hilo principal el 22/11, a partir de las recomendaciones del informe; las demás son propuestas por la IA al corregir.

| # | Hueco | Decisión |
| --- | --- | --- |
| H36 | R1: un recibo sin medios ni imputaciones pasaba como válido y consumía un número de C2 sin significar nada. | **Se rechaza** («no cobra nada»). Un recibo con imputaciones y sin medios lo rechaza, como antes, el a cuenta negativo. |
| H37 | Los validadores lanzaban con importes que no son enteros, con sumas que pasan el tope o con un plazo de cliente inválido, aunque este documento (sección 8) dice que devuelven problemas. | **Informan en vez de lanzar.** Un importe dañado se nombra en R1 (o en G5 si es de un comprobante) y no entra en el cálculo de saldos; una suma que pasa el tope se nombra; un cliente con plazo que no es un entero de 0 o más se nombra (G5, con el id del cliente) y se saltea su C4. |
| H38 | El desempate de la numeración de recibos usaba la primera imputación de la lista (H23), que cambia si se escribe la lista en otro orden. | Se usa el **id menor** de los comprobantes imputados: el número no depende del orden en que se escribieron las imputaciones (que se conserva en el recibo). |
| H39 | `parseInt` esquivaba la búsqueda de CI sin cumplirla (para importes es peor que `Number(`: `parseInt("12.50")` da 12). | `parseInt` queda prohibido en `src/lib/dominio` salvo en `comprobantes.ts`, donde vive `leerIdRecibo` (la inversa de `idRecibo`, con test de ida y vuelta). Cierra H34. |
| H40 | «Fuera de orden» (C2) informaba solo el número que quedaba atrás respecto del anterior. | Compara con la fecha mayor vista hasta ese número, así informa todos los que quedan atrás. |
| H41 | `porcentaje`, `formatearPorcentaje` y `rankingConOtros` aceptaban entradas fuera de dominio y fabricaban texto basura (M3: «nunca NaN %»). | Lanzan: `porcentaje` con `parte` o `total` negativos; `formatearPorcentaje` con milésimas que no son un entero de 0 o más; `rankingConOtros` con un máximo que no es un entero de 1 o más. |
| H42 | `sumar` lanza con una suma parcial que pasa el tope aunque el resultado final entre (depende del orden con importes de distinto signo). | **Se mantiene** (H27: la invariante «todo `Centavos` está dentro del tope» es simple y los datos reales tienen cien veces de margen). Tiene su test (`[TOPE, 1, −1]` lanza y `[TOPE, −1, 1]` no). Si E3 sumara listas firmadas cerca del tope, se ordena o se usa una suma aparte; hoy no hace falta. |


### 11.6 Decisiones propias de E3 (22/11/2026, corte, mora, antigüedad, medidas y controles)

Propuestas por la IA al escribir el código con TDD: cada una elige la lectura conservadora donde el diseño no decía. Si alguna no convence, se
cambia acá y en el código a la vez. Las que dejan una pregunta para Matías están en `docs/registro.md` (E3).

| # | Hueco | Decisión |
| --- | --- | --- |
| H43 | `resolverCorte` recibe el texto de la dirección, pero S5 pide avisar si el corte viene repetido. | `resolverCorte(texto, datos)` acepta `string`, una lista de valores (el parámetro repetido) o `null`/`undefined`; devuelve `{ corte, aviso }`. Sin valores, el corte por defecto sin aviso; un solo valor que sea un cierre de mes del rango, ese corte; todo lo demás, el corte por defecto con el aviso. `cierresDeMes(datos)` da los 22 cierres. |
| H44 | S1/S2 no dicen qué saldo tiene un comprobante que no existe al corte, ni una NC. | `saldoAlCorte` da **0** para una NC (no tiene saldo propio) y para un comprobante emitido después del corte (no existe para ese corte, S1); lanza si el id no existe. `saldosAlCorte` lista las facturas y ND que existen al corte, con los saldos 0 incluidos, en el orden de los datos. |
| H45 | R4 define el cliente con `S = 0` y con `S > 0`, pero no el `S` negativo (que C3 y R3 impiden). | Se decide por `S > 0`: con `S > 0`, todo `A` es pago a cuenta; si no, saldo a favor. Los dos caminos usan la misma regla. |
| H46 | 4.3 pide validar `cliente` y `mes` pero no dice qué hace el dominio con lo inválido ni qué guarda `Medida.filtro`. | `medida(datos, corte, clave, filtro, opciones)` **lanza** (`Error`, nombrando el dato) con un cliente, una clave, un mes dado o un corte inválidos (un `mes` dado tiene que estar entre el de `desde` y el del corte; **sin `mes`, el del corte vale para cualquier corte**, H56); en las del mes guarda el `mes` ya resuelto en `Medida.filtro` (el del corte si no vino); en las demás lo descarta sin avisar. Los avisos de la dirección son de la capa de rutas (E5). |
| H47 | 4.2.1 pide, para `mora`, la ventana de los tramos vencidos. | Por agregación la mora es **una sola ventana** (vencimiento ≤ corte − 1) y no la unión de los cuatro tramos, así X2 (Σ tramos vencidos = mora) compara dos cuentas distintas. Cada tramo toma su ventana de `TRAMOS` (límites de A1): `[corte − máximo, corte − mínimo]`. |
| H48 | 4.3 pide una `nota` en las partidas sin fijar el texto, ni el orden de las partidas. | Orden: por fecha, comprobantes antes que recibos y por id. Nota de las partidas de saldo: «N días de atraso» (1 día si es 1) si el atraso es de 1 o más; si no, «Vence el dd/mm/aaaa». Nota de retenciones: «Retención IIBB $ 25.000,00 y Ganancias $ 15.000,00» (importes con el formato de M1, con el `$`). |
| H49 | D2 y D3 no dicen qué devuelve un control cruzado ni de dónde toma las medidas. | `controlar(medida)` lanza `ErrorDeCierre` (clave, `valor`, `suma`, `diferencia`). Los controles X1 a X6 (`controlesCruzados`) toman los **`valor` de la agregación** por una función `ValorDeMedida` (así un test altera una medida a propósito) y devuelven la lista de los que no cierran; `exigirControles` lanza `ErrorDeCierre` con el primero. X3 recorre las **12** claves de D3 (`saldo`, `mora`, los cinco tramos y las cinco del mes; el «11» que decía este renglón era un error de cuenta); X6 es de la empresa. **X4 cruza además la posición del cliente de `corte.ts`** (S, A, pagos a cuenta, saldos a favor y saldo neto, por listado) contra las medidas (por agregación); la posición entra por un parámetro (`PosicionDe`, por defecto `posicionDelCliente`) para que un test plante un error en ella (H59). |
| H50 | 4.3 pide `docesMeses(corte)` pero el recorte necesita `desde`. | `docesMeses(corte, desde)`: los doce meses `AAAA-MM` que terminan en el del corte; menos, si empezarían antes del mes de `desde`. |
| H51 | H25 dice que la guarda del porcentaje «tiene que estar en quien llama», pero repetirla en cada vista es un riesgo. | `porCliente(medida, datos)` la lleva: el porcentaje de M3 solo si todos los subtotales son ≥ 0 y el valor > 0; si no, `null` en todas las filas y `porcentajes` no se llama. Orden: subtotal de mayor a menor y, en el empate, razón social (`es-AR`). |
| H52 | La mutación (c) de D2 (un saldo roto en S2 sin tocar la agregación) necesita una forma de plantarla sin editar el código. | `partidasDe` y `medida` aceptan un proveedor de saldos opcional (`ProveedorDeSaldos`, por defecto `saldosAlCorte`); los tests pasan uno que olvida las NC. Además se plantó la misma mutación en el código fuente de `corte.ts` y la propiedad la detecta (`registro.md`). |
| H53 | T02, T04, T05, T07, T08 y T17 viven en la semilla (E4), que todavía no existe. | Se escribieron como fixtures chicos en `tests/fixtures/casos.ts` con los mismos importes y fechas de 5.3 (E4 los repite sobre la semilla). La propiedad de 3.5 usa un generador provisional (`tests/fixtures/generadorProvisional.ts`) que no es el de verdad: sin huella, sin orden de azar contractual. |
| H54 | `agregados.ts` y `medidas.ts` necesitan aritmética de meses sin `Number(` (M1, H5). | `sumarMeses(mes, n)` en `fechas.ts`, el único archivo del dominio que puede leer dígitos con `Number(`. `agregados.ts` compara los meses como texto (`AAAA-MM-01` a `AAAA-MM-31`). |

### 11.7 Correcciones de la revisión de E3 (22/11/2026)

Hallazgos de `revisor-codigo` sobre E3 (informe interno, no publicado). Las respuestas a las cuatro preguntas abiertas las dio el hilo principal el 22/11; el resto son propuestas por la IA al corregir.

| # | Hueco | Decisión |
| --- | --- | --- |
| H55 | 4.2.1 decía que `saldo-neto` por agregación es «el saldo acumulado final de la cuenta corriente», pero el código lo calcula como `S − A` (otra cuenta, algebraicamente igual). | Se corrige la tabla de 4.2.1: `saldo-neto` es `S − A`; la cuenta corriente real es `cuentaDelCliente` y la cruza X4. |
| H56 | `medida()` lanzaba, con un mensaje ilegible, para una medida del mes con un corte anterior a `desde`, contra H18 («cualquier fecha civil válida»). | **Sin `mes`, rige el del corte, sea cual sea**: un corte anterior a `desde` (o posterior a `hasta`) da una medida del mes en 0. Con un `mes` explícito se valida contra `desde` y el corte, y si el corte es anterior a `desde` el error lo dice en llano. |
| H57 | Pregunta 1 del informe: un `S` negativo (dato dañado) se lee como saldo a favor. | **Se deja** (decisión del 22/11): una excepción en una vista de lectura es peor que una lectura conservadora; `controlar(saldo)` lo delata y `validarDatos` lo nombra. |
| H58 | Pregunta 2: `saldoAlCorte` de un comprobante posterior al corte da 0 y mezcla «saldado» con «todavía no existe». | **Se deja** (H44). La vista Comprobante (E6) tiene que mirar `existeAlCorte` y mostrar el aviso de H10, no «saldado»: hay un test de vista anotado en `plan.md` (paso 6.3). |
| H59 | Pregunta 4: el cruce de X4 con `posicionDelCliente` no tenía ningún test que lo hiciera fallar. | **Se prueba**: la posición entra por un parámetro (`PosicionDe`), un test altera cada campo y las cinco comparaciones están entre las mutaciones del script. También se compara A (lo cobrado sin imputar). |
| H60 | Pregunta 3: una NC asociada a una ND no la ve ningún control (los dos caminos la restan de la ND), solo `validarDatos`. | **`validarDatos` se llama una vez al cargar los datos** (`datos/cargar.ts`, E4): si devuelve algo, la carga informa el problema y no se calcula nada en silencio. No se suma ningún control. |
| H61 | La independencia de los dos caminos se custodiaba con un test que no veía imports en varias líneas, ni el otro sentido, ni a través de un tercero. | `tests/independencia.test.ts` lee el grafo completo y fija **qué comparten los dos caminos**: `dinero.ts`, `fechas.ts` y `tipos.ts` (utilidades), `antiguedad.ts` (límites de A1, que `antiguedad.test.ts` cruza con `tramoDe`) y `claves.ts` (R2, que `claves.test.ts` prueba con números). Otro módulo en común hace fallar el test. |
| H62 | `retencion-iva` no la ejercitaba ningún test y `claves.ts` es lo único que comparten los dos caminos. | `ES_RETENCION: Record<Medio, boolean>` obliga al compilador a clasificar cada medio; fixture con retención de IVA, tabla de verdad de los cinco medios y un test por medio en los dos caminos. El generador de E4 mantiene 5.1 (solo IIBB y Ganancias en C02); el de los tests sí emite los tres. |
| H63 | `exigirCorte` estaba escrita tres veces; `CATALOGO` usaba un `as` que oculta un faltante. | `exigirCorte` vive en `fechas.ts`; `CATALOGO` es un literal con las 16 claves (el compilador exige que estén todas). |
| H64 | Los índices por `WeakMap` suponen que los datos no cambian y el tipo no lo impide. | `congelar` (`datos/congelar.ts`) congela a fondo; `cargar` y `armarDatos` lo usan, así que intentar agregar a un dato lanza un `TypeError`. |
| H65 | «Nunca se muestra un número sin control» dependía de que cada vista llamara a `controlar`. | `medidaControlada` = `medida` + `controlar`: es la puerta de la interfaz (E5, E6); `medida` sola queda para tests y controles. |
| H66 | El mensaje de `ErrorDeCierre` mezclaba el formato de M1 con centavos crudos. | La diferencia sale con el formato de M1 (`−$ 0,01`); el campo `diferencia` sigue siendo un número en centavos. |
| H67 | «Unas 105 mutaciones» no se podían reproducir. | `scripts/mutaciones.mjs` (`npm run mutaciones`, sin dependencias) y `scripts/mutaciones.json`: cada cadena aparece una vez en su archivo (un test lo vigila para que la lista no se pudra) y cada mutación tiene que hacer fallar algún test. |

### 11.8 Decisiones propias de E4 (22/11/2026, generador, plantados, huella y resultado de referencia)

Propuestas por la IA al escribir el generador con TDD; cada una elige la lectura conservadora donde 5.1 y 5.2 no decían. Las que dejan una pregunta para Matías están en `docs/registro.md` (E4).

| # | Hueco | Decisión |
| --- | --- | --- |
| H68 | 5.1 dice «importes del relleno por 2 a 3» para C01, C02 y C03 sin decir cuánto cada uno. | Constante por cliente (`escala`): C01 y C02 por 3, C03 por 2. Multiplica el neto de todas sus facturas de relleno. |
| H69 | 5.4 decía que al 31/08 los 58.000,00 de T07 son «a favor» sin condición. | Es cierto en el fixture T07, no en la semilla: R4 se decide por el cliente y C09 todavía tiene facturas sin cobrar al 31/08. 5.4 lo aclara; el test de referencia lo fija (a favor al 31/10, a cuenta al 31/08). |
| H70 | 5.2 fija el orden de los sorteos pero no el de los del relleno de cada factura, ni qué servicio lleva cada una. | Por cliente y mes: la cantidad (1 a 4) y, por factura, el **día** (1 al último del mes, así hay emisiones los días 29, 30 y 31), el **servicio** (la primera es siempre el alquiler y no sortea; las demás salen de los otros cuatro, con el traslado de personal tres veces más probable en enero y febrero) y el **importe** en pesos enteros dentro del rango del servicio, por la escala del cliente. |
| H71 | 5.2 pide sortear «si lleva NC, su porcentaje y sus días» sin decir cómo se sortea el «si lleva». | `probabilidad(1/8)` y, solo si lleva, el porcentaje (10 a 100) y los días (3 a 25). Después, siempre, el corrimiento y el medio (cheque con probabilidad 0,15). |
| H72 | 5.1 y 5.2 dicen que las retenciones de C02 son «del neto imputado» y «del neto cobrado». | Del **neto de la factura** (C02 no tiene NC, así que es lo mismo): `(neto × 25 + 500) ÷ 1000` para IIBB y `× 15` para Ganancias; la transferencia o el cheque cubren el resto. El generador **no** emite retención de IVA (5.1); el generador provisional de los tests sí (H62). |
| H73 | Un cobro de la misma fecha y el mismo cliente se junta en un recibo; los casos plantados, ¿también? | **No**: los plantados son recibos literales y no se mezclan con el relleno, aunque coincidan el cliente y el día (hay recibos de relleno y de plantado el mismo día). |
| H74 | 5.2 no dice cuál es el CUIT de la empresa ni si usa el azar. | La empresa tiene un CUIT **fijo** que no usa el azar. **Corregido en la revisión de E4 (M-1):** la sección 2 sí lo decía, y es el de la Demo 2: `armarCuit("30", "99000003")`, o sea 30-99000003-0 (la primera versión usaba la base 71000003, en un bloque con empresas reales). Los CUIT de los clientes son lo primero que usa el azar, un sorteo por cliente en orden de id, con la base de ocho dígitos entre 99.100.000 y 99.999.999 (el bloque de la empresa, por encima de ella) y no de todo el espacio. Ese bloque **no está comprobado como libre**: baja el riesgo, no lo elimina (E8 sigue pidiendo la consulta a mano de los 14 CUIT). |
| H75 | 4.4 pide «verificar con un script independiente» sin decir cuál. | `scripts/oraculo.mjs`: recalcula las 15 medidas con un libro mayor y días enteros, sin importar nada del dominio; `tests/oraculo.test.ts` lo prueba contra los números escritos a mano de los fixtures y contra los dos caminos del dominio (8 semillas × 22 cierres y mitad de mes × empresa y 13 clientes, y 8 semillas del generador provisional, que sí emite notas de débito y retención de IVA; el oráculo recalcula además IVA, total y vencimiento de cada comprobante y lanza si no coinciden con los del dato: B-1 de la revisión de E4). `scripts/referencia.mjs` imprime las cifras para `esperado.ts`. |
| H76 | Las propiedades D2 y D3 corrían solo con el generador provisional (el revisor de E3 lo pidió sobre el real). | Se repiten con `generar` en archivos propios (`propiedad-cierre-real`, `propiedad-cierre-cruzados-real`: 50 semillas × 22 cierres); las del provisional se quedan, porque éste produce lo que el real no (ND, recibos con varias imputaciones, retención de IVA). Suite entera: 17 s. |
| H77 | El resultado esperado «siete deudores» de 5.4 no se cumple con la semilla publicada. | **Se deja como está y se anota** (el generador no fuerza ningún resultado, 5.2): son cuatro y «Otros» no existe. La decisión de cambiar la semilla, el relleno o la historia del recorrido es de Matías (registro de E4, pregunta 1). `esperado.ts` y el test de referencia reflejan lo que da. **Resuelto el 25/11/2026 con H78** (otra semilla). |
| H78 | La semilla `20261118` daba cuatro deudores (sin «Otros») y el tramo 61–90 en 0,00 (revisión de E4, pregunta 1); el recorrido y la vista Resumen necesitan «Otros» y deuda en todos los tramos. | **Decidido por Matías el 25/11/2026:** la semilla publicada pasa a `20261122`. Se eligió porque con ella hay seis deudores (existe «Otros») y deuda en los cinco tramos; es la primera, a partir de `20261118`, que lo cumple (de `20261118` a `20261121` ninguna cumple las dos). Elegir una entre varias es elegir el relato; el generador no fuerza nada y el README lo dice. El cambio mueve datos, huella y cifras de 5.4; los casos plantados (5.3) no cambian. C05 sigue siendo el cliente con más mora y T12-d91 su comprobante más atrasado. |

### 11.9 Decisiones propias de E5 (25/11/2026, enrutador por hash y estado de la dirección), pendientes de revisión

Tomadas por la IA al escribir el paso 5.1 (`src/lib/estado/enrutador.ts` y `direccion.svelte.ts`) donde 4.3, S5 y `diseno-ui.md` (sección 2) no decían. **Nadie las revisó todavía**: `revisor-codigo` y `disenador-ui` las miran antes de dar E5 por cerrada, y las que cambien se anotan acá.

| # | Hueco | Decisión |
| --- | --- | --- |
| H79 | `diseno-ui.md` (sección 2) pide el corte en la dirección; no dice si también va cuando es el de por defecto. | `corte` va siempre en el hash canónico (`aHash`), aun el por defecto. Un `#/` sin corte sigue valiendo y no se reescribe. |
| H80 | Cuándo se corrige la dirección que el usuario escribió. | Con `reemplazarHash` (sin entrada nueva de historial) solo si hubo aviso (S5 o el del mes) y la ruta es navegable. |
| H81 | Qué hace `cliente=` fuera del Desglose, y qué si está mal. | Solo vale en el Desglose. Vacío, repetido o inexistente da ruta `inexistente` de desglose (8.2), sin repetir lo escrito. En las demás rutas se descarta sin aviso. |
| H82 | Qué hace `mes=` según la medida, y qué si está mal. | Solo vale en una medida del mes. Mal escrito, repetido o fuera del rango (de `desde` hasta el mes del corte), se muestra el mes del corte con el aviso del mes. En otra medida se descarta sin aviso. Con el corte inválido se valida contra el corte por defecto y salen los dos avisos. |
| H83 | Qué valores acepta `agrupar` y qué pasa con los parámetros desconocidos. | `agrupar` solo vale como un único `no`; cualquier otra cosa se ignora sin aviso. Los parámetros desconocidos se ignoran. |
| H84 | Cuánto se acepta de una dirección escrita a mano y qué forma tienen los ids. | Un hash de más de 200 caracteres es ruta `desconocida`, con el corte por defecto y sin aviso. Los ids de cliente son letras y dígitos (hasta 10); los de comprobante, `[1-3]-dddd-dddddddd`. |
| H85 | M4: `mora-otros` solo existe si hay «Otros». | Es `inexistente` si no hay más de 5 deudores al corte, vía `clavesExistentes`. |
| H86 | Quién resuelve el comprobante posterior al corte (S1, 8.2). | La ruta sigue siendo `comprobante`; el error «posterior al corte» lo resuelve la vista. |
| H87 | Qué hace `cambiarCorte` desde una vista de error o con un `mes=` que queda fuera de rango. | Desde una vista de error lleva al Resumen con el nuevo corte, porque no hay dirección que reconstruir. Si al cambiar el corte un `mes=` queda fuera de rango, aparece el aviso del mes y se corrige. |
| H88 | Cuánto viven los avisos. | Hasta que cambia el corte o la vista, o se los cierra. |
| H89 | Dónde vive el texto del aviso del mes. | `avisoDeMesInvalido` está en `dominio/textos.ts`, junto a `avisoDeCorteInvalido` (el paso 5.1 no podía tocar ese archivo y lo dejó en el enrutador; se movió al fusionar). `redactor-ux` revisa el texto. |
| H90 | `mora-otros` con `cliente=` escrita a mano: el enrutador la dejaba pasar y el dominio lanzaba (esa medida no admite filtro por cliente). | El enrutador la resuelve como desglose `inexistente` (el mismo estado de 8.2), con el cliente bien o mal escrito, existente o no; sin excepción y sin `try`/`catch`. Lo prueba un test que recorre todas las claves y comprueba que toda ruta de desglose aceptada se puede calcular. |
| H91 | `diseno-ui.md` 5.9.2 fija el orden por defecto de las partidas (por atraso en las medidas de saldo, por importe en las demás) pero `partidasDe` las entrega por fecha (H48). | `partidasDe` no cambia (es el camino por listado y sus pruebas dependen de ese orden). `orden.ts` agrega `ordenarPartidas(partidas, "atraso" \| "importe")` y `ordenPorDefecto(clave)`; la interfaz los llama. Atraso: mayor primero, empate por importe mayor, sin atraso al final por importe. Importe: mayor primero (firmado), empate por la fecha más vieja. **Lo que la especificación no dice y se resolvió así:** el último empate (misma clave de orden y mismo importe) se desempata por fecha más vieja, comprobantes antes que recibos y por id, para que el resultado no dependa del orden de entrada; un atraso de 0 o negativo cuenta como atraso (va antes de las partidas sin atraso); «por importe» es el importe firmado de mayor a menor, así que en `saldo-neto` los pagos a cuenta (negativos) quedan del menos negativo al más negativo. |
