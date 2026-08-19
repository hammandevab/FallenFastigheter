import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  titel: { type: String, required: true },
  beskrivning: String,
  fil: { type: String, required: true },
  filnamn: String,
  filtyp: String,
  storlek: Number,
  kategori: { type: String, enum: ['blankett', 'information', 'avtal', 'protokoll', 'ovrigt'], default: 'ovrigt' },
  niva: { type: String, enum: ['koncern', 'fastighet', 'objekt', 'hyresgast'], required: true, index: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  publik: { type: Boolean, default: false, index: true },
  uppladdadAv: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const DocumentFile = mongoose.model('DocumentFile', schema);
