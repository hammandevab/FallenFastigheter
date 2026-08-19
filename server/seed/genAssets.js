/**
 * Genererar varumärkesassets: fasadillustrationer i "tända fönster"-motivet
 * (Vi ser möjligheterna = några fönster lyser), hero/og-bilder och enkla demo-PDF:er.
 * Körs en gång i utvecklingsmiljön; resultaten committas som seed-assets.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'assets');
const CLIENT_IMG = path.resolve(__dirname, '../../client/public/images');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CLIENT_IMG, { recursive: true });

const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function stad({ w, h, seed, lage }) {
  const rnd = mulberry(seed);
  const dusk = lage === 'skymning';
  const sky = dusk
    ? `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#101F1B"/><stop offset="0.55" stop-color="#1F4038"/>
         <stop offset="0.85" stop-color="#3A5A4E"/><stop offset="1" stop-color="#C9A87C"/></linearGradient>`
    : `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#EDF0EC"/><stop offset="0.7" stop-color="#E4E2D6"/>
         <stop offset="1" stop-color="#D9CDB4"/></linearGradient>`;
  const husfarger = dusk ? ['#16302A', '#1B3730', '#22423A', '#2A4C42'] : ['#2E4C42', '#3B5A4E', '#8A9187', '#B7A98A', '#54685E'];
  const fonsterAv = dusk ? '#0D1B17' : '#22302B';
  const fonsterPa = dusk ? '#F0CE96' : '#F3E4C4';
  const mark = dusk ? '#0C1815' : '#4A5A50';

  let x = -40; const hus = [];
  while (x < w + 40) {
    const bw = 200 + rnd() * 220;
    const bh = h * (0.24 + rnd() * 0.3);
    const farg = husfarger[Math.floor(rnd() * husfarger.length)];
    const cols = Math.max(3, Math.floor(bw / 64));
    const rows = Math.max(2, Math.min(6, Math.floor(bh / 74)));
    let fonster = '';
    for (let c = 0; c < cols; c++) for (let rrow = 0; rrow < rows; rrow++) {
      const fx = x + 16 + c * ((bw - 32) / cols) + 4;
      const fy = h - bh + 22 + rrow * ((bh - 44) / rows) + 4;
      const fw = (bw - 32) / cols - 10, fh = (bh - 44) / rows - 12;
      const lyser = rnd() < (dusk ? 0.32 : 0.14);
      fonster += `<rect x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="3" fill="${lyser ? fonsterPa : fonsterAv}" opacity="${lyser ? 0.95 : 0.55}"/>`;
    }
    hus.push(`<g><rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="6" fill="${farg}"/>${fonster}</g>`);
    x += bw + 18 + rnd() * 40;
  }
  const trad = Array.from({ length: 6 }, () => {
    const tx = rnd() * w; const trr = 26 + rnd() * 26;
    return `<circle cx="${tx.toFixed(0)}" cy="${(h - 12).toFixed(0)}" r="${trr.toFixed(0)}" fill="${dusk ? '#132622' : '#3E5A4C'}" opacity="0.9"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${sky}</defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    ${dusk ? `<circle cx="${w * 0.78}" cy="${h * 0.22}" r="46" fill="#F0CE96" opacity="0.85"/>` : `<circle cx="${w * 0.2}" cy="${h * 0.18}" r="70" fill="#FAF9F7" opacity="0.7"/>`}
    ${hus.join('')}
    ${trad}
    <rect y="${h - 14}" width="${w}" height="14" fill="${mark}"/>
  </svg>`;
}

function gard({ w, h, efter }) {
  const gras = efter ? '#4E7A5A' : '#8C8F86';
  const himmel = efter ? '#EAF0E8' : '#E3E4DE';
  const detaljer = efter
    ? `<circle cx="${w * 0.22}" cy="${h * 0.62}" r="52" fill="#3E6A4C"/><circle cx="${w * 0.3}" cy="${h * 0.58}" r="40" fill="#4E7A5A"/>
       <rect x="${w * 0.55}" y="${h * 0.72}" width="120" height="16" rx="6" fill="#C9A87C"/><rect x="${w * 0.57}" y="${h * 0.72 + 16}" width="10" height="26" fill="#8A6B45"/><rect x="${w * 0.55 + 100}" y="${h * 0.72 + 16}" width="10" height="26" fill="#8A6B45"/>
       <circle cx="${w * 0.78}" cy="${h * 0.6}" r="34" fill="#3E6A4C"/>
       <rect x="${w * 0.4}" y="${h * 0.8}" width="${w * 0.24}" height="10" rx="5" fill="#D9CDB4"/>`
    : `<rect x="${w * 0.2}" y="${h * 0.68}" width="90" height="60" rx="4" fill="#6E7069"/>
       <rect x="${w * 0.62}" y="${h * 0.74}" width="140" height="34" rx="4" fill="#7A7C74"/>
       <line x1="${w * 0.1}" y1="${h * 0.9}" x2="${w * 0.9}" y2="${h * 0.9}" stroke="#6E7069" stroke-width="4"/>`;
  const hus = `<rect x="0" y="${h * 0.16}" width="${w}" height="${h * 0.34}" fill="${efter ? '#2E4C42' : '#565C55'}"/>` +
    Array.from({ length: 9 }, (_, i) => `<rect x="${30 + i * (w - 60) / 9}" y="${h * 0.22}" width="${(w - 60) / 9 - 18}" height="${h * 0.2}" rx="4" fill="${efter && i % 3 === 1 ? '#F0CE96' : '#22302B'}" opacity="0.6"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${himmel}"/>${hus}
    <rect y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="${gras}"/>${detaljer}</svg>`;
}

/** Minimal men giltig en-sidig PDF med Helvetica (WinAnsi för å/ä/ö). */
function enkelPdf(rubrik, rader) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let stream = 'BT /F1 18 Tf 56 780 Td (' + esc(rubrik) + ') Tj ET\n';
  stream += 'BT /F1 11 Tf 56 750 Td 16 TL\n';
  for (const rad of rader) stream += '(' + esc(rad) + ') Tj T*\n';
  stream += 'ET';
  const sb = Buffer.from(stream, 'latin1');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${sb.length} >>\nstream\n${sb.toString('latin1')}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

const jpg = (svg, fil, w) => sharp(Buffer.from(svg)).resize(w).jpeg({ quality: 84, mozjpeg: true }).toFile(fil);

const jobb = [
  jpg(stad({ w: 1920, h: 1080, seed: 7, lage: 'skymning' }), path.join(CLIENT_IMG, 'hero.jpg'), 1920),
  jpg(stad({ w: 1200, h: 630, seed: 11, lage: 'skymning' }), path.join(CLIENT_IMG, 'og.jpg'), 1200),
  jpg(stad({ w: 1200, h: 800, seed: 21, lage: 'dag' }), path.join(OUT, 'fastighet-1.jpg'), 1200),
  jpg(stad({ w: 1200, h: 800, seed: 33, lage: 'dag' }), path.join(OUT, 'fastighet-2.jpg'), 1200),
  jpg(stad({ w: 1200, h: 800, seed: 47, lage: 'skymning' }), path.join(OUT, 'fastighet-3.jpg'), 1200),
  jpg(stad({ w: 1200, h: 800, seed: 61, lage: 'dag' }), path.join(OUT, 'objekt-1.jpg'), 1200),
  jpg(stad({ w: 1200, h: 800, seed: 77, lage: 'dag' }), path.join(OUT, 'objekt-2.jpg'), 1200),
  jpg(stad({ w: 1200, h: 800, seed: 91, lage: 'skymning' }), path.join(OUT, 'objekt-3.jpg'), 1200),
  jpg(gard({ w: 1200, h: 800, efter: false }), path.join(OUT, 'fore.jpg'), 1200),
  jpg(gard({ w: 1200, h: 800, efter: true }), path.join(OUT, 'efter.jpg'), 1200),
];

fs.writeFileSync(path.join(OUT, 'blankett-uppsagning.pdf'), enkelPdf('Uppsägning av hyresavtal', [
  'Fallens Fastigheter – blankett', '',
  'Härmed säger jag upp mitt hyresavtal för nedanstående objekt.',
  'Uppsägningstiden är normalt tre kalendermånader räknat från', 'månadsskiftet efter att uppsägningen kommit oss tillhanda.', '',
  'Namn: ______________________________', 'Adress: ____________________________',
  'Lägenhetsnummer/lokal: _____________', 'Telefon: ___________________________',
  'E-post: ____________________________', 'Önskat avflyttningsdatum: __________', '',
  'Ort och datum: _____________________', 'Underskrift: _______________________', '',
  'Skicka blanketten till Fallens Fastigheter eller lämna den', 'till oss personligen. Vi bekräftar alltid mottagen uppsägning.',
]));
fs.writeFileSync(path.join(OUT, 'blankett-autogiro.pdf'), enkelPdf('Anmälan om autogiro', [
  'Fallens Fastigheter – blankett', '',
  'Jag vill att min hyra dras automatiskt via autogiro.', '',
  'Namn: ______________________________', 'Personnummer: ______________________',
  'Adress: ____________________________', 'Bank: ______________________________',
  'Clearingnummer: ____________________', 'Kontonummer: _______________________', '',
  'Ort och datum: _____________________', 'Underskrift: _______________________', '',
  'Genom att skriva under godkänner du villkoren för autogiro.',
]));
fs.writeFileSync(path.join(OUT, 'stadinstruktion.pdf'), enkelPdf('Städinstruktion vid utflyttning', [
  'En noggrann flyttstädning krävs vid avflyttning. Checklista:', '',
  'Kök: rengör ugn, spis, fläkt och filter, kyl och frys (avfrostade),',
  'skåp och lådor in- och utvändigt, diskbänk och kakel.',
  'Badrum: avkalka kakel, rengör golvbrunn, WC, handfat och spegel.',
  'Alla rum: fönsterputs (alla sidor), golv, lister, garderober,',
  'element, dörrar och karmar. Balkong/förråd: sopa och töm.', '',
  'Besiktning sker efter städning. Kontakta oss vid frågor –', 'vi hjälper gärna till med råd inför flytten.',
]));
fs.writeFileSync(path.join(OUT, 'avtal-demo.pdf'), enkelPdf('Hyresavtal (demo)', [
  'Detta är ett demodokument på hyresgästnivå i dokumentbiblioteket.',
  'I skarp drift laddar Fallens upp riktiga avtal här – de syns endast', 'för den enskilda hyresgästen på Mina sidor.',
]));

await Promise.all(jobb);
console.log('Assets genererade i', OUT, 'och', CLIENT_IMG);
