/**
 * Rate Limiter Middleware for OTP endpoints
 *
 * Two layers:
 * 1. Per-phone: max 3 OTP sends per 10 minutes
 * 2. Per-IP:    max 10 requests per 10 minutes
 *
 * Uses in-memory store by default. If REDIS_URL is set,
 * swap the store implementation to Redis (Upstash) for
 * production multi-instance deployments.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 10;

// ─── In-Memory Rate Store ─────────────────────────────────────
// { key: { count, windowStart } }
const store = new Map();

// Clean expired windows every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > WINDOW_MS) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkLimit(key, max) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    const retryAfterSec = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true, remaining: max - entry.count };
}

// ─── Middleware: Rate limit by phone number ───────────────────
function otpPhoneRateLimiter(req, res, next) {
  const phone = req.body?.phone;
  if (!phone) return next();

  const key = `otp_phone:${phone}`;
  const result = checkLimit(key, MAX_PER_PHONE);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many OTP requests for this number. Please try again later.',
      retryAfterSeconds: result.retryAfterSec,
    });
  }

  res.setHeader('X-RateLimit-Remaining-Phone', result.remaining);
  next();
}

// ─── Middleware: Rate limit by IP address ─────────────────────
function otpIpRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const key = `otp_ip:${ip}`;
  const result = checkLimit(key, MAX_PER_IP);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests from this IP address. Please try again later.',
      retryAfterSeconds: result.retryAfterSec,
    });
  }

  res.setHeader('X-RateLimit-Remaining-IP', result.remaining);
  next();
}

// ─── Combined middleware ──────────────────────────────────────
function otpRateLimiter(req, res, next) {
  // Check IP first, then phone
  otpIpRateLimiter(req, res, (err) => {
    if (err) return next(err);
    otpPhoneRateLimiter(req, res, next);
  });
}

module.exports = {
  otpRateLimiter,
  otpPhoneRateLimiter,
  otpIpRateLimiter,
};
