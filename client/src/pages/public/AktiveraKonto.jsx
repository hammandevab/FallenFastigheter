import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { auth } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, inputProps, SubmitButton } from '../../components/form.jsx';

export default function AktiveraKonto() {
  usePageMeta({ title: 'Aktivera ditt konto | Fallens Fastigheter', noindex: true });
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { laddaOm } = useAuth();
  const { visa } = useToast();
  const [losenord, setLosenord] = useState('');
  const [igen, setIgen] = useState('');
  const [fel, setFel] = useState('');
  const [laddar, setLaddar] = useState(false);
  const skicka = async (e) => {
    e.preventDefault();
    if (losenord.length < 8) return setFel('Lösenordet behöver vara minst 8 tecken');
    if (losenord !== igen) return setFel('Lösenorden matchar inte');
    setLaddar(true);
    try {
      await auth.aktiveraKonto({ token: sp.get('token'), losenord });
      await laddaOm();
      visa('Välkommen! Ditt konto är aktiverat.');
      navigate('/mina-sidor');
    } catch (err) { setFel(err.message); }
    finally { setLaddar(false); }
  };
  return (
    <div className="container-site section">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="h2">Välkommen till Mina sidor</h1>
        <p className="mt-2 text-muted-ink">Välj ett lösenord för att aktivera ditt konto.</p>
        <form onSubmit={skicka} noValidate className="mt-6 space-y-5">
          <Field id="ak-1" label="Lösenord" obligatorisk hjalp="Minst 8 tecken">
            <input type="password" {...inputProps('ak-1')} autoComplete="new-password" value={losenord} onChange={(e) => setLosenord(e.target.value)} />
          </Field>
          <Field id="ak-2" label="Upprepa lösenordet" obligatorisk>
            <input type="password" {...inputProps('ak-2')} autoComplete="new-password" value={igen} onChange={(e) => setIgen(e.target.value)} />
          </Field>
          {fel && <p className="field-error" role="alert">{fel}</p>}
          <SubmitButton laddar={laddar} className="btn-primary w-full">Aktivera konto</SubmitButton>
        </form>
      </div>
    </div>
  );
}
