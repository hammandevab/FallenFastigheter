import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState } from '../../components/ui.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { NewsItem } from '../../components/cards.jsx';

export default function AktuelltPublik() {
  usePageMeta({
    title: 'Aktuell information till hyresgäster | Fallens Fastigheter',
    description: 'Planerade arbeten, renoveringar, driftstörningar och annan aktuell information till dig som hyresgäst.',
  });
  const { data, laddar } = useAsync(() => pub.aktuellt(), []);
  return (
    <>
      <PageHeader rubrik="Aktuell information"
        ingress="Här publicerar vi planerade arbeten, driftstörningar, förbättringar och annan viktig information till dig som hyresgäst." />
      <div className="container-site section !pt-8 max-w-3xl">
        {laddar ? <PageSpinner /> : !data?.length ? (
          <EmptyState rubrik="Ingen aktuell information just nu"
            text="Här dyker planerade arbeten och driftstörningar upp när något är på gång. Just nu rullar allt på som vanligt."
            cta="Till hyresgästsidan" ctaTill="/hyresgast" />
        ) : (
          <div className="space-y-6">{data.map((p) => <NewsItem key={p._id} post={p} />)}</div>
        )}
      </div>
    </>
  );
}
