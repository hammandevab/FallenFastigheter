import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'node:fs';
import { catchAsync } from '../../utils/appError.js';
import { Property } from '../../models/Property.js';
import { Unit } from '../../models/Unit.js';
import { Tenant } from '../../models/Tenant.js';
import { Tenancy } from '../../models/Tenancy.js';
import { FaultReport } from '../../models/FaultReport.js';
import { Lead } from '../../models/Lead.js';
import { EmailLog } from '../../models/EmailLog.js';
import { SiteSettings } from '../../models/SiteSettings.js';
import { mailMode } from '../../utils/mailer.js';
import { PUBLIC_DIR } from '../../utils/storage.js';
import { config } from '../../config/index.js';

const r = Router();

r.get('/stats', catchAsync(async (_req, res) => {
  const veckaSedan = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [fastTotalt, fastPub, objTotalt, objLediga, objPub, hyresgaster, oppna, akuta, nyaLeads] = await Promise.all([
    Property.countDocuments(), Property.countDocuments({ publicerad: true }),
    Unit.countDocuments(), Unit.countDocuments({ status: 'ledig' }), Unit.countDocuments({ publicerad: true, status: 'ledig' }),
    Tenancy.distinct('tenant', { status: { $in: ['pagaende', 'uppsagd', 'kommande'] } }).then((x) => x.length),
    FaultReport.countDocuments({ status: { $in: ['ny', 'pagaende', 'vantar'] } }),
    FaultReport.countDocuments({ status: { $in: ['ny', 'pagaende', 'vantar'] }, akut: true }),
    Lead.countDocuments({ createdAt: { $gte: veckaSedan } }),
  ]);
  const senasteArenden = await FaultReport.find().sort({ akut: -1, createdAt: -1 }).limit(6).populate('property', 'namn');
  const senasteLeads = await Lead.find().sort({ createdAt: -1 }).limit(6);
  res.json({ success: true, data: {
    kpi: { fastigheter: { totalt: fastTotalt, publicerade: fastPub },
           objekt: { totalt: objTotalt, lediga: objLediga, publicerade: objPub },
           hyresgaster, felanmalningar: { oppna, akuta }, nyaLeads },
    senasteArenden, senasteLeads,
  }});
}));

/** Självdiagnostik (blueprint §9.2) – fångar fel från API till data på ett ställe. */
r.get('/diagnostik', catchAsync(async (_req, res) => {
  const checks = [];
  const run = async (id, kategori, etikett, fn) => {
    const t0 = Date.now();
    try { const o = await fn(); checks.push({ id, kategori, etikett, status: o?.status || 'pass', detalj: o?.detalj, ms: Date.now() - t0 }); }
    catch (e) { checks.push({ id, kategori, etikett, status: 'fail', detalj: e.message, ms: Date.now() - t0 }); }
  };

  await run('db', 'Databas', 'Anslutning till MongoDB', async () =>
    mongoose.connection.readyState === 1 ? { status: 'pass' } : { status: 'fail', detalj: 'ej ansluten' });
  await run('uploads', 'Filer', 'Uppladdningskatalog skrivbar', async () => {
    const p = PUBLIC_DIR + '/.diag';
    fs.writeFileSync(p, 'ok'); fs.unlinkSync(p);
    return { status: 'pass', detalj: config.uploadDir };
  });
  await run('mail', 'E-post', 'Mailtransport', async () => {
    const lage = mailMode();
    return { status: lage === 'smtp' ? 'pass' : 'warn', detalj: lage === 'smtp' ? 'SMTP konfigurerad' : 'Simulerat läge – mail loggas men skickas inte (sätt SMTP_HOST m.fl.)' };
  });
  await run('notiser', 'E-post', 'Notismottagare angivna', async () => {
    const s = await SiteSettings.get();
    const saknas = ['notisEpostLeads', 'notisEpostFelanmalan'].filter((k) => !s[k]);
    return saknas.length ? { status: 'warn', detalj: 'Saknas i Inställningar: ' + saknas.join(', ') } : { status: 'pass' };
  });
  await run('invariant', 'Data', 'Publika objekt hör till publicerad fastighet', async () => {
    const units = await Unit.find({ publicerad: true, status: 'ledig' }).populate('property', 'publicerad');
    const trasiga = units.filter((u) => !u.property?.publicerad).length;
    return trasiga ? { status: 'warn', detalj: `${trasiga} publicerade objekt ligger i opublicerad fastighet och syns därför inte publikt` } : { status: 'pass' };
  });
  await run('platshallare', 'Innehåll', 'Inga platshållare kvar i Inställningar', async () => {
    const s = await SiteSettings.get();
    const tomma = ['telefon', 'epost', 'besoksadress', 'oppettider', 'jourtelefon', 'bankgiro'].filter((k) => !s[k]);
    return tomma.length ? { status: 'warn', detalj: 'Tomma fält döljs på sajten: ' + tomma.join(', ') } : { status: 'pass' };
  });
  await run('env', 'Konfig', 'Miljövariabler', async () => {
    const saknas = [];
    if (config.jwtSecret.startsWith('dev-only')) saknas.push('JWT_SECRET');
    if (!process.env.APP_URL) saknas.push('APP_URL');
    return saknas.length ? { status: config.isProd ? 'fail' : 'warn', detalj: 'Bör sättas: ' + saknas.join(', ') } : { status: 'pass' };
  });

  const summering = checks.reduce((a, c) => ((a[c.status] = (a[c.status] || 0) + 1), a), { pass: 0, warn: 0, fail: 0 });
  res.json({ success: true, data: { kordes: new Date().toISOString(), summering, checks } });
}));

r.get('/epostlogg', catchAsync(async (_req, res) => {
  const poster = await EmailLog.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: poster });
}));

export default r;
