const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://internal-orbittasks-internal-alb-XXXX.us-east-1.elb.amazonaws.com:3001';

// Serve static build files
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API calls to internal backend ALB
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true
}));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
  console.log(`Proxying /api → ${BACKEND_URL}`);
});
