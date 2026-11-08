require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const submitHandler = require('./api/submit');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use(express.static(path.join(__dirname)));

// API endpoint
app.post('/api/submit', async (req, res) => {
  try {
    await submitHandler(req, res);
  } catch (error) {
    console.error('Error in submit handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Make sure to set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env file');
});
