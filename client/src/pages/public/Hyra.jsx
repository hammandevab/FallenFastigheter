import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useSite } from '../../context/SiteContext.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { Ikon } from '../../components/cards.jsx';

export default function Hyra() {
  usePageMeta({
    title: 'Hyra & betalning | Fallens Fastigheter',
    description: 'Allt om hur och när hyran betalas hos Fallens Fastigheter – betalningsinformation, autogiro och kontakt vid frågor om din hyresavi.',
  });
  const { site } = useSite();
  const k = site?.installningar || {};
  const sektioner = [
    ['kort', 'Betalningsinformation', k.bankgiro ? `Betala till bankgiro ${k.bankgiro}.${k.ocrInfo ? ` ${k.ocrInfo}` : ''}` : null],
    ['dokument', 'Autogiro', k.autogiroInfo || null, <Link key="l" to="/hyresgast/dokument" className="mt-3 inline-block font-semibold text-primary hover:underline">Hämta autogiroblankett →</Link>],
    ['fraga', 'Frågor om hyresavi', 'Saknar du din avi eller har frågor om ett belopp? Hör av dig så hjälper vi dig direkt.', <Link key="l" to="/kontakt" className="mt-3 inline-block font-semibold text-primary hover:underline">Kontakta oss →</Link>],
    ['telefon', 'Kontakt ekonomi', k.ekonomikontakt || null],
  ];
  return (
    <>
      <PageHeader rubrik="Hyra & betalning" ingress="Allt om hur och när hyran betalas." />
      <div className="container-site section !pt-8 max-w-3xl">
        <div className="card border-l-4 border-l-primary p-6">
          <p className="font-medium text-[17px]">
            Hyran betalas i förskott och ska vara tillhanda senast sista vardagen före varje ny månad,
            om inget annat framgår av ditt hyresavtal.
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {sektioner.map(([ikon, rubrik, text, extra]) => (
            <div key={rubrik} className="card p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-primary"><Ikon namn={ikon} /></span>
              <h2 className="h3 mt-4">{rubrik}</h2>
              <p className="mt-2 text-muted-ink whitespace-pre-line">{text || 'Uppgifterna läggs in inom kort – kontakta oss om du behöver dem nu.'}</p>
              {extra}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
