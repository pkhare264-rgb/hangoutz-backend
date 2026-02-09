import crypto from 'crypto';
import twilio from 'twilio';

// Initialize Twilio client (optional - only if you want real SMS)
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS using Twilio
 * Falls back to console.log in development
 */
export const sendOTP = async (phone, otp) => {
  // In development or if Twilio not configured, just log it
  if (!twilioClient || process.env.NODE_ENV === 'development') {
    console.log(`📱 OTP for ${phone}: ${otp}`);
    console.log(`⚠️  In production, configure Twilio to send real SMS`);
    return { success: true, dev: true };
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your Hangoutz verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Generate OTP hash for storage (more secure than storing plain OTP)
 */
export const hashOTP = (otp) => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
};

/**
 * Verify OTP hash
 */
export const verifyOTPHash = (otp, hash) => {
  const otpHash = hashOTP(otp);
  return otpHash === hash;
};

/**
 * Get OTP expiry time (5 minutes from now)
 */
export const getOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000);
};
