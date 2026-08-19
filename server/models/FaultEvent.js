import mongoose from 'mongoose';

/** Utgör både tidslinje och meddelandetråd för ett ärende. */
const schema = new mongoose.Schema({
  fault: { type: mongoose.Schema.Types.ObjectId, ref: 'FaultReport', required: true, index: true },
  typ: { type: String, enum: ['status', 'svar', 'intern_notering', 'komplettering'], required: true },
  text: String,
  nyStatus: String,
  synligForAnmalaren: { type: Boolean, default: true },
  bilder: [{ fil: String, liten: String }],
  skapadAv: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skapadAvNamn: String,
}, { timestamps: true });

export const FaultEvent = mongoose.model('FaultEvent', schema);
