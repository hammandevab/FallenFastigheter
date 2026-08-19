import mongoose from 'mongoose';

export const NEWS_KATEGORIER = ['planerat_arbete', 'driftstorning', 'forbattring', 'information'];

const schema = new mongoose.Schema({
  rubrik: { type: String, required: true },
  brodtext: { type: String, required: true },
  kategori: { type: String, enum: NEWS_KATEGORIER, required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null, index: true },
  synlighet: { type: String, enum: ['publik', 'hyresgaster'], default: 'publik' },
  publiceradFran: Date,
  publiceradTill: Date,
  status: { type: String, enum: ['utkast', 'publicerad', 'avpublicerad'], default: 'utkast', index: true },
  skapadAv: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

/** Publiceringsfönster utvärderas vid läsning – ingen worker krävs för auto-utgång. */
schema.statics.aktivFilter = function () {
  const nu = new Date();
  return {
    status: 'publicerad',
    $and: [
      { $or: [{ publiceradFran: null }, { publiceradFran: { $lte: nu } }] },
      { $or: [{ publiceradTill: null }, { publiceradTill: { $gte: nu } }] },
    ],
  };
};

export const NewsPost = mongoose.model('NewsPost', schema);
