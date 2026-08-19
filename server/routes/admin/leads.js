import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { Lead } from '../../models/Lead.js';

const r = Router();

r.get('/', catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.typ && req.query.typ !== 'alla') filter.typ = req.query.typ;
  if (req.query.status && req.query.status !== 'alla') filter.status = req.query.status;
  if (req.query.sok) {
    const rex = new RegExp(req.query.sok, 'i');
    filter.$or = [{ namn: rex }, { epost: rex }, { foretag: rex }, { meddelande: rex }];
  }
  const leads = await Lead.find(filter).populate('unit', 'adress typ').sort({ createdAt: -1 });
  res.json({ success: true, data: leads });
}));

r.get('/:id', catchAsync(async (req, res) => {
  const lead = await Lead.findById(req.params.id).populate('unit', 'adress typ');
  if (!lead) throw new AppError('Leaden hittades inte', 404);
  res.json({ success: true, data: lead });
}));

r.patch('/:id', validate(Joi.object({
  status: Joi.string().valid('ny', 'kontaktad', 'avslutad'),
  internaAnteckningar: Joi.string().allow('').max(8000),
})), catchAsync(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lead) throw new AppError('Leaden hittades inte', 404);
  res.json({ success: true, data: lead });
}));

r.delete('/:id', catchAsync(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) throw new AppError('Leaden hittades inte', 404);
  res.json({ success: true });
}));

export default r;
