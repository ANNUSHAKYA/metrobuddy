const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const journeyRoutes = require('./routes/journeys');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/chat', chatRoutes);


// Basic healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

// Temporarily mock database connection for testing
console.log('Running with MOCKED database (no MongoDB connection)');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
