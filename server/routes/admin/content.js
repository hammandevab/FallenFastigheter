import { Router } from 'express';
import Joi from 'joi';
import path from 'node:path';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { uploadImages, uploadDocument } from '../../middleware/upload.js';
import { saveImage, saveFile, deleteRel } from '../../utils/storage.js';
import { NewsPost, NEWS_KATEGORIER } from '../../models/NewsPost.js';
import { DevelopmentProject } from '../../models/DevelopmentProject.js';
import { DocumentFile } from '../../models/DocumentFile.js';
import { FaqCategory, FaqItem } from '../../models/Faq.js';
import { SiteSettings } from '../../models/SiteSettings.js';

const r = Router();

// ---- Aktuellt/Nyheter (§6.8) ----
const newsSchema = Joi.object({
  rubrik: Joi.string().max(200).required().messages({ '*': 'Ange rubrik' }),
  brodtext: Joi.string().max(20000).required().messages({ '*': 'Skriv brödtext' }),
  kategori: Joi.string().valid(...NEWS_KATEGORIER).required(),
  property: Joi.string().hex().length(24).allow(null, ''),
  synlighet: Joi.string().valid('publik', 'hyresgaster'),
  publiceradFran: Joi.date().allow(null, ''),
  publiceradTill: Joi.date().allow(null, ''),
  status: Joi.string().valid('utkast', 'publicerad', 'avpublicerad'),
});

r.get('/aktuellt', catchAsync(async (_req, res) => {
  const poster = await NewsPost.find().populate('property', 'namn').sort({ createdAt: -1 });
  res.json({ success: true, data: poster });
}));

r.post('/aktuellt', validate(newsSchema), catchAsync(async (req, res) => {
  const post = await NewsPost.create({ ...req.body, property: req.body.property || null, skapadAv: req.user._id });
  res.status(201).json({ success: true, data: post });
}));

r.patch('/aktuellt/:id', validate(newsSchema), catchAsync(async (req, res) => {
  const post = await NewsPost.findByIdAndUpdate(req.params.id, { ...req.body, property: req.body.property || null }, { new: true });
  if (!post) throw new AppError('Notisen hittades inte', 404);
  res.json({ success: true, data: post });
}));

r.delete('/aktuellt/:id', catchAsync(async (req, res) => {
  const post = await NewsPost.findByIdAndDelete(req.params.id);
  if (!post) throw new AppError('Notisen hittades inte', 404);
  res.json({ success: true });
}));

// ---- Utvecklingsprojekt (§6.9) ----
const projSchema = Joi.object({
  titel: Joi.string().max(200).required().messages({ '*': 'Ange titel' }),
  property: Joi.string().hex().length(24).required().messages({ '*': 'Välj fastighet' }),
  status: Joi.string().valid('pagaende', 'genomfort'),
  identifierade: Joi.string().max(8000).required().messages({ '*': 'Fyll i "Vad vi identifierade"' }),
  gjorde: Joi.string().max(8000).required().messages({ '*': 'Fyll i "Vad vi gjorde"' }),
  resultat: Joi.string().allow('').max(8000),
  datum: Joi.date().allow(null, ''),
  publicerad: Joi.boolean(),
});

r.get('/utveckling', catchAsync(async (_req, res) => {
  const projekt = await DevelopmentProject.find().populate('property', 'namn').sort({ datum: -1, createdAt: -1 });
  res.json({ success: true, data: projekt });
}));

r.post('/utveckling', validate(projSchema), catchAsync(async (req, res) => {
  const p = await DevelopmentProject.create(req.body);
  res.status(201).json({ success: true, data: p });
}));

r.patch('/utveckling/:id', validate(projSchema), catchAsync(async (req, res) => {
  const p = await DevelopmentProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!p) throw new AppError('Projektet hittades inte', 404);
  res.json({ success: true, data: p });
}));

r.post('/utveckling/:id/bilder/:sida', uploadImages.array('bilder', 6), catchAsync(async (req, res) => {
  const p = await DevelopmentProject.findById(req.params.id);
  if (!p) throw new AppError('Projektet hittades inte', 404);
  const falt = req.params.sida === 'efter' ? 'bilderEfter' : 'bilderFore';
  for (const f of req.files || []) p[falt].push(await saveImage(f.buffer));
  await p.save();
  res.json({ success: true, data: p });
}));

r.delete('/utveckling/:id/bilder/:sida/:index', catchAsync(async (req, res) => {
  const p = await DevelopmentProject.findById(req.params.id);
  if (!p) throw new AppError('Projektet hittades inte', 404);
  const falt = req.params.sida === 'efter' ? 'bilderEfter' : 'bilderFore';
  const [bort] = p[falt].splice(Number(req.params.index), 1);
  if (bort) { deleteRel(bort.fil); deleteRel(bort.liten); }
  await p.save();
  res.json({ success: true, data: p });
}));

r.delete('/utveckling/:id', catchAsync(async (req, res) => {
  const p = await DevelopmentProject.findByIdAndDelete(req.params.id);
  if (!p) throw new AppError('Projektet hittades inte', 404);
  res.json({ success: true });
}));

// ---- Dokument (§6.6) ----
r.get('/dokument', catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.niva && req.query.niva !== 'alla') filter.niva = req.query.niva;
  if (req.query.kategori && req.query.kategori !== 'alla') filter.kategori = req.query.kategori;
  if (req.query.sok) filter.titel = new RegExp(req.query.sok, 'i');
  const docs = await DocumentFile.find(filter)
    .populate('property', 'namn').populate('unit', 'adress').populate('tenant', 'namn')
    .populate('uppladdadAv', 'namn').sort({ createdAt: -1 });
  res.json({ success: true, data: docs });
}));

r.post('/dokument', uploadDocument.single('fil'), catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('Välj en fil', 400);
  const schema = Joi.object({
    titel: Joi.string().max(200).required().messages({ '*': 'Ange titel' }),
    beskrivning: Joi.string().allow('').max(2000),
    kategori: Joi.string().valid('blankett', 'information', 'avtal', 'protokoll', 'ovrigt'),
    niva: Joi.string().valid('koncern', 'fastighet', 'objekt', 'hyresgast').required(),
    property: Joi.string().hex().length(24).allow(null, ''),
    unit: Joi.string().hex().length(24).allow(null, ''),
    tenant: Joi.string().hex().length(24).allow(null, ''),
    publik: Joi.boolean().default(false),
  });
  const body = { ...req.body, publik: req.body.publik === 'true' || req.body.publik === true };
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) throw new AppError(error.details.map((d) => d.message).join('. '), 400);
  if (value.publik && value.niva !== 'koncern') throw new AppError('Endast koncernnivå kan vara publik', 400);
  if (value.niva === 'fastighet' && !value.property) throw new AppError('Välj fastighet', 400);
  if (value.niva === 'objekt' && !value.unit) throw new AppError('Välj objekt', 400);
  if (value.niva === 'hyresgast' && !value.tenant) throw new AppError('Välj hyresgäst', 400);

  const fil = saveFile(req.file.buffer, req.file.originalname, { protectedFile: !value.publik });
  const doc = await DocumentFile.create({
    ...value,
    property: value.property || undefined, unit: value.unit || undefined, tenant: value.tenant || undefined,
    fil, filnamn: req.file.originalname,
    filtyp: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
    storlek: req.file.size, uppladdadAv: req.user._id,
  });
  res.status(201).json({ success: true, data: doc });
}));

r.patch('/dokument/:id', validate(Joi.object({
  titel: Joi.string().max(200), beskrivning: Joi.string().allow('').max(2000),
  kategori: Joi.string().valid('blankett', 'information', 'avtal', 'protokoll', 'ovrigt'),
})), catchAsync(async (req, res) => {
  const doc = await DocumentFile.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new AppError('Dokumentet hittades inte', 404);
  res.json({ success: true, data: doc });
}));

r.delete('/dokument/:id', catchAsync(async (req, res) => {
  const doc = await DocumentFile.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Dokumentet hittades inte', 404);
  deleteRel(doc.fil);
  res.json({ success: true });
}));

// ---- FAQ (§6.10) ----
r.get('/faq', catchAsync(async (_req, res) => {
  const [kategorier, fragor] = await Promise.all([
    FaqCategory.find().sort({ ordning: 1 }),
    FaqItem.find().sort({ ordning: 1 }),
  ]);
  res.json({ success: true, data: { kategorier, fragor } });
}));

r.post('/faq/kategorier', validate(Joi.object({ namn: Joi.string().max(100).required(), ordning: Joi.number().default(0) })), catchAsync(async (req, res) => {
  res.status(201).json({ success: true, data: await FaqCategory.create(req.body) });
}));
r.patch('/faq/kategorier/:id', validate(Joi.object({ namn: Joi.string().max(100), ordning: Joi.number() })), catchAsync(async (req, res) => {
  const k = await FaqCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!k) throw new AppError('Kategorin hittades inte', 404);
  res.json({ success: true, data: k });
}));
r.delete('/faq/kategorier/:id', catchAsync(async (req, res) => {
  const antal = await FaqItem.countDocuments({ category: req.params.id });
  if (antal) throw new AppError('Kategorin innehåller frågor och kan inte tas bort', 400);
  await FaqCategory.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

const faqSchema = Joi.object({
  category: Joi.string().hex().length(24).required().messages({ '*': 'Välj kategori' }),
  fraga: Joi.string().max(300).required().messages({ '*': 'Skriv frågan' }),
  svar: Joi.string().max(10000).required().messages({ '*': 'Skriv svaret' }),
  ordning: Joi.number().default(0),
  publicerad: Joi.boolean().default(true),
});
r.post('/faq/fragor', validate(faqSchema), catchAsync(async (req, res) => {
  res.status(201).json({ success: true, data: await FaqItem.create(req.body) });
}));
r.patch('/faq/fragor/:id', validate(faqSchema), catchAsync(async (req, res) => {
  const f = await FaqItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!f) throw new AppError('Frågan hittades inte', 404);
  res.json({ success: true, data: f });
}));
r.delete('/faq/fragor/:id', catchAsync(async (req, res) => {
  await FaqItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

// ---- Inställningar (§6.12) ----
r.get('/installningar', catchAsync(async (_req, res) => {
  res.json({ success: true, data: await SiteSettings.get() });
}));

r.patch('/installningar', validate(Joi.object({
  telefon: Joi.string().allow('').max(60), epost: Joi.string().allow('').max(120),
  besoksadress: Joi.string().allow('').max(300), oppettider: Joi.string().allow('').max(300),
  jourtelefon: Joi.string().allow('').max(60), jourinstruktion: Joi.string().allow('').max(1000),
  bankgiro: Joi.string().allow('').max(120), ocrInfo: Joi.string().allow('').max(1000),
  autogiroInfo: Joi.string().allow('').max(2000), ekonomikontakt: Joi.string().allow('').max(300),
  notisEpostLeads: Joi.string().allow('').max(120), notisEpostFelanmalan: Joi.string().allow('').max(120),
  notisEpostAkut: Joi.string().allow('').max(120), seoTitelsuffix: Joi.string().allow('').max(120),
})), catchAsync(async (req, res) => {
  const s = await SiteSettings.get();
  Object.assign(s, req.body);
  await s.save();
  res.json({ success: true, data: s });
}));

export default r;
