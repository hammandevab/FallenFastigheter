import { useMemo, useState } from 'react';
import { pub } from '../lib/api.js';
import { Field, inputProps, textareaProps, useFormFel, validera, SpamFields, SubmitButton, GdprText } from './form.jsx';

/** Intresse-/förfrågningsformulär för bostad, lokal och förvaltning (§4.2/4.3/4.9). */
export function LeadForm({ typ, unitId, rubrik, knapp = 'Skicka intresseanmälan', meddelandeLabel = 'Berätta vad du söker', id }) {
  const startad = useMemo(() => Date.now(), []);
  const [v, setV] = useState({ namn: '', epost: '', telefon: '', foretag: '', fastighetBestand: '', ort: '', storlek: '', meddelande: '' });
  const [laddar, setLaddar] = useState(false);
  const [klart, setKlart] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV({ ...v, [f]: e.target.value });

  const skicka = async (e) => {
    e.preventDefault();
    const nya = validera(v, {
      namn: { kravs: 'Ange ditt namn' },
      epost: { kravs: 'Ange din e-postadress', epost: true },
      meddelande: { kravs: typ === 'forvaltning' ? 'Beskriv vad du behöver hjälp med' : 'Skriv ett meddelande' },
    });
    if (Object.keys(nya).length) return sattFel(nya);
    setLaddar(true);
    try {
      const fd = new FormData(e.target);
      await pub.lead(typ, {
        ...v, unit: unitId || undefined,
        webbplats: fd.get('webbplats') || '',
        startadMs: Number(fd.get('startadMs')) || startad,
      });
      setKlart(true);
    } catch (err) {
      sattFel({ _form: err.message });
    } finally {
      setLaddar(false);
    }
  };

  if (klart) {
    return (
      <div className="card p-8 text-center" id={id}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-atgardad/12 text-status-atgardad">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
        </span>
        <h3 className="h3 mt-4">Tack för ditt meddelande!</h3>
        <p className="mt-2 text-muted-ink">Vi har tagit emot dina uppgifter och hör av oss så snart vi kan. En bekräftelse har skickats till din e-post.</p>
      </div>
    );
  }

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="card p-6 md:p-8" id={id}>
      {rubrik && <h3 className="h3 mb-5">{rubrik}</h3>}
      <SpamFields startad={startad} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${typ}-namn`} label="Namn" obligatorisk fel={fel.namn}>
          <input {...inputProps(`${typ}-namn`, fel.namn)} autoComplete="name" value={v.namn} onChange={andra('namn')} />
        </Field>
        <Field id={`${typ}-epost`} label="E-post" obligatorisk fel={fel.epost}>
          <input type="email" {...inputProps(`${typ}-epost`, fel.epost)} autoComplete="email" value={v.epost} onChange={andra('epost')} />
        </Field>
        <Field id={`${typ}-telefon`} label="Telefon" fel={fel.telefon}>
          <input type="tel" {...inputProps(`${typ}-telefon`, fel.telefon)} autoComplete="tel" value={v.telefon} onChange={andra('telefon')} />
        </Field>
        {(typ === 'forvaltning' || typ === 'lokal') && (
          <Field id="fv-foretag" label="Företag">
            <input {...inputProps('fv-foretag')} autoComplete="organization" value={v.foretag} onChange={andra('foretag')} />
          </Field>
        )}
        {typ === 'forvaltning' && (
          <Field id="fv-fastighet" label="Fastighet/fastighetsbestånd">
            <input {...inputProps('fv-fastighet')} value={v.fastighetBestand} onChange={andra('fastighetBestand')} />
          </Field>
        )}
        {typ === 'forvaltning' && (
          <Field id="fv-ort" label="Ort">
            <input {...inputProps('fv-ort')} value={v.ort} onChange={andra('ort')} />
          </Field>
        )}
        {typ === 'forvaltning' && (
          <Field id="fv-storlek" label="Ungefärlig storlek">
            <input {...inputProps('fv-storlek')} placeholder="T.ex. antal lägenheter eller m²" value={v.storlek} onChange={andra('storlek')} />
          </Field>
        )}
      </div>
      <div className="mt-5">
        <Field id={`${typ}-medd`} label={typ === 'forvaltning' ? 'Vad behöver du hjälp med?' : meddelandeLabel} obligatorisk fel={fel.meddelande}>
          <textarea {...textareaProps(`${typ}-medd`, fel.meddelande)} value={v.meddelande} onChange={andra('meddelande')} />
        </Field>
      </div>
      {fel._form && <p className="field-error mt-4" role="alert">{fel._form}</p>}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton laddar={laddar}>{knapp}</SubmitButton>
      </div>
      <div className="mt-4"><GdprText /></div>
    </form>
  );
}
