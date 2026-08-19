import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { portal } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState, StatusBadge, Badge } from '../../components/ui.jsx';
import { Ikon, NewsItem } from '../../components/cards.jsx';
import { kr, datum, statusNamn } from '../../lib/format.js';

export default function PortalOversikt() {
  usePageMeta({ title: 'Mina sidor | Fallens Fastigheter', noindex: true });
  const { user } = useAuth();
  const { data, laddar, fel } = useAsync(() => portal.oversikt(), []);
  const fornamn = (user?.namn || '').split(' ')[0];

  if (laddar) return <PageSpinner />;
  if (fel) {
    return <EmptyState rubrik="Kontot är inte kopplat ännu" text={fel} cta="Kontakta oss" ctaTill="/kontakt" />;
  }
  const { boenden = [], arenden = [], aktuellt = [] } = data || {};

  return (
    <>
      <h1 className="h1">Hej {fornamn}</h1>
      <p className="ingress mt-2">Här är läget för ditt boende just nu.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Mitt boende */}
        <section className="card p-6 lg:col-span-1" aria-labelledby="ov-boende">
          <h2 id="ov-boende" className="h3">Mitt boende</h2>
          {boenden.length === 0 ? (
            <p className="mt-3 text-muted-ink">Inget aktivt hyresförhållande är kopplat till ditt konto ännu.</p>
          ) : boenden.map((b) => (
            <div key={b._id} className="mt-4 border-t border-line pt-4 first:mt-3 first:border-0 first:pt-0">
              <p className="font-semibold">{b.unit?.adress}</p>
              <p className="text-sm text-muted-ink">{b.unit?.typ === 'lokal' ? 'Lokal' : 'Bostad'} · {b.unit?.property?.namn}</p>
              <p className="mt-2 text-sm">
                {[b.unit?.rum && `${b.unit.rum} rum`, b.unit?.ytaM2 && `${b.unit.ytaM2} m²`, kr(b.hyraKrMan ?? b.unit?.hyraKrMan)].filter(Boolean).join(' · ')}
              </p>
            </div>
          ))}
          <Link to="/mina-sidor/boende" className="mt-4 inline-block font-semibold text-primary hover:underline">Visa mitt boende →</Link>
        </section>

        {/* Mina ärenden */}
        <section className="card p-6 lg:col-span-1" aria-labelledby="ov-arenden">
          <h2 id="ov-arenden" className="h3">Mina ärenden</h2>
          {arenden.length === 0 ? (
            <p className="mt-3 text-muted-ink">Inga felanmälningar ännu – skönt när allt fungerar!</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {arenden.map((a) => (
                <li key={a._id}>
                  <Link to={`/mina-sidor/felanmalningar/${a._id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 hover:border-primary transition-colors">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">#{a.arendenummer} · {a.beskrivning?.slice(0, 40)}</span>
                      <span className="text-sm text-muted-ink">{datum(a.createdAt)}</span>
                    </span>
                    <StatusBadge status={a.status} namn={statusNamn(a.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/mina-sidor/felanmalningar" className="mt-4 inline-block font-semibold text-primary hover:underline">Visa alla →</Link>
        </section>

        {/* Aktuellt */}
        <section className="card p-6 lg:col-span-1" aria-labelledby="ov-aktuellt">
          <h2 id="ov-aktuellt" className="h3">Aktuellt</h2>
          {aktuellt.length === 0 ? (
            <p className="mt-3 text-muted-ink">Ingen aktuell information just nu.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {aktuellt.map((p) => (
                <li key={p._id} className="rounded-lg border border-line p-3">
                  <p className="font-medium leading-snug">{p.rubrik}</p>
                  <p className="text-sm text-muted-ink">{datum(p.publiceradFran || p.createdAt)}{p.property ? ` · ${p.property.namn}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/mina-sidor/aktuellt" className="mt-4 inline-block font-semibold text-primary hover:underline">Visa allt →</Link>
        </section>
      </div>

      {/* Snabbåtgärder */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[['Gör en felanmälan', '/mina-sidor/felanmalningar/ny', 'verktyg'], ['Visa dokument', '/mina-sidor/dokument', 'dokument'], ['Kontakta oss', '/kontakt', 'telefon']].map(([t, till, ikon]) => (
          <Link key={till} to={till} className="card card-hover flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-primary"><Ikon namn={ikon} /></span>
            <span className="font-semibold">{t}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
