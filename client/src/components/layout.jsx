import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';

const NAV = [
  ['Bostäder', '/bostader'],
  ['Lokaler', '/lokaler'],
  ['Våra fastigheter', '/fastigheter'],
  ['Hyresgäst', '/hyresgast'],
  ['Förvaltning', '/forvaltning'],
  ['Om Fallens', '/om-fallens'],
  ['Kontakt', '/kontakt'],
];

export function SiteHeader() {
  const { user, loggaUt } = useAuth();
  const [oppen, setOppen] = useState(false);
  const [skugga, setSkugga] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const f = () => setSkugga(window.scrollY > 8);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  useEffect(() => {
    document.body.style.overflow = oppen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [oppen]);

  const utloggning = async () => { await loggaUt(); setOppen(false); navigate('/'); };

  const lank = ({ isActive }) =>
    `px-3 py-2 rounded text-[15px] font-medium transition-colors ${isActive ? 'text-primary bg-primary/5' : 'text-ink/80 hover:text-primary'}`;

  return (
    <header className={`sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-line transition-shadow ${skugga ? 'shadow-card' : ''}`}>
      <a href="#innehall" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 btn-primary btn-sm">Hoppa till innehåll</a>
      <div className="container-site flex h-[68px] items-center justify-between gap-4">
        <Link to="/" aria-label="Fallens Fastigheter – till startsidan" onClick={() => setOppen(false)}>
          <Logo />
        </Link>
        <nav aria-label="Huvudmeny" className="hidden lg:flex items-center gap-0.5">
          {NAV.map(([namn, till]) => <NavLink key={till} to={till} className={lank}>{namn}</NavLink>)}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          {user?.roll === 'admin' && <Link to="/admin" className="btn-ghost btn-sm">Förvaltning</Link>}
          {user ? (
            <>
              <Link to="/mina-sidor" className="btn-primary btn-sm">Mina sidor</Link>
              <button onClick={utloggning} className="btn-ghost btn-sm">Logga ut</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary btn-sm">Mina sidor</Link>
          )}
        </div>
        <button className="lg:hidden btn-outline btn-sm" aria-expanded={oppen} aria-controls="mobilmeny" onClick={() => setOppen(!oppen)}>
          {oppen ? 'Stäng' : 'Meny'}
        </button>
      </div>
      {oppen && (
        <div id="mobilmeny" className="lg:hidden fixed inset-x-0 top-[68px] bottom-0 z-50 overflow-y-auto bg-bg border-t border-line">
          <nav aria-label="Mobilmeny" className="container-site py-6 flex flex-col gap-1">
            {NAV.map(([namn, till]) => (
              <NavLink key={till} to={till} onClick={() => setOppen(false)}
                className={({ isActive }) => `px-3 py-3 rounded text-lg font-medium ${isActive ? 'text-primary bg-primary/5' : ''}`}>
                {namn}
              </NavLink>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
              {user ? (
                <>
                  <Link to="/mina-sidor" onClick={() => setOppen(false)} className="btn-primary w-full">Mina sidor</Link>
                  {user.roll === 'admin' && <Link to="/admin" onClick={() => setOppen(false)} className="btn-outline w-full">Förvaltning</Link>}
                  <button onClick={utloggning} className="btn-secondary w-full">Logga ut</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOppen(false)} className="btn-primary w-full">Mina sidor</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { site } = useSite();
  const k = site?.installningar || {};
  const kontaktRad = [k.besoksadress, k.telefon, k.epost].filter(Boolean).join(' · ');
  const kolumner = [
    ['Hyra av oss', [['Lediga bostäder', '/bostader'], ['Lediga lokaler', '/lokaler'], ['Våra fastigheter', '/fastigheter']]],
    ['Hyresgäst', [['Felanmälan', '/felanmalan'], ['Hyra & betalning', '/hyresgast/hyra'], ['Vanliga frågor', '/hyresgast/faq'], ['Aktuell information', '/hyresgast/aktuellt']]],
    ['Fallens', [['Om Fallens', '/om-fallens'], ['Så arbetar vi', '/om-fallens/sa-arbetar-vi'], ['Vi utvecklar', '/utveckling'], ['Förvaltning', '/forvaltning'], ['Kontakt', '/kontakt']]],
  ];
  return (
    <footer className="bg-primary-dark text-white/85 mt-auto">
      <div className="container-site py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo ljus />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Bostäder, lokaler och fastighetsförvaltning i Trollhättan och Vänersborg. Vi ser möjligheterna i våra fastigheter.
            </p>
          </div>
          {kolumner.map(([rubrik, lankar]) => (
            <nav key={rubrik} aria-label={`Sidfot – ${rubrik}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{rubrik}</h2>
              <ul className="mt-4 space-y-2.5 text-[15px]">
                {lankar.map(([namn, till]) => (
                  <li key={till}><Link to={till} className="text-white/70 hover:text-white transition-colors">{namn}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Fallens Fastigheter{kontaktRad ? ` · ${kontaktRad}` : ''}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/integritetspolicy" className="hover:text-white">Integritetspolicy</Link>
            <Link to="/login" className="hover:text-white">Mina sidor</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Sidhuvud för undersidor (§9.5): H1 + ingress på lugn bakgrund. */
export function PageHeader({ rubrik, ingress, barn, bred = false }) {
  return (
    <div className="border-b border-line bg-muted/60">
      <div className={`container-site py-12 md:py-16 ${bred ? '' : 'max-w-3xl'}`}>
        <h1 className="h1">{rubrik}</h1>
        {ingress && <p className="ingress mt-4">{ingress}</p>}
        {barn}
      </div>
    </div>
  );
}
