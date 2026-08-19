import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, EmptyState, PageSpinner, Badge, Lightbox } from '../../components/ui.jsx';
import { BildYta, Ikon } from '../../components/cards.jsx';
import { LeadForm } from '../../components/LeadForm.jsx';
import { MapView } from '../../components/MapView.jsx';
import { kr, datum, ortNamn, lokaltypNamn, bildStorUrl, bildUrl } from '../../lib/format.js';

export default function ObjektDetalj({ typ }) {
  const { id } = useParams();
  const { data, laddar, fel } = useAsync(() => pub.objektDetalj(id), [id]);
  const [stor, setStor] = useState(null);
  const o = data;

  usePageMeta({
    title: o ? `${o.adress}, ${ortNamn(o.property?.ort)} – ledig ${o.typ === 'bostad' ? 'bostad' : 'lokal'} | Fallens Fastigheter` : 'Ledigt objekt | Fallens Fastigheter',
    description: o?.beskrivning?.slice(0, 155) || 'Ledigt objekt hos Fallens Fastigheter i Trollhättan eller Vänersborg.',
  });

  if (laddar) return <PageSpinner />;
  if (fel || !o) {
    return (
      <div className="container-site section max-w-2xl">
        <EmptyState rubrik="Objektet är inte längre ledigt"
          text="Det du letade efter har hyrts ut eller avpublicerats. Se andra lediga objekt eller anmäl intresse."
          cta={typ === 'lokal' ? 'Se alla lediga lokaler' : 'Se alla lediga bostäder'}
          ctaTill={typ === 'lokal' ? '/lokaler' : '/bostader'} />
      </div>
    );
  }

  const tillbaka = o.typ === 'bostad' ? ['/bostader', 'Lediga bostäder'] : ['/lokaler', 'Lediga lokaler'];
  const attr = o.attribut || {};
  const attribut = o.typ === 'bostad'
    ? [[attr.balkong, 'Balkong'], [attr.hiss, 'Hiss'], [attr.forradIngar, 'Förråd ingår'], [attr.parkering, 'Parkering']]
    : [[attr.takhojd, `Takhöjd ${attr.takhojd} m`], [attr.lastintag, 'Lastintag'], [attr.skyltlage, 'Skyltläge']];
  const fakta = [
    ['Typ', o.typ === 'bostad' ? 'Bostad' : `Lokal · ${lokaltypNamn(o.lokaltyp)}`],
    o.rum && ['Rum', `${o.rum} rum`],
    o.ytaM2 && ['Yta', `${o.ytaM2} m²`],
    o.vaning != null && o.vaning !== '' && ['Våning', o.vaning],
    ['Hyra', kr(o.hyraKrMan)],
    ['Tillträde', o.tilltradeDatum ? datum(o.tilltradeDatum) : 'Enligt överenskommelse'],
    o.beteckning && ['Objektnummer', o.beteckning],
  ].filter(Boolean);

  return (
    <div className="container-site section !pt-8">
      <nav aria-label="Brödsmulor" className="mb-6 text-sm text-muted-ink">
        <Link to={tillbaka[0]} className="hover:text-primary">← {tillbaka[1]}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {/* Bildgalleri */}
          <div className="overflow-hidden rounded-xl border border-line">
            <button className="block w-full aspect-[3/2]" onClick={() => o.bilder?.[0] && setStor(bildStorUrl(o.bilder[0]))} aria-label="Visa bild i större format">
              <BildYta bild={o.bilder?.[0]} alt={o.adress} />
            </button>
          </div>
          {o.bilder?.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {o.bilder.slice(1).map((b, i) => (
                <li key={i}>
                  <button className="block aspect-[3/2] w-full overflow-hidden rounded border border-line" onClick={() => setStor(bildStorUrl(b))}>
                    <img src={bildUrl(b)} alt={`Bild ${i + 2} av ${o.adress}`} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h1 className="h1 mt-8">{o.adress}</h1>
          <p className="mt-2 text-lg text-muted-ink">
            {ortNamn(o.property?.ort)} · <Link to={`/fastigheter/${o.property?.slug}`} className="text-primary hover:underline">{o.property?.namn}</Link>
          </p>

          {o.beskrivning && <div className="prose-fallens mt-6 max-w-prose whitespace-pre-line text-[17px]">{o.beskrivning}</div>}

          {attribut.some(([v]) => v) && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {attribut.filter(([v]) => v).map(([, n]) => <li key={n}><Badge color="neutral" className="!text-sm !px-3 !py-1">{n}</Badge></li>)}
            </ul>
          )}

          {o.planritning?.fil && (
            <p className="mt-6">
              <a href={bildStorUrl(o.planritning)} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                <Ikon namn="dokument" storlek={18} /> Visa planritning
              </a>
            </p>
          )}

          {o.property?.lat && (
            <div className="mt-10">
              <h2 className="h3 mb-3">Här ligger fastigheten</h2>
              <MapView hojd="h-[320px]" punkter={[{ lat: o.property.lat, lng: o.property.lng, namn: o.property.namn, adress: o.adress, till: `/fastigheter/${o.property.slug}` }]} />
            </div>
          )}
        </div>

        {/* Faktaruta + intresse */}
        <aside>
          <div className="card sticky top-24 p-6">
            <p className="text-3xl font-bold text-primary tabular-nums">{kr(o.hyraKrMan)}</p>
            <dl className="mt-5 space-y-3 text-[15px]">
              {fakta.map(([r, v]) => (
                <div key={r} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted-ink">{r}</dt><dd className="font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <a href="#intresse" className="btn-primary mt-6 w-full">Anmäl intresse</a>
          </div>
        </aside>
      </div>

      <div className="mt-16 max-w-2xl scroll-mt-24" id="intresse">
        <h2 className="h2 mb-2">Anmäl intresse för {o.adress}</h2>
        <p className="ingress mb-6">Fyll i dina uppgifter så återkommer vi till dig så snart vi kan.</p>
        <LeadForm typ={o.typ} unitId={o._id} knapp="Skicka intresseanmälan"
          meddelandeLabel="Berätta kort om dig och varför objektet passar" />
      </div>

      <Lightbox bild={stor} onStang={() => setStor(null)} />
    </div>
  );
}
