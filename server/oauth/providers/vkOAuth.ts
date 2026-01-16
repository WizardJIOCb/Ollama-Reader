import axios from 'axios';
import { getProviderConfig } from '../../config/oauth';
import { generateCodeVerifier, generateCodeChallenge } from '../stateManager';
import type { OAuthProviderConfig } from '../../config/oauth';

export interface VKTokenResponse {
  access_token: string;
  expires_in: number;
  user_id: number;
  email?: string;
  refresh_token?: string;
}

export interface VKUserInfo {
  user_id: number;
  first_name: string;
  last_name: string;
  avatar?: string;
  email?: string;
}

export interface VKAuthParams {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generates PKCE parameters for VK ID OAuth
 */
export function generateVKAuthParams(state: string): VKAuthParams {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  return { state, codeVerifier, codeChallenge };
}

export async function getVKAuthUrl(state: string, codeChallenge: string): Promise<string> {
  const config = getProviderConfig('vk') as OAuthProviderConfig;
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

export async function exchangeVKCode(code: string, codeVerifier: string, state: string, deviceId: string): Promise<VKTokenResponse> {
  const config = getProviderConfig('vk') as OAuthProviderConfig;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier,
    device_id: deviceId,
    state,
  });

  try {
    const response = await axios.post<VKTokenResponse>(
      config.tokenUrl,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('VK token exchange error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getVKUserInfo(accessToken: string): Promise<VKUserInfo> {
  const config = getProviderConfig('vk') as OAuthProviderConfig;
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    access_token: accessToken,
  });

  try {
    const response = await axios.post<VKUserInfo>(
      'https://id.vk.ru/oauth2/user_info',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('VK user info error:', error.response?.data || error.message);
    throw error;
  }
}
