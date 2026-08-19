import jwt from 'jsonwebtoken';
import { AppError, catchAsync } from '../utils/appError.js';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

function tokenFrom(req) {
  return req.cookies?.[config.cookieName] ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
}

async function resolveUser(req) {
  const token = tokenFrom(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'aktiv') return null;
    return user;
  } catch {
    return null;
  }
}

export const protect = catchAsync(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) throw new AppError('Du behöver logga in', 401);
  req.user = user;
  next();
});

export const optionalAuth = catchAsync(async (req, _res, next) => {
  req.user = await resolveUser(req);
  next();
});

export const restrictTo = (...roller) => (req, _res, next) => {
  if (!req.user || !roller.includes(req.user.roll)) return next(new AppError('Behörighet saknas', 403));
  next();
};

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), roll: user.roll }, config.jwtSecret, { expiresIn: config.jwtExpires });
}

export function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, { httpOnly: true, sameSite: 'lax', secure: config.isProd, path: '/' });
}
