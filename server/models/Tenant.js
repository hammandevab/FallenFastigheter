import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  typ: { type: String, enum: ['privat', 'foretag'], required: true },
  namn: { type: String, required: true, trim: true },
  epost: { type: String, lowercase: true, trim: true, index: true },
  telefon: String,
  orgnr: String,
  kontaktperson: String,
  internaAnteckningar: String,
}, { timestamps: true });

export const Tenant = mongoose.model('Tenant', schema);
