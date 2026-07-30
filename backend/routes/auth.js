const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

// Import Supabase database adapter
const db = require('../mockDb');

// @route   POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate a mock 6-digit OTP
  const otp = '123456';
  await db.setOtp(phone, otp);

  console.log(`[SUPABASE Auth] Sent OTP ${otp} to phone ${phone}`);

  res.json({ message: 'OTP sent successfully' });
});

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const validOtp = await db.getOtp(phone);
  if (validOtp !== otp) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  // Clear OTP
  await db.deleteOtp(phone);

  try {
    let user = await db.findUserByPhone(phone);
    let isNewUser = false;

    // If new user, create them in Supabase
    if (!user) {
      user = { id: String(Date.now()), phone, anonymousHandle: null, verificationTier: 1, trustScore: 100 };
      await db.createUser(user);
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
    const existingUser = db.users.find(u => u.anonymousHandle === handle);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'Handle is already taken' });
    }

    // Update user handle in Supabase
    const updatedUser = await db.updateUserHandle(userId, handle);

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
