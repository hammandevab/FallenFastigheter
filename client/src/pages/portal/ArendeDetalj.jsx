import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { portal } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, PageSpinner, EmptyState, StatusBadge, Badge, Lightbox } from '../../components/ui.jsx';
import { FileUpload, SubmitButton } from '../../components/form.jsx';
import { datum, datumTid, statusNamn, kategoriNamn } from '../../lib/format.js';

const bildLank = (arendeId, bilaga, liten) => `/api/v1/filer/arendebild/${arendeId}/${bilaga._id}${liten ? '?liten=1' : ''}`;

export default function PortalArendeDetalj() {
  const { id } = useParams();
  usePageMeta({ title: 'Ärende – Mina sidor | Fallens Fastigheter', noindex: true });
  const { visa } = useToast();
  const { data, laddar, fel, laddaOm } = useAsync(() => portal.arende(id), [id]);
  const [text, setText] = useState('');
  const [filer, setFiler] = useState([]);
  const [skickar, setSkickar] = useState(false);
  const [stor, setStor] = useState(null);

  if (laddar) return <PageSpinner />;
  if (fel || !data) return <EmptyState rubrik="Ärendet hittades inte" text="Det kan ha tagits bort eller tillhöra ett annat konto." cta="Till mina ärenden" ctaTill="/mina-sidor/felanmalningar" />;
  const { arende: a, handelser = [] } = data;
  const oppet = !['stangd', 'avvisad'].includes(a.status);

  const komplettera = async (e) => {
    e.preventDefault();
    if (!text.trim() && filer.length === 0) return;
    setSkickar(true);
    try {
      const fd = new FormData();
      fd.append('text', text);
      filer.forEach((f) => fd.append('bilder', f));
      await portal.komplettera(a._id, fd);
      setText(''); setFiler([]);
      visa('Din komplettering är skickad.');
      laddaOm();
    } catch (err) { visa(err.message, 'fel'); }
    finally { setSkickar(false); }
  };

  return (
    <>
      <nav className="mb-5 text-sm text-muted-ink"><Link to="/mina-sidor/felanmalningar" className="hover:text-primary">← Mina felanmälningar</Link></nav>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h1">Ärende #{a.arendenummer}</h1>
        {a.akut && <Badge color="akut">Akut</Badge>}
        <StatusBadge status={a.status} namn={statusNamn(a.status)} />
      </div>
      <p className="mt-2 text-muted-ink">{datum(a.createdAt)} · {kategoriNamn(a.kategori)} · {a.unit?.adress || a.adress}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section className="card p-6">
            <h2 className="h3">Din anmälan</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{a.beskrivning}</p>
            {a.bilagor?.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {a.bilagor.map((b) => (
                  <li key={b._id}>
                    <button className="block h-24 w-24 overflow-hidden rounded border border-line" onClick={() => setStor(bildLank(a._id, b))}>
                      <img src={bildLank(a._id, b, true)} alt="Bifogad bild" className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="tidslinje">
            <h2 id="tidslinje" className="h3 mb-4">Vad som hänt</h2>
            <ol className="relative space-y-4 border-l-2 border-line pl-6">
              {handelser.map((h) => (
                <li key={h._id} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ${h.typ === 'status' ? 'bg-primary' : h.typ === 'svar' ? 'bg-accent' : 'bg-muted-ink'}`} aria-hidden="true" />
                  <p className="text-sm text-muted-ink">{datumTid(h.createdAt)} · {h.skapadAvNamn || 'Fallens Fastigheter'}</p>
                  {h.typ === 'status' && h.nyStatus && <p className="mt-0.5 font-semibold">Status: {statusNamn(h.nyStatus)}</p>}
                  {h.text && <p className="mt-1 whitespace-pre-line leading-relaxed">{h.text}</p>}
                  {h.bilder?.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {h.bilder.map((b, i) => (
                        <li key={i}>
                          <button className="block h-20 w-20 overflow-hidden rounded border border-line" onClick={() => setStor(`/api/v1/filer/handelsebild/${h._id}/${i}`)}>
                            <img src={`/api/v1/filer/handelsebild/${h._id}/${i}?liten=1`} alt="Bild i händelse" className="h-full w-full object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {oppet ? (
            <form onSubmit={komplettera} className="card p-6">
              <h2 className="h3">Komplettera ärendet</h2>
              <p className="mt-1 text-sm text-muted-ink">Skriv till oss eller lägg till fler bilder – allt hamnar i ärendet.</p>
              <textarea className="field-textarea mt-4" aria-label="Meddelande till Fallens" value={text} onChange={(e) => setText(e.target.value)} placeholder="Skriv ditt meddelande …" />
              <div className="mt-4"><FileUpload filer={filer} sattFiler={setFiler} max={5} label="Lägg till bilder" /></div>
              <div className="mt-4"><SubmitButton laddar={skickar}>Skicka komplettering</SubmitButton></div>
            </form>
          ) : (
            <p className="card bg-muted/60 p-5 text-muted-ink">Ärendet är {statusNamn(a.status).toLowerCase()} och kan inte längre kompletteras. Uppstår felet igen – gör en ny felanmälan.</p>
          )}
        </div>

        <aside>
          <div className="card sticky top-24 p-6">
            <h2 className="h3">Ärendeinformation</h2>
            <dl className="mt-4 space-y-2.5 text-[15px]">
              {[['Ärendenummer', `#${a.arendenummer}`], ['Status', statusNamn(a.status)], ['Kategori', kategoriNamn(a.kategori)], ['Skapat', datum(a.createdAt)], ['Adress', a.unit?.adress || a.adress], a.property?.namn && ['Fastighet', a.property.namn]].filter(Boolean).map(([r, v]) => (
                <div key={r} className="flex justify-between gap-4"><dt className="text-muted-ink">{r}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
      <Lightbox bild={stor} onStang={() => setStor(null)} />
    </>
  );
}
