import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export const Spinner = ({ className = '' }) => (
  <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent align-middle ${className}`} role="status" aria-label="Laddar" />
);

export const PageSpinner = () => (
  <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>
);

export function Badge({ children, color = 'neutral', className = '' }) {
  const stilar = {
    neutral: 'bg-muted text-muted-ink',
    ort: 'bg-accent-soft text-[#7A5C2E]',
    primary: 'bg-primary/10 text-primary',
    akut: 'bg-destructive text-white',
    ny: 'bg-status-ny/10 text-status-ny',
    pagaende: 'bg-status-pagaende/10 text-status-pagaende',
    vantar: 'bg-status-vantar/10 text-status-vantar',
    atgardad: 'bg-status-atgardad/12 text-status-atgardad',
    stangd: 'bg-status-stangd/10 text-status-stangd',
    avvisad: 'bg-destructive/10 text-destructive',
  };
  return <span className={`badge ${stilar[color] || stilar.neutral} ${className}`}>{children}</span>;
}

export const StatusBadge = ({ status, namn }) => <Badge color={status}>{namn}</Badge>;

/** Tomtillstånd (§9.6 – bärande mönster): rubrik, förklaring, relevant CTA. Aldrig tom yta. */
export function EmptyState({ rubrik, text, cta, ctaTill, onCta, ikon = true }) {
  return (
    <div className="card px-6 py-12 text-center">
      {ikon && (
        <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="var(--muted)" />
          {[[7, 7], [13.5, 7], [20, 7], [7, 13.5], [20, 13.5], [7, 20], [13.5, 20]].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1.2" fill="var(--border)" />
          ))}
          <rect x="13.5" y="13.5" width="5" height="5" rx="1.2" fill="var(--accent)" />
        </svg>
      )}
      <h3 className="h3">{rubrik}</h3>
      {text && <p className="mt-2 text-muted-ink max-w-md mx-auto">{text}</p>}
      {cta && ctaTill && <Link to={ctaTill} className="btn-primary mt-6">{cta}</Link>}
      {cta && onCta && <button onClick={onCta} className="btn-primary mt-6">{cta}</button>}
    </div>
  );
}

export function SectionHeading({ overline, rubrik, ingress, center = false }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''} mb-10 md:mb-12`}>
      {overline && (
        <p className="overline-badge mb-3">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect x="0" y="0" width="4" height="4" rx="1" fill="var(--border)" /><rect x="5" y="0" width="4" height="4" rx="1" fill="var(--border)" /><rect x="10" y="0" width="4" height="4" rx="1" fill="var(--accent)" />
            <rect x="0" y="5" width="4" height="4" rx="1" fill="var(--border)" /><rect x="5" y="5" width="4" height="4" rx="1" fill="var(--accent)" /><rect x="10" y="5" width="4" height="4" rx="1" fill="var(--border)" />
            <rect x="0" y="10" width="4" height="4" rx="1" fill="var(--accent)" /><rect x="5" y="10" width="4" height="4" rx="1" fill="var(--border)" /><rect x="10" y="10" width="4" height="4" rx="1" fill="var(--border)" />
          </svg>
          {overline}
        </p>
      )}
      <h2 className="h2">{rubrik}</h2>
      {ingress && <p className="ingress mt-3">{ingress}</p>}
    </div>
  );
}

/** Bekräftelsedialog för destruktiva åtgärder (§6 – alla destruktiva åtgärder bekräftas). */
export function ConfirmDialog({ oppen, rubrik, text, bekraftaText = 'Ta bort', onBekrafta, onAvbryt, farlig = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!oppen) return;
    ref.current?.focus();
    const esc = (e) => e.key === 'Escape' && onAvbryt();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [oppen, onAvbryt]);
  if (!oppen) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={rubrik}>
      <div className="absolute inset-0 bg-ink/50" onClick={onAvbryt} />
      <div className="card relative w-full max-w-md p-6">
        <h3 className="h3">{rubrik}</h3>
        <p className="mt-2 text-muted-ink">{text}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={ref} className="btn-outline btn-sm" onClick={onAvbryt}>Avbryt</button>
          <button className={`${farlig ? 'btn-destructive' : 'btn-primary'} btn-sm`} onClick={onBekrafta}>{bekraftaText}</button>
        </div>
      </div>
    </div>
  );
}

export function Lightbox({ bild, onStang }) {
  useEffect(() => {
    if (!bild) return;
    const esc = (e) => e.key === 'Escape' && onStang();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [bild, onStang]);
  if (!bild) return null;
  return (
    <div className="fixed inset-0 z-[95] bg-ink/80 flex items-center justify-center p-4" onClick={onStang} role="dialog" aria-modal="true" aria-label="Bildvisning">
      <img src={bild} alt="" className="max-h-[90vh] max-w-full rounded-xl shadow-lift" />
      <button className="absolute top-4 right-4 btn-secondary btn-sm" onClick={onStang}>Stäng</button>
    </div>
  );
}

export function Tabs({ flikar, aktiv, onValj }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line" role="tablist">
      {flikar.map((f) => (
        <button key={f.id} role="tab" aria-selected={aktiv === f.id} onClick={() => onValj(f.id)}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t border-b-2 -mb-px transition-colors ${aktiv === f.id ? 'border-primary text-primary' : 'border-transparent text-muted-ink hover:text-ink'}`}>
          {f.namn}{typeof f.antal === 'number' ? ` (${f.antal})` : ''}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ varde, onAndra, placeholder = 'Sök …', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <input type="search" className="field-input pl-9" placeholder={placeholder} value={varde} onChange={(e) => onAndra(e.target.value)} aria-label={placeholder} />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
    </div>
  );
}

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, laddar: true, fel: null });
  const [v, setV] = useState(0);
  useEffect(() => {
    let aktiv = true;
    setState((s) => ({ ...s, laddar: true, fel: null }));
    fn().then((r) => aktiv && setState({ data: r.data, laddar: false, fel: null }))
      .catch((e) => aktiv && setState({ data: null, laddar: false, fel: e.message }));
    return () => { aktiv = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, v]);
  return { ...state, laddaOm: () => setV((x) => x + 1) };
}
