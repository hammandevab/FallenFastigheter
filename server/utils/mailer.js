import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from './logger.js';
import { EmailLog } from '../models/EmailLog.js';
import { SiteSettings } from '../models/SiteSettings.js';

let transporter = null;
if (config.smtp.host) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
}

export const mailMode = () => (transporter ? 'smtp' : 'simulerad');

/**
 * Skickar transaktionsmail i varumärkeston. Utan SMTP-konfiguration loggas mailet
 * (status "simulerad") så att flödet är verifierbart i admin ändå.
 */
export async function sendMail({ till, amne, rader = [], knappText, knappUrl }) {
  const s = await SiteSettings.get();
  const kontaktrad = [s.telefon, s.epost].filter(Boolean).join(' · ');
  const text = [
    ...rader,
    knappUrl ? `\n${knappText || 'Öppna'}: ${knappUrl}` : '',
    '\n—\nFallens Fastigheter',
    'Bostäder, lokaler och fastighetsförvaltning i Trollhättan och Vänersborg.',
    kontaktrad,
  ].filter(Boolean).join('\n');

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;background:#FAF9F7;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2DED6;overflow:hidden">
      <div style="background:#1F4038;color:#fff;padding:16px 24px;font-weight:600">Fallens Fastigheter</div>
      <div style="padding:24px;color:#22302B;font-size:15px;line-height:1.6">
        ${rader.map((r) => `<p style="margin:0 0 12px">${escapeHtml(r)}</p>`).join('')}
        ${knappUrl ? `<p style="margin:20px 0"><a href="${knappUrl}" style="background:#1F4038;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block">${escapeHtml(knappText || 'Öppna')}</a></p>` : ''}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #E2DED6;color:#5D6B64;font-size:13px">
        Vi ser möjligheterna i våra fastigheter.${kontaktrad ? '<br>' + escapeHtml(kontaktrad) : ''}
      </div>
    </div>
  </div>`;

  const post = new EmailLog({ till, amne, text, status: 'simulerad' });
  try {
    if (transporter) {
      await transporter.sendMail({ from: config.smtp.from, to: till, subject: amne, text, html });
      post.status = 'skickad';
    }
  } catch (e) {
    post.status = 'fel';
    post.fel = e.message;
    logger.error('Mailfel', { till, amne, fel: e.message });
  }
  await post.save();
  logger.info(`Mail [${post.status}] → ${till}: ${amne}`);
  return post;
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
