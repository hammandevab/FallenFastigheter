import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, PageSpinner, EmptyState, Badge, StatusBadge, Lightbox } from '../../components/ui.jsx';
import { datum, datumTid, statusNamn, kategoriNamn } from '../../lib/format.js';

const STATUSVAL = ['ny', 'pagaende', 'vantar', 'atgardad', 'stangd', 'avvisad'];
const KALLA = { publik: 'Publikt formulär', portal: 'Hyresgästportalen', admin: 'Registrerat av Fallens' };
const bildLank = (arendeId, bilaga, liten) => `/api/v1/filer/arendebild/${arendeId}/${bilaga._id}${liten ? '?liten=1' : ''}`;

export default function AdminArendeDetalj() {
  const { id } = useParams();
  const { visa } = useToast();
  const { data, laddar, laddaOm } = useAsync(() => admin.arende(id), [id]);
  const underlag = useAsync(() => admin.arendeUnderlag(), []);
  const [nyStatus, setNyStatus] = useState('');
  const [statusMeddelande, setStatusMeddelande] = useState('');
  const [svar, setSvar] = useState('');
  const [svarTyp, setSvarTyp] = useState('svar');
  const [stor, setStor] = useState(null);
  const [jobbar, setJobbar] = useState('');
  const a = data?.arende;
  usePageMeta({ title: `Ärende #${a?.arendenummer || ''} – Förvaltning | Fallens Fastigheter`, noindex: true });

  if (laddar) return <PageSpinner />;
  if (!a) return <EmptyState rubrik="Ärendet hittades inte" cta="Till felanmälningar" ctaTill="/admin/felanmalningar" />;
  const handelser = data.handelser || [];

  const uppdatera = async (body, meddelande) => {
    try { await admin.uppdateraArende(a._id, body); visa(meddelande); laddaOm(); }
    catch (e) { visa(e.message, 'fel'); }
  };

  const bytStatus = async (e) => {
    e.preventDefault();
    if (!nyStatus) return;
    setJobbar('status');
    await uppdatera({ status: nyStatus, statusMeddelande }, 'Status uppdaterad – anmälaren är meddelad.');
    setNyStatus(''); setStatusMeddelande('');
    setJobbar('');
  };

  const skickaSvar = async (e) => {
    e.preventDefault();
    if (!svar.trim()) return;
    setJobbar('svar');
    try {
      await admin.arendeHandelse(a._id, { typ: svarTyp, text: svar });
      visa(svarTyp === 'svar' ? 'Svaret är skickat till anmälaren.' : 'Intern notering sparad.');
      setSvar(''); laddaOm();
    } catch (err) { visa(err.message, 'fel'); }
    finally { setJobbar(''); }
  };

  return (
    <>
      <nav className="mb-4 text-sm text-muted-ink"><Link to="/admin/felanmalningar" className="hover:text-primary">← Felanmälningar</Link></nav>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h2">Ärende #{a.arendenummer}</h1>
        {a.akut && <Badge color="akut">Akut</Badge>}
        <StatusBadge status={a.status} namn={statusNamn(a.status)} />
        <span className="text-sm text-muted-ink">{KALLA[a.kalla] || a.kalla} · {datum(a.createdAt)}</span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="h3">Anmälan</h2>
            <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-[15px]">
              {[['Namn', a.namn], ['Telefon', a.telefon], ['E-post', a.epost], ['Adress', a.adress], ['Lägenhetsnr', a.lagenhetsnummer || '–'], ['Kategori', kategoriNamn(a.kategori)]].map(([r, v]) => (
                <div key={r} className="flex justify-between gap-3"><dt className="text-muted-ink">{r}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 whitespace-pre-line border-t border-line pt-4 leading-relaxed">{a.beskrivning}</p>
            {a.bilagor?.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {a.bilagor.map((b) => (
                  <li key={b._id}>
                    <button className="block h-24 w-24 overflow-hidden rounded border border-line" onClick={() => setStor(bildLank(a._id, b))}>
                      <img src={bildLank(a._id, b, true)} alt="Ärendebild" className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="h3">Svara eller notera</h2>
            <form onSubmit={skickaSvar} className="mt-3 space-y-3">
              <div className="flex gap-2" role="radiogroup" aria-label="Typ av meddelande">
                {[['svar', 'Svar till anmälaren'], ['intern_notering', 'Intern notering']].map(([val, n]) => (
                  <button key={val} type="button" onClick={() => setSvarTyp(val)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${svarTyp === val ? 'bg-primary text-white' : 'bg-muted text-muted-ink hover:text-ink'}`}
                    aria-pressed={svarTyp === val}>{n}</button>
                ))}
              </div>
              <textarea className="field-textarea" aria-label="Meddelande" value={svar} onChange={(e) => setSvar(e.target.value)}
                placeholder={svarTyp === 'svar' ? 'Skriv ett svar – skickas via e-post och syns i portalen …' : 'Intern notering – syns bara för admin …'} />
              <button className="btn-primary btn-sm" disabled={jobbar === 'svar'}>{svarTyp === 'svar' ? 'Skicka svar' : 'Spara notering'}</button>
            </form>
          </section>

          <section aria-labelledby="ad-tidslinje">
            <h2 id="ad-tidslinje" className="h3 mb-4">Tidslinje</h2>
            <ol className="relative space-y-4 border-l-2 border-line pl-6">
              {handelser.map((h) => (
                <li key={h._id} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ${h.typ === 'status' ? 'bg-primary' : h.typ === 'svar' ? 'bg-accent' : h.typ === 'intern_notering' ? 'bg-muted-ink' : 'bg-status-ny'}`} aria-hidden="true" />
                  <p className="text-sm text-muted-ink">
                    {datumTid(h.createdAt)} · {h.skapadAvNamn || 'Anmälaren'}
                    {h.typ === 'intern_notering' && <Badge color="neutral" className="ml-2">Intern</Badge>}
                    {h.typ === 'komplettering' && <Badge color="ny" className="ml-2">Komplettering</Badge>}
                  </p>
                  {h.typ === 'status' && h.nyStatus && <p className="mt-0.5 font-semibold">Status: {statusNamn(h.nyStatus)}</p>}
                  {h.text && <p className="mt-1 whitespace-pre-line leading-relaxed">{h.text}</p>}
                  {h.bilder?.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {h.bilder.map((b, i) => (
                        <li key={i}>
                          <button className="block h-20 w-20 overflow-hidden rounded border border-line" onClick={() => setStor(`/api/v1/filer/handelsebild/${h._id}/${i}`)}>
                            <img src={`/api/v1/filer/handelsebild/${h._id}/${i}?liten=1`} alt="Bild" className="h-full w-full object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="h3">Byt status</h2>
            <form onSubmit={bytStatus} className="mt-3 space-y-3">
              <select className="field-input" aria-label="Ny status" value={nyStatus} onChange={(e) => setNyStatus(e.target.value)}>
                <option value="">Välj ny status …</option>
                {STATUSVAL.filter((s) => s !== a.status).map((s) => <option key={s} value={s}>{statusNamn(s)}</option>)}
              </select>
              <textarea className="field-textarea !min-h-[5rem]" aria-label="Meddelande till anmälaren"
                placeholder="Valfritt meddelande som följer med statusbeskedet …"
                value={statusMeddelande} onChange={(e) => setStatusMeddelande(e.target.value)} />
              <button className="btn-primary btn-sm w-full" disabled={!nyStatus || jobbar === 'status'}>Uppdatera status</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="h3">Kopplingar</h2>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="field-label">Objekt</span>
                <select className="field-input" value={a.unit?._id || ''} onChange={(e) => uppdatera({ unit: e.target.value || null }, 'Objektkoppling uppdaterad.')}>
                  <option value="">Ingen koppling</option>
                  {(underlag.data?.units || []).map((u) => <option key={u._id} value={u._id}>{u.adress} {u.beteckning ? `(${u.beteckning})` : ''}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Hyresgäst</span>
                <select className="field-input" value={a.tenant?._id || ''} onChange={(e) => uppdatera({ tenant: e.target.value || null }, 'Hyresgästkoppling uppdaterad.')}>
                  <option value="">Ingen koppling</option>
                  {(underlag.data?.tenants || []).map((t) => <option key={t._id} value={t._id}>{t.namn}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Tilldelad handläggare</span>
                <select className="field-input" value={a.tilldelad?._id || ''} onChange={(e) => uppdatera({ tilldelad: e.target.value || null }, 'Tilldelning uppdaterad.')}>
                  <option value="">Ingen</option>
                  {(underlag.data?.admins || []).map((u) => <option key={u._id} value={u._id}>{u.namn}</option>)}
                </select>
              </label>
              {a.property?.namn && <p className="text-sm text-muted-ink">Fastighet: <Link className="text-primary hover:underline" to={`/admin/fastigheter/${a.property._id}`}>{a.property.namn}</Link></p>}
            </div>
          </section>
        </aside>
      </div>
      <Lightbox bild={stor} onStang={() => setStor(null)} />
    </>
  );
}
