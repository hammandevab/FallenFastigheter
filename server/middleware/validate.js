import { AppError } from '../utils/appError.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map((d) => d.message).join('. ');
    return next(new AppError(msg, 400));
  }
  req[source] = value;
  next();
};
