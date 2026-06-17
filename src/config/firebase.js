import "dotenv/config";
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) {
    return privateKey;
  }

  let key = privateKey.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  return key
    .split('\\n')
    .join('\n')
    .split('\\r')
    .join('\r')
    .trim();
};

const getFirebaseCredential = () => {
  // Preferred: full service account JSON from Firebase Console download
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

      if (serviceAccount.private_key) {
        serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
      }

      return cert(serviceAccount);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ' + e.message);
    }
  }

  // Fallback: Check if using base64-encoded private key (easier for Coolify)
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
      let privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
      
      // After decoding from Base64, convert escape sequences to actual newlines
      privateKey = privateKey.split('\\n').join('\n');
      privateKey = privateKey.split('\\r').join('\r');
      privateKey = privateKey.split('\\t').join('\t');
      
      return cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      });
    } catch (e) {
      throw new Error('Failed to decode FIREBASE_PRIVATE_KEY_BASE64: ' + e.message);
    }
  }

  // Legacy fallback: Parse plain text private key with escape sequences
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is empty');
    }

    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      throw new Error('FIREBASE_PRIVATE_KEY is not in valid PEM format');
    }

    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    });
  }

  throw new Error(
    'Missing Firebase configuration. Set FIREBASE_SERVICE_ACCOUNT_JSON (recommended). ' +
    'Download the JSON key from Firebase Console > Project Settings > Service Accounts.'
  );
};

const getFirebaseAuth = () => {
  if (!getApps().length) {
    initializeApp({
      credential: getFirebaseCredential()
    });
  }

  return getAuth();
};

export const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken) {
    throw new Error('Firebase idToken is required');
  }

  return getFirebaseAuth().verifyIdToken(idToken);
};
