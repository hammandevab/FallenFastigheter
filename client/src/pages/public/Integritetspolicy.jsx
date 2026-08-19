import { usePageMeta } from '../../lib/meta.js';
import { useSite } from '../../context/SiteContext.jsx';
import { PageHeader } from '../../components/layout.jsx';

export default function Integritetspolicy() {
  usePageMeta({
    title: 'Integritetspolicy | Fallens Fastigheter',
    description: 'Så behandlar Fallens Fastigheter dina personuppgifter – vilka uppgifter vi samlar in, varför, hur länge de sparas och vilka rättigheter du har.',
  });
  const { site } = useSite();
  const k = site?.installningar || {};
  const avsnitt = [
    ['Vilka uppgifter vi behandlar', 'Vi behandlar de uppgifter du själv lämnar till oss: kontaktuppgifter i intresseanmälningar och kontaktformulär, uppgifter i felanmälningar (inklusive eventuella bilder), samt uppgifter om dig som hyresgäst – namn, kontaktuppgifter, hyresförhållande och ärendehistorik.'],
    ['Varför vi behandlar dem', 'För att hantera dina förfrågningar och felanmälningar, fullgöra hyresavtal, ge dig tillgång till hyresgästportalen och uppfylla rättsliga skyldigheter, till exempel bokföringskrav.'],
    ['Hur länge uppgifterna sparas', 'Intresseanmälningar och förfrågningar gallras senast 12 månader efter att ärendet avslutats. Felanmälningar anonymiseras senast 24 månader efter att ärendet stängts – statistiken behålls avidentifierad. Uppgifter kopplade till hyresavtal sparas så länge avtals- och bokföringskrav kräver.'],
    ['Vilka som får del av uppgifterna', 'Uppgifterna hanteras av Fallens Fastigheter. Vid behov delas de med entreprenörer som åtgärdar fel i din bostad samt med driftleverantörer som lagrar data för vår räkning – alltid enligt personuppgiftsbiträdesavtal. Vi säljer aldrig dina uppgifter.'],
    ['Dina rättigheter', 'Du har rätt att få tillgång till dina uppgifter, få felaktiga uppgifter rättade, i vissa fall få uppgifter raderade, samt invända mot behandling. Kontakta oss så hjälper vi dig – vi har verktyg för både registerutdrag och radering.'],
  ];
  return (
    <>
      <PageHeader rubrik="Integritetspolicy" ingress="Så behandlar vi dina personuppgifter – kort, tydligt och utan finstilt." />
      <div className="container-site section !pt-8 max-w-3xl space-y-8">
        {avsnitt.map(([rubrik, text]) => (
          <section key={rubrik}>
            <h2 className="h3">{rubrik}</h2>
            <p className="mt-2 text-muted-ink leading-relaxed">{text}</p>
          </section>
        ))}
        <section>
          <h2 className="h3">Personuppgiftsansvarig</h2>
          <p className="mt-2 text-muted-ink leading-relaxed">
            Fallens Fastigheter är personuppgiftsansvarig.
            {k.epost ? <> Kontakta oss på <a className="text-primary hover:underline" href={`mailto:${k.epost}`}>{k.epost}</a> vid frågor om dina uppgifter.</> : ' Kontakta oss via kontaktsidan vid frågor om dina uppgifter.'}
          </p>
        </section>
      </div>
    </>
  );
}
