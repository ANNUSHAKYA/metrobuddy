class OtpProvider {
  /**
   * Send OTP code to a phone number (E.164 format)
   * @param {string} phoneNumber - e.g. "+919876543210"
   * @returns {Promise<{ success: boolean, message: string, mockOtp?: string }>}
   */
  async sendOtp(phoneNumber) {
    throw new Error('sendOtp method must be implemented by subclass');
  }

  /**
   * Verify an OTP code for a phone number
   * @param {string} phoneNumber - e.g. "+919876543210"
   * @param {string} code - e.g. "123456"
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async verifyOtp(phoneNumber, code) {
    throw new Error('verifyOtp method must be implemented by subclass');
  }
}

module.exports = OtpProvider;
