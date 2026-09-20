# Ouzande Abogados — plantilla «Trinquete»

> **Sitio de demostración.** Ouzande Abogados es un negocio **ficticio**; el
> nombre, las personas, la dirección, los teléfonos, el correo y los
> honorarios son de muestra y no corresponden a ningún despacho real de
> Ferrol ni de ningún otro sitio. Todas las páginas llevan
> `noindex, nofollow`.
>
> Los **plazos legales** que aparecen (20 días hábiles para la demanda por
> despido, 1 mes para la alzada, 6 meses para el impuesto de sucesiones…)
> sí son los generales del ordenamiento español y se muestran **a título
> orientativo**. Nada de esta web es asesoramiento jurídico.

**Demo:** https://alvarotaiagu.github.io/plantilla-abogados-trinquete-web/

Plantilla de la biblioteca de **WEBS NEGOCIOS**: web estática completa que se
abre con doble clic, sin build, sin framework y sin backend. HTML + CSS + un
`main.js`; GSAP, ScrollTrigger y Lenis llegan por CDN y, si no llegan, la
página se lee entera.

---

## El concepto: «Trinquete»

El trinquete es la pieza que deja avanzar una rueda diente a diente y le
impide volver atrás. Es exactamente lo que es un plazo procesal: avanza solo
en un sentido y, cuando pasa, no hay forma de rebobinarlo.

De ahí sale todo lo demás. **La ley no como texto, sino como mecanismo**: un
despacho que se presenta por su precisión y su puntualidad, no por su
solemnidad. La página entera es un movimiento de relojería —esfera calada,
ruedas que engranan, tren de rodaje, escape, complicaciones— y el indicador
de avance de lectura no es una barra ni un folio: es **una manecilla que
recorre un dial** en la cabecera.

**Por qué este concepto y no otro.** En la carpeta hermana ya hay tres webs de
despachos reales y las tres usan la misma metáfora de **papel**: «Titulares»
(prensa), «Escritura» (notarial) y «Cláusula» (el folio y el rotulador). Y en
esta biblioteca de plantillas ficticias ya estaban «Pórtico» (arquitectura) y
«Contraluz» (penumbra de sala de interrogatorio). «Trinquete» se aleja de las
cinco a propósito: ni papel, ni piedra, ni penumbra. Metal, engranaje y
puntualidad.

Encaja con **laboral, extranjería y sucesiones** porque son las materias en
las que el plazo es el drama real: llegar tarde no se arregla teniendo razón.

---

## Mapa de secciones

| # | Sección | Qué hace |
|---|---|---|
| — | **Cortina de entrada** | Dos medias platinas con los cantos dentados, engranadas. El segundero da una vuelta y las mitades se separan girando. |
| — | **Cabecera** | Marca, navegación y el **dial de avance**: manecilla + arco de latón + porcentaje. |
| 00 | **Portada** | Esfera calada: el mecanismo (canvas) se ve por debajo de la esfera y las manecillas (SVG) marcan la hora real de Ferrol, corriendo. |
| 01 | **El cuadrante** | Calculadora de plazos de verdad: eliges supuesto y fecha y te dice el último día y cuántos quedan, con el dial pintando el tiempo gastado. |
| 02 | **El tren de rodaje** | Sección oscura anclada con scrub horizontal: las cinco fases de un asunto, cada una con su rueda girando. |
| — | **Cinta de plazos** | Franja de latón con los ocho plazos más habituales, en marquesina ligada a la rueda del ratón. |
| 03 | **Materias** | Pila sticky de cuatro tarjetas (laboral, extranjería, sucesiones, administración), cada una con su «complicación» dibujada. |
| 04 | **El despacho** | Tres personas, cada una representada por una pieza del movimiento (volante, corona, trinquete) + cuatro cifras de funcionamiento. |
| 05 | **Honorarios** | Tabla de seis filas con aviso de que los importes son de muestra. |
| 06 | **Preguntas** | Seis preguntas en acordeón nativo (`<details>`). |
| 07 | **Contacto** | Formulario de muestra, datos, y mapa **solo bajo clic**. |
| — | **Pie** | Sello de demostración, aviso sobre los plazos y enlace al aviso legal. |

Páginas: `index.html`, `legal.html`, `404.html`.

---

## Lo que hay que tocar para reskinearla a un cliente real

Esto es lo más valioso del repo. En orden de lo más rápido a lo más lento.

### 1. Datos del negocio (10 minutos)

Están concentrados y son fáciles de barrer:

- **`index.html`**: el comentario de demo de arriba del todo (bórralo), el
  `<title>`, la `<meta name="description">`, las etiquetas `og:`, el bloque
  `application/ld+json` y el `<meta name="robots">` — **quita el `noindex`
  solo cuando el sitio sea real**.
- **Nombre y rótulo**: `.marca-nombre` («Ouzande») y `.marca-cola`
  («Abogados»), en la cabecera y en el pie de las tres páginas.
- **Dirección, teléfonos, correo y horario**: sección `#contacto`
  (`.contacto-datos`), el pie, `legal.html` y la consulta del mapa en
  `js/main.js` → `initMapa()`.
- **Sello de demostración**: `.pie-demo` en las tres páginas, el comentario
  HTML de cabecera y este README. En un sitio real **desaparece entero**.
- **Colegiación**: esta plantilla, a propósito, **no inventa** número de
  colegiación ni colegio. En `legal.html` hay un párrafo que explica dónde
  irían; sustitúyelo por los datos reales.

### 2. Los plazos y el cuadrante (30 minutos, y hay que pensarlo)

El cuadrante es la pieza que vende esta plantilla, y también la que más
cuidado pide, porque da una cifra que alguien puede creerse.

- Los supuestos viven en **dos sitios que hay que mantener a la par**:
  - el `<select id="c-supuesto">` de `index.html`, con `data-tipo`
    (`habiles` | `naturales` | `meses`) y `data-n`;
  - el objeto `SUPUESTOS` de `initCuadrante()` en `js/main.js`, con el
    rótulo del campo de fecha, el texto explicativo y `desdeElDiaSiguiente`.
- El cálculo de días hábiles descuenta **sábados y domingos y nada más**. Si
  el despacho quiere afinar, hay que meterle una lista de festivos: la
  función a tocar es `sumarHabiles()`.
- Los plazos en meses se cuentan **de fecha a fecha** (`sumarMeses()`), con
  la regla de «si ese día no existe, el último del mes».
- El aviso de `.cuadrante-aviso` **no se quita**. Si el despacho no quiere
  aviso, se quita el cuadrante entero.
- La cinta (`#cinta-pista`) y las fichas de materias repiten plazos: si
  cambias uno, cámbialo en los tres sitios.

### 3. Paleta y tipografía (20 minutos)

Todo vive en `:root` de `css/style.css`. Hay **dos latones a propósito**:

- `--laton` (#7E5A0B) es el latón **de texto**: cifras, etiquetas, enlaces.
  Llega a 5,30:1 sobre la esfera y 4,75:1 sobre el panel.
- `--laton-sup` (#C08F2E) es el latón **de superficie**: dientes, arcos,
  filetes, la franja de la cinta. Como texto no llegaría a AA.

**No los intercambies.** Si cambias el color de marca, vuelve a pasar
`node scripts/contraste.js`: comprueba las 22 parejas de texto y sale con
código 1 si alguna baja de 4,5:1. También hay que cambiar el latón dentro del
canvas: la constante `paleta` de `initMecanismo()` en `js/main.js`.

Tipografías en el `<link>` de Google Fonts de las tres páginas y en
`--fuente-nombre` / `--fuente-cuerpo` / `--fuente-tecnica`.

### 4. El mecanismo del hero (1 hora si quieres cambiarlo)

Está en `initMecanismo()` y es geometría de verdad, no un dibujo:

```js
var MODULO = 0.022;   // fracción del semilado del lienzo
var tren = [
  { N: 40, padre: null, cx: -0.40, cy: 0.30, estilo: 'laton', radios: 6 },
  { N: 24, angulo: -55, padre: 0,  estilo: 'acero', radios: 4 },
  …
];
```

Cada rueda declara sus **dientes** (`N`) y el **ángulo** respecto a su padre;
el radio primitivo sale de `MODULO · N / 2` y el centro, de la suma de los dos
radios. La fase de cada hija se resuelve con la condición de engrane
`Nᵢ(θᵢ−αᵢⱼ) + Nⱼ(θⱼ−αⱼᵢ) ≡ π`, que es constante en el tiempo si la relación de
dientes es exacta: por eso las ruedas no se despegan nunca por mucho que gire.

Para cambiar el tren basta con tocar esa tabla. Las velocidades se derivan
solas, partiendo de que **la rueda de escape avanza un diente por segundo**.

### 5. Textos

Están escritos para un despacho pequeño que vende método y honestidad. Si el
cliente es un despacho grande, hay que rehacerlos: el tono de «aquí no se
cobra por escuchar» no encaja con una firma de cuarenta personas.

---

## Obra gráfica

**Cero fotografía**, y es una decisión, no una carencia: un despacho no tiene
producto que enseñar, y una foto de archivo de un bufete genérico le habría
puesto la cara de alguien real a personas que no existen. Todo lo que se ve
está dibujado para este repo:

- El **logotipo**: una rueda de trinquete de 14 dientes de sierra con su
  uñeta apoyada, generada con la misma función que el mecanismo del hero
  (`puntosTrinquete`), más el rubí central. De ahí salen `favicon.svg`,
  `assets/img/logo/icon.svg`, los PNG de la PWA y el `og.png` de 1200×630.
- La **esfera** del hero: minutería de 60 trazos, cuatro índices numerados y
  ocho rubíes, el nombre grabado y las tres manecillas.
- El **mecanismo**: cuatro ruedas, el trinquete de la cuerda con su uñeta y
  el áncora del escape, dibujados en canvas.
- Las **cinco ruedas** del tren de rodaje, las **cuatro complicaciones** de
  las materias y las **tres piezas** de las personas (volante con espiral,
  corona y trinquete), generadas en SVG desde la misma geometría.

Por eso este repo **no lleva `CREDITOS.md`**: no hay nada que acreditar.

---

## Movimiento

Nueve recursos del §2 del pliego, todos saliendo del concepto:

1. **Lenis** como único motor de scroll (`lerp` 0,17, subido por el scrub
   horizontal).
2. **Char-reveal** palabra a palabra en los titulares, con
   `IntersectionObserver` y no con `ScrollTrigger({once:true})`.
3. **Sticky-stack** de las cuatro materias (el `<li>` es el sticky).
4. **Marquesina** de plazos con la velocidad ligada a la rueda del ratón.
5. **Botones magnéticos**.
6. **Galería anclada con scrub horizontal**: el tren de rodaje, con las
   ruedas girando en sentidos alternos según el recorrido.
7. **Cursor personalizado**: una rueda dentada que gira según lo que corre el
   ratón y se agranda sobre los enlaces.
8. **Hero de canvas**: el mecanismo, que además **acelera con el scroll** —
   el scroll le da cuerda— y vuelve solo a su marcha.
9. **Contadores** en las cifras del despacho.

La **cortina** no cuenta para el mínimo porque es obligatoria.

Con `prefers-reduced-motion: reduce` se apaga el movimiento pero **no el
contenido**: el reloj sigue dando la hora, el cuadrante sigue calculando, la
ficha activa de la pila sigue marcándose y el dial de avance sigue girando.

---

## Accesibilidad

- **Ningún texto se apaga con `opacity`.** Cada nivel tiene su token y su
  ratio medido: `node scripts/contraste.js` imprime las 22 parejas (de 4,75:1
  a 15,92:1) y falla si alguna baja de 4,5:1.
- Foco visible, landmarks, `aria-expanded` sincronizado en el menú, `alt` y
  `<title>` con sentido en los SVG informativos y `aria-hidden` en los
  decorativos.
- La pista horizontal del tren solo recibe `tabindex="0"` **cuando de verdad
  desborda** (es decir, cuando no está anclada).
- El acordeón de preguntas es `<details>` nativo: funciona sin JS.

Sin auditar con axe ni Lighthouse, y probado solo en Chromium.

---

## Robustez

- Dos banderas separadas: `js-motion` (bloqueante, en el `<head>`) y
  `gsap-listo` (solo si las librerías existen).
- El estado oculto del char-reveal lo pone GSAP, no el CSS: con el CDN caído
  los titulares salen visibles.
- La cortina **solo se muestra si hay JS** (`html.js-si`) y se retira por tres
  vías: la línea de tiempo, la vía sin GSAP y una red de seguridad de 4,6 s.
- `overflow-x: clip` y nunca `overflow: clip` a secas.
- El anclaje horizontal solo se activa si cabe (`innerHeight >= 700` y
  `innerWidth >= 900`); si no, degrada a carrusel con `scroll-snap`.
- Los SVG generados por JS se colapsan con `:empty` si el JS no llega, en vez
  de dejar huecos de 220 px.

---

## Verificación

```bash
# con el repo servido en local bajo su prefijo, como en GitHub Pages
node scripts/verify.js
# o contra producción
TRQ_URL=https://alvarotaiagu.github.io/plantilla-abogados-trinquete-web/ node scripts/verify.js
```

Comprueba las 22 cosas del §7 del pliego y deja las capturas en
`screenshots/` y el resumen en `scripts/verify-report.json`.

```bash
node scripts/contraste.js        # las 22 parejas de contraste
node scripts/generate_icons.js   # PNG de la PWA y og.png (necesita servidor)
```

---

## Decisiones tomadas

- **Sin testimonios y sin porcentaje de asuntos ganados.** Un despacho que
  vende puntualidad puede enseñar sus plazos; un «94 % de éxito» no le sirve
  a nadie para decidir y en esta biblioteca, además, sería un dato inventado
  con pinta de verificable. Se explica en la propia página.
- **Sin número de colegiación.** Es una inscripción en un registro público
  real: inventarla sería sembrar información falsa sobre algo que existe.
- **Sin `aggregateRating` ni `review`** en el `schema.org` (`LegalService` a
  secas).
- **El cuadrante da una cifra y por eso lleva aviso.** Descuenta fines de
  semana pero no festivos, y lo dice. Es la única concesión: una web de
  abogados con una calculadora sin advertencia sería irresponsable, incluso
  siendo de muestra.
- **Fondo claro**, frente al negro de «Contraluz»: precisión de taller de
  relojería, no penumbra.
