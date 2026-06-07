const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
const router = express.Router();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 🌟 Base landing route for testing directly in the browser
router.get('/', (req, res) => {
  res.json({ 
    status: "Online", 
    message: "Barsan Digital Lottery API is running successfully!" 
  });
});

// 1. Session Authentication Route
router.post('/auth/telegram', async (req, res) => {
  try {
    const { initData, startParam } = req.body;
    res.json({
      success: true,
      user: { id: 12345678, first_name: "Lottery Participant" },
      isAdmin: true // This will unlock your admin panel once frontend connects!
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Available Pool Route
router.get('/numbers/available', async (req, res) => {
  try {
    const taken = [5, 12, 88];
    const available = [];
    for (let i = 1; i <= 100; i++) {
      if (!taken.includes(i)) available.push(i);
    }
    res.json({ available: available, roundId: 12 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Orders Route
router.post('/orders/create', async (req, res) => {
  try {
    const { numbers } = req.body;
    const mockOrder = {
      id: "TXT-" + Math.floor(100000 + Math.random() * 900000),
      amount: numbers.length * 200 // Updated to 200 ETB to match your HTML ticket price
    };
    res.json({ success: true, order: mockOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Load My Tickets Route
router.get('/tickets/my', async (req, res) => {
  res.json({ tickets: [] });
});

// 5. Winners Board Route
router.get('/winners', async (req, res) => {
  res.json({ winners: [] });
});

// 🚀 CRITICAL FIX: Direct routing layers to handle all deployment variants
app.use('/.netlify/functions/api', router);
app.use('/api', router); // Added to prevent 404s when app.js calls /api/...
app.use('/', router); 

// Export handler for Netlify Serverless environment
module.exports.handler = serverless(app);
