// Firebase configuration and initialization
const admin = require('firebase-admin');
const path = require('path');

// Load credentials from environment variables
// For local development, use a .env file with FIREBASE_CONFIG pointing to your credentials file
// For production, set FIREBASE_CONFIG as an environment variable with the JSON content
let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  // Production: FIREBASE_CONFIG is JSON string
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (error) {
    console.error('Failed to parse FIREBASE_CONFIG environment variable:', error.message);
    process.exit(1);
  }
} else if (process.env.FIREBASE_CREDENTIALS_PATH) {
  // Local development: FIREBASE_CREDENTIALS_PATH points to service account file
  try {
    serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
  } catch (error) {
    console.error('Failed to load Firebase credentials from path:', error.message);
    console.log('Set FIREBASE_CREDENTIALS_PATH to your service account JSON file');
    process.exit(1);
  }
} else {
  console.error('Firebase credentials not configured.');
  console.error('Set either:');
  console.error('  1. FIREBASE_CONFIG environment variable with JSON credentials');
  console.error('  2. FIREBASE_CREDENTIALS_PATH environment variable pointing to credentials file');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'zeron-6b44c';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: projectId
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth
};
