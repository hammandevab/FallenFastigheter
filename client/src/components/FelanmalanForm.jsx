import { useMemo, useState } from 'react';
import { pub, portal } from '../lib/api.js';
import { kategoriNamn } from '../lib/format.js';
import { Field, inputProps, textareaProps, useFormFel, validera, SpamFields, SubmitButton, GdprText, FileUpload } from './form.jsx';

const KATEGORIER = ['vvs', 'el', 'varme', 'vitvaror', 'dorr_fonster', 'tvattstuga', 'gemensamma', 'annat'];

/** Felanmälansformulär (§4.6) – används publikt och i portalen (förifyllt, §5.3). */
export function FelanmalanForm({ onKlart, forifyllt = null, boenden = null }) {
  const arPortal = !!forifyllt;
  const startad = useMemo(() => Date.now(), []);
  const [v, setV] = useState({
    namn: forifyllt?.namn || '', telefon: forifyllt?.telefon || '', epost: forifyllt?.epost || '',
    adress: forifyllt?.adress || '', lagenhetsnummer: forifyllt?.lagenhetsnummer || '',
    kategori: '', beskrivning: '', akut: 'nej',
    tenancyId: boenden?.[0]?._id || '',
  });
  const [filer, setFiler] = useState([]);
  const [laddar, setLaddar] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV({ ...v, [f]: e.target.value });

  const valjBoende = (e) => {
    const t = boenden?.find((b) => b._id === e.target.value);
    setV({ ...v, tenancyId: e.target.value, adress: t?.unit?.adress || v.adress, lagenhetsnummer: t?.unit?.beteckning || '' });
  };

  const skicka = async (e) => {
    e.preventDefault();
    const nya = validera(v, {
      namn: { kravs: 'Ange ditt namn' },
      telefon: { kravs: 'Ange ditt telefonnummer' },
      epost: { kravs: 'Ange din e-postadress', epost: true },
      adress: { kravs: 'Ange adressen där felet finns' },
      kategori: { kravs: 'Välj en kategori' },
      beskrivning: { kravs: 'Beskriv felet' },
    });
    if (Object.keys(nya).length) return sattFel(nya);
    setLaddar(true);
    try {
      const fd = new FormData();
      if (arPortal) {
        fd.append('tenancy', v.tenancyId);
        fd.append('kategori', v.kategori);
        fd.append('beskrivning', v.beskrivning);
        fd.append('telefon', v.telefon);
      } else {
        ['namn', 'telefon', 'epost', 'adress', 'lagenhetsnummer', 'kategori', 'beskrivning'].forEach((k) => fd.append(k, v[k]));
      }
      fd.set('akut', v.akut === 'ja' ? 'true' : 'false');
      fd.set('startadMs', String(startad));
      const hp = e.target.elements.webbplats;
      fd.set('webbplats', hp ? hp.value : '');
      filer.forEach((f) => fd.append('bilder', f));
      const r = arPortal ? await portal.nyFelanmalan(fd) : await pub.felanmalan(fd);
      onKlart(r.data);
    } catch (err) {
      sattFel({ _form: err.message });
    } finally {
      setLaddar(false);
    }
  };

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="card p-6 md:p-8">
      <SpamFields startad={startad} />

      {arPortal && boenden?.length > 1 && (
        <div className="mb-5">
          <Field id="fa-boende" label="Vilket boende gäller det?" obligatorisk>
            <select id="fa-boende" className="field-input" value={v.tenancyId} onChange={valjBoende}>
              {boenden.map((b) => <option key={b._id} value={b._id}>{b.unit?.adress} {b.unit?.beteckning ? `(${b.unit.beteckning})` : ''}</option>)}
            </select>
          </Field>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fa-namn" label="Namn" obligatorisk fel={fel.namn}>
          <input {...inputProps('fa-namn', fel.namn)} autoComplete="name" value={v.namn} onChange={andra('namn')} readOnly={arPortal} />
        </Field>
        <Field id="fa-telefon" label="Telefon" obligatorisk fel={fel.telefon}>
          <input type="tel" {...inputProps('fa-telefon', fel.telefon)} autoComplete="tel" value={v.telefon} onChange={andra('telefon')} />
        </Field>
        <Field id="fa-epost" label="E-post" obligatorisk fel={fel.epost}>
          <input type="email" {...inputProps('fa-epost', fel.epost)} autoComplete="email" value={v.epost} onChange={andra('epost')} readOnly={arPortal} />
        </Field>
        <Field id="fa-adress" label="Adress" obligatorisk fel={fel.adress} hjalp={arPortal ? undefined : 'Gatuadressen där felet finns'}>
          <input {...inputProps('fa-adress', fel.adress)} autoComplete="street-address" value={v.adress} onChange={andra('adress')} readOnly={arPortal && boenden?.length >= 1} />
        </Field>
        <Field id="fa-lgh" label="Lägenhetsnummer" fel={fel.lagenhetsnummer}>
          <input {...inputProps('fa-lgh')} value={v.lagenhetsnummer} onChange={andra('lagenhetsnummer')} />
        </Field>
        <Field id="fa-kategori" label="Kategori" obligatorisk fel={fel.kategori}>
          <select {...inputProps('fa-kategori', fel.kategori)} value={v.kategori} onChange={andra('kategori')}>
            <option value="">Välj kategori …</option>
            {KATEGORIER.map((k) => <option key={k} value={k}>{kategoriNamn(k)}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <Field id="fa-beskrivning" label="Beskrivning av felet" obligatorisk fel={fel.beskrivning}
          hjalp="Var finns felet, när började det och hur märks det?">
          <textarea {...textareaProps('fa-beskrivning', fel.beskrivning)} value={v.beskrivning} onChange={andra('beskrivning')} />
        </Field>
      </div>

      <div className="mt-5">
        <FileUpload filer={filer} sattFiler={setFiler} />
      </div>

      <fieldset className="mt-6">
        <legend className="field-label">Hur brådskande är felet?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[['nej', 'Ej akut', 'Felet kan vänta till ordinarie arbetstid.'], ['ja', 'Akut', 'Felet riskerar skada på person eller fastighet.']].map(([val, rubrik, text]) => (
            <label key={val} className={`flex cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors ${v.akut === val ? (val === 'ja' ? 'border-destructive bg-destructive/5' : 'border-primary bg-primary/5') : 'border-line hover:border-muted-ink/40'}`}>
              <input type="radio" name="akut" value={val} checked={v.akut === val} onChange={andra('akut')} className="mt-1 accent-[color:var(--primary)]" />
              <span>
                <span className={`block font-semibold ${val === 'ja' && v.akut === 'ja' ? 'text-destructive' : ''}`}>{rubrik}</span>
                <span className="text-sm text-muted-ink">{text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {fel._form && <p className="field-error mt-4" role="alert">{fel._form}</p>}
      <div className="mt-6"><SubmitButton laddar={laddar}>Skicka felanmälan</SubmitButton></div>
      <div className="mt-4"><GdprText /></div>
    </form>
  );
}
