import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** FAQ-accordion: ett svar öppet åt gången, djuplänkbart via hash (§4.7.2). */
export function Accordion({ poster }) {
  const { hash } = useLocation();
  const [oppet, setOppet] = useState(null);
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      if (poster.some((p) => p.id === id)) setOppet(id);
    }
  }, [hash, poster]);
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-card">
      {poster.map((p) => {
        const ar = oppet === p.id;
        return (
          <div key={p.id} id={p.id}>
            <h3>
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold hover:text-primary transition-colors"
                aria-expanded={ar}
                onClick={() => {
                  setOppet(ar ? null : p.id);
                  if (!ar) window.history.replaceState(null, '', `#${p.id}`);
                }}
              >
                {p.fraga}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`shrink-0 transition-transform duration-200 ${ar ? 'rotate-180' : ''}`} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </h3>
            {ar && <div className="px-5 pb-5 -mt-1 text-muted-ink leading-relaxed whitespace-pre-line">{p.svar}</div>}
          </div>
        );
      })}
    </div>
  );
}
