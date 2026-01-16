import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { getProviderConfig } from '../../config/oauth';
import type { OAuthProviderConfig } from '../../config/oauth';

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  verified?: boolean;
  avatar?: string;
}

export function setupDiscordStrategy() {
  const config = getProviderConfig('discord') as OAuthProviderConfig;

  passport.use(
    'discord',
    new DiscordStrategy(
      {
        clientID: config.clientId,
        clientSecret: config.clientSecret,
        callbackURL: config.redirectUri,
        scope: config.scope,
      },
      (accessToken, refreshToken, profile, done) => {
        const userProfile: DiscordProfile = {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          email: profile.email,
          verified: profile.verified,
          avatar: profile.avatar,
        };

        done(null, {
          profile: userProfile,
          accessToken,
          refreshToken,
        });
      }
    )
  );
}
