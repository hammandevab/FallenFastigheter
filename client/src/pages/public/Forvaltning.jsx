import { usePageMeta } from '../../lib/meta.js';
import { PageHeader } from '../../components/layout.jsx';
import { ServiceCard, ValueCard } from '../../components/cards.jsx';
import { SectionHeading } from '../../components/ui.jsx';
import { LeadForm } from '../../components/LeadForm.jsx';

const TJANSTER = [
  ['Teknisk förvaltning', 'Löpande drift och teknisk tillsyn av fastigheten – vi håller husen i skick.', 'aktiv'],
  ['Tillsyn och skötsel', 'Regelbunden rondering, skötsel av gemensamma utrymmen och yttre miljö.', 'aktiv'],
  ['Felanmälan och ärendehantering', 'Vi tar emot, hanterar och följer upp hyresgästernas felanmälningar.', 'aktiv'],
  ['Underhållsplanering', 'Långsiktiga underhållsplaner som skyddar fastighetens värde.', 'aktiv'],
  ['Uthyrning', 'Annonsering, visningar, urval och avtal – hela vägen till inflyttad hyresgäst.', 'aktiv'],
  ['Fastighetsutveckling', 'Vi hittar och genomför förbättringar som lyfter fastigheten.', 'aktiv'],
  ['Projektledning', 'Ledning av renoverings- och ombyggnadsprojekt.', 'uppbyggnad'],
  ['Hyresadministration', 'Avisering, kravhantering och hyresadministration.', 'uppbyggnad'],
  ['Ekonomisk förvaltning', 'Bokföring, budget och ekonomisk rapportering.', 'kommande'],
];

const VARDEN = [
  ['blixt', 'Aktiva', 'Vi väntar inte på att saker ska hända – vi agerar, föreslår och genomför.'],
  ['hus', 'Nära', 'Vi finns lokalt i Trollhättan och Vänersborg och känner husen vi sköter.'],
  ['puzzel', 'Lösningsorienterade', 'Vi hittar praktiska lösningar som fungerar för fastighet, ägare och hyresgäster.'],
  ['hjart', 'Långsiktiga', 'Vi förvaltar som ägare – med fastighetens värde över tid i fokus.'],
];

export default function Forvaltning() {
  usePageMeta({
    title: 'Fastighetsförvaltning i Trollhättan & Vänersborg | Fallens Fastigheter',
    description: 'Fastighetsförvaltning med samma engagemang som i våra egna fastigheter – teknisk förvaltning, tillsyn, felanmälan, underhållsplanering och uthyrning.',
  });
  return (
    <>
      <PageHeader rubrik="Fastighetsförvaltning med samma engagemang som i våra egna fastigheter"
        ingress="Vi förvaltar våra egna hus varje dag. Nu erbjuder vi samma aktiva förvaltning till andra fastighetsägare i Trollhättan och Vänersborg." />
      <div className="container-site section !pt-10">
        <SectionHeading overline="Tjänsteområden" rubrik="Det här hjälper vi dig med" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TJANSTER.map(([titel, text, status]) => <ServiceCard key={titel} titel={titel} text={text} status={status} />)}
        </div>
      </div>
      <div className="bg-muted/60">
        <div className="container-site section">
          <SectionHeading center overline="Varför Fallens" rubrik="Förvaltning med ägarperspektiv" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VARDEN.map(([ikon, titel, text]) => <ValueCard key={titel} ikon={ikon} titel={titel} text={text} />)}
          </div>
        </div>
      </div>
      <div className="container-site section max-w-2xl">
        <SectionHeading rubrik="Berätta om din fastighet" ingress="Beskriv ditt bestånd och vad du behöver hjälp med, så återkommer vi med ett förslag." />
        <LeadForm typ="forvaltning" knapp="Skicka förfrågan" />
      </div>
    </>
  );
}
