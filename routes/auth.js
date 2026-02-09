import express from 'express';
import User from '../models/User.js'; // Note the .js extension

const router = express.Router();

// 1. Send OTP (Mock version)
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  console.log(`Received OTP request for ${phone}`);
  res.json({ success: true, message: "OTP sent (Use 123456)" });
});

// 2. Verify OTP & Login
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (otp !== "123456") {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  try {
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    res.json({
      token: "fake-jwt-token-placeholder",
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;