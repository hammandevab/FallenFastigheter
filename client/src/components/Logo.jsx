/** Logotyp efter förlagan i grafisk grundprofil v1.0 – som en sammanhängande scen:
 *  vattenfallet mynnar i samma vatten som huset och kyrkan står vid, hyllan griper
 *  in över husets hörn och kyrktaket möter husfasaden. Enfärgad antracit mot ljust,
 *  vit negativ mot mörkt. Tegel/mässing blandas aldrig in i märket. */
export function Logo({ ljus = false, className = '' }) {
  const M = ljus ? '#FFFFFF' : 'var(--foreground)';
  const U = ljus ? '#21282D' : '#F2F0E9';
  const under = ljus ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)';
  const vag = (y) => `M-2 ${y} q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0`;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="54" height="40" viewBox="0 0 78 56" aria-hidden="true" className="shrink-0">
        <g fill={M}>
          {/* Hyreshuset – står i vattnet */}
          <rect x="21" y="6" width="18" height="41" rx="1.5" />
          {/* Kyrkan – lutar mot husets högra kant */}
          <rect x="38" y="27" width="27" height="20" />
          <polygon points="36,27.5 51.5,17.5 67,27.5" />
          <rect x="42" y="9" width="9.5" height="19" />
          <polygon points="40.5,9.5 46.7,1.5 53,9.5" />
        </g>
        {/* Urtag: urtavla, husfönster, kyrkfönster */}
        <circle cx="46.7" cy="14.5" r="2.5" fill={U} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => (
          <rect key={'o' + r + c} x={24.6 + c * 6.6} y={9.5 + r * 7.6} width="4.2" height="5" rx="1.2" fill={U} />
        )))}
        {[0, 1].map((r) => [0, 1].map((c) => (
          <rect key={'n' + r + c} x={24.6 + c * 6.6} y={33 + r * 7.4} width="4.2" height="5" rx="1.2" fill={U} />
        )))}
        {[0, 1, 2].map((i) => (
          <rect key={'k' + i} x={53.5 + i * 5.4} y="33" width="3.4" height="8.5" rx="1.7" fill={U} />
        ))}
        {/* Vattenfallet – hyllan griper över huskanten, fallen når vattnet */}
        <g fill={M}>
          <rect x="1" y="15" width="21.5" height="5" rx="2.5" />
          <rect x="3.2" y="20" width="3.9" height="27" rx="1.9" />
          <rect x="8.8" y="20" width="3.9" height="27" rx="1.9" />
          <rect x="14.4" y="20" width="3.9" height="27" rx="1.9" />
        </g>
        {/* Vattnet – genomgående under hela scenen */}
        <path d={vag(47.5)} fill="none" stroke={M} strokeWidth="2.4" strokeLinecap="round" />
        <path d={vag(51.5)} fill="none" stroke={M} strokeWidth="2.4" strokeLinecap="round" />
        <path d={vag(55)} fill="none" stroke={M} strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      </svg>
      <span className="leading-none">
        <span className="block font-logo font-bold text-[19px] tracking-[0.06em]" style={{ color: M }}>FALLENS</span>
        <span className="block font-logo text-[10px] tracking-[0.22em] mt-1" style={{ color: ljus ? 'rgba(255,255,255,0.92)' : 'var(--foreground)' }}>FASTIGHETER AB</span>
        <span className="block text-[8.5px] font-sans font-semibold uppercase tracking-[0.18em] mt-1" style={{ color: under }}>Trollhättan · Vänersborg</span>
      </span>
    </span>
  );
}
