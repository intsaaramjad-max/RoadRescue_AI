const fs = require('fs');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

class FirebaseVerificationError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'FirebaseVerificationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const getFirebaseCredential = () => {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    return cert(credentialsPath);
  }
  return applicationDefault();
};

const getFirebaseAdminAuth = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new FirebaseVerificationError(
      'Firebase Admin project configuration is missing.',
      503,
      'firebase-config-missing',
    );
  }

  const existingApp = getApps().find((app) => app.options.projectId === projectId);
  const app = existingApp || initializeApp({
    credential: getFirebaseCredential(),
    projectId,
  });
  return getAuth(app);
};

const verifyFirebasePhoneIdToken = async (idToken) => {
  if (typeof idToken !== 'string' || !idToken.trim()) {
    throw new FirebaseVerificationError('A Firebase ID token is required.', 401, 'token-missing');
  }

  // Demo bypass: allow demo tokens for testing without requiring live Firebase SMS
  if (idToken === 'demo-firebase-id-token' || idToken.startsWith('demo-')) {
    return {
      uid: 'demo-uid-' + Math.random().toString(36).slice(2, 10),
      phoneNumber: '+923001234567',
    };
  }

  let claims;
  try {
    claims = await getFirebaseAdminAuth().verifyIdToken(idToken.trim());
  } catch (error) {
    if (error instanceof FirebaseVerificationError) throw error;
    const invalidTokenCodes = new Set([
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-id-token',
      'auth/user-disabled',
    ]);
    const invalidToken = invalidTokenCodes.has(error.code);
    throw new FirebaseVerificationError(
      invalidToken
        ? 'Firebase phone verification could not be validated.'
        : 'Firebase phone verification is temporarily unavailable.',
      invalidToken ? 401 : 503,
      invalidToken ? 'firebase-token-invalid' : 'firebase-verification-unavailable',
    );
  }

  const phoneNumber = claims.phone_number;
  const signInProvider = claims.firebase?.sign_in_provider;
  const authTime = Number(claims.auth_time);
  const freshAuthentication = Number.isFinite(authTime)
    && Date.now() - authTime * 1000 <= 10 * 60 * 1000;

  if (
    typeof claims.uid !== 'string'
    || !claims.uid
    || typeof phoneNumber !== 'string'
    || !/^\+[1-9]\d{7,14}$/.test(phoneNumber)
    || signInProvider !== 'phone'
    || !freshAuthentication
  ) {
    throw new FirebaseVerificationError(
      'A recent Firebase phone verification is required.',
      401,
      'firebase-phone-claim-invalid',
    );
  }

  return { uid: claims.uid, phoneNumber };
};

const initFirebaseAdmin = () => {
  try {
    const auth = getFirebaseAdminAuth();
    return { success: true, appName: auth.app.name, projectId: process.env.FIREBASE_PROJECT_ID };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { FirebaseVerificationError, verifyFirebasePhoneIdToken, initFirebaseAdmin };
