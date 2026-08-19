import { Link, useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { admin } from '../../lib/api.js';
import { useAsync, PageSpinner, StatusBadge, Badge } from '../../components/ui.jsx';
import { KpiCard } from './adminUi.jsx';
import { datum, statusNamn, leadTypNamn, kategoriNamn } from '../../lib/format.js';

export default function AdminOversikt() {
  usePageMeta({ title: 'Översikt – Förvaltning | Fallens Fastigheter', description: 'Intern översikt över fastigheter, objekt, hyresgäster och felanmälningar.', noindex: true });
  const navigate = useNavigate();
  const { data, laddar } = useAsync(() => admin.stats(), []);
  const diag = useAsync(() => admin.diagnostik(), []);
  if (laddar) return <PageSpinner />;
  const { kpi = {}, senasteArenden = [], senasteLeads = [] } = data || {};

  return (
    <>
      <h1 className="h2 mb-6">Översikt</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard etikett="Fastigheter" varde={kpi.fastigheter?.totalt ?? 0} under={`${kpi.fastigheter?.publicerade ?? 0} publicerade`} />
        <KpiCard etikett="Objekt" varde={kpi.objekt?.totalt ?? 0} under={`${kpi.objekt?.lediga ?? 0} lediga · ${kpi.objekt?.publicerade ?? 0} publicerade`} />
        <KpiCard etikett="Aktiva hyresgäster" varde={kpi.hyresgaster ?? 0} />
        <KpiCard etikett="Öppna felanmälningar" varde={kpi.felanmalningar?.oppna ?? 0} under={`${kpi.felanmalningar?.akuta ?? 0} akuta`} varning={(kpi.felanmalningar?.akuta ?? 0) > 0} />
        <KpiCard etikett="Nya leads (7 dagar)" varde={kpi.nyaLeads ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="ao-arenden">
          <div className="flex items-center justify-between">
            <h2 id="ao-arenden" className="h3">Senaste felanmälningarna</h2>
            <Link to="/admin/felanmalningar" className="text-sm font-semibold text-primary hover:underline">Alla →</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {senasteArenden.length === 0 && <li className="py-6 text-center text-muted-ink">Inga ärenden ännu.</li>}
            {senasteArenden.map((a) => (
              <li key={a._id}>
                <button className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/50 px-2 -mx-2 rounded" onClick={() => navigate(`/admin/felanmalningar/${a._id}`)}>
                  <span className="font-bold text-primary tabular-nums">#{a.arendenummer}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.beskrivning?.slice(0, 55)}</span>
                    <span className="text-sm text-muted-ink">{datum(a.createdAt)} · {kategoriNamn(a.kategori)}{a.property ? ` · ${a.property.namn}` : ''}</span>
                  </span>
                  {a.akut && <Badge color="akut">Akut</Badge>}
                  <StatusBadge status={a.status} namn={statusNamn(a.status)} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="ao-leads">
          <div className="flex items-center justify-between">
            <h2 id="ao-leads" className="h3">Senaste leads</h2>
            <Link to="/admin/leads" className="text-sm font-semibold text-primary hover:underline">Alla →</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {senasteLeads.length === 0 && <li className="py-6 text-center text-muted-ink">Inga leads ännu.</li>}
            {senasteLeads.map((l) => (
              <li key={l._id}>
                <button className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/50 px-2 -mx-2 rounded" onClick={() => navigate('/admin/leads')}>
                  <Badge color="ort">{leadTypNamn(l.typ)}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{l.namn}</span>
                    <span className="block truncate text-sm text-muted-ink">{l.meddelande?.slice(0, 60)}</span>
                  </span>
                  <span className="text-sm text-muted-ink">{datum(l.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {diag.data && (
        <section className="card mt-6 p-5" aria-labelledby="ao-diag">
          <h2 id="ao-diag" className="h3">Systemstatus</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {diag.data.checks?.map((c) => (
              <li key={c.id} className="flex items-start gap-2 rounded border border-line p-3 text-sm">
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${c.status === 'pass' ? 'bg-status-atgardad' : c.status === 'warn' ? 'bg-status-pagaende' : 'bg-destructive'}`} aria-hidden="true" />
                <span><strong>{c.etikett}</strong>{c.detalj ? <span className="block text-muted-ink">{c.detalj}</span> : null}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
