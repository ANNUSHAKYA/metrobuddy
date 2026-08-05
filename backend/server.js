const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { initSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const journeyRoutes = require('./routes/journeys');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/chat', chatRoutes);

// Basic healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', realTime: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Metro Buddy Live Server running on port ${PORT}`);
});
