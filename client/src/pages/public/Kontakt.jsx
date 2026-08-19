import { useMemo, useState } from 'react';
import { usePageMeta } from '../../lib/meta.js';
import { useSite } from '../../context/SiteContext.jsx';
import { pub } from '../../lib/api.js';
import { PageHeader } from '../../components/layout.jsx';
import { Ikon } from '../../components/cards.jsx';
import { Field, inputProps, textareaProps, useFormFel, validera, SpamFields, SubmitButton, GdprText } from '../../components/form.jsx';

const ROLLER = [['bostadssokande', 'Bostadssökande'], ['foretag', 'Företag'], ['hyresgast', 'Hyresgäst'], ['fastighetsagare', 'Fastighetsägare'], ['annat', 'Annat']];

export default function Kontakt() {
  usePageMeta({
    title: 'Kontakta Fallens Fastigheter i Trollhättan & Vänersborg',
    description: 'Ring, mejla eller skriv till oss. Här hittar du alla kontaktvägar till Fallens Fastigheter – och ett formulär som når rätt person direkt.',
  });
  const { site } = useSite();
  const k = site?.installningar || {};
  const startad = useMemo(() => Date.now(), []);
  const [v, setV] = useState({ roll: 'bostadssokande', namn: '', epost: '', telefon: '', meddelande: '' });
  const [laddar, setLaddar] = useState(false);
  const [klart, setKlart] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV({ ...v, [f]: e.target.value });

  const skicka = async (e) => {
    e.preventDefault();
    const nya = validera(v, {
      namn: { kravs: 'Ange ditt namn' },
      epost: { kravs: 'Ange din e-postadress', epost: true },
      meddelande: { kravs: 'Skriv ett meddelande' },
    });
    if (Object.keys(nya).length) return sattFel(nya);
    setLaddar(true);
    try {
      const fd = new FormData(e.target);
      await pub.lead('kontakt', { ...v, webbplats: fd.get('webbplats') || '', startadMs: Number(fd.get('startadMs')) || startad });
      setKlart(true);
    } catch (err) { sattFel({ _form: err.message }); }
    finally { setLaddar(false); }
  };

  const kontaktkort = [
    ['telefon', 'Telefon', k.telefon, k.telefon && `tel:${k.telefon.replace(/[^+\d]/g, '')}`],
    ['info', 'E-post', k.epost, k.epost && `mailto:${k.epost}`],
    ['hus', 'Besöksadress', k.besoksadress],
    ['ora', 'Öppettider', k.oppettider],
  ];

  return (
    <>
      <PageHeader rubrik="Kontakta oss" ingress="Ring, mejla eller skriv till oss här – vi svarar så snart vi kan." />
      <div className="container-site section !pt-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            {klart ? (
              <div className="card p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-atgardad/12 text-status-atgardad">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
                </span>
                <h2 className="h3 mt-4">Tack för ditt meddelande!</h2>
                <p className="mt-2 text-muted-ink">Vi återkommer till dig så snart vi kan. En bekräftelse har skickats till din e-post.</p>
              </div>
            ) : (
              <form ref={rot} onSubmit={skicka} noValidate className="card p-6 md:p-8">
                <SpamFields startad={startad} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field id="ko-roll" label="Jag är …" obligatorisk>
                      <select id="ko-roll" className="field-input" value={v.roll} onChange={andra('roll')}>
                        {ROLLER.map(([val, namn]) => <option key={val} value={val}>{namn}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field id="ko-namn" label="Namn" obligatorisk fel={fel.namn}>
                    <input {...inputProps('ko-namn', fel.namn)} autoComplete="name" value={v.namn} onChange={andra('namn')} />
                  </Field>
                  <Field id="ko-epost" label="E-post" obligatorisk fel={fel.epost}>
                    <input type="email" {...inputProps('ko-epost', fel.epost)} autoComplete="email" value={v.epost} onChange={andra('epost')} />
                  </Field>
                  <Field id="ko-telefon" label="Telefon" fel={fel.telefon}>
                    <input type="tel" {...inputProps('ko-telefon', fel.telefon)} autoComplete="tel" value={v.telefon} onChange={andra('telefon')} />
                  </Field>
                </div>
                <div className="mt-5">
                  <Field id="ko-medd" label="Meddelande" obligatorisk fel={fel.meddelande}>
                    <textarea {...textareaProps('ko-medd', fel.meddelande)} value={v.meddelande} onChange={andra('meddelande')} />
                  </Field>
                </div>
                {fel._form && <p className="field-error mt-4" role="alert">{fel._form}</p>}
                <div className="mt-6"><SubmitButton laddar={laddar}>Skicka meddelande</SubmitButton></div>
                <div className="mt-4"><GdprText /></div>
              </form>
            )}
          </div>
          <aside className="space-y-4">
            {kontaktkort.map(([ikon, rubrik, varde, href]) => (
              <div key={rubrik} className="card flex gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-primary"><Ikon namn={ikon} /></span>
                <div>
                  <h2 className="font-semibold">{rubrik}</h2>
                  {varde ? (
                    href ? <a href={href} className="mt-0.5 block text-primary hover:underline">{varde}</a>
                      : <p className="mt-0.5 whitespace-pre-line text-muted-ink">{varde}</p>
                  ) : (
                    <p className="mt-0.5 text-muted-ink">Uppgiften läggs in när den är bekräftad.</p>
                  )}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
