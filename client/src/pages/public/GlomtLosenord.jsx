import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { auth } from '../../lib/api.js';
import { Field, inputProps, SubmitButton } from '../../components/form.jsx';

export default function GlomtLosenord() {
  usePageMeta({ title: 'Glömt lösenord | Fallens Fastigheter', noindex: true });
  const [epost, setEpost] = useState('');
  const [laddar, setLaddar] = useState(false);
  const [klart, setKlart] = useState(false);
  const skicka = async (e) => {
    e.preventDefault();
    setLaddar(true);
    try { await auth.glomtLosenord({ epost }); } catch { /* medvetet tyst – avslöja inte konton */ }
    setKlart(true);
    setLaddar(false);
  };
  return (
    <div className="container-site section">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="h2">Glömt lösenord</h1>
        {klart ? (
          <p className="mt-4 text-muted-ink">Om e-postadressen finns hos oss har vi skickat en återställningslänk. Kolla din inkorg (och skräpposten).</p>
        ) : (
          <form onSubmit={skicka} noValidate className="mt-6 space-y-5">
            <p className="text-muted-ink">Ange din e-postadress så skickar vi en länk för att välja ett nytt lösenord.</p>
            <Field id="gl-epost" label="E-post" obligatorisk>
              <input type="email" {...inputProps('gl-epost')} autoComplete="email" value={epost} onChange={(e) => setEpost(e.target.value)} />
            </Field>
            <SubmitButton laddar={laddar} className="btn-primary w-full">Skicka återställningslänk</SubmitButton>
          </form>
        )}
        <p className="mt-5 text-center"><Link to="/login" className="text-sm font-semibold text-primary hover:underline">Tillbaka till inloggning</Link></p>
      </div>
    </div>
  );
}
