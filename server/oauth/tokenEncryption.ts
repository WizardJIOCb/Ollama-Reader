import crypto from 'crypto';
import { getConfig } from '../config/oauth';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES-256-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes authentication tag

/**
 * Encrypts a token using AES-256-GCM
 * @param token The plain text token to encrypt
 * @returns Encrypted token in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  const config = getConfig();
  const key = Buffer.from(config.encryptionKey, 'hex');
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the token
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a token that was encrypted with encryptToken
 * @param encryptedToken The encrypted token in format: iv:authTag:encryptedData
 * @returns The decrypted plain text token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error('Encrypted token cannot be empty');
  }

  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedData] = parts;
  
  const config = getConfig();
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt the token
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Safely encrypts a token, returning null if token is null/undefined
 */
export function safeEncryptToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return encryptToken(token);
}

/**
 * Safely decrypts a token, returning null if encrypted token is null/undefined
 */
export function safeDecryptToken(encryptedToken: string | null | undefined): string | null {
  if (!encryptedToken) return null;
  try {
    return decryptToken(encryptedToken);
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return null;
  }
}
