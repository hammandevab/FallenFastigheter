import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, SearchInput, Badge } from '../../components/ui.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel, PubBadge } from './adminUi.jsx';
import { FastighetForm } from './FastighetForm.jsx';
import { ortNamn } from '../../lib/format.js';

export default function AdminFastigheter() {
  usePageMeta({ title: 'Fastigheter – Förvaltning | Fallens Fastigheter', description: 'Intern översikt över Fallens fastigheter, objekt och ärenden.', noindex: true });
  const navigate = useNavigate();
  const { visa } = useToast();
  const [sok, setSok] = useState('');
  const [ort, setOrt] = useState('alla');
  const [pub, setPub] = useState('alla');
  const [ny, setNy] = useState(false);
  const { data, laddar, laddaOm } = useAsync(() => admin.fastigheter({ sok, ort, publicerad: pub }), [sok, ort, pub]);

  return (
    <AdminSida rubrik="Fastigheter" beskrivning="Intern översikt över Fallens fastigheter, objekt och ärenden."
      knapp={<button className="btn-primary" onClick={() => setNy(true)}>Ny fastighet</button>}>
      <FilterRad>
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök namn eller adress …" className="w-64" />
        <FilterSelect label="Ort" varde={ort} onAndra={setOrt} alternativ={[['alla', 'Alla'], ['trollhattan', 'Trollhättan'], ['vanersborg', 'Vänersborg']]} />
        <FilterSelect label="Status" varde={pub} onAndra={setPub} alternativ={[['alla', 'Alla'], ['ja', 'Publicerade'], ['nej', 'Ej publicerade']]} />
      </FilterRad>
      <DataTable laddar={laddar} rader={data || []} onRad={(r) => navigate(`/admin/fastigheter/${r._id}`)}
        tom="Inga fastigheter ännu – skapa den första."
        kolumner={[
          { rubrik: 'Namn', rendera: (r) => <strong>{r.namn}</strong> },
          { rubrik: 'Adress', rendera: (r) => r.adress },
          { rubrik: 'Ort', rendera: (r) => <Badge color="ort">{ortNamn(r.ort)}</Badge> },
          { rubrik: 'Objekt', rendera: (r) => `${r.antalObjekt ?? 0} (varav ${r.lediga ?? 0} lediga)` },
          { rubrik: 'Öppna ärenden', rendera: (r) => r.oppnaArenden ?? 0 },
          { rubrik: 'Publicering', rendera: (r) => <PubBadge pub={r.publicerad} /> },
        ]} />
      <Panel oppen={ny} rubrik="Ny fastighet" onStang={() => setNy(false)} bred>
        <FastighetForm onKlar={(f) => { setNy(false); visa('Fastigheten är skapad.'); laddaOm(); navigate(`/admin/fastigheter/${f._id}`); }} />
      </Panel>
    </AdminSida>
  );
}
