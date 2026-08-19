/** Logotyp med "tända fönster"-märket – vi ser möjligheterna. */
export function Logo({ ljus = false, className = '' }) {
  const text = ljus ? '#FFFFFF' : 'var(--foreground)';
  const under = ljus ? 'rgba(255,255,255,0.65)' : 'var(--muted-foreground)';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="7" fill={ljus ? '#FFFFFF' : 'var(--primary)'} opacity={ljus ? 0.12 : 1} />
        {ljus && <rect width="32" height="32" rx="7" fill="none" stroke="rgba(255,255,255,0.4)" />}
        {[
          [7, 7], [13.5, 7], [20, 7],
          [7, 13.5], [20, 13.5],
          [7, 20], [13.5, 20],
        ].map(([x, y]) => <rect key={x + '-' + y} x={x} y={y} width="5" height="5" rx="1.2" fill={ljus ? 'rgba(255,255,255,0.45)' : '#3A5A4E'} />)}
        <rect x="13.5" y="13.5" width="5" height="5" rx="1.2" fill="#EFCE96" />
        <rect x="20" y="20" width="5" height="5" rx="1.2" fill="#EFCE96" />
      </svg>
      <span className="leading-none">
        <span className="block font-bold text-[17px] tracking-tight" style={{ color: text }}>Fallens Fastigheter</span>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mt-0.5" style={{ color: under }}>Trollhättan · Vänersborg</span>
      </span>
    </span>
  );
}
