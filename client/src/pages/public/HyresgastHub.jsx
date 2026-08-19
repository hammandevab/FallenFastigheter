import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { LinkCard, Ikon } from '../../components/cards.jsx';

const KORT = [
  ['/felanmalan', 'verktyg', 'Felanmälan', 'Anmäl fel i din bostad eller lokal'],
  ['/hyresgast/hyra', 'kort', 'Hyra & betalning', 'Betalning, avier och autogiro'],
  ['/hyresgast/faq', 'fraga', 'Vanliga frågor', 'Svar på det vi får flest frågor om'],
  ['/hyresgast/inflyttning', 'nyckel', 'Inflyttning', 'Nycklar, el, bredband och praktiskt'],
  ['/hyresgast/utflyttning', 'lada', 'Utflyttning', 'Uppsägning, städning och besiktning'],
  ['/hyresgast/aktuellt', 'info', 'Aktuell information', 'Planerade arbeten och driftstörningar'],
  ['/hyresgast/dokument', 'dokument', 'Dokument', 'Blanketter och information att ladda ner'],
  ['/kontakt', 'telefon', 'Kontakt', 'Så når du oss'],
];

export default function HyresgastHub() {
  usePageMeta({
    title: 'För dig som är hyresgäst | Fallens Fastigheter',
    description: 'Felanmälan, hyra och betalning, vanliga frågor, in- och utflyttning, aktuell information och dokument – allt för dig som hyr hos Fallens Fastigheter.',
  });
  const { user } = useAuth();
  return (
    <>
      <PageHeader rubrik="Är du redan hyresgäst?" ingress="Här har vi samlat allt du behöver – från felanmälan till praktisk information om ditt boende." />
      <div className="container-site section !pt-8">
        {/* Mina sidor-banner (§4.5 SPEC) */}
        <div className="card mb-10 flex flex-col gap-4 border-primary/25 bg-accent-soft/50 p-6 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><Ikon namn="hus" /></span>
          <div className="flex-1">
            <h2 className="h3">Logga in på Mina sidor</h2>
            <p className="mt-1 text-muted-ink">Se ditt boende, följ dina felanmälningar, läs riktad information och hämta dina dokument – allt på ett ställe.</p>
          </div>
          <Link to={user ? '/mina-sidor' : '/login'} className="btn-primary shrink-0">{user ? 'Till Mina sidor' : 'Logga in'}</Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {KORT.map(([till, ikon, titel, text]) => <LinkCard key={till} till={till} ikon={ikon} titel={titel} text={text} />)}
        </div>
      </div>
    </>
  );
}
