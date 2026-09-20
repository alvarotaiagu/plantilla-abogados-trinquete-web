/* Contraste WCAG de la paleta de «Trinquete», calculado antes de cerrar el CSS
   y no a ojo.   node scripts/contraste.js

   Regla de la casa (PLIEGO §5): ningún texto se apaga con `opacity`. Cada
   nivel de jerarquía tiene su token de color y su ratio medido. El latón es
   el acento de la plantilla y aquí se comprueba dos veces: el latón «de
   superficie» (dientes, arcos, filetes) puede ser claro, pero el latón «de
   texto» tiene que llegar a 4,5:1 sobre cada fondo donde se use. */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function relLum([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function ratio(hex1, hex2) {
  const l1 = relLum(hexToRgb(hex1));
  const l2 = relLum(hexToRgb(hex2));
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

const paleta = {
  // Claro: la esfera
  esfera:      '#EFECE4', // fondo general
  panel:       '#E4E0D5', // franjas y paneles
  placa:       '#F8F6F1', // tarjetas, formulario, campos
  linea:       '#CDC7B7', // filetes (no texto)
  canto:       '#B3AA95', // bordes visibles (no texto)
  acero:       '#23272E', // texto principal
  aceroMedio:  '#4F5762', // texto secundario
  laton:       '#7E5A0B', // latón de TEXTO (cifras, etiquetas)
  latonSup:    '#C08F2E', // latón de SUPERFICIE (dientes, arcos)
  rubi:        '#94202E', // estado «vencido»
  marcador:    '#616977', // placeholder de los campos

  // Oscuro: la caja, vista por el fondo
  caja:        '#14171C',
  cajaAlta:    '#1D2129',
  cajaLinea:   '#2E343E',
  hueso:       '#F4F1EA', // texto principal sobre caja
  niebla:      '#A9B1BD', // texto secundario sobre caja
  latonClaro:  '#D8A94A', // latón sobre caja
};

const parejas = [
  ['acero', 'esfera', 'texto principal'],
  ['acero', 'panel', 'texto principal en franja'],
  ['acero', 'placa', 'texto principal en tarjeta'],
  ['aceroMedio', 'esfera', 'texto secundario'],
  ['aceroMedio', 'panel', 'texto secundario en franja'],
  ['aceroMedio', 'placa', 'texto secundario en tarjeta'],
  ['laton', 'esfera', 'acento como texto'],
  ['laton', 'panel', 'acento como texto en franja'],
  ['laton', 'placa', 'acento como texto en tarjeta'],
  ['rubi', 'esfera', 'estado vencido'],
  ['rubi', 'placa', 'estado vencido en tarjeta'],
  ['marcador', 'placa', 'marcador de campo'],
  ['esfera', 'acero', 'texto invertido (botón)'],
  ['esfera', 'laton', 'texto sobre latón de texto'],
  ['acero', 'latonSup', 'texto sobre latón de superficie'],
  ['hueso', 'caja', 'texto principal sobre caja'],
  ['hueso', 'cajaAlta', 'texto principal sobre caja alta'],
  ['niebla', 'caja', 'texto secundario sobre caja'],
  ['niebla', 'cajaAlta', 'texto secundario sobre caja alta'],
  ['latonClaro', 'caja', 'acento sobre caja'],
  ['latonClaro', 'cajaAlta', 'acento sobre caja alta'],
  ['caja', 'latonClaro', 'texto sobre latón claro'],
];

let fallos = 0;
console.log('Paleta «Trinquete» — contraste WCAG (texto normal: 4,5:1)\n');
for (const [a, b, uso] of parejas) {
  const r = ratio(paleta[a], paleta[b]);
  const ok = r >= 4.5;
  if (!ok) fallos++;
  console.log(
    `${ok ? 'OK ' : '!! '} ${r.toFixed(2).padStart(5)}:1  ${a} sobre ${b}`.padEnd(46) + `— ${uso}`
  );
}

// Filetes y bordes: no son texto, pero deben distinguirse (3:1 no es
// obligatorio para decoración; se imprime para tenerlo a la vista).
console.log('\nFiletes y bordes (decoración, sin umbral obligatorio):');
for (const [a, b] of [['linea', 'esfera'], ['canto', 'esfera'], ['canto', 'placa'], ['cajaLinea', 'caja']]) {
  console.log(`   ${ratio(paleta[a], paleta[b]).toFixed(2).padStart(5)}:1  ${a} sobre ${b}`);
}

console.log(fallos ? `\n${fallos} pareja(s) por debajo de 4,5:1.` : '\nTodas las parejas de texto pasan AA.');
process.exit(fallos ? 1 : 0);
