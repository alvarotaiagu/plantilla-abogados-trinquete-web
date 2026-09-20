/* Rasteriza icon.svg a los PNG de la PWA y compone og.png (1200×630) real.
   Con el servidor local levantado:
     node scripts/generate_icons.js
     TRQ_URL=http://127.0.0.1:8979/plantilla-abogados-trinquete-web/ node scripts/generate_icons.js */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.TRQ_URL || 'http://127.0.0.1:8979/plantilla-abogados-trinquete-web/';
const OUT = path.join(__dirname, '..', 'assets', 'img', 'logo');

(async () => {
  const b = await chromium.launch();

  for (const size of [96, 180, 192, 512]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(
      `<body style="margin:0;background:#EFECE4"><img src="${BASE}assets/img/logo/icon.svg" width="${size}" height="${size}"></body>`
    );
    await p.waitForTimeout(280);
    await p.screenshot({ path: path.join(OUT, `icon-${size}.png`) });
    await p.close();
  }

  // og.png: la esfera del despacho, con el trinquete y el nombre grabado.
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.setContent(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Martian+Mono:wght@500;700&family=Prata&display=swap">
    </head>
    <body style="margin:0;height:630px;background:#EFECE4;display:flex;align-items:center;gap:56px;padding:0 72px;position:relative;overflow:hidden;box-sizing:border-box">
      <div style="position:absolute;inset:0;background:radial-gradient(760px circle at 82% 46%, rgba(192,143,46,.24), transparent 64%)"></div>

      <svg width="300" height="300" viewBox="0 0 48 48" style="position:relative;flex:0 0 auto">
        <path fill="#C08F2E" fill-rule="evenodd" d="M24.00 7.40L31.27 5.15L29.97 8.51L31.20 9.04L38.73 10.17L36.10 12.64L36.98 13.65L43.27 17.93L39.83 19.01L40.18 20.31L43.99 26.89L40.43 26.38L40.18 27.69L40.76 35.28L37.77 33.27L36.98 34.35L34.20 41.43L32.39 38.33L31.20 38.96L25.63 44.13L25.34 40.55L24.00 40.60L16.73 42.85L18.03 39.49L16.80 38.96L9.27 37.83L11.90 35.36L11.02 34.35L4.73 30.07L8.17 28.99L7.82 27.69L4.01 21.11L7.57 21.62L7.82 20.31L7.24 12.72L10.23 14.73L11.02 13.65L13.80 6.57L15.61 9.67L16.80 9.04L22.37 3.87L22.66 7.45ZM32.4 24A8.4 8.4 0 1 0 15.6 24A8.4 8.4 0 1 0 32.4 24Z"/>
        <path fill="#4F5762" d="M42.6 1.7 45.8 4.9 36.2 13.3 34.2 11.3Z"/>
        <circle fill="#4F5762" cx="44.2" cy="3.3" r="2"/>
        <circle cx="24" cy="24" r="4.4" fill="#94202E"/>
      </svg>

      <div style="position:relative">
        <p style="margin:0 0 18px;font-family:'Martian Mono',monospace;font-size:15px;font-weight:500;letter-spacing:.3em;color:#7E5A0B;text-transform:uppercase">Ferrol · Laboral · Extranjería · Sucesiones</p>
        <p style="margin:0;font-family:'Prata',serif;font-size:96px;color:#23272E;line-height:1">Ouzande</p>
        <p style="margin:6px 0 0;font-family:'Martian Mono',monospace;font-size:20px;font-weight:700;letter-spacing:.34em;color:#4F5762;text-transform:uppercase">Abogados</p>
        <p style="margin:34px 0 0;font-family:'Martian Mono',monospace;font-size:22px;color:#23272E;line-height:1.5">Lo primero que se pierde<br>es el plazo.</p>
        <p style="margin:26px 0 0;font-family:'Martian Mono',monospace;font-size:13px;letter-spacing:.14em;color:#4F5762">Sitio de demostración · despacho ficticio</p>
      </div>
    </body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'og.png') });
  await b.close();
  console.log('iconos y og.png listos en', OUT);
})();
