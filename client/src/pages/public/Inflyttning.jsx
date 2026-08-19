import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { PageHeader } from '../../components/layout.jsx';
import { StepList } from '../../components/cards.jsx';

const STEG = [
  { titel: 'Nycklar', text: 'Nycklarna lämnas ut på tillträdesdagen. Boka tid med oss i förväg så att allt går smidigt.' },
  { titel: 'Lägenheten', text: 'Gå igenom bostaden när du kommer. Upptäcker du brister – anmäl dem direkt till oss så tar vi hand om dem.' },
  { titel: 'Besiktning', text: 'Bostaden besiktas före tillträdet. Har du frågor om besiktningen är du välkommen att kontakta oss.' },
  { titel: 'El', text: 'Teckna ett eget elavtal som gäller från tillträdesdagen så att strömmen är på när du flyttar in.' },
  { titel: 'Bredband', text: 'Vilken bredbandsleverantör som finns i huset skiljer sig mellan fastigheterna – kontakta oss så berättar vi vad som gäller för just din adress.' },
  { titel: 'Hemförsäkring', text: 'Hemförsäkring är ett krav från tillträdesdagen. Se till att den är tecknad innan du flyttar in.' },
  { titel: 'Adressändring', text: 'Anmäl flytt till Skatteverket (folkbokföring) och beställ eftersändning av din post.' },
  { titel: 'Praktiskt', text: 'Tvättstuga, förråd, sopsortering och parkering skiljer sig mellan husen – informationen finns på din fastighetssida och i portalen, och du kan alltid fråga oss.' },
];

export default function Inflyttning() {
  usePageMeta({
    title: 'Inflyttning – praktisk information | Fallens Fastigheter',
    description: 'Välkommen hem! Nycklar, besiktning, el, bredband, hemförsäkring och allt praktiskt inför din inflyttning hos Fallens Fastigheter.',
  });
  return (
    <>
      <PageHeader rubrik="Välkommen hem – så funkar inflyttningen"
        ingress="Åtta steg som gör flytten enkel, från nycklar till det praktiska i huset." />
      <div className="container-site section !pt-8 max-w-3xl">
        <StepList steg={STEG} />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/felanmalan" className="btn-primary">Gör en felanmälan</Link>
          <Link to="/kontakt" className="btn-outline">Kontakta oss</Link>
        </div>
      </div>
    </>
  );
}
