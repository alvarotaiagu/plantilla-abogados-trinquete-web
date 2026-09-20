/* Verificación de la plantilla «Trinquete» según el §7 del PLIEGO.
   node scripts/verify.js            (contra el servidor local)
   TRQ_URL=https://… node scripts/verify.js   (contra GitHub Pages)

   Deja las capturas en screenshots/ y el resumen en scripts/verify-report.json.
   Lo que comprueba, en orden:
     1. Carga en 1440×900 y 390×844 (móvil con isMobile y hasTouch reales).
     2. Capturas de cada sección en los dos tamaños.
     3. Recorrido con mouse.wheel (con Lenis, window.scrollTo no dispara los
        ScrollTrigger del final).
     4. Consola limpia y cero respuestas >= 400.
     5. Pasada con GSAP y Lenis bloqueados (route.abort del CDN).
     6. Pasada con prefers-reduced-motion: reduce.
     6bis. Fotogramas intermedios de la cortina + que acaba en display:none
        en los tres casos.
     7. Botón de cookies, menú móvil y botón del mapa.
     8. Sin [PENDIENTE], TODO ni lorem ipsum.
     9. Anchura real del documento (scrollWidth == innerWidth). */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.TRQ_URL || 'http://127.0.0.1:8977/plantilla-abogados-trinquete-web/';
const CAPS = path.join(__dirname, '..', 'screenshots');
const CDN = /jsdelivr\.net/;

const informe = { base: BASE, fecha: new Date().toISOString(), pasos: [], fallos: [] };
function anota(nombre, ok, detalle) {
  informe.pasos.push({ nombre, ok, detalle });
  if (!ok) informe.fallos.push(nombre + (detalle ? ' — ' + detalle : ''));
  console.log((ok ? 'OK  ' : '!!  ') + nombre + (detalle ? '  — ' + detalle : ''));
}

const SECCIONES = ['portada', 'cuadrante', 'rodaje', 'materias', 'despacho', 'honorarios', 'preguntas', 'contacto'];

function vigilar(page, bolsa) {
  page.on('console', (m) => { if (m.type() === 'error') bolsa.push('console: ' + m.text()); });
  page.on('pageerror', (e) => bolsa.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => bolsa.push('fallo: ' + r.url() + ' ' + (r.failure() || {}).errorText));
  page.on('response', (r) => { if (r.status() >= 400) bolsa.push('http ' + r.status() + ': ' + r.url()); });
}

// Con Lenis, window.scrollTo no dispara los ScrollTrigger del final.
async function recorrer(page, pasos, salto) {
  for (let i = 0; i < pasos; i++) {
    await page.mouse.wheel(0, salto || 900);
    await page.waitForTimeout(420);
  }
  await page.waitForTimeout(2200);
}

async function irA(page, id) {
  await page.evaluate((sel) => {
    const el = document.getElementById(sel);
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, id);
  // Rueda pequeña para que Lenis y ScrollTrigger se enteren del salto.
  await page.mouse.wheel(0, 2);
  await page.waitForTimeout(1400);
}

(async () => {
  if (!fs.existsSync(CAPS)) fs.mkdirSync(CAPS, { recursive: true });
  const b = await chromium.launch();

  /* ---------- 1-4. Escritorio ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errores = [];
    vigilar(p, errores);

    await p.goto(BASE, { waitUntil: 'networkidle' });

    // 6bis. Fotogramas intermedios de la cortina: en la captura final ya no
    // está, así que es la única forma de ver que se levanta de verdad.
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-00-cortina-media.png') });
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-00b-cortina-media.png') });
    await p.waitForTimeout(3200);

    const cortinaFuera = await p.evaluate(() => {
      const c = document.getElementById('cortina');
      return !c || getComputedStyle(c).display === 'none';
    });
    anota('la cortina acaba retirada (normal)', cortinaFuera);

    await p.screenshot({ path: path.join(CAPS, 'escritorio-01-portada.png') });

    // Cookies
    const bannerVisible = await p.isVisible('#cookie-banner');
    anota('el aviso de cookies aparece', bannerVisible);

    // El control de maqueta cede el sitio al aviso legal.
    anota('el control de maqueta se aparta con el aviso de cookies',
      !(await p.isVisible('#maqueta')));
    if (bannerVisible) {
      await p.screenshot({ path: path.join(CAPS, 'escritorio-02-cookies.png') });
      await p.click('#cookie-ok');
      await p.waitForTimeout(250);
      const cerrado = !(await p.isVisible('#cookie-banner'));
      anota('el botón de cookies lo cierra de verdad', cerrado);
      await p.screenshot({ path: path.join(CAPS, 'escritorio-02b-cookies-cerrado.png') });
    }
    anota('el control de maqueta aparece al cerrar el aviso', await p.isVisible('#maqueta'));

    // 9. Anchura real del documento
    const medidas = await p.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: window.innerWidth
    }));
    anota('sin desbordamiento horizontal (escritorio)', medidas.sw <= medidas.iw + 1,
      'scrollWidth ' + medidas.sw + ' vs innerWidth ' + medidas.iw);

    // 3. Recorrido con rueda + capturas por sección
    await recorrer(p, 4);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-cuadrante.png') });

    for (const id of SECCIONES) {
      await irA(p, id);
      await p.screenshot({ path: path.join(CAPS, 'escritorio-' + id + '.png') });
    }

    // El tren anclado, a mitad de recorrido
    await irA(p, 'rodaje');
    await recorrer(p, 3, 700);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-rodaje-medio.png') });

    // El cuadrante, con un supuesto distinto y una fecha vencida
    await irA(p, 'cuadrante');
    await p.selectOption('#c-supuesto', 'despido');
    await p.fill('#c-fecha', '2026-07-01');
    await p.waitForTimeout(350);
    const vencido = await p.textContent('#c-estado');
    anota('el cuadrante detecta un plazo vencido', /fuera de plazo/i.test(vencido || ''), 'estado: ' + vencido);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-cuadrante-vencido.png') });

    await p.selectOption('#c-supuesto', 'sucesiones');
    const hoy = new Date();
    const hace = new Date(hoy.getTime() - 20 * 86400000);
    await p.fill('#c-fecha', hace.toISOString().slice(0, 10));
    await p.waitForTimeout(350);
    const enPlazo = await p.textContent('#c-estado');
    anota('el cuadrante calcula un plazo en curso', /en plazo|apura/i.test(enPlazo || ''), 'estado: ' + enPlazo);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-cuadrante-en-plazo.png') });

    // Formulario de muestra
    await irA(p, 'contacto');
    await p.fill('#f-nombre', 'Nombre de prueba');
    await p.fill('#f-tel', '600 00 00 00');
    await p.check('#f-ok');
    await p.click('#formulario button[type="submit"]');
    await p.waitForTimeout(250);
    const respuesta = await p.textContent('#formulario-respuesta');
    anota('el formulario responde', /muestra/i.test(respuesta || ''), respuesta);

    // Mapa bajo clic
    const antesIframe = await p.$$eval('#mapa-caja iframe', (n) => n.length);
    anota('no hay iframe de mapa antes del clic', antesIframe === 0);
    await p.click('#mapa-boton');
    await p.waitForTimeout(2600);
    const despuesIframe = await p.$$eval('#mapa-caja iframe', (n) => n.length);
    anota('el mapa se inserta al pulsar', despuesIframe === 1);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-mapa-cargado.png') });

    // Las dos densidades de la maqueta. Va al final del bloque para no
    // contaminar las capturas anteriores, y se vuelve a «mecanismo».
    await p.click('#maqueta-sobria');
    await p.waitForTimeout(700);
    const sobria = await p.evaluate(() => {
      const dial = document.querySelector('.complicacion');
      const esc = document.querySelector('.escala');
      const rueda = document.querySelector('.rueda-svg');
      const piezas = Array.from(document.querySelectorAll('.persona-pieza'));
      const visible = (el) => !!el && getComputedStyle(el).display !== 'none';
      return {
        dialOculto: !visible(dial),
        escalaVisible: visible(esc),
        ruedaOculta: !visible(rueda),
        piezasVisibles: piezas.filter(visible).length,
        barras: document.querySelectorAll('.escala-fila').length,
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth
      };
    });
    anota('versión sobria: los diales de materias se retiran', sobria.dialOculto);
    anota('versión sobria: la escala comparativa ocupa su sitio',
      sobria.escalaVisible && sobria.barras === 16, sobria.barras + ' filas de barra (4 por tarjeta)');
    anota('versión sobria: las ruedas del tren se retiran', sobria.ruedaOculta);
    anota('versión sobria: solo queda la pieza que el texto nombra',
      sobria.piezasVisibles === 1, sobria.piezasVisibles + ' pieza(s) visible(s)');
    anota('versión sobria: sin desbordamiento horizontal',
      sobria.sw <= sobria.iw + 1, 'scrollWidth ' + sobria.sw + ' vs innerWidth ' + sobria.iw);

    for (const id of ['rodaje', 'materias', 'despacho']) {
      await irA(p, id);
      await p.screenshot({ path: path.join(CAPS, 'escritorio-sobria-' + id + '.png') });
    }
    await p.click('#maqueta-mecanismo');
    await p.waitForTimeout(700);
    anota('se puede volver a la versión mecanismo',
      await p.evaluate(() => !document.documentElement.classList.contains('maqueta-sobria')));

    // 8. Marcadores pendientes
    // textContent, no innerText: innerText aplica text-transform y el
    // 'MÉTODO' del menú en mayúsculas contiene 'TODO'.
    const texto = await p.evaluate(() => document.body.textContent);
    const marcas = [/\[PENDIENTE\]/, /\bTODO\b/, /\bFIXME\b/, /lorem ipsum/i];
    const encontrados = marcas.filter((m) => m.test(texto)).map(String);
    anota('sin marcadores pendientes ni relleno', encontrados.length === 0, encontrados.join(', '));

    anota('consola limpia en escritorio', errores.length === 0, errores.slice(0, 6).join(' | '));

    // Páginas interiores
    const p2 = await ctx.newPage();
    const err2 = [];
    vigilar(p2, err2);
    await p2.goto(BASE + 'legal.html', { waitUntil: 'networkidle' });
    await p2.waitForTimeout(600);
    await p2.screenshot({ path: path.join(CAPS, 'escritorio-legal.png'), fullPage: false });
    await p2.goto(BASE + 'no-existe-esta-pagina', { waitUntil: 'networkidle' });
    await p2.waitForTimeout(500);
    await p2.screenshot({ path: path.join(CAPS, 'escritorio-404.png') });
    // El 404 responde 404 a propósito: eso no es un fallo. Sus enlaces son
    // absolutos con el prefijo del repo porque es lo que necesita una
    // project page de GitHub Pages, y por eso el servidor local se monta
    // bajo el mismo prefijo: si no, aquí pasaría y en producción no.
    //
    // El navegador escupe además un 'Failed to load resource: 404' de
    // consola sin URL por esa misma navegación. Para no tragarse con él un
    // 404 de verdad, ese mensaje solo se descarta si TODAS las respuestas
    // 4xx de la pasada son la propia navegación al 404.
    const cuatroCientos = err2.filter((e) => /^http 4\d\d: /.test(e));
    const soloLaNavegacion = cuatroCientos.every((e) => e.includes('no-existe-esta-pagina'));
    const err2Reales = err2.filter((e) => {
      if (e.includes('no-existe-esta-pagina')) return false;
      if (soloLaNavegacion && /Failed to load resource.*status of 404/.test(e)) return false;
      return true;
    });
    anota('consola limpia en las páginas interiores', err2Reales.length === 0, err2Reales.slice(0, 4).join(' | '));

    await ctx.close();
  }

  /* ---------- Móvil 390×844 ---------- */
  {
    const ctx = await b.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const p = await ctx.newPage();
    const errores = [];
    vigilar(p, errores);
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(CAPS, 'movil-00-cortina-media.png') });
    await p.waitForTimeout(3600);
    await p.screenshot({ path: path.join(CAPS, 'movil-01-portada.png') });

    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    anota('sin desbordamiento horizontal (móvil)', m.sw <= m.iw + 1,
      'scrollWidth ' + m.sw + ' vs innerWidth ' + m.iw);

    // Menú móvil: abre y CIERRA (el botón tiene que quedar por encima).
    await p.click('#menu-boton');
    await p.waitForTimeout(500);
    const abierto = await p.getAttribute('#menu-boton', 'aria-expanded');
    await p.screenshot({ path: path.join(CAPS, 'movil-02-menu-abierto.png') });
    await p.click('#menu-boton', { timeout: 4000 });
    await p.waitForTimeout(500);
    const cerrado = await p.getAttribute('#menu-boton', 'aria-expanded');
    anota('el menú móvil abre y cierra', abierto === 'true' && cerrado === 'false',
      'abierto=' + abierto + ' cerrado=' + cerrado);

    if (await p.isVisible('#cookie-banner')) await p.click('#cookie-ok');

    for (const id of SECCIONES) {
      await irA(p, id);
      await p.screenshot({ path: path.join(CAPS, 'movil-' + id + '.png') });
    }

    anota('consola limpia en móvil', errores.length === 0, errores.slice(0, 6).join(' | '));
    await ctx.close();
  }

  /* ---------- 5. Sin GSAP ni Lenis (CDN caído) ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.route(CDN, (r) => r.abort());
    const errores = [];
    vigilar(p, errores);
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1800);
    const fuera = await p.evaluate(() => {
      const c = document.getElementById('cortina');
      return !c || getComputedStyle(c).display === 'none';
    });
    anota('la cortina se retira también sin GSAP', fuera);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-05-sin-gsap-portada.png') });

    const titularVisible = await p.evaluate(() => {
      const t = document.querySelector('.hero-titular .palabra-inner');
      if (!t) return false;
      const r = t.getBoundingClientRect();
      return r.height > 4 && getComputedStyle(t).opacity !== '0';
    });
    anota('el titular del hero se ve sin GSAP', titularVisible);

    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-05-sin-gsap-medio.png') });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-05-sin-gsap-final.png') });

    // Solo deben quedar los errores provocados a propósito al tumbar el CDN.
    // Los abortos de route.abort() llegan como 'net::ERR_FAILED' sin URL.
    const ajenos = errores.filter((e) => !CDN.test(e) && !/net::ERR_FAILED|ERR_ABORTED/.test(e));
    anota('sin errores ajenos al CDN tumbado', ajenos.length === 0, ajenos.slice(0, 4).join(' | '));
    await ctx.close();
  }

  /* ---------- 6. prefers-reduced-motion: reduce ---------- */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const errores = [];
    vigilar(p, errores);
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const fuera = await p.evaluate(() => {
      const c = document.getElementById('cortina');
      return !c || getComputedStyle(c).display === 'none';
    });
    anota('la cortina se retira con movimiento reducido', fuera);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-06-reduced-portada.png') });

    // El CONTENIDO tiene que seguir cambiando: reloj y cuadrante.
    const hora = await p.textContent('#hero-hora');
    anota('el reloj marca la hora con movimiento reducido', /^\d{2}:\d{2}:\d{2}$/.test((hora || '').trim()), hora);

    await p.evaluate(() => document.getElementById('cuadrante').scrollIntoView());
    await p.waitForTimeout(500);
    await p.selectOption('#c-supuesto', 'alzada');
    await p.fill('#c-fecha', '2026-09-10');
    await p.waitForTimeout(350);
    const restan = await p.textContent('#c-restan');
    anota('el cuadrante sigue calculando con movimiento reducido', !!restan && restan !== '—', restan);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-06-reduced-cuadrante.png') });

    await p.evaluate(() => document.getElementById('materias').scrollIntoView());
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-06-reduced-materias.png') });
    await p.evaluate(() => document.getElementById('rodaje').scrollIntoView());
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(CAPS, 'escritorio-06-reduced-rodaje.png') });

    anota('consola limpia con movimiento reducido', errores.length === 0, errores.slice(0, 4).join(' | '));
    await ctx.close();
  }

  await b.close();

  fs.writeFileSync(path.join(__dirname, 'verify-report.json'), JSON.stringify(informe, null, 2));
  console.log('\n' + (informe.fallos.length
    ? informe.fallos.length + ' comprobación(es) con fallo:\n  - ' + informe.fallos.join('\n  - ')
    : 'Todas las comprobaciones pasan.'));
  process.exit(informe.fallos.length ? 1 : 0);
})();
