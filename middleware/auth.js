import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect — Verify JWT and attach req.user from MongoDB.
 * Rejects unauthenticated requests with 401.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    req.userId = decoded.userId;
    req.userPhone = decoded.phone;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }

    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/**
 * optionalAuth — Same as protect but does NOT reject unauthenticated requests.
 * If valid token is present, attaches req.user. Otherwise continues without it.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      req.userId = decoded.userId;
      req.userPhone = decoded.phone;
    }
  } catch {
    // Token invalid or expired — continue without auth
  }

  next();
};

/**
 * verifyToken — Lightweight JWT verification (no DB lookup).
 * Kept for backward compatibility.
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.userPhone = decoded.phone;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.status(401).json({ error: 'Invalid token' });
  }
};