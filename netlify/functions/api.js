const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Your existing routes
app.post('/api/translate', async (req, res) => {
  // Your existing translation logic
});

app.post('/api/translate-bulk', async (req, res) => {
  // Your existing bulk translation logic
});

// Export the handler
exports.handler = serverless(app);