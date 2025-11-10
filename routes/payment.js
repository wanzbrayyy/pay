const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAccountActive } = require('../middleware/authMiddleware');
const config = require('../config');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { v4: uuidv4 } = require('uuid');

router.get('/checkout', ensureAuthenticated, (req, res) => {
    if (req.user.paymentStatus === 'completed') return res.redirect('/dashboard');
    const { slug, feeAmount } = config.pakasir;
    const order_id = `ACT-${req.user.paymentOrderId}`;
    const redirect_url = `${config.app.baseUrl}/dashboard?payment=success`;
    const paymentUrl = `${config.pakasir.paymentUrl}/${slug}/${feeAmount}?order_id=${order_id}&qris_only=1&redirect=${redirect_url}`;
    res.render('checkout', { title: 'Account Activation', paymentUrl, amount: feeAmount });
});

router.get('/deposit', ensureAuthenticated, ensureAccountActive, (req, res) => {
    res.render('deposit', { title: 'Deposit Saldo', user: req.user });
});

router.post('/deposit', ensureAuthenticated, ensureAccountActive, async (req, res) => {
    let amount = parseInt(req.body.amount, 10);
    if (isNaN(amount) || amount < 300000) {
        return res.render('deposit', { title: 'Deposit Saldo', user: req.user, error: 'Minimum deposit is Rp 300,000' });
    }
    const orderId = `DEP-${uuidv4()}`;
    await new Transaction({
        userId: req.user._id,
        orderId: orderId,
        amount: amount,
        type: 'deposit',
        status: 'pending'
    }).save();

    const encodedText = encodeURIComponent(`saya berhasil deposit sebesar Rp ${amount.toLocaleString('id-ID')} tolong cek database nya kak`);
    const redirect_url = `https://t.me/maverick_dark?text=${encodedText}`;
    const paymentUrl = `${config.pakasir.paymentUrl}/${config.pakasir.slug}/${amount}?order_id=${orderId}&redirect=${redirect_url}`;
    res.redirect(paymentUrl);
});

router.post('/webhook/pakasir', async (req, res) => {
    const { order_id, status, amount } = req.body;
    console.log(`Webhook received for: ${order_id}, status: ${status}`);

    if (status !== 'completed') return res.status(200).send('OK');

    try {
        if (order_id.startsWith('ACT-')) {
            const paymentOrderId = order_id.substring(4);
            const user = await User.findOne({ paymentOrderId: paymentOrderId });
            if (user && user.paymentStatus !== 'completed') {
                const newResellerId = `WZFC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                const newApiKey = `wzfc_sk_${uuidv4().replace(/-/g, '')}`;
                user.paymentStatus = 'completed';
                user.rdash_reseller_id = newResellerId;
                user.rdash_api_key = newApiKey;
                await user.save();
                console.log(`User ${user.email} activated.`);
            }
        } else if (order_id.startsWith('DEP-')) {
            const transaction = await Transaction.findOne({ orderId: order_id });
            if (transaction && transaction.status !== 'completed') {
                transaction.status = 'completed';
                await User.findByIdAndUpdate(transaction.userId, { $inc: { balance: transaction.amount } });
                await transaction.save();
                console.log(`Deposit for user ${transaction.userId} of Rp ${transaction.amount} completed.`);
            }
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
    }
    res.status(200).send('OK');
});

module.exports = router;