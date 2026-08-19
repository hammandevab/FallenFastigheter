import multer from 'multer';
import { AppError } from '../utils/appError.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const DOC_TYPES = [...IMAGE_TYPES, 'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const make = (types) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (types.includes(file.mimetype)) return cb(null, true);
    cb(new AppError('Filtypen tillåts inte', 400));
  },
});

export const uploadImages = make(IMAGE_TYPES);
export const uploadDocument = make(DOC_TYPES);
