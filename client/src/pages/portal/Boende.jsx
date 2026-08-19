import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { portal } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState, Badge } from '../../components/ui.jsx';
import { BildYta } from '../../components/cards.jsx';
import { kr, datum, lokaltypNamn } from '../../lib/format.js';

const TENANCY_STATUS = { kommande: ['ny', 'Kommande'], pagaende: ['atgardad', 'Pågående'], uppsagd: ['pagaende', 'Uppsagt'], avslutad: ['stangd', 'Avslutat'] };

export default function PortalBoende() {
  usePageMeta({ title: 'Mitt boende – Mina sidor | Fallens Fastigheter', noindex: true });
  const { data, laddar, fel } = useAsync(() => portal.boende(), []);
  if (laddar) return <PageSpinner />;
  if (fel) return <EmptyState rubrik="Kunde inte hämta ditt boende" text={fel} cta="Kontakta oss" ctaTill="/kontakt" />;
  const boenden = data?.boenden || [];
  if (!boenden.length) return <EmptyState rubrik="Inget boende kopplat ännu" text="Ditt konto är inte kopplat till något hyresförhållande. Hör av dig så löser vi det." cta="Kontakta oss" ctaTill="/kontakt" />;

  return (
    <>
      <h1 className="h1">Mitt boende</h1>
      <div className="mt-8 space-y-10">
        {boenden.map((b) => {
          const u = b.unit || {};
          const f = u.property || {};
          const p = f.praktiskInfo || {};
          const [farg, namn] = TENANCY_STATUS[b.status] || ['neutral', b.status];
          const attr = u.attribut || {};
          const objektInfo = [
            ['Adress', u.adress], ['Beteckning', u.beteckning],
            ['Typ', u.typ === 'lokal' ? `Lokal · ${lokaltypNamn(u.lokaltyp)}` : 'Bostad'],
            u.rum && ['Rum', `${u.rum} rum`], u.ytaM2 && ['Yta', `${u.ytaM2} m²`],
            (u.vaning ?? '') !== '' && u.vaning != null && ['Våning', u.vaning],
            attr.forradIngar && ['Förråd', 'Ingår'], attr.parkering && ['Parkering', 'Ja'],
          ].filter(Boolean);
          const avtal = [
            ['Inflyttningsdatum', datum(b.startdatum)],
            ['Hyra', kr(b.hyraKrMan ?? u.hyraKrMan)],
            ['Uppsägningstid', 'Normalt 3 månader'],
            b.slutdatum && ['Slutdatum', datum(b.slutdatum)],
          ].filter(Boolean);
          const praktiskt = [['Bredband', p.bredband], ['Tvättstuga', p.tvattstuga], ['Parkering', p.parkering], ['Sopsortering', p.sopsortering], ['Övrigt', p.ovrigt]].filter(([, v]) => v);

          return (
            <section key={b._id} className="card overflow-hidden" aria-label={`Boende ${u.adress}`}>
              <div className="grid md:grid-cols-[1fr_1.8fr]">
                <div className="aspect-[3/2] md:aspect-auto md:h-full"><BildYta bild={f.bilder?.[0]} alt={f.namn} /></div>
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="h2">{u.adress}</h2>
                    <Badge color={farg}>{namn}</Badge>
                  </div>
                  <p className="mt-1 text-muted-ink">{f.namn}</p>

                  <div className="mt-6 grid gap-8 sm:grid-cols-2">
                    <div>
                      <h3 className="font-semibold uppercase text-xs tracking-wider text-muted-ink">Objektinformation</h3>
                      <dl className="mt-3 space-y-2 text-[15px]">
                        {objektInfo.map(([r, v]) => <div key={r} className="flex justify-between gap-4"><dt className="text-muted-ink">{r}</dt><dd className="font-medium text-right">{v}</dd></div>)}
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-semibold uppercase text-xs tracking-wider text-muted-ink">Avtalsinformation</h3>
                      <dl className="mt-3 space-y-2 text-[15px]">
                        {avtal.map(([r, v]) => <div key={r} className="flex justify-between gap-4"><dt className="text-muted-ink">{r}</dt><dd className="font-medium text-right">{v}</dd></div>)}
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-line bg-muted/50 p-6 md:p-8">
                <h3 className="h3">Min fastighet – {f.namn}</h3>
                {praktiskt.length ? (
                  <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 text-[15px]">
                    {praktiskt.map(([r, v]) => <div key={r}><dt className="font-semibold">{r}</dt><dd className="text-muted-ink">{v}</dd></div>)}
                  </dl>
                ) : <p className="mt-2 text-muted-ink">Praktisk information om fastigheten läggs in inom kort.</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                  {f.publicerad && f.slug && <Link to={`/fastigheter/${f.slug}`} className="btn-outline btn-sm">Se fastighetssidan</Link>}
                  <Link to="/hyresgast/utflyttning" className="btn-ghost btn-sm">Ska du flytta? →</Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
