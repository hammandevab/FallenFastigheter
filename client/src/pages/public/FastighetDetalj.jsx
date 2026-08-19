import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, EmptyState, PageSpinner, Badge } from '../../components/ui.jsx';
import { ObjectCard, ProjectCard, BildYta, Ikon } from '../../components/cards.jsx';
import { MapView } from '../../components/MapView.jsx';
import { ortNamn, bildUrl } from '../../lib/format.js';

export default function FastighetDetalj() {
  const { slug } = useParams();
  const { data, laddar, fel } = useAsync(() => pub.fastighet(slug), [slug]);
  const f = data?.fastighet;

  usePageMeta({
    title: f ? `${f.namn} – ${ortNamn(f.ort)} | Fallens Fastigheter` : 'Fastighet | Fallens Fastigheter',
    description: f?.beskrivning?.slice(0, 155) || 'En av Fallens Fastigheters fastigheter i Trollhättan eller Vänersborg.',
  });

  if (laddar) return <PageSpinner />;
  if (fel || !f) {
    return (
      <div className="container-site section max-w-2xl">
        <EmptyState rubrik="Fastigheten hittades inte" text="Den kan ha avpublicerats. Se hela vårt bestånd i stället."
          cta="Se alla fastigheter" ctaTill="/fastigheter" />
      </div>
    );
  }

  const p = f.praktiskInfo || {};
  const praktiskt = [['Bredband', p.bredband], ['Tvättstuga', p.tvattstuga], ['Parkering', p.parkering], ['Sopsortering', p.sopsortering], ['Övrigt', p.ovrigt]].filter(([, v]) => v);

  return (
    <div className="container-site section !pt-8">
      <nav aria-label="Brödsmulor" className="mb-6 text-sm text-muted-ink">
        <Link to="/fastigheter" className="hover:text-primary">← Våra fastigheter</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-xl border border-line aspect-[3/2]">
            <BildYta bild={f.bilder?.[0]} alt={f.namn} />
          </div>
          {f.bilder?.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {f.bilder.slice(1).map((b, i) => (
                <li key={i} className="aspect-[3/2] overflow-hidden rounded border border-line">
                  <img src={bildUrl(b)} alt={`Bild ${i + 2} av ${f.namn}`} loading="lazy" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <h1 className="h1">{f.namn}</h1>
            <Badge color="ort">{ortNamn(f.ort)}</Badge>
          </div>
          <p className="mt-2 text-lg text-muted-ink">{f.adress}{f.byggAr ? ` · Byggår ${f.byggAr}` : ''}</p>
          {f.beskrivning && <div className="prose-fallens mt-6 max-w-prose whitespace-pre-line text-[17px]">{f.beskrivning}</div>}

          {praktiskt.length > 0 && (
            <div className="card mt-8 p-6">
              <h2 className="h3 flex items-center gap-2"><Ikon namn="info" className="text-primary" /> Praktisk information</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 text-[15px]">
                {praktiskt.map(([r, v]) => (
                  <div key={r}><dt className="font-semibold">{r}</dt><dd className="text-muted-ink">{v}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </div>
        <aside>
          {f.lat ? <MapView hojd="h-[340px]" punkter={[{ lat: f.lat, lng: f.lng, namn: f.namn, adress: f.adress }]} /> : null}
          <div className="card mt-6 p-6">
            <h2 className="h3">Intresserad av att bo eller verka här?</h2>
            <p className="mt-2 text-muted-ink">Se lediga objekt nedan eller anmäl intresse så hör vi av oss.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/bostader" className="btn-outline btn-sm">Lediga bostäder</Link>
              <Link to="/lokaler" className="btn-outline btn-sm">Lediga lokaler</Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-14">
        <h2 className="h2 mb-6">Lediga objekt i {f.namn}</h2>
        {data.lediga?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.lediga.map((o) => <ObjectCard key={o._id} objekt={{ ...o, property: f }} />)}
          </div>
        ) : (
          <EmptyState rubrik="Inga lediga objekt i den här fastigheten just nu"
            text="Anmäl ditt intresse så kontaktar vi dig när något blir ledigt."
            cta="Anmäl intresse" ctaTill="/bostader#intresse" />
        )}
      </section>

      {data.projekt?.length > 0 && (
        <section className="mt-14">
          <h2 className="h2 mb-6">Pågående utveckling</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {data.projekt.map((pr) => <ProjectCard key={pr._id} projekt={{ ...pr, property: f }} />)}
          </div>
        </section>
      )}
    </div>
  );
}
