import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  namn: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  adress: { type: String, required: true, trim: true },
  ort: { type: String, enum: ['trollhattan', 'vanersborg'], required: true, index: true },
  beskrivning: String,
  byggar: Number,
  bilder: [{ fil: String, liten: String }],
  lat: Number,
  lng: Number,
  praktiskInfo: {
    bredband: String, tvattstuga: String, parkering: String, sopsortering: String, ovrigt: String,
  },
  publicerad: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export const Property = mongoose.model('Property', schema);
