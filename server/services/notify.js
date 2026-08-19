import { sendMail } from '../utils/mailer.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { config } from '../config/index.js';

const KATEGORI_NAMN = {
  vvs: 'VVS', el: 'El', varme: 'Värme', vitvaror: 'Vitvaror', dorr_fonster: 'Dörr & fönster',
  tvattstuga: 'Tvättstuga', gemensamma: 'Gemensamma utrymmen', annat: 'Annat',
};
const LEAD_NAMN = { bostad: 'Intresseanmälan bostad', lokal: 'Lokalförfrågan', forvaltning: 'Förvaltningsförfrågan', kontakt: 'Kontaktformulär' };
const STATUS_NAMN = { ny: 'Ny', pagaende: 'Pågående', vantar: 'Väntar', atgardad: 'Åtgärdad', stangd: 'Stängd', avvisad: 'Avvisad' };

export const statusNamn = (s) => STATUS_NAMN[s] || s;
export const kategoriNamn = (k) => KATEGORI_NAMN[k] || k;

export async function bekraftaLead(lead) {
  await sendMail({
    till: lead.epost,
    amne: `Tack för ditt meddelande – vi hör av oss`,
    rader: [
      `Hej ${lead.namn}!`,
      `Tack för din ${LEAD_NAMN[lead.typ].toLowerCase()}. Vi har tagit emot dina uppgifter och återkommer så snart vi kan.`,
      `Ditt meddelande: "${lead.meddelande}"`,
    ],
  });
  const s = await SiteSettings.get();
  if (s.notisEpostLeads) {
    await sendMail({
      till: s.notisEpostLeads,
      amne: `Ny lead: ${LEAD_NAMN[lead.typ]} – ${lead.namn}`,
      rader: [`Typ: ${LEAD_NAMN[lead.typ]}`, `Namn: ${lead.namn}`, `E-post: ${lead.epost}`, lead.telefon ? `Telefon: ${lead.telefon}` : '', `Meddelande: ${lead.meddelande}`].filter(Boolean),
      knappText: 'Öppna i Förvaltning', knappUrl: `${config.appUrl}/admin/leads`,
    });
  }
}

export async function bekraftaFelanmalan(fault) {
  const s = await SiteSettings.get();
  await sendMail({
    till: fault.epost,
    amne: `Felanmälan mottagen – ärende #${fault.arendenummer}`,
    rader: [
      `Hej ${fault.namn}!`,
      `Vi har tagit emot din felanmälan och den har fått ärendenummer #${fault.arendenummer}. Ange numret om du kontaktar oss om ärendet.`,
      `Kategori: ${kategoriNamn(fault.kategori)}. ${fault.akut ? 'Ärendet är markerat som akut.' : ''}`,
      fault.akut && s.jourtelefon ? `Vid akut fel utanför kontorstid: ${s.jourtelefon}.` : '',
      'Vid brand, pågående inbrott eller fara för liv – ring alltid 112.',
    ].filter(Boolean),
  });
  const till = [s.notisEpostFelanmalan, fault.akut ? s.notisEpostAkut : null].filter(Boolean);
  for (const t of [...new Set(till)]) {
    await sendMail({
      till: t,
      amne: `${fault.akut ? 'AKUT – ' : ''}Ny felanmälan #${fault.arendenummer}: ${kategoriNamn(fault.kategori)}`,
      rader: [`Adress: ${fault.adress}${fault.lagenhetsnummer ? ' (' + fault.lagenhetsnummer + ')' : ''}`, `Anmälare: ${fault.namn}, ${fault.telefon}`, `Beskrivning: ${fault.beskrivning}`],
      knappText: 'Öppna ärendet', knappUrl: `${config.appUrl}/admin/felanmalningar/${fault._id}`,
    });
  }
}

export async function meddelaAnmalaren(fault, { rubrik, rader }) {
  await sendMail({
    till: fault.epost,
    amne: `${rubrik} – ärende #${fault.arendenummer}`,
    rader: [`Hej ${fault.namn}!`, ...rader],
    knappText: fault.tenant ? 'Följ ärendet på Mina sidor' : undefined,
    knappUrl: fault.tenant ? `${config.appUrl}/mina-sidor/felanmalningar/${fault._id}` : undefined,
  });
}

export async function skickaInbjudan(user, token) {
  await sendMail({
    till: user.epost,
    amne: 'Välkommen till Mina sidor hos Fallens Fastigheter',
    rader: [
      `Hej ${user.namn}!`,
      'Du har blivit inbjuden till Mina sidor – vår hyresgästportal där du ser ditt boende, dina felanmälningar, dokument och information om din fastighet.',
      'Klicka på länken nedan för att välja lösenord. Länken gäller i 7 dagar.',
    ],
    knappText: 'Aktivera mitt konto',
    knappUrl: `${config.appUrl}/aktivera-konto?token=${token}`,
  });
}

export async function skickaAterstallning(user, token) {
  await sendMail({
    till: user.epost,
    amne: 'Återställ ditt lösenord',
    rader: [`Hej ${user.namn}!`, 'Klicka på länken nedan för att välja ett nytt lösenord. Länken gäller i 2 timmar. Om du inte begärt detta kan du bortse från mailet.'],
    knappText: 'Välj nytt lösenord',
    knappUrl: `${config.appUrl}/aterstall-losenord?token=${token}`,
  });
}

export async function skickaEpostVerifiering(user, nyEpost, token) {
  await sendMail({
    till: nyEpost,
    amne: 'Bekräfta din nya e-postadress',
    rader: [`Hej ${user.namn}!`, 'Klicka på länken nedan för att bekräfta att detta är din nya e-postadress för Mina sidor.'],
    knappText: 'Bekräfta e-postadress',
    knappUrl: `${config.appUrl}/verifiera-epost?token=${token}`,
  });
}
