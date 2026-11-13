const webOnlyError = () => new Error('Firebase phone signup is currently available on Web only.');

export const getFirebaseAuth = () => {
  throw webOnlyError();
};

export const createPhoneRecaptcha = () => {
  throw webOnlyError();
};

export const requestPhoneCode = async () => {
  throw webOnlyError();
};

export const getVerifiedPhoneIdToken = async () => {
  throw webOnlyError();
};

export const getFirebasePhoneErrorMessage = (error) => (
  error?.message || 'Firebase phone signup is currently available on Web only.'
);
