import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { uploadImages } from '../../middleware/upload.js';
import { saveImage, deleteRel } from '../../utils/storage.js';
import { Unit } from '../../models/Unit.js';
import { Tenancy } from '../../models/Tenancy.js';
import { FaultReport } from '../../models/FaultReport.js';
import { DocumentFile } from '../../models/DocumentFile.js';

const r = Router();

const schema = Joi.object({
  property: Joi.string().hex().length(24).required().messages({ '*': 'Välj fastighet' }),
  typ: Joi.string().valid('bostad', 'lokal').required(),
  beteckning: Joi.string().allow('').max(60),
  adress: Joi.string().max(200).required().messages({ '*': 'Ange adress' }),
  vaning: Joi.string().allow('').max(30),
  ytaM2: Joi.number().min(0).allow(null, ''),
  hyraKrMan: Joi.number().min(0).allow(null, ''),
  rum: Joi.number().integer().min(1).max(10).allow(null, ''),
  lokaltyp: Joi.string().valid('kontor', 'butik', 'lager', 'verkstad', 'ovrigt').allow(null, ''),
  attribut: Joi.object({
    balkong: Joi.boolean(), hiss: Joi.boolean(), forradIngar: Joi.boolean(), parkering: Joi.boolean(),
    takhojd: Joi.string().allow(''), lastintag: Joi.boolean(), skyltlage: Joi.boolean(),
  }),
  beskrivning: Joi.string().allow('').max(8000),
  tilltradeDatum: Joi.date().allow(null, ''),
  status: Joi.string().valid('ledig', 'uthyrd', 'kommande'),
  publicerad: Joi.boolean(),
});

r.get('/', catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.typ && req.query.typ !== 'alla') filter.typ = req.query.typ;
  if (req.query.status && req.query.status !== 'alla') filter.status = req.query.status;
  if (req.query.publicerad === 'ja') filter.publicerad = true;
  if (req.query.publicerad === 'nej') filter.publicerad = false;
  if (req.query.fastighet) filter.property = req.query.fastighet;
  if (req.query.sok) filter.$or = [{ adress: new RegExp(req.query.sok, 'i') }, { beteckning: new RegExp(req.query.sok, 'i') }];
  let units = await Unit.find(filter).populate('property', 'namn ort').sort({ adress: 1 });
  if (req.query.ort && req.query.ort !== 'alla') units = units.filter((u) => u.property?.ort === req.query.ort);
  res.json({ success: true, data: units });
}));

r.get('/:id', catchAsync(async (req, res) => {
  const u = await Unit.findById(req.params.id).populate('property', 'namn slug ort publicerad');
  if (!u) throw new AppError('Objektet hittades inte', 404);
  const [hyresforhallanden, arenden, dokument] = await Promise.all([
    Tenancy.find({ unit: u._id }).populate('tenant', 'namn typ epost').sort({ startdatum: -1 }),
    FaultReport.find({ unit: u._id }).sort({ createdAt: -1 }).limit(30),
    DocumentFile.find({ niva: 'objekt', unit: u._id }),
  ]);
  res.json({ success: true, data: { objekt: u, hyresforhallanden, arenden, dokument } });
}));

r.post('/', validate(schema), catchAsync(async (req, res) => {
  const u = await Unit.create(req.body);
  res.status(201).json({ success: true, data: u });
}));

r.patch('/:id', validate(schema), catchAsync(async (req, res) => {
  const u = await Unit.findById(req.params.id);
  if (!u) throw new AppError('Objektet hittades inte', 404);
  Object.assign(u, req.body);
  await u.save();
  res.json({ success: true, data: u });
}));

r.post('/:id/bilder', uploadImages.array('bilder', 8), catchAsync(async (req, res) => {
  const u = await Unit.findById(req.params.id);
  if (!u) throw new AppError('Objektet hittades inte', 404);
  for (const f of req.files || []) u.bilder.push(await saveImage(f.buffer));
  await u.save();
  res.json({ success: true, data: u });
}));

r.delete('/:id/bilder/:index', catchAsync(async (req, res) => {
  const u = await Unit.findById(req.params.id);
  if (!u) throw new AppError('Objektet hittades inte', 404);
  const [borttagen] = u.bilder.splice(Number(req.params.index), 1);
  if (borttagen) { deleteRel(borttagen.fil); deleteRel(borttagen.liten); }
  await u.save();
  res.json({ success: true, data: u });
}));

r.delete('/:id', catchAsync(async (req, res) => {
  const antal = await Tenancy.countDocuments({ unit: req.params.id });
  if (antal) throw new AppError('Objektet har hyresförhållanden och kan inte tas bort', 400);
  const u = await Unit.findByIdAndDelete(req.params.id);
  if (!u) throw new AppError('Objektet hittades inte', 404);
  for (const b of u.bilder) { deleteRel(b.fil); deleteRel(b.liten); }
  res.json({ success: true });
}));

export default r;
