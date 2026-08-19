import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState, SearchInput } from '../../components/ui.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { Accordion } from '../../components/Accordion.jsx';

export default function Faq() {
  usePageMeta({
    title: 'Vanliga frågor för hyresgäster | Fallens Fastigheter',
    description: 'Svar på vanliga frågor om felanmälan, hyra, nycklar, tvättstuga, förråd, parkering och in- och utflyttning hos Fallens Fastigheter.',
  });
  const { data, laddar } = useAsync(() => pub.faq(), []);
  const [sok, setSok] = useState('');
  const kategorier = useMemo(() => {
    const q = sok.trim().toLowerCase();
    return (data || [])
      .map((k) => ({
        ...k,
        fragor: (k.fragor || []).filter((f) => !q || f.fraga.toLowerCase().includes(q) || (f.svar || '').toLowerCase().includes(q)),
      }))
      .filter((k) => k.fragor.length > 0);
  }, [data, sok]);

  return (
    <>
      <PageHeader rubrik="Vanliga frågor" ingress="Sök bland frågor och svar. Hittar du inte det du söker – hör av dig till oss." />
      <div className="container-site section !pt-8 max-w-3xl">
        <SearchInput varde={sok} onAndra={setSok} placeholder="Sök bland frågorna …" className="mb-8" />
        {laddar ? <PageSpinner /> : kategorier.length === 0 ? (
          <EmptyState rubrik={sok ? 'Inga frågor matchar din sökning' : 'Inga frågor publicerade ännu'}
            text="Hör av dig till oss så hjälper vi dig direkt." cta="Kontakta oss" ctaTill="/kontakt" />
        ) : (
          <div className="space-y-10">
            {kategorier.map((k) => (
              <section key={k._id} aria-labelledby={`faq-${k._id}`}>
                <h2 id={`faq-${k._id}`} className="h3 mb-4">{k.namn}</h2>
                <Accordion poster={k.fragor.map((f) => ({ id: f._id, fraga: f.fraga, svar: f.svar }))} />
              </section>
            ))}
          </div>
        )}
        <div className="card mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="h3">Hittade du inte svaret?</h2>
            <p className="mt-1 text-muted-ink">Kontakta oss så hjälper vi dig.</p>
          </div>
          <Link to="/kontakt" className="btn-primary shrink-0">Kontakta oss</Link>
        </div>
      </div>
    </>
  );
}
