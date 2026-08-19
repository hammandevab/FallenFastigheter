import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { portal } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync, PageSpinner, EmptyState } from '../../components/ui.jsx';
import { FelanmalanForm } from '../../components/FelanmalanForm.jsx';

export default function PortalNyFelanmalan() {
  usePageMeta({ title: 'Ny felanmälan – Mina sidor | Fallens Fastigheter', noindex: true });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { visa } = useToast();
  const { data, laddar, fel } = useAsync(() => portal.boende(), []);

  if (laddar) return <PageSpinner />;
  if (fel) return <EmptyState rubrik="Kontot är inte kopplat ännu" text={fel} cta="Kontakta oss" ctaTill="/kontakt" />;
  const boenden = (data?.boenden || []).filter((b) => b.unit);
  if (!boenden.length) return <EmptyState rubrik="Inget boende att anmäla fel på" text="Ditt konto saknar aktivt hyresförhållande. Använd det publika formuläret eller kontakta oss." cta="Till felanmälan" ctaTill="/felanmalan" />;

  const forsta = boenden[0];
  return (
    <>
      <nav className="mb-5 text-sm text-muted-ink"><Link to="/mina-sidor/felanmalningar" className="hover:text-primary">← Mina felanmälningar</Link></nav>
      <h1 className="h1">Ny felanmälan</h1>
      <p className="ingress mt-2 max-w-2xl">Dina uppgifter är redan ifyllda – beskriv felet och bifoga gärna en bild.</p>
      <div className="mt-8 max-w-2xl">
        <FelanmalanForm
          boenden={boenden}
          forifyllt={{
            namn: data?.tenant?.namn || user?.namn || '',
            epost: user?.epost || '',
            telefon: user?.telefon || '',
            adress: forsta.unit?.adress || '',
            lagenhetsnummer: forsta.unit?.beteckning || '',
          }}
          onKlart={(r) => { visa(`Felanmälan #${r.arendenummer} är skickad.`); navigate(`/mina-sidor/felanmalningar/${r.id}`); }}
        />
      </div>
    </>
  );
}
