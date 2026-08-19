import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { uploadImages } from '../../middleware/upload.js';
import { saveImage, deleteRel } from '../../utils/storage.js';
import { Property } from '../../models/Property.js';
import { Unit } from '../../models/Unit.js';
import { FaultReport } from '../../models/FaultReport.js';
import { DocumentFile } from '../../models/DocumentFile.js';
import { DevelopmentProject } from '../../models/DevelopmentProject.js';
import { NewsPost } from '../../models/NewsPost.js';

const r = Router();

const schema = Joi.object({
  namn: Joi.string().max(160).required().messages({ '*': 'Ange namn' }),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(120).required().messages({ '*': 'Slug: små bokstäver, siffror och bindestreck' }),
  adress: Joi.string().max(200).required().messages({ '*': 'Ange adress' }),
  ort: Joi.string().valid('trollhattan', 'vanersborg').required(),
  beskrivning: Joi.string().allow('').max(8000),
  byggar: Joi.number().integer().min(1800).max(2100).allow(null, ''),
  lat: Joi.number().allow(null, ''), lng: Joi.number().allow(null, ''),
  praktiskInfo: Joi.object({ bredband: Joi.string().allow(''), tvattstuga: Joi.string().allow(''), parkering: Joi.string().allow(''), sopsortering: Joi.string().allow(''), ovrigt: Joi.string().allow('') }),
  publicerad: Joi.boolean(),
});

r.get('/', catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.ort && req.query.ort !== 'alla') filter.ort = req.query.ort;
  if (req.query.publicerad === 'ja') filter.publicerad = true;
  if (req.query.publicerad === 'nej') filter.publicerad = false;
  if (req.query.sok) filter.$or = [{ namn: new RegExp(req.query.sok, 'i') }, { adress: new RegExp(req.query.sok, 'i') }];
  const props = await Property.find(filter).sort({ namn: 1 }).lean();
  const units = await Unit.find().select('property status');
  const oppna = await FaultReport.aggregate([
    { $match: { status: { $in: ['ny', 'pagaende', 'vantar'] }, property: { $ne: null } } },
    { $group: { _id: '$property', n: { $sum: 1 } } },
  ]);
  const oppnaMap = Object.fromEntries(oppna.map((o) => [o._id.toString(), o.n]));
  res.json({ success: true, data: props.map((p) => ({
    ...p,
    antalObjekt: units.filter((u) => u.property.toString() === p._id.toString()).length,
    lediga: units.filter((u) => u.property.toString() === p._id.toString() && u.status === 'ledig').length,
    oppnaArenden: oppnaMap[p._id.toString()] || 0,
  })) });
}));

r.get('/:id', catchAsync(async (req, res) => {
  const p = await Property.findById(req.params.id);
  if (!p) throw new AppError('Fastigheten hittades inte', 404);
  const [objekt, arenden, dokument, projekt, aktuellt] = await Promise.all([
    Unit.find({ property: p._id }).sort({ adress: 1 }),
    FaultReport.find({ property: p._id }).sort({ createdAt: -1 }).limit(30),
    DocumentFile.find({ niva: 'fastighet', property: p._id }),
    DevelopmentProject.find({ property: p._id }).sort({ datum: -1 }),
    NewsPost.find({ property: p._id }).sort({ createdAt: -1 }),
  ]);
  res.json({ success: true, data: { fastighet: p, objekt, arenden, dokument, projekt, aktuellt } });
}));

r.post('/', validate(schema), catchAsync(async (req, res) => {
  const p = await Property.create(req.body);
  res.status(201).json({ success: true, data: p });
}));

r.patch('/:id', validate(schema), catchAsync(async (req, res) => {
  const p = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!p) throw new AppError('Fastigheten hittades inte', 404);
  res.json({ success: true, data: p });
}));

r.post('/:id/bilder', uploadImages.array('bilder', 8), catchAsync(async (req, res) => {
  const p = await Property.findById(req.params.id);
  if (!p) throw new AppError('Fastigheten hittades inte', 404);
  for (const f of req.files || []) p.bilder.push(await saveImage(f.buffer));
  await p.save();
  res.json({ success: true, data: p });
}));

r.delete('/:id/bilder/:index', catchAsync(async (req, res) => {
  const p = await Property.findById(req.params.id);
  if (!p) throw new AppError('Fastigheten hittades inte', 404);
  const [borttagen] = p.bilder.splice(Number(req.params.index), 1);
  if (borttagen) { deleteRel(borttagen.fil); deleteRel(borttagen.liten); }
  await p.save();
  res.json({ success: true, data: p });
}));

r.delete('/:id', catchAsync(async (req, res) => {
  const antal = await Unit.countDocuments({ property: req.params.id });
  if (antal) throw new AppError('Fastigheten har objekt kopplade och kan inte tas bort', 400);
  const p = await Property.findByIdAndDelete(req.params.id);
  if (!p) throw new AppError('Fastigheten hittades inte', 404);
  for (const b of p.bilder) { deleteRel(b.fil); deleteRel(b.liten); }
  res.json({ success: true });
}));

export default r;
