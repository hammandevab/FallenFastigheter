import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  startdatum: { type: Date, required: true },
  slutdatum: Date,
  uppsagdDatum: Date,
  hyraKrMan: Number,
  status: { type: String, enum: ['kommande', 'pagaende', 'uppsagd', 'avslutad'], default: 'pagaende', index: true },
}, { timestamps: true });

export const Tenancy = mongoose.model('Tenancy', schema);
