import { hash, compare, genSalt } from "bcryptjs";
import { sql } from "drizzle-orm";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import db from "../db";
import { usersTable } from "../db/schema";
import { validationResult } from "express-validator";
import { createResponse } from "../utils/response";

const generateToken = (user: any) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET is not set");

  return jwt.sign(
    { id: user.id, email: user.email, googleId: user.googleId },
    jwtSecret,
    { expiresIn: "7d" }
  );
};

const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return createResponse.error({
          res,
          status: 400,
          message: "Validation Error",
          data: errors.array(),
        });
      }

      const { full_name, username, email, password } = req.body;

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(sql`${usersTable.email} = ${email}`);

      if (existingUser.length > 0) {
        return createResponse.error({
          res,
          status: 400,
          message: "Email already exists",
        });
      }

      if (!password) {
        return createResponse.error({
          res,
          status: 400,
          message: "Password is required",
        });
      }

      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          full_name,
          username,
          email,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createResponse.success({
        res,
        message: "User registered successfully",
        data: { token: generateToken(newUser) },
      });
    } catch (error) {
      console.error("Register Error:", error);
      return createResponse.error({
        res,
        status: 500,
        message: "Internal Server Error",
      });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return createResponse.error({
          res,
          status: 400,
          message: "Validation Error",
          data: errors.array(),
        });
      }

      const { identifier, password } = req.body;

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const column = isEmail ? usersTable.email : usersTable.username;

      const queryUser = await db
        .select()
        .from(usersTable)
        .where(sql`${column} = ${identifier}`);

      if (queryUser.length === 0) {
        return createResponse.error({
          res,
          status: 404,
          message: "User not found",
        });
      }

      const existingUser = queryUser[0];

      if (!existingUser.password) {
        return createResponse.error({
          res,
          status: 400,
          message: "This account uses Google Login. Please sign in with Google.",
        });
      }

      const passwordMatch = await compare(password, existingUser.password);
      if (!passwordMatch) {
        return createResponse.error({
          res,
          status: 401,
          message: "Invalid credentials",
        });
      }

      return createResponse.success({
        res,
        message: "Login Success",
        data: { token: generateToken(existingUser) },
      });
    } catch (error) {
      console.error("Login Error:", error);
      return createResponse.error({
        res,
        status: 500,
        message: "Internal Server Error",
      });
    }
  },

  googleCallback: async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const token = generateToken(user);
      return createResponse.success({
        res,
        message: "Google Login Success",
        data: { token },
      });
    } catch (error) {
      return createResponse.error({
        res,
        status: 500,
        message: "Error during Google login",
      });
    }
  },
};

export default authController;
