import { Request, Response } from "express";
import db from "../db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { createResponse } from "../utils/response";
import jwt from "jsonwebtoken";

const oauthController = {
  findUserByGoogleId: async (googleId: string) => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId));
    return user ?? null;
  },

  findUserById: async (id: number) => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return user ?? null;
  },

  /**
   * Digunakan dalam GoogleStrategy → jangan langsung dipakai sebagai endpoint
   */
  createUser: async (data: {
    googleId: string;
    username: string;
    full_name: string;
    email: string;
    profilePicture?: string | null;
  }) => {
    await db.insert(usersTable).values({
      googleId: data.googleId,
      username: data.username,
      full_name: data.full_name || data.username,
      email: data.email,
      password: "", // karena OAuth
      profilePicture: data.profilePicture ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await oauthController.findUserByGoogleId(data.googleId);
  },

  /**
   * Endpoint callback OAuth manual (kalau tidak pakai passport auto redirect)
   */
  handleGoogleCallback: async (req: Request, res: Response) => {
    if (!req.user) {
      return createResponse.error({
        res,
        status: 401,
        message: "Unauthorized",
      });
    }

    try {
      const user = req.user;
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        return createResponse.error({
          res,
          status: 500,
          message: "JWT_SECRET belum di-set",
        });
      }

      const expiresIn = 604800; // 7 hari
      const token = jwt.sign(user, jwtSecret, {
        expiresIn,
      });

      return createResponse.success({
        res,
        message: "OAuth login success",
        data: {
          token,
          expiresIn,
        },
      });
    } catch (error) {
      return createResponse.error({
        res,
        status: 500,
        message: "Gagal membuat token dari user OAuth",
      });
    }
  },
};

export default oauthController;
