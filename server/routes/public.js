import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../utils/appError.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../middleware/limits.js';
import { uploadImages } from '../middleware/upload.js';
import { saveImage } from '../utils/storage.js';
import { nextArendenummer } from '../utils/seq.js';
import { logger } from '../utils/logger.js';
import { Property } from '../models/Property.js';
import { Unit } from '../models/Unit.js';
import { Lead } from '../models/Lead.js';
import { FaultReport, FAULT_KATEGORIER } from '../models/FaultReport.js';
import { FaultEvent } from '../models/FaultEvent.js';
import { NewsPost } from '../models/NewsPost.js';
import { DocumentFile } from '../models/DocumentFile.js';
import { DevelopmentProject } from '../models/DevelopmentProject.js';
import { FaqCategory, FaqItem } from '../models/Faq.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Tenant } from '../models/Tenant.js';
import { bekraftaLead, bekraftaFelanmalan } from '../services/notify.js';

const r = Router();

/** Spamskydd (§11.2): honeypot + hastighetskontroll. Träff ⇒ låtsad succé, inget sparas. */
function arSpam(body) {
  if (body.webbplats) return 'honeypot';
  const start = Number(body.startadMs || 0);
  if (start && Date.now() - start < 2500) return 'för snabbt';
  return null;
}

r.get('/site', catchAsync(async (_req, res) => {
  const s = await SiteSettings.get();
  const publika = await Property.find({ publicerad: true }).select('ort');
  const bestand = { trollhattan: 0, vanersborg: 0 };
  for (const p of publika) bestand[p.ort] += 1;
  res.json({ success: true, data: {
    installningar: {
      telefon: s.telefon, epost: s.epost, besoksadress: s.besoksadress, oppettider: s.oppettider,
      jourtelefon: s.jourtelefon, jourinstruktion: s.jourinstruktion,
      bankgiro: s.bankgiro, ocrInfo: s.ocrInfo, autogiroInfo: s.autogiroInfo, ekonomikontakt: s.ekonomikontakt,
    },
    bestand,
  }});
}));

/** Publika listor (§7.3): typ + ledig + publicerad + fastighet publicerad. */
async function publikaObjekt(typ, q = {}) {
  const filter = { typ, status: 'ledig', publicerad: true };
  if (q.ort && q.ort !== 'alla') filter['__ort'] = q.ort; // hanteras efter populate
  let units = await Unit.find({ typ, status: 'ledig', publicerad: true })
    .populate('property', 'namn slug ort publicerad')
    .sort({ publiceradDatum: -1 });
  units = units.filter((u) => u.property?.publicerad);
  if (q.ort && q.ort !== 'alla') units = units.filter((u) => u.property.ort === q.ort);
  if (typ === 'bostad' && q.rum && q.rum !== 'alla') units = units.filter((u) => Number(u.rum) === Number(q.rum) || (Number(q.rum) === 5 && Number(u.rum) >= 5));
  if (typ === 'bostad' && q.maxhyra) units = units.filter((u) => (u.hyraKrMan || 0) <= Number(q.maxhyra));
  if (typ === 'lokal' && q.lokaltyp && q.lokaltyp !== 'alla') units = units.filter((u) => u.lokaltyp === q.lokaltyp);
  if (typ === 'lokal' && q.minyta) units = units.filter((u) => (u.ytaM2 || 0) >= Number(q.minyta));
  if (q.tilltrade) {
    const d = new Date(q.tilltrade);
    units = units.filter((u) => !u.tilltradeDatum || u.tilltradeDatum <= d);
  }
  if (q.sortera === 'hyra') units.sort((a, b) => (a.hyraKrMan || 0) - (b.hyraKrMan || 0));
  if (q.sortera === 'tilltrade') units.sort((a, b) => (a.tilltradeDatum || 0) - (b.tilltradeDatum || 0));
  return units;
}

r.get('/objekt', catchAsync(async (req, res) => {
  const typ = req.query.typ === 'lokal' ? 'lokal' : 'bostad';
  const units = await publikaObjekt(typ, req.query);
  res.json({ success: true, data: units });
}));

r.get('/objekt/:id', catchAsync(async (req, res) => {
  const u = await Unit.findById(req.params.id).populate('property');
  const tillganglig = u && u.publicerad && u.status === 'ledig' && u.property?.publicerad;
  if (!tillganglig) throw new AppError('Objektet är inte längre ledigt', 404);
  res.json({ success: true, data: u });
}));

r.get('/fastigheter', catchAsync(async (_req, res) => {
  const props = await Property.find({ publicerad: true }).sort({ namn: 1 }).lean();
  const units = await Unit.find({ property: { $in: props.map((p) => p._id) } }).select('property status publicerad');
  const data = props.map((p) => {
    const mina = units.filter((u) => u.property.toString() === p._id.toString());
    return { ...p, antalObjekt: mina.length, lediga: mina.filter((u) => u.status === 'ledig' && u.publicerad).length };
  });
  res.json({ success: true, data });
}));

r.get('/fastigheter/:slug', catchAsync(async (req, res) => {
  const p = await Property.findOne({ slug: req.params.slug, publicerad: true }).lean();
  if (!p) throw new AppError('Fastigheten hittades inte', 404);
  const lediga = await Unit.find({ property: p._id, status: 'ledig', publicerad: true }).sort({ publiceradDatum: -1 });
  const projekt = await DevelopmentProject.find({ property: p._id, publicerad: true }).sort({ datum: -1 });
  res.json({ success: true, data: { fastighet: p, lediga, projekt } });
}));

r.get('/aktuellt', catchAsync(async (_req, res) => {
  const poster = await NewsPost.find({ ...NewsPost.aktivFilter(), synlighet: 'publik' })
    .populate('property', 'namn slug').sort({ publiceradFran: -1, createdAt: -1 });
  res.json({ success: true, data: poster });
}));

r.get('/faq', catchAsync(async (_req, res) => {
  const kategorier = await FaqCategory.find().sort({ ordning: 1 }).lean();
  const fragor = await FaqItem.find({ publicerad: true }).sort({ ordning: 1 }).lean();
  res.json({ success: true, data: kategorier.map((k) => ({ ...k, fragor: fragor.filter((f) => f.category.toString() === k._id.toString()) })).filter((k) => k.fragor.length) });
}));

r.get('/dokument', catchAsync(async (_req, res) => {
  const docs = await DocumentFile.find({ niva: 'koncern', publik: true }).sort({ kategori: 1, titel: 1 });
  res.json({ success: true, data: docs });
}));

r.get('/dokument/:id/fil', catchAsync(async (req, res, next) => {
  const doc = await DocumentFile.findOne({ _id: req.params.id, niva: 'koncern', publik: true });
  if (!doc) throw new AppError('Dokumentet hittades inte', 404);
  const { default: fs } = await import('node:fs');
  const { absPath } = await import('../utils/storage.js');
  const p = absPath(doc.fil);
  if (!fs.existsSync(p)) throw new AppError('Filen hittades inte', 404);
  res.setHeader('Content-Type', doc.filtyp === 'pdf' ? 'application/pdf' : 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.filnamn || doc.titel + '.' + (doc.filtyp || 'pdf'))}"`);
  fs.createReadStream(p).pipe(res);
}));

r.get('/utveckling', catchAsync(async (_req, res) => {
  const projekt = await DevelopmentProject.find({ publicerad: true }).populate('property', 'namn slug ort').sort({ datum: -1 });
  res.json({ success: true, data: projekt });
}));

// ---- Leads: fyra formulär → en inkorg (§8.2) ----
const leadBas = {
  namn: Joi.string().max(120).required().messages({ '*': 'Ange ditt namn' }),
  epost: Joi.string().email().required().messages({ '*': 'Ange en giltig e-postadress' }),
  telefon: Joi.string().allow('').max(40),
  webbplats: Joi.string().allow(''),
  startadMs: Joi.number().optional(),
};
const leadScheman = {
  bostad: Joi.object({ ...leadBas, meddelande: Joi.string().max(4000).required().messages({ '*': 'Beskriv vad du söker' }), unit: Joi.string().hex().length(24).optional() }),
  lokal: Joi.object({ ...leadBas, foretag: Joi.string().allow('').max(160), meddelande: Joi.string().max(4000).required().messages({ '*': 'Beskriv vad ni söker' }), unit: Joi.string().hex().length(24).optional() }),
  forvaltning: Joi.object({ ...leadBas, foretag: Joi.string().allow('').max(160), fastighetBestand: Joi.string().allow('').max(300), ort: Joi.string().allow('').max(120), storlek: Joi.string().allow('').max(160), meddelande: Joi.string().max(4000).required().messages({ '*': 'Beskriv vad du behöver hjälp med' }) }),
  kontakt: Joi.object({ ...leadBas, roll: Joi.string().valid('bostadssokande', 'foretag', 'hyresgast', 'fastighetsagare', 'annat').required().messages({ '*': 'Välj vem du är' }), meddelande: Joi.string().max(4000).required().messages({ '*': 'Skriv ett meddelande' }) }),
};

r.post('/leads/:typ', formLimiter, catchAsync(async (req, res, next) => {
  const typ = req.params.typ;
  const schema = leadScheman[typ];
  if (!schema) throw new AppError('Okänd formulärtyp', 400);
  const spam = arSpam(req.body);
  if (spam) { logger.warn('Lead stoppad (spamskydd)', { skal: spam }); return res.json({ success: true, data: { mottagen: true } }); }
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('. '), 400));
  delete value.webbplats; delete value.startadMs;
  const lead = await Lead.create({ ...value, typ });
  await bekraftaLead(lead);
  res.status(201).json({ success: true, data: { mottagen: true } });
}));

// ---- Publik felanmälan (utan konto) ----
const faultSchema = Joi.object({
  namn: Joi.string().max(120).required().messages({ '*': 'Ange ditt namn' }),
  telefon: Joi.string().max(40).required().messages({ '*': 'Ange telefonnummer' }),
  epost: Joi.string().email().required().messages({ '*': 'Ange en giltig e-postadress' }),
  adress: Joi.string().max(200).required().messages({ '*': 'Ange adress' }),
  lagenhetsnummer: Joi.string().allow('').max(60),
  kategori: Joi.string().valid(...FAULT_KATEGORIER).required().messages({ '*': 'Välj kategori' }),
  beskrivning: Joi.string().max(6000).required().messages({ '*': 'Beskriv felet' }),
  akut: Joi.boolean().default(false),
  webbplats: Joi.string().allow(''),
  startadMs: Joi.number().optional(),
});

r.post('/felanmalan', formLimiter, uploadImages.array('bilder', 8), catchAsync(async (req, res, next) => {
  const body = { ...req.body, akut: req.body.akut === 'true' || req.body.akut === true };
  const spam = arSpam(body);
  if (spam) { logger.warn('Felanmälan stoppad (spamskydd)', { skal: spam }); return res.json({ success: true, data: { arendenummer: null, mottagen: true } }); }
  const { error, value } = faultSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('. '), 400));
  delete value.webbplats; delete value.startadMs;

  const bilagor = [];
  for (const f of req.files || []) {
    const sparad = await saveImage(f.buffer, { protectedFile: true });
    bilagor.push({ ...sparad, filnamn: f.originalname, storlek: f.size, uppladdadAv: 'anmalaren' });
  }
  // Matcha ev. befintlig hyresgäst på e-post (§5.4) – kopplingen bekräftas av admin.
  const tenant = await Tenant.findOne({ epost: value.epost });

  const fault = await FaultReport.create({
    ...value, kalla: 'publik', bilagor,
    arendenummer: await nextArendenummer(),
    tenant: tenant?._id,
  });
  await FaultEvent.create({ fault: fault._id, typ: 'status', nyStatus: 'ny', text: 'Ärendet skapades via publika felanmälningsformuläret.', synligForAnmalaren: true, skapadAvNamn: value.namn });
  await bekraftaFelanmalan(fault);
  res.status(201).json({ success: true, data: { arendenummer: fault.arendenummer } });
}));

export default r;
