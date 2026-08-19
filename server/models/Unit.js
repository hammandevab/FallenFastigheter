import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  typ: { type: String, enum: ['bostad', 'lokal'], required: true, index: true },
  beteckning: { type: String, trim: true },
  adress: { type: String, required: true, trim: true },
  vaning: String,
  ytaM2: Number,
  hyraKrMan: Number,
  rum: Number,
  lokaltyp: { type: String, enum: ['kontor', 'butik', 'lager', 'verkstad', 'ovrigt'] },
  attribut: {
    balkong: Boolean, hiss: Boolean, forradIngar: Boolean, parkering: Boolean,
    takhojd: String, lastintag: Boolean, skyltlage: Boolean,
  },
  beskrivning: String,
  bilder: [{ fil: String, liten: String }],
  planritning: { fil: String, liten: String },
  tilltradeDatum: Date,
  status: { type: String, enum: ['ledig', 'uthyrd', 'kommande'], default: 'ledig', index: true },
  publicerad: { type: Boolean, default: false, index: true },
  publiceradDatum: Date,
}, { timestamps: true });

schema.pre('save', function (next) {
  if (this.isModified('publicerad') && this.publicerad && !this.publiceradDatum) this.publiceradDatum = new Date();
  next();
});

export const Unit = mongoose.model('Unit', schema);
