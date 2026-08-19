import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, EmptyState, PageSpinner } from '../../components/ui.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { PropertyCard } from '../../components/cards.jsx';
import { MapView } from '../../components/MapView.jsx';

export default function Fastigheter() {
  usePageMeta({
    title: 'Våra fastigheter i Trollhättan och Vänersborg | Fallens Fastigheter',
    description: 'Ett bestånd med bostäder och lokaler i Trollhättan och Vänersborg. Se alla Fallens Fastigheters hus på kartan.',
  });
  const { data, laddar } = useAsync(() => pub.fastigheter(), []);
  const fastigheter = data || [];
  return (
    <>
      <PageHeader rubrik="Våra fastigheter" ingress="Bostäder och lokaler i Trollhättan och Vänersborg – hus vi känner, sköter och utvecklar." bred />
      <div className="container-site section !pt-8">
        {laddar ? <PageSpinner /> : fastigheter.length === 0 ? (
          <EmptyState rubrik="Inga fastigheter publicerade ännu" text="Vi fyller på med våra hus här inom kort." cta="Kontakta oss" ctaTill="/kontakt" />
        ) : (
          <>
            <MapView punkter={fastigheter.map((f) => ({ lat: f.lat, lng: f.lng, namn: f.namn, adress: f.adress, till: `/fastigheter/${f.slug}` }))} />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fastigheter.map((f) => <PropertyCard key={f._id} fastighet={f} />)}
            </div>
          </>
        )}
      </div>
    </>
  );
}
