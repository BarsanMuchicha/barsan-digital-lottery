const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 🌟 NEW: Browser Landing Routes (Prevents "Cannot GET" errors)
app.get('/', (req, res) => {
  res.json({ status: "Online", message: "Barsan Digital Lottery API is working perfectly!" });
});

app.get('/.netlify/functions/api', (req, res) => {
  res.json({ status: "Online", message: "Barsan Digital Lottery API is working perfectly!" });
});

// 1. Session Authentication Route
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData, startParam } = req.body;
    res.json({
      success: true,
      user: { id: 12345678, first_name: "Lottery Participant" },
      isAdmin: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Available Pool Route
app.get('/api/numbers/available', async (req, res) => {
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
app.post('/api/orders/create', async (req, res) => {
  try {
    const { numbers } = req.body;
    const mockOrder = {
      id: "TXT-" + Math.floor(100000 + Math.random() * 900000),
      amount: numbers.length * 100
    };
    res.json({ success: true, order: mockOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Load My Tickets Route
app.get('/api/tickets/my', async (req, res) => {
  res.json({ tickets: [] });
});

// 5. Winners Board Route
app.get('/api/winners', async (req, res) => {
  res.json({ winners: [] });
});

// Export handler for Netlify Serverless environment
module.exports.handler = serverless(app);
