/* Ouzande Abogados — plantilla «Trinquete». main.js
   Sin build, sin framework. GSAP/ScrollTrigger/Lenis llegan por CDN
   (jsDelivr: cdnjs ya no sirve Lenis). Si fallan, la página se lee entera.

   Dos banderas separadas, a propósito:
     - motionOn  : ¿hay que MOVER cosas? (prefers-reduced-motion)
     - gsapListo : ¿existe la librería?
   El CONTENIDO —la hora, el cuadrante de plazos, la ficha activa, los
   contadores, el porcentaje de avance— cambia SIEMPRE, con las dos
   banderas apagadas. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var motionOn = raiz.classList.contains('js-motion');
  var gsapListo = !!(window.gsap && window.ScrollTrigger);
  var punteroFino = window.matchMedia('(pointer: fine)').matches;

  if (gsapListo) {
    raiz.classList.add('gsap-listo');
    gsap.registerPlugin(ScrollTrigger);
  }

  var TAU = Math.PI * 2;

  /* =====================================================================
     GEOMETRÍA DE ENGRANAJES — la pieza compartida de toda la plantilla.
     Una sola función genera los puntos de una rueda dentada; de ahí salen
     el `d` de los SVG y los Path2D del canvas del hero.

     Módulo compartido: para que dos ruedas engranen de verdad, el radio
     primitivo tiene que ser m·N/2 con el MISMO m, y la distancia entre
     centros, la suma de los dos radios. Nada de dibujar dientes «que
     parezcan».
     ===================================================================== */

  function puntosRueda(N, rPaso, alturaDiente) {
    var p = TAU / N;
    var rPunta = rPaso + alturaDiente * 0.5;
    var rValle = rPaso - alturaDiente * 0.5;
    var pts = [];
    for (var k = 0; k < N; k++) {
      var a = k * p;
      pts.push([a - p * 0.30, rValle]);
      pts.push([a - p * 0.16, rPunta]);
      pts.push([a + p * 0.16, rPunta]);
      pts.push([a + p * 0.30, rValle]);
    }
    return pts;
  }

  /* Trinquete: dientes de sierra. La cara de empuje es radial y el lomo
     está inclinado; por eso la uñeta deja avanzar en un sentido y no en el
     otro. Es el dibujo del que sale el nombre de la plantilla. */
  function puntosTrinquete(N, rPaso, alturaDiente) {
    var p = TAU / N;
    var rPunta = rPaso + alturaDiente * 0.5;
    var rValle = rPaso - alturaDiente * 0.5;
    var pts = [];
    for (var k = 0; k < N; k++) {
      var a = k * p;
      pts.push([a, rValle]);
      pts.push([a + p * 0.82, rPunta]);
      pts.push([a + p * 0.82, rValle]);
    }
    return pts;
  }

  function puntosAPath(pts, cx, cy, cerrar) {
    var d = '';
    for (var i = 0; i < pts.length; i++) {
      var x = cx + Math.cos(pts[i][0]) * pts[i][1];
      var y = cy + Math.sin(pts[i][0]) * pts[i][1];
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return d + (cerrar === false ? '' : 'Z');
  }

  function svgNodo(nombre, atributos) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', nombre);
    for (var k in atributos) if (atributos.hasOwnProperty(k)) el.setAttribute(k, atributos[k]);
    return el;
  }

  /* Rueda completa en SVG: dientes, llanta, radios y rubí central. */
  function ruedaSVG(cx, cy, N, rPaso, opciones) {
    var o = opciones || {};
    var alto = o.alto || rPaso * 0.26;
    var g = svgNodo('g', {});
    g.appendChild(svgNodo('path', {
      d: puntosAPath(puntosRueda(N, rPaso, alto), cx, cy),
      fill: o.relleno || 'none',
      stroke: o.trazo || 'currentColor',
      'stroke-width': o.grosor || 1.6,
      'stroke-linejoin': 'round'
    }));
    var rLlanta = rPaso * 0.68;
    g.appendChild(svgNodo('circle', {
      cx: cx, cy: cy, r: rLlanta, fill: 'none',
      stroke: o.trazo || 'currentColor', 'stroke-width': (o.grosor || 1.6) * 0.75
    }));
    var radios = o.radios == null ? 5 : o.radios;
    for (var i = 0; i < radios; i++) {
      var a = (i / radios) * TAU + (o.faseRadios || 0);
      g.appendChild(svgNodo('line', {
        x1: cx + Math.cos(a) * rPaso * 0.2, y1: cy + Math.sin(a) * rPaso * 0.2,
        x2: cx + Math.cos(a) * rLlanta, y2: cy + Math.sin(a) * rLlanta,
        stroke: o.trazo || 'currentColor', 'stroke-width': (o.grosor || 1.6) * 0.7
      }));
    }
    g.appendChild(svgNodo('circle', { cx: cx, cy: cy, r: rPaso * 0.14, fill: o.eje || 'currentColor' }));
    return g;
  }

  /* ---------------- Lenis: único motor de scroll ----------------
     lerp alto (0,17) a propósito: con el scrub horizontal del tren de
     rodaje, el retardo de asentamiento de Lenis se lee como que el
     contenido se va al revés durante un segundo. */
  var lenis = null;
  if (motionOn && window.Lenis) {
    try {
      lenis = new window.Lenis({ duration: 1.1, lerp: 0.17, smoothWheel: true });
      if (gsapListo) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
      }
    } catch (e) { lenis = null; }
  }

  /* ---------------- Aviso a quien espera a la cortina ---------------- */
  var cortinaLista = false;
  var enEspera = [];
  function alLevantarse(fn) { if (cortinaLista) fn(); else enEspera.push(fn); }
  function avisarCortina() {
    if (cortinaLista) return;
    cortinaLista = true;
    enEspera.forEach(function (fn) { try { fn(); } catch (e) {} });
    enEspera.length = 0;
  }

  /* ---------------- Cortina: las dos platinas engranadas ----------------
     Gesto propio de «Trinquete»: la página está cerrada por dos medias
     platinas cuyos cantos son dientes metidos unos en otros. El segundero
     da una vuelta, el trinquete suelta y las mitades se separan.
     Se retira SIEMPRE: vía normal, vía sin GSAP y red de seguridad. */
  (function initCortina() {
    var cortina = document.getElementById('cortina');
    if (!cortina) { avisarCortina(); return; }
    raiz.classList.add('bloqueo-scroll');

    function ocultar() {
      cortina.classList.add('oculta');
      raiz.classList.remove('bloqueo-scroll');
      avisarCortina();
      if (gsapListo) setTimeout(function () { ScrollTrigger.refresh(); }, 80);
    }

    var seguridad = setTimeout(ocultar, 4600);

    // Dientes exactos según el ancho: en móvil, menos y más grandes.
    (function dentar() {
      var arriba = document.getElementById('cortina-arriba');
      var abajo = document.getElementById('cortina-abajo');
      if (!arriba || !abajo) return;
      var N = window.innerWidth < 700 ? 9 : 16;
      var paso = 100 / N, hondo = 12;
      var sup = ['0 0', '100% 0'], inf = ['0 100%', '100% 100%'];
      for (var i = N; i >= 0; i--) {
        var x = (i * paso).toFixed(4) + '%';
        var enDiente = i % 2 === 0;
        sup.push(x + ' ' + (enDiente ? (100 - hondo) : 100) + '%');
        inf.push(x + ' ' + (enDiente ? hondo : 0) + '%');
      }
      arriba.style.clipPath = 'polygon(' + sup.join(',') + ')';
      abajo.style.clipPath = 'polygon(' + inf.join(',') + ')';
    })();

    if (!gsapListo || !motionOn) {
      clearTimeout(seguridad);
      setTimeout(ocultar, motionOn ? 300 : 0);
      return;
    }

    var arriba = document.getElementById('cortina-arriba');
    var abajo = document.getElementById('cortina-abajo');
    var aguja = document.getElementById('cortina-aguja');
    var marca = cortina.querySelector('.cortina-marca');
    var pie = cortina.querySelector('.cortina-pie');
    var dial = cortina.querySelector('.cortina-dial');

    gsap.set([marca, pie], { opacity: 0, y: 14 });
    gsap.set(dial, { opacity: 0, scale: .82, transformOrigin: '50% 50%' });

    var tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: function () { clearTimeout(seguridad); ocultar(); }
    });

    tl.to(dial, { opacity: 1, scale: 1, duration: .55, ease: 'expo.out' }, .1)
      .to(marca, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' }, '<.12')
      .to(pie, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' }, '<.08')
      // El segundero da una vuelta entera: la cuerda está dada.
      .to(aguja, {
        rotation: 360, svgOrigin: '60 60', duration: 1.15, ease: 'power2.inOut'
      }, '<.05')
      // Y las dos platinas se separan girando, como piezas que se sueltan.
      .to(arriba, { yPercent: -108, rotation: -1.6, duration: 1.15 }, '-=.25')
      .to(abajo, { yPercent: 108, rotation: 1.6, duration: 1.15 }, '<')
      .to([marca, pie, dial], { opacity: 0, duration: .45, ease: 'power2.in' }, '<');
  })();

  /* ---------------- Cursor: una rueda que gira ---------------- */
  (function initCursor() {
    if (!punteroFino || !motionOn) return;
    var cursor = document.getElementById('cursor');
    var rueda = document.getElementById('cursor-rueda');
    if (!cursor || !rueda) return;
    raiz.classList.add('cursor-activo');
    var x = -100, y = -100, tx = -100, ty = -100, giro = 0;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function anima() {
      var dx = tx - x, dy = ty - y;
      x += dx * 0.2; y += dy * 0.2;
      giro += Math.hypot(dx, dy) * 0.32;
      cursor.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      rueda.setAttribute('transform', 'rotate(' + giro.toFixed(1) + ' 20 20)');
      requestAnimationFrame(anima);
    })();
    document.querySelectorAll('[data-cursor="enlace"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor-enlace'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor-enlace'); });
    });
  })();

  /* ---------------- Elementos magnéticos ---------------- */
  (function initMagneticos() {
    if (!punteroFino || !motionOn) return;
    document.querySelectorAll('.boton-magnetico').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var rx = e.clientX - r.left - r.width / 2;
        var ry = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (rx * 0.2).toFixed(1) + 'px,' + (ry * 0.3).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  })();

  /* ---------------- Menú móvil ---------------- */
  (function initMenu() {
    var boton = document.getElementById('menu-boton');
    var menu = document.getElementById('menu-movil');
    if (!boton || !menu) return;
    function alternar(abrir) {
      boton.setAttribute('aria-expanded', String(abrir));
      menu.classList.toggle('abierto', abrir);
      menu.setAttribute('aria-hidden', String(!abrir));
      raiz.classList.toggle('bloqueo-scroll', abrir);
      boton.querySelector('.sr').textContent = abrir ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abrir) lenis.stop(); else lenis.start(); }
    }
    boton.addEventListener('click', function () {
      alternar(boton.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { alternar(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') alternar(false);
    });
  })();

  /* ---------------- Aviso de cookies ---------------- */
  (function initCookies() {
    var banner = document.getElementById('cookie-banner');
    var ok = document.getElementById('cookie-ok');
    if (!banner || !ok) return;
    var CLAVE = 'ouzande-cookies';
    // La clase avisa al control de maqueta de que se aparte: en móvil el
    // aviso ocupa todo el ancho y se le montaría encima. El aviso va primero.
    function mostrar(v) {
      banner.hidden = !v;
      raiz.classList.toggle('con-aviso-cookies', v);
    }
    try {
      if (!localStorage.getItem(CLAVE)) mostrar(true);
    } catch (e) { mostrar(true); }
    ok.addEventListener('click', function () {
      try { localStorage.setItem(CLAVE, '1'); } catch (e) {}
      mostrar(false);
    });
  })();

  /* ---------------- Mapa: solo bajo clic, sin API key ---------------- */
  (function initMapa() {
    var boton = document.getElementById('mapa-boton');
    var caja = document.getElementById('mapa-caja');
    if (!boton || !caja) return;
    boton.addEventListener('click', function () {
      if (caja.querySelector('iframe')) return;
      var q = encodeURIComponent('Rúa da Áncora 21, Ferrol, A Coruña');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/maps?q=' + q + '&output=embed';
      iframe.loading = 'lazy';
      iframe.title = 'Mapa de situación del despacho (dirección de muestra)';
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      var nota = caja.querySelector('.mapa-nota');
      boton.remove();
      if (nota) nota.textContent = 'Mapa cargado desde Google Maps a petición tuya. Dirección de muestra de un despacho ficticio.';
      caja.appendChild(iframe);
    });
  })();

  /* ---------------- Avance de página: la manecilla del dial ----------------
     Es CONTENIDO (dónde estás), así que se actualiza también sin GSAP y
     con movimiento reducido. El transform va en el atributo y ningún CSS
     se lo pisa. */
  (function initAvance() {
    var aguja = document.getElementById('avance-aguja');
    var cifra = document.getElementById('avance-cifra');
    var arco = document.querySelector('.avance-arco');
    if (!aguja) return;
    var pedido = false;
    function pintar() {
      pedido = false;
      var alto = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      var p = Math.min(Math.max(window.scrollY / alto, 0), 1);
      aguja.setAttribute('transform', 'rotate(' + (p * 360).toFixed(1) + ' 22 22)');
      if (arco) arco.setAttribute('stroke-dasharray', (p * 100).toFixed(1) + ' 100');
      if (cifra) cifra.textContent = Math.round(p * 100) + ' %';
    }
    function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    pintar();
  })();

  /* ---------------- Char-reveal de titulares ----------------
     El estado oculto lo pone GSAP, no el CSS: sin CDN el titular sale
     visible. La palabra entera es inline-block + nowrap (si no, parte). */
  (function initTitulares() {
    var elementos = document.querySelectorAll('.titular-reveal');
    if (!elementos.length) return;

    elementos.forEach(function (el) {
      var texto = el.textContent.trim();
      el.textContent = '';
      texto.split(/\s+/).forEach(function (palabra, i, arr) {
        var wrap = document.createElement('span');
        wrap.className = 'palabra';
        var inner = document.createElement('span');
        inner.className = 'palabra-inner';
        inner.textContent = palabra;
        wrap.appendChild(inner);
        el.appendChild(wrap);
        if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });

    if (!gsapListo || !motionOn) return;

    function revelar(el) {
      gsap.to(el.querySelectorAll('.palabra-inner'), {
        yPercent: 0, y: 0, duration: .9, ease: 'expo.out', stagger: .045
      });
    }

    elementos.forEach(function (el) {
      // y:0 explícito: GSAP lee un translate3d de CSS como y en px.
      gsap.set(el.querySelectorAll('.palabra-inner'), { yPercent: 115, y: 0 });
      if (el.closest('.hero')) { alLevantarse(function () { revelar(el); }); return; }
      // IntersectionObserver, no ScrollTrigger({once}): un once:true no
      // dispara si el elemento ya está en pantalla al crearse.
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          revelar(entrada.target);
          io.unobserve(entrada.target);
        });
      }, { threshold: .25 });
      io.observe(el);
    });
  })();

  /* ---------------- La esfera: índices, minutería y manecillas ----------------
     La hora es CONTENIDO: corre siempre, también con movimiento reducido
     (ahí salta de minuto en minuto en vez de por segundos). */
  (function initEsfera() {
    var ticks = document.getElementById('esfera-ticks');
    var indices = document.getElementById('esfera-indices');
    var hora = document.getElementById('aguja-hora');
    var minuto = document.getElementById('aguja-minuto');
    var segundo = document.getElementById('aguja-segundo');
    var lectura = document.getElementById('hero-hora');
    if (!ticks) return;

    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * TAU - Math.PI / 2;
      var largo = i % 5 === 0 ? 16 : 7;
      var grueso = i % 5 === 0 ? 2 : 1;
      ticks.appendChild(svgNodo('line', {
        x1: 260 + Math.cos(a) * 236, y1: 260 + Math.sin(a) * 236,
        x2: 260 + Math.cos(a) * (236 - largo), y2: 260 + Math.sin(a) * (236 - largo),
        stroke: i % 5 === 0 ? 'var(--acero)' : 'var(--canto)', 'stroke-width': grueso
      }));
    }
    // Índices: los cuatro cardinales llevan el número, el resto un rubí.
    [[12, 0], [3, 3], [6, 6], [9, 9]].forEach(function (par) {
      var a = (par[1] / 12) * TAU - Math.PI / 2;
      var t = svgNodo('text', {
        x: 260 + Math.cos(a) * 200, y: 260 + Math.sin(a) * 200 + 8,
        'text-anchor': 'middle', fill: 'var(--acero)',
        'font-family': "'Martian Mono', monospace", 'font-size': 22, 'font-weight': 700
      });
      t.textContent = par[0];
      indices.appendChild(t);
    });
    for (var h = 1; h <= 12; h++) {
      if (h % 3 === 0) continue;
      var ah = (h / 12) * TAU - Math.PI / 2;
      indices.appendChild(svgNodo('circle', {
        cx: 260 + Math.cos(ah) * 200, cy: 260 + Math.sin(ah) * 200,
        r: 5, fill: 'url(#g-rubi)'
      }));
    }

    function pintarHora() {
      var d = new Date();
      var s = d.getSeconds(), m = d.getMinutes(), hh = d.getHours() % 12;
      if (hora) hora.setAttribute('transform', 'rotate(' + (hh * 30 + m * 0.5) + ' 260 260)');
      if (minuto) minuto.setAttribute('transform', 'rotate(' + (m * 6 + s * 0.1) + ' 260 260)');
      if (segundo) segundo.setAttribute('transform', 'rotate(' + (s * 6) + ' 260 260)');
      if (lectura) {
        lectura.textContent = String(d.getHours()).padStart(2, '0') + ':' +
          String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }
    }
    pintarHora();
    // Con movimiento reducido el segundero no salta cada segundo, pero la
    // hora sigue siendo correcta: se refresca cada medio minuto.
    setInterval(pintarHora, motionOn ? 1000 : 30000);
  })();

  /* ---------------- El mecanismo del hero: canvas ----------------
     Cuatro ruedas que engranan DE VERDAD (mismo módulo, distancia entre
     centros = suma de radios primitivos, relación de dientes exacta y fase
     resuelta rueda a rueda), más el trinquete del barrilete con su uñeta y
     el áncora del escape.

     Rendimiento: ni `ctx.filter` ni `shadowBlur` por fotograma. Cada rueda
     es un Path2D construido UNA vez; por fotograma solo hay translate,
     rotate y fill/stroke. El canvas se para cuando no se ve. */
  (function initMecanismo() {
    var canvas = document.getElementById('mecanismo');
    if (!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var MODULO = 0.022;   // en fracción del semilado del lienzo
    var tren = [
      { N: 40, angulo: null, padre: null, cx: -0.40, cy: 0.30, estilo: 'laton', radios: 6 },
      { N: 24, angulo: -55, padre: 0, estilo: 'acero', radios: 4 },
      { N: 30, angulo: 35, padre: 1, estilo: 'laton', radios: 5 },
      { N: 15, angulo: 110, padre: 2, estilo: 'acero', radios: 0 }
    ];

    // Radios primitivos y centros, resueltos en cadena.
    tren.forEach(function (r, i) {
      r.rp = MODULO * r.N / 2;
      if (r.padre === null) return;
      var p = tren[r.padre];
      var a = r.angulo * Math.PI / 180;
      r.alfa = a;                       // dirección padre → hijo
      r.cx = p.cx + Math.cos(a) * (p.rp + r.rp);
      r.cy = p.cy + Math.sin(a) * (p.rp + r.rp);
    });

    // Velocidades angulares. El escape avanza un diente por segundo: de ahí
    // sale la del barrilete hacia atrás.
    var wEscape = TAU / tren[3].N;
    tren[3].w = wEscape;
    for (var i = 2; i >= 0; i--) tren[i].w = -tren[i + 1].w * tren[i + 1].N / tren[i].N;

    /* Fase: N_i(θ_i − α_ij) + N_j(θ_j − α_ji) ≡ π. Esa suma es constante en
       el tiempo si la relación de dientes es exacta, así que basta con
       fijarla una vez y las ruedas ya no se despegan nunca. */
    tren[0].fase = 0;
    for (var j = 1; j < tren.length; j++) {
      var hijo = tren[j], padre = tren[hijo.padre];
      hijo.fase = (Math.PI - padre.N * (padre.fase - hijo.alfa)) / hijo.N + (hijo.alfa + Math.PI);
    }

    var paleta = {
      laton: { trazo: '#C08F2E', relleno: 'rgba(192,143,46,.16)' },
      acero: { trazo: '#78818D', relleno: 'rgba(35,39,46,.07)' }
    };

    var W = 0, H = 0, medio = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var visible = true, extra = 0, t = 0;

    function construir() {
      tren.forEach(function (r) {
        // La altura de diente sale del MÓDULO, no del radio: si creciera
        // con la rueda, dos ruedas engranadas tendrían dientes de distinto
        // tamaño y el engrane dejaría de ser creíble aunque el radio cuadre.
        var alto = MODULO * 2.2;
        var p = new Path2D();
        var pts = puntosRueda(r.N, r.rp * medio, alto * medio);
        pts.forEach(function (pt, k) {
          var x = Math.cos(pt[0]) * pt[1], y = Math.sin(pt[0]) * pt[1];
          if (k === 0) p.moveTo(x, y); else p.lineTo(x, y);
        });
        p.closePath();
        var rLlanta = r.rp * medio * 0.66;
        p.moveTo(rLlanta, 0);
        p.arc(0, 0, rLlanta, 0, TAU);
        r.path = p;

        var radios = new Path2D();
        for (var s = 0; s < r.radios; s++) {
          var a = (s / Math.max(r.radios, 1)) * TAU;
          radios.moveTo(Math.cos(a) * r.rp * medio * 0.18, Math.sin(a) * r.rp * medio * 0.18);
          radios.lineTo(Math.cos(a) * rLlanta, Math.sin(a) * rLlanta);
        }
        r.radiosPath = radios;
      });

      // Trinquete de la cuerda: comparte eje con el barrilete.
      var b = tren[0];
      trinquete.rp = b.rp * 0.44;
      var tp = new Path2D();
      puntosTrinquete(26, trinquete.rp * medio, trinquete.rp * medio * 0.13).forEach(function (pt, k) {
        var x = Math.cos(pt[0]) * pt[1], y = Math.sin(pt[0]) * pt[1];
        if (k === 0) tp.moveTo(x, y); else tp.lineTo(x, y);
      });
      tp.closePath();
      tp.moveTo(trinquete.rp * medio * 0.72, 0);
      tp.arc(0, 0, trinquete.rp * medio * 0.72, 0, TAU);
      trinquete.path = tp;
    }

    var trinquete = { rp: 0, path: null };

    function medir() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(r.width, 1); H = Math.max(r.height, 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      medio = Math.min(W, H) / 2;
      construir();
      pintar();
    }

    function pintar() {
      ctx.clearRect(0, 0, W, H);
      var ox = W / 2, oy = H / 2;

      ctx.save();
      // La esfera está calada: el mecanismo se ve por el hueco, recortado.
      ctx.beginPath();
      ctx.arc(ox, oy, medio * 0.955, 0, TAU);
      ctx.clip();

      // Platina de fondo con su decoración de círculos concéntricos.
      ctx.strokeStyle = 'rgba(179,170,149,.38)';
      ctx.lineWidth = 1;
      for (var c = 1; c <= 9; c++) {
        ctx.beginPath();
        ctx.arc(ox - medio * 0.22, oy + medio * 0.16, medio * 0.1 * c, 0, TAU);
        ctx.stroke();
      }

      tren.forEach(function (r) {
        var est = paleta[r.estilo];
        ctx.save();
        ctx.translate(ox + r.cx * medio, oy + r.cy * medio);
        ctx.rotate(r.fase + r.w * t);
        ctx.fillStyle = est.relleno;
        ctx.strokeStyle = est.trazo;
        ctx.lineWidth = 1.7;
        ctx.lineJoin = 'round';
        ctx.fill(r.path, 'evenodd');
        ctx.stroke(r.path);
        if (r.radios) ctx.stroke(r.radiosPath);
        ctx.restore();

        // Rubí del eje, fijo (no gira con la rueda).
        ctx.beginPath();
        ctx.arc(ox + r.cx * medio, oy + r.cy * medio, Math.max(medio * 0.014, 3), 0, TAU);
        ctx.fillStyle = '#94202E';
        ctx.fill();
      });

      // El trinquete, sobre el eje del barrilete, y su uñeta.
      var b = tren[0];
      var bx = ox + b.cx * medio, by = oy + b.cy * medio;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(b.fase + b.w * t);
      ctx.fillStyle = 'rgba(192,143,46,.26)';
      ctx.strokeStyle = '#8A6412';
      ctx.lineWidth = 1.5;
      ctx.fill(trinquete.path, 'evenodd');
      ctx.stroke(trinquete.path);
      ctx.restore();

      // La uñeta salta un poco cada diente: es lo que impide volver atrás.
      var pasoT = TAU / 26;
      var dentro = ((b.fase + b.w * t) % pasoT + pasoT) % pasoT / pasoT;
      var salto = Math.max(0, Math.sin(dentro * Math.PI)) * medio * 0.018;
      var rT = trinquete.rp * medio;
      var angU = -0.95;
      var pivU = { x: bx + Math.cos(angU) * rT * 2.0, y: by + Math.sin(angU) * rT * 2.0 };
      // El brazo se dibuja tumbado sobre su eje X y se gira hacia el centro
      // de la rueda, más el desvío que da el salto de diente.
      var haciaCentro = Math.atan2(by - pivU.y, bx - pivU.x);
      ctx.save();
      ctx.translate(pivU.x, pivU.y);
      ctx.rotate(haciaCentro + 0.2 + salto / rT);
      ctx.beginPath();
      ctx.moveTo(0, -rT * 0.2);
      ctx.lineTo(rT * 0.82, -rT * 0.11);
      ctx.lineTo(rT * 1.04, 0);
      ctx.lineTo(rT * 0.82, rT * 0.13);
      ctx.lineTo(0, rT * 0.22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(35,39,46,.14)';
      ctx.strokeStyle = '#4F5762';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(pivU.x, pivU.y, Math.max(medio * 0.011, 2.4), 0, TAU);
      ctx.fillStyle = '#4F5762';
      ctx.fill();

      // Áncora del escape: bascula a dos hercios sobre su propio eje.
      var e = tren[3];
      var ex = ox + e.cx * medio, ey = oy + e.cy * medio;
      var rE = e.rp * medio;
      var pivX = ex, pivY = ey - rE * 2.4;
      var basculo = Math.sin(t * Math.PI * 2) * 0.12;
      ctx.save();
      ctx.translate(pivX, pivY);
      ctx.rotate(basculo);
      ctx.beginPath();
      ctx.moveTo(-rE * 0.22, -rE * 0.34);
      ctx.lineTo(-rE * 0.78, rE * 1.2);
      ctx.lineTo(-rE * 0.44, rE * 1.46);
      ctx.lineTo(-rE * 0.26, rE * 0.42);
      ctx.lineTo(rE * 0.26, rE * 0.42);
      ctx.lineTo(rE * 0.44, rE * 1.46);
      ctx.lineTo(rE * 0.78, rE * 1.2);
      ctx.lineTo(rE * 0.22, -rE * 0.34);
      ctx.closePath();
      ctx.fillStyle = 'rgba(35,39,46,.1)';
      ctx.strokeStyle = '#4F5762';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(pivX, pivY, Math.max(medio * 0.012, 2.6), 0, TAU);
      ctx.fillStyle = '#94202E';
      ctx.fill();

      ctx.restore();
    }

    var t0 = performance.now();
    function frame(ahora) {
      requestAnimationFrame(frame);
      if (!visible) { t0 = ahora; return; }
      var dt = Math.min(ahora - t0, 64) / 1000;
      t0 = ahora;
      t += dt * (1 + extra);
      extra *= 0.94;
      pintar();
    }

    medir();
    // ResizeObserver, no solo resize: con el 100svh del móvil la caja
    // cambia sin que dispare resize y el búfer se estiraría en bandas.
    if (window.ResizeObserver) new ResizeObserver(medir).observe(canvas);
    else window.addEventListener('resize', medir);

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 });
    io.observe(canvas);

    if (!motionOn) return;   // un fotograma fijo: el mecanismo se ve, quieto
    requestAnimationFrame(frame);

    // El scroll le da cuerda: el tren acelera y vuelve solo a su marcha.
    window.addEventListener('wheel', function (e) {
      extra = Math.min(extra + Math.abs(e.deltaY) * 0.006, 7);
    }, { passive: true });
    window.addEventListener('touchmove', function () {
      extra = Math.min(extra + 0.5, 7);
    }, { passive: true });
  })();

  /* ---------------- El cuadrante de plazos ----------------
     CONTENIDO puro: funciona sin GSAP y con movimiento reducido. */
  (function initCuadrante() {
    var form = document.getElementById('cuadrante-form');
    if (!form) return;
    var sel = document.getElementById('c-supuesto');
    var fecha = document.getElementById('c-fecha');
    var explica = document.getElementById('c-explica');
    var notaFecha = document.getElementById('c-fecha-nota');
    var dial = document.querySelector('.cuadrante-dial');
    var arco = document.getElementById('dial-arco');
    var aguja = document.getElementById('dial-aguja');
    var num = document.getElementById('dial-num');
    var unidad = document.getElementById('dial-unidad');
    var dientes = document.getElementById('dial-dientes');
    var oEstado = document.getElementById('c-estado');
    var oInicio = document.getElementById('c-inicio');
    var oFin = document.getElementById('c-fin');
    var oRestan = document.getElementById('c-restan');

    // Corona de dientes del dial, dibujada con la misma geometría que las
    // ruedas del hero: el cuadrante es una pieza más del mecanismo.
    if (dientes) {
      dientes.appendChild(svgNodo('path', {
        d: puntosAPath(puntosRueda(48, 150, 16), 160, 160),
        fill: 'none', stroke: 'var(--canto)', 'stroke-width': 1.1, 'stroke-linejoin': 'round'
      }));
    }

    var SUPUESTOS = {
      despido: {
        nota: 'Día del cese',
        desdeElDiaSiguiente: true,
        texto: 'Veinte días hábiles desde el día siguiente al cese para presentar la papeleta de conciliación. No cuentan sábados, domingos ni festivos, y el plazo es de caducidad: no se interrumpe por reclamar por tu cuenta.'
      },
      sancion: {
        nota: 'Día en que te la notifican',
        desdeElDiaSiguiente: true,
        texto: 'Veinte días hábiles desde el día siguiente a la notificación de la sanción. Firmar el «recibí» no es aceptarla, pero sí pone en marcha el reloj.'
      },
      cantidad: {
        nota: 'Día en que se te debió pagar',
        desdeElDiaSiguiente: true,
        texto: 'Un año desde que la deuda pudo exigirse. Es prescripción, no caducidad: una reclamación fehaciente la interrumpe y el año vuelve a empezar.'
      },
      alzada: {
        nota: 'Día de la notificación',
        desdeElDiaSiguiente: true,
        texto: 'Un mes desde el día siguiente a la notificación para el recurso de alzada o de reposición. Se cuenta de fecha a fecha; si el mes de vencimiento no tiene ese día, vence el último.'
      },
      extranjeria: {
        nota: 'Día en que caducó la tarjeta',
        desdeElDiaSiguiente: true,
        texto: 'Noventa días naturales después de la caducidad para presentar la renovación fuera de plazo. Se puede, pero conviene no llegar ahí: mejor pedirla estando aún vigente.'
      },
      sucesiones: {
        nota: 'Día del fallecimiento',
        desdeElDiaSiguiente: false,
        texto: 'Seis meses desde el fallecimiento para presentar y pagar el impuesto de sucesiones. Se puede pedir una prórroga de otros seis, pero solo dentro de los cinco primeros meses.'
      }
    };

    var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    function aTexto(d) {
      return d.getDate() + ' de ' + MES[d.getMonth()] + ' de ' + d.getFullYear();
    }
    function hoyLimpio() {
      var d = new Date(); d.setHours(0, 0, 0, 0); return d;
    }
    function sumarHabiles(desde, n) {
      // `desde` cuenta como día 1 si es hábil; si no, se salta.
      var d = new Date(desde.getTime());
      var contados = 0;
      while (true) {
        var dia = d.getDay();
        if (dia !== 0 && dia !== 6) {
          contados++;
          if (contados >= n) return d;
        }
        d.setDate(d.getDate() + 1);
      }
    }
    function sumarMeses(base, n) {
      var d = new Date(base.getTime());
      var diaOriginal = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + n);
      // De fecha a fecha; si ese día no existe en el mes, el último.
      var ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(diaOriginal, ultimo));
      return d;
    }

    function calcular() {
      var op = sel.options[sel.selectedIndex];
      var clave = op.value;
      var cfg = SUPUESTOS[clave];
      var tipo = op.getAttribute('data-tipo');
      var n = parseInt(op.getAttribute('data-n'), 10);

      if (notaFecha) notaFecha.textContent = cfg.nota;
      if (explica) explica.textContent = cfg.texto;

      if (!fecha.value) {
        dial.classList.remove('apura', 'vencido');
        arco.setAttribute('stroke-dasharray', '0 100');
        aguja.setAttribute('transform', 'rotate(0 160 160)');
        num.textContent = '—';
        unidad.textContent = 'elige una fecha';
        oEstado.textContent = 'Sin fecha';
        oEstado.classList.remove('malo');
        oInicio.textContent = oFin.textContent = oRestan.textContent = '—';
        return;
      }

      var partes = fecha.value.split('-');
      var base = new Date(+partes[0], +partes[1] - 1, +partes[2]);
      base.setHours(0, 0, 0, 0);

      var inicio = new Date(base.getTime());
      if (cfg.desdeElDiaSiguiente) inicio.setDate(inicio.getDate() + 1);

      var fin;
      if (tipo === 'habiles') fin = sumarHabiles(inicio, n);
      else if (tipo === 'naturales') { fin = new Date(inicio.getTime()); fin.setDate(fin.getDate() + n - 1); }
      else fin = sumarMeses(base, n);

      var hoy = hoyLimpio();
      var DIA = 86400000;
      var restan = Math.round((fin - hoy) / DIA);
      var total = Math.max(Math.round((fin - inicio) / DIA), 1);
      var gastado = Math.min(Math.max((hoy - inicio) / DIA / total, 0), 1);

      oInicio.textContent = aTexto(inicio);
      oFin.textContent = aTexto(fin);

      dial.classList.remove('apura', 'vencido');
      oEstado.classList.remove('malo');

      if (restan < 0) {
        dial.classList.add('vencido');
        arco.setAttribute('stroke-dasharray', '100 100');
        aguja.setAttribute('transform', 'rotate(359.9 160 160)');
        num.textContent = 'VENCIDO';
        unidad.textContent = 'hace ' + Math.abs(restan) + ' días';
        oEstado.textContent = 'Fuera de plazo';
        oEstado.classList.add('malo');
        oRestan.textContent = 'nada: venció hace ' + Math.abs(restan) + ' días';
        oRestan.classList.add('malo');
      } else {
        arco.setAttribute('stroke-dasharray', (gastado * 100).toFixed(1) + ' 100');
        aguja.setAttribute('transform', 'rotate(' + (gastado * 360).toFixed(1) + ' 160 160)');
        num.textContent = restan;
        unidad.textContent = restan === 1 ? 'día natural' : 'días naturales';
        oRestan.textContent = restan === 0 ? 'hoy es el último día' : restan + ' días naturales';
        oRestan.classList.remove('malo');
        if (restan <= Math.max(Math.round(total * 0.25), 3)) {
          dial.classList.add('apura');
          oEstado.textContent = 'Apura';
          oEstado.classList.add('malo');
        } else {
          oEstado.textContent = 'En plazo';
        }
      }
    }

    // Fecha de ejemplo para que el cuadrante no arranque vacío: diez días
    // atrás, que es más o menos cuando suele sonar el teléfono.
    (function sembrar() {
      var d = hoyLimpio();
      d.setDate(d.getDate() - 10);
      fecha.value = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    })();

    sel.addEventListener('change', calcular);
    fecha.addEventListener('input', calcular);
    fecha.addEventListener('change', calcular);
    form.addEventListener('submit', function (e) { e.preventDefault(); calcular(); });
    calcular();
  })();

  /* ---------------- Las ruedas del tren de rodaje (SVG) ---------------- */
  (function initRuedasSVG() {
    document.querySelectorAll('.rueda-svg').forEach(function (svg) {
      var N = parseInt(svg.getAttribute('data-dientes'), 10) || 16;
      var g = ruedaSVG(60, 60, N, 44, {
        trazo: 'var(--laton-claro)', relleno: 'rgba(216,169,74,.1)',
        eje: 'var(--laton-claro)', grosor: 1.5, radios: N > 16 ? 6 : 4
      });
      g.setAttribute('class', 'rueda-giro');
      svg.appendChild(g);
    });
  })();

  /* ---------------- Tren de rodaje: galería anclada horizontal ---------------- */
  (function initRodaje() {
    var pin = document.getElementById('rodaje-pin');
    var pista = document.getElementById('rodaje-pista');
    var barra = document.getElementById('rodaje-barra');
    if (!pin || !pista) return;

    var giros = pista.querySelectorAll('.rueda-giro');

    function actualizarTabindex() {
      if (pin.classList.contains('pin-activo')) { pista.removeAttribute('tabindex'); return; }
      // tabindex solo cuando DE VERDAD desborda: en escritorio sin pin no
      // desborda y sería una parada de tabulación inútil.
      if (pista.scrollWidth > pista.clientWidth + 4) {
        pista.setAttribute('tabindex', '0');
        pista.setAttribute('role', 'group');
        pista.setAttribute('aria-label', 'Las cinco fases del asunto, desplazable en horizontal');
      } else {
        pista.removeAttribute('tabindex');
        pista.removeAttribute('role');
        pista.removeAttribute('aria-label');
      }
    }
    actualizarTabindex();
    window.addEventListener('resize', actualizarTabindex);

    // Sin pin (sin GSAP, con movimiento reducido o en pantallas bajas) queda
    // como carrusel manual con scroll-snap: el contenido sigue entero.
    var cabe = window.innerHeight >= 700 && window.innerWidth >= 900;
    if (!gsapListo || !motionOn || !cabe) {
      if (barra) barra.style.width = '100%';
      return;
    }

    pin.classList.add('pin-activo');
    actualizarTabindex();

    var ruedas = pista.querySelectorAll('.rueda');
    function distancia() {
      var total = 0;
      ruedas.forEach(function (e) { total += e.getBoundingClientRect().width; });
      total += (ruedas.length - 1) * 22.4;
      var margen = Math.max((window.innerWidth - Math.min(window.innerWidth - 40, 1240)) / 2, 20);
      return Math.max(total + margen * 2 - window.innerWidth, 0);
    }

    var d = distancia();
    var cabecera = document.querySelector('.cabecera');
    ScrollTrigger.create({
      trigger: pin,
      start: 'top ' + (cabecera ? cabecera.offsetHeight : 76) + 'px',
      end: function () { return '+=' + (d + window.innerHeight * 0.7); },
      pin: true,
      scrub: .6,
      invalidateOnRefresh: true,
      onRefresh: function () { d = distancia(); },
      onUpdate: function (self) {
        gsap.set(pista, { x: -d * self.progress });
        // Las ruedas giran con el recorrido; alternan sentido, como un tren.
        giros.forEach(function (g, i) {
          gsap.set(g, {
            rotation: self.progress * 360 * (i % 2 ? -1 : 1) * (1 + i * 0.18),
            svgOrigin: '60 60'
          });
        });
        if (barra) barra.style.width = (self.progress * 100).toFixed(1) + '%';
      }
    });
  })();

  /* ---------------- Cinta de plazos: marquee ligado a la rueda ----------------
     JS puro: sigue funcionando con el CDN caído. */
  (function initCinta() {
    var pista = document.getElementById('cinta-pista');
    if (!pista || !motionOn) return;
    var x = 0, base = 0.5, extra = 0, visible = true;

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0 });
    io.observe(pista);

    (function frame() {
      if (visible) {
        x -= (base + extra);
        extra *= 0.93;
        var mitad = pista.scrollWidth / 2;
        if (mitad > 0 && Math.abs(x) >= mitad) x += mitad;
        pista.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      }
      requestAnimationFrame(frame);
    })();

    window.addEventListener('wheel', function (e) {
      extra = Math.min(Math.abs(e.deltaY) * 0.035, 5);
    }, { passive: true });
  })();

  /* ---------------- Materias: complicaciones y ficha activa ---------------- */
  (function initComplicaciones() {
    var CONF = {
      laboral:        { ticks: 20, arco: 0.66, etiqueta: 'hábiles' },
      extranjeria:    { ticks: 18, arco: 0.62, etiqueta: 'naturales' },
      sucesiones:     { ticks: 12, arco: 0.5, etiqueta: 'meses' },
      administracion: { ticks: 30, arco: 0.33, etiqueta: 'días' }
    };
    document.querySelectorAll('.complicacion').forEach(function (svg) {
      var c = CONF[svg.getAttribute('data-tipo')] || CONF.laboral;

      svg.appendChild(svgNodo('circle', {
        cx: 100, cy: 100, r: 92, fill: 'none', stroke: 'var(--linea)', 'stroke-width': 1
      }));
      // Corona dentada: la misma geometría que el resto del mecanismo.
      svg.appendChild(svgNodo('path', {
        d: puntosAPath(puntosRueda(c.ticks * 2, 84, 11), 100, 100),
        fill: 'none', stroke: 'var(--canto)', 'stroke-width': 1.1, 'stroke-linejoin': 'round'
      }));
      for (var i = 0; i < c.ticks; i++) {
        var a = (i / c.ticks) * TAU - Math.PI / 2;
        svg.appendChild(svgNodo('line', {
          x1: 100 + Math.cos(a) * 66, y1: 100 + Math.sin(a) * 66,
          x2: 100 + Math.cos(a) * 58, y2: 100 + Math.sin(a) * 58,
          stroke: 'var(--canto)', 'stroke-width': 1.4
        }));
      }
      svg.appendChild(svgNodo('circle', {
        cx: 100, cy: 100, r: 72, fill: 'none', stroke: 'var(--laton-sup)',
        'stroke-width': 9, pathLength: 100,
        'stroke-dasharray': (c.arco * 100).toFixed(1) + ' 100',
        transform: 'rotate(-90 100 100)'
      }));
      var ang = c.arco * 360;
      var g = svgNodo('g', { transform: 'rotate(' + ang.toFixed(1) + ' 100 100)' });
      g.appendChild(svgNodo('path', { d: 'M97 100 L98.6 36 L100 30 L101.4 36 L103 100 Z', fill: 'var(--acero)' }));
      svg.appendChild(g);
      svg.appendChild(svgNodo('circle', { cx: 100, cy: 100, r: 6, fill: 'var(--acero)' }));
      svg.appendChild(svgNodo('circle', { cx: 100, cy: 100, r: 2.4, fill: 'url(#g-rubi)' }));
    });
  })();

  (function initPila() {
    var items = document.querySelectorAll('.pila-item');
    if (!items.length) return;
    // «La ficha cuyo centro está más cerca del centro de la pantalla», no
    // «la que interseca con umbral»: una tarjeta más alta que la ventana
    // (móvil) no cumple nunca el umbral y no se marcaría ninguna.
    var pedido = false;
    function marcar() {
      pedido = false;
      var centro = window.innerHeight * 0.45;
      var mejor = null, dist = Infinity;
      items.forEach(function (li) {
        var r = li.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var medio = r.top + Math.min(r.height, window.innerHeight) / 2;
        var d = Math.abs(medio - centro);
        if (d < dist) { dist = d; mejor = li; }
      });
      items.forEach(function (li) { li.classList.toggle('activa', li === mejor); });
    }
    function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(marcar); } }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    marcar();
  })();

  /* ---------------- Las piezas de cada persona ---------------- */
  (function initPiezas() {
    document.querySelectorAll('.pieza').forEach(function (svg) {
      var tipo = svg.getAttribute('data-pieza');
      var trazo = 'var(--laton-sup)';

      if (tipo === 'volante') {
        // Volante con su espiral: la pieza que marca el ritmo.
        svg.appendChild(svgNodo('circle', { cx: 80, cy: 80, r: 62, fill: 'none', stroke: trazo, 'stroke-width': 6 }));
        [0, 120, 240].forEach(function (a) {
          var r = a * Math.PI / 180;
          svg.appendChild(svgNodo('line', {
            x1: 80, y1: 80, x2: 80 + Math.cos(r) * 58, y2: 80 + Math.sin(r) * 58,
            stroke: trazo, 'stroke-width': 4
          }));
        });
        var d = 'M80 80';
        for (var i = 0; i <= 200; i++) {
          var th = (i / 200) * (TAU * 2.6);
          var rr = 4 + th * 2.9;
          d += ' L' + (80 + Math.cos(th) * rr).toFixed(1) + ' ' + (80 + Math.sin(th) * rr).toFixed(1);
        }
        svg.appendChild(svgNodo('path', { d: d, fill: 'none', stroke: 'var(--acero-medio)', 'stroke-width': 1.4 }));
        svg.appendChild(svgNodo('circle', { cx: 80, cy: 80, r: 5, fill: 'url(#g-rubi)' }));

      } else if (tipo === 'corona') {
        // Corona y tija: por donde se da cuerda y se ponen las cosas en hora.
        svg.appendChild(svgNodo('rect', { x: 20, y: 74, width: 52, height: 12, fill: 'none', stroke: 'var(--acero-medio)', 'stroke-width': 3 }));
        svg.appendChild(svgNodo('circle', { cx: 104, cy: 80, r: 40, fill: 'none', stroke: trazo, 'stroke-width': 5 }));
        for (var k = 0; k < 20; k++) {
          var a2 = (k / 20) * TAU;
          svg.appendChild(svgNodo('line', {
            x1: 104 + Math.cos(a2) * 40, y1: 80 + Math.sin(a2) * 40,
            x2: 104 + Math.cos(a2) * 50, y2: 80 + Math.sin(a2) * 50,
            stroke: trazo, 'stroke-width': 4, 'stroke-linecap': 'round'
          }));
        }
        svg.appendChild(svgNodo('circle', { cx: 104, cy: 80, r: 14, fill: 'none', stroke: 'var(--acero-medio)', 'stroke-width': 2.5 }));
        svg.appendChild(svgNodo('circle', { cx: 104, cy: 80, r: 5, fill: 'url(#g-rubi)' }));

      } else {
        // El trinquete: la rueda que solo avanza, con su uñeta apoyada.
        svg.appendChild(svgNodo('path', {
          d: puntosAPath(puntosTrinquete(12, 52, 18), 76, 84),
          fill: 'rgba(192,143,46,.14)', stroke: trazo, 'stroke-width': 4, 'stroke-linejoin': 'round'
        }));
        svg.appendChild(svgNodo('circle', { cx: 76, cy: 84, r: 20, fill: 'none', stroke: trazo, 'stroke-width': 3 }));
        svg.appendChild(svgNodo('path', {
          d: 'M152 14 L96 50 L108 66 L156 34 Z',
          fill: 'none', stroke: 'var(--acero-medio)', 'stroke-width': 4, 'stroke-linejoin': 'round'
        }));
        svg.appendChild(svgNodo('circle', { cx: 154, cy: 24, r: 5, fill: 'url(#g-rubi)' }));
        svg.appendChild(svgNodo('circle', { cx: 76, cy: 84, r: 5, fill: 'url(#g-rubi)' }));
      }
    });
  })();

  /* ---------------- Contadores ----------------
     Son CONTENIDO: con movimiento reducido no cuentan, pero el número
     final tiene que estar ahí igual (ya lo está en el HTML). */
  (function initContadores() {
    var nodos = document.querySelectorAll('[data-contador]');
    if (!nodos.length || !motionOn) return;
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        var fin = parseInt(el.getAttribute('data-contador'), 10);
        // Un año no se cuenta desde cero: arranca ocho atrás.
        var ini = fin > 1900 ? fin - 8 : 0;
        var t0 = performance.now(), dur = 1100;
        (function paso(ahora) {
          var p = Math.min((ahora - t0) / dur, 1);
          var suave = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(ini + (fin - ini) * suave);
          if (p < 1) requestAnimationFrame(paso);
        })(t0);
      });
    }, { threshold: .5 });
    nodos.forEach(function (n) { io.observe(n); });
  })();

  /* ---------------- Apariciones por sección (solo decorado) ---------------- */
  (function initApariciones() {
    if (!gsapListo || !motionOn) return;
    var grupos = document.querySelectorAll('.persona, .marcador-dato, .hero-datos > div, .contacto-datos li, .tabla tbody tr, .pregunta');
    if (!grupos.length) return;
    gsap.set(grupos, { opacity: 0, y: 16 });
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        gsap.to(e.target, { opacity: 1, y: 0, duration: .65, ease: 'power2.out' });
        io.unobserve(e.target);
      });
    }, { threshold: .2 });
    grupos.forEach(function (g, i) { setTimeout(function () { io.observe(g); }, i * 8); });
  })();

  /* ---------------- La escala comparativa de plazos ----------------
     Cuatro diales redondos se parecen todos entre sí: no dejan ver que
     veinte días hábiles es una nada al lado de seis meses. Esto es lo que
     ocupa su sitio en la versión sobria: las cuatro materias medidas con la
     misma vara, con la de la ficha marcada.

     Los días salen de data-dias en el <li>, no de una tabla aquí dentro: si
     el dato viviera en el script, cambiar un plazo obligaría a tocar dos
     sitios y uno se quedaría viejo. */
  (function initEscala() {
    var items = document.querySelectorAll('.pila-item[data-dias]');
    if (items.length < 2) return;

    var materias = [];
    items.forEach(function (li) {
      var h3 = li.querySelector('h3');
      materias.push({
        nombre: h3 ? h3.textContent.trim() : '',
        dias: parseInt(li.getAttribute('data-dias'), 10) || 0,
        rotulo: li.getAttribute('data-rotulo') || ''
      });
    });
    var tope = materias.reduce(function (m, x) { return Math.max(m, x.dias); }, 1);

    items.forEach(function (li, propio) {
      var caja = li.querySelector('.tarjeta-complicacion');
      if (!caja) return;

      var escala = document.createElement('div');
      escala.className = 'escala';

      var titulo = document.createElement('p');
      titulo.className = 'escala-titulo';
      titulo.textContent = 'Los cuatro plazos a la misma vara';
      escala.appendChild(titulo);

      var lista = document.createElement('ul');
      materias.forEach(function (m, i) {
        var fila = document.createElement('li');
        fila.className = 'escala-fila' + (i === propio ? ' activa' : '');

        var nombre = document.createElement('span');
        nombre.className = 'escala-nombre';
        nombre.textContent = m.nombre;

        var pista = document.createElement('span');
        pista.className = 'escala-pista';
        var barra = document.createElement('i');
        // Ancho en % sobre la pista: barra recta y sin viewBox que estirar.
        barra.style.width = Math.max((m.dias / tope) * 100, 2).toFixed(1) + '%';
        pista.appendChild(barra);

        var cifra = document.createElement('span');
        cifra.className = 'escala-cifra';
        cifra.textContent = m.rotulo;

        fila.appendChild(nombre);
        fila.appendChild(pista);
        fila.appendChild(cifra);
        lista.appendChild(fila);
      });
      escala.appendChild(lista);

      var pie = document.createElement('p');
      pie.className = 'escala-pie';
      pie.textContent = 'En días naturales aproximados, para poder compararlos: los hábiles y los meses no se miden igual.';
      escala.appendChild(pie);

      caja.appendChild(escala);
    });
  })();

  /* ---------------- El control de maqueta ----------------
     NO ES PARTE DEL SITIO. Es un mando para enseñar la misma web con dos
     densidades visuales delante de un cliente:
       · «Mecanismo»: la rueda dentada aparece en diez sitios.
       · «Sobria»:    aparece en cuatro, y donde estaba el dibujo manda el
                      dato (el número del tren, la escala de plazos).
     Al entregar a un despacho real se borra esta función, el bloque
     .maqueta del CSS, el <div id="maqueta"> y la bandera del <head>. */
  (function initMaqueta() {
    var caja = document.getElementById('maqueta');
    var bMec = document.getElementById('maqueta-mecanismo');
    var bSob = document.getElementById('maqueta-sobria');
    if (!caja || !bMec || !bSob) return;
    var CLAVE = 'ouzande-maqueta';

    caja.hidden = false;   // sin JS no se enseña: no haría nada

    function pintar(sobria, guardar) {
      raiz.classList.toggle('maqueta-sobria', sobria);
      bMec.setAttribute('aria-pressed', String(!sobria));
      bSob.setAttribute('aria-pressed', String(sobria));
      if (guardar) { try { localStorage.setItem(CLAVE, sobria ? 'sobria' : 'mecanismo'); } catch (e) {} }
      // Las tarjetas cambian de alto al cambiar de versión: sin refrescar,
      // el anclaje del tren y la pila se quedan midiendo lo de antes.
      if (gsapListo) setTimeout(function () { ScrollTrigger.refresh(); }, 60);
      window.dispatchEvent(new Event('resize'));
    }

    pintar(raiz.classList.contains('maqueta-sobria'), false);
    bMec.addEventListener('click', function () { pintar(false, true); });
    bSob.addEventListener('click', function () { pintar(true, true); });
  })();

  /* ---------------- Formulario de muestra ---------------- */
  (function initFormulario() {
    var form = document.getElementById('formulario');
    var salida = document.getElementById('formulario-respuesta');
    if (!form || !salida) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = form.querySelector('#f-nombre');
      var tel = form.querySelector('#f-tel');
      var ok = form.querySelector('#f-ok');
      if (!nombre.value.trim() || !tel.value.trim()) {
        salida.textContent = 'Faltan el nombre y el teléfono.';
        (nombre.value.trim() ? tel : nombre).focus();
        return;
      }
      if (!ok.checked) { salida.textContent = 'Falta aceptar el aviso legal.'; ok.focus(); return; }
      salida.textContent = 'Formulario de muestra: no se ha enviado nada. En una web real, aquí entraría el acuse de recibo con la fecha y la hora.';
      form.reset();
    });
  })();

  /* ---------------- Refresco tras las fuentes ---------------- */
  if (gsapListo && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTimeout(function () { ScrollTrigger.refresh(); }, 80);
    });
  }
})();
