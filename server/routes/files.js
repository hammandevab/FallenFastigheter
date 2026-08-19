import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { AppError, catchAsync } from '../utils/appError.js';
import { protect } from '../middleware/auth.js';
import { absPath } from '../utils/storage.js';
import { DocumentFile } from '../models/DocumentFile.js';
import { FaultReport } from '../models/FaultReport.js';
import { FaultEvent } from '../models/FaultEvent.js';
import { portalScope } from '../services/portalScope.js';

const r = Router();

function streama(res, rel, filnamn, inline = false) {
  const p = absPath(rel);
  if (!fs.existsSync(p)) throw new AppError('Filen hittades inte', 404);
  const typer = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
  res.setHeader('Content-Type', typer[path.extname(p).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filnamn || path.basename(p))}"`);
  fs.createReadStream(p).pipe(res);
}

/** Behörighetsprövad nedladdning av dokument (§5.8 pkt 5). */
r.get('/dokument/:id', protect, catchAsync(async (req, res) => {
  const doc = await DocumentFile.findById(req.params.id);
  if (!doc) throw new AppError('Dokumentet hittades inte', 404);
  if (req.user.roll !== 'admin') {
    const ok = await harDokumentAtkomst(req.user, doc);
    if (!ok) throw new AppError('Behörighet saknas', 403);
  }
  streama(res, doc.fil, doc.filnamn || doc.titel);
}));

async function harDokumentAtkomst(user, doc) {
  if (doc.niva === 'koncern' && doc.publik) return true;
  const scope = await portalScope(user).catch(() => null);
  if (!scope) return false;
  if (doc.niva === 'fastighet') return scope.propertyIds.includes(doc.property?.toString());
  if (doc.niva === 'objekt') return scope.unitIds.some((u) => u.toString() === doc.unit?.toString());
  if (doc.niva === 'hyresgast') return scope.tenant._id.toString() === doc.tenant?.toString();
  return false;
}

/** Ärendebilder – admin eller ärendets kopplade hyresgäst. */
r.get('/arendebild/:faultId/:bilagaId', protect, catchAsync(async (req, res) => {
  const fault = await FaultReport.findById(req.params.faultId);
  if (!fault) throw new AppError('Ärendet hittades inte', 404);
  if (req.user.roll !== 'admin') {
    const scope = await portalScope(req.user);
    if (fault.tenant?.toString() !== scope.tenant._id.toString()) throw new AppError('Behörighet saknas', 403);
  }
  const b = fault.bilagor.id(req.params.bilagaId);
  if (!b) throw new AppError('Bilden hittades inte', 404);
  streama(res, req.query.liten ? b.liten : b.fil, b.filnamn, true);
}));

r.get('/handelsebild/:eventId/:index', protect, catchAsync(async (req, res) => {
  const ev = await FaultEvent.findById(req.params.eventId);
  if (!ev) throw new AppError('Bilden hittades inte', 404);
  const fault = await FaultReport.findById(ev.fault);
  if (req.user.roll !== 'admin') {
    const scope = await portalScope(req.user);
    if (fault?.tenant?.toString() !== scope.tenant._id.toString()) throw new AppError('Behörighet saknas', 403);
  }
  const b = ev.bilder[Number(req.params.index)];
  if (!b) throw new AppError('Bilden hittades inte', 404);
  streama(res, req.query.liten ? b.liten : b.fil, 'bild.jpg', true);
}));

export default r;
