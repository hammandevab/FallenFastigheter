import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  titel: { type: String, required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  status: { type: String, enum: ['pagaende', 'genomfort'], default: 'pagaende' },
  bilderFore: [{ fil: String, liten: String }],
  bilderEfter: [{ fil: String, liten: String }],
  identifierade: { type: String, required: true },
  gjorde: { type: String, required: true },
  resultat: String,
  datum: Date,
  publicerad: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export const DevelopmentProject = mongoose.model('DevelopmentProject', schema);
