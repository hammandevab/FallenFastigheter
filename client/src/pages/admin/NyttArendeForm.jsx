import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { useAsync } from '../../components/ui.jsx';
import { kategoriNamn } from '../../lib/format.js';
import { Field, inputProps, textareaProps, SubmitButton, useFormFel } from '../../components/form.jsx';

const KATEGORIER = ['vvs', 'el', 'varme', 'vitvaror', 'dorr_fonster', 'tvattstuga', 'gemensamma', 'annat'];

/** Admin registrerar ärende åt hyresgäst (t.ex. inringt, §6.5). */
export function NyttArendeForm({ onKlar }) {
  const underlag = useAsync(() => admin.arendeUnderlag(), []);
  const [v, setV] = useState({ namn: '', telefon: '', epost: '', adress: '', lagenhetsnummer: '', kategori: '', beskrivning: '', akut: false, unit: '', tenant: '' });
  const [laddar, setLaddar] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const valjUnit = (e) => {
    const u = underlag.data?.units.find((x) => x._id === e.target.value);
    setV((x) => ({ ...x, unit: e.target.value, adress: u?.adress || x.adress, lagenhetsnummer: u?.beteckning || x.lagenhetsnummer }));
  };
  const valjTenant = (e) => {
    const t = underlag.data?.tenants.find((x) => x._id === e.target.value);
    setV((x) => ({ ...x, tenant: e.target.value, namn: t?.namn || x.namn, epost: t?.epost || x.epost }));
  };

  const skicka = async (e) => {
    e.preventDefault();
    setLaddar(true);
    try {
      const r = await admin.skapaArende({ ...v, unit: v.unit || null, tenant: v.tenant || null });
      onKlar(r.data);
    } catch (err) { sattFel({ _form: err.message }); }
    finally { setLaddar(false); }
  };

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="na-tenant" label="Koppla hyresgäst">
          <select id="na-tenant" className="field-input" value={v.tenant} onChange={valjTenant}>
            <option value="">Ingen koppling</option>
            {(underlag.data?.tenants || []).map((t) => <option key={t._id} value={t._id}>{t.namn}</option>)}
          </select>
        </Field>
        <Field id="na-unit" label="Koppla objekt">
          <select id="na-unit" className="field-input" value={v.unit} onChange={valjUnit}>
            <option value="">Ingen koppling</option>
            {(underlag.data?.units || []).map((u) => <option key={u._id} value={u._id}>{u.adress} {u.beteckning ? `(${u.beteckning})` : ''}</option>)}
          </select>
        </Field>
        <Field id="na-namn" label="Namn" obligatorisk><input {...inputProps('na-namn')} value={v.namn} onChange={andra('namn')} /></Field>
        <Field id="na-telefon" label="Telefon" obligatorisk><input type="tel" {...inputProps('na-telefon')} value={v.telefon} onChange={andra('telefon')} /></Field>
        <Field id="na-epost" label="E-post" obligatorisk><input type="email" {...inputProps('na-epost')} value={v.epost} onChange={andra('epost')} /></Field>
        <Field id="na-adress" label="Adress" obligatorisk><input {...inputProps('na-adress')} value={v.adress} onChange={andra('adress')} /></Field>
        <Field id="na-lgh" label="Lägenhetsnummer"><input {...inputProps('na-lgh')} value={v.lagenhetsnummer} onChange={andra('lagenhetsnummer')} /></Field>
        <Field id="na-kategori" label="Kategori" obligatorisk>
          <select {...inputProps('na-kategori', fel.kategori)} value={v.kategori} onChange={andra('kategori')}>
            <option value="">Välj …</option>
            {KATEGORIER.map((k) => <option key={k} value={k}>{kategoriNamn(k)}</option>)}
          </select>
        </Field>
      </div>
      <Field id="na-beskrivning" label="Beskrivning" obligatorisk>
        <textarea {...textareaProps('na-beskrivning')} value={v.beskrivning} onChange={andra('beskrivning')} /></Field>
      <label className="flex items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[color:var(--destructive)]" checked={v.akut} onChange={andra('akut')} />
        <span className="font-medium text-destructive">Akut ärende</span>
      </label>
      {fel._form && <p className="field-error" role="alert">{fel._form}</p>}
      <SubmitButton laddar={laddar}>Registrera ärende</SubmitButton>
    </form>
  );
}
