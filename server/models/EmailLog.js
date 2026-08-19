import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  till: String, amne: String, text: String,
  status: { type: String, enum: ['skickad', 'simulerad', 'fel'], default: 'simulerad' },
  fel: String,
}, { timestamps: true });
export const EmailLog = mongoose.model('EmailLog', schema);
