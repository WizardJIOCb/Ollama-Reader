import crypto from 'crypto';
import { getProviderConfig } from '../../config/oauth';
import type { TelegramConfig } from '../../config/oauth';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies Telegram Login Widget data
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  const config = getProviderConfig('telegram') as TelegramConfig;
  const { hash, ...dataToCheck } = authData;

  // Create data check string
  const dataCheckArr = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key as keyof typeof dataToCheck]}`);
  const dataCheckString = dataCheckArr.join('\n');

  // Create secret key from bot token
  const secretKey = crypto
    .createHash('sha256')
    .update(config.botToken)
    .digest();

  // Calculate hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Compare hashes
  if (calculatedHash !== hash) {
    return false;
  }

  // Check auth date (must be within 24 hours)
  const currentTime = Math.floor(Date.now() / 1000);
  const authAge = currentTime - authData.auth_date;
  
  if (authAge > 86400) {
    // 24 hours in seconds
    return false;
  }

  return true;
}

export function getTelegramUserInfo(authData: TelegramAuthData) {
  return {
    id: authData.id.toString(),
    firstName: authData.first_name,
    lastName: authData.last_name,
    username: authData.username,
    photoUrl: authData.photo_url,
  };
}
