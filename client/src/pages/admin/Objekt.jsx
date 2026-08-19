import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, SearchInput, Badge } from '../../components/ui.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel, PubBadge } from './adminUi.jsx';
import { ObjektForm } from './ObjektForm.jsx';
import { kr, datum, ortNamn } from '../../lib/format.js';

const STATUS = { ledig: ['atgardad', 'Ledig'], uthyrd: ['stangd', 'Uthyrd'], kommande: ['ny', 'Kommande'] };

export default function AdminObjekt() {
  usePageMeta({ title: 'Objekt – Förvaltning | Fallens Fastigheter', description: 'Alla bostäder och lokaler kopplade till Fallens fastigheter.', noindex: true });
  const navigate = useNavigate();
  const { visa } = useToast();
  const [sok, setSok] = useState('');
  const [typ, setTyp] = useState('alla');
  const [status, setStatus] = useState('alla');
  const [pub, setPub] = useState('alla');
  const [ny, setNy] = useState(false);
  const { data, laddar, laddaOm } = useAsync(() => admin.objektLista({ sok, typ, status, publicerad: pub }), [sok, typ, status, pub]);

  return (
    <AdminSida rubrik="Objekt" beskrivning="Alla bostäder och lokaler kopplade till Fallens fastigheter."
      knapp={<button className="btn-primary" onClick={() => setNy(true)}>Nytt objekt</button>}>
      <FilterRad>
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök adress eller beteckning …" className="w-64" />
        <FilterSelect label="Typ" varde={typ} onAndra={setTyp} alternativ={[['alla', 'Alla'], ['bostad', 'Bostad'], ['lokal', 'Lokal']]} />
        <FilterSelect label="Status" varde={status} onAndra={setStatus} alternativ={[['alla', 'Alla'], ['ledig', 'Ledig'], ['uthyrd', 'Uthyrd'], ['kommande', 'Kommande']]} />
        <FilterSelect label="Publicering" varde={pub} onAndra={setPub} alternativ={[['alla', 'Alla'], ['ja', 'Publicerade'], ['nej', 'Ej publicerade']]} />
      </FilterRad>
      <DataTable laddar={laddar} rader={data || []} onRad={(r) => navigate(`/admin/objekt/${r._id}`)}
        tom="Inga objekt matchar filtren."
        kolumner={[
          { rubrik: 'Beteckning', rendera: (r) => r.beteckning || '–' },
          { rubrik: 'Typ', rendera: (r) => r.typ === 'bostad' ? 'Bostad' : 'Lokal' },
          { rubrik: 'Adress', rendera: (r) => <strong>{r.adress}</strong> },
          { rubrik: 'Fastighet', rendera: (r) => `${r.property?.namn || '–'} (${ortNamn(r.property?.ort)})` },
          { rubrik: 'Yta', rendera: (r) => r.ytaM2 ? `${r.ytaM2} m²` : '–' },
          { rubrik: 'Hyra', rendera: (r) => kr(r.hyraKrMan) },
          { rubrik: 'Status', rendera: (r) => { const [c, n] = STATUS[r.status] || ['neutral', r.status]; return <Badge color={c}>{n}</Badge>; } },
          { rubrik: 'Publicering', rendera: (r) => <PubBadge pub={r.publicerad} /> },
          { rubrik: 'Tillträde', rendera: (r) => r.tilltradeDatum ? datum(r.tilltradeDatum) : '–' },
        ]} />
      <Panel oppen={ny} rubrik="Nytt objekt" onStang={() => setNy(false)} bred>
        <ObjektForm onKlar={(o) => { setNy(false); visa('Objektet är skapat.'); laddaOm(); navigate(`/admin/objekt/${o._id}`); }} />
      </Panel>
    </AdminSida>
  );
}
