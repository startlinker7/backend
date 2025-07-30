const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  amount: Number,
  currency: String,
  payment_method: String,
  transaction_id: String,
  status: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);