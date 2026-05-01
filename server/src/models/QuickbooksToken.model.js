import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
  companyId: String,
  expiresIn: Date,
  companyName: String,
}, { timestamps: true });

export default mongoose.model('QuickbooksToken', schema);