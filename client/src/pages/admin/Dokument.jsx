import { useRef, useState } from 'react';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { datum, filstorlek } from '../../lib/format.js';
import { Badge, ConfirmDialog, SearchInput, useAsync } from '../../components/ui.jsx';
import { Field, inputProps, textareaProps, useFormFel, validera, SubmitButton } from '../../components/form.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel } from './adminUi.jsx';

const NIVA_NAMN = { koncern: 'Koncern', fastighet: 'Fastighet', objekt: 'Objekt', hyresgast: 'Hyresgäst' };
const KATEGORI_NAMN = { blankett: 'Blankett', information: 'Information', avtal: 'Avtal', protokoll: 'Protokoll', ovrigt: 'Övrigt' };
const TOM = { titel: '', beskrivning: '', kategori: 'ovrigt', niva: 'koncern', property: '', unit: '', tenant: '', publik: false };

export default function Dokument() {
  usePageMeta('Dokument – Admin');
  const [niva, setNiva] = useState('alla');
  const [kategori, setKategori] = useState('alla');
  const [sok, setSok] = useState('');
  const [nyPanel, setNyPanel] = useState(false);
  const [form, setForm] = useState(TOM);
  const [fil, setFil] = useState(null);
  const [redigera, setRedigera] = useState(null);
  const [sparar, setSparar] = useState(false);
  const [taBort, setTaBort] = useState(null);
  const filRef = useRef(null);
  const { fel, sattFel, rensa } = useFormFel();
  const { visa } = useToast();

  const { data: docs, laddar, laddaOm } = useAsync(
    () => admin.dokument({ niva, kategori, sok }).then((r) => r.data),
    [niva, kategori, sok],
  );
  const { data: underlag } = useAsync(() => Promise.all([
    admin.fastigheter().then((r) => r.data),
    admin.objektLista().then((r) => r.data),
    admin.hyresgaster().then((r) => r.data),
  ]), []);
  const [fastigheter, objekt, hyresgaster] = underlag || [[], [], []];

  const oppnaNy = () => { setForm(TOM); setFil(null); rensa(); setNyPanel(true); };

  const laddaUpp = async (e) => {
    e.preventDefault();
    const nyaFel = validera(form, { titel: 'Ange titel' });
    if (!fil) nyaFel.fil = 'Välj en fil';
    if (form.niva === 'fastighet' && !form.property) nyaFel.property = 'Välj fastighet';
    if (form.niva === 'objekt' && !form.unit) nyaFel.unit = 'Välj objekt';
    if (form.niva === 'hyresgast' && !form.tenant) nyaFel.tenant = 'Välj hyresgäst';
    if (Object.keys(nyaFel).length) return sattFel(nyaFel);
    setSparar(true);
    try {
      const fd = new FormData();
      fd.append('fil', fil);
      fd.append('titel', form.titel);
      fd.append('beskrivning', form.beskrivning);
      fd.append('kategori', form.kategori);
      fd.append('niva', form.niva);
      if (form.niva === 'fastighet') fd.append('property', form.property);
      if (form.niva === 'objekt') fd.append('unit', form.unit);
      if (form.niva === 'hyresgast') fd.append('tenant', form.tenant);
      fd.append('publik', form.niva === 'koncern' && form.publik ? 'true' : 'false');
      await admin.laddaUppDokument(fd);
      visa('Dokumentet laddades upp');
      setNyPanel(false);
      laddaOm();
    } catch (err) { sattFel({ _rot: err.message }); }
    finally { setSparar(false); }
  };

  const sparaRedigering = async (e) => {
    e.preventDefault();
    setSparar(true);
    try {
      await admin.uppdateraDokument(redigera._id, { titel: redigera.titel, beskrivning: redigera.beskrivning || '', kategori: redigera.kategori });
      visa('Dokumentet uppdaterades');
      setRedigera(null);
      laddaOm();
    } catch (err) { visa(err.message, 'fel'); }
    finally { setSparar(false); }
  };

  const bekraftaTaBort = async () => {
    try {
      await admin.taBortDokument(taBort._id);
      visa('Dokumentet togs bort');
      setTaBort(null); setRedigera(null);
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
  };

  const koppling = (d) => d.tenant?.namn || d.unit?.adress || d.property?.namn || (d.publik ? 'Publikt' : 'Alla hyresgäster');
  const satt = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AdminSida
      rubrik="Dokument"
      beskrivning="Blanketter, avtal och information. Nivån styr vem som ser dokumentet – från publik koncernnivå ner till enskild hyresgäst."
      knapp={<button type="button" className="btn-primary" onClick={oppnaNy}>Ladda upp dokument</button>}
    >
      <FilterRad>
        <FilterSelect label="Nivå" varde={niva} onAndra={setNiva} alternativ={[['alla', 'Alla nivåer'], ['koncern', 'Koncern'], ['fastighet', 'Fastighet'], ['objekt', 'Objekt'], ['hyresgast', 'Hyresgäst']]} />
        <FilterSelect label="Kategori" varde={kategori} onAndra={setKategori} alternativ={[['alla', 'Alla kategorier'], ...Object.entries(KATEGORI_NAMN)]} />
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök titel …" className="sm:ml-auto sm:w-72" />
      </FilterRad>

      <DataTable
        laddar={laddar}
        rader={docs || []}
        onRad={(d) => setRedigera({ ...d })}
        tom="Inga dokument publicerade ännu. Ladda upp det första med knappen ovan."
        kolumner={[
          { rubrik: 'Titel', rendera: (d) => <span className="font-medium text-ink">{d.titel}<span className="block text-xs font-normal text-muted-ink uppercase">{d.filtyp} · {filstorlek(d.storlek)}</span></span> },
          { rubrik: 'Kategori', rendera: (d) => <Badge color="neutral">{KATEGORI_NAMN[d.kategori] || d.kategori}</Badge>, klass: 'hidden md:table-cell' },
          { rubrik: 'Nivå', rendera: (d) => <Badge color="primary">{NIVA_NAMN[d.niva]}</Badge> },
          { rubrik: 'Kopplat till', rendera: (d) => <span className="text-muted-ink">{koppling(d)}</span>, klass: 'hidden lg:table-cell' },
          { rubrik: 'Uppladdad', rendera: (d) => <span className="text-muted-ink whitespace-nowrap">{datum(d.createdAt)}</span>, klass: 'hidden xl:table-cell' },
          {
            rubrik: '',
            rendera: (d) => (
              <a
                className="text-primary text-sm font-medium hover:underline whitespace-nowrap"
                href={`/api/v1/filer/dokument/${d._id}`}
                onClick={(e) => e.stopPropagation()}
              >
                Ladda ner
              </a>
            ),
          },
        ]}
      />

      <Panel oppen={nyPanel} rubrik="Ladda upp dokument" onStang={() => setNyPanel(false)} bred>
        <form onSubmit={laddaUpp} noValidate className="space-y-5">
          {fel._rot && <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fel._rot}</p>}
          <Field id="d-fil" label="Fil" obligatorisk fel={fel.fil} hjalp="PDF, Word, Excel eller bild. Max 15 MB.">
            <input
              ref={filRef}
              id="d-fil"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
              className="block w-full text-sm text-muted-ink file:mr-3 file:btn-secondary file:!px-3 file:!py-1.5 file:border-0 file:cursor-pointer"
              onChange={(e) => setFil(e.target.files?.[0] || null)}
            />
          </Field>
          <Field id="d-titel" label="Titel" obligatorisk fel={fel.titel}>
            <input {...inputProps('d-titel', fel.titel)} value={form.titel} onChange={satt('titel')} maxLength={200} />
          </Field>
          <Field id="d-besk" label="Beskrivning" hjalp="Valfri – visas i dokumentlistan.">
            <textarea {...textareaProps('d-besk')} rows={2} value={form.beskrivning} onChange={satt('beskrivning')} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="d-kat" label="Kategori">
              <select id="d-kat" className="field-input" value={form.kategori} onChange={satt('kategori')}>
                {Object.entries(KATEGORI_NAMN).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </Field>
            <Field id="d-niva" label="Nivå" hjalp="Styr vilka som får se dokumentet.">
              <select id="d-niva" className="field-input" value={form.niva} onChange={(e) => setForm((f) => ({ ...f, niva: e.target.value, property: '', unit: '', tenant: '', publik: false }))}>
                {Object.entries(NIVA_NAMN).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </Field>
            {form.niva === 'fastighet' && (
              <Field id="d-prop" label="Fastighet" obligatorisk fel={fel.property}>
                <select id="d-prop" className={`field-input ${fel.property ? 'field-fel' : ''}`} value={form.property} onChange={satt('property')}>
                  <option value="">Välj fastighet …</option>
                  {(fastigheter || []).map((f) => <option key={f._id} value={f._id}>{f.namn}</option>)}
                </select>
              </Field>
            )}
            {form.niva === 'objekt' && (
              <Field id="d-unit" label="Objekt" obligatorisk fel={fel.unit}>
                <select id="d-unit" className={`field-input ${fel.unit ? 'field-fel' : ''}`} value={form.unit} onChange={satt('unit')}>
                  <option value="">Välj objekt …</option>
                  {(objekt || []).map((o) => <option key={o._id} value={o._id}>{o.adress} ({o.beteckning})</option>)}
                </select>
              </Field>
            )}
            {form.niva === 'hyresgast' && (
              <Field id="d-tenant" label="Hyresgäst" obligatorisk fel={fel.tenant}>
                <select id="d-tenant" className={`field-input ${fel.tenant ? 'field-fel' : ''}`} value={form.tenant} onChange={satt('tenant')}>
                  <option value="">Välj hyresgäst …</option>
                  {(hyresgaster || []).map((h) => <option key={h._id} value={h._id}>{h.namn}</option>)}
                </select>
              </Field>
            )}
            {form.niva === 'koncern' && (
              <Field id="d-pub" label="Synlighet">
                <label className="flex items-center gap-2.5 text-sm text-ink h-11">
                  <input type="checkbox" className="h-4 w-4 rounded border-line text-primary focus:ring-primary" checked={form.publik} onChange={(e) => setForm((f) => ({ ...f, publik: e.target.checked }))} />
                  Publikt – visas på publika dokumentsidan
                </label>
              </Field>
            )}
          </div>
          {form.niva === 'koncern' && !form.publik && (
            <p className="text-sm text-muted-ink bg-muted rounded-lg px-3 py-2">Koncernnivå utan publik-markering visas för alla inloggade hyresgäster.</p>
          )}
          <div className="flex gap-3 pt-2 border-t border-line">
            <SubmitButton laddar={sparar}>Ladda upp</SubmitButton>
            <button type="button" className="btn-secondary" onClick={() => setNyPanel(false)}>Avbryt</button>
          </div>
        </form>
      </Panel>

      <Panel oppen={!!redigera} rubrik="Redigera dokument" onStang={() => setRedigera(null)}>
        {redigera && (
          <form onSubmit={sparaRedigering} noValidate className="space-y-5">
            <div className="text-sm text-muted-ink bg-muted rounded-lg px-3 py-2">
              <span className="uppercase">{redigera.filtyp}</span> · {filstorlek(redigera.storlek)} · Nivå: {NIVA_NAMN[redigera.niva]} · {koppling(redigera)}
            </div>
            <Field id="r-titel" label="Titel" obligatorisk>
              <input {...inputProps('r-titel')} value={redigera.titel} onChange={(e) => setRedigera((d) => ({ ...d, titel: e.target.value }))} maxLength={200} />
            </Field>
            <Field id="r-besk" label="Beskrivning">
              <textarea {...textareaProps('r-besk')} rows={2} value={redigera.beskrivning || ''} onChange={(e) => setRedigera((d) => ({ ...d, beskrivning: e.target.value }))} />
            </Field>
            <Field id="r-kat" label="Kategori">
              <select id="r-kat" className="field-input" value={redigera.kategori} onChange={(e) => setRedigera((d) => ({ ...d, kategori: e.target.value }))}>
                {Object.entries(KATEGORI_NAMN).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </Field>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
              <SubmitButton laddar={sparar}>Spara</SubmitButton>
              <a className="btn-secondary" href={`/api/v1/filer/dokument/${redigera._id}`}>Ladda ner</a>
              <button type="button" className="btn-secondary text-destructive ml-auto" onClick={() => setTaBort(redigera)}>Ta bort</button>
            </div>
          </form>
        )}
      </Panel>

      <ConfirmDialog
        oppen={!!taBort}
        rubrik="Ta bort dokument?"
        text={taBort ? `"${taBort.titel}" och filen tas bort permanent för alla som haft åtkomst.` : ''}
        onBekrafta={bekraftaTaBort}
        onAvbryt={() => setTaBort(null)}
      />
    </AdminSida>
  );
}
