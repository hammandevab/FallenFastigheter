import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, PageSpinner, EmptyState, Tabs, Badge, StatusBadge, ConfirmDialog } from '../../components/ui.jsx';
import { Panel, PubBadge, BildRedigering, DataTable } from './adminUi.jsx';
import { FastighetForm } from './FastighetForm.jsx';
import { ortNamn, datum, statusNamn, kategoriNamn, kr, nyhetsKategori, filstorlek } from '../../lib/format.js';

export default function AdminFastighetDetalj() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { visa } = useToast();
  const { data, laddar, laddaOm } = useAsync(() => admin.fastighet(id), [id]);
  const [flik, setFlik] = useState('objekt');
  const [redigera, setRedigera] = useState(false);
  const [taBort, setTaBort] = useState(false);
  const f = data?.fastighet;
  usePageMeta({ title: `${f?.namn || 'Fastighet'} – Förvaltning | Fallens Fastigheter`, noindex: true });

  if (laddar) return <PageSpinner />;
  if (!f) return <EmptyState rubrik="Fastigheten hittades inte" cta="Till fastigheter" ctaTill="/admin/fastigheter" />;
  const { objekt = [], arenden = [], dokument = [], projekt = [], aktuellt = [] } = data;

  return (
    <>
      <nav className="mb-4 text-sm text-muted-ink"><Link to="/admin/fastigheter" className="hover:text-primary">← Fastigheter</Link></nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h2">{f.namn}</h1>
            <Badge color="ort">{ortNamn(f.ort)}</Badge>
            <PubBadge pub={f.publicerad} />
          </div>
          <p className="mt-1 text-muted-ink">{f.adress}{f.byggar ? ` · Byggår ${f.byggar}` : ''}</p>
        </div>
        <div className="flex gap-2">
          {f.publicerad && <a href={`/fastigheter/${f.slug}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">Visa publikt</a>}
          <button className="btn-secondary btn-sm" onClick={() => setRedigera(true)}>Redigera</button>
          <button className="btn-destructive btn-sm" onClick={() => setTaBort(true)}>Ta bort</button>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <BildRedigering bilder={f.bilder}
          onLaddaUpp={async (filer) => {
            const fd = new FormData();
            [...filer].forEach((x) => fd.append('bilder', x));
            await admin.fastighetBilder(f._id, fd).catch((e) => visa(e.message, 'fel'));
            laddaOm();
          }}
          onTaBort={async (i) => { await admin.taBortFastighetBild(f._id, i).catch((e) => visa(e.message, 'fel')); laddaOm(); }} />
      </div>

      <div className="mt-8">
        <Tabs aktiv={flik} onValj={setFlik} flikar={[
          { id: 'objekt', namn: 'Objekt', antal: objekt.length },
          { id: 'arenden', namn: 'Ärenden', antal: arenden.length },
          { id: 'dokument', namn: 'Dokument', antal: dokument.length },
          { id: 'utveckling', namn: 'Utveckling', antal: projekt.length },
          { id: 'aktuellt', namn: 'Aktuellt', antal: aktuellt.length },
        ]} />
        <div className="mt-5">
          {flik === 'objekt' && (
            <DataTable rader={objekt} onRad={(r) => navigate(`/admin/objekt/${r._id}`)} tom="Inga objekt i fastigheten ännu."
              kolumner={[
                { rubrik: 'Adress', rendera: (r) => <strong>{r.adress}</strong> },
                { rubrik: 'Typ', rendera: (r) => r.typ === 'bostad' ? 'Bostad' : 'Lokal' },
                { rubrik: 'Yta', rendera: (r) => r.ytaM2 ? `${r.ytaM2} m²` : '–' },
                { rubrik: 'Hyra', rendera: (r) => kr(r.hyraKrMan) },
                { rubrik: 'Status', rendera: (r) => statusNamn(r.status) === r.status ? ({ ledig: 'Ledig', uthyrd: 'Uthyrd', kommande: 'Kommande' }[r.status]) : r.status },
                { rubrik: 'Publicering', rendera: (r) => <PubBadge pub={r.publicerad} /> },
              ]} />
          )}
          {flik === 'arenden' && (
            <DataTable rader={arenden} onRad={(r) => navigate(`/admin/felanmalningar/${r._id}`)} tom="Inga ärenden i fastigheten."
              kolumner={[
                { rubrik: 'Nr', rendera: (r) => <strong>#{r.arendenummer}</strong> },
                { rubrik: 'Datum', rendera: (r) => datum(r.createdAt) },
                { rubrik: 'Kategori', rendera: (r) => kategoriNamn(r.kategori) },
                { rubrik: 'Beskrivning', rendera: (r) => r.beskrivning?.slice(0, 50) },
                { rubrik: 'Status', rendera: (r) => <StatusBadge status={r.status} namn={statusNamn(r.status)} /> },
              ]} />
          )}
          {flik === 'dokument' && (
            <DataTable rader={dokument} tom="Inga dokument på fastighetsnivå. Ladda upp via Dokument-modulen."
              kolumner={[
                { rubrik: 'Titel', rendera: (r) => <strong>{r.titel}</strong> },
                { rubrik: 'Kategori', rendera: (r) => r.kategori },
                { rubrik: 'Storlek', rendera: (r) => filstorlek(r.storlek) },
                { rubrik: 'Uppladdad', rendera: (r) => datum(r.createdAt) },
              ]} />
          )}
          {flik === 'utveckling' && (
            <DataTable rader={projekt} onRad={() => navigate('/admin/utveckling')} tom="Inga utvecklingsprojekt i fastigheten."
              kolumner={[
                { rubrik: 'Titel', rendera: (r) => <strong>{r.titel}</strong> },
                { rubrik: 'Status', rendera: (r) => r.status === 'genomfort' ? 'Genomfört' : 'Pågående' },
                { rubrik: 'Publicering', rendera: (r) => <PubBadge pub={r.publicerad} /> },
              ]} />
          )}
          {flik === 'aktuellt' && (
            <DataTable rader={aktuellt} onRad={() => navigate('/admin/aktuellt')} tom="Inga riktade nyheter mot fastigheten."
              kolumner={[
                { rubrik: 'Rubrik', rendera: (r) => <strong>{r.rubrik}</strong> },
                { rubrik: 'Kategori', rendera: (r) => nyhetsKategori(r.kategori) },
                { rubrik: 'Status', rendera: (r) => r.status },
              ]} />
          )}
        </div>
      </div>

      <Panel oppen={redigera} rubrik={`Redigera ${f.namn}`} onStang={() => setRedigera(false)} bred>
        <FastighetForm befintlig={f} onKlar={() => { setRedigera(false); visa('Fastigheten är sparad.'); laddaOm(); }} />
      </Panel>
      <ConfirmDialog oppen={taBort} rubrik="Ta bort fastigheten?"
        text="Fastigheten kan bara tas bort om den saknar objekt. Åtgärden går inte att ångra."
        onAvbryt={() => setTaBort(false)}
        onBekrafta={async () => {
          try { await admin.taBortFastighet(f._id); visa('Fastigheten är borttagen.'); navigate('/admin/fastigheter'); }
          catch (e) { visa(e.message, 'fel'); setTaBort(false); }
        }} />
    </>
  );
}
