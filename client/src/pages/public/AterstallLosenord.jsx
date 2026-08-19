import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { auth } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, inputProps, SubmitButton } from '../../components/form.jsx';

export default function AterstallLosenord() {
  usePageMeta({ title: 'Välj nytt lösenord | Fallens Fastigheter', noindex: true });
  const [sp] = useSearchParams();
  const navigate = useNavigate();
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
      await auth.aterstallLosenord({ token: sp.get('token'), losenord });
      visa('Ditt lösenord är uppdaterat – logga in med det nya.');
      navigate('/login');
    } catch (err) { setFel(err.message); }
    finally { setLaddar(false); }
  };
  return (
    <div className="container-site section">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="h2">Välj nytt lösenord</h1>
        <form onSubmit={skicka} noValidate className="mt-6 space-y-5">
          <Field id="al-1" label="Nytt lösenord" obligatorisk hjalp="Minst 8 tecken">
            <input type="password" {...inputProps('al-1')} autoComplete="new-password" value={losenord} onChange={(e) => setLosenord(e.target.value)} />
          </Field>
          <Field id="al-2" label="Upprepa lösenordet" obligatorisk>
            <input type="password" {...inputProps('al-2')} autoComplete="new-password" value={igen} onChange={(e) => setIgen(e.target.value)} />
          </Field>
          {fel && <p className="field-error" role="alert">{fel}</p>}
          <SubmitButton laddar={laddar} className="btn-primary w-full">Spara lösenord</SubmitButton>
        </form>
        <p className="mt-5 text-center"><Link to="/login" className="text-sm font-semibold text-primary hover:underline">Tillbaka till inloggning</Link></p>
      </div>
    </div>
  );
}
