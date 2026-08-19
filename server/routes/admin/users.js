import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { User } from '../../models/User.js';
import { skickaAterstallning } from '../../services/notify.js';

const r = Router();

r.get('/anvandare', catchAsync(async (_req, res) => {
  const users = await User.find().sort({ roll: 1, namn: 1 });
  res.json({ success: true, data: users.map((u) => u.publik()) });
}));

r.post('/anvandare', validate(Joi.object({
  namn: Joi.string().max(120).required().messages({ '*': 'Ange namn' }),
  epost: Joi.string().email().required().messages({ '*': 'Ange giltig e-post' }),
  losenord: Joi.string().min(8).required().messages({ '*': 'Lösenordet måste vara minst 8 tecken' }),
})), catchAsync(async (req, res) => {
  const finns = await User.findOne({ epost: req.body.epost });
  if (finns) throw new AppError('E-postadressen används redan', 409);
  const user = new User({ namn: req.body.namn, epost: req.body.epost, roll: 'admin', status: 'aktiv' });
  await user.sattLosenord(req.body.losenord);
  await user.save();
  res.status(201).json({ success: true, data: user.publik() });
}));

/** Skydd mot utlåsning (§6.11): minst en aktiv admin måste finnas kvar. */
async function garanteraAdmin(exkluderaId) {
  const kvar = await User.countDocuments({ roll: 'admin', status: 'aktiv', _id: { $ne: exkluderaId } });
  if (!kvar) throw new AppError('Minst en aktiv administratör måste finnas kvar', 400);
}

r.post('/anvandare/:id/inaktivera', catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Användaren hittades inte', 404);
  if (user.roll === 'admin') await garanteraAdmin(user._id);
  user.status = 'inaktiverad';
  await user.save();
  res.json({ success: true, data: user.publik() });
}));

r.post('/anvandare/:id/aktivera', catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Användaren hittades inte', 404);
  user.status = 'aktiv';
  await user.save();
  res.json({ success: true, data: user.publik() });
}));

r.post('/anvandare/:id/aterstall', catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('+aterstallToken');
  if (!user) throw new AppError('Användaren hittades inte', 404);
  const token = user.skapaToken('aterstall', 24);
  await user.save();
  await skickaAterstallning(user, token);
  res.json({ success: true, data: { meddelande: 'Återställningslänk skickad till ' + user.epost } });
}));

export default r;
