import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

/* =========================
   PHONE NORMALIZATION
   ========================= */
const normalizePhone = (phone) => {
  if (!phone) return phone;

  phone = phone.trim();

  // If already starts with +91
  if (phone.startsWith('+91')) return phone;

  // If 10 digit Indian number
  if (/^\d{10}$/.test(phone)) return `+91${phone}`;

  return phone;
};

/* =========================
   CLEANUP EXPIRED OTPS
   ========================= */
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
    }
  }
}, 5 * 60 * 1000);

/* =========================
   SEND OTP
   ========================= */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhone(phone);

    // Strict Indian format check
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        error: 'Invalid phone format. Use 10 digit number or +91XXXXXXXXXX'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(normalizedPhone, {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 OTP for ${normalizedPhone}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/* =========================
   VERIFY OTP
   ========================= */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    if (typeof otp !== 'string' || otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const normalizedPhone = normalizePhone(phone);
    const storedData = otpStore.get(normalizedPhone);

    if (!storedData) {
      return res.status(400).json({
        error: 'OTP expired or not found. Request new OTP.'
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({
        error: 'OTP has expired. Request new OTP.'
      });
    }

    if (storedData.attempts >= 3) {
      otpStore.delete(normalizedPhone);
      return res.status(429).json({
        error: 'Too many failed attempts. Request new OTP.'
      });
    }

    if (storedData.code !== otp) {
      storedData.attempts++;
      return res.status(400).json({
        error: 'Invalid OTP',
        attemptsLeft: 3 - storedData.attempts
      });
    }

    // OTP verified
    otpStore.delete(normalizedPhone);

    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        phone: normalizedPhone,
        name: '',
        dob: '',
        gender: 'Male',
        bio: '',
        photoURL: '',
        photos: [],
        interests: [],
        verified: false,
        trustScore: 50,
        joinedEvents: [],
        createdAt: new Date().toISOString()
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        photoURL: user.photoURL,
        verified: user.verified,
        trustScore: user.trustScore,
        isNewUser: isNewUser || !user.name || !user.dob
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

/* =========================
   GET CURRENT USER
   ========================= */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
