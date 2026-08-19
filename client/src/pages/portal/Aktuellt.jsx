import { usePageMeta } from '../../lib/meta.js';
import { portal } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState } from '../../components/ui.jsx';
import { NewsItem } from '../../components/cards.jsx';

export default function PortalAktuellt() {
  usePageMeta({ title: 'Aktuellt för mig – Mina sidor | Fallens Fastigheter', noindex: true });
  const { data, laddar } = useAsync(() => portal.aktuellt(), []);
  return (
    <>
      <h1 className="h1">Aktuellt för mig</h1>
      <p className="ingress mt-2 max-w-2xl">Information som gäller din fastighet visas överst, följt av allmänna nyheter.</p>
      <div className="mt-8 max-w-3xl">
        {laddar ? <PageSpinner /> : !data?.length ? (
          <EmptyState rubrik="Ingen aktuell information just nu" text="Här dyker planerade arbeten och driftstörningar för din fastighet upp." />
        ) : (
          <div className="space-y-6">{data.map((p) => <NewsItem key={p._id} post={p} riktad={p.gallerMin} />)}</div>
        )}
      </div>
    </>
  );
}
