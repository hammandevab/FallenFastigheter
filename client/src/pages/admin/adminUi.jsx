import { useEffect, useState } from 'react';
import { Spinner } from '../../components/ui.jsx';

/** KPI-kort (§9.5). */
export function KpiCard({ etikett, varde, under, varning = false }) {
  return (
    <div className={`card p-5 ${varning ? 'border-destructive/40' : ''}`}>
      <p className="text-sm font-medium text-muted-ink">{etikett}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${varning ? 'text-destructive' : 'text-ink'}`}>{varde}</p>
      {under && <p className="mt-0.5 text-sm text-muted-ink">{under}</p>}
    </div>
  );
}

/** Adminlistans standardmönster: sök + filter + tabell + radklick + paginering >50 (§6.13). */
export function DataTable({ kolumner, rader, onRad, tom = 'Inga rader att visa', laddar = false, sidstorlek = 50 }) {
  const [sida, setSida] = useState(0);
  useEffect(() => { setSida(0); }, [rader?.length]);
  const sidor = Math.max(1, Math.ceil((rader?.length || 0) / sidstorlek));
  const visade = (rader || []).slice(sida * sidstorlek, (sida + 1) * sidstorlek);
  return (
    <div className="card overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <table className="table-admin">
          <thead><tr>{kolumner.map((k) => <th key={k.rubrik} scope="col" className={k.klass}>{k.rubrik}</th>)}</tr></thead>
          <tbody>
            {laddar ? (
              <tr><td colSpan={kolumner.length} className="py-10 text-center"><Spinner className="text-primary" /></td></tr>
            ) : visade.length === 0 ? (
              <tr><td colSpan={kolumner.length} className="py-10 text-center text-muted-ink">{tom}</td></tr>
            ) : visade.map((rad) => (
              <tr key={rad._id} tabIndex={onRad ? 0 : undefined}
                onClick={() => onRad?.(rad)}
                onKeyDown={(e) => { if (onRad && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRad(rad); } }}>
                {kolumner.map((k) => <td key={k.rubrik} className={k.klass}>{k.rendera(rad)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sidor > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
          <span className="text-muted-ink">Sida {sida + 1} av {sidor} · {rader.length} rader</span>
          <span className="flex gap-2">
            <button className="btn-outline btn-sm" disabled={sida === 0} onClick={() => setSida(sida - 1)}>Föregående</button>
            <button className="btn-outline btn-sm" disabled={sida >= sidor - 1} onClick={() => setSida(sida + 1)}>Nästa</button>
          </span>
        </div>
      )}
    </div>
  );
}

/** Sidopanel/dialog för formulär i admin. */
export function Panel({ oppen, rubrik, onStang, children, bred = false }) {
  useEffect(() => {
    if (!oppen) return;
    const esc = (e) => e.key === 'Escape' && onStang();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [oppen, onStang]);
  if (!oppen) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={rubrik}>
      <div className="absolute inset-0 bg-ink/45" onClick={onStang} />
      <div className={`absolute inset-y-0 right-0 flex w-full ${bred ? 'max-w-3xl' : 'max-w-xl'} flex-col bg-bg shadow-lift`}>
        <div className="flex items-center justify-between border-b border-line bg-card px-5 py-3.5">
          <h2 className="h3">{rubrik}</h2>
          <button className="btn-outline btn-sm" onClick={onStang}>Stäng</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function AdminSida({ rubrik, beskrivning, knapp, children }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="h2">{rubrik}</h1>
          {beskrivning && <p className="mt-1 text-muted-ink">{beskrivning}</p>}
        </div>
        {knapp}
      </div>
      {children}
    </>
  );
}

export function FilterRad({ children }) {
  return <div className="mb-5 flex flex-wrap items-end gap-3">{children}</div>;
}

export function FilterSelect({ label, varde, onAndra, alternativ }) {
  const id = `flt-${label}`;
  return (
    <div>
      <label htmlFor={id} className="field-label !mb-1">{label}</label>
      <select id={id} className="field-input !h-10 min-w-[9rem]" value={varde} onChange={(e) => onAndra(e.target.value)}>
        {alternativ.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
      </select>
    </div>
  );
}

/** Publicerad-badge som återkommer i listorna. */
export function PubBadge({ pub }) {
  return <span className={`badge ${pub ? 'bg-status-atgardad/12 text-status-atgardad' : 'bg-muted text-muted-ink'}`}>{pub ? 'Publicerad' : 'Ej publicerad'}</span>;
}

/** Bildgalleri med uppladdning/borttagning för admin-detaljer. */
export function BildRedigering({ bilder = [], onLaddaUpp, onTaBort, etikett = 'Bilder' }) {
  const [laddar, setLaddar] = useState(false);
  return (
    <div>
      <p className="field-label">{etikett}</p>
      <ul className="flex flex-wrap gap-3">
        {bilder.map((b, i) => (
          <li key={i} className="relative">
            <img src={'/uploads/' + (b.liten || b.fil)} alt={`Bild ${i + 1}`} className="h-24 w-32 rounded border border-line object-cover" />
            <button type="button" aria-label={`Ta bort bild ${i + 1}`}
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-ink text-xs font-bold text-white shadow"
              onClick={() => onTaBort(i)}>✕</button>
          </li>
        ))}
        <li>
          <label className={`flex h-24 w-32 cursor-pointer items-center justify-center rounded border-2 border-dashed border-line text-sm font-semibold text-muted-ink hover:border-primary hover:text-primary ${laddar ? 'opacity-50' : ''}`}>
            {laddar ? <Spinner /> : '+ Lägg till'}
            <input type="file" accept="image/*" multiple className="sr-only" disabled={laddar}
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                setLaddar(true);
                try { await onLaddaUpp(e.target.files); } finally { setLaddar(false); e.target.value = ''; }
              }} />
          </label>
        </li>
      </ul>
    </div>
  );
}
