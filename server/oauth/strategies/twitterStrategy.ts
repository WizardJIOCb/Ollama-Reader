import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { getProviderConfig } from '../../config/oauth';
import type { OAuthProviderConfig } from '../../config/oauth';

export interface TwitterProfile {
  id: string;
  username: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

export function setupTwitterStrategy() {
  const config = getProviderConfig('twitter') as OAuthProviderConfig;

  passport.use(
    'twitter',
    new TwitterStrategy(
      {
        consumerKey: config.clientId,
        consumerSecret: config.clientSecret,
        callbackURL: config.redirectUri,
        includeEmail: true,
      },
      (token, tokenSecret, profile, done) => {
        const userProfile: TwitterProfile = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          emails: profile.emails,
          photos: profile.photos,
        };

        done(null, {
          profile: userProfile,
          accessToken: token,
          tokenSecret,
        });
      }
    )
  );
}
