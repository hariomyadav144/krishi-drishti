const crypto = require('crypto');
const axios = require('axios');

/**
 * In-memory OTP Cache with automatic TTL expiration
 * Key: normalized 10-digit phone
 * Value: {
 *   otp: string,
 *   otpHash: string,
 *   expiresAt: number,
 *   attempts: number,
 *   maxAttempts: number,
 *   lastSentAt: number,
 *   verified: boolean,
 *   resetToken?: string,
 *   resetTokenExpiresAt?: number
 * }
 */
const otpStore = new Map();

// Configuration Constants
const OTP_EXPIRY_MS = 10 * 60 * 1000;       // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;        // 60 seconds cooldown
const MAX_VERIFY_ATTEMPTS = 5;               // Max 5 attempts
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes to reset password

// Clean expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (record.resetTokenExpiresAt && record.resetTokenExpiresAt < now) {
      otpStore.delete(phone);
    } else if (!record.verified && record.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 5 * 60 * 1000);

/**
 * Normalizes 10-digit mobile number
 */
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.substring(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.substring(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Hashes an OTP with SHA-256 for secure in-memory comparison
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generate secure random token
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send OTP to user phone number
 * Enforces rate limiting, cooldown, and handles SMS dispatch
 */
async function sendOtp(phone) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    const err = new Error('Please provide a valid 10-digit mobile number.');
    err.code = 'INVALID_PHONE';
    throw err;
  }

  const now = Date.now();
  const existing = otpStore.get(cleanPhone);

  // Check resend cooldown
  if (existing && (now - existing.lastSentAt) < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    const err = new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
    err.code = 'COOLDOWN_ACTIVE';
    err.remainingSeconds = remainingSeconds;
    throw err;
  }

  const otp = generateSecureOtp();
  const otpHash = hashOtp(otp);

  otpStore.set(cleanPhone, {
    otpHash,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    maxAttempts: MAX_VERIFY_ATTEMPTS,
    lastSentAt: now,
    verified: false,
  });

  // Log clearly in server console for local testing and debugging
  console.log(`====================================================`);
  console.log(`📱 [Fasal Drishti OTP Service]`);
  console.log(`📞 Mobile Number: +91-${cleanPhone}`);
  console.log(`🔑 Verification OTP: ${otp}`);
  console.log(`⏱️  Valid for: 10 minutes (Expires: ${new Date(now + OTP_EXPIRY_MS).toLocaleTimeString()})`);
  console.log(`====================================================`);

  // Dispatches external SMS if provider credentials exist in environment
  try {
    if (process.env.FAST2SMS_API_KEY) {
      await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        variables_values: otp,
        route: 'otp',
        numbers: cleanPhone,
      }, {
        headers: { authorization: process.env.FAST2SMS_API_KEY },
        timeout: 5000,
      });
      console.log(`[OTP Service] Fast2SMS dispatched successfully to ${cleanPhone}`);
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: `+91${cleanPhone}`,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: `Your Fasal Drishti password reset verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 5000,
        }
      );
      console.log(`[OTP Service] Twilio SMS dispatched successfully to ${cleanPhone}`);
    }
  } catch (smsErr) {
    console.warn('[OTP Service] SMS Gateway note (falling back to server log):', smsErr.message);
  }

  return {
    success: true,
    message: 'OTP sent successfully to registered mobile number.',
    cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  };
}

/**
 * Verify OTP entered by user
 */
function verifyOtp(phone, enteredOtp) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    return { success: false, code: 'INVALID_PHONE', message: 'Please provide a valid phone number.' };
  }

  const record = otpStore.get(cleanPhone);
  if (!record) {
    return { success: false, code: 'NO_OTP_REQUESTED', message: 'No OTP requested for this number. Please request a new OTP.' };
  }

  const now = Date.now();
  if (record.expiresAt < now) {
    otpStore.delete(cleanPhone);
    return { success: false, code: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.attempts >= record.maxAttempts) {
    otpStore.delete(cleanPhone);
    return { success: false, code: 'MAX_ATTEMPTS_EXCEEDED', message: 'Maximum attempts exceeded. Please request a new OTP.' };
  }

  const enteredHash = hashOtp(String(enteredOtp).trim());
  if (enteredHash !== record.otpHash) {
    record.attempts += 1;
    const remaining = record.maxAttempts - record.attempts;
    return {
      success: false,
      code: 'INVALID_OTP',
      message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // OTP verified successfully!
  const resetToken = generateSecureToken();
  record.verified = true;
  record.resetToken = resetToken;
  record.resetTokenExpiresAt = now + RESET_TOKEN_EXPIRY_MS;

  return {
    success: true,
    code: 'OTP_VERIFIED',
    message: 'OTP verified successfully.',
    resetToken,
  };
}

/**
 * Verify password reset token
 */
function verifyResetToken(phone, resetToken) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !resetToken) return false;

  const record = otpStore.get(cleanPhone);
  if (!record || !record.verified) return false;

  const now = Date.now();
  if (!record.resetTokenExpiresAt || record.resetTokenExpiresAt < now) {
    otpStore.delete(cleanPhone);
    return false;
  }

  return record.resetToken === resetToken;
}

/**
 * Invalidate OTP record once password has been successfully reset
 */
function clearOtp(phone) {
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone) {
    otpStore.delete(cleanPhone);
  }
}

module.exports = {
  normalizePhone,
  sendOtp,
  verifyOtp,
  verifyResetToken,
  clearOtp,
};
