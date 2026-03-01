// backend/routes/firebase-auth.js
// Firebase Phone Authentication Routes (ES6 Module)

import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyIdToken, revokeRefreshTokens, deleteFirebaseUser, healthCheck } from '../config/firebase-admin.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/firebase-auth/verify
 * 
 * Exchange Firebase ID token for app JWT
 * 
 * Flow:
 * 1. Client sends Firebase ID token
 * 2. Backend verifies token with Firebase
 * 3. Find or create user in MongoDB
 * 4. Issue app JWT
 * 5. Return JWT + user data
 */
router.post('/verify', async (req, res) => {
  try {
    const { firebaseToken, name, dob, gender, photoURL } = req.body;

    // Validate request
    if (!firebaseToken) {
      return res.status(400).json({ 
        error: 'Firebase token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Step 1: Verify Firebase ID token
    console.log('🔐 Verifying Firebase token...');
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(firebaseToken);
    } catch (error) {
      return res.status(401).json({ 
        error: error.message,
        code: 'INVALID_FIREBASE_TOKEN'
      });
    }

    const phoneNumber = decodedToken.phone_number;
    const firebaseUid = decodedToken.uid;

    console.log(`✅ Token verified for phone: ${phoneNumber}`);

    // Step 2: Find or create user in MongoDB
    let user = await User.findOne({ phone: phoneNumber });

    if (!user) {
      // New user - check if required fields provided
      if (!name) {
        return res.status(400).json({ 
          error: 'New user requires: name',
          code: 'PROFILE_INCOMPLETE',
          isNewUser: true
        });
      }

      // Create new user
      user = await User.create({
        phone: phoneNumber,
        firebaseUid: firebaseUid,
        name,
        dob: dob || '',
        gender: gender || '',
        photoURL: photoURL || '',
        completedProfile: !!(name && dob && gender),
        verified: false,
        trustScore: 50,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      console.log(`✅ Created new user: ${user._id} (${phoneNumber})`);
    } else {
      // Existing user - update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      console.log(`✅ Existing user logged in: ${user._id} (${phoneNumber})`);
    }

    // Step 3: Generate app JWT
    const jwtPayload = {
      userId: user._id.toString(),
      phone: user.phone,
      firebaseUid: user.firebaseUid
    };

    const jwtToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '30d', // App JWT expires in 30 days
        issuer: 'hangoutz-backend'
      }
    );

    // Step 4: Return response
    const response = {
      token: jwtToken,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        photoURL: user.photoURL,
        verified: user.verified,
        trustScore: user.trustScore,
        completedProfile: user.completedProfile,
        dob: user.dob,
        gender: user.gender
      },
      isNewUser: !user.lastLogin || user.createdAt.getTime() === user.lastLogin.getTime()
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Firebase auth error:', error);
    
    res.status(500).json({ 
      error: 'Authentication failed. Please try again.',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/firebase-auth/refresh
 * 
 * Refresh app JWT using Firebase token
 * Use this if app JWT expires but Firebase session is still valid
 */
router.post('/refresh', async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ 
        error: 'Firebase token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(firebaseToken);
    const phoneNumber = decodedToken.phone_number;

    // Find user
    const user = await User.findOne({ phone: phoneNumber });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate new JWT
    const jwtPayload = {
      userId: user._id.toString(),
      phone: user.phone,
      firebaseUid: user.firebaseUid
    };

    const jwtToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '30d',
        issuer: 'hangoutz-backend'
      }
    );

    res.status(200).json({
      token: jwtToken,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        photoURL: user.photoURL,
        verified: user.verified,
        trustScore: user.trustScore,
        completedProfile: user.completedProfile
      }
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    
    res.status(500).json({ 
      error: 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
});

/**
 * POST /api/firebase-auth/logout
 * 
 * Revoke Firebase refresh tokens (force logout on all devices)
 */
router.post('/logout', async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ 
        error: 'Firebase token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token to get UID
    const decodedToken = await verifyIdToken(firebaseToken);
    
    // Revoke all refresh tokens
    await revokeRefreshTokens(decodedToken.uid);

    res.status(200).json({ 
      message: 'Logged out successfully',
      success: true
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

/**
 * DELETE /api/firebase-auth/delete-account
 * 
 * Delete user account from both MongoDB and Firebase
 */
router.delete('/delete-account', async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ 
        error: 'Firebase token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const decodedToken = await verifyIdToken(firebaseToken);
    const phoneNumber = decodedToken.phone_number;
    const firebaseUid = decodedToken.uid;

    // Delete from MongoDB
    const user = await User.findOneAndDelete({ phone: phoneNumber });

    if (!user) {
      console.warn(`⚠️ User not found in MongoDB: ${phoneNumber}`);
    } else {
      console.log(`🗑️ Deleted user from MongoDB: ${user._id}`);
    }

    // Delete from Firebase
    await deleteFirebaseUser(firebaseUid);

    res.status(200).json({ 
      message: 'Account deleted successfully',
      success: true
    });
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    
    res.status(500).json({ 
      error: 'Failed to delete account',
      code: 'DELETE_FAILED'
    });
  }
});

/**
 * GET /api/firebase-auth/health
 * 
 * Health check for Firebase authentication
 */
router.get('/health', async (req, res) => {
  try {
    const firebaseHealth = await healthCheck();

    res.status(200).json({
      status: 'healthy',
      firebase: firebaseHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;