import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  payment_account: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sales_email: {
    type: String,
    required: true
  },
  customer_email: {
    type: String,
    required: true
  },
  secureId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'failed'],
    default: 'pending'
  },
  paymentAttempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;
