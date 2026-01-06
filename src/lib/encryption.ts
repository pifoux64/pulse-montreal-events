/**
 * Encryption utilities for sensitive data (Spotify tokens)
 * 
 * Uses AES encryption with a key from environment variables.
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SPOTIFY_CLIENT_SECRET;

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not configured. Tokens will not be encrypted.');
}

/**
 * Encrypts a string using AES encryption
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    // Fallback: return as-is if no key (for development)
    // In production, this should throw an error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be configured in production');
    }
    return text;
  }
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypts an encrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    // Fallback: return as-is if no key (for development)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be configured in production');
    }
    return encryptedText;
  }
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

