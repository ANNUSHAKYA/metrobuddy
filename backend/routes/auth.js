const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

// Import Supabase database adapter
const db = require('../mockDb');

// Import OTP provider abstraction
const { getOtpProvider } = require('../services/otp');

// Import rate limiter
const { otpRateLimiter } = require('../middleware/rateLimiter');

// ─── @route   POST /api/auth/send-otp ─────────────────────────
// Rate limited: 3 per phone/10min, 10 per IP/10min
router.post('/send-otp', otpRateLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Validate E.164 format: + followed by 7-15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(phone)) {
    return res.status(400).json({ error: 'Phone number must be in E.164 format (e.g. +919876543210)' });
  }

  try {
    const provider = getOtpProvider();
    const result = await provider.sendOtp(phone);

    if (!result.success) {
      return res.status(500).json({ error: result.message || 'Failed to send OTP' });
    }

    const response = { message: 'OTP sent successfully' };

    // In mock mode, include the OTP for dev UI banner
    if (result.mockOtp) {
      response.mockOtp = result.mockOtp;
    }

    console.log(`[Auth] OTP sent to ${phone}`);
    res.json(response);
  } catch (err) {
    console.error('[Auth] send-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// ─── @route   POST /api/auth/verify-otp ───────────────────────
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  try {
    const provider = getOtpProvider();
    const verifyResult = await provider.verifyOtp(phone, otp);

    if (!verifyResult.success) {
      // Generic error — don't reveal specifics
      return res.status(401).json({ error: verifyResult.message || 'Invalid or expired verification code' });
    }

    // OTP verified — find or create user
    let user = await db.findUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      user = {
        id: String(Date.now()),
        phone,
        anonymousHandle: null,
        verificationTier: 1,
        trustScore: 100,
      };
      await db.createUser(user);
      isNewUser = true;
    }

    // Issue JWT session token
    const payload = { user: { id: user.id } };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, isNewUser, user });
    });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err.message);
    res.status(500).send('Server Error');
  }
});

// ─── @route   POST /api/auth/profile ──────────────────────────
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
