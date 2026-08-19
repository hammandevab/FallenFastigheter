import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { auth } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageSpinner } from '../../components/ui.jsx';

export default function VerifieraEpost() {
  usePageMeta({ title: 'Verifiera e-post | Fallens Fastigheter', noindex: true });
  const [sp] = useSearchParams();
  const { laddaOm } = useAuth();
  const [status, setStatus] = useState('laddar');
  useEffect(() => {
    auth.verifieraEpost({ token: sp.get('token') })
      .then(() => { setStatus('ok'); laddaOm(); })
      .catch(() => setStatus('fel'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="container-site section">
      <div className="mx-auto max-w-md card p-8 text-center">
        {status === 'laddar' ? <PageSpinner /> : status === 'ok' ? (
          <>
            <h1 className="h2">Din e-postadress är verifierad</h1>
            <p className="mt-3 text-muted-ink">Den nya adressen används nu för ditt konto.</p>
            <Link to="/mina-sidor/profil" className="btn-primary mt-6">Till min profil</Link>
          </>
        ) : (
          <>
            <h1 className="h2">Länken fungerar inte längre</h1>
            <p className="mt-3 text-muted-ink">Verifieringslänken kan ha gått ut. Begär ett nytt byte från din profil.</p>
            <Link to="/mina-sidor/profil" className="btn-outline mt-6">Till min profil</Link>
          </>
        )}
      </div>
    </div>
  );
}
