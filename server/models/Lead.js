import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  typ: { type: String, enum: ['bostad', 'lokal', 'forvaltning', 'kontakt'], required: true, index: true },
  namn: { type: String, required: true },
  epost: { type: String, required: true, lowercase: true },
  telefon: String,
  foretag: String,
  roll: { type: String, enum: ['bostadssokande', 'foretag', 'hyresgast', 'fastighetsagare', 'annat'] },
  meddelande: { type: String, required: true },
  fastighetBestand: String,
  ort: String,
  storlek: String,
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  status: { type: String, enum: ['ny', 'kontaktad', 'avslutad'], default: 'ny', index: true },
  internaAnteckningar: String,
}, { timestamps: true });

export const Lead = mongoose.model('Lead', schema);
