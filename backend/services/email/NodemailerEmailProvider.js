const bcrypt = require('bcryptjs');
const EmailProvider = require('./EmailProvider');

/**
 * NodemailerEmailProvider
 * Sends real OTP emails via SMTP (Gmail, Outlook, SendGrid, etc.)
 *
 * Required environment variables:
 *   SMTP_HOST    — e.g. smtp.gmail.com
 *   SMTP_PORT    — e.g. 587 (TLS) or 465 (SSL)
 *   SMTP_USER    — your email address
 *   SMTP_PASS    — your app password (for Gmail: generate at myaccount.google.com/apppasswords)
 *   EMAIL_FROM   — display name + address, e.g. "Metro Buddy <no-reply@metrobuddy.app>"
 *
 * Gmail Setup:
 *   1. Enable 2-Factor Authentication on your Gmail account
 *   2. Go to: myaccount.google.com → Security → App Passwords
 *   3. Generate an App Password for "Mail"
 *   4. Use that 16-char password as SMTP_PASS
 *
 * NOTE: nodemailer is loaded lazily so the server starts fine even if not installed.
 * Run: cd backend && npm install nodemailer
 */
class NodemailerEmailProvider extends EmailProvider {
  constructor() {
    super();
    this.OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
    this.MAX_ATTEMPTS = 5;
    this.otpStore = new Map();

    // Validate required env vars
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Nodemailer: SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in .env');
    }

    // Lazy-load nodemailer
    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      console.warn('⚠️  nodemailer not installed. Run: cd backend && npm install nodemailer');
      this.transporter = null;
    }
  }

  _generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendOtp(email) {
    if (!this.transporter) {
      return { success: false, message: 'Email provider not configured. nodemailer not installed.' };
    }

    const code = this._generateCode();
    const salt = await bcrypt.genSalt(8);
    const hash = await bcrypt.hash(code, salt);

    this.otpStore.set(email, {
      hash,
      expiresAt: Date.now() + this.OTP_EXPIRY_MS,
      attempts: 0,
    });

    const from = process.env.EMAIL_FROM || `Metro Buddy <${process.env.SMTP_USER}>`;

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Your Metro Buddy verification code',
        text: `Your Metro Buddy verification code is: ${code}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f5f5dc; border-radius: 16px;">
            <h2 style="color: #008080; text-align: center;">🚇 Metro Buddy</h2>
            <p style="color: #333; text-align: center;">Your verification code is:</p>
            <div style="background: #008080; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 20px; border-radius: 12px; margin: 24px 0;">
              ${code}
            </div>
            <p style="color: #666; font-size: 13px; text-align: center;">
              This code expires in <strong>5 minutes</strong>.<br/>
              Never share this code with anyone.
            </p>
          </div>
        `,
      });

      console.log(`[Nodemailer] ✅ OTP email sent to ${email}`);
      return { success: true, message: 'OTP sent to email successfully' };
    } catch (err) {
      console.error('[Nodemailer] ❌ Failed to send email:', err.message);
      return { success: false, message: 'Failed to send verification email. Please try again.' };
    }
  }

  async verifyOtp(email, code) {
    const entry = this.otpStore.get(email);

    if (!entry) {
      return { success: false, message: 'Invalid or expired verification code' };
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(email);
      return { success: false, message: 'Invalid or expired verification code' };
    }

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(email);
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    entry.attempts += 1;

    const isMatch = await bcrypt.compare(code, entry.hash);
    if (!isMatch) {
      return { success: false, message: 'Invalid or expired verification code' };
    }

    this.otpStore.delete(email);
    return { success: true };
  }
}

module.exports = NodemailerEmailProvider;
