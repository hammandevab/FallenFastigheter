import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { datum } from '../../lib/format.js';
import { Badge, ConfirmDialog, useAsync } from '../../components/ui.jsx';
import { Field, inputProps, textareaProps, useFormFel, validera, SubmitButton } from '../../components/form.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, BildRedigering, DataTable, Panel, PubBadge } from './adminUi.jsx';

const TOM = { titel: '', property: '', status: 'pagaende', identifierade: '', gjorde: '', resultat: '', datum: '', publicerad: false };

export default function Utveckling() {
  usePageMeta('Utveckling – Admin');
  const [panel, setPanel] = useState(null); // { projekt | null }
  const [form, setForm] = useState(TOM);
  const [sparar, setSparar] = useState(false);
  const [taBort, setTaBort] = useState(null);
  const { fel, sattFel, rensa } = useFormFel();
  const { visa } = useToast();

  const { data, laddar, laddaOm } = useAsync(() => Promise.all([
    admin.utveckling().then((r) => r.data),
    admin.fastigheter().then((r) => r.data),
  ]), []);
  const [projekt, fastigheter] = data || [[], []];

  const oppnaNy = () => { setForm(TOM); rensa(); setPanel({ projekt: null }); };
  const oppnaRedigera = (p) => {
    setForm({
      titel: p.titel, property: p.property?._id || '', status: p.status,
      identifierade: p.identifierade, gjorde: p.gjorde, resultat: p.resultat || '',
      datum: p.datum ? String(p.datum).slice(0, 10) : '', publicerad: !!p.publicerad,
    });
    rensa();
    setPanel({ projekt: p });
  };

  const spara = async (e) => {
    e.preventDefault();
    const nyaFel = validera(form, { titel: 'Ange titel', property: 'Välj fastighet', identifierade: 'Fyll i "Vad vi identifierade"', gjorde: 'Fyll i "Vad vi gjorde"' });
    if (Object.keys(nyaFel).length) return sattFel(nyaFel);
    setSparar(true);
    try {
      const body = { ...form, datum: form.datum || null };
      if (panel.projekt) {
        const r = await admin.uppdateraProjekt(panel.projekt._id, body);
        setPanel({ projekt: r.data });
        visa('Projektet uppdaterades');
      } else {
        const r = await admin.skapaProjekt(body);
        setPanel({ projekt: r.data });
        visa('Projektet skapades – ladda nu upp före- och efterbilder nedan');
      }
      laddaOm();
    } catch (err) { sattFel({ _rot: err.message }); }
    finally { setSparar(false); }
  };

  const laddaUppBilder = (sida) => async (filer) => {
    const fd = new FormData();
    [...filer].forEach((f) => fd.append('bilder', f));
    try {
      const r = await admin.projektBilder(panel.projekt._id, sida, fd);
      setPanel({ projekt: r.data });
      visa('Bilderna laddades upp');
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
  };

  const taBortBild = (sida) => async (index) => {
    try {
      const r = await admin.taBortProjektBild(panel.projekt._id, sida, index);
      setPanel({ projekt: r.data });
      visa('Bilden togs bort');
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
  };

  const bekraftaTaBort = async () => {
    try {
      await admin.taBortProjekt(taBort._id);
      visa('Projektet togs bort');
      setTaBort(null); setPanel(null);
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
  };

  const satt = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AdminSida
      rubrik="Utveckling"
      beskrivning="Utvecklingsprojekt som visar hur ni ser möjligheterna – vad ni identifierade, vad ni gjorde och resultatet, med före- och efterbilder."
      knapp={<button type="button" className="btn-primary" onClick={oppnaNy}>Nytt projekt</button>}
    >
      <DataTable
        laddar={laddar}
        rader={projekt || []}
        onRad={oppnaRedigera}
        tom="Inga projekt ännu. Skapa det första med knappen ovan."
        kolumner={[
          { rubrik: 'Titel', rendera: (p) => <span className="font-medium text-ink">{p.titel}</span> },
          { rubrik: 'Fastighet', rendera: (p) => <span className="text-muted-ink">{p.property?.namn || '–'}</span> },
          { rubrik: 'Status', rendera: (p) => <Badge color={p.status === 'genomfort' ? 'atgardad' : 'pagaende'}>{p.status === 'genomfort' ? 'Genomfört' : 'Pågående'}</Badge> },
          { rubrik: 'Datum', rendera: (p) => <span className="text-muted-ink whitespace-nowrap">{p.datum ? datum(p.datum) : '–'}</span>, klass: 'hidden md:table-cell' },
          { rubrik: 'Bilder', rendera: (p) => <span className="text-muted-ink">{(p.bilderFore?.length || 0) + (p.bilderEfter?.length || 0)} st</span>, klass: 'hidden lg:table-cell' },
          { rubrik: 'Publicerad', rendera: (p) => <PubBadge pub={p.publicerad} /> },
        ]}
      />

      <Panel oppen={!!panel} rubrik={panel?.projekt ? 'Redigera projekt' : 'Nytt projekt'} onStang={() => setPanel(null)} bred>
        {panel && (
          <div className="space-y-8">
            <form onSubmit={spara} noValidate className="space-y-5">
              {fel._rot && <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fel._rot}</p>}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field id="p-titel" label="Titel" obligatorisk fel={fel.titel}>
                    <input {...inputProps('p-titel', fel.titel)} value={form.titel} onChange={satt('titel')} maxLength={200} />
                  </Field>
                </div>
                <Field id="p-prop" label="Fastighet" obligatorisk fel={fel.property}>
                  <select id="p-prop" className={`field-input ${fel.property ? 'field-fel' : ''}`} value={form.property} onChange={satt('property')}>
                    <option value="">Välj fastighet …</option>
                    {(fastigheter || []).map((f) => <option key={f._id} value={f._id}>{f.namn}</option>)}
                  </select>
                </Field>
                <Field id="p-status" label="Status">
                  <select id="p-status" className="field-input" value={form.status} onChange={satt('status')}>
                    <option value="pagaende">Pågående</option>
                    <option value="genomfort">Genomfört</option>
                  </select>
                </Field>
                <Field id="p-datum" label="Datum" hjalp="När projektet genomfördes eller startade.">
                  <input {...inputProps('p-datum')} type="date" value={form.datum} onChange={satt('datum')} />
                </Field>
                <Field id="p-pub" label="Publicering">
                  <label className="flex items-center gap-2.5 text-sm text-ink h-11">
                    <input type="checkbox" className="h-4 w-4 rounded border-line text-primary focus:ring-primary" checked={form.publicerad} onChange={(e) => setForm((f) => ({ ...f, publicerad: e.target.checked }))} />
                    Visa på publika utvecklingssidan
                  </label>
                </Field>
              </div>
              <Field id="p-ident" label="Vad vi identifierade" obligatorisk fel={fel.identifierade}>
                <textarea {...textareaProps('p-ident', fel.identifierade)} rows={4} value={form.identifierade} onChange={satt('identifierade')} />
              </Field>
              <Field id="p-gjorde" label="Vad vi gjorde" obligatorisk fel={fel.gjorde}>
                <textarea {...textareaProps('p-gjorde', fel.gjorde)} rows={4} value={form.gjorde} onChange={satt('gjorde')} />
              </Field>
              <Field id="p-resultat" label="Resultatet" hjalp="Valfritt – t.ex. effekt för hyresgäster eller fastigheten.">
                <textarea {...textareaProps('p-resultat')} rows={3} value={form.resultat} onChange={satt('resultat')} />
              </Field>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
                <SubmitButton laddar={sparar}>{panel.projekt ? 'Spara ändringar' : 'Skapa projekt'}</SubmitButton>
                <button type="button" className="btn-secondary" onClick={() => setPanel(null)}>Stäng</button>
                {panel.projekt && (
                  <button type="button" className="btn-secondary text-destructive ml-auto" onClick={() => setTaBort(panel.projekt)}>Ta bort</button>
                )}
              </div>
            </form>

            {panel.projekt ? (
              <div className="space-y-6 pt-6 border-t border-line">
                <BildRedigering etikett="Före-bilder" bilder={panel.projekt.bilderFore || []} onLaddaUpp={laddaUppBilder('fore')} onTaBort={taBortBild('fore')} />
                <BildRedigering etikett="Efter-bilder" bilder={panel.projekt.bilderEfter || []} onLaddaUpp={laddaUppBilder('efter')} onTaBort={taBortBild('efter')} />
              </div>
            ) : (
              <p className="text-sm text-muted-ink pt-4 border-t border-line">Spara projektet först – därefter kan du ladda upp före- och efterbilder här.</p>
            )}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        oppen={!!taBort}
        rubrik="Ta bort projekt?"
        text={taBort ? `"${taBort.titel}" och dess bilder tas bort permanent.` : ''}
        onBekrafta={bekraftaTaBort}
        onAvbryt={() => setTaBort(null)}
      />
    </AdminSida>
  );
}
