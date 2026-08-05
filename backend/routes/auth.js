const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

const db = require('../mockDb');
const { getOtpProvider } = require('../services/otp');
const { getEmailProvider } = require('../services/email');
const { otpRateLimiter } = require('../middleware/rateLimiter');

// ─── Validators ───────────────────────────────────────────────
const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Determine the channel ('phone' or 'email') and validate the identifier.
 * Returns { valid, channel, identifier, error }
 */
function resolveIdentifier(body) {
  const { phone, email } = body;

  if (phone && email) {
    return { valid: false, error: 'Provide either phone or email, not both' };
  }

  if (phone) {
    if (!E164_REGEX.test(phone)) {
      return { valid: false, error: 'Phone must be in E.164 format (e.g. +919876543210)' };
    }
    return { valid: true, channel: 'phone', identifier: phone };
  }

  if (email) {
    const normalized = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalized)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true, channel: 'email', identifier: normalized };
  }

  return { valid: false, error: 'Either phone or email is required' };
}

// ─── @route   POST /api/auth/send-otp ─────────────────────────
// Rate limited: 3 per identifier/10min (phone or email)
router.post('/send-otp', otpRateLimiter, async (req, res) => {
  const resolved = resolveIdentifier(req.body);
  if (!resolved.valid) {
    return res.status(400).json({ error: resolved.error });
  }

  const { channel, identifier } = resolved;

  try {
    let result;

    if (channel === 'phone') {
      const provider = getOtpProvider();
      result = await provider.sendOtp(identifier);
    } else {
      const provider = getEmailProvider();
      result = await provider.sendOtp(identifier);
    }

    if (!result.success) {
      return res.status(500).json({ error: result.message || 'Failed to send verification code' });
    }

    const response = {
      message: 'Verification code sent successfully',
      channel,
      // Mask the identifier for the response (privacy)
      maskedIdentifier: maskIdentifier(identifier, channel),
    };

    // In mock/dev mode include the code for the dev banner
    if (result.mockOtp) {
      response.mockOtp = result.mockOtp;
    }

    console.log(`[Auth] OTP sent via ${channel} to ${identifier}`);
    res.json(response);
  } catch (err) {
    console.error('[Auth] send-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// ─── @route   POST /api/auth/verify-otp ───────────────────────
router.post('/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ error: 'identifier and otp are required' });
  }

  // Determine channel from identifier format
  const channel = E164_REGEX.test(identifier) ? 'phone' : 'email';

  if (channel === 'email' && !EMAIL_REGEX.test(identifier)) {
    return res.status(400).json({ error: 'Invalid identifier format' });
  }

  try {
    let verifyResult;

    if (channel === 'phone') {
      const provider = getOtpProvider();
      verifyResult = await provider.verifyOtp(identifier, otp);
    } else {
      const provider = getEmailProvider();
      verifyResult = await provider.verifyOtp(identifier, otp);
    }

    if (!verifyResult.success) {
      return res.status(401).json({ error: verifyResult.message || 'Invalid or expired verification code' });
    }

    // OTP verified — find or create user
    let user = channel === 'phone'
      ? await db.findUserByPhone(identifier)
      : await db.findUserByEmail(identifier);

    let isNewUser = false;

    if (!user) {
      user = {
        id: String(Date.now()),
        phone: channel === 'phone' ? identifier : null,
        email: channel === 'email' ? identifier : null,
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
      res.json({ token, isNewUser, user, channel });
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

    const updatedUser = await db.updateUserHandle(userId, handle);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('[Auth] profile error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ─── Helper: mask identifier for response ─────────────────────
function maskIdentifier(identifier, channel) {
  if (channel === 'phone') {
    // +91987****210
    return identifier.slice(0, identifier.length - 7) + '****' + identifier.slice(-3);
  }
  // email: abc***@gmail.com
  const [local, domain] = identifier.split('@');
  const masked = local.length <= 3
    ? local[0] + '***'
    : local.slice(0, 3) + '***';
  return `${masked}@${domain}`;
}

module.exports = router;
