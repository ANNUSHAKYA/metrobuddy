const MockEmailProvider = require('./MockEmailProvider');
const NodemailerEmailProvider = require('./NodemailerEmailProvider');

let providerInstance = null;

/**
 * Factory: Returns the active Email OTP provider based on EMAIL_PROVIDER env var.
 * Defaults to 'mock' — $0 cost, OTP printed to console + dev banner.
 *
 * Set EMAIL_PROVIDER=nodemailer to switch to real SMTP email.
 */
function getEmailProvider() {
  if (providerInstance) return providerInstance;

  const providerName = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

  switch (providerName) {
    case 'nodemailer':
      console.log('📧 Email Provider: Nodemailer SMTP (Live email)');
      providerInstance = new NodemailerEmailProvider();
      break;
    case 'mock':
    default:
      console.log('📧 Email Provider: Mock ($0 cost — dev/test mode)');
      providerInstance = new MockEmailProvider();
      break;
  }

  return providerInstance;
}

module.exports = { getEmailProvider };
