import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Något gick fel';

  if (err.name === 'ValidationError') { status = 400; }
  if (err.name === 'CastError') { status = 400; message = 'Ogiltigt id'; }
  if (err.code === 11000) { status = 409; message = 'Värdet finns redan'; }
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Filen är för stor (max 10 MB)' : 'Fel vid filuppladdning';
  }

  if (status >= 500) {
    logger.error(message, { reqId: req.id, stack: err.stack });
    if (config.isProd && !err.isOperational) message = 'Något gick fel på servern';
  }
  res.status(status).json({ success: false, error: { message } });
}
