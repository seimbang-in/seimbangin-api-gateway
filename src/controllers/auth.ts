import { hash, compare, genSalt } from "bcryptjs";
import { sql } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../db";
import { usersTable } from "../db/schema";
import { validationResult } from "express-validator";
import { createResponse } from "../utils/response";

const authController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const { full_name, username, email, password, age } = req.body;

      // Cek apakah email sudah terdaftar
      const emailExists = await db
        .select()
        .from(usersTable)
        .where(sql`${usersTable.email} = ${email}`);

      if (emailExists.length > 0) {
        return createResponse.error({
          res,
          status: 400,
          message: "Email already exists",
        });
      }

      // Hash password
      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);

      await db.insert(usersTable).values({
        full_name,
        username,
        email,
        age,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return createResponse.success({
        res,
        message: "User registered successfully",
      });

    } catch (error) {
      next(error); // Lempar error ke middleware
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const { password, identifier } = req.body;

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

      const passwordMatch = await compare(password, existingUser.password);
      if (!passwordMatch) {
        return createResponse.error({
          res,
          status: 401,
          message: "Invalid credentials",
        });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).json({ error: "Internal Server Error, JWT belum di-set" });
        return;
      }

      const expiresIn = 604800;
      const token = jwt.sign({ id: existingUser.id }, jwtSecret, { expiresIn });

      return createResponse.success({
        res,
        message: "Login Success",
        data: { token, expiresIn },
      });

    } catch (error) {
      next(error); // Lempar error ke middleware
    }
  },
};

export default authController;
