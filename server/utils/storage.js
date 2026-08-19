import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { config } from '../config/index.js';

export const PUBLIC_DIR = path.join(config.uploadDir, 'public');
export const PROTECTED_DIR = path.join(config.uploadDir, 'protected');

export function ensureDirs() {
  for (const d of [PUBLIC_DIR, PROTECTED_DIR]) fs.mkdirSync(d, { recursive: true });
}

const rand = () => crypto.randomBytes(10).toString('hex');

/** Bearbetar en uppladdad bild: roterar, skalar, strippar metadata. Returnerar relativa sökvägar. */
export async function saveImage(buffer, { protectedFile = false } = {}) {
  const dir = protectedFile ? PROTECTED_DIR : PUBLIC_DIR;
  const id = rand();
  const full = `${id}.jpg`;
  const thumb = `${id}_liten.jpg`;
  const base = sharp(buffer, { failOn: 'none' }).rotate();
  await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(dir, full));
  await base.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(dir, thumb));
  const prefix = protectedFile ? 'protected' : 'public';
  return { fil: `${prefix}/${full}`, liten: `${prefix}/${thumb}` };
}

/** Sparar dokumentfil (pdf m.m.) som den är, med slumpat namn. */
export function saveFile(buffer, originalName, { protectedFile = true } = {}) {
  const dir = protectedFile ? PROTECTED_DIR : PUBLIC_DIR;
  const ext = (path.extname(originalName || '') || '.bin').toLowerCase().slice(0, 10);
  const name = `${rand()}${ext}`;
  fs.writeFileSync(path.join(dir, name), buffer);
  return `${protectedFile ? 'protected' : 'public'}/${name}`;
}

export function absPath(rel) {
  const p = path.normalize(path.join(config.uploadDir, rel));
  if (!p.startsWith(path.normalize(config.uploadDir))) throw new Error('Ogiltig sökväg');
  return p;
}

export function deleteRel(rel) {
  try { if (rel) fs.unlinkSync(absPath(rel)); } catch { /* redan borta */ }
}
