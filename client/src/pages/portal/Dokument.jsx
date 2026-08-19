import { usePageMeta } from '../../lib/meta.js';
import { portal } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState } from '../../components/ui.jsx';
import { DocumentRow } from '../../components/cards.jsx';

const NIVA = { koncern: 'Allmänna dokument', fastighet: 'Din fastighet', objekt: 'Ditt objekt', hyresgast: 'Dina personliga dokument' };
const ORDNING = ['hyresgast', 'objekt', 'fastighet', 'koncern'];

export default function PortalDokument() {
  usePageMeta({ title: 'Mina dokument – Mina sidor | Fallens Fastigheter', noindex: true });
  const { data, laddar, fel } = useAsync(() => portal.dokument(), []);
  if (laddar) return <PageSpinner />;
  if (fel) return <EmptyState rubrik="Kunde inte hämta dokument" text={fel} cta="Kontakta oss" ctaTill="/kontakt" />;
  const grupper = ORDNING.map((n) => [n, (data || []).filter((d) => d.niva === n)]).filter(([, d]) => d.length);

  return (
    <>
      <h1 className="h1">Mina dokument</h1>
      <p className="ingress mt-2 max-w-2xl">Dokument för dig, ditt objekt och din fastighet – plus allmänna blanketter.</p>
      <div className="mt-8">
        {grupper.length === 0 ? (
          <EmptyState rubrik="Inga dokument ännu" text="Saknar du något dokument, till exempel ditt hyresavtal?" cta="Kontakta oss så hjälper vi dig" ctaTill="/kontakt" />
        ) : (
          <div className="space-y-10">
            {grupper.map(([niva, dok]) => (
              <section key={niva} aria-labelledby={`pd-${niva}`}>
                <h2 id={`pd-${niva}`} className="h3 mb-4">{NIVA[niva]}</h2>
                <ul className="space-y-3">
                  {dok.map((d) => <DocumentRow key={d._id} dok={d} href={`/api/v1/filer/dokument/${d._id}`} />)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
