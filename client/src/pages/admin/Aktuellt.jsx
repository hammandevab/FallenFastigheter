import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { datum, nyhetsKategori } from '../../lib/format.js';
import { Badge, ConfirmDialog, useAsync } from '../../components/ui.jsx';
import { Field, inputProps, textareaProps, useFormFel, validera, SubmitButton } from '../../components/form.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel } from './adminUi.jsx';

const TOM = { rubrik: '', brodtext: '', kategori: 'information', property: '', synlighet: 'publik', publiceradFran: '', publiceradTill: '', status: 'utkast' };
const STATUS_NAMN = { utkast: 'Utkast', publicerad: 'Publicerad', avpublicerad: 'Avpublicerad' };
const STATUS_FARG = { utkast: 'vantar', publicerad: 'atgardad', avpublicerad: 'stangd' };
const tillDatumInput = (d) => (d ? String(d).slice(0, 10) : '');

export default function Aktuellt() {
  usePageMeta('Aktuellt – Admin');
  const [statusFilter, setStatusFilter] = useState('alla');
  const [panel, setPanel] = useState(null); // { post | null } – null-post = ny
  const [form, setForm] = useState(TOM);
  const [sparar, setSparar] = useState(false);
  const [taBort, setTaBort] = useState(null);
  const { fel, sattFel, rensa } = useFormFel();
  const { visa } = useToast();

  const { data, laddar, laddaOm } = useAsync(() => Promise.all([
    admin.aktuellt().then((r) => r.data),
    admin.fastigheter().then((r) => r.data),
  ]), []);
  const [poster, fastigheter] = data || [[], []];
  const visade = (poster || []).filter((p) => statusFilter === 'alla' || p.status === statusFilter);

  const oppnaNy = () => { setForm(TOM); rensa(); setPanel({ post: null }); };
  const oppnaRedigera = (p) => {
    setForm({
      rubrik: p.rubrik, brodtext: p.brodtext, kategori: p.kategori,
      property: p.property?._id || '', synlighet: p.synlighet || 'publik',
      publiceradFran: tillDatumInput(p.publiceradFran), publiceradTill: tillDatumInput(p.publiceradTill),
      status: p.status,
    });
    rensa();
    setPanel({ post: p });
  };

  const spara = async (e) => {
    e.preventDefault();
    const nyaFel = validera(form, { rubrik: 'Ange rubrik', brodtext: 'Skriv brödtext' });
    if (Object.keys(nyaFel).length) return sattFel(nyaFel);
    setSparar(true);
    try {
      const body = {
        ...form,
        property: form.property || null,
        publiceradFran: form.publiceradFran || null,
        publiceradTill: form.publiceradTill || null,
      };
      if (panel.post) await admin.uppdateraAktuellt(panel.post._id, body);
      else await admin.skapaAktuellt(body);
      visa(panel.post ? 'Notisen uppdaterades' : 'Notisen skapades');
      setPanel(null);
      laddaOm();
    } catch (err) { sattFel({ _rot: err.message }); }
    finally { setSparar(false); }
  };

  const bekraftaTaBort = async () => {
    try {
      await admin.taBortAktuellt(taBort._id);
      visa('Notisen togs bort');
      setTaBort(null); setPanel(null);
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
  };

  const satt = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AdminSida
      rubrik="Aktuellt"
      beskrivning="Nyheter och driftinformation. Publicerade notiser syns direkt på sajten och i hyresgästportalen – inom valt publiceringsfönster."
      knapp={<button type="button" className="btn-primary" onClick={oppnaNy}>Ny notis</button>}
    >
      <FilterRad>
        <FilterSelect label="Status" varde={statusFilter} onAndra={setStatusFilter} alternativ={[['alla', 'Alla statusar'], ['utkast', 'Utkast'], ['publicerad', 'Publicerad'], ['avpublicerad', 'Avpublicerad']]} />
      </FilterRad>

      <DataTable
        laddar={laddar}
        rader={visade}
        onRad={oppnaRedigera}
        tom="Inga notiser ännu. Skapa den första med knappen ovan."
        kolumner={[
          { rubrik: 'Rubrik', rendera: (p) => <span className="font-medium text-ink">{p.rubrik}</span> },
          { rubrik: 'Kategori', rendera: (p) => <Badge color="neutral">{nyhetsKategori(p.kategori)}</Badge> },
          { rubrik: 'Gäller', rendera: (p) => <span className="text-muted-ink">{p.property?.namn || 'Hela beståndet'}</span>, klass: 'hidden md:table-cell' },
          { rubrik: 'Synlighet', rendera: (p) => <span className="text-muted-ink">{p.synlighet === 'hyresgaster' ? 'Endast hyresgäster' : 'Publik'}</span>, klass: 'hidden lg:table-cell' },
          { rubrik: 'Fönster', rendera: (p) => <span className="text-muted-ink whitespace-nowrap">{p.publiceradFran || p.publiceradTill ? `${p.publiceradFran ? datum(p.publiceradFran) : '–'} → ${p.publiceradTill ? datum(p.publiceradTill) : 'tills vidare'}` : 'Tills vidare'}</span>, klass: 'hidden xl:table-cell' },
          { rubrik: 'Status', rendera: (p) => <Badge color={STATUS_FARG[p.status]}>{STATUS_NAMN[p.status]}</Badge> },
        ]}
      />

      <Panel oppen={!!panel} rubrik={panel?.post ? 'Redigera notis' : 'Ny notis'} onStang={() => setPanel(null)} bred>
        {panel && (
          <form onSubmit={spara} noValidate className="space-y-5">
            {fel._rot && <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fel._rot}</p>}
            <Field id="n-rubrik" label="Rubrik" obligatorisk fel={fel.rubrik}>
              <input {...inputProps('n-rubrik', fel.rubrik)} value={form.rubrik} onChange={satt('rubrik')} maxLength={200} />
            </Field>
            <Field id="n-text" label="Brödtext" obligatorisk fel={fel.brodtext} hjalp="Skriv klarspråk i du-form. Radbrytningar bevaras.">
              <textarea {...textareaProps('n-text', fel.brodtext)} rows={8} value={form.brodtext} onChange={satt('brodtext')} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="n-kategori" label="Kategori">
                <select id="n-kategori" className="field-input" value={form.kategori} onChange={satt('kategori')}>
                  <option value="information">Information</option>
                  <option value="planerat_arbete">Planerat arbete</option>
                  <option value="driftstorning">Driftstörning</option>
                  <option value="forbattring">Förbättring</option>
                </select>
              </Field>
              <Field id="n-prop" label="Gäller fastighet" hjalp="Lämna tomt för hela beståndet.">
                <select id="n-prop" className="field-input" value={form.property} onChange={satt('property')}>
                  <option value="">Hela beståndet</option>
                  {(fastigheter || []).map((f) => <option key={f._id} value={f._id}>{f.namn}</option>)}
                </select>
              </Field>
              <Field id="n-syn" label="Synlighet">
                <select id="n-syn" className="field-input" value={form.synlighet} onChange={satt('synlighet')}>
                  <option value="publik">Publik – syns för alla</option>
                  <option value="hyresgaster">Endast hyresgäster</option>
                </select>
              </Field>
              <Field id="n-status" label="Status">
                <select id="n-status" className="field-input" value={form.status} onChange={satt('status')}>
                  <option value="utkast">Utkast</option>
                  <option value="publicerad">Publicerad</option>
                  <option value="avpublicerad">Avpublicerad</option>
                </select>
              </Field>
              <Field id="n-fran" label="Publiceras från" hjalp="Tomt = direkt.">
                <input {...inputProps('n-fran')} type="date" value={form.publiceradFran} onChange={satt('publiceradFran')} />
              </Field>
              <Field id="n-till" label="Publiceras till" hjalp="Tomt = tills vidare.">
                <input {...inputProps('n-till')} type="date" value={form.publiceradTill} onChange={satt('publiceradTill')} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
              <SubmitButton laddar={sparar}>{panel.post ? 'Spara ändringar' : 'Skapa notis'}</SubmitButton>
              <button type="button" className="btn-secondary" onClick={() => setPanel(null)}>Avbryt</button>
              {panel.post && (
                <button type="button" className="btn-secondary text-destructive ml-auto" onClick={() => setTaBort(panel.post)}>Ta bort</button>
              )}
            </div>
          </form>
        )}
      </Panel>

      <ConfirmDialog
        oppen={!!taBort}
        rubrik="Ta bort notis?"
        text={taBort ? `"${taBort.rubrik}" tas bort permanent och försvinner från sajten och portalen.` : ''}
        onBekrafta={bekraftaTaBort}
        onAvbryt={() => setTaBort(null)}
      />
    </AdminSida>
  );
}
