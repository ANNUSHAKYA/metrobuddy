const MockOtpProvider = require('./MockOtpProvider');
const Msg91OtpProvider = require('./Msg91OtpProvider');
const TwilioOtpProvider = require('./TwilioOtpProvider');

let providerInstance = null;

/**
 * Factory: Returns the active OTP provider based on OTP_PROVIDER env var.
 * Defaults to 'mock' — $0 cost, fully functional for dev/testing.
 *
 * Set OTP_PROVIDER=msg91 or OTP_PROVIDER=twilio to switch to real SMS.
 */
function getOtpProvider() {
  if (providerInstance) return providerInstance;

  const providerName = (process.env.OTP_PROVIDER || 'mock').toLowerCase();

  switch (providerName) {
    case 'msg91':
      console.log('📱 OTP Provider: MSG91 (Live SMS)');
      providerInstance = new Msg91OtpProvider();
      break;
    case 'twilio':
      console.log('📱 OTP Provider: Twilio Verify (Live SMS)');
      providerInstance = new TwilioOtpProvider();
      break;
    case 'mock':
    default:
      console.log('📱 OTP Provider: Mock ($0 cost — dev/test mode)');
      providerInstance = new MockOtpProvider();
      break;
  }

  return providerInstance;
}

module.exports = { getOtpProvider };
