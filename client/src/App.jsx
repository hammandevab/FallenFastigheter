import { Suspense, lazy, Component } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { SiteHeader, SiteFooter } from './components/layout.jsx';
import { PageSpinner } from './components/ui.jsx';
import { ScrollManager } from './components/ScrollManager.jsx';

// Publika sidor (lazy – en gemensam Suspense-boundary enligt blueprint §4.3)
const Home = lazy(() => import('./pages/public/Home.jsx'));
const Bostader = lazy(() => import('./pages/public/Bostader.jsx'));
const Lokaler = lazy(() => import('./pages/public/Lokaler.jsx'));
const ObjektDetalj = lazy(() => import('./pages/public/ObjektDetalj.jsx'));
const Fastigheter = lazy(() => import('./pages/public/Fastigheter.jsx'));
const FastighetDetalj = lazy(() => import('./pages/public/FastighetDetalj.jsx'));
const HyresgastHub = lazy(() => import('./pages/public/HyresgastHub.jsx'));
const Hyra = lazy(() => import('./pages/public/Hyra.jsx'));
const Faq = lazy(() => import('./pages/public/Faq.jsx'));
const AktuelltPublik = lazy(() => import('./pages/public/Aktuellt.jsx'));
const Inflyttning = lazy(() => import('./pages/public/Inflyttning.jsx'));
const Utflyttning = lazy(() => import('./pages/public/Utflyttning.jsx'));
const DokumentPublik = lazy(() => import('./pages/public/Dokument.jsx'));
const Felanmalan = lazy(() => import('./pages/public/Felanmalan.jsx'));
const Forvaltning = lazy(() => import('./pages/public/Forvaltning.jsx'));
const Utveckling = lazy(() => import('./pages/public/Utveckling.jsx'));
const OmFallens = lazy(() => import('./pages/public/OmFallens.jsx'));
const SaArbetarVi = lazy(() => import('./pages/public/SaArbetarVi.jsx'));
const Kontakt = lazy(() => import('./pages/public/Kontakt.jsx'));
const Login = lazy(() => import('./pages/public/Login.jsx'));
const GlomtLosenord = lazy(() => import('./pages/public/GlomtLosenord.jsx'));
const AterstallLosenord = lazy(() => import('./pages/public/AterstallLosenord.jsx'));
const AktiveraKonto = lazy(() => import('./pages/public/AktiveraKonto.jsx'));
const VerifieraEpost = lazy(() => import('./pages/public/VerifieraEpost.jsx'));
const Integritetspolicy = lazy(() => import('./pages/public/Integritetspolicy.jsx'));
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'));

// Portal
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout.jsx'));
const PortalOversikt = lazy(() => import('./pages/portal/Oversikt.jsx'));
const PortalBoende = lazy(() => import('./pages/portal/Boende.jsx'));
const PortalArenden = lazy(() => import('./pages/portal/Arenden.jsx'));
const PortalArende = lazy(() => import('./pages/portal/ArendeDetalj.jsx'));
const PortalNyFelanmalan = lazy(() => import('./pages/portal/NyFelanmalan.jsx'));
const PortalDokument = lazy(() => import('./pages/portal/Dokument.jsx'));
const PortalAktuellt = lazy(() => import('./pages/portal/Aktuellt.jsx'));
const PortalProfil = lazy(() => import('./pages/portal/Profil.jsx'));

// Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminOversikt = lazy(() => import('./pages/admin/Oversikt.jsx'));
const AdminFastigheter = lazy(() => import('./pages/admin/Fastigheter.jsx'));
const AdminFastighetDetalj = lazy(() => import('./pages/admin/FastighetDetalj.jsx'));
const AdminObjekt = lazy(() => import('./pages/admin/Objekt.jsx'));
const AdminObjektDetalj = lazy(() => import('./pages/admin/ObjektDetalj.jsx'));
const AdminHyresgaster = lazy(() => import('./pages/admin/Hyresgaster.jsx'));
const AdminHyresgastDetalj = lazy(() => import('./pages/admin/HyresgastDetalj.jsx'));
const AdminFelanmalningar = lazy(() => import('./pages/admin/Felanmalningar.jsx'));
const AdminArendeDetalj = lazy(() => import('./pages/admin/ArendeDetalj.jsx'));
const AdminLeads = lazy(() => import('./pages/admin/Leads.jsx'));
const AdminAktuellt = lazy(() => import('./pages/admin/Aktuellt.jsx'));
const AdminUtveckling = lazy(() => import('./pages/admin/Utveckling.jsx'));
const AdminDokument = lazy(() => import('./pages/admin/Dokument.jsx'));
const AdminFaq = lazy(() => import('./pages/admin/Faq.jsx'));
const AdminAnvandare = lazy(() => import('./pages/admin/Anvandare.jsx'));
const AdminInstallningar = lazy(() => import('./pages/admin/Installningar.jsx'));

class ErrorBoundary extends Component {
  state = { fel: null };
  static getDerivedStateFromError(fel) { return { fel }; }
  render() {
    if (this.state.fel) {
      return (
        <div className="container-site section text-center">
          <h1 className="h2">Något gick fel</h1>
          <p className="mt-3 text-muted-ink">Prova att ladda om sidan. Kvarstår problemet – kontakta oss.</p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Ladda om</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Skyddad route med roll + retur till målsidan efter inloggning (§5.8 pkt 2). */
function Protected({ roll }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roll === 'admin' && user.roll !== 'admin') return <Navigate to="/mina-sidor" replace />;
  return <Outlet />;
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="innehall" className="flex-1"><Outlet /></main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollManager />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/bostader" element={<Bostader />} />
            <Route path="/bostader/:id" element={<ObjektDetalj typ="bostad" />} />
            <Route path="/lokaler" element={<Lokaler />} />
            <Route path="/lokaler/:id" element={<ObjektDetalj typ="lokal" />} />
            <Route path="/fastigheter" element={<Fastigheter />} />
            <Route path="/fastigheter/:slug" element={<FastighetDetalj />} />
            <Route path="/hyresgast" element={<HyresgastHub />} />
            <Route path="/hyresgast/hyra" element={<Hyra />} />
            <Route path="/hyresgast/faq" element={<Faq />} />
            <Route path="/hyresgast/aktuellt" element={<AktuelltPublik />} />
            <Route path="/hyresgast/inflyttning" element={<Inflyttning />} />
            <Route path="/hyresgast/utflyttning" element={<Utflyttning />} />
            <Route path="/hyresgast/dokument" element={<DokumentPublik />} />
            <Route path="/felanmalan" element={<Felanmalan />} />
            <Route path="/forvaltning" element={<Forvaltning />} />
            <Route path="/utveckling" element={<Utveckling />} />
            <Route path="/om-fallens" element={<OmFallens />} />
            <Route path="/om-fallens/sa-arbetar-vi" element={<SaArbetarVi />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/login" element={<Login />} />
            <Route path="/glomt-losenord" element={<GlomtLosenord />} />
            <Route path="/aterstall-losenord" element={<AterstallLosenord />} />
            <Route path="/aktivera-konto" element={<AktiveraKonto />} />
            <Route path="/verifiera-epost" element={<VerifieraEpost />} />
            <Route path="/integritetspolicy" element={<Integritetspolicy />} />

            <Route element={<Protected />}>
              <Route element={<PortalLayout />}>
                <Route path="/mina-sidor" element={<PortalOversikt />} />
                <Route path="/mina-sidor/boende" element={<PortalBoende />} />
                <Route path="/mina-sidor/felanmalningar" element={<PortalArenden />} />
                <Route path="/mina-sidor/felanmalningar/ny" element={<PortalNyFelanmalan />} />
                <Route path="/mina-sidor/felanmalningar/:id" element={<PortalArende />} />
                <Route path="/mina-sidor/dokument" element={<PortalDokument />} />
                <Route path="/mina-sidor/aktuellt" element={<PortalAktuellt />} />
                <Route path="/mina-sidor/profil" element={<PortalProfil />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<Protected roll="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminOversikt />} />
              <Route path="/admin/fastigheter" element={<AdminFastigheter />} />
              <Route path="/admin/fastigheter/:id" element={<AdminFastighetDetalj />} />
              <Route path="/admin/objekt" element={<AdminObjekt />} />
              <Route path="/admin/objekt/:id" element={<AdminObjektDetalj />} />
              <Route path="/admin/hyresgaster" element={<AdminHyresgaster />} />
              <Route path="/admin/hyresgaster/:id" element={<AdminHyresgastDetalj />} />
              <Route path="/admin/felanmalningar" element={<AdminFelanmalningar />} />
              <Route path="/admin/felanmalningar/:id" element={<AdminArendeDetalj />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/aktuellt" element={<AdminAktuellt />} />
              <Route path="/admin/utveckling" element={<AdminUtveckling />} />
              <Route path="/admin/dokument" element={<AdminDokument />} />
              <Route path="/admin/faq" element={<AdminFaq />} />
              <Route path="/admin/anvandare" element={<AdminAnvandare />} />
              <Route path="/admin/installningar" element={<AdminInstallningar />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
