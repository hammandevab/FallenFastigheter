import rateLimit from 'express-rate-limit';

const std = { standardHeaders: true, legacyHeaders: false, message: { success: false, error: { message: 'För många förfrågningar – försök igen om en stund.' } } };

export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 800, ...std });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, ...std });
export const formLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, ...std });
