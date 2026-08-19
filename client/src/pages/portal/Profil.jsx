import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { auth } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, inputProps, SubmitButton } from '../../components/form.jsx';

export default function PortalProfil() {
  usePageMeta({ title: 'Profil – Mina sidor | Fallens Fastigheter', noindex: true });
  const { user, setUser } = useAuth();
  const { visa } = useToast();
  const [telefon, setTelefon] = useState(user?.telefon || '');
  const [nyEpost, setNyEpost] = useState('');
  const [lp, setLp] = useState({ nuvarande: '', nytt: '', igen: '' });
  const [laddar, setLaddar] = useState('');

  const sparaTelefon = async (e) => {
    e.preventDefault();
    setLaddar('telefon');
    try { const r = await auth.uppdateraMig({ telefon }); setUser(r.data); visa('Telefonnumret är sparat.'); }
    catch (err) { visa(err.message, 'fel'); }
    finally { setLaddar(''); }
  };

  const bytEpost = async (e) => {
    e.preventDefault();
    setLaddar('epost');
    try { await auth.bytEpost({ nyEpost }); setNyEpost(''); visa('Kolla din nya inkorg – klicka på länken för att bekräfta bytet.'); }
    catch (err) { visa(err.message, 'fel'); }
    finally { setLaddar(''); }
  };

  const bytLosenord = async (e) => {
    e.preventDefault();
    if (lp.nytt.length < 8) return visa('Nytt lösenord behöver minst 8 tecken', 'fel');
    if (lp.nytt !== lp.igen) return visa('Lösenorden matchar inte', 'fel');
    setLaddar('losen');
    try { await auth.bytLosenord({ nuvarande: lp.nuvarande, nytt: lp.nytt }); setLp({ nuvarande: '', nytt: '', igen: '' }); visa('Lösenordet är bytt.'); }
    catch (err) { visa(err.message, 'fel'); }
    finally { setLaddar(''); }
  };

  return (
    <>
      <h1 className="h1">Profil</h1>
      <div className="mt-8 grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="h3">Kontaktuppgifter</h2>
          <dl className="mt-4 space-y-2 text-[15px]">
            <div className="flex justify-between gap-4"><dt className="text-muted-ink">Namn</dt><dd className="font-medium">{user?.namn}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-ink">E-post</dt><dd className="font-medium">{user?.epost}</dd></div>
          </dl>
          <p className="mt-2 text-sm text-muted-ink">Namnet ändras via oss – hör av dig om något inte stämmer.</p>
          <form onSubmit={sparaTelefon} className="mt-5 space-y-4">
            <Field id="pf-tel" label="Telefon">
              <input type="tel" {...inputProps('pf-tel')} autoComplete="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            </Field>
            <SubmitButton laddar={laddar === 'telefon'} className="btn-secondary btn-sm">Spara telefon</SubmitButton>
          </form>
          <form onSubmit={bytEpost} className="mt-6 space-y-4 border-t border-line pt-5">
            <Field id="pf-epost" label="Byt e-postadress" hjalp="Vi skickar en bekräftelselänk till den nya adressen.">
              <input type="email" {...inputProps('pf-epost')} value={nyEpost} onChange={(e) => setNyEpost(e.target.value)} placeholder="ny@adress.se" />
            </Field>
            <SubmitButton laddar={laddar === 'epost'} className="btn-secondary btn-sm">Skicka bekräftelselänk</SubmitButton>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="h3">Byt lösenord</h2>
          <form onSubmit={bytLosenord} className="mt-4 space-y-4">
            <Field id="pf-l1" label="Nuvarande lösenord" obligatorisk>
              <input type="password" {...inputProps('pf-l1')} autoComplete="current-password" value={lp.nuvarande} onChange={(e) => setLp({ ...lp, nuvarande: e.target.value })} />
            </Field>
            <Field id="pf-l2" label="Nytt lösenord" obligatorisk hjalp="Minst 8 tecken">
              <input type="password" {...inputProps('pf-l2')} autoComplete="new-password" value={lp.nytt} onChange={(e) => setLp({ ...lp, nytt: e.target.value })} />
            </Field>
            <Field id="pf-l3" label="Upprepa nytt lösenord" obligatorisk>
              <input type="password" {...inputProps('pf-l3')} autoComplete="new-password" value={lp.igen} onChange={(e) => setLp({ ...lp, igen: e.target.value })} />
            </Field>
            <SubmitButton laddar={laddar === 'losen'} className="btn-primary btn-sm">Byt lösenord</SubmitButton>
          </form>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="h3">Dina personuppgifter</h2>
          <p className="mt-2 text-muted-ink">
            Läs hur vi behandlar dina uppgifter i vår <Link to="/integritetspolicy" className="text-primary hover:underline">integritetspolicy</Link>.
            Vill du ha ett registerutdrag eller begära radering? <Link to="/kontakt" className="text-primary hover:underline">Kontakta oss</Link> så hjälper vi dig.
          </p>
        </section>
      </div>
    </>
  );
}
