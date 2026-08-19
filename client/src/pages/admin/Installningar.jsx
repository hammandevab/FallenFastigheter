import { useEffect, useState } from 'react';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { datumTid } from '../../lib/format.js';
import { Badge, useAsync } from '../../components/ui.jsx';
import { Field, inputProps, textareaProps, SubmitButton } from '../../components/form.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, DataTable } from './adminUi.jsx';

const FALT = [
  ['Kontaktuppgifter', 'Visas i sidfot, på kontaktsidan och i hyresgästportalen.', [
    ['telefon', 'Telefon', 'input'],
    ['epost', 'E-post', 'input'],
    ['besoksadress', 'Besöksadress', 'input'],
    ['oppettider', 'Öppettider', 'input'],
  ]],
  ['Jour', 'För akuta fel utanför kontorstid – visas vid felanmälan och i portalen.', [
    ['jourtelefon', 'Jourtelefon', 'input'],
    ['jourinstruktion', 'Jourinstruktion', 'textarea'],
  ]],
  ['Hyra & betalning', 'Underlag till sidan Hyra & betalning.', [
    ['bankgiro', 'Bankgiro', 'input'],
    ['ocrInfo', 'OCR-information', 'textarea'],
    ['autogiroInfo', 'Autogiro-information', 'textarea'],
    ['ekonomikontakt', 'Ekonomikontakt', 'input'],
  ]],
  ['Notismottagare', 'E-postadresser som får avisering när något nytt kommer in. Lämna tomt för att använda huvudadressen.', [
    ['notisEpostLeads', 'Nya leads', 'input'],
    ['notisEpostFelanmalan', 'Nya felanmälningar', 'input'],
    ['notisEpostAkut', 'Akuta felanmälningar', 'input'],
  ]],
  ['SEO', 'Suffix som läggs till i sidtitlar, t.ex. "Lediga bostäder – Fallens Fastigheter".', [
    ['seoTitelsuffix', 'Titelsuffix', 'input'],
  ]],
];

const LOGG_FARG = { skickad: 'atgardad', simulerad: 'vantar', fel: 'avvisad' };

export default function Installningar() {
  usePageMeta('Inställningar – Admin');
  const [form, setForm] = useState(null);
  const [sparar, setSparar] = useState(false);
  const { visa } = useToast();

  const { data: installningar } = useAsync(() => admin.installningar().then((r) => r.data), []);
  const { data: logg, laddar: loggLaddar, laddaOm: laddaOmLogg } = useAsync(() => admin.epostlogg().then((r) => r.data), []);
  const { data: diagnostik } = useAsync(() => admin.diagnostik().then((r) => r.data), []);

  useEffect(() => { if (installningar && !form) setForm(installningar); }, [installningar, form]);

  const epostCheck = (diagnostik?.checks || []).find((c) => c.id === 'epost' || /e-?post/i.test(c.etikett));
  const simulerad = epostCheck ? epostCheck.status !== 'pass' || /simuler/i.test(epostCheck.detalj || '') : (logg || []).some((l) => l.status === 'simulerad');

  const spara = async (e) => {
    e.preventDefault();
    setSparar(true);
    try {
      const body = {};
      FALT.forEach(([, , falt]) => falt.forEach(([k]) => { body[k] = form[k] || ''; }));
      const r = await admin.sparaInstallningar(body);
      setForm(r.data);
      visa('Inställningarna sparades');
    } catch (err) { visa(err.message, 'fel'); }
    finally { setSparar(false); }
  };

  const satt = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AdminSida rubrik="Inställningar" beskrivning="Sajtens kontaktuppgifter, jourinformation, betalningsunderlag och notismottagare – ändringar slår igenom direkt på sajten.">
      {!form ? (
        <div className="card p-8 text-center text-muted-ink">Laddar …</div>
      ) : (
        <form onSubmit={spara} noValidate className="space-y-6 max-w-3xl">
          {FALT.map(([rubrik, beskrivning, falt]) => (
            <section key={rubrik} className="card p-5 sm:p-6">
              <h2 className="font-semibold text-ink">{rubrik}</h2>
              <p className="text-sm text-muted-ink mt-0.5 mb-4">{beskrivning}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {falt.map(([namn, etikett, slag]) => (
                  <div key={namn} className={slag === 'textarea' ? 'sm:col-span-2' : ''}>
                    <Field id={`s-${namn}`} label={etikett}>
                      {slag === 'textarea'
                        ? <textarea {...textareaProps(`s-${namn}`)} rows={3} value={form[namn] || ''} onChange={satt(namn)} />
                        : <input {...inputProps(`s-${namn}`)} value={form[namn] || ''} onChange={satt(namn)} />}
                    </Field>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div className="flex gap-3">
            <SubmitButton laddar={sparar}>Spara inställningar</SubmitButton>
          </div>
        </form>
      )}

      <section className="mt-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="font-semibold text-ink text-lg">E-postlogg</h2>
          <button type="button" className="text-sm text-primary font-medium hover:underline" onClick={laddaOmLogg}>Uppdatera</button>
        </div>
        <p className="text-sm text-muted-ink mb-4">
          De 50 senaste utskicken.{' '}
          {simulerad
            ? 'E-post körs i simulerat läge – inga riktiga mejl skickas, men allt loggas här så att flödena kan verifieras. Ange SMTP-uppgifter i serverns miljövariabler för skarpa utskick.'
            : 'E-post skickas via konfigurerad SMTP-server.'}
        </p>
        <DataTable
          laddar={loggLaddar}
          rader={logg || []}
          tom="Inga utskick loggade ännu."
          sidstorlek={10}
          kolumner={[
            { rubrik: 'Tidpunkt', rendera: (l) => <span className="whitespace-nowrap text-muted-ink">{datumTid(l.createdAt)}</span> },
            { rubrik: 'Till', rendera: (l) => <span className="text-ink">{l.till}</span> },
            { rubrik: 'Ämne', rendera: (l) => <span className="text-muted-ink block max-w-md truncate">{l.amne}</span> },
            { rubrik: 'Status', rendera: (l) => <Badge color={LOGG_FARG[l.status] || 'neutral'}>{l.status === 'skickad' ? 'Skickad' : l.status === 'simulerad' ? 'Simulerad' : 'Fel'}</Badge> },
          ]}
        />
      </section>
    </AdminSida>
  );
}
