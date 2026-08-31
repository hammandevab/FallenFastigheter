import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useSite } from '../../context/SiteContext.jsx';
import { pub } from '../../lib/api.js';
import { useAsync, SectionHeading, EmptyState, PageSpinner } from '../../components/ui.jsx';
import { ObjectCard, ValueCard, LinkCard, Ikon } from '../../components/cards.jsx';

const VARDEN = [
  ['ora', 'Lyhörda', 'Vi lyssnar på våra hyresgäster och på vad våra fastigheter behöver.'],
  ['blixt', 'Drivande', 'Vi nöjer oss inte med att göra det nödvändiga. Vi ser möjligheter och utvecklar våra fastigheter.'],
  ['puzzel', 'Flexibla', 'Vi försöker hitta lösningar som fungerar för människor, företag och fastigheter.'],
  ['hus', 'Närvarande', 'Vi vill vara en fastighetsägare som syns, går att få tag på och tar ansvar.'],
];

function Teaser({ rubrik, under, objekt, laddar, tomRubrik, tomText, tomCta, listLank, listText, ankareLank, ankareText }) {
  return (
    <section className="section">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <h2 className="h2">{rubrik}</h2>
            <p className="ingress mt-2">{under}</p>
          </div>
          <Link to={listLank} className="btn-outline btn-sm shrink-0">{listText}</Link>
        </div>
        {laddar ? <PageSpinner /> : objekt.length === 0 ? (
          <EmptyState rubrik={tomRubrik} text={tomText} cta={tomCta} ctaTill={ankareLank} />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {objekt.slice(0, 3).map((o) => <ObjectCard key={o._id} objekt={o} />)}
            </div>
            <p className="mt-6"><Link to={ankareLank} className="font-semibold text-primary hover:underline">{ankareText} →</Link></p>
          </>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta({
    title: 'Fallens Fastigheter – hyreslägenheter och lokaler i Trollhättan & Vänersborg',
    description: 'Vi ser möjligheterna i våra fastigheter. Lediga hyreslägenheter och lokaler i Trollhättan och Vänersborg – hos en aktiv, lyhörd och lokal hyresvärd.',
  });
  const { site } = useSite();
  const bostader = useAsync(() => pub.objekt({ typ: 'bostad' }), []);
  const lokaler = useAsync(() => pub.objekt({ typ: 'lokal' }), []);
  const bestand = site?.bestand || {};

  return (
    <>
      {/* 1. Hero */}
      <section className="relative isolate overflow-hidden bg-primary-dark text-white">
        <img src="/images/hero.jpg" alt="" aria-hidden="true" fetchpriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/70 to-primary-dark/30" aria-hidden="true" />
        <div className="container-site relative py-24 md:py-36">
          <p className="overline-badge !text-accent">Trollhättan · Vänersborg</p>
          <h1 className="h1 mt-4 max-w-3xl">Vi ser möjligheterna i våra fastigheter.</h1>
          <p className="ingress mt-5 max-w-2xl !text-white/85">
            Fallens Fastigheter är en aktiv och lyhörd fastighetsägare med hyresbostäder, lokaler och
            fastighetsförvaltning i Trollhättan och Vänersborg. Vi finns nära våra hus och våra hyresgäster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/bostader" className="btn-primary !bg-accent !text-ink hover:!bg-[#B8965F]">Jag söker bostad</Link>
            <Link to="/lokaler" className="btn bg-white/12 text-white border border-white/30 hover:bg-white/20">Jag söker lokal</Link>
            <Link to="/hyresgast" className="btn bg-white/12 text-white border border-white/30 hover:bg-white/20">Jag är hyresgäst</Link>
          </div>
        </div>
      </section>

      {/* 2. Lediga bostäder */}
      <Teaser rubrik="Lediga bostäder" under="Trygga hyresrätter hos en hyresvärd som bryr sig"
        objekt={bostader.data || []} laddar={bostader.laddar}
        tomRubrik="Inga lediga bostäder publicerade just nu"
        tomText="Anmäl ditt intresse så hör vi av oss när något som passar dig blir ledigt."
        tomCta="Anmäl intresse" listLank="/bostader" listText="Se alla lediga bostäder"
        ankareLank="/bostader#intresse" ankareText="Anmäl intresse" />

      {/* 3. Lediga lokaler */}
      <div className="bg-muted/60">
        <Teaser rubrik="Lediga lokaler" under="Kontor, butik, lager eller verkstad – vi försöker hitta lösningar"
          objekt={lokaler.data || []} laddar={lokaler.laddar}
          tomRubrik="Inga lediga lokaler just nu"
          tomText="Berätta vad du söker – vi återkommer när rätt lokal dyker upp eller kan skapas."
          tomCta="Berätta vad du söker" listLank="/lokaler" listText="Se alla lediga lokaler"
          ankareLank="/lokaler#intresse" ankareText="Berätta vad du söker" />
      </div>

      {/* 4. Utveckling */}
      <section className="section">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading overline="Vi utvecklar" rubrik="Vi nöjer oss inte med att förvalta"
              ingress="Vi letar hela tiden efter sätt att göra våra fastigheter bättre – för hyresgästerna och för husen." />
            <ul className="space-y-3 -mt-4">
              {['Outnyttjade ytor blir nya förråd', 'Gårdsmiljöer förbättras och rustas upp', 'Lägenheter och trapphus renoveras', 'Lokaler anpassas och utvecklas för nya verksamheter'].map((t) => (
                <li key={t} className="flex gap-3">
                  <Ikon namn="blixt" className="mt-0.5 shrink-0 text-accent" storlek={20} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link to="/utveckling" className="btn-primary mt-8">Se hur vi utvecklar våra fastigheter</Link>
          </div>
          <div className="card overflow-hidden">
            <img src="/images/hero.jpg" alt="En av Fallens Fastigheters fastigheter" className="aspect-[4/3] w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 5. Varför Fallens */}
      <section className="section bg-muted/60">
        <div className="container-site">
          <SectionHeading center overline="Varför Fallens" rubrik="Så arbetar vi"
            ingress="Fyra kärnvärden styr hur vi arbetar – med fastigheterna, hyresgästerna och företagen." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VARDEN.map(([ikon, titel, text]) => <ValueCard key={titel} ikon={ikon} titel={titel} text={text} />)}
          </div>
        </div>
      </section>

      {/* 6. Vårt bestånd */}
      <section className="section">
        <div className="container-site text-center">
          <SectionHeading center overline="Vårt bestånd" rubrik="Fastigheter i två städer" />
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2 -mt-4">
            {[['Trollhättan', bestand.trollhattan ?? 0], ['Vänersborg', bestand.vanersborg ?? 0]].map(([ort, n]) => (
              <div key={ort} className="card p-8">
                <p className="text-5xl font-bold text-primary tabular-nums">{n}</p>
                <p className="mt-2 font-medium">{n === 1 ? 'fastighet publicerad' : 'fastigheter publicerade'}</p>
                <p className="text-muted-ink">{ort}</p>
              </div>
            ))}
          </div>
          <Link to="/fastigheter" className="btn-primary mt-10">Se alla fastigheter på karta</Link>
        </div>
      </section>

      {/* 7. Hyresgäst */}
      <section className="section bg-primary-dark text-white">
        <div className="container-site">
          <h2 className="h2">Är du redan hyresgäst?</h2>
          <p className="ingress mt-3 !text-white/80 max-w-2xl">Här hittar du snabbaste vägen till hjälp och information.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Gör en felanmälan', '/felanmalan', 'verktyg'], ['Hitta information', '/hyresgast', 'info'], ['Vanliga frågor', '/hyresgast/faq', 'fraga'], ['Kontakta oss', '/kontakt', 'telefon']].map(([t, till, ikon]) => (
              <Link key={till} to={till} className="group flex items-center gap-3 rounded-xl border border-white/20 bg-white/8 bg-[color:#ffffff]/10 p-5 transition-colors hover:bg-white/15">
                <Ikon namn={ikon} className="text-accent" />
                <span className="font-semibold">{t}</span>
                <Ikon namn="pil" storlek={18} className="ml-auto opacity-60 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Förvaltning */}
      <section className="section">
        <div className="container-site max-w-3xl text-center mx-auto">
          <SectionHeading center overline="Förvaltning" rubrik="Förvaltning med ägarperspektiv"
            ingress="Vi förvaltar våra egna fastigheter varje dag – och erbjuder samma engagemang till andra fastighetsägare i Trollhättan och Vänersborg." />
          <Link to="/forvaltning" className="btn-primary -mt-2">Läs mer om vår förvaltning</Link>
        </div>
      </section>
    </>
  );
}
