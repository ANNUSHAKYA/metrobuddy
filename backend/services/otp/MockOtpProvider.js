const bcrypt = require('bcryptjs');
const OtpProvider = require('./OtpProvider');

// ─── In-memory OTP store ──────────────────────────────────────
// Structure: { phone: { hash, expiresAt, attempts, createdAt } }
const otpStore = new Map();

// Clean expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore) {
    if (now > entry.expiresAt) {
      otpStore.delete(phone);
    }
  }
}, 120_000);

class MockOtpProvider extends OtpProvider {
  constructor() {
    super();
    this.OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
    this.MAX_ATTEMPTS = 5;
  }

  /**
   * Generate a 6-digit OTP code.
   * For test numbers (ending in 0000), always return '123456'.
   * For other numbers, generate a random 6-digit code.
   */
  _generateCode(phoneNumber) {
    // Test pattern: numbers ending in 0000 always get 123456
    if (phoneNumber.endsWith('0000')) {
      return '123456';
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendOtp(phoneNumber) {
    const code = this._generateCode(phoneNumber);

    // Hash the code before storing
    const salt = await bcrypt.genSalt(8);
    const hash = await bcrypt.hash(code, salt);

    otpStore.set(phoneNumber, {
      hash,
      expiresAt: Date.now() + this.OTP_EXPIRY_MS,
      attempts: 0,
      createdAt: Date.now(),
    });

    console.log(`[MOCK OTP] 📱 Code for ${phoneNumber}: ${code}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      // Return plaintext code ONLY in mock mode for dev UI banner
      mockOtp: code,
    };
  }

  async verifyOtp(phoneNumber, code) {
    const entry = otpStore.get(phoneNumber);

    if (!entry) {
      // Generic error — don't reveal whether number exists
      return { success: false, message: 'Invalid or expired verification code' };
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phoneNumber);
      return { success: false, message: 'Invalid or expired verification code' };
    }

    // Check max attempts
    if (entry.attempts >= this.MAX_ATTEMPTS) {
      otpStore.delete(phoneNumber);
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    // Increment attempt counter
    entry.attempts += 1;

    // Compare hashed code
    const isMatch = await bcrypt.compare(code, entry.hash);

    if (!isMatch) {
      return { success: false, message: 'Invalid or expired verification code' };
    }

    // Success — clear the OTP entry
    otpStore.delete(phoneNumber);

    return { success: true };
  }
}

module.exports = MockOtpProvider;
