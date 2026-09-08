/** Heroscen enligt grafisk grundprofil: ljus kanalblå yta, hus med fönster i
 *  benvit/tegel/mässing, mässingssol och vågor. Ritad som SVG – knivskarp i alla
 *  storlekar. Husen är förankrade i högerkant (xMaxYMax slice) så mobilbeskärningen
 *  alltid visar staden, inte tom gradient. */
const BENVIT = '#F2F0E9';
const TEGEL = '#AF4A38';
const MASSING = '#AC9450'; // koppar enligt spec: C25/M35/Y65/K10
const FASADER = ['#A9C6D4', '#6E96AB', '#5F889D', '#BCD4DF'];

const HUS = [
  { x: 830, w: 118, h: 470, c: 0, tak: false },
  { x: 972, w: 96, h: 300, c: 1, tak: false },
  { x: 1088, w: 128, h: 400, c: 2, tak: true },
  { x: 1238, w: 104, h: 330, c: 3, tak: false },
  { x: 1362, w: 122, h: 520, c: 1, tak: true },
  { x: 1502, w: 110, h: 380, c: 0, tak: false },
];

function fonsterFarg(bi, ix, iy) {
  const k = (bi * 37 + ix * 11 + iy * 17) % 100;
  if (k < 62) return BENVIT;
  if (k < 82) return null; // släckt – fasadens färg
  if (k < 93) return TEGEL;
  return MASSING;
}

function vag(y, amp, fas) {
  const seg = [];
  for (let x = -40; x <= 1640; x += 80) {
    const mitt = x + 40;
    const rikt = ((x / 80 + fas) % 2 === 0 ? -1 : 1) * amp;
    seg.push(`Q ${mitt} ${y + rikt} ${x + 80} ${y}`);
  }
  return `M -40 ${y} ` + seg.join(' ');
}

export function HeroScen() {
  const MARK = 872; // marklinje
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMax slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FB6C9" />
          <stop offset="1" stopColor="#7EA8BD" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#himmel)" />
      <circle cx="1552" cy="224" r="46" fill={MASSING} className="hidden sm:block" />

      {HUS.map((h, bi) => {
        const topp = MARK - h.h;
        const cell = 18; const gap = 12;
        const cols = Math.floor((h.w - 20) / (cell + gap));
        const rows = Math.floor((h.h - 26) / (cell + gap));
        const padX = (h.w - (cols * cell + (cols - 1) * gap)) / 2;
        const fonster = [];
        for (let iy = 0; iy < rows; iy++) {
          for (let ix = 0; ix < cols; ix++) {
            const f = fonsterFarg(bi, ix, iy);
            if (!f) continue;
            fonster.push(
              <rect key={ix + '-' + iy} x={h.x + padX + ix * (cell + gap)} y={topp + 14 + iy * (cell + gap)}
                width={cell} height={cell} rx="3.5" fill={f} />
            );
          }
        }
        return (
          <g key={bi}>
            {h.tak && <polygon points={`${h.x},${topp} ${h.x + h.w / 2},${topp - 34} ${h.x + h.w},${topp}`} fill={FASADER[h.c]} />}
            <rect x={h.x} y={topp} width={h.w} height={h.h} fill={FASADER[h.c]} />
            {fonster}
          </g>
        );
      })}

      <path d={vag(852, 10, 1)} fill="none" stroke={BENVIT} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      <path d={vag(876, 9, 0)} fill="none" stroke={BENVIT} strokeWidth="7" strokeLinecap="round" />
      <path d={vag(896, 8, 1)} fill="none" stroke={BENVIT} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
