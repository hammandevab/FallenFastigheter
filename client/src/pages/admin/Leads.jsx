import { useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { datumTid, leadTypNamn, rollNamn } from '../../lib/format.js';
import { Badge, ConfirmDialog, SearchInput, useAsync } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel } from './adminUi.jsx';

const STATUS_NAMN = { ny: 'Ny', kontaktad: 'Kontaktad', avslutad: 'Avslutad' };
const STATUS_FARG = { ny: 'ny', kontaktad: 'vantar', atgardad: 'atgardad', avslutad: 'stangd' };

function Rad({ etikett, varde }) {
  if (!varde) return null;
  return (
    <div className="flex gap-3 text-sm py-1.5 border-b border-line/60 last:border-0">
      <dt className="w-32 shrink-0 text-muted-ink">{etikett}</dt>
      <dd className="text-ink break-words min-w-0">{varde}</dd>
    </div>
  );
}

export default function Leads() {
  usePageMeta('Leads – Admin');
  const [typ, setTyp] = useState('alla');
  const [status, setStatus] = useState('alla');
  const [sok, setSok] = useState('');
  const [vald, setVald] = useState(null);
  const [anteckningar, setAnteckningar] = useState('');
  const [sparar, setSparar] = useState(false);
  const [taBort, setTaBort] = useState(null);
  const { visa } = useToast();

  const { data: leads, laddar, laddaOm } = useAsync(
    () => admin.leads({ typ, status, sok }).then((r) => r.data),
    [typ, status, sok],
  );

  const oppna = (lead) => { setVald(lead); setAnteckningar(lead.internaAnteckningar || ''); };

  const uppdatera = async (patch) => {
    setSparar(true);
    try {
      const r = await admin.uppdateraLead(vald._id, patch);
      setVald(r.data);
      visa('Leaden uppdaterades');
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
    finally { setSparar(false); }
  };

  const bekraftaTaBort = async () => {
    try {
      await admin.taBortLead(taBort._id);
      visa('Leaden togs bort');
      setTaBort(null); setVald(null);
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
  };

  return (
    <AdminSida rubrik="Leads" beskrivning="Intresseanmälningar och meddelanden från publika sajten – bostad, lokal, förvaltning och kontakt i en gemensam inkorg.">
      <FilterRad>
        <FilterSelect label="Typ" varde={typ} onAndra={setTyp} alternativ={[['alla', 'Alla typer'], ['bostad', 'Bostad'], ['lokal', 'Lokal'], ['forvaltning', 'Förvaltning'], ['kontakt', 'Kontakt']]} />
        <FilterSelect label="Status" varde={status} onAndra={setStatus} alternativ={[['alla', 'Alla statusar'], ['ny', 'Ny'], ['kontaktad', 'Kontaktad'], ['avslutad', 'Avslutad']]} />
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök namn, e-post, meddelande …" className="sm:ml-auto sm:w-72" />
      </FilterRad>

      <DataTable
        laddar={laddar}
        rader={leads || []}
        onRad={oppna}
        tom="Inga leads matchar filtret."
        kolumner={[
          { rubrik: 'Inkom', rendera: (l) => <span className="whitespace-nowrap text-muted-ink">{datumTid(l.createdAt)}</span> },
          { rubrik: 'Typ', rendera: (l) => <Badge color="primary">{leadTypNamn(l.typ)}</Badge> },
          { rubrik: 'Namn', rendera: (l) => <span className="font-medium text-ink">{l.namn}{l.foretag ? <span className="block text-xs font-normal text-muted-ink">{l.foretag}</span> : null}</span> },
          { rubrik: 'Meddelande', rendera: (l) => <span className="block max-w-md truncate text-muted-ink">{l.meddelande}</span>, klass: 'hidden lg:table-cell' },
          { rubrik: 'Status', rendera: (l) => <Badge color={STATUS_FARG[l.status]}>{STATUS_NAMN[l.status] || l.status}</Badge> },
        ]}
      />

      <Panel oppen={!!vald} rubrik={vald ? `${leadTypNamn(vald.typ)} · ${vald.namn}` : ''} onStang={() => setVald(null)}>
        {vald && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-ink mr-1">Status:</span>
              {['ny', 'kontaktad', 'avslutad'].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={sparar || vald.status === s}
                  onClick={() => uppdatera({ status: s })}
                  className={vald.status === s ? 'btn-primary !px-3 !py-1.5 text-sm' : 'btn-secondary !px-3 !py-1.5 text-sm'}
                >
                  {STATUS_NAMN[s]}
                </button>
              ))}
            </div>

            <dl>
              <Rad etikett="Inkom" varde={datumTid(vald.createdAt)} />
              <Rad etikett="Namn" varde={vald.namn} />
              <Rad etikett="E-post" varde={<a className="text-primary hover:underline" href={`mailto:${vald.epost}`}>{vald.epost}</a>} />
              <Rad etikett="Telefon" varde={vald.telefon ? <a className="text-primary hover:underline" href={`tel:${vald.telefon}`}>{vald.telefon}</a> : null} />
              <Rad etikett="Företag" varde={vald.foretag} />
              <Rad etikett="Roll" varde={vald.roll ? rollNamn(vald.roll) : null} />
              <Rad etikett="Gäller objekt" varde={vald.unit ? <Link className="text-primary hover:underline" to={`/admin/objekt/${vald.unit._id || vald.unit}`} onClick={() => setVald(null)}>{vald.unit.adress || 'Visa objekt'}</Link> : null} />
              <Rad etikett="Önskad ort" varde={vald.ort} />
              <Rad etikett="Önskad storlek" varde={vald.storlek} />
              <Rad etikett="Fastighetsbestånd" varde={vald.fastighetBestand} />
            </dl>

            <div>
              <div className="text-sm font-medium text-ink mb-1.5">Meddelande</div>
              <p className="text-sm text-muted-ink whitespace-pre-wrap bg-muted rounded-lg p-3">{vald.meddelande}</p>
            </div>

            <div>
              <label htmlFor="lead-ant" className="text-sm font-medium text-ink mb-1.5 block">Interna anteckningar</label>
              <textarea id="lead-ant" rows={4} className="field-input" value={anteckningar} onChange={(e) => setAnteckningar(e.target.value)} placeholder="Syns endast för administratörer …" />
              <div className="mt-2 flex items-center gap-3">
                <button type="button" className="btn-secondary !px-3 !py-1.5 text-sm" disabled={sparar} onClick={() => uppdatera({ internaAnteckningar: anteckningar })}>Spara anteckningar</button>
              </div>
            </div>

            <div className="pt-2 border-t border-line flex flex-wrap gap-3">
              <a className="btn-primary !px-4 !py-2 text-sm" href={`mailto:${vald.epost}?subject=${encodeURIComponent('Angående din förfrågan till Fallens Fastigheter')}`}>Svara via e-post</a>
              <button type="button" className="btn-secondary !px-4 !py-2 text-sm text-destructive" onClick={() => setTaBort(vald)}>Ta bort</button>
            </div>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        oppen={!!taBort}
        rubrik="Ta bort lead?"
        text={taBort ? `Leaden från ${taBort.namn} tas bort permanent. Detta går inte att ångra.` : ''}
        onBekrafta={bekraftaTaBort}
        onAvbryt={() => setTaBort(null)}
      />
    </AdminSida>
  );
}
