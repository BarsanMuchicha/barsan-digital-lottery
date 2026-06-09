const express = require('express');
const serverless = require('serverless-http');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const router = express.Router();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// HMAC Verification Helper
const verifyTelegramAuth = (req, res, next) => {
    const initData = req.headers['authorization']; // Passed from frontend
    if (!initData) return res.status(401).json({ error: "No Auth Data" });

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
    
    // Simple verification (In production, parse initData and verify hash)
    // For now, this is your placeholder to lock down the endpoint
    next();
};

// 1. PLACE ORDER
router.post('/orders/create', verifyTelegramAuth, async (req, res) => {
    const { userId, roundId, numbers, amount } = req.body;
    const orderId = `BDL-${roundId}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data, error } = await supabase
        .from('orders')
        .insert([{ id: orderId, user_id: userId, round_id: roundId, numbers, amount, status: 'pending' }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, orderId });
});

// 2. WEBHOOK: PROCESS PAYMENTS
router.post('/webhook/sms', async (req, res) => {
    if (req.headers['x-webhook-secret'] !== process.env.SMS_WEBHOOK_SECRET) return res.status(403).send();
    
    const { orderId, transactionId } = req.body;
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
    res.status(200).json({ success: true });
});

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
