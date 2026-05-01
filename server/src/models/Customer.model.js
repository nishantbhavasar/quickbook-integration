import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  name: String,
  email: String,
  lastUpdated: Date
}, { timestamps: true });

export default mongoose.model('Customer', schema);