const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

// Import shared in-memory database
const db = require('../mockDb');
const mockOtps = db.otps;
const mockUsers = db.users;

// @route   POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate a mock 6-digit OTP
  const otp = '123456';
  mockOtps.set(phone, otp);

  console.log(`[MOCK OTP] Sent OTP ${otp} to phone ${phone}`);

  res.json({ message: 'OTP sent successfully' });
});

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const validOtp = mockOtps.get(phone);
  if (validOtp !== otp) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  // Clear OTP
  mockOtps.delete(phone);

  try {
    let user = mockUsers.find(u => u.phone === phone);
    let isNewUser = false;
    
    // If new user, create them
    if (!user) {
      user = { id: String(Date.now()), phone, anonymousHandle: null, verificationTier: 1, trustScore: 100 };
      mockUsers.push(user);
      isNewUser = true;
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, isNewUser, user });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/profile
router.post('/profile', async (req, res) => {
  const { token, handle } = req.body;

  if (!token || !handle) {
    return res.status(400).json({ error: 'Token and handle are required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user.id;

    // Check if handle is taken
    const existingHandle = mockUsers.find(u => u.anonymousHandle === handle);
    if (existingHandle && existingHandle.id !== userId) {
      return res.status(400).json({ error: 'Handle is already taken' });
    }

    // Update user
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    mockUsers[userIndex].anonymousHandle = handle;

    res.json({ message: 'Profile updated successfully', user: mockUsers[userIndex] });
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
