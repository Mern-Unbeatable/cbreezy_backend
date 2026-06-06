import "dotenv/config";
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL'
];

const getFirebaseCredential = () => {
  // Check if using service account JSON (preferred method)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
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
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is empty');
    }

    privateKey = privateKey.trim();

    // Handle quotes
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1).trim();
    }
    
    // Convert escape sequences to actual newlines
    privateKey = privateKey.split('\\n').join('\n');
    privateKey = privateKey.split('\\r').join('\r');
    privateKey = privateKey.split('\\t').join('\t');
    
    privateKey = privateKey.trim();
    
    // Validate
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      throw new Error('FIREBASE_PRIVATE_KEY is not in valid PEM format');
    }

    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    });
  }

  const missingEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 
    '(FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PRIVATE_KEY_BASE64 or FIREBASE_PRIVATE_KEY)'];
  throw new Error(`Missing Firebase configuration: ${missingEnvVars.join(', ')}`);
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
