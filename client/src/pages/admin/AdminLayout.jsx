import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from '../../components/Logo.jsx';
import { Ikon } from '../../components/cards.jsx';

const MENY = [
  ['Översikt', '/admin', 'hus', true],
  ['Fastigheter', '/admin/fastigheter', 'hus'],
  ['Objekt', '/admin/objekt', 'nyckel'],
  ['Hyresgäster', '/admin/hyresgaster', 'hjart'],
  ['Felanmälningar', '/admin/felanmalningar', 'verktyg'],
  ['Leads', '/admin/leads', 'info'],
  ['Aktuellt', '/admin/aktuellt', 'ora'],
  ['Utveckling', '/admin/utveckling', 'blixt'],
  ['Dokument', '/admin/dokument', 'dokument'],
  ['FAQ', '/admin/faq', 'fraga'],
  ['Användare', '/admin/anvandare', 'puzzel'],
  ['Inställningar', '/admin/installningar', 'kort'],
];

/** Adminram (§6): egen layout med vänstermeny – noindex sätts per sida. */
export default function AdminLayout() {
  const { user, loggaUt } = useAuth();
  const navigate = useNavigate();
  const [oppen, setOppen] = useState(false);

  const meny = (
    <nav aria-label="Adminmeny" className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {MENY.map(([namn, till, ikon, exakt]) => (
        <NavLink key={till} to={till} end={exakt} onClick={() => setOppen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-ink/75 hover:bg-muted hover:text-ink'}`}>
          <Ikon namn={ikon} storlek={19} /> {namn}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop-sidomeny */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-card lg:flex">
        <div className="border-b border-line p-4"><Link to="/admin"><Logo /></Link></div>
        {meny}
        <div className="border-t border-line p-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-ink hover:bg-muted hover:text-ink">
            <Ikon namn="pil" storlek={16} /> Visa publika sajten
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topprad */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-card px-4">
          <button className="btn-outline btn-sm lg:hidden" aria-expanded={oppen} onClick={() => setOppen(!oppen)}>Meny</button>
          <p className="hidden text-sm font-semibold uppercase tracking-wider text-muted-ink sm:block">Förvaltning</p>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-ink sm:block">{user?.namn}</span>
            <button className="btn-ghost btn-sm" onClick={async () => { await loggaUt(); navigate('/login'); }}>Logga ut</button>
          </div>
        </header>

        {oppen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOppen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-lift">
              <div className="flex items-center justify-between border-b border-line p-4">
                <Logo /><button className="btn-outline btn-sm" onClick={() => setOppen(false)}>Stäng</button>
              </div>
              {meny}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
