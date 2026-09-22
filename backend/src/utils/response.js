export function safeUser(user) {
  if (!user) return null;
  const json = user.toJSON ? user.toJSON() : user;
  const { passwordHash, ...rest } = json;
  return rest;
}

export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function isValidWalletAddress(value = '') {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value).trim());
}

export function isLikelyTxHash(value = '') {
  return /^0x[a-fA-F0-9]{64}$/.test(String(value).trim());
}
