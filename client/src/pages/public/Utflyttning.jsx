import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { PageHeader } from '../../components/layout.jsx';
import { StepList } from '../../components/cards.jsx';

const STEG = [
  { titel: 'Uppsägning', text: 'Säg upp ditt hyresavtal skriftligt. Uppsägningstiden är normalt tre kalendermånader, räknat från månadsskiftet efter att uppsägningen kommit in.' },
  { titel: 'Visning', text: 'Under uppsägningstiden kan bostaden visas för nya sökande. Vi hör av oss i god tid för att hitta tider som passar dig.' },
  { titel: 'Flyttstädning', text: 'Bostaden ska flyttstädas noggrant innan du lämnar den.', extraLank: true },
  { titel: 'Besiktning', text: 'Vi går igenom bostaden tillsammans och noterar eventuella skador och slitage.' },
  { titel: 'Nycklar', text: 'Samtliga nycklar lämnas tillbaka senast kl. 12.00 dagen efter att hyrestiden gått ut.' },
  { titel: 'Kontakt', text: 'Har du frågor någonstans på vägen? Hör av dig – vi hjälper dig gärna genom hela flytten.' },
];

export default function Utflyttning() {
  usePageMeta({
    title: 'Utflyttning – uppsägning och besiktning | Fallens Fastigheter',
    description: 'Ska du flytta? Här är stegen från uppsägning till nyckelåterlämning – uppsägningstid, visning, flyttstädning och besiktning.',
  });
  const steg = STEG.map((s) => s.extraLank
    ? { ...s, extra: <Link to="/hyresgast/dokument" className="mt-2 inline-block font-semibold text-primary hover:underline">Hämta städinstruktionen →</Link> }
    : s);
  return (
    <>
      <PageHeader rubrik="Utflyttning" ingress="Ska du flytta? Här är stegen från uppsägning till nyckelåterlämning." />
      <div className="container-site section !pt-8 max-w-3xl">
        <StepList steg={steg} />
        <div className="mt-10">
          <Link to="/kontakt" className="btn-primary">Kontakta oss om din utflyttning</Link>
        </div>
      </div>
    </>
  );
}
