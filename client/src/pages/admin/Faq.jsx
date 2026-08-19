import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { ConfirmDialog, EmptyState, useAsync } from '../../components/ui.jsx';
import { Field, inputProps, textareaProps, useFormFel, validera, SubmitButton } from '../../components/form.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, Panel, PubBadge } from './adminUi.jsx';

const TOM_FRAGA = { category: '', fraga: '', svar: '', ordning: 0, publicerad: true };

export default function Faq() {
  usePageMeta('Vanliga frågor – Admin');
  const [katPanel, setKatPanel] = useState(null); // { kategori | null }
  const [katForm, setKatForm] = useState({ namn: '', ordning: 0 });
  const [fragaPanel, setFragaPanel] = useState(null); // { fraga | null }
  const [fragaForm, setFragaForm] = useState(TOM_FRAGA);
  const [sparar, setSparar] = useState(false);
  const [taBort, setTaBort] = useState(null); // { slag: 'kategori'|'fraga', post }
  const { fel, sattFel, rensa } = useFormFel();
  const { visa } = useToast();

  const { data, laddar, laddaOm } = useAsync(() => admin.faq().then((r) => r.data), []);
  const kategorier = data?.kategorier || [];
  const fragor = data?.fragor || [];

  const oppnaKat = (k) => { setKatForm(k ? { namn: k.namn, ordning: k.ordning } : { namn: '', ordning: kategorier.length }); rensa(); setKatPanel({ kategori: k }); };
  const oppnaFraga = (f, forvaldKategori) => {
    setFragaForm(f
      ? { category: f.category, fraga: f.fraga, svar: f.svar, ordning: f.ordning, publicerad: f.publicerad }
      : { ...TOM_FRAGA, category: forvaldKategori || kategorier[0]?._id || '', ordning: fragor.filter((x) => x.category === (forvaldKategori || kategorier[0]?._id)).length });
    rensa();
    setFragaPanel({ fraga: f });
  };

  const sparaKat = async (e) => {
    e.preventDefault();
    const nyaFel = validera(katForm, { namn: 'Ange kategorinamn' });
    if (Object.keys(nyaFel).length) return sattFel(nyaFel);
    setSparar(true);
    try {
      const body = { namn: katForm.namn, ordning: Number(katForm.ordning) || 0 };
      if (katPanel.kategori) await admin.uppdateraFaqKategori(katPanel.kategori._id, body);
      else await admin.skapaFaqKategori(body);
      visa(katPanel.kategori ? 'Kategorin uppdaterades' : 'Kategorin skapades');
      setKatPanel(null);
      laddaOm();
    } catch (err) { sattFel({ _rot: err.message }); }
    finally { setSparar(false); }
  };

  const sparaFraga = async (e) => {
    e.preventDefault();
    const nyaFel = validera(fragaForm, { category: 'Välj kategori', fraga: 'Skriv frågan', svar: 'Skriv svaret' });
    if (Object.keys(nyaFel).length) return sattFel(nyaFel);
    setSparar(true);
    try {
      const body = { ...fragaForm, ordning: Number(fragaForm.ordning) || 0 };
      if (fragaPanel.fraga) await admin.uppdateraFraga(fragaPanel.fraga._id, body);
      else await admin.skapaFraga(body);
      visa(fragaPanel.fraga ? 'Frågan uppdaterades' : 'Frågan skapades');
      setFragaPanel(null);
      laddaOm();
    } catch (err) { sattFel({ _rot: err.message }); }
    finally { setSparar(false); }
  };

  const bekraftaTaBort = async () => {
    try {
      if (taBort.slag === 'kategori') await admin.taBortFaqKategori(taBort.post._id);
      else await admin.taBortFraga(taBort.post._id);
      visa(taBort.slag === 'kategori' ? 'Kategorin togs bort' : 'Frågan togs bort');
      setTaBort(null); setKatPanel(null); setFragaPanel(null);
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); setTaBort(null); }
  };

  return (
    <AdminSida
      rubrik="Vanliga frågor"
      beskrivning="Frågor och svar som visas på publika FAQ-sidan, grupperade per kategori. Ordningen styr visningsföljden."
      knapp={(
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => oppnaKat(null)}>Ny kategori</button>
          <button type="button" className="btn-primary" onClick={() => oppnaFraga(null)} disabled={!kategorier.length}>Ny fråga</button>
        </div>
      )}
    >
      {laddar ? (
        <div className="card p-8 text-center text-muted-ink">Laddar …</div>
      ) : !kategorier.length ? (
        <EmptyState rubrik="Inga kategorier ännu" text="Skapa en första kategori, t.ex. Hyra & betalning, och lägg sedan frågor under den." cta="Ny kategori" onCta={() => oppnaKat(null)} />
      ) : (
        <div className="space-y-6">
          {kategorier.map((k) => {
            const iKategori = fragor.filter((f) => f.category === k._id);
            return (
              <section key={k._id} className="card overflow-hidden">
                <header className="flex items-center gap-3 px-5 py-3.5 bg-muted/60 border-b border-line">
                  <h2 className="font-semibold text-ink">{k.namn}</h2>
                  <span className="text-xs text-muted-ink">{iKategori.length} frågor · ordning {k.ordning}</span>
                  <div className="ml-auto flex gap-2">
                    <button type="button" className="text-sm text-primary font-medium hover:underline" onClick={() => oppnaFraga(null, k._id)}>Lägg till fråga</button>
                    <button type="button" className="text-sm text-muted-ink hover:text-ink" onClick={() => oppnaKat(k)}>Redigera</button>
                  </div>
                </header>
                {iKategori.length ? (
                  <ul className="divide-y divide-line/70">
                    {iKategori.map((f) => (
                      <li key={f._id}>
                        <button type="button" onClick={() => oppnaFraga(f)} className="w-full text-left px-5 py-3.5 hover:bg-muted/50 transition-colors flex items-start gap-3">
                          <span className="text-xs text-muted-ink mt-1 w-6 shrink-0">{f.ordning}</span>
                          <span className="min-w-0">
                            <span className="block font-medium text-ink">{f.fraga}</span>
                            <span className="block text-sm text-muted-ink truncate">{f.svar}</span>
                          </span>
                          <span className="ml-auto shrink-0"><PubBadge pub={f.publicerad} /></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-4 text-sm text-muted-ink">Inga frågor i kategorin ännu.</p>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Panel oppen={!!katPanel} rubrik={katPanel?.kategori ? 'Redigera kategori' : 'Ny kategori'} onStang={() => setKatPanel(null)}>
        {katPanel && (
          <form onSubmit={sparaKat} noValidate className="space-y-5">
            {fel._rot && <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fel._rot}</p>}
            <Field id="k-namn" label="Namn" obligatorisk fel={fel.namn}>
              <input {...inputProps('k-namn', fel.namn)} value={katForm.namn} onChange={(e) => setKatForm((f) => ({ ...f, namn: e.target.value }))} maxLength={100} />
            </Field>
            <Field id="k-ordning" label="Ordning" hjalp="Lägre tal visas först.">
              <input {...inputProps('k-ordning')} type="number" value={katForm.ordning} onChange={(e) => setKatForm((f) => ({ ...f, ordning: e.target.value }))} />
            </Field>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
              <SubmitButton laddar={sparar}>Spara</SubmitButton>
              <button type="button" className="btn-secondary" onClick={() => setKatPanel(null)}>Avbryt</button>
              {katPanel.kategori && (
                <button type="button" className="btn-secondary text-destructive ml-auto" onClick={() => setTaBort({ slag: 'kategori', post: katPanel.kategori })}>Ta bort</button>
              )}
            </div>
          </form>
        )}
      </Panel>

      <Panel oppen={!!fragaPanel} rubrik={fragaPanel?.fraga ? 'Redigera fråga' : 'Ny fråga'} onStang={() => setFragaPanel(null)} bred>
        {fragaPanel && (
          <form onSubmit={sparaFraga} noValidate className="space-y-5">
            {fel._rot && <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fel._rot}</p>}
            <Field id="f-kat" label="Kategori" obligatorisk fel={fel.category}>
              <select id="f-kat" className={`field-input ${fel.category ? 'field-fel' : ''}`} value={fragaForm.category} onChange={(e) => setFragaForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Välj kategori …</option>
                {kategorier.map((k) => <option key={k._id} value={k._id}>{k.namn}</option>)}
              </select>
            </Field>
            <Field id="f-fraga" label="Fråga" obligatorisk fel={fel.fraga}>
              <input {...inputProps('f-fraga', fel.fraga)} value={fragaForm.fraga} onChange={(e) => setFragaForm((f) => ({ ...f, fraga: e.target.value }))} maxLength={300} />
            </Field>
            <Field id="f-svar" label="Svar" obligatorisk fel={fel.svar}>
              <textarea {...textareaProps('f-svar', fel.svar)} rows={6} value={fragaForm.svar} onChange={(e) => setFragaForm((f) => ({ ...f, svar: e.target.value }))} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="f-ordning" label="Ordning" hjalp="Lägre tal visas först inom kategorin.">
                <input {...inputProps('f-ordning')} type="number" value={fragaForm.ordning} onChange={(e) => setFragaForm((f) => ({ ...f, ordning: e.target.value }))} />
              </Field>
              <Field id="f-pub" label="Publicering">
                <label className="flex items-center gap-2.5 text-sm text-ink h-11">
                  <input type="checkbox" className="h-4 w-4 rounded border-line text-primary focus:ring-primary" checked={fragaForm.publicerad} onChange={(e) => setFragaForm((f) => ({ ...f, publicerad: e.target.checked }))} />
                  Visa på publika FAQ-sidan
                </label>
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
              <SubmitButton laddar={sparar}>Spara</SubmitButton>
              <button type="button" className="btn-secondary" onClick={() => setFragaPanel(null)}>Avbryt</button>
              {fragaPanel.fraga && (
                <button type="button" className="btn-secondary text-destructive ml-auto" onClick={() => setTaBort({ slag: 'fraga', post: fragaPanel.fraga })}>Ta bort</button>
              )}
            </div>
          </form>
        )}
      </Panel>

      <ConfirmDialog
        oppen={!!taBort}
        rubrik={taBort?.slag === 'kategori' ? 'Ta bort kategori?' : 'Ta bort fråga?'}
        text={taBort?.slag === 'kategori'
          ? 'Kategorin tas bort. Kategorier som innehåller frågor kan inte tas bort – flytta eller ta bort frågorna först.'
          : 'Frågan tas bort permanent från FAQ-sidan.'}
        onBekrafta={bekraftaTaBort}
        onAvbryt={() => setTaBort(null)}
      />
    </AdminSida>
  );
}
