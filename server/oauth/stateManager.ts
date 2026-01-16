import crypto from 'crypto';
import { db } from '../storage';
import { oauthStates } from '@shared/schema';
import { eq, lt } from 'drizzle-orm';
import type { OAuthProvider } from '../config/oauth';

const STATE_TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters
const STATE_TTL_MINUTES = 5; // State tokens expire after 5 minutes

/**
 * Generates a cryptographically secure random state token
 */
function generateStateToken(): string {
  return crypto.randomBytes(STATE_TOKEN_LENGTH).toString('hex');
}

/**
 * Generates a PKCE code verifier (43-128 characters, URL-safe)
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generates a PKCE code challenge from a code verifier using S256 method
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Creates a new OAuth state token for CSRF protection
 * @param provider The OAuth provider name
 * @param codeVerifier Optional PKCE code verifier to store with state
 * @returns The generated state token
 */
export async function createState(provider: OAuthProvider, codeVerifier?: string): Promise<string> {
  const stateToken = generateStateToken();
  const expiresAt = new Date(Date.now() + STATE_TTL_MINUTES * 60 * 1000);

  await db.insert(oauthStates).values({
    stateToken,
    provider,
    codeVerifier,
    expiresAt,
  });

  return stateToken;
}

/**
 * Result of state validation with optional PKCE data
 */
export interface StateValidationResult {
  valid: boolean;
  codeVerifier?: string | null;
}

/**
 * Validates and consumes an OAuth state token
 * @param stateToken The state token to validate
 * @param provider The expected provider
 * @returns Validation result with optional code_verifier for PKCE
 */
export async function validateAndConsumeState(
  stateToken: string,
  provider: OAuthProvider
): Promise<StateValidationResult> {
  if (!stateToken) {
    return { valid: false };
  }

  const [state] = await db
    .select()
    .from(oauthStates)
    .where(eq(oauthStates.stateToken, stateToken))
    .limit(1);

  if (!state) {
    return { valid: false };
  }

  // Delete the state token (one-time use)
  await db.delete(oauthStates).where(eq(oauthStates.stateToken, stateToken));

  // Check if expired
  if (state.expiresAt < new Date()) {
    return { valid: false };
  }

  // Check if provider matches
  if (state.provider !== provider) {
    return { valid: false };
  }

  return { valid: true, codeVerifier: state.codeVerifier };
}

/**
 * Cleans up expired state tokens
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredStates(): Promise<number> {
  const result = await db
    .delete(oauthStates)
    .where(lt(oauthStates.expiresAt, new Date()));

  return result.rowCount || 0;
}
