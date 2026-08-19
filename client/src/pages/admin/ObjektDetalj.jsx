import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, PageSpinner, EmptyState, Tabs, Badge, StatusBadge, ConfirmDialog } from '../../components/ui.jsx';
import { Panel, PubBadge, BildRedigering, DataTable } from './adminUi.jsx';
import { ObjektForm } from './ObjektForm.jsx';
import { TenancyForm } from './TenancyForm.jsx';
import { kr, datum, statusNamn, kategoriNamn, filstorlek } from '../../lib/format.js';

const UNIT_STATUS = { ledig: ['atgardad', 'Ledig'], uthyrd: ['stangd', 'Uthyrd'], kommande: ['ny', 'Kommande'] };
const TCY_STATUS = { kommande: 'Kommande', pagaende: 'Pågående', uppsagd: 'Uppsagd', avslutad: 'Avslutad' };

export default function AdminObjektDetalj() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { visa } = useToast();
  const { data, laddar, laddaOm } = useAsync(() => admin.objekt(id), [id]);
  const [flik, setFlik] = useState('hyresforhallanden');
  const [redigera, setRedigera] = useState(false);
  const [nyttTcy, setNyttTcy] = useState(false);
  const [taBort, setTaBort] = useState(false);
  const u = data?.objekt;
  usePageMeta({ title: `${u?.adress || 'Objekt'} – Förvaltning | Fallens Fastigheter`, noindex: true });

  if (laddar) return <PageSpinner />;
  if (!u) return <EmptyState rubrik="Objektet hittades inte" cta="Till objekt" ctaTill="/admin/objekt" />;
  const { hyresforhallanden = [], arenden = [], dokument = [] } = data;
  const [sc, sn] = UNIT_STATUS[u.status] || ['neutral', u.status];

  return (
    <>
      <nav className="mb-4 text-sm text-muted-ink"><Link to="/admin/objekt" className="hover:text-primary">← Objekt</Link></nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h2">{u.adress}</h1>
            <Badge color={sc}>{sn}</Badge>
            <PubBadge pub={u.publicerad} />
          </div>
          <p className="mt-1 text-muted-ink">
            {u.typ === 'bostad' ? 'Bostad' : 'Lokal'} · {u.property?.namn}{u.beteckning ? ` · ${u.beteckning}` : ''} · {kr(u.hyraKrMan)}
          </p>
        </div>
        <div className="flex gap-2">
          {u.publicerad && u.status === 'ledig' && (
            <a href={`/${u.typ === 'bostad' ? 'bostader' : 'lokaler'}/${u._id}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">Visa publikt</a>
          )}
          <button className="btn-secondary btn-sm" onClick={() => setRedigera(true)}>Redigera</button>
          <button className="btn-destructive btn-sm" onClick={() => setTaBort(true)}>Ta bort</button>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <BildRedigering bilder={u.bilder}
          onLaddaUpp={async (filer) => {
            const fd = new FormData();
            [...filer].forEach((x) => fd.append('bilder', x));
            await admin.objektBilder(u._id, fd).catch((e) => visa(e.message, 'fel'));
            laddaOm();
          }}
          onTaBort={async (i) => { await admin.taBortObjektBild(u._id, i).catch((e) => visa(e.message, 'fel')); laddaOm(); }} />
      </div>

      <div className="mt-8">
        <Tabs aktiv={flik} onValj={setFlik} flikar={[
          { id: 'hyresforhallanden', namn: 'Hyresförhållanden', antal: hyresforhallanden.length },
          { id: 'arenden', namn: 'Ärenden', antal: arenden.length },
          { id: 'dokument', namn: 'Dokument', antal: dokument.length },
        ]} />
        <div className="mt-5">
          {flik === 'hyresforhallanden' && (
            <>
              <button className="btn-primary btn-sm mb-4" onClick={() => setNyttTcy(true)}>Nytt hyresförhållande</button>
              <DataTable rader={hyresforhallanden} onRad={(r) => r.tenant?._id && navigate(`/admin/hyresgaster/${r.tenant._id}`)}
                tom="Ingen hyreshistorik på objektet ännu."
                kolumner={[
                  { rubrik: 'Hyresgäst', rendera: (r) => <strong>{r.tenant?.namn || '–'}</strong> },
                  { rubrik: 'Start', rendera: (r) => datum(r.startdatum) },
                  { rubrik: 'Slut', rendera: (r) => r.slutdatum ? datum(r.slutdatum) : '–' },
                  { rubrik: 'Hyra', rendera: (r) => kr(r.hyraKrMan) },
                  { rubrik: 'Status', rendera: (r) => TCY_STATUS[r.status] || r.status },
                ]} />
            </>
          )}
          {flik === 'arenden' && (
            <DataTable rader={arenden} onRad={(r) => navigate(`/admin/felanmalningar/${r._id}`)} tom="Inga ärenden på objektet."
              kolumner={[
                { rubrik: 'Nr', rendera: (r) => <strong>#{r.arendenummer}</strong> },
                { rubrik: 'Datum', rendera: (r) => datum(r.createdAt) },
                { rubrik: 'Kategori', rendera: (r) => kategoriNamn(r.kategori) },
                { rubrik: 'Status', rendera: (r) => <StatusBadge status={r.status} namn={statusNamn(r.status)} /> },
              ]} />
          )}
          {flik === 'dokument' && (
            <DataTable rader={dokument} tom="Inga dokument på objektnivå."
              kolumner={[
                { rubrik: 'Titel', rendera: (r) => <strong>{r.titel}</strong> },
                { rubrik: 'Kategori', rendera: (r) => r.kategori },
                { rubrik: 'Storlek', rendera: (r) => filstorlek(r.storlek) },
              ]} />
          )}
        </div>
      </div>

      <Panel oppen={redigera} rubrik={`Redigera ${u.adress}`} onStang={() => setRedigera(false)} bred>
        <ObjektForm befintlig={u} onKlar={() => { setRedigera(false); visa('Objektet är sparat.'); laddaOm(); }} />
      </Panel>
      <Panel oppen={nyttTcy} rubrik="Nytt hyresförhållande" onStang={() => setNyttTcy(false)}>
        <TenancyForm unitId={u._id} onKlar={() => { setNyttTcy(false); visa('Hyresförhållandet är skapat.'); laddaOm(); }} />
      </Panel>
      <ConfirmDialog oppen={taBort} rubrik="Ta bort objektet?"
        text="Objektet kan bara tas bort om det saknar hyreshistorik. Åtgärden går inte att ångra."
        onAvbryt={() => setTaBort(false)}
        onBekrafta={async () => {
          try { await admin.taBortObjekt(u._id); visa('Objektet är borttaget.'); navigate('/admin/objekt'); }
          catch (e) { visa(e.message, 'fel'); setTaBort(false); }
        }} />
    </>
  );
}
