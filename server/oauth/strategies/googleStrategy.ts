import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getProviderConfig } from '../../config/oauth';
import type { OAuthProviderConfig } from '../../config/oauth';

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
}

export function setupGoogleStrategy() {
  const config = getProviderConfig('google') as OAuthProviderConfig;

  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: config.clientId,
        clientSecret: config.clientSecret,
        callbackURL: config.redirectUri,
        scope: config.scope,
      },
      (accessToken, refreshToken, profile, done) => {
        const userProfile: GoogleProfile = {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          photos: profile.photos,
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
