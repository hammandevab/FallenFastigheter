import { usePageMeta } from '../../lib/meta.js';
import { PageHeader } from '../../components/layout.jsx';
import { Ikon } from '../../components/cards.jsx';

const VARDEN = [
  ['ora', 'Lyhörda', 'Vi lyssnar på våra hyresgäster och på vad våra fastigheter behöver.',
    ['Vi tar återkoppling på allvar och agerar på den', 'Vi kommunicerar tydligt – före, under och efter arbeten', 'Vi underhåller utifrån husens verkliga behov']],
  ['blixt', 'Drivande', 'Vi nöjer oss inte med att göra det nödvändiga. Vi ser möjligheter och utvecklar våra fastigheter.',
    ['Vi optimerar ytor som inte används fullt ut', 'Vi förbättrar proaktivt – innan problemen uppstår', 'Vi driver egna utvecklingsprojekt i husen']],
  ['puzzel', 'Flexibla', 'Vi försöker hitta lösningar som fungerar för människor, företag och fastigheter.',
    ['Vi anpassar lokaler efter verksamheters behov', 'Vi börjar alltid i en behovsanalys', 'Vi löser praktiska problem – snabbt och pragmatiskt']],
  ['hus', 'Närvarande', 'Vi vill vara en fastighetsägare som syns, går att få tag på och tar ansvar.',
    ['Vi finns lokalt i Trollhättan och Vänersborg', 'Vi är nåbara – på telefon, mejl och plats', 'Vi tar ansvar hela vägen, även när det är krångligt']],
];

export default function SaArbetarVi() {
  usePageMeta({
    title: 'Så arbetar vi – våra kärnvärden | Fallens Fastigheter',
    description: 'Lyhörda, drivande, flexibla och närvarande. Så arbetar Fallens Fastigheter med sina fastigheter, hyresgäster och företagskunder.',
  });
  return (
    <>
      <PageHeader rubrik="Så arbetar vi" ingress="Fyra kärnvärden styr hur vi arbetar – med fastigheterna, hyresgästerna och företagen." />
      <div className="container-site section !pt-8 max-w-3xl space-y-8">
        {VARDEN.map(([ikon, titel, ledtext, punkter]) => (
          <section key={titel} className="card p-6 md:p-8" aria-labelledby={`v-${titel}`}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-primary"><Ikon namn={ikon} /></span>
            <h2 id={`v-${titel}`} className="h2 mt-4">{titel}</h2>
            <p className="ingress mt-2">{ledtext}</p>
            <ul className="mt-5 space-y-2.5">
              {punkter.map((p) => (
                <li key={p} className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mt-0.5 shrink-0 text-primary" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
