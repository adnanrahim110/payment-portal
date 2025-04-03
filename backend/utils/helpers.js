import crypto from 'crypto';

// Generate a secure, complex ID for payment links
export const generateSecureId = () => {
  // Generate 16 bytes of random data and convert to a hex string
  return crypto.randomBytes(16).toString('hex');
};
