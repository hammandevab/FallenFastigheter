import mongoose from 'mongoose';

export const FAULT_KATEGORIER = ['vvs', 'el', 'varme', 'vitvaror', 'dorr_fonster', 'tvattstuga', 'gemensamma', 'annat'];
export const FAULT_STATUS = ['ny', 'pagaende', 'vantar', 'atgardad', 'stangd', 'avvisad'];

const bilaga = new mongoose.Schema({
  fil: String, liten: String, filnamn: String, storlek: Number,
  uppladdadAv: { type: String, default: 'anmalaren' },
}, { timestamps: { createdAt: 'skapad', updatedAt: false } });

const schema = new mongoose.Schema({
  arendenummer: { type: Number, required: true, unique: true, index: true },
  kalla: { type: String, enum: ['publik', 'portal', 'admin'], required: true },
  namn: { type: String, required: true },
  telefon: { type: String, required: true },
  epost: { type: String, required: true, lowercase: true, index: true },
  adress: { type: String, required: true },
  lagenhetsnummer: String,
  kategori: { type: String, enum: FAULT_KATEGORIER, required: true },
  beskrivning: { type: String, required: true },
  akut: { type: Boolean, default: false, index: true },
  status: { type: String, enum: FAULT_STATUS, default: 'ny', index: true },
  bilagor: [bilaga],
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  tilldelad: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const FaultReport = mongoose.model('FaultReport', schema);
