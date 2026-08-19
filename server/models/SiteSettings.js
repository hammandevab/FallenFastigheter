import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: { type: String, default: 'site' },
  telefon: String, epost: String, besoksadress: String, oppettider: String,
  jourtelefon: String, jourinstruktion: String,
  bankgiro: String, ocrInfo: String, autogiroInfo: String, ekonomikontakt: String,
  notisEpostLeads: String, notisEpostFelanmalan: String, notisEpostAkut: String,
  seoTitelsuffix: { type: String, default: 'Fallens Fastigheter' },
}, { timestamps: true });

schema.statics.get = async function () {
  return (await this.findById('site')) || (await this.create({ _id: 'site' }));
};

export const SiteSettings = mongoose.model('SiteSettings', schema);
