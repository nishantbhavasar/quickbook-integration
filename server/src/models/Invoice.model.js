import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  invoiceId: { type: String, unique: true },
  customerId: String,
  amount: Number,
  status: String,
  invoiceDate: Date,
  lastUpdated: Date
}, { timestamps: true });

export default mongoose.model('Invoice', schema);