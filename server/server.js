import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/limits.js';
import { ensureDirs, PUBLIC_DIR } from './utils/storage.js';
import { byggSitemap } from './services/sitemap.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import portalRoutes from './routes/portal.js';
import fileRoutes from './routes/files.js';
import adminRoutes from './routes/admin/index.js';
import { kanskeSeeda } from './seed/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1); // bakom Railways proxy
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: config.clientOrigin ? config.clientOrigin.split(',') : true, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(requestId);

// ---- API ----
const P = config.apiPrefix;
app.get(`${P}/health`, (_req, res) => res.json({ status: 'ok', tid: new Date().toISOString() }));
app.use(P, apiLimiter);
app.use(`${P}/auth`, authRoutes);
app.use(`${P}/public`, publicRoutes);
app.use(`${P}/portal`, portalRoutes);
app.use(`${P}/filer`, fileRoutes);
app.use(`${P}/admin`, adminRoutes);

// ---- Publika uppladdade filer (objektbilder m.m.) ----
app.use('/uploads/public', express.static(PUBLIC_DIR, { maxAge: '7d', immutable: true }));

// ---- SEO ----
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send([
    'User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /mina-sidor', '',
    `Sitemap: ${config.appUrl.replace(/\/$/, '')}/sitemap.xml`, '',
  ].join('\n'));
});
app.get('/sitemap.xml', async (_req, res, next) => {
  try { res.type('application/xml').send(await byggSitemap()); } catch (e) { next(e); }
});

// ---- SPA i produktion ----
const distDir = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    // Admin och portal ska aldrig indexeras (§2.3, §10.2)
    if (req.path.startsWith('/admin') || req.path.startsWith('/mina-sidor')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(errorHandler);

async function start() {
  ensureDirs();
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB ansluten');
  await kanskeSeeda();
  // Lyssna på :: för Railways privata nätverk (IPv6) – accepterar även IPv4.
  // Miljöer utan IPv6 (t.ex. vissa lokala sandlådor) faller tillbaka till 0.0.0.0.
  const starta = (host) => app.listen(config.port, host, () => logger.info(`Fallens Fastigheter igång på ${host}:${config.port} (${config.env})`));
  const server = starta(process.env.HOST || '::');
  server.on('error', (err) => {
    if ((err.code === 'EAFNOSUPPORT' || err.code === 'EADDRNOTAVAIL') && !process.env.HOST) {
      logger.warn('IPv6 saknas – faller tillbaka till 0.0.0.0');
      starta('0.0.0.0');
    } else throw err;
  });
}

start().catch((e) => { logger.error('Uppstart misslyckades: ' + e.message); process.exit(1); });

export default app;
