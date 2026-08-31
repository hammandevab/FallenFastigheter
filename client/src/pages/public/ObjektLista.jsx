import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pub } from '../../lib/api.js';
import { PageHeader } from '../../components/layout.jsx';
import { EmptyState, PageSpinner } from '../../components/ui.jsx';
import { ObjectCard } from '../../components/cards.jsx';
import { LeadForm } from '../../components/LeadForm.jsx';

/** Delad listsida för bostäder/lokaler: filter i URL (delbara), sortering, tomtillstånd (§4.2–4.3). */
export function ObjektLista({ typ, rubrik, ingress, filterFalt, tomRubrik, tomText, intresseRubrik, intresseKnapp, meddelandeLabel }) {
  const [sp, setSp] = useSearchParams();
  const filter = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
  const [data, setData] = useState(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    let aktiv = true;
    setLaddar(true);
    pub.objekt({ typ, ...filter })
      .then((r) => aktiv && setData(r.data || []))
      .catch(() => aktiv && setData([]))
      .finally(() => aktiv && setLaddar(false));
    return () => { aktiv = false; };
  }, [typ, sp]); // eslint-disable-line react-hooks/exhaustive-deps

  const satt = (falt) => (e) => {
    const nya = new URLSearchParams(sp);
    if (e.target.value) nya.set(falt, e.target.value); else nya.delete(falt);
    setSp(nya, { replace: true });
  };
  const harFilter = [...sp.keys()].some((k) => k !== 'sortera');
  const objekt = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader rubrik={rubrik} ingress={ingress} bred />
      <div className="container-site section !pt-8">
        {/* Filterrad */}
        <div className="card p-4 md:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {filterFalt.map(([falt, label, alternativ]) => (
              <div key={falt}>
                <label htmlFor={`f-${falt}`} className="field-label">{label}</label>
                {alternativ ? (
                  <select id={`f-${falt}`} className="field-input" value={sp.get(falt) || ''} onChange={satt(falt)}>
                    <option value="">Alla</option>
                    {alternativ.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                  </select>
                ) : falt === 'tilltrade' ? (
                  <input id={`f-${falt}`} type="date" className="field-input" value={sp.get(falt) || ''} onChange={satt(falt)} />
                ) : (
                  <input id={`f-${falt}`} type="number" min="0" className="field-input" placeholder={label} value={sp.get(falt) || ''} onChange={satt(falt)} />
                )}
              </div>
            ))}
            <div>
              <label htmlFor="f-sortera" className="field-label">Sortera</label>
              <select id="f-sortera" className="field-input" value={sp.get('sortera') || 'senast'} onChange={satt('sortera')}>
                <option value="senast">Senast inlagd</option>
                <option value="hyra">Lägst hyra</option>
                <option value="tilltrade">Tidigast tillträde</option>
              </select>
            </div>
          </div>
          {harFilter && (
            <button className="btn-ghost btn-sm mt-3" onClick={() => setSp(new URLSearchParams(), { replace: true })}>
              ✕ Rensa filter
            </button>
          )}
        </div>

        {/* Resultat */}
        <div className="mt-8">
          {laddar ? <PageSpinner /> : objekt.length === 0 ? (
            <EmptyState rubrik={harFilter ? 'Inga träffar med de valda filtren' : tomRubrik}
              text={harFilter ? 'Prova att bredda din sökning – eller anmäl intresse så hör vi av oss.' : tomText}
              cta={harFilter ? 'Rensa filter' : undefined}
              onCta={harFilter ? () => setSp(new URLSearchParams(), { replace: true }) : undefined} />
          ) : (
            <>
              <p className="mb-5 text-muted-ink" aria-live="polite">{objekt.length} {objekt.length === 1 ? 'ledigt objekt' : 'lediga objekt'}</p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {objekt.map((o) => <ObjectCard key={o._id} objekt={o} />)}
              </div>
            </>
          )}
        </div>

        {/* Intresseformulär */}
        <div className="mt-16 max-w-2xl scroll-mt-24" id="intresse">
          <h2 className="h2 mb-2">{intresseRubrik}</h2>
          <p className="ingress mb-6">Beskriv vad du letar efter så återkommer vi när något som passar blir ledigt.</p>
          <LeadForm typ={typ} knapp={intresseKnapp} meddelandeLabel={meddelandeLabel} />
        </div>
      </div>
    </>
  );
}
