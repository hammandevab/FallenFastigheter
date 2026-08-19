/**
 * Seed (§11.4: "seed-data för demo"): körs automatiskt vid uppstart om databasen är tom.
 * Skapar admin, inställningar, FAQ (de 12 frågorna från §4.7.2 som startinnehåll)
 * samt – om SEED_DEMO=true – ett demoinnehåll som gör plattformen verifierbar direkt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ensureDirs, PUBLIC_DIR, PROTECTED_DIR } from '../utils/storage.js';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { Unit } from '../models/Unit.js';
import { Tenant } from '../models/Tenant.js';
import { Tenancy } from '../models/Tenancy.js';
import { FaultReport } from '../models/FaultReport.js';
import { FaultEvent } from '../models/FaultEvent.js';
import { Lead } from '../models/Lead.js';
import { NewsPost } from '../models/NewsPost.js';
import { DocumentFile } from '../models/DocumentFile.js';
import { DevelopmentProject } from '../models/DevelopmentProject.js';
import { FaqCategory, FaqItem } from '../models/Faq.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { nextArendenummer } from '../utils/seq.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, 'assets');

function kopiera(namn, { skyddad = false } = {}) {
  const kalla = path.join(ASSETS, namn);
  const mal = path.join(skyddad ? PROTECTED_DIR : PUBLIC_DIR, namn);
  fs.copyFileSync(kalla, mal);
  return `${skyddad ? 'protected' : 'public'}/${namn}`;
}
const bild = (namn) => ({ fil: kopiera(namn), liten: kopiera(namn) });

const FAQ = [
  ['Felanmälan', [
    ['Hur gör jag en felanmälan?', 'Enklast anmäler du fel via formuläret på sidan Felanmälan – det fungerar lika bra i mobilen, och du kan bifoga bilder direkt från kameran. Är du inloggad på Mina sidor är dina uppgifter redan ifyllda. Beskriv felet så noggrant du kan, så kan vi åtgärda det snabbare. Du får ett ärendenummer i bekräftelsen.'],
    ['Vad räknas som ett akut fel?', 'Akuta fel är sådant som inte kan vänta: vattenläckage, stopp i avlopp som svämmar över, strömavbrott i hela bostaden, värmebortfall vintertid, trasigt lås eller ytterdörr som inte går att låsa samt hisstopp. Markera "Akut" i felanmälan. Vid akut fel utanför kontorstid ringer du vår jour. Vid brand, pågående inbrott eller fara för liv – ring alltid 112.'],
  ]],
  ['Hyra', [
    ['När ska hyran betalas?', 'Hyran betalas i förskott och ska vara oss tillhanda senast sista vardagen före varje ny månad, om inget annat framgår av ditt hyresavtal. Betalningsuppgifter hittar du på din hyresavi och på sidan Hyra & betalning. Saknar du en avi – hör av dig så hjälper vi dig.'],
  ]],
  ['Nycklar', [
    ['Jag har tappat min nyckel – vad gör jag?', 'Kontakta oss så snart som möjligt så hjälper vi dig med ersättningsnyckel. Har nyckeln tappats bort på ett sätt som gör att låset kan behöva bytas kan en kostnad tillkomma. Utanför kontorstid, om du är utelåst, kan du behöva anlita låssmed – spara kvittot och kontakta oss dagen efter.'],
  ]],
  ['Inflyttning', [
    ['När får jag mina nycklar?', 'Nycklarna lämnas ut på tillträdesdagen enligt ditt hyresavtal. Boka tid med oss i förväg så att överlämningen blir smidig. Infaller tillträdesdagen på en helgdag lämnas nycklarna ut första vardagen därefter.'],
  ]],
  ['Utflyttning', [
    ['Hur säger jag upp min lägenhet?', 'Uppsägningen ska vara skriftlig. Använd blanketten under Dokument eller kontakta oss. Uppsägningstiden är normalt tre kalendermånader räknat från månadsskiftet efter att uppsägningen kommit oss tillhanda. Vi bekräftar alltid att vi tagit emot din uppsägning.'],
  ]],
  ['Tvättstuga', [
    ['Hur bokar jag tvättstugan?', 'Bokningen ser olika ut i olika fastigheter – i de flesta bokar du med bokningscylinder eller lista i tvättstugan. Hur det fungerar i just din fastighet ser du på fastighetens sida och i informationen du fick vid inflyttning. Osäker? Hör av dig så förklarar vi.'],
  ]],
  ['Parkering', [
    ['Kan jag hyra parkering eller garage?', 'I flera av våra fastigheter finns parkeringsplatser och i vissa fall garage att hyra. Tillgången varierar – kontakta oss och berätta var du bor, så ser vi vad som finns ledigt eller ställer dig i kö.'],
  ]],
  ['Störningar', [
    ['Vad gör jag om jag blir störd av en granne?', 'Prata i första hand med grannen – ofta vet den inte om att den stör. Hjälper inte det, eller känns det obekvämt, kontakta oss och beskriv vad som hänt och när. Vid allvarliga eller återkommande störningar dokumenterar vi och agerar. Vid pågående allvarlig störning nattetid kan störningsjour eller polis behöva kontaktas.'],
  ]],
  ['Ansvar i lägenheten', [
    ['Vad ansvarar jag för själv?', 'Du ansvarar för normal skötsel: byta glödlampor och säkringar, rensa golvbrunn och vattenlås, hålla rent bakom spis och kyl samt vårda lägenheten. Vi ansvarar för fastighetens underhåll och det som hör till lägenheten i övrigt – anmäl fel så tar vi hand om dem. Kom ihåg att hemförsäkring krävs under hela boendetiden.'],
  ]],
  ['Förråd', [
    ['Ingår förråd i min lägenhet?', 'Till de flesta av våra lägenheter hör ett förråd – vilket som är ditt framgår av hyresavtalet eller informationen vid inflyttning. Saknar du förråd, eller behöver du ett extra, hör av dig så ser vi vad som finns i din fastighet.'],
  ]],
];

export async function kanskeSeeda() {
  const antal = await User.countDocuments();
  if (antal > 0) return;
  ensureDirs();
  logger.info('Tom databas – kör seed …');

  // Admin
  const admin = new User({ epost: config.seedAdminEpost, namn: 'Fallens Förvaltning', roll: 'admin', status: 'aktiv' });
  await admin.sattLosenord(config.seedAdminLosen);
  await admin.save();

  // Inställningar (demovärden – redigeras under /admin/installningar)
  const s = await SiteSettings.get();
  Object.assign(s, {
    telefon: '0520-123 45', epost: 'info@fallens.se',
    besoksadress: 'Storgatan 12, 461 30 Trollhättan',
    oppettider: 'Vardagar 08.00–16.30 (lunchstängt 12.00–13.00)',
    jourtelefon: '0520-123 99', jourinstruktion: 'Jouren är till för akuta fel som inte kan vänta till nästa vardag.',
    bankgiro: 'Bankgiro 123-4567. Ange OCR-numret från din hyresavi vid betalning.',
    ocrInfo: 'OCR-numret hittar du på din hyresavi. Saknar du avi – kontakta oss.',
    autogiroInfo: 'Med autogiro dras hyran automatiskt sista vardagen före ny månad. Fyll i blanketten "Anmälan om autogiro" under Dokument och skicka den till oss.',
    ekonomikontakt: 'Frågor om hyra och avier: ekonomi@fallens.se eller 0520-123 45 (val 2).',
    notisEpostLeads: 'uthyrning@fallens.se',
    notisEpostFelanmalan: 'felanmalan@fallens.se',
    notisEpostAkut: 'jour@fallens.se',
  });
  await s.save();

  // FAQ – de 12 frågorna från spec §4.7.2
  let ordning = 0;
  for (const [kat, fragor] of FAQ) {
    const k = await FaqCategory.create({ namn: kat, ordning: ordning++ });
    let fo = 0;
    for (const [fraga, svar] of fragor) await FaqItem.create({ category: k._id, fraga, svar, ordning: fo++, publicerad: true });
  }

  if (!config.seedDemo) { logger.info('Seed klar (utan demoinnehåll).'); return; }

  // Fastigheter
  const [f1, f2, f3] = await Property.create([
    {
      namn: 'Kv. Möjligheten', slug: 'kv-mojligheten', adress: 'Storgatan 12–14', ort: 'trollhattan',
      byggar: 1962, lat: 58.2837, lng: 12.2886, publicerad: true,
      beskrivning: 'Ett klassiskt 60-talshus mitt i centrala Trollhättan som vi rustar löpande – nya fönster, uppfräschade trapphus och en gård som blivit en riktig mötesplats. Här bor du nära både handel, service och älven.',
      bilder: [bild('fastighet-1.jpg')],
      praktiskInfo: { bredband: 'Fiber via Trollhättan Energi (öppet nät – du väljer leverantör själv).', tvattstuga: 'Bokas med bokningscylinder i tvättstugan, källarplan hus 12.', parkering: 'P-platser på gården finns att hyra – kontakta oss.', sopsortering: 'Miljörum på gården med full sortering.', ovrigt: 'Cykelrum i källaren, barnvagnsförråd i entrén hus 14.' },
    },
    {
      namn: 'Gärdhemsgården', slug: 'gardhemsgarden', adress: 'Gärdhemsvägen 8', ort: 'trollhattan',
      byggar: 1978, lat: 58.2711, lng: 12.3021, publicerad: true,
      beskrivning: 'Lugnt läge med stora grönytor och närhet till skolor och busslinjer. Under 2025–2026 utvecklar vi gården med nya sittplatser, belysning och odlingslådor.',
      bilder: [bild('fastighet-2.jpg')],
      praktiskInfo: { bredband: 'Fiber indraget i samtliga lägenheter (Telia Öppen Fiber).', tvattstuga: 'Digital bokningstavla i entrén.', parkering: 'Garage och utomhusplatser finns – kölista hos oss.', sopsortering: 'Sopsortering i miljöhus vid infarten.', ovrigt: '' },
    },
    {
      namn: 'Hamnkvarteret', slug: 'hamnkvarteret', adress: 'Hamngatan 3', ort: 'vanersborg',
      byggar: 1955, lat: 58.3800, lng: 12.3235, publicerad: true,
      beskrivning: 'Bostäder och lokaler i gathuset vid hamnen i Vänersborg. Butikslägen i markplan och ljusa lägenheter med utsikt över vattnet på våningarna ovanför.',
      bilder: [bild('fastighet-3.jpg')],
      praktiskInfo: { bredband: 'Fiber via Vänersborgs stadsnät.', tvattstuga: 'Tvättstuga på plan -1, bokningslista.', parkering: 'Kommunala p-platser i närområdet.', sopsortering: 'Miljörum på gården.', ovrigt: 'Lokalhyresgäster har egen entré från Hamngatan.' },
    },
  ]);

  // Objekt
  const tilltrade = (dagar) => new Date(Date.now() + dagar * 24 * 3600 * 1000);
  const [b1, b2, b3, l1, l2, uthyrd] = await Unit.create([
    { property: f1._id, typ: 'bostad', beteckning: 'LGH 1101', adress: 'Storgatan 12, 2 tr', vaning: '2', ytaM2: 58, hyraKrMan: 7450, rum: 2, attribut: { balkong: true, hiss: false, forradIngar: true }, status: 'ledig', publicerad: true, publiceradDatum: new Date(), tilltradeDatum: tilltrade(30), bilder: [bild('objekt-1.jpg')], beskrivning: 'Ljus tvåa högst upp i huset med kvällssol på balkongen. Renoverat badrum (2024), rymligt kök med matplats och förråd i källaren. Promenadavstånd till resecentrum och Drottningtorget.' },
    { property: f2._id, typ: 'bostad', beteckning: 'LGH 2203', adress: 'Gärdhemsvägen 8B, 1 tr', vaning: '1', ytaM2: 76, hyraKrMan: 9150, rum: 3, attribut: { balkong: true, hiss: true, forradIngar: true, parkering: true }, status: 'ledig', publicerad: true, publiceradDatum: new Date(), tilltradeDatum: tilltrade(60), bilder: [bild('objekt-2.jpg')], beskrivning: 'Välplanerad trea med genomgående ljusinsläpp, stor balkong mot gården och hiss i huset. Perfekt för dig som vill ha nära till både grönska och skolor.' },
    { property: f3._id, typ: 'bostad', beteckning: 'LGH 3102', adress: 'Hamngatan 3, 3 tr', vaning: '3', ytaM2: 44, hyraKrMan: 6300, rum: 1, attribut: { hiss: false, forradIngar: true }, status: 'ledig', publicerad: true, publiceradDatum: new Date(), tilltradeDatum: tilltrade(14), bilder: [bild('objekt-3.jpg')], beskrivning: 'Charmig etta med utsikt mot hamnen. Nyslipade trägolv och platsbyggd förvaring i hallen. Ledig för snabb inflyttning.' },
    { property: f3._id, typ: 'lokal', beteckning: 'LOK 101', adress: 'Hamngatan 3, markplan', vaning: 'Markplan', ytaM2: 85, hyraKrMan: 11800, lokaltyp: 'butik', attribut: { skyltlage: true, takhojd: '3,1 m' }, status: 'ledig', publicerad: true, publiceradDatum: new Date(), tilltradeDatum: tilltrade(45), bilder: [bild('fastighet-3.jpg')], beskrivning: 'Butikslokal i bästa skyltläge mot Hamngatan med stora fönsterpartier. Öppen planlösning som enkelt anpassas – vi diskuterar gärna lösningar för just din verksamhet.' },
    { property: f1._id, typ: 'lokal', beteckning: 'LOK 001', adress: 'Storgatan 14, källarplan', vaning: 'Källarplan', ytaM2: 140, hyraKrMan: 8900, lokaltyp: 'lager', attribut: { lastintag: true, takhojd: '2,6 m' }, status: 'ledig', publicerad: true, publiceradDatum: new Date(), tilltradeDatum: tilltrade(21), bilder: [bild('fastighet-1.jpg')], beskrivning: 'Torrt och praktiskt lager i centralt läge med lastintag från gården. Passar t.ex. e-handel, hantverkare eller föreningsförråd.' },
    { property: f1._id, typ: 'bostad', beteckning: 'LGH 1002', adress: 'Storgatan 12, 1 tr', vaning: '1', ytaM2: 62, hyraKrMan: 7800, rum: 2, attribut: { balkong: false, forradIngar: true }, status: 'uthyrd', publicerad: false, beskrivning: 'Uthyrd tvåa.' },
  ]);

  // Demo-hyresgäst med portalkonto (verifierar hela portalflödet)
  const tenantUser = new User({ epost: 'anna.hyresgast@example.com', namn: 'Anna Andersson', telefon: '070-123 45 67', roll: 'hyresgast', status: 'aktiv' });
  await tenantUser.sattLosenord('FallensDemo2026!');
  await tenantUser.save();
  const tenant = await Tenant.create({ user: tenantUser._id, typ: 'privat', namn: 'Anna Andersson', epost: 'anna.hyresgast@example.com', telefon: '070-123 45 67' });
  await Tenancy.create({ unit: uthyrd._id, tenant: tenant._id, startdatum: new Date('2023-09-01'), hyraKrMan: 7800, status: 'pagaende' });
  const foretag = await Tenant.create({ typ: 'foretag', namn: 'Kaffekvarnen i Trollhättan AB', epost: 'hej@kaffekvarnen.example.com', telefon: '0520-98 76 54', orgnr: '556123-4567', kontaktperson: 'Jonas Berg' });

  // Felanmälningar med händelsetråd
  const a1 = await FaultReport.create({
    arendenummer: await nextArendenummer(), kalla: 'portal', namn: tenant.namn, telefon: tenant.telefon, epost: tenant.epost,
    adress: uthyrd.adress, lagenhetsnummer: uthyrd.beteckning, kategori: 'vvs',
    beskrivning: 'Kranen i köket droppar konstant, även när den är helt stängd. Det har blivit värre den senaste veckan.',
    akut: false, status: 'pagaende', unit: uthyrd._id, property: f1._id, tenant: tenant._id, tilldelad: admin._id,
  });
  await FaultEvent.create([
    { fault: a1._id, typ: 'status', nyStatus: 'ny', text: 'Ärendet skapades via Mina sidor.', synligForAnmalaren: true, skapadAvNamn: tenant.namn },
    { fault: a1._id, typ: 'status', nyStatus: 'pagaende', text: 'Vår tekniker tittar på det i veckan.', synligForAnmalaren: true, skapadAv: admin._id, skapadAvNamn: admin.namn },
    { fault: a1._id, typ: 'svar', text: 'Hej Anna! Vi har beställt en ny blandare och kommer tisdag 25/8 mellan 08–12. Passar det, eller vill du boka annan tid?', synligForAnmalaren: true, skapadAv: admin._id, skapadAvNamn: admin.namn },
    { fault: a1._id, typ: 'intern_notering', text: 'Blandare beställd från grossisten, lev. måndag.', synligForAnmalaren: false, skapadAv: admin._id, skapadAvNamn: admin.namn },
  ]);
  const a2 = await FaultReport.create({
    arendenummer: await nextArendenummer(), kalla: 'publik', namn: 'Erik Svensson', telefon: '073-555 12 34', epost: 'erik.svensson@example.com',
    adress: 'Gärdhemsvägen 8A', kategori: 'gemensamma',
    beskrivning: 'Lampan i trapphuset plan 2 är trasig – helt mörkt på kvällarna.',
    akut: false, status: 'atgardad', property: f2._id,
  });
  await FaultEvent.create([
    { fault: a2._id, typ: 'status', nyStatus: 'ny', text: 'Ärendet skapades via publika felanmälningsformuläret.', synligForAnmalaren: true, skapadAvNamn: 'Erik Svensson' },
    { fault: a2._id, typ: 'status', nyStatus: 'atgardad', text: 'Armaturen är utbytt. Tack för att du hörde av dig!', synligForAnmalaren: true, skapadAv: admin._id, skapadAvNamn: admin.namn },
  ]);

  // Leads
  await Lead.create([
    { typ: 'bostad', namn: 'Maria Lindqvist', epost: 'maria.lindqvist@example.com', telefon: '070-222 33 44', meddelande: 'Hej! Jag söker en tvåa eller trea i centrala Trollhättan, gärna med balkong. Inflyttning från oktober.', status: 'ny' },
    { typ: 'forvaltning', namn: 'Jonas Berg', epost: 'jonas@bergfast.example.com', foretag: 'Berg Fastigheter AB', telefon: '0521-44 55 66', fastighetBestand: '2 flerbostadshus, 24 lägenheter', ort: 'Vänersborg', storlek: 'ca 1 800 m²', meddelande: 'Vi vill ha hjälp med teknisk förvaltning och felanmälan för vårt bestånd.', status: 'kontaktad', internaAnteckningar: 'Ringt 18/8 – bokat möte v.35.' },
  ]);

  // Aktuellt
  await NewsPost.create([
    { rubrik: 'Spolning av avloppsstammar i Kv. Möjligheten', brodtext: 'Under vecka 36 spolar vi avloppsstammarna i Storgatan 12–14. Arbetet pågår 08.00–16.00 och vatten kan behöva stängas av korta stunder – vi aviserar i trapphuset dagen innan. Du behöver inte vara hemma, men håll gärna golvbrunnar och vattenlås fria.', kategori: 'planerat_arbete', property: f1._id, synlighet: 'publik', status: 'publicerad', publiceradFran: new Date(Date.now() - 2 * 24 * 3600 * 1000), skapadAv: admin._id },
    { rubrik: 'Nu bygger vi om gården på Gärdhemsgården', brodtext: 'Arbetet med nya sittplatser, belysning och odlingslådor på gården har startat. Delar av gården är avspärrade under byggtiden. Vi räknar med att allt står klart till oktober – tack för ert tålamod!', kategori: 'forbattring', property: f2._id, synlighet: 'publik', status: 'publicerad', publiceradFran: new Date(Date.now() - 7 * 24 * 3600 * 1000), skapadAv: admin._id },
  ]);

  // Utvecklingsprojekt
  await DevelopmentProject.create({
    titel: 'Från grusplan till grön gård', property: f2._id, status: 'genomfort', datum: new Date('2026-06-01'), publicerad: true,
    bilderFore: [bild('fore.jpg')], bilderEfter: [bild('efter.jpg')],
    identifierade: 'Gården användes mest som genväg – en sliten grusyta utan sittplatser, belysning eller grönska, trots att många barnfamiljer bor i huset.',
    gjorde: 'Vi anlade gräsytor och planteringar, byggde sittgrupper i trä, satte ny energisnål belysning och skapade en liten lekyta. Arbetet planerades i etapper så att gården kunde användas under hela byggtiden.',
    resultat: 'Gården har blivit husets naturliga mötesplats. Hyresgästerna använder den dagligen, tryggheten på kvällen har ökat med den nya belysningen och fastighetens helhetsintryck har lyft rejält.',
  });

  // Dokument
  const doc = (namn, titel, beskrivning, kategori, extra = {}) => {
    const skyddad = !(extra.publik);
    const fil = kopiera(namn, { skyddad });
    const stat = fs.statSync(path.join(ASSETS, namn));
    return { titel, beskrivning, fil, filnamn: namn, filtyp: 'pdf', storlek: stat.size, kategori, uppladdadAv: admin._id, ...extra };
  };
  await DocumentFile.create([
    doc('blankett-uppsagning.pdf', 'Uppsägning av hyresavtal', 'Blankett för skriftlig uppsägning av bostad eller lokal.', 'blankett', { niva: 'koncern', publik: true }),
    doc('blankett-autogiro.pdf', 'Anmälan om autogiro', 'Fyll i och skicka in för att betala hyran via autogiro.', 'blankett', { niva: 'koncern', publik: true }),
    doc('stadinstruktion.pdf', 'Städinstruktion vid utflyttning', 'Checklista för flyttstädning inför besiktning.', 'information', { niva: 'koncern', publik: true }),
    doc('avtal-demo.pdf', 'Hyresavtal Storgatan 12, LGH 1002', 'Ditt hyresavtal (demo).', 'avtal', { niva: 'hyresgast', tenant: tenant._id }),
  ]);

  logger.info('Seed klar.');
  logger.info(`  Admin:      ${config.seedAdminEpost} / ${config.seedAdminLosen}`);
  logger.info('  Hyresgäst:  anna.hyresgast@example.com / FallensDemo2026!');
}

// Direktkörning: `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  await mongoose.connect(config.mongoUri);
  await kanskeSeeda();
  await mongoose.disconnect();
  process.exit(0);
}
