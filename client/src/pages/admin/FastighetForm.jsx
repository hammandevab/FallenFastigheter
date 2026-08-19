import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { admin } from '../../lib/api.js';
import { Field, inputProps, textareaProps, SubmitButton, useFormFel } from '../../components/form.jsx';

const tomtVarde = { namn: '', slug: '', adress: '', ort: 'trollhattan', beskrivning: '', byggar: '', lat: '', lng: '', publicerad: false, praktiskInfo: { bredband: '', tvattstuga: '', parkering: '', sopsortering: '', ovrigt: '' } };
const slugifiera = (s) => s.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Fastighetsformulär med kartklick för koordinater (§6.2). */
export function FastighetForm({ befintlig, onKlar }) {
  const [v, setV] = useState(befintlig ? {
    ...tomtVarde, ...befintlig, byggar: befintlig.byggar ?? '', lat: befintlig.lat ?? '', lng: befintlig.lng ?? '',
    praktiskInfo: { ...tomtVarde.praktiskInfo, ...(befintlig.praktiskInfo || {}) },
  } : tomtVarde);
  const [laddar, setLaddar] = useState(false);
  const { fel, sattFel, rot } = useFormFel();
  const kartRef = useRef(null);
  const kartaRef = useRef(null);
  const markorRef = useRef(null);
  const andra = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const andraP = (f) => (e) => setV((x) => ({ ...x, praktiskInfo: { ...x.praktiskInfo, [f]: e.target.value } }));

  useEffect(() => {
    if (!kartRef.current || kartaRef.current) return;
    const karta = L.map(kartRef.current, { scrollWheelZoom: false }).setView([v.lat || 58.32, v.lng || 12.35], v.lat ? 14 : 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(karta);
    const sattMarkor = (lat, lng) => {
      if (markorRef.current) markorRef.current.setLatLng([lat, lng]);
      else markorRef.current = L.marker([lat, lng], { icon: L.divIcon({ className: 'map-marker', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(karta);
    };
    if (v.lat && v.lng) sattMarkor(v.lat, v.lng);
    karta.on('click', (e) => {
      const lat = +e.latlng.lat.toFixed(6), lng = +e.latlng.lng.toFixed(6);
      sattMarkor(lat, lng);
      setV((x) => ({ ...x, lat, lng }));
    });
    kartaRef.current = karta;
    return () => { karta.remove(); kartaRef.current = null; markorRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skicka = async (e) => {
    e.preventDefault();
    setLaddar(true);
    try {
      const body = { ...v, byggar: v.byggar || null, lat: v.lat === '' ? null : Number(v.lat), lng: v.lng === '' ? null : Number(v.lng) };
      const r = befintlig ? await admin.uppdateraFastighet(befintlig._id, body) : await admin.skapaFastighet(body);
      onKlar(r.data);
    } catch (err) { sattFel({ _form: err.message }); }
    finally { setLaddar(false); }
  };

  return (
    <form ref={rot} onSubmit={skicka} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ff-namn" label="Namn" obligatorisk><input {...inputProps('ff-namn')} value={v.namn}
          onChange={(e) => setV((x) => ({ ...x, namn: e.target.value, slug: befintlig ? x.slug : slugifiera(e.target.value) }))} /></Field>
        <Field id="ff-slug" label="Slug" obligatorisk hjalp="Del av webbadressen, t.ex. kvarnberget-3">
          <input {...inputProps('ff-slug')} value={v.slug} onChange={andra('slug')} /></Field>
        <Field id="ff-adress" label="Adress" obligatorisk><input {...inputProps('ff-adress')} value={v.adress} onChange={andra('adress')} /></Field>
        <Field id="ff-ort" label="Ort" obligatorisk>
          <select id="ff-ort" className="field-input" value={v.ort} onChange={andra('ort')}>
            <option value="trollhattan">Trollhättan</option><option value="vanersborg">Vänersborg</option>
          </select></Field>
        <Field id="ff-byggar" label="Byggår"><input type="number" {...inputProps('ff-byggar')} value={v.byggar} onChange={andra('byggar')} /></Field>
      </div>
      <Field id="ff-beskrivning" label="Beskrivning"><textarea {...textareaProps('ff-beskrivning')} value={v.beskrivning} onChange={andra('beskrivning')} /></Field>

      <div>
        <p className="field-label">Position på kartan <span className="font-normal text-muted-ink">(klicka för att sätta koordinater)</span></p>
        <div ref={kartRef} className="h-64 w-full rounded-xl border border-line" />
        <p className="mt-1.5 text-sm text-muted-ink">{v.lat ? `Lat ${v.lat}, Lng ${v.lng}` : 'Ingen position satt – fastigheten visas då inte på kartan.'}</p>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Praktisk information (visas i portalen/inflytt)</legend>
        {[['bredband', 'Bredband'], ['tvattstuga', 'Tvättstuga'], ['parkering', 'Parkering'], ['sopsortering', 'Sopsortering'], ['ovrigt', 'Övrigt']].map(([f, l]) => (
          <Field key={f} id={`ff-${f}`} label={l}><input {...inputProps(`ff-${f}`)} value={v.praktiskInfo[f]} onChange={andraP(f)} /></Field>
        ))}
      </fieldset>

      <label className="flex items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[color:var(--primary)]" checked={v.publicerad} onChange={andra('publicerad')} />
        <span className="font-medium">Publicerad på webbplatsen</span>
      </label>
      {fel._form && <p className="field-error" role="alert">{fel._form}</p>}
      <SubmitButton laddar={laddar}>{befintlig ? 'Spara ändringar' : 'Skapa fastighet'}</SubmitButton>
    </form>
  );
}
