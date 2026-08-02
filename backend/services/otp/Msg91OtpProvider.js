const OtpProvider = require('./OtpProvider');

/**
 * MSG91 OTP Provider
 * Best for Indian phone numbers — cheapest SMS rates for +91.
 *
 * Required environment variables:
 *   MSG91_API_KEY       — Your MSG91 API key
 *   MSG91_SENDER_ID     — Approved sender ID (6 chars)
 *   MSG91_TEMPLATE_ID   — OTP template ID from MSG91 dashboard
 *
 * API Docs: https://docs.msg91.com/reference/send-otp
 */
class Msg91OtpProvider extends OtpProvider {
  constructor() {
    super();
    this.apiKey = process.env.MSG91_API_KEY;
    this.senderId = process.env.MSG91_SENDER_ID || 'METBDY';
    this.templateId = process.env.MSG91_TEMPLATE_ID;

    if (!this.apiKey) {
      console.warn('⚠️  MSG91_API_KEY is not set. MSG91 provider will fail on real requests.');
    }
  }

  async sendOtp(phoneNumber) {
    // TODO: Implement real MSG91 API call
    // Endpoint: POST https://control.msg91.com/api/v5/otp
    // Headers: { authkey: this.apiKey }
    // Body: {
    //   template_id: this.templateId,
    //   mobile: phoneNumber.replace('+', ''),
    //   sender: this.senderId,
    //   otp_length: 6,
    //   otp_expiry: 5  // minutes
    // }
    //
    // Example using fetch:
    // const response = await fetch('https://control.msg91.com/api/v5/otp', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'authkey': this.apiKey,
    //   },
    //   body: JSON.stringify({
    //     template_id: this.templateId,
    //     mobile: phoneNumber.replace('+', ''),
    //     sender: this.senderId,
    //     otp_length: 6,
    //     otp_expiry: 5,
    //   }),
    // });
    // const data = await response.json();
    // if (data.type === 'success') {
    //   return { success: true, message: 'OTP sent via MSG91' };
    // }
    // return { success: false, message: data.message || 'Failed to send OTP' };

    throw new Error(
      'MSG91 provider is not yet configured. ' +
      'Set MSG91_API_KEY, MSG91_SENDER_ID, and MSG91_TEMPLATE_ID in your .env file.'
    );
  }

  async verifyOtp(phoneNumber, code) {
    // TODO: Implement real MSG91 verify API call
    // Endpoint: POST https://control.msg91.com/api/v5/otp/verify
    // Headers: { authkey: this.apiKey }
    // Params: { mobile: phoneNumber.replace('+', ''), otp: code }
    //
    // Example using fetch:
    // const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${phoneNumber.replace('+','')}&otp=${code}`;
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: { 'authkey': this.apiKey },
    // });
    // const data = await response.json();
    // if (data.type === 'success') {
    //   return { success: true };
    // }
    // return { success: false, message: 'Invalid or expired verification code' };

    throw new Error(
      'MSG91 provider is not yet configured. ' +
      'Set MSG91_API_KEY in your .env file.'
    );
  }
}

module.exports = Msg91OtpProvider;
