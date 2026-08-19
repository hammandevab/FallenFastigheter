import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, SearchInput, Badge } from '../../components/ui.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel } from './adminUi.jsx';
import { HyresgastForm } from './HyresgastForm.jsx';

const PORTAL = { aktiv: ['atgardad', 'Aktiv'], inbjuden: ['ny', 'Inbjuden'], inaktiverad: ['stangd', 'Inaktiverad'], inget_konto: ['neutral', 'Inget konto'] };

export default function AdminHyresgaster() {
  usePageMeta({ title: 'Hyresgäster – Förvaltning | Fallens Fastigheter', description: 'Sökbar lista över hyresgäster kopplade till objekt och fastigheter.', noindex: true });
  const navigate = useNavigate();
  const { visa } = useToast();
  const [sok, setSok] = useState('');
  const [portal, setPortal] = useState('alla');
  const [ny, setNy] = useState(false);
  const { data, laddar, laddaOm } = useAsync(() => admin.hyresgaster({ sok, portal }), [sok, portal]);

  return (
    <AdminSida rubrik="Hyresgäster" beskrivning="Sökbar lista över hyresgäster kopplade till objekt och fastigheter."
      knapp={<button className="btn-primary" onClick={() => setNy(true)}>Ny hyresgäst</button>}>
      <FilterRad>
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök namn, e-post eller adress …" className="w-72" />
        <FilterSelect label="Portalstatus" varde={portal} onAndra={setPortal}
          alternativ={[['alla', 'Alla'], ['aktiv', 'Aktiv'], ['inbjuden', 'Inbjuden'], ['inget_konto', 'Inget konto'], ['inaktiverad', 'Inaktiverad']]} />
      </FilterRad>
      <DataTable laddar={laddar} rader={data || []} onRad={(r) => navigate(`/admin/hyresgaster/${r._id}`)}
        tom="Inga hyresgäster matchar sökningen."
        kolumner={[
          { rubrik: 'Namn', rendera: (r) => <strong>{r.namn}</strong> },
          { rubrik: 'Typ', rendera: (r) => r.typ === 'foretag' ? 'Företag' : 'Privat' },
          { rubrik: 'E-post', rendera: (r) => r.epost || '–' },
          { rubrik: 'Telefon', rendera: (r) => r.telefon || '–' },
          { rubrik: 'Objekt', rendera: (r) => r.objektAdresser?.join(', ') || '–' },
          { rubrik: 'Fastighet', rendera: (r) => r.fastigheter?.join(', ') || '–' },
          { rubrik: 'Portal', rendera: (r) => { const [c, n] = PORTAL[r.portalstatus] || PORTAL.inget_konto; return <Badge color={c}>{n}</Badge>; } },
        ]} />
      <Panel oppen={ny} rubrik="Ny hyresgäst" onStang={() => setNy(false)}>
        <HyresgastForm onKlar={(t) => { setNy(false); visa('Hyresgästen är skapad.'); laddaOm(); navigate(`/admin/hyresgaster/${t._id}`); }} />
      </Panel>
    </AdminSida>
  );
}
