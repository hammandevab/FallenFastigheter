import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../utils/appError.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { saveImage } from '../utils/storage.js';
import { nextArendenummer } from '../utils/seq.js';
import { portalScope } from '../services/portalScope.js';
import { FaultReport, FAULT_KATEGORIER } from '../models/FaultReport.js';
import { FaultEvent } from '../models/FaultEvent.js';
import { NewsPost } from '../models/NewsPost.js';
import { DocumentFile } from '../models/DocumentFile.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { bekraftaFelanmalan } from '../services/notify.js';

const r = Router();
r.use(protect, restrictTo('hyresgast', 'admin'));

r.get('/oversikt', catchAsync(async (req, res) => {
  const scope = await portalScope(req.user);
  const arenden = await FaultReport.find({ tenant: scope.tenant._id }).sort({ createdAt: -1 }).limit(3);
  const aktuellt = await NewsPost.find({
    ...NewsPost.aktivFilter(),
    $or: [{ property: { $in: scope.propertyIds } }, { property: null }],
  }).populate('property', 'namn slug').sort({ publiceradFran: -1, createdAt: -1 }).limit(3);
  res.json({ success: true, data: { boenden: scope.tenancies, arenden, aktuellt } });
}));

r.get('/boende', catchAsync(async (req, res) => {
  const scope = await portalScope(req.user);
  res.json({ success: true, data: { tenant: { namn: scope.tenant.namn, typ: scope.tenant.typ }, boenden: scope.tenancies } });
}));

r.get('/felanmalningar', catchAsync(async (req, res) => {
  const scope = await portalScope(req.user);
  const filter = { tenant: scope.tenant._id };
  if (req.query.status && req.query.status !== 'alla') filter.status = req.query.status;
  const arenden = await FaultReport.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: arenden });
}));

r.get('/felanmalningar/:id', catchAsync(async (req, res) => {
  const scope = await portalScope(req.user);
  const arende = await FaultReport.findOne({ _id: req.params.id, tenant: scope.tenant._id })
    .populate('unit', 'adress beteckning').populate('property', 'namn slug');
  if (!arende) throw new AppError('Ärendet hittades inte', 404);
  const handelser = await FaultEvent.find({ fault: arende._id, synligForAnmalaren: true }).sort({ createdAt: 1 });
  res.json({ success: true, data: { arende, handelser } });
}));

const nySchema = Joi.object({
  tenancy: Joi.string().hex().length(24).required().messages({ '*': 'Välj vilket boende det gäller' }),
  kategori: Joi.string().valid(...FAULT_KATEGORIER).required().messages({ '*': 'Välj kategori' }),
  beskrivning: Joi.string().max(6000).required().messages({ '*': 'Beskriv felet' }),
  akut: Joi.boolean().default(false),
  telefon: Joi.string().max(40).required().messages({ '*': 'Ange telefonnummer' }),
});

r.post('/felanmalningar', uploadImages.array('bilder', 8), catchAsync(async (req, res, next) => {
  const scope = await portalScope(req.user);
  const body = { ...req.body, akut: req.body.akut === 'true' || req.body.akut === true };
  const { error, value } = nySchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('. '), 400));

  const tenancy = scope.tenancies.find((t) => t._id.toString() === value.tenancy);
  if (!tenancy?.unit) throw new AppError('Boendet hittades inte', 400);

  const bilagor = [];
  for (const f of req.files || []) {
    const sparad = await saveImage(f.buffer, { protectedFile: true });
    bilagor.push({ ...sparad, filnamn: f.originalname, storlek: f.size, uppladdadAv: 'anmalaren' });
  }

  const fault = await FaultReport.create({
    arendenummer: await nextArendenummer(),
    kalla: 'portal',
    namn: scope.tenant.namn,
    telefon: value.telefon,
    epost: scope.tenant.epost || req.user.epost,
    adress: tenancy.unit.adress,
    lagenhetsnummer: tenancy.unit.beteckning,
    kategori: value.kategori,
    beskrivning: value.beskrivning,
    akut: value.akut,
    bilagor,
    unit: tenancy.unit._id,
    property: tenancy.unit.property?._id,
    tenant: scope.tenant._id,
  });
  await FaultEvent.create({ fault: fault._id, typ: 'status', nyStatus: 'ny', text: 'Ärendet skapades via Mina sidor.', synligForAnmalaren: true, skapadAv: req.user._id, skapadAvNamn: scope.tenant.namn });
  await bekraftaFelanmalan(fault);
  res.status(201).json({ success: true, data: { id: fault._id, arendenummer: fault.arendenummer } });
}));

/** Komplettering: text och/eller bilder tills ärendet stängts (§5.4). */
r.post('/felanmalningar/:id/komplettering', uploadImages.array('bilder', 5), catchAsync(async (req, res, next) => {
  const scope = await portalScope(req.user);
  const fault = await FaultReport.findOne({ _id: req.params.id, tenant: scope.tenant._id });
  if (!fault) throw new AppError('Ärendet hittades inte', 404);
  if (['stangd', 'avvisad'].includes(fault.status)) throw new AppError('Ärendet är avslutat och kan inte kompletteras. Skapa gärna en ny felanmälan.', 400);
  const text = (req.body.text || '').trim();
  if (!text && !(req.files || []).length) throw new AppError('Skriv ett meddelande eller bifoga en bild', 400);

  const bilder = [];
  for (const f of req.files || []) bilder.push(await saveImage(f.buffer, { protectedFile: true }));

  const ev = await FaultEvent.create({
    fault: fault._id, typ: 'komplettering', text, bilder,
    synligForAnmalaren: true, skapadAv: req.user._id, skapadAvNamn: scope.tenant.namn,
  });
  fault.markModified('updatedAt'); await fault.save();
  res.status(201).json({ success: true, data: ev });
}));

r.get('/dokument', catchAsync(async (req, res) => {
  const scope = await portalScope(req.user);
  const docs = await DocumentFile.find({
    $or: [
      { niva: 'koncern', publik: true },
      { niva: 'fastighet', property: { $in: scope.propertyIds } },
      { niva: 'objekt', unit: { $in: scope.unitIds } },
      { niva: 'hyresgast', tenant: scope.tenant._id },
    ],
  }).sort({ niva: 1, titel: 1 });
  res.json({ success: true, data: docs });
}));

r.get('/aktuellt', catchAsync(async (req, res) => {
  const scope = await portalScope(req.user);
  const poster = await NewsPost.find({
    ...NewsPost.aktivFilter(),
    $or: [{ property: { $in: scope.propertyIds } }, { property: null }],
  }).populate('property', 'namn slug').sort({ publiceradFran: -1, createdAt: -1 });
  const data = poster.map((p) => ({ ...p.toObject(), gallerMin: !!p.property && scope.propertyIds.includes(p.property._id.toString()) }));
  data.sort((a, b) => (b.gallerMin ? 1 : 0) - (a.gallerMin ? 1 : 0));
  res.json({ success: true, data });
}));

r.get('/kontaktinfo', catchAsync(async (_req, res) => {
  const s = await SiteSettings.get();
  res.json({ success: true, data: { telefon: s.telefon, epost: s.epost, jourtelefon: s.jourtelefon } });
}));

export default r;
