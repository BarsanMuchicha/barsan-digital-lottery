const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors'); // Added for cross-origin requests
const { createClient } = require('@supabase/supabase-js');

const app = express();
const router = express.Router();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.use(cors()); // Enable CORS
app.use(express.json());

// --- HELPER: Validate Telegram Auth ---
const verifyTelegramAuth = (req, res, next) => {
    // In production, verify the initData hash here.
    next();
};

// --- ROUTES ---

// 1. PLACE ORDER
router.post('/orders/create', verifyTelegramAuth, async (req, res) => {
    const { userId, roundId, numbers, amount } = req.body;
    const orderId = BDL-${roundId}-${Math.random().toString(36).substr(2, 9).toUpperCase()};

    const { data, error } = await supabase
        .from('orders')
        .insert([{ id: orderId, user_id: userId, round_id: roundId, numbers, amount, expires_at: new Date(Date.now() + 3600000) }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, orderId });
});

// 2. GET ACTIVE ROUND
router.get('/round/active', async (req, res) => {
    const { data, error } = await supabase
        .from('lottery_rounds')
        .select('*')
        .eq('status', 'active')
        .single();
        
    res.json({ data, error });
});

// 3. ADMIN: CREATE ROUND
router.post('/admin/create-round', async (req, res) => {
    const { data, error } = await supabase.from('lottery_rounds').insert([{ status: 'active' }]);
    res.json({ success: true, data });
});

// 4. WEBHOOK: PROCESS SMS PAYMENTS
router.post('/webhook/sms', async (req, res) => {
    // SECURITY: Validate secret key
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.SMS_WEBHOOK_SECRET) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const { orderId, amount, transactionId, senderName } = req.body;

    // 1. Record Payment
    await supabase.from('payments').insert([{
        order_id: orderId,
        transaction_id: transactionId,
        amount,
        sender_name: senderName
    }]);

    // 2. Update Order Status
    await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);

    // 3. Auto-generate tickets
    const { data: order } = await supabase.from('orders').select('numbers, user_id, round_id').eq('id', orderId).single();
    
    if (order) {
        const tickets = order.numbers.map(num => ({
            user_id: order.user_id,
            round_id: order.round_id,
            order_id: orderId,
            number: num
        }));
        await supabase.from('tickets').insert(tickets);
    }

    res.status(200).json({ success: true });
});

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);
