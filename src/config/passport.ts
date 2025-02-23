import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import db from "../db";
import { usersTable } from "../db/schema";
import { sql, InferSelectModel, eq } from "drizzle-orm";

dotenv.config();

type User = InferSelectModel<typeof usersTable>; // Definisikan tipe user

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const full_name = profile.displayName;
        const profilePicture = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("Google account does not have an email"), false);
        }

        // Cek apakah user sudah ada
        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email));

        if (existingUser.length > 0) {
          return done(null, existingUser[0]);
        }

        // Jika user baru, buat akun otomatis
        const result = await db.insert(usersTable).values({
          full_name,
          username: email, // Gunakan email sebagai username default
          email,
          googleId,
          profilePicture,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).execute();

        // Ambil ID user yang baru dibuat
        const insertedId = result[0].insertId;

        // Ambil data lengkap pengguna berdasarkan ID
        const [newUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, insertedId));

        return done(null, newUser || false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    done(null, user[0] || false);
  } catch (error) {
    done(error, false);
  }
});

export default passport;
