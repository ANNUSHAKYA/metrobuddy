const OtpProvider = require('./OtpProvider');

/**
 * Twilio Verify OTP Provider
 * Best for international phone numbers — wide global coverage.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID          — Your Twilio Account SID
 *   TWILIO_AUTH_TOKEN            — Your Twilio Auth Token
 *   TWILIO_VERIFY_SERVICE_SID   — Verify Service SID from Twilio console
 *
 * API Docs: https://www.twilio.com/docs/verify/api
 */
class TwilioOtpProvider extends OtpProvider {
  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!this.accountSid || !this.authToken || !this.serviceSid) {
      console.warn(
        '⚠️  Twilio credentials not fully set. ' +
        'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in .env.'
      );
    }
  }

  async sendOtp(phoneNumber) {
    // TODO: Implement real Twilio Verify API call
    // Endpoint: POST https://verify.twilio.com/v2/Services/{ServiceSid}/Verifications
    // Auth: Basic (accountSid:authToken)
    // Body: { To: phoneNumber, Channel: 'sms' }
    //
    // Example using fetch:
    // const url = `https://verify.twilio.com/v2/Services/${this.serviceSid}/Verifications`;
    // const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': `Basic ${credentials}`,
    //   },
    //   body: new URLSearchParams({ To: phoneNumber, Channel: 'sms' }),
    // });
    // const data = await response.json();
    // if (data.status === 'pending') {
    //   return { success: true, message: 'OTP sent via Twilio' };
    // }
    // return { success: false, message: data.message || 'Failed to send OTP' };

    throw new Error(
      'Twilio provider is not yet configured. ' +
      'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in your .env file.'
    );
  }

  async verifyOtp(phoneNumber, code) {
    // TODO: Implement real Twilio Verify check
    // Endpoint: POST https://verify.twilio.com/v2/Services/{ServiceSid}/VerificationCheck
    // Auth: Basic (accountSid:authToken)
    // Body: { To: phoneNumber, Code: code }
    //
    // Example using fetch:
    // const url = `https://verify.twilio.com/v2/Services/${this.serviceSid}/VerificationCheck`;
    // const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': `Basic ${credentials}`,
    //   },
    //   body: new URLSearchParams({ To: phoneNumber, Code: code }),
    // });
    // const data = await response.json();
    // if (data.status === 'approved') {
    //   return { success: true };
    // }
    // return { success: false, message: 'Invalid or expired verification code' };

    throw new Error(
      'Twilio provider is not yet configured. ' +
      'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in your .env file.'
    );
  }
}

module.exports = TwilioOtpProvider;
