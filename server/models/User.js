import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const schema = new mongoose.Schema({
  epost: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  losenordHash: { type: String, select: false },
  namn: { type: String, required: true, trim: true },
  telefon: { type: String, trim: true },
  roll: { type: String, enum: ['admin', 'hyresgast'], required: true },
  status: { type: String, enum: ['inbjuden', 'aktiv', 'inaktiverad'], default: 'inbjuden' },
  inbjudanToken: { type: String, select: false },
  inbjudanUtgar: Date,
  aterstallToken: { type: String, select: false },
  aterstallUtgar: Date,
  epostByte: { select: false, type: { nyEpost: String, token: String, utgar: Date } },
  senastInloggad: Date,
}, { timestamps: true });

schema.methods.sattLosenord = async function (losen) {
  this.losenordHash = await bcrypt.hash(losen, 12);
};
schema.methods.kontrolleraLosenord = function (losen) {
  return bcrypt.compare(losen, this.losenordHash || '');
};
schema.methods.skapaToken = function (falt, timmar) {
  const token = crypto.randomBytes(32).toString('hex');
  this[falt + 'Token'] = crypto.createHash('sha256').update(token).digest('hex');
  this[falt + 'Utgar'] = new Date(Date.now() + timmar * 3600 * 1000);
  return token;
};
schema.statics.hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

schema.methods.publik = function () {
  return { id: this._id, epost: this.epost, namn: this.namn, telefon: this.telefon, roll: this.roll, status: this.status, senastInloggad: this.senastInloggad, skapad: this.createdAt };
};

export const User = mongoose.model('User', schema);
