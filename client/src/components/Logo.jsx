/** Logotyp efter förlagan i grafisk grundprofil v1.0: vattenfallet, hyreshuset,
 *  kyrkan och vattnet – enfärgad antracit mot ljust, vit negativ mot mörkt.
 *  Ordbild i Century Schoolbook. Tegel/mässing blandas aldrig in i märket. */
export function Logo({ ljus = false, className = '' }) {
  const M = ljus ? '#FFFFFF' : 'var(--foreground)';           // märkets färg
  const U = ljus ? '#21282D' : '#F2F0E9';                     // urtag (fönster, urtavla)
  const under = ljus ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)';
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg width="52" height="40" viewBox="0 0 76 56" aria-hidden="true" className="shrink-0">
        <g fill={M}>
          {/* Vattenfallet – hylla och tre kaskadband */}
          <rect x="2" y="16" width="16" height="5" rx="2.5" />
          <rect x="3.5" y="21" width="3.6" height="24" rx="1.8" />
          <rect x="8.6" y="21" width="3.6" height="19" rx="1.8" />
          <rect x="13.7" y="21" width="3.6" height="14" rx="1.8" />
          {/* Hyreshuset */}
          <rect x="22" y="7" width="17" height="39" rx="1.5" />
          {/* Kyrkan: långhus, tak, torn, spira */}
          <rect x="46" y="27" width="24" height="19" />
          <polygon points="44,27 58,17.5 72,27" />
          <rect x="47.5" y="10" width="9" height="18" />
          <polygon points="46,10 52,2 58,10" />
        </g>
        {/* Urtag i märket */}
        <circle cx="52" cy="14.5" r="2.3" fill={U} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => (
          <rect key={r + '-' + c} x={25.5 + c * 6.4} y={10.5 + r * 8.2} width="4" height="5" rx="1.2" fill={U} />
        )))}
        <rect x="25.5" y="35" width="4" height="8" rx="1.2" fill={U} />
        <rect x="31.9" y="35" width="4" height="8" rx="1.2" fill={U} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={51 + i * 5.6} y="32" width="3.4" height="8" rx="1.7" fill={U} />
        ))}
        {/* Vattnet */}
        <path d="M42 50 q4 -3.5 8 0 t8 0 t8 0 t8 0" fill="none" stroke={M} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M46 54 q4 -3.5 8 0 t8 0 t8 0" fill="none" stroke={M} strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className="block font-logo font-bold text-[19px] tracking-[0.06em]" style={{ color: M }}>FALLENS</span>
        <span className="block font-logo text-[10px] tracking-[0.22em] mt-1" style={{ color: ljus ? 'rgba(255,255,255,0.92)' : 'var(--foreground)' }}>FASTIGHETER AB</span>
        <span className="block text-[8.5px] font-sans font-semibold uppercase tracking-[0.18em] mt-1" style={{ color: under }}>Trollhättan · Vänersborg</span>
      </span>
    </span>
  );
}
