import 'dotenv/config';

const bool = (v, d = false) => (v === undefined ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),
  apiPrefix: '/api/' + (process.env.API_VERSION || 'v1'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fallens',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-byt-ut-mig',
  jwtExpires: process.env.JWT_EXPIRES_IN || '30d',
  cookieName: 'fallens_token',
  clientOrigin: process.env.CLIENT_ORIGIN || '',
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  uploadDir: process.env.UPLOAD_DIR || new URL('../uploads', import.meta.url).pathname,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Fallens Fastigheter <noreply@fallens.se>',
  },
  seedDemo: bool(process.env.SEED_DEMO, true),
  seedAdminEpost: process.env.SEED_ADMIN_EPOST || 'admin@fallens.se',
  seedAdminLosen: process.env.SEED_ADMIN_LOSENORD || 'FallensAdmin2026!',
};
