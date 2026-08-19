import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { useAsync } from '../../components/ui.jsx';
import { Field, inputProps, SubmitButton, useFormFel } from '../../components/form.jsx';

/** Hyresförhållande: koppla hyresgäst ↔ objekt (§6.3/6.4). */
export function TenancyForm({ unitId, tenantId, befintlig, onKlar }) {
  const underlag = useAsync(() => admin.arendeUnderlag(), []);
  const [v, setV] = useState(befintlig ? {
    unit: befintlig.unit?._id || befintlig.unit, tenant: befintlig.tenant?._id || befintlig.tenant,
    startdatum: befintlig.startdatum?.slice(0, 10) || '', slutdatum: befintlig.slutdatum?.slice(0, 10) || '',
    uppsagdDatum: befintlig.uppsagdDatum?.slice(0, 10) || '',
    hyraKrMan: befintlig.hyraKrMan ?? '', status: befintlig.status || 'pagaende',
  } : { unit: unitId || '', tenant: tenantId || '', startdatum: '', slutdatum: '', uppsagdDatum: '', hyraKrMan: '', status: 'pagaende' });
  const [laddar, setLaddar] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const andra = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.value }));

  const skicka = async (e) => {
    e.preventDefault();
    setLaddar(true);
    try {
      const body = { ...v, hyraKrMan: v.hyraKrMan === '' ? null : Number(v.hyraKrMan), slutdatum: v.slutdatum || null, uppsagdDatum: v.uppsagdDatum || null };
      const r = befintlig ? await admin.uppdateraHyresforhallande(befintlig._id, body) : await admin.skapaHyresforhallande(body);
      onKlar(r.data);
    } catch (err) { sattFel({ _form: err.message }); }
    finally { setLaddar(false); }
  };

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="space-y-4">
      {!unitId && (
        <Field id="tf-unit" label="Objekt" obligatorisk>
          <select id="tf-unit" className="field-input" value={v.unit} onChange={andra('unit')}>
            <option value="">Välj objekt …</option>
            {(underlag.data?.units || []).map((u) => <option key={u._id} value={u._id}>{u.adress} {u.beteckning ? `(${u.beteckning})` : ''} – {u.property?.namn}</option>)}
          </select>
        </Field>
      )}
      {!tenantId && (
        <Field id="tf-tenant" label="Hyresgäst" obligatorisk>
          <select id="tf-tenant" className="field-input" value={v.tenant} onChange={andra('tenant')}>
            <option value="">Välj hyresgäst …</option>
            {(underlag.data?.tenants || []).map((t) => <option key={t._id} value={t._id}>{t.namn}{t.epost ? ` · ${t.epost}` : ''}</option>)}
          </select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="tf-start" label="Startdatum" obligatorisk><input type="date" {...inputProps('tf-start')} value={v.startdatum} onChange={andra('startdatum')} /></Field>
        <Field id="tf-hyra" label="Hyra (kr/mån)"><input type="number" min="0" {...inputProps('tf-hyra')} value={v.hyraKrMan} onChange={andra('hyraKrMan')} /></Field>
        <Field id="tf-uppsagd" label="Uppsagd datum"><input type="date" {...inputProps('tf-uppsagd')} value={v.uppsagdDatum} onChange={andra('uppsagdDatum')} /></Field>
        <Field id="tf-slut" label="Slutdatum"><input type="date" {...inputProps('tf-slut')} value={v.slutdatum} onChange={andra('slutdatum')} /></Field>
      </div>
      <Field id="tf-status" label="Status">
        <select id="tf-status" className="field-input" value={v.status} onChange={andra('status')}>
          {[['kommande', 'Kommande'], ['pagaende', 'Pågående'], ['uppsagd', 'Uppsagd'], ['avslutad', 'Avslutad']].map(([val, n]) => <option key={val} value={val}>{n}</option>)}
        </select>
      </Field>
      {fel._form && <p className="field-error" role="alert">{fel._form}</p>}
      <SubmitButton laddar={laddar}>{befintlig ? 'Spara' : 'Skapa hyresförhållande'}</SubmitButton>
    </form>
  );
}
