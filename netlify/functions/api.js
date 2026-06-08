const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
const router = express.Router();

// 1. YOUR ADMIN ID - Only this ID will have access to the Admin Dashboard
const ADMIN_IDS = ['6657645905']; 

app.use(cors());
app.use(express.json());

// Security Middleware: Checks if the user is an admin
const requireAdmin = (req, res, next) => {
  // Extract the user ID from the Authorization header (sent by your app.js)
  const userId = req.headers['authorization']; 
  
  if (!ADMIN_IDS.includes(userId)) {
    return res.status(403).json({ error: "Access Denied: You are not an admin." });
  }
  next();
};

// --- ROUTES ---

router.get('/', (req, res) => {
  res.json({ status: "Online", message: "API is running!" });
});

// Authentication: Checks if the user is an admin for the UI
router.post('/auth/telegram', async (req, res) => {
  const { initData } = req.body;
  
  // NOTE: In a production environment, you should validate the initData hash here 
  // to prevent users from spoofing their IDs. 
  // For now, this logic assumes you are passing the user ID via your auth process.
  const userId = req.body.userId || ''; // Ensure your frontend passes this!

  res.json({
    success: true,
    user: { id: userId, first_name: "Participant" },
    isAdmin: ADMIN_IDS.includes(userId) 
  });
});

router.get('/numbers/available', async (req, res) => {
  res.json({ available: Array.from({length: 100}, (_, i) => i + 1), roundId: 12 });
});

// --- ADMIN ROUTES (Protected by requireAdmin) ---

router.post('/admin/create-round', requireAdmin, async (req, res) => {
  // Add your logic to start a new round here
  res.json({ success: true, message: "Round created" });
});

router.post('/admin/close-round', requireAdmin, async (req, res) => {
  // Add your logic to close the round here
  res.json({ success: true, message: "Round closed" });
});

router.post('/admin/select-winners', requireAdmin, async (req, res) => {
  // Add your logic to set winners here
  res.json({ success: true, winnersCount: 3 });
});

// 🚀 Deploy Routes
app.use('/.netlify/functions/api', router);
app.use('/api', router);

module.exports.handler = serverless(app);
