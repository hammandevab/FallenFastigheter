import { Property } from '../models/Property.js';
import { Unit } from '../models/Unit.js';
import { config } from '../config/index.js';

const STATISKA = ['/', '/bostader', '/lokaler', '/fastigheter', '/hyresgast', '/hyresgast/hyra',
  '/hyresgast/faq', '/hyresgast/aktuellt', '/hyresgast/inflyttning', '/hyresgast/utflyttning',
  '/hyresgast/dokument', '/felanmalan', '/forvaltning', '/utveckling', '/om-fallens',
  '/om-fallens/sa-arbetar-vi', '/kontakt', '/integritetspolicy'];

export async function byggSitemap() {
  const bas = config.appUrl.replace(/\/$/, '');
  const props = await Property.find({ publicerad: true }).select('slug updatedAt');
  const pubProps = props.map((p) => p._id);
  const units = await Unit.find({ publicerad: true, status: 'ledig', property: { $in: pubProps } }).select('typ updatedAt');
  const rader = [
    ...STATISKA.map((p) => ({ loc: bas + p })),
    ...props.map((p) => ({ loc: `${bas}/fastigheter/${p.slug}`, lastmod: p.updatedAt })),
    ...units.map((u) => ({ loc: `${bas}/${u.typ === 'bostad' ? 'bostader' : 'lokaler'}/${u._id}`, lastmod: u.updatedAt })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rader
    .map((r) => `  <url><loc>${r.loc}</loc>${r.lastmod ? `<lastmod>${r.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>`;
}
