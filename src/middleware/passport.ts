import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import db from "../db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials are missing!");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userEmail = profile.emails?.[0]?.value;
        if (!userEmail) {
          return done(new Error("Google account does not have a valid email"));
        }

        let user = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, userEmail))
          .then((rows) => rows[0]);

        if (!user) {
          // Generate username dari email jika tidak ada
          const generatedUsername = userEmail.split("@")[0];

          // Insert user baru dan ambil ID yang dibuat
          const insertedUsers = await db
            .insert(usersTable)
            .values({
              full_name: profile.displayName,
              email: userEmail,
              profilePicture: profile.photos?.[0]?.value,
              username: generatedUsername, // Tambahkan username
              password: "", // Kosongkan password untuk OAuth
            })
            .execute(); // Jalankan query

          // Ambil ID pertama dari hasil insert
          const insertedUserId = insertedUsers?.[0]?.insertId;

          if (!insertedUserId) {
            return done(new Error("Failed to insert new user"));
          }

          // Ambil kembali user yang baru dibuat
          user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, insertedUserId))
            .then((rows) => rows[0]);
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const numericId = Number(id); // Pastikan id dalam bentuk angka
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, numericId))
      .then((rows) => rows[0]);

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
