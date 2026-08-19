import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from '../../components/Logo.jsx';
import { Field, inputProps, SubmitButton } from '../../components/form.jsx';

export default function Login() {
  usePageMeta({
    title: 'Logga in – Mina sidor | Fallens Fastigheter',
    description: 'Logga in på Fallens Fastigheters hyresgästportal för att se ditt boende, dina felanmälningar, dokument och information om din fastighet.',
    noindex: true,
  });
  const { loggaIn } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [epost, setEpost] = useState('');
  const [losenord, setLosenord] = useState('');
  const [fel, setFel] = useState('');
  const [laddar, setLaddar] = useState(false);

  const skicka = async (e) => {
    e.preventDefault();
    setFel('');
    setLaddar(true);
    try {
      const user = await loggaIn(epost, losenord);
      const next = sp.get('next');
      navigate(next && next.startsWith('/') ? next : user.roll === 'admin' ? '/admin' : '/mina-sidor', { replace: true });
    } catch (err) {
      setFel(err.message || 'Fel e-post eller lösenord');
    } finally {
      setLaddar(false);
    }
  };

  return (
    <div className="container-site section">
      <div className="mx-auto max-w-md">
        <div className="card p-8">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="h2 mt-6 text-center">Logga in på Mina sidor</h1>
          <form onSubmit={skicka} noValidate className="mt-8 space-y-5">
            <Field id="li-epost" label="E-post" obligatorisk>
              <input type="email" {...inputProps('li-epost')} autoComplete="email" value={epost} onChange={(e) => setEpost(e.target.value)} />
            </Field>
            <Field id="li-losen" label="Lösenord" obligatorisk>
              <input type="password" {...inputProps('li-losen')} autoComplete="current-password" value={losenord} onChange={(e) => setLosenord(e.target.value)} />
            </Field>
            {fel && <p className="field-error" role="alert">{fel}</p>}
            <SubmitButton laddar={laddar} className="btn-primary w-full">Logga in</SubmitButton>
          </form>
          <p className="mt-5 text-center">
            <Link to="/glomt-losenord" className="text-sm font-semibold text-primary hover:underline">Glömt lösenord?</Link>
          </p>
        </div>
        <div className="card mt-4 bg-muted/70 p-5 text-sm text-muted-ink">
          <strong className="text-ink">Ny hyresgäst?</strong> Du får en inbjudan av oss när ditt hyresavtal börjar –
          kontakta oss om du saknar den.
        </div>
      </div>
    </div>
  );
}
