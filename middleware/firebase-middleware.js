// backend/middleware/firebase-auth.js
// Middleware to verify Firebase ID tokens (ES6 Module)

import { verifyIdToken } from '../config/firebase-admin.js';

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Adds decoded token to req.firebaseUser
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verify token with Firebase
    const decodedToken = await verifyIdToken(token);

    // Attach decoded token to request
    req.firebaseUser = decodedToken;
    
    // Also attach phone number for convenience
    req.phoneNumber = decodedToken.phone_number;
    req.firebaseUid = decodedToken.uid;

    console.log(`✅ Firebase token verified for: ${decodedToken.phone_number}`);
    
    next();
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error.message);
    
    return res.status(401).json({ 
      error: error.message || 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Optional middleware - verify Firebase token if present, but don't require it
 * Useful for routes that work with or without authentication
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // No token, continue without auth
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (token) {
      const decodedToken = await verifyIdToken(token);
      req.firebaseUser = decodedToken;
      req.phoneNumber = decodedToken.phone_number;
      req.firebaseUid = decodedToken.uid;
    }

    next();
  } catch (error) {
    // Token invalid, but that's okay for optional auth
    console.warn('⚠️ Optional Firebase auth failed:', error.message);
    next();
  }
};