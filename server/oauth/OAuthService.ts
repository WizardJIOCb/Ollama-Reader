import { storage } from '../storage';
import { encryptToken, safeEncryptToken } from './tokenEncryption';
import type { OAuthProvider } from '../config/oauth';
import bcrypt from 'bcrypt';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface OAuthUserData {
  provider: OAuthProvider;
  providerUserId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  language?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export class OAuthService {
  /**
   * Downloads avatar from URL and saves it to uploads directory
   */
  private async downloadAndSaveAvatar(avatarUrl: string, userId: string): Promise<string | null> {
    try {
      console.log('[OAuth] Downloading avatar from:', avatarUrl);
      
      // Download the image
      const response = await axios.get(avatarUrl, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
      });
      
      // Determine file extension from content type
      const contentType = response.headers['content-type'];
      let ext = '.jpg'; // default
      if (contentType?.includes('png')) ext = '.png';
      else if (contentType?.includes('gif')) ext = '.gif';
      else if (contentType?.includes('webp')) ext = '.webp';
      
      // Create unique filename
      const filename = `avatar_${userId}_${Date.now()}${ext}`;
      const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
      const filePath = path.join(uploadsDir, filename);
      
      // Ensure uploads directory exists
      await mkdir(uploadsDir, { recursive: true });
      
      // Save file
      await writeFile(filePath, response.data);
      
      // Return URL path
      const avatarPath = `/uploads/avatars/${filename}`;
      console.log('[OAuth] ✅ Avatar saved to:', avatarPath);
      return avatarPath;
    } catch (error) {
      console.error('[OAuth] Failed to download avatar:', error);
      return null;
    }
  }

  /**
   * Handles OAuth callback and creates/links user account
   */
  async handleOAuthCallback(userData: OAuthUserData) {
    const { provider, providerUserId, email, displayName, avatarUrl, language, accessToken, refreshToken, tokenExpiresAt } = userData;

    // Check if OAuth account already exists
    const existingOAuthAccount = await storage.getOAuthAccount(provider, providerUserId);

    if (existingOAuthAccount) {
      // Update tokens
      await storage.updateOAuthTokens(
        existingOAuthAccount.id,
        encryptToken(accessToken),
        refreshToken ? encryptToken(refreshToken) : undefined,
        tokenExpiresAt
      );

      // Get user
      const user = await storage.getUser(existingOAuthAccount.userId);
      return { user, isNewUser: false };
    }

    // Check if user exists with this email (for auto-linking)
    let user = null;
    if (email) {
      user = await storage.getUserByOAuthEmail(email);
    }

    // Create new user if no existing user found
    let isNewUser = false;
    if (!user) {
      // Generate a random password (user won't use it, but it's required by schema)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      
      // Create username from email or display name
      let username = email ? email.split('@')[0] : displayName || `${provider}_${providerUserId}`;
      
      // Ensure username is unique (case-insensitive check)
      let uniqueUsername = username;
      let counter = 1;
      while (await storage.getUserByUsernameCaseInsensitive(uniqueUsername)) {
        uniqueUsername = `${username}_${counter}`;
        counter++;
      }

      // Download and save avatar if provided
      let savedAvatarUrl: string | undefined = undefined;
      if (avatarUrl) {
        const downloadedAvatar = await this.downloadAndSaveAvatar(avatarUrl, providerUserId);
        if (downloadedAvatar) {
          savedAvatarUrl = downloadedAvatar;
        }
      }

      user = await storage.createUser({
        username: uniqueUsername,
        password: randomPassword,
        email: email || undefined,
        fullName: displayName || undefined,
        avatarUrl: savedAvatarUrl,
        language: language || 'en', // Use language from OAuth state or default to 'en'
      });
      
      isNewUser = true;
      
      // Create default "My books" shelf for new OAuth user
      try {
        console.log('[OAuth] Creating default shelf for new user');
        await storage.createShelf(user.id, {
          name: 'My books',
          description: 'Your personal book collection',
        });
        console.log('[OAuth] ✅ Default shelf created');
      } catch (shelfError) {
        console.error('[OAuth] Failed to create default shelf:', shelfError);
      }
    }

    // Link OAuth account to user
    await storage.createOAuthAccount({
      userId: user.id,
      provider,
      providerUserId,
      email: email || undefined,
      encryptedAccessToken: encryptToken(accessToken),
      encryptedRefreshToken: safeEncryptToken(refreshToken),
      tokenExpiresAt: tokenExpiresAt || undefined,
    });

    return { user, isNewUser };
  }

  /**
   * Gets linked OAuth accounts for a user
   */
  async getLinkedAccounts(userId: string) {
    return await storage.getOAuthAccountsByUserId(userId);
  }

  /**
   * Unlinks an OAuth account (with safety check)
   */
  async unlinkAccount(userId: string, provider: OAuthProvider): Promise<{ success: boolean; error?: string }> {
    // Check if user has other auth methods
    const authMethodCount = await storage.countUserAuthMethods(userId);

    if (authMethodCount <= 1) {
      return {
        success: false,
        error: 'Cannot unlink last authentication method',
      };
    }

    const success = await storage.unlinkOAuthAccount(userId, provider);
    return { success };
  }
}

export const oauthService = new OAuthService();
