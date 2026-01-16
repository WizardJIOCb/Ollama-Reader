import axios from 'axios';
import { getProviderConfig } from '../../config/oauth';
import type { OAuthProviderConfig } from '../../config/oauth';

export interface YandexTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

export interface YandexUserInfo {
  id: string;
  login: string;
  default_email: string;
  display_name: string;
  real_name?: string;
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
}

export async function getYandexAuthUrl(state: string): Promise<string> {
  const config = getProviderConfig('yandex') as OAuthProviderConfig;
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

export async function exchangeYandexCode(code: string): Promise<YandexTokenResponse> {
  const config = getProviderConfig('yandex') as OAuthProviderConfig;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await axios.post<YandexTokenResponse>(
    config.tokenUrl,
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

export async function getYandexUserInfo(accessToken: string): Promise<YandexUserInfo> {
  const response = await axios.get<YandexUserInfo>(
    'https://login.yandex.ru/info',
    {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
      params: {
        format: 'json',
      },
    }
  );

  return response.data;
}
