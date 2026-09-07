/** Logotyp enligt grafisk grundprofil v1.0: enfärgad antracit mot ljus bakgrund,
 *  vit negativ mot kanalblå/mörka ytor. Tegel och mässing blandas aldrig in i märket.
 *  Ordbilden sätts i Century Schoolbook (systemstack). */
export function Logo({ ljus = false, className = '' }) {
  const mark = ljus ? '#FFFFFF' : 'var(--foreground)';
  const fonster = ljus ? 'rgba(53,89,107,0.9)' : 'rgba(242,240,233,0.92)';
  const under = ljus ? 'rgba(255,255,255,0.65)' : 'var(--muted-foreground)';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="7" fill={mark} opacity={ljus ? 0.95 : 1} />
        {[
          [7, 7], [13.5, 7], [20, 7],
          [7, 13.5], [13.5, 13.5], [20, 13.5],
          [7, 20], [13.5, 20], [20, 20],
        ].map(([x, y]) => <rect key={x + '-' + y} x={x} y={y} width="5" height="5" rx="1.2" fill={fonster} />)}
      </svg>
      <span className="leading-none">
        <span className="block font-logo font-bold text-[16px] tracking-[0.02em]" style={{ color: ljus ? '#FFFFFF' : 'var(--foreground)' }}>
          FALLENS FASTIGHETER
        </span>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mt-1" style={{ color: under }}>Trollhättan · Vänersborg</span>
      </span>
    </span>
  );
}
