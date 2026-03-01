// backend/config/firebase-admin.js
// Firebase Admin SDK Configuration (ES6 Module)

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for production security
 */
export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Use environment variables when available (works in any NODE_ENV)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CERT_URL
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('✅ Firebase Admin initialized with environment variables');
    }
    // Fallback: Use service account JSON file
    else {
      const serviceAccountPath = join(__dirname, '..', 'firebase-service-account.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      console.log('✅ Firebase Admin initialized with service account file');
    }

    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<admin.auth.DecodedIdToken>} - Decoded token with user info
 */
export async function verifyIdToken(idToken) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Additional security checks
    if (!decodedToken.phone_number) {
      throw new Error('Token does not contain phone number');
    }

    // Check if token is recent (optional: reject tokens older than 5 minutes)
    const tokenAge = Date.now() / 1000 - decodedToken.iat;
    if (tokenAge > 300) { // 5 minutes
      console.warn('⚠️ Token is older than 5 minutes');
    }

    return decodedToken;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);

    // Provide specific error messages
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Authentication token has expired. Please login again.');
    } else if (error.code === 'auth/id-token-revoked') {
      throw new Error('Authentication token has been revoked. Please login again.');
    } else if (error.code === 'auth/invalid-id-token') {
      throw new Error('Invalid authentication token.');
    } else {
      throw new Error('Failed to verify authentication token.');
    }
  }
}

/**
 * Get user by phone number
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {Promise<admin.auth.UserRecord>} - Firebase user record
 */
export async function getUserByPhoneNumber(phoneNumber) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete user from Firebase
 * @param {string} uid - Firebase user UID
 */
export async function deleteFirebaseUser(uid) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    await admin.auth().deleteUser(uid);
    console.log(`🗑️ Deleted Firebase user: ${uid}`);
  } catch (error) {
    console.error('❌ Failed to delete Firebase user:', error.message);
    throw error;
  }
}

/**
 * Revoke all refresh tokens for a user (force logout)
 * @param {string} uid - Firebase user UID
 */
export async function revokeRefreshTokens(uid) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    await admin.auth().revokeRefreshTokens(uid);
    console.log(`🔒 Revoked refresh tokens for user: ${uid}`);
  } catch (error) {
    console.error('❌ Failed to revoke tokens:', error.message);
    throw error;
  }
}

/**
 * Health check - verify Firebase Admin is working
 */
export async function healthCheck() {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    // Try to list users (limit 1) to verify connection
    await admin.auth().listUsers(1);
    return { status: 'healthy', service: 'firebase-admin' };
  } catch (error) {
    return { status: 'unhealthy', service: 'firebase-admin', error: error.message };
  }
}

// Export admin for advanced usage
export { admin };