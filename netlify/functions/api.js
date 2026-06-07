const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 1. Session Authentication Route
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData, startParam } = req.body;
    
    // TODO: Add your Supabase registration/login validation here
    
    // Mocking a successful response for testing:
    res.json({
      success: true,
      user: {
        id: 12345678,
        first_name: "Lottery Participant"
      },
      isAdmin: true // Temporary true so you can test admin panels
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Available Pool Route
app.get('/api/numbers/available', async (req, res) => {
  try {
    // Mocking an active round with some taken numbers (e.g., 5, 12, 88 are taken)
    // Available numbers are 1-100 except the taken ones
    const taken = [5, 12, 88];
    const available = [];
    for (let i = 1; i <= 100; i++) {
      if (!taken.includes(i)) available.push(i);
    }

    res.json({
      available: available,
      roundId: 12 // Current Active Round Number
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Orders Route
app.post('/api/orders/create', async (req, res) => {
  try {
    const { numbers } = req.body;
    const initData = req.headers['authorization'];

    // Generate a quick mock order
    const mockOrder = {
      id: "TXT-" + Math.floor(100000 + Math.random() * 900000),
      amount: numbers.length * 100 // 100 ETB per ticket
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

// 6. Admin Panel Routes
app.post('/api/admin/create-round', async (req, res) => {
  res.json({ success: true });
});

app.post('/api/admin/close-round', async (req, res) => {
  res.json({ success: true });
});

app.post('/api/admin/select-winners', async (req, res) => {
  res.json({ success: true, winnersCount: 3 });
});

app.get('/api/admin/dashboard-stats', async (req, res) => {
  res.json({ totalUsers: 1, activeTickets: 0 });
});

// Export handler for Netlify Serverless environment
module.exports.handler = serverless(app);
