/**
 * EmailProvider — Abstract base class for email OTP delivery.
 * Mirrors OtpProvider so the same pattern works for both channels.
 *
 * All email providers MUST implement:
 *   sendOtp(email)           → Promise<{ success, message?, mockOtp? }>
 *   verifyOtp(email, code)   → Promise<{ success, message? }>
 */
class EmailProvider {
  async sendOtp(email) {
    throw new Error('EmailProvider.sendOtp() must be implemented by a subclass');
  }

  async verifyOtp(email, code) {
    throw new Error('EmailProvider.verifyOtp() must be implemented by a subclass');
  }
}

module.exports = EmailProvider;
