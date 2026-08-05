const bcrypt = require('bcryptjs');
const EmailProvider = require('./EmailProvider');

// ─── In-memory OTP store ──────────────────────────────────────
// Structure: { email: { hash, expiresAt, attempts, createdAt } }
const otpStore = new Map();

// Clean expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpStore) {
    if (now > entry.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 120_000);

class MockEmailProvider extends EmailProvider {
  constructor() {
    super();
    this.OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
    this.MAX_ATTEMPTS = 5;
  }

  /**
   * Generate a 6-digit OTP code.
   * Test emails (starting with "test") always return '123456'.
   */
  _generateCode(email) {
    if (email.toLowerCase().startsWith('test')) {
      return '123456';
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendOtp(email) {
    const code = this._generateCode(email);

    const salt = await bcrypt.genSalt(8);
    const hash = await bcrypt.hash(code, salt);

    otpStore.set(email, {
      hash,
      expiresAt: Date.now() + this.OTP_EXPIRY_MS,
      attempts: 0,
      createdAt: Date.now(),
    });

    // In mock mode: log to console (visible in terminal) and return mockOtp for dev banner
    console.log(`[MOCK EMAIL OTP] 📧 Code for ${email}: ${code}`);

    return {
      success: true,
      message: 'OTP sent to email successfully',
      mockOtp: code,
    };
  }

  async verifyOtp(email, code) {
    const entry = otpStore.get(email);

    if (!entry) {
      return { success: false, message: 'Invalid or expired verification code' };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return { success: false, message: 'Invalid or expired verification code' };
    }

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      otpStore.delete(email);
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    entry.attempts += 1;

    const isMatch = await bcrypt.compare(code, entry.hash);

    if (!isMatch) {
      return { success: false, message: 'Invalid or expired verification code' };
    }

    otpStore.delete(email);
    return { success: true };
  }
}

module.exports = MockEmailProvider;
