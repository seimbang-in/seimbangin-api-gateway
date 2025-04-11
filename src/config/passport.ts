import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import oauthController from "../controllers/oauth";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  throw new Error("Google OAuth environment variables are not set properly.");
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await oauthController.findUserById(id);
    done(null, user ?? null);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await oauthController.findUserByGoogleId(profile.id);

        if (!user) {
          user = await oauthController.createUser({
            googleId: profile.id,
            username: profile.displayName,
            full_name: profile.displayName,
            email: profile.emails?.[0]?.value || "",
            profilePicture: profile.photos?.[0]?.value ?? null,
          });
        }

        done(null, user);
      } catch (err) {
        done(err as any);
      }
    }
  )
);
