import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { portal } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState, StatusBadge, Badge, Tabs } from '../../components/ui.jsx';
import { datum, statusNamn, kategoriNamn } from '../../lib/format.js';

const FLIKAR = [['alla', 'Alla'], ['ny', 'Nya'], ['pagaende', 'Pågående'], ['vantar', 'Väntar'], ['atgardad', 'Åtgärdade'], ['stangd', 'Stängda']];

export default function PortalArenden() {
  usePageMeta({ title: 'Mina felanmälningar – Mina sidor | Fallens Fastigheter', noindex: true });
  const [status, setStatus] = useState('alla');
  const { data, laddar } = useAsync(() => portal.arenden({ status }), [status]);
  const arenden = data || [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="h1">Mina felanmälningar</h1>
        <Link to="/mina-sidor/felanmalningar/ny" className="btn-primary">Gör en felanmälan</Link>
      </div>
      <div className="mt-6">
        <Tabs flikar={FLIKAR.map(([id, namn]) => ({ id, namn }))} aktiv={status} onValj={setStatus} />
      </div>
      <div className="mt-6">
        {laddar ? <PageSpinner /> : arenden.length === 0 ? (
          <EmptyState rubrik={status === 'alla' ? 'Inga ärenden ännu' : 'Inga ärenden med den statusen'}
            text={status === 'alla' ? 'När du gör en felanmälan följer du den här – från mottagen till åtgärdad.' : 'Byt flik för att se dina övriga ärenden.'}
            cta={status === 'alla' ? 'Gör en felanmälan' : undefined} ctaTill="/mina-sidor/felanmalningar/ny" />
        ) : (
          <ul className="space-y-3">
            {arenden.map((a) => (
              <li key={a._id}>
                <Link to={`/mina-sidor/felanmalningar/${a._id}`} className="card card-hover flex flex-wrap items-center gap-x-5 gap-y-2 p-5">
                  <span className="font-bold text-primary tabular-nums">#{a.arendenummer}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium truncate">{a.beskrivning?.slice(0, 70)}</span>
                    <span className="text-sm text-muted-ink">{datum(a.createdAt)} · {kategoriNamn(a.kategori)}</span>
                  </span>
                  {a.akut && <Badge color="akut">Akut</Badge>}
                  <StatusBadge status={a.status} namn={statusNamn(a.status)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
