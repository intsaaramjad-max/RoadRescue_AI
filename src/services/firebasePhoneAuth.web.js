import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.config';

let firebaseAuth;

export const getFirebaseAuth = () => {
  if (Platform.OS !== 'web') {
    throw new Error('Firebase phone signup is currently available on Web only.');
  }
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Web configuration is missing. Configure the EXPO_PUBLIC_FIREBASE_* variables.');
  }

  const app = getApps().find((candidate) => (
    candidate.options.projectId === firebaseConfig.projectId
  )) || initializeApp(firebaseConfig);
  firebaseAuth = firebaseAuth || getAuth(app);
  return firebaseAuth;
};

export const createPhoneRecaptcha = (containerId, onExpired) => {
  const verifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: 'normal',
    callback: () => {},
    'expired-callback': onExpired,
  });
  return verifier;
};

export const requestPhoneCode = async (phoneNumber, verifier) => {
  const normalized = String(phoneNumber || '').replace(/[\s()-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error('Enter a valid phone number in international format, for example +923001234567.');
  }
  if (!verifier) throw new Error('Complete the reCAPTCHA check before requesting a code.');
  return signInWithPhoneNumber(getFirebaseAuth(), normalized, verifier);
};

export const getVerifiedPhoneIdToken = async (confirmation, code) => {
  const normalizedCode = String(code || '').trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new Error('Enter the six-digit verification code.');
  }
  const result = await confirmation.confirm(normalizedCode);
  return result.user.getIdToken();
};

export const getFirebasePhoneErrorMessage = (error) => {
  const messages = {
    'auth/invalid-phone-number': 'Enter a valid phone number with country code.',
    'auth/invalid-verification-code': 'That verification code is incorrect. Check it and try again.',
    'auth/code-expired': 'That verification code has expired. Request a new code.',
    'auth/session-expired': 'The verification session expired. Request a new code.',
    'auth/too-many-requests': 'Too many attempts. Wait a while before trying again.',
    'auth/quota-exceeded': 'SMS quota has been reached. Try again later or contact the app administrator.',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Complete the check and try again.',
    'auth/missing-phone-number': 'Enter a phone number before requesting a code.',
    'auth/operation-not-allowed': 'Phone sign-in is not enabled for this Firebase project.',
    'auth/app-not-authorized': 'This Web app is not authorized in Firebase Authentication settings.',
  };
  return messages[error?.code] || error?.message || 'Phone verification failed. Please try again.';
};
