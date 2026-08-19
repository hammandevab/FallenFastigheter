import { useState } from 'react';
import { admin } from '../../lib/api.js';
import { usePageMeta } from '../../lib/meta.js';
import { datumTid, rollNamn } from '../../lib/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, ConfirmDialog, useAsync } from '../../components/ui.jsx';
import { Field, inputProps, useFormFel, validera, SubmitButton } from '../../components/form.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { AdminSida, DataTable, Panel } from './adminUi.jsx';

const STATUS_NAMN = { aktiv: 'Aktiv', inbjuden: 'Inbjuden', inaktiverad: 'Inaktiverad' };
const STATUS_FARG = { aktiv: 'atgardad', inbjuden: 'vantar', inaktiverad: 'stangd' };

export default function Anvandare() {
  usePageMeta('Användare – Admin');
  const { user: jag } = useAuth();
  const [nyPanel, setNyPanel] = useState(false);
  const [form, setForm] = useState({ namn: '', epost: '', losenord: '' });
  const [vald, setVald] = useState(null);
  const [sparar, setSparar] = useState(false);
  const [inaktivera, setInaktivera] = useState(null);
  const { fel, sattFel, rensa } = useFormFel();
  const { visa } = useToast();

  const { data: users, laddar, laddaOm } = useAsync(() => admin.anvandare().then((r) => r.data), []);

  const skapa = async (e) => {
    e.preventDefault();
    const nyaFel = validera(form, { namn: 'Ange namn', epost: 'Ange e-postadress', losenord: 'Ange lösenord' });
    if (form.losenord && form.losenord.length < 8) nyaFel.losenord = 'Minst 8 tecken';
    if (Object.keys(nyaFel).length) return sattFel(nyaFel);
    setSparar(true);
    try {
      await admin.skapaAnvandare(form);
      visa('Administratören skapades');
      setNyPanel(false);
      laddaOm();
    } catch (err) { sattFel({ _rot: err.message }); }
    finally { setSparar(false); }
  };

  const kor = async (fn, meddelande) => {
    setSparar(true);
    try {
      const r = await fn();
      visa(r?.data?.meddelande || meddelande);
      setVald(null);
      laddaOm();
    } catch (e) { visa(e.message, 'fel'); }
    finally { setSparar(false); }
  };

  const bekraftaInaktivera = () => {
    const u = inaktivera;
    setInaktivera(null);
    kor(() => admin.inaktiveraAnvandare(u.id), `${u.namn} inaktiverades`);
  };

  return (
    <AdminSida
      rubrik="Användare"
      beskrivning="Administratörer och hyresgästkonton. Hyresgästkonton skapas via inbjudan från hyresgästens sida – här hanterar du status och återställningar."
      knapp={<button type="button" className="btn-primary" onClick={() => { setForm({ namn: '', epost: '', losenord: '' }); rensa(); setNyPanel(true); }}>Ny administratör</button>}
    >
      <DataTable
        laddar={laddar}
        rader={users || []}
        onRad={(u) => setVald(u)}
        tom="Inga användare hittades."
        kolumner={[
          { rubrik: 'Namn', rendera: (u) => <span className="font-medium text-ink">{u.namn}{u.id === jag?.id && <span className="text-xs font-normal text-muted-ink ml-1.5">(du)</span>}</span> },
          { rubrik: 'E-post', rendera: (u) => <span className="text-muted-ink">{u.epost}</span> },
          { rubrik: 'Roll', rendera: (u) => <Badge color={u.roll === 'admin' ? 'primary' : 'neutral'}>{rollNamn(u.roll) === u.roll ? (u.roll === 'admin' ? 'Administratör' : 'Hyresgäst') : rollNamn(u.roll)}</Badge> },
          { rubrik: 'Status', rendera: (u) => <Badge color={STATUS_FARG[u.status] || 'neutral'}>{STATUS_NAMN[u.status] || u.status}</Badge> },
          { rubrik: 'Senast inloggad', rendera: (u) => <span className="text-muted-ink whitespace-nowrap">{u.senastInloggad ? datumTid(u.senastInloggad) : 'Aldrig'}</span>, klass: 'hidden md:table-cell' },
        ]}
      />

      <Panel oppen={nyPanel} rubrik="Ny administratör" onStang={() => setNyPanel(false)}>
        <form onSubmit={skapa} noValidate className="space-y-5">
          {fel._rot && <p className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fel._rot}</p>}
          <Field id="u-namn" label="Namn" obligatorisk fel={fel.namn}>
            <input {...inputProps('u-namn', fel.namn)} value={form.namn} onChange={(e) => setForm((f) => ({ ...f, namn: e.target.value }))} autoComplete="off" />
          </Field>
          <Field id="u-epost" label="E-postadress" obligatorisk fel={fel.epost}>
            <input {...inputProps('u-epost', fel.epost)} type="email" value={form.epost} onChange={(e) => setForm((f) => ({ ...f, epost: e.target.value }))} autoComplete="off" />
          </Field>
          <Field id="u-losen" label="Tillfälligt lösenord" obligatorisk fel={fel.losenord} hjalp="Minst 8 tecken. Be personen byta lösenord vid första inloggningen.">
            <input {...inputProps('u-losen', fel.losenord)} type="password" value={form.losenord} onChange={(e) => setForm((f) => ({ ...f, losenord: e.target.value }))} autoComplete="new-password" />
          </Field>
          <div className="flex gap-3 pt-2 border-t border-line">
            <SubmitButton laddar={sparar}>Skapa administratör</SubmitButton>
            <button type="button" className="btn-secondary" onClick={() => setNyPanel(false)}>Avbryt</button>
          </div>
        </form>
      </Panel>

      <Panel oppen={!!vald} rubrik={vald?.namn || ''} onStang={() => setVald(null)}>
        {vald && (
          <div className="space-y-6">
            <dl className="text-sm space-y-2">
              <div className="flex gap-3"><dt className="w-36 text-muted-ink">E-post</dt><dd className="text-ink">{vald.epost}</dd></div>
              <div className="flex gap-3"><dt className="w-36 text-muted-ink">Roll</dt><dd className="text-ink">{vald.roll === 'admin' ? 'Administratör' : 'Hyresgäst'}</dd></div>
              <div className="flex gap-3"><dt className="w-36 text-muted-ink">Status</dt><dd><Badge color={STATUS_FARG[vald.status] || 'neutral'}>{STATUS_NAMN[vald.status] || vald.status}</Badge></dd></div>
              <div className="flex gap-3"><dt className="w-36 text-muted-ink">Senast inloggad</dt><dd className="text-ink">{vald.senastInloggad ? datumTid(vald.senastInloggad) : 'Aldrig'}</dd></div>
              <div className="flex gap-3"><dt className="w-36 text-muted-ink">Konto skapat</dt><dd className="text-ink">{datumTid(vald.skapad)}</dd></div>
            </dl>

            <div className="space-y-3 pt-4 border-t border-line">
              <button type="button" className="btn-secondary w-full" disabled={sparar} onClick={() => kor(() => admin.aterstallAnvandare(vald.id), 'Återställningslänk skickad')}>
                Skicka lösenordsåterställning
              </button>
              {vald.status === 'inaktiverad' ? (
                <button type="button" className="btn-secondary w-full" disabled={sparar} onClick={() => kor(() => admin.aktiveraAnvandare(vald.id), `${vald.namn} aktiverades`)}>
                  Aktivera konto
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary w-full text-destructive"
                  disabled={sparar || vald.id === jag?.id}
                  onClick={() => setInaktivera(vald)}
                >
                  Inaktivera konto
                </button>
              )}
              {vald.id === jag?.id && <p className="text-xs text-muted-ink text-center">Du kan inte inaktivera ditt eget konto.</p>}
              {vald.roll === 'admin' && vald.id !== jag?.id && <p className="text-xs text-muted-ink text-center">Minst en aktiv administratör måste alltid finnas kvar.</p>}
            </div>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        oppen={!!inaktivera}
        rubrik="Inaktivera konto?"
        text={inaktivera ? `${inaktivera.namn} loggas ut och kan inte längre logga in förrän kontot aktiveras igen.` : ''}
        bekraftaText="Inaktivera"
        onBekrafta={bekraftaInaktivera}
        onAvbryt={() => setInaktivera(null)}
      />
    </AdminSida>
  );
}
