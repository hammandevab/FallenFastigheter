import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { useAsync } from '../../components/ui.jsx';
import { Field, inputProps, textareaProps, SubmitButton, useFormFel } from '../../components/form.jsx';

const tomt = { property: '', typ: 'bostad', beteckning: '', adress: '', vaning: '', ytaM2: '', hyraKrMan: '', rum: '', lokaltyp: 'kontor', beskrivning: '', tilltradeDatum: '', status: 'ledig', publicerad: false, attribut: { balkong: false, hiss: false, forradIngar: false, parkering: false, takhojd: '', lastintag: false, skyltlage: false } };

export function ObjektForm({ befintlig, onKlar }) {
  const fastigheter = useAsync(() => admin.fastigheter({}), []);
  const [v, setV] = useState(befintlig ? {
    ...tomt, ...befintlig,
    property: befintlig.property?._id || befintlig.property || '',
    ytaM2: befintlig.ytaM2 ?? '', hyraKrMan: befintlig.hyraKrMan ?? '', rum: befintlig.rum ?? '',
    lokaltyp: befintlig.lokaltyp || 'kontor',
    tilltradeDatum: befintlig.tilltradeDatum ? befintlig.tilltradeDatum.slice(0, 10) : '',
    attribut: { ...tomt.attribut, ...(befintlig.attribut || {}) },
  } : tomt);
  const [laddar, setLaddar] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const andraA = (f) => (e) => setV((x) => ({ ...x, attribut: { ...x.attribut, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } }));

  const skicka = async (e) => {
    e.preventDefault();
    setLaddar(true);
    try {
      const body = {
        ...v,
        ytaM2: v.ytaM2 === '' ? null : Number(v.ytaM2),
        hyraKrMan: v.hyraKrMan === '' ? null : Number(v.hyraKrMan),
        rum: v.typ === 'bostad' && v.rum !== '' ? Number(v.rum) : null,
        lokaltyp: v.typ === 'lokal' ? v.lokaltyp : null,
        tilltradeDatum: v.tilltradeDatum || null,
      };
      delete body._id; delete body.bilder; delete body.planritning; delete body.createdAt; delete body.updatedAt; delete body.__v; delete body.publiceradDatum;
      const r = befintlig ? await admin.uppdateraObjekt(befintlig._id, body) : await admin.skapaObjekt(body);
      onKlar(r.data);
    } catch (err) { sattFel({ _form: err.message }); }
    finally { setLaddar(false); }
  };

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="of-fastighet" label="Fastighet" obligatorisk>
          <select id="of-fastighet" className="field-input" value={v.property} onChange={andra('property')}>
            <option value="">Välj fastighet …</option>
            {(fastigheter.data || []).map((f) => <option key={f._id} value={f._id}>{f.namn}</option>)}
          </select>
        </Field>
        <Field id="of-typ" label="Typ" obligatorisk>
          <select id="of-typ" className="field-input" value={v.typ} onChange={andra('typ')}>
            <option value="bostad">Bostad</option><option value="lokal">Lokal</option>
          </select>
        </Field>
        <Field id="of-adress" label="Adress" obligatorisk><input {...inputProps('of-adress')} value={v.adress} onChange={andra('adress')} /></Field>
        <Field id="of-beteckning" label="Objektnummer/beteckning"><input {...inputProps('of-beteckning')} value={v.beteckning} onChange={andra('beteckning')} /></Field>
        <Field id="of-vaning" label="Våning"><input {...inputProps('of-vaning')} value={v.vaning} onChange={andra('vaning')} /></Field>
        <Field id="of-yta" label="Yta (m²)"><input type="number" min="0" {...inputProps('of-yta')} value={v.ytaM2} onChange={andra('ytaM2')} /></Field>
        <Field id="of-hyra" label="Hyra (kr/mån)"><input type="number" min="0" {...inputProps('of-hyra')} value={v.hyraKrMan} onChange={andra('hyraKrMan')} /></Field>
        <Field id="of-tilltrade" label="Tillträdesdatum"><input type="date" {...inputProps('of-tilltrade')} value={v.tilltradeDatum} onChange={andra('tilltradeDatum')} /></Field>
        {v.typ === 'bostad' ? (
          <Field id="of-rum" label="Antal rum">
            <select id="of-rum" className="field-input" value={v.rum} onChange={andra('rum')}>
              <option value="">Välj …</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 5 ? '+' : ''} rum</option>)}
            </select>
          </Field>
        ) : (
          <Field id="of-lokaltyp" label="Lokaltyp">
            <select id="of-lokaltyp" className="field-input" value={v.lokaltyp} onChange={andra('lokaltyp')}>
              {[['kontor', 'Kontor'], ['butik', 'Butik'], ['lager', 'Lager'], ['verkstad', 'Verkstad'], ['ovrigt', 'Övrigt']].map(([val, n]) => <option key={val} value={val}>{n}</option>)}
            </select>
          </Field>
        )}
        <Field id="of-status" label="Status">
          <select id="of-status" className="field-input" value={v.status} onChange={andra('status')}>
            <option value="ledig">Ledig</option><option value="uthyrd">Uthyrd</option><option value="kommande">Kommande</option>
          </select>
        </Field>
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Attribut</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {v.typ === 'bostad' ? (
            [['balkong', 'Balkong'], ['hiss', 'Hiss'], ['forradIngar', 'Förråd ingår'], ['parkering', 'Parkering']].map(([f, n]) => (
              <label key={f} className="flex items-center gap-2.5">
                <input type="checkbox" className="h-5 w-5 accent-[color:var(--primary)]" checked={!!v.attribut[f]} onChange={andraA(f)} /> {n}
              </label>
            ))
          ) : (
            <>
              <Field id="of-takhojd" label="Takhöjd (m)"><input {...inputProps('of-takhojd')} value={v.attribut.takhojd} onChange={andraA('takhojd')} /></Field>
              {[['lastintag', 'Lastintag'], ['skyltlage', 'Skyltläge']].map(([f, n]) => (
                <label key={f} className="flex items-center gap-2.5 self-end pb-2.5">
                  <input type="checkbox" className="h-5 w-5 accent-[color:var(--primary)]" checked={!!v.attribut[f]} onChange={andraA(f)} /> {n}
                </label>
              ))}
            </>
          )}
        </div>
      </fieldset>

      <Field id="of-beskrivning" label="Beskrivning"><textarea {...textareaProps('of-beskrivning')} value={v.beskrivning} onChange={andra('beskrivning')} /></Field>
      <label className="flex items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[color:var(--primary)]" checked={v.publicerad} onChange={andra('publicerad')} />
        <span className="font-medium">Publicerad <span className="font-normal text-muted-ink">(syns publikt när status är Ledig och fastigheten är publicerad)</span></span>
      </label>
      {fel._form && <p className="field-error" role="alert">{fel._form}</p>}
      <SubmitButton laddar={laddar}>{befintlig ? 'Spara ändringar' : 'Skapa objekt'}</SubmitButton>
    </form>
  );
}
