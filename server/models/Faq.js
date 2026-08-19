import mongoose from 'mongoose';

const catSchema = new mongoose.Schema({
  namn: { type: String, required: true },
  ordning: { type: Number, default: 0 },
});
export const FaqCategory = mongoose.model('FaqCategory', catSchema);

const itemSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'FaqCategory', required: true, index: true },
  fraga: { type: String, required: true },
  svar: { type: String, required: true },
  ordning: { type: Number, default: 0 },
  publicerad: { type: Boolean, default: true },
});
export const FaqItem = mongoose.model('FaqItem', itemSchema);
