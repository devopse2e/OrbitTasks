require('dotenv').config();
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');


const app = express();
const PORT = process.env.PORT || 80;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

app.use(express.static(path.join(__dirname, 'dist')));

// Proxy all /api requests to backend
app.use('/api', createProxyMiddleware({
    target: process.env.BACKEND_URL, // This should be 'http://localhost:3001'
    changeOrigin: true,
    logLevel: 'debug', // Keep this on to see proxy activity
  }));
  

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Frontend server running on http://${HOST}:${PORT}`);
    console.log(`Proxying /api requests to ${BACKEND_URL}`);
});