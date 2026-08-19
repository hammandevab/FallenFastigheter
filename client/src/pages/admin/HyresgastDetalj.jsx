import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, PageSpinner, EmptyState, Badge, StatusBadge, ConfirmDialog } from '../../components/ui.jsx';
import { Panel, DataTable } from './adminUi.jsx';
import { HyresgastForm } from './HyresgastForm.jsx';
import { TenancyForm } from './TenancyForm.jsx';
import { kr, datum, statusNamn, kategoriNamn, filstorlek } from '../../lib/format.js';

const PORTAL = { aktiv: ['atgardad', 'Aktiv'], inbjuden: ['ny', 'Inbjuden'], inaktiverad: ['stangd', 'Inaktiverad'], inget_konto: ['neutral', 'Inget konto'] };
const TCY = { kommande: 'Kommande', pagaende: 'Pågående', uppsagd: 'Uppsagd', avslutad: 'Avslutad' };

export default function AdminHyresgastDetalj() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { visa } = useToast();
  const { data, laddar, laddaOm } = useAsync(() => admin.hyresgast(id), [id]);
  const [redigera, setRedigera] = useState(false);
  const [nyttTcy, setNyttTcy] = useState(false);
  const [redTcy, setRedTcy] = useState(null);
  const [bekrafta, setBekrafta] = useState(null); // { typ }
  const t = data?.hyresgast;
  usePageMeta({ title: `${t?.namn || 'Hyresgäst'} – Förvaltning | Fallens Fastigheter`, noindex: true });

  if (laddar) return <PageSpinner />;
  if (!t) return <EmptyState rubrik="Hyresgästen hittades inte" cta="Till hyresgäster" ctaTill="/admin/hyresgaster" />;
  const { hyresforhallanden = [], arenden = [], dokument = [] } = data;
  const portalstatus = t.user?.status || 'inget_konto';
  const [pc, pn] = PORTAL[portalstatus] || PORTAL.inget_konto;

  const gor = async (fn, meddelande) => {
    try { await fn(); visa(meddelande); laddaOm(); }
    catch (e) { visa(e.message, 'fel'); }
    setBekrafta(null);
  };

  return (
    <>
      <nav className="mb-4 text-sm text-muted-ink"><Link to="/admin/hyresgaster" className="hover:text-primary">← Hyresgäster</Link></nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h2">{t.namn}</h1>
            <Badge color="neutral">{t.typ === 'foretag' ? 'Företag' : 'Privat'}</Badge>
            <Badge color={pc}>Portal: {pn}</Badge>
          </div>
          <p className="mt-1 text-muted-ink">{[t.epost, t.telefon, t.orgnr && `Org.nr ${t.orgnr}`, t.kontaktperson && `Kontakt: ${t.kontaktperson}`].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(portalstatus === 'inget_konto' || portalstatus === 'inbjuden') && (
            <button className="btn-primary btn-sm" onClick={() => gor(() => admin.bjudIn(t._id), portalstatus === 'inbjuden' ? 'Ny inbjudan skickad.' : 'Inbjudan till Mina sidor skickad.')}>
              {portalstatus === 'inbjuden' ? 'Skicka ny inbjudan' : 'Bjud in till Mina sidor'}
            </button>
          )}
          {portalstatus === 'aktiv' && <button className="btn-outline btn-sm" onClick={() => setBekrafta({ typ: 'inaktivera' })}>Inaktivera konto</button>}
          <button className="btn-secondary btn-sm" onClick={() => setRedigera(true)}>Redigera</button>
          <button className="btn-destructive btn-sm" onClick={() => setBekrafta({ typ: 'anonymisera' })}>Anonymisera</button>
        </div>
      </div>

      {t.internaAnteckningar && (
        <div className="card mt-6 border-l-4 border-l-accent p-4">
          <p className="text-sm font-semibold text-muted-ink">Interna anteckningar</p>
          <p className="mt-1 whitespace-pre-line">{t.internaAnteckningar}</p>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h3">Hyresförhållanden</h2>
          <button className="btn-primary btn-sm" onClick={() => setNyttTcy(true)}>Nytt hyresförhållande</button>
        </div>
        <DataTable rader={hyresforhallanden} onRad={(r) => setRedTcy(r)} tom="Inga hyresförhållanden ännu."
          kolumner={[
            { rubrik: 'Objekt', rendera: (r) => <strong>{r.unit?.adress || '–'}</strong> },
            { rubrik: 'Fastighet', rendera: (r) => r.unit?.property?.namn || '–' },
            { rubrik: 'Start', rendera: (r) => datum(r.startdatum) },
            { rubrik: 'Slut', rendera: (r) => r.slutdatum ? datum(r.slutdatum) : '–' },
            { rubrik: 'Hyra', rendera: (r) => kr(r.hyraKrMan) },
            { rubrik: 'Status', rendera: (r) => TCY[r.status] || r.status },
          ]} />
      </section>

      <section className="mt-8">
        <h2 className="h3 mb-4">Ärendehistorik</h2>
        <DataTable rader={arenden} onRad={(r) => navigate(`/admin/felanmalningar/${r._id}`)} tom="Inga ärenden kopplade till hyresgästen."
          kolumner={[
            { rubrik: 'Nr', rendera: (r) => <strong>#{r.arendenummer}</strong> },
            { rubrik: 'Datum', rendera: (r) => datum(r.createdAt) },
            { rubrik: 'Kategori', rendera: (r) => kategoriNamn(r.kategori) },
            { rubrik: 'Status', rendera: (r) => <StatusBadge status={r.status} namn={statusNamn(r.status)} /> },
          ]} />
      </section>

      <section className="mt-8">
        <h2 className="h3 mb-4">Dokument på hyresgästnivå</h2>
        <p className="mb-3 text-sm text-muted-ink">Ladda upp t.ex. hyresavtal via Dokument-modulen och koppla till hyresgästen.</p>
        <DataTable rader={dokument} tom="Inga dokument kopplade."
          kolumner={[
            { rubrik: 'Titel', rendera: (r) => <strong>{r.titel}</strong> },
            { rubrik: 'Kategori', rendera: (r) => r.kategori },
            { rubrik: 'Storlek', rendera: (r) => filstorlek(r.storlek) },
            { rubrik: 'Uppladdad', rendera: (r) => datum(r.createdAt) },
          ]} />
      </section>

      <Panel oppen={redigera} rubrik={`Redigera ${t.namn}`} onStang={() => setRedigera(false)}>
        <HyresgastForm befintlig={t} onKlar={() => { setRedigera(false); visa('Hyresgästen är sparad.'); laddaOm(); }} />
      </Panel>
      <Panel oppen={nyttTcy} rubrik="Nytt hyresförhållande" onStang={() => setNyttTcy(false)}>
        <TenancyForm tenantId={t._id} onKlar={() => { setNyttTcy(false); visa('Hyresförhållandet är skapat.'); laddaOm(); }} />
      </Panel>
      <Panel oppen={!!redTcy} rubrik="Redigera hyresförhållande" onStang={() => setRedTcy(null)}>
        {redTcy && (
          <>
            <TenancyForm befintlig={redTcy} tenantId={t._id} unitId={redTcy.unit?._id}
              onKlar={() => { setRedTcy(null); visa('Hyresförhållandet är sparat.'); laddaOm(); }} />
            <button className="btn-destructive btn-sm mt-6"
              onClick={() => gor(() => admin.taBortHyresforhallande(redTcy._id).then(() => setRedTcy(null)), 'Hyresförhållandet är borttaget.')}>
              Ta bort hyresförhållandet
            </button>
          </>
        )}
      </Panel>
      <ConfirmDialog oppen={bekrafta?.typ === 'inaktivera'} rubrik="Inaktivera portalkontot?"
        text="Hyresgästen kan inte längre logga in på Mina sidor. Kontot kan bjudas in på nytt senare."
        bekraftaText="Inaktivera" farlig={false} onAvbryt={() => setBekrafta(null)}
        onBekrafta={() => gor(() => admin.inaktiveraKonto(t._id), 'Kontot är inaktiverat.')} />
      <ConfirmDialog oppen={bekrafta?.typ === 'anonymisera'} rubrik="Anonymisera hyresgästen?"
        text="Personuppgifterna raderas permanent (GDPR). Ärendestatistiken behålls avidentifierad. Kräver att alla hyresförhållanden är avslutade. Åtgärden går inte att ångra."
        bekraftaText="Anonymisera" onAvbryt={() => setBekrafta(null)}
        onBekrafta={() => gor(() => admin.anonymisera(t._id), 'Hyresgästen är anonymiserad.')} />
    </>
  );
}
