import { Router } from 'express';
import Joi from 'joi';
import { AppError, catchAsync } from '../utils/appError.js';
import { validate } from '../middleware/validate.js';
import { protect, signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { authLimiter } from '../middleware/limits.js';
import { User } from '../models/User.js';
import { skickaAterstallning, skickaEpostVerifiering } from '../services/notify.js';

const r = Router();

r.post('/login', authLimiter, validate(Joi.object({
  epost: Joi.string().email().required().messages({ '*': 'Ange en giltig e-postadress' }),
  losenord: Joi.string().required().messages({ '*': 'Ange lösenord' }),
})), catchAsync(async (req, res) => {
  const user = await User.findOne({ epost: req.body.epost }).select('+losenordHash');
  const fel = new AppError('Fel e-post eller lösenord', 401);
  if (!user || user.status === 'inaktiverad' || !(await user.kontrolleraLosenord(req.body.losenord))) throw fel;
  if (user.status === 'inbjuden') throw new AppError('Kontot är inte aktiverat ännu – använd länken i din inbjudan eller be oss skicka en ny.', 401);
  user.senastInloggad = new Date();
  await user.save();
  setAuthCookie(res, signToken(user));
  res.json({ success: true, data: user.publik() });
}));

r.post('/logout', (req, res) => { clearAuthCookie(res); res.json({ success: true }); });

r.get('/me', protect, (req, res) => res.json({ success: true, data: req.user.publik() }));

r.patch('/me', protect, validate(Joi.object({
  telefon: Joi.string().allow('').max(40),
})), catchAsync(async (req, res) => {
  req.user.telefon = req.body.telefon;
  await req.user.save();
  res.json({ success: true, data: req.user.publik() });
}));

r.post('/me/losenord', protect, validate(Joi.object({
  nuvarande: Joi.string().required().messages({ '*': 'Ange nuvarande lösenord' }),
  nytt: Joi.string().min(8).required().messages({ '*': 'Nytt lösenord måste vara minst 8 tecken' }),
})), catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+losenordHash');
  if (!(await user.kontrolleraLosenord(req.body.nuvarande))) throw new AppError('Fel nuvarande lösenord', 400);
  await user.sattLosenord(req.body.nytt);
  await user.save();
  res.json({ success: true });
}));

r.post('/me/epost', protect, validate(Joi.object({
  nyEpost: Joi.string().email().required().messages({ '*': 'Ange en giltig e-postadress' }),
})), catchAsync(async (req, res) => {
  const upptagen = await User.findOne({ epost: req.body.nyEpost });
  if (upptagen) throw new AppError('E-postadressen används redan', 409);
  const user = await User.findById(req.user._id).select('+epostByte');
  const token = user.skapaToken('aterstall', 24); // återanvänd tokenmekanik
  user.epostByte = { nyEpost: req.body.nyEpost, token: user.aterstallToken, utgar: user.aterstallUtgar };
  user.aterstallToken = undefined; user.aterstallUtgar = undefined;
  await user.save();
  await skickaEpostVerifiering(user, req.body.nyEpost, token);
  res.json({ success: true, data: { meddelande: 'Vi har skickat en bekräftelselänk till den nya adressen.' } });
}));

r.post('/verifiera-epost', validate(Joi.object({ token: Joi.string().required() })), catchAsync(async (req, res) => {
  const hash = User.hashToken(req.body.token);
  const user = await User.findOne({ 'epostByte.token': hash, 'epostByte.utgar': { $gt: new Date() } }).select('+epostByte');
  if (!user) throw new AppError('Länken är ogiltig eller har gått ut', 400);
  user.epost = user.epostByte.nyEpost;
  user.epostByte = undefined;
  await user.save();
  res.json({ success: true, data: { meddelande: 'Din e-postadress är uppdaterad.' } });
}));

r.post('/glomt-losenord', authLimiter, validate(Joi.object({
  epost: Joi.string().email().required().messages({ '*': 'Ange en giltig e-postadress' }),
})), catchAsync(async (req, res) => {
  const user = await User.findOne({ epost: req.body.epost, status: { $ne: 'inaktiverad' } }).select('+aterstallToken');
  if (user) {
    const token = user.skapaToken('aterstall', 2);
    await user.save();
    await skickaAterstallning(user, token);
  }
  // Samma svar oavsett – läcker inte vilka adresser som finns.
  res.json({ success: true, data: { meddelande: 'Om adressen finns hos oss har vi skickat en återställningslänk.' } });
}));

r.post('/aterstall-losenord', validate(Joi.object({
  token: Joi.string().required(),
  losenord: Joi.string().min(8).required().messages({ '*': 'Lösenordet måste vara minst 8 tecken' }),
})), catchAsync(async (req, res) => {
  const hash = User.hashToken(req.body.token);
  const user = await User.findOne({ aterstallToken: hash, aterstallUtgar: { $gt: new Date() } }).select('+aterstallToken');
  if (!user) throw new AppError('Länken är ogiltig eller har gått ut', 400);
  await user.sattLosenord(req.body.losenord);
  user.aterstallToken = undefined; user.aterstallUtgar = undefined;
  if (user.status === 'inbjuden') user.status = 'aktiv';
  await user.save();
  res.json({ success: true, data: { meddelande: 'Ditt lösenord är uppdaterat. Du kan nu logga in.' } });
}));

r.post('/aktivera-konto', validate(Joi.object({
  token: Joi.string().required(),
  losenord: Joi.string().min(8).required().messages({ '*': 'Lösenordet måste vara minst 8 tecken' }),
})), catchAsync(async (req, res) => {
  const hash = User.hashToken(req.body.token);
  const user = await User.findOne({ inbjudanToken: hash, inbjudanUtgar: { $gt: new Date() } }).select('+inbjudanToken');
  if (!user) throw new AppError('Inbjudningslänken är ogiltig eller har gått ut. Kontakta oss så skickar vi en ny.', 400);
  await user.sattLosenord(req.body.losenord);
  user.status = 'aktiv';
  user.inbjudanToken = undefined; user.inbjudanUtgar = undefined;
  await user.save();
  setAuthCookie(res, signToken(user));
  res.json({ success: true, data: user.publik() });
}));

export default r;
