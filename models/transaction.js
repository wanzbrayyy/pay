const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['activation', 'deposit'],
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);