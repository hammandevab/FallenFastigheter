import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { Tenant } from '../../models/Tenant.js';
import { Tenancy } from '../../models/Tenancy.js';
import { User } from '../../models/User.js';
import { FaultReport } from '../../models/FaultReport.js';
import { DocumentFile } from '../../models/DocumentFile.js';
import { skickaInbjudan } from '../../services/notify.js';
import { deleteRel } from '../../utils/storage.js';

const r = Router();

const tenantSchema = Joi.object({
  typ: Joi.string().valid('privat', 'foretag').required(),
  namn: Joi.string().max(160).required().messages({ '*': 'Ange namn' }),
  epost: Joi.string().email().allow('').messages({ '*': 'Ogiltig e-postadress' }),
  telefon: Joi.string().allow('').max(40),
  orgnr: Joi.string().allow('').max(20),
  kontaktperson: Joi.string().allow('').max(120),
  internaAnteckningar: Joi.string().allow('').max(8000),
});

r.get('/hyresgaster', catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.sok) filter.$or = [{ namn: new RegExp(req.query.sok, 'i') }, { epost: new RegExp(req.query.sok, 'i') }];
  let tenants = await Tenant.find(filter).populate('user', 'status').sort({ namn: 1 }).lean();
  const tenancies = await Tenancy.find({ tenant: { $in: tenants.map((t) => t._id) } })
    .populate({ path: 'unit', select: 'adress property', populate: { path: 'property', select: 'namn' } });
  tenants = tenants.map((t) => {
    const mina = tenancies.filter((x) => x.tenant.toString() === t._id.toString() && ['pagaende', 'uppsagd', 'kommande'].includes(x.status));
    return {
      ...t,
      objektAdresser: mina.map((x) => x.unit?.adress).filter(Boolean),
      fastigheter: [...new Set(mina.map((x) => x.unit?.property?.namn).filter(Boolean))],
      portalstatus: t.user ? t.user.status : 'inget_konto',
    };
  });
  if (req.query.fastighet) tenants = tenants.filter((t) => t.fastigheter.includes(req.query.fastighet));
  if (req.query.portal && req.query.portal !== 'alla') tenants = tenants.filter((t) => t.portalstatus === req.query.portal);
  if (req.query.sok) {
    const rex = new RegExp(req.query.sok, 'i');
    tenants = tenants.filter((t) => rex.test(t.namn) || rex.test(t.epost || '') || t.objektAdresser.some((a) => rex.test(a)));
  }
  res.json({ success: true, data: tenants });
}));

r.get('/hyresgaster/:id', catchAsync(async (req, res) => {
  const t = await Tenant.findById(req.params.id).populate('user', 'epost status senastInloggad');
  if (!t) throw new AppError('Hyresgästen hittades inte', 404);
  const [hyresforhallanden, arenden, dokument] = await Promise.all([
    Tenancy.find({ tenant: t._id }).populate({ path: 'unit', select: 'adress typ beteckning property', populate: { path: 'property', select: 'namn' } }).sort({ startdatum: -1 }),
    FaultReport.find({ tenant: t._id }).sort({ createdAt: -1 }),
    DocumentFile.find({ niva: 'hyresgast', tenant: t._id }),
  ]);
  res.json({ success: true, data: { hyresgast: t, hyresforhallanden, arenden, dokument } });
}));

r.post('/hyresgaster', validate(tenantSchema), catchAsync(async (req, res) => {
  const t = await Tenant.create(req.body);
  res.status(201).json({ success: true, data: t });
}));

r.patch('/hyresgaster/:id', validate(tenantSchema), catchAsync(async (req, res) => {
  const t = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!t) throw new AppError('Hyresgästen hittades inte', 404);
  res.json({ success: true, data: t });
}));

/** Portalinbjudan (§2.3, §8.5): konto skapas endast via inbjudan. */
r.post('/hyresgaster/:id/bjud-in', catchAsync(async (req, res) => {
  const t = await Tenant.findById(req.params.id);
  if (!t) throw new AppError('Hyresgästen hittades inte', 404);
  if (!t.epost) throw new AppError('Hyresgästen saknar e-postadress – lägg till en först', 400);

  let user = t.user ? await User.findById(t.user).select('+inbjudanToken') : await User.findOne({ epost: t.epost }).select('+inbjudanToken');
  if (user && user.roll === 'admin') throw new AppError('E-postadressen tillhör ett adminkonto', 400);
  if (!user) {
    user = new User({ epost: t.epost, namn: t.namn, telefon: t.telefon, roll: 'hyresgast', status: 'inbjuden' });
  } else if (user.status === 'inaktiverad') {
    user.status = 'inbjuden';
  }
  const token = user.skapaToken('inbjudan', 7 * 24);
  await user.save();
  if (!t.user) { t.user = user._id; await t.save(); }
  await skickaInbjudan(user, token);
  res.json({ success: true, data: { portalstatus: user.status } });
}));

r.post('/hyresgaster/:id/inaktivera-konto', catchAsync(async (req, res) => {
  const t = await Tenant.findById(req.params.id);
  if (!t?.user) throw new AppError('Hyresgästen har inget portalkonto', 400);
  await User.findByIdAndUpdate(t.user, { status: 'inaktiverad' });
  res.json({ success: true });
}));

/** GDPR (§6.4, §11.3): exportera respektive anonymisera. */
r.get('/hyresgaster/:id/export', catchAsync(async (req, res) => {
  const t = await Tenant.findById(req.params.id).lean();
  if (!t) throw new AppError('Hyresgästen hittades inte', 404);
  const [tenancies, arenden] = await Promise.all([
    Tenancy.find({ tenant: t._id }).populate('unit', 'adress').lean(),
    FaultReport.find({ tenant: t._id }).lean(),
  ]);
  res.setHeader('Content-Disposition', `attachment; filename="registerutdrag-${t._id}.json"`);
  res.json({ hyresgast: t, hyresforhallanden: tenancies, felanmalningar: arenden, uttagsdatum: new Date().toISOString() });
}));

r.post('/hyresgaster/:id/anonymisera', catchAsync(async (req, res) => {
  const t = await Tenant.findById(req.params.id);
  if (!t) throw new AppError('Hyresgästen hittades inte', 404);
  const aktiva = await Tenancy.countDocuments({ tenant: t._id, status: { $in: ['pagaende', 'kommande', 'uppsagd'] } });
  if (aktiva) throw new AppError('Hyresgästen har aktiva hyresförhållanden och kan inte anonymiseras', 400);
  if (t.user) await User.findByIdAndDelete(t.user);
  await FaultReport.updateMany({ tenant: t._id }, { namn: 'Anonymiserad', telefon: '-', epost: 'anonymiserad@fallens.se', beskrivning: '[Anonymiserad enligt gallringsregler]', bilagor: [] });
  await DocumentFile.deleteMany({ niva: 'hyresgast', tenant: t._id });
  Object.assign(t, { namn: 'Anonymiserad hyresgäst', epost: undefined, telefon: undefined, orgnr: undefined, kontaktperson: undefined, internaAnteckningar: 'Anonymiserad ' + new Date().toISOString().slice(0, 10), user: undefined });
  await t.save();
  res.json({ success: true });
}));

// ---- Hyresförhållanden ----
const tenancySchema = Joi.object({
  unit: Joi.string().hex().length(24).required().messages({ '*': 'Välj objekt' }),
  tenant: Joi.string().hex().length(24).required(),
  startdatum: Joi.date().required().messages({ '*': 'Ange startdatum' }),
  slutdatum: Joi.date().allow(null, ''),
  uppsagdDatum: Joi.date().allow(null, ''),
  hyraKrMan: Joi.number().min(0).allow(null, ''),
  status: Joi.string().valid('kommande', 'pagaende', 'uppsagd', 'avslutad'),
});

r.post('/hyresforhallanden', validate(tenancySchema), catchAsync(async (req, res) => {
  const t = await Tenancy.create(req.body);
  res.status(201).json({ success: true, data: t });
}));

r.patch('/hyresforhallanden/:id', validate(tenancySchema), catchAsync(async (req, res) => {
  const t = await Tenancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) throw new AppError('Hyresförhållandet hittades inte', 404);
  res.json({ success: true, data: t });
}));

r.delete('/hyresgaster/:id', catchAsync(async (req, res) => {
  const t = await Tenant.findById(req.params.id);
  if (!t) throw new AppError('Hyresgästen hittades inte', 404);
  const antal = await Tenancy.countDocuments({ tenant: t._id });
  if (antal) throw new AppError('Hyresgästen har hyresförhållanden och kan inte tas bort – avsluta eller ta bort dem först, eller använd anonymisering', 400);
  const dokument = await DocumentFile.find({ tenant: t._id });
  for (const d of dokument) deleteRel(d.fil);
  await DocumentFile.deleteMany({ tenant: t._id });
  if (t.user) await User.findByIdAndDelete(t.user);
  await t.deleteOne();
  res.json({ success: true });
}));

r.delete('/hyresforhallanden/:id', catchAsync(async (req, res) => {
  const t = await Tenancy.findByIdAndDelete(req.params.id);
  if (!t) throw new AppError('Hyresförhållandet hittades inte', 404);
  res.json({ success: true });
}));

export default r;
