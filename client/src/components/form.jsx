import { useRef, useState } from 'react';

export function Field({ id, label, obligatorisk, fel, hjalp, children }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {obligatorisk && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {fel && <p className="field-error" id={`${id}-fel`} role="alert">{fel}</p>}
      {hjalp && !fel && <p className="field-help">{hjalp}</p>}
    </div>
  );
}

export const inputProps = (id, fel) => ({
  id, 'aria-invalid': !!fel || undefined, 'aria-describedby': fel ? `${id}-fel` : undefined,
  className: `field-input ${fel ? 'input-invalid' : ''}`,
});
export const textareaProps = (id, fel) => ({
  id, 'aria-invalid': !!fel || undefined, 'aria-describedby': fel ? `${id}-fel` : undefined,
  className: `field-textarea ${fel ? 'input-invalid' : ''}`,
});

/** Formstate + fokus till första felet (§9.5). */
export function useFormFel() {
  const [fel, setFel] = useState({});
  const rot = useRef(null);
  const sattFel = (nya) => {
    setFel(nya);
    setTimeout(() => rot.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
  };
  return { fel, sattFel, rensa: () => setFel({}), rot };
}

export function validera(varden, regler) {
  const fel = {};
  for (const [falt, regel] of Object.entries(regler)) {
    const v = (varden[falt] ?? '').toString().trim();
    if (regel.kravs && !v) fel[falt] = regel.kravs;
    else if (v && regel.epost && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fel[falt] = 'Ange en giltig e-postadress';
    else if (v && regel.min && v.length < regel.min) fel[falt] = `Minst ${regel.min} tecken`;
  }
  return fel;
}

/** Spamskydd: honeypot + tidsstämpel (§11.2). */
export function SpamFields({ startad }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>Lämna fältet tomt<input type="text" name="webbplats" tabIndex="-1" autoComplete="off" /></label>
      <input type="hidden" name="startadMs" value={startad} readOnly />
    </div>
  );
}

/** Bilduppladdning med förhandsvisning; mobil kamera via capture (§4.6). */
export function FileUpload({ filer, sattFiler, max = 8, label = 'Bifoga bilder' }) {
  const ref = useRef(null);
  const laggTill = (nya) => {
    const alla = [...filer, ...Array.from(nya)].slice(0, max);
    sattFiler(alla);
  };
  return (
    <div>
      <div
        className="rounded border-2 border-dashed border-line bg-muted/50 p-5 text-center hover:border-primary transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); laggTill(e.dataTransfer.files); }}
      >
        <p className="text-sm text-muted-ink mb-3">Ta en bild direkt med mobilkameran eller välj från ditt bildbibliotek. Dra och släpp fungerar också.</p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => ref.current?.click()}>{label}</button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/heic,image/webp" capture="environment" multiple className="sr-only"
          onChange={(e) => { laggTill(e.target.files); e.target.value = ''; }} />
        <p className="mt-2 text-xs text-muted-ink">JPG, PNG eller HEIC · max 10 MB per bild · upp till {max} bilder</p>
      </div>
      {filer.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {filer.map((f, i) => (
            <li key={i} className="relative">
              <img src={URL.createObjectURL(f)} alt={`Bifogad bild ${i + 1}`} className="h-20 w-20 rounded object-cover border border-line" />
              <button type="button" aria-label={`Ta bort bild ${i + 1}`}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-ink text-white text-xs font-bold shadow"
                onClick={() => sattFiler(filer.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SubmitButton({ laddar, children, className = 'btn-primary' }) {
  return (
    <button type="submit" className={className} disabled={laddar}>
      {laddar && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function GdprText() {
  return (
    <p className="text-sm text-muted-ink">
      Så behandlar vi dina uppgifter: det du skickar in används bara för att hantera ditt ärende och sparas inte längre än nödvändigt.
      Läs mer i vår <a href="/integritetspolicy" className="underline hover:text-primary">integritetspolicy</a>.
    </p>
  );
}
