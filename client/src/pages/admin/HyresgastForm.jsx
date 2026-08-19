import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { Field, inputProps, textareaProps, SubmitButton, useFormFel } from '../../components/form.jsx';

const tomt = { typ: 'privat', namn: '', epost: '', telefon: '', orgnr: '', kontaktperson: '', internaAnteckningar: '' };

export function HyresgastForm({ befintlig, onKlar }) {
  const [v, setV] = useState(befintlig ? { ...tomt, ...befintlig } : tomt);
  const [laddar, setLaddar] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.value }));

  const skicka = async (e) => {
    e.preventDefault();
    setLaddar(true);
    try {
      const body = { typ: v.typ, namn: v.namn, epost: v.epost, telefon: v.telefon, orgnr: v.orgnr, kontaktperson: v.kontaktperson, internaAnteckningar: v.internaAnteckningar };
      const r = befintlig ? await admin.uppdateraHyresgast(befintlig._id, body) : await admin.skapaHyresgast(body);
      onKlar(r.data);
    } catch (err) { sattFel({ _form: err.message }); }
    finally { setLaddar(false); }
  };

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="space-y-4">
      <Field id="hg-typ" label="Typ">
        <select id="hg-typ" className="field-input" value={v.typ} onChange={andra('typ')}>
          <option value="privat">Privatperson</option><option value="foretag">Företag</option>
        </select>
      </Field>
      <Field id="hg-namn" label={v.typ === 'foretag' ? 'Företagsnamn' : 'Namn'} obligatorisk>
        <input {...inputProps('hg-namn')} value={v.namn} onChange={andra('namn')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="hg-epost" label="E-post" hjalp="Krävs för portalinbjudan"><input type="email" {...inputProps('hg-epost')} value={v.epost} onChange={andra('epost')} /></Field>
        <Field id="hg-telefon" label="Telefon"><input type="tel" {...inputProps('hg-telefon')} value={v.telefon} onChange={andra('telefon')} /></Field>
        {v.typ === 'foretag' && <Field id="hg-orgnr" label="Organisationsnummer"><input {...inputProps('hg-orgnr')} value={v.orgnr} onChange={andra('orgnr')} /></Field>}
        {v.typ === 'foretag' && <Field id="hg-kontakt" label="Kontaktperson"><input {...inputProps('hg-kontakt')} value={v.kontaktperson} onChange={andra('kontaktperson')} /></Field>}
      </div>
      <Field id="hg-ant" label="Interna anteckningar" hjalp="Syns aldrig för hyresgästen">
        <textarea {...textareaProps('hg-ant')} value={v.internaAnteckningar} onChange={andra('internaAnteckningar')} /></Field>
      {fel._form && <p className="field-error" role="alert">{fel._form}</p>}
      <SubmitButton laddar={laddar}>{befintlig ? 'Spara ändringar' : 'Skapa hyresgäst'}</SubmitButton>
    </form>
  );
}
