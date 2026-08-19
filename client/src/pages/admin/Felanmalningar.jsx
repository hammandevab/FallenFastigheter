import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, SearchInput, Badge, StatusBadge } from '../../components/ui.jsx';
import { AdminSida, DataTable, FilterRad, FilterSelect, Panel } from './adminUi.jsx';
import { NyttArendeForm } from './NyttArendeForm.jsx';
import { datum, statusNamn, kategoriNamn } from '../../lib/format.js';

export default function AdminFelanmalningar() {
  usePageMeta({ title: 'Felanmälningar – Förvaltning | Fallens Fastigheter', description: 'Hantera och följ upp felanmälningar i Fallens fastigheter.', noindex: true });
  const navigate = useNavigate();
  const { visa } = useToast();
  const [sok, setSok] = useState('');
  const [status, setStatus] = useState('oppna');
  const [kategori, setKategori] = useState('alla');
  const [akut, setAkut] = useState('alla');
  const [nytt, setNytt] = useState(false);
  const { data, laddar, laddaOm } = useAsync(() => admin.arenden({ sok, status, kategori, akut }), [sok, status, kategori, akut]);

  return (
    <AdminSida rubrik="Felanmälningar" beskrivning="Hantera och följ upp felanmälningar i Fallens fastigheter. Akuta ärenden sorteras överst."
      knapp={<button className="btn-primary" onClick={() => setNytt(true)}>Nytt ärende</button>}>
      <FilterRad>
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök namn, adress eller nummer …" className="w-72" />
        <FilterSelect label="Status" varde={status} onAndra={setStatus}
          alternativ={[['oppna', 'Öppna'], ['alla', 'Alla'], ['ny', 'Ny'], ['pagaende', 'Pågående'], ['vantar', 'Väntar'], ['atgardad', 'Åtgärdad'], ['stangd', 'Stängd'], ['avvisad', 'Avvisad']]} />
        <FilterSelect label="Kategori" varde={kategori} onAndra={setKategori}
          alternativ={[['alla', 'Alla'], ['vvs', 'VVS'], ['el', 'El'], ['varme', 'Värme'], ['vitvaror', 'Vitvaror'], ['dorr_fonster', 'Dörr & fönster'], ['tvattstuga', 'Tvättstuga'], ['gemensamma', 'Gemensamma'], ['annat', 'Annat']]} />
        <FilterSelect label="Akut" varde={akut} onAndra={setAkut} alternativ={[['alla', 'Alla'], ['ja', 'Endast akuta']]} />
      </FilterRad>
      <DataTable laddar={laddar} rader={data || []} onRad={(r) => navigate(`/admin/felanmalningar/${r._id}`)}
        tom="Inga ärenden matchar filtren – skönt när inkorgen är tom!"
        kolumner={[
          { rubrik: 'Nr', rendera: (r) => <strong className="tabular-nums">#{r.arendenummer}</strong> },
          { rubrik: 'Datum', rendera: (r) => datum(r.createdAt) },
          { rubrik: 'Namn', rendera: (r) => r.namn },
          { rubrik: 'Adress/objekt', rendera: (r) => r.unit?.adress || r.adress },
          { rubrik: 'Kategori', rendera: (r) => kategoriNamn(r.kategori) },
          { rubrik: 'Akut', rendera: (r) => r.akut ? <Badge color="akut">Akut</Badge> : '–' },
          { rubrik: 'Status', rendera: (r) => <StatusBadge status={r.status} namn={statusNamn(r.status)} /> },
          { rubrik: 'Tilldelad', rendera: (r) => r.tilldelad?.namn || '–' },
        ]} />
      <Panel oppen={nytt} rubrik="Registrera ärende åt hyresgäst" onStang={() => setNytt(false)} bred>
        <NyttArendeForm onKlar={(a) => { setNytt(false); visa(`Ärende #${a.arendenummer} skapat.`); laddaOm(); navigate(`/admin/felanmalningar/${a._id}`); }} />
      </Panel>
    </AdminSida>
  );
}
