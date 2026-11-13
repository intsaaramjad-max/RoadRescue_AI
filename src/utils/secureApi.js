import { API_URL } from '../config/api.config';

export const assertSecureWebApi = () => {
  let api;
  try {
    api = new URL(API_URL);
  } catch {
    throw new Error('Configure a valid backend API URL before continuing.');
  }

  const localHosts = ['localhost', '127.0.0.1', '[::1]'];
  const localWebOrigin = typeof window !== 'undefined'
    && localHosts.includes(window.location.hostname);
  const localApi = localHosts.includes(api.hostname);
  if (api.protocol !== 'https:' && !(localWebOrigin && localApi)) {
    throw new Error('Configure an HTTPS backend API URL before sending Firebase credentials.');
  }
};
