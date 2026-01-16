import { config } from 'dotenv';

config();

export type OAuthProvider = 'google' | 'vk' | 'telegram' | 'twitter' | 'yandex' | 'discord';

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
}

export interface TelegramConfig {
  botToken: string;
}

interface OAuthConfig {
  encryptionKey: string;
  appUrl: string;
  providers: {
    google: OAuthProviderConfig;
    vk: OAuthProviderConfig;
    telegram: TelegramConfig;
    twitter: OAuthProviderConfig;
    yandex: OAuthProviderConfig;
    discord: OAuthProviderConfig;
  };
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOAuthConfig(): OAuthConfig {
  const appUrl = validateEnvVar('APP_URL', process.env.APP_URL);
  const encryptionKey = validateEnvVar('OAUTH_ENCRYPTION_KEY', process.env.OAUTH_ENCRYPTION_KEY);

  if (encryptionKey.length !== 64) {
    throw new Error('OAUTH_ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate with: openssl rand -hex 32');
  }

  return {
    encryptionKey,
    appUrl,
    providers: {
      google: {
        clientId: validateEnvVar('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID),
        clientSecret: validateEnvVar('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET),
        redirectUri: `${appUrl}/auth/callback/google`,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: ['openid', 'email', 'profile'],
      },
      vk: {
        clientId: validateEnvVar('VK_CLIENT_ID', process.env.VK_CLIENT_ID),
        clientSecret: validateEnvVar('VK_CLIENT_SECRET', process.env.VK_CLIENT_SECRET),
        redirectUri: `${appUrl}/auth/callback/vk`,
        authorizationUrl: 'https://id.vk.ru/authorize',
        tokenUrl: 'https://id.vk.ru/oauth2/auth',
        scope: ['email'],
      },
      telegram: {
        botToken: validateEnvVar('TELEGRAM_BOT_TOKEN', process.env.TELEGRAM_BOT_TOKEN),
      },
      twitter: {
        clientId: validateEnvVar('TWITTER_CLIENT_ID', process.env.TWITTER_CLIENT_ID),
        clientSecret: validateEnvVar('TWITTER_CLIENT_SECRET', process.env.TWITTER_CLIENT_SECRET),
        redirectUri: `${appUrl}/auth/callback/twitter`,
        authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scope: ['tweet.read', 'users.read'],
      },
      yandex: {
        clientId: validateEnvVar('YANDEX_CLIENT_ID', process.env.YANDEX_CLIENT_ID),
        clientSecret: validateEnvVar('YANDEX_CLIENT_SECRET', process.env.YANDEX_CLIENT_SECRET),
        redirectUri: `${appUrl}/auth/callback/yandex`,
        authorizationUrl: 'https://oauth.yandex.ru/authorize',
        tokenUrl: 'https://oauth.yandex.ru/token',
        scope: ['login:email', 'login:info'],
      },
      discord: {
        clientId: validateEnvVar('DISCORD_CLIENT_ID', process.env.DISCORD_CLIENT_ID),
        clientSecret: validateEnvVar('DISCORD_CLIENT_SECRET', process.env.DISCORD_CLIENT_SECRET),
        redirectUri: `${appUrl}/auth/callback/discord`,
        authorizationUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scope: ['identify', 'email'],
      },
    },
  };
}

let cachedConfig: OAuthConfig | null = null;

export function getConfig(): OAuthConfig {
  if (!cachedConfig) {
    cachedConfig = getOAuthConfig();
  }
  return cachedConfig;
}

export function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig | TelegramConfig {
  const config = getConfig();
  return config.providers[provider];
}

export function isProviderEnabled(provider: OAuthProvider): boolean {
  try {
    getProviderConfig(provider);
    return true;
  } catch {
    return false;
  }
}
