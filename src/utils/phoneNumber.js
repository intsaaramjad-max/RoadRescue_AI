export const normalizePhoneNumber = (value) => {
  const input = String(value || '').trim();
  const compact = input.replace(/[\s()-]/g, '');

  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  if (/^00[1-9]\d{7,14}$/.test(compact)) return `+${compact.slice(2)}`;
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;
  if (/^3\d{9}$/.test(compact)) return `+92${compact}`;
  if (/^92\d{10}$/.test(compact)) return `+${compact}`;
  return null;
};
