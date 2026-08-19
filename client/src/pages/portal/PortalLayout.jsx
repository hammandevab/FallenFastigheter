import { NavLink, Outlet } from 'react-router-dom';

const FLIKAR = [
  ['Översikt', '/mina-sidor', true],
  ['Mitt boende', '/mina-sidor/boende'],
  ['Felanmälningar', '/mina-sidor/felanmalningar'],
  ['Dokument', '/mina-sidor/dokument'],
  ['Aktuellt', '/mina-sidor/aktuellt'],
  ['Profil', '/mina-sidor/profil'],
];

/** Portalram (§5): publik header/footer + sekundär portalnavigation. */
export default function PortalLayout() {
  return (
    <div className="container-site section !pt-8">
      <nav aria-label="Mina sidor" className="mb-8 -mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-1 rounded-xl border border-line bg-card p-1.5">
          {FLIKAR.map(([namn, till, exakt]) => (
            <NavLink key={till} to={till} end={exakt}
              className={({ isActive }) => `whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-white' : 'text-muted-ink hover:text-ink hover:bg-muted'}`}>
              {namn}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
