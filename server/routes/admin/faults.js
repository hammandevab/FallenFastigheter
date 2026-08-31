import { Router } from 'express';
import Joi from 'joi';
import { catchAsync, AppError } from '../../utils/appError.js';
import { validate } from '../../middleware/validate.js';
import { FaultReport, FAULT_KATEGORIER, FAULT_STATUS } from '../../models/FaultReport.js';
import { FaultEvent } from '../../models/FaultEvent.js';
import { Unit } from '../../models/Unit.js';
import { Tenant } from '../../models/Tenant.js';
import { User } from '../../models/User.js';
import { nextArendenummer } from '../../utils/seq.js';
import { deleteRel } from '../../utils/storage.js';
import { meddelaAnmalaren, bekraftaFelanmalan, statusNamn } from '../../services/notify.js';

const r = Router();

r.get('/', catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status === 'oppna') filter.status = { $in: ['ny', 'pagaende', 'vantar'] };
  else if (req.query.status && req.query.status !== 'alla') filter.status = req.query.status;
  if (req.query.kategori && req.query.kategori !== 'alla') filter.kategori = req.query.kategori;
  if (req.query.akut === 'ja') filter.akut = true;
  if (req.query.fastighet) filter.property = req.query.fastighet;
  if (req.query.tilldelad) filter.tilldelad = req.query.tilldelad;
  if (req.query.sok) {
    const rex = new RegExp(req.query.sok, 'i');
    const nr = Number(req.query.sok.replace('#', ''));
    filter.$or = [{ namn: rex }, { adress: rex }, { epost: rex }, ...(Number.isFinite(nr) ? [{ arendenummer: nr }] : [])];
  }
  const arenden = await FaultReport.find(filter)
    .populate('property', 'namn').populate('unit', 'adress beteckning').populate('tilldelad', 'namn')
    .sort({ akut: -1, createdAt: -1 });
  res.json({ success: true, data: arenden });
}));

r.get('/:id', catchAsync(async (req, res) => {
  const arende = await FaultReport.findById(req.params.id)
    .populate('property', 'namn slug').populate('unit', 'adress beteckning')
    .populate('tenant', 'namn epost telefon').populate('tilldelad', 'namn');
  if (!arende) throw new AppError('Ärendet hittades inte', 404);
  const handelser = await FaultEvent.find({ fault: arende._id }).sort({ createdAt: 1 }).populate('skapadAv', 'namn');
  res.json({ success: true, data: { arende, handelser } });
}));

const uppdateraSchema = Joi.object({
  status: Joi.string().valid(...FAULT_STATUS),
  tilldelad: Joi.string().hex().length(24).allow(null, ''),
  unit: Joi.string().hex().length(24).allow(null, ''),
  tenant: Joi.string().hex().length(24).allow(null, ''),
  statusMeddelande: Joi.string().allow('').max(4000),
});

r.patch('/:id', validate(uppdateraSchema), catchAsync(async (req, res) => {
  const arende = await FaultReport.findById(req.params.id);
  if (!arende) throw new AppError('Ärendet hittades inte', 404);
  const { status, statusMeddelande, ...ovrigt } = req.body;

  if (ovrigt.unit !== undefined) {
    arende.unit = ovrigt.unit || undefined;
    if (ovrigt.unit) {
      const u = await Unit.findById(ovrigt.unit);
      arende.property = u?.property;
    } else arende.property = undefined;
  }
  if (ovrigt.tenant !== undefined) arende.tenant = ovrigt.tenant || undefined;
  if (ovrigt.tilldelad !== undefined) arende.tilldelad = ovrigt.tilldelad || undefined;

  if (status && status !== arende.status) {
    arende.status = status;
    await FaultEvent.create({
      fault: arende._id, typ: 'status', nyStatus: status, text: statusMeddelande || '',
      synligForAnmalaren: true, skapadAv: req.user._id, skapadAvNamn: req.user.namn,
    });
    await meddelaAnmalaren(arende, {
      rubrik: `Ny status: ${statusNamn(status)}`,
      rader: [
        `Ditt ärende har fått ny status: ${statusNamn(status)}.`,
        statusMeddelande || '',
      ].filter(Boolean),
    });
  }
  await arende.save();
  res.json({ success: true, data: arende });
}));

/** Kommentarstråd med två lägen (§6.5): svar till anmälaren eller intern notering. */
r.post('/:id/handelser', validate(Joi.object({
  typ: Joi.string().valid('svar', 'intern_notering').required(),
  text: Joi.string().max(6000).required().messages({ '*': 'Skriv ett meddelande' }),
})), catchAsync(async (req, res) => {
  const arende = await FaultReport.findById(req.params.id);
  if (!arende) throw new AppError('Ärendet hittades inte', 404);
  const ev = await FaultEvent.create({
    fault: arende._id, typ: req.body.typ, text: req.body.text,
    synligForAnmalaren: req.body.typ === 'svar',
    skapadAv: req.user._id, skapadAvNamn: req.user.namn,
  });
  if (req.body.typ === 'svar') {
    await meddelaAnmalaren(arende, { rubrik: 'Nytt svar från Fallens', rader: [req.body.text] });
  }
  res.status(201).json({ success: true, data: ev });
}));

/** Skapa ärende åt hyresgäst (admin, §2.2). */
r.post('/', validate(Joi.object({
  namn: Joi.string().max(120).required(), telefon: Joi.string().max(40).required(),
  epost: Joi.string().email().required(), adress: Joi.string().max(200).required(),
  lagenhetsnummer: Joi.string().allow('').max(60),
  kategori: Joi.string().valid(...FAULT_KATEGORIER).required(),
  beskrivning: Joi.string().max(6000).required(),
  akut: Joi.boolean().default(false),
  unit: Joi.string().hex().length(24).allow(null, ''),
  tenant: Joi.string().hex().length(24).allow(null, ''),
})), catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (data.unit) { const u = await Unit.findById(data.unit); data.property = u?.property; }
  const arende = await FaultReport.create({ ...data, kalla: 'admin', arendenummer: await nextArendenummer() });
  await FaultEvent.create({ fault: arende._id, typ: 'status', nyStatus: 'ny', text: 'Ärendet registrerades av Fallens.', synligForAnmalaren: true, skapadAv: req.user._id, skapadAvNamn: req.user.namn });
  await bekraftaFelanmalan(arende);
  res.status(201).json({ success: true, data: arende });
}));

/** Hjälpdata för kopplingar. */
r.get('/underlag/val', catchAsync(async (_req, res) => {
  const [units, tenants, admins] = await Promise.all([
    Unit.find().select('adress beteckning typ property').populate('property', 'namn').sort({ adress: 1 }),
    Tenant.find().select('namn epost typ').sort({ namn: 1 }),
    User.find({ roll: 'admin', status: 'aktiv' }).select('namn'),
  ]);
  res.json({ success: true, data: { units, tenants, admins } });
}));

r.delete('/:id', catchAsync(async (req, res) => {
  const f = await FaultReport.findById(req.params.id);
  if (!f) throw new AppError('Ärendet hittades inte', 404);
  const handelser = await FaultEvent.find({ fault: f._id });
  for (const h of handelser) for (const b of h.bilder || []) { deleteRel(b.fil); deleteRel(b.liten); }
  await FaultEvent.deleteMany({ fault: f._id });
  for (const b of f.bilagor || []) { deleteRel(b.fil); deleteRel(b.liten); }
  await f.deleteOne();
  res.json({ success: true });
}));

export default r;
