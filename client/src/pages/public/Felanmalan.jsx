import { useMemo, useState } from 'react';
import { usePageMeta } from '../../lib/meta.js';
import { useSite } from '../../context/SiteContext.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { FelanmalanForm } from '../../components/FelanmalanForm.jsx';

export default function Felanmalan() {
  usePageMeta({
    title: 'Felanmälan | Fallens Fastigheter',
    description: 'Anmäl fel i din bostad eller lokal hos Fallens Fastigheter. Beskriv felet, bifoga en bild och markera om det är akut.',
  });
  const { site } = useSite();
  const k = site?.installningar || {};
  const [klart, setKlart] = useState(null);

  return (
    <>
      <PageHeader rubrik="Felanmälan" ingress="Beskriv felet så tydligt du kan och bifoga gärna en bild – då kan vi hjälpa dig snabbare." />
      <div className="container-site section !pt-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            {klart ? (
              <div className="card p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-atgardad/12 text-status-atgardad">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
                </span>
                <h2 className="h3 mt-4">Tack! Din felanmälan är mottagen.</h2>
                <p className="mt-2 text-lg">Ditt ärendenummer är <strong>#{klart.arendenummer}</strong>.</p>
                <p className="mt-2 text-muted-ink">Spara numret – ange det om du kontaktar oss om ärendet. En bekräftelse har skickats till din e-post.</p>
                <button className="btn-outline btn-sm mt-6" onClick={() => setKlart(null)}>Gör en ny felanmälan</button>
              </div>
            ) : (
              <FelanmalanForm onKlart={setKlart} />
            )}
          </div>

          {/* Akut fel? (§4.6) */}
          <aside>
            <div className="card sticky top-24 border-l-4 border-l-destructive p-6">
              <h2 className="h3 text-destructive">Akut fel?</h2>
              <p className="mt-2 text-muted-ink">Ring oss direkt i stället för att vänta på svar via formuläret om det gäller:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px]">
                <li>Vattenläcka</li>
                <li>Totalt strömavbrott i bostaden</li>
                <li>Ingen värme vintertid</li>
                <li>Avloppsstopp med översvämningsrisk</li>
                <li>Inbrott eller skada på dörr/fönster som inte går att låsa</li>
              </ul>
              {(k.jourtelefon || k.jourinstruktion) && (
                <div className="mt-4 rounded bg-muted p-4">
                  {k.jourtelefon && <p className="font-semibold">Jourtelefon: <a className="text-primary hover:underline" href={`tel:${k.jourtelefon.replace(/[^+\d]/g, '')}`}>{k.jourtelefon}</a></p>}
                  {k.jourinstruktion && <p className="mt-1 text-sm text-muted-ink">{k.jourinstruktion}</p>}
                </div>
              )}
              <p className="mt-4 font-semibold">Vid brand, pågående inbrott eller fara för liv – ring alltid 112.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
