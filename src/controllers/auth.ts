import { compare, genSalt, hash } from "bcryptjs";
import { sql } from "drizzle-orm";
import e, { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import db from "../db";
import { usersTable } from "../db/schema";
import { createResponse } from "../utils/response";

const authController = {
  register: async (req: Request, res: Response) => {
    // check validaion from express-validator

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      createResponse.error({
        res,
        status: 400,
        message: "Validation Error",
        data: errors.array(),
      });
      return;
    }

    // check if email already exists
    const emailExists = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.email} = ${req.body.email}`);

    if (emailExists.length > 0) {
      createResponse.error({
        res,
        status: 400,
        message: "Email already exists",
      });
      return;
    }

    // check if phone already exists
    const phoneExists = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.phone} = ${req.body.phone}`);

    if (phoneExists.length > 0) {
      createResponse.error({
        res,
        status: 400,
        message: "Phone already exists",
      });
      return;

    }

    // check if username already exists
    const usernameExists = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.username} = ${req.body.username}`);

    if (usernameExists.length > 0) {
      createResponse.error({
        res,
        status: 400,
        message: "Username already exists",
      });
      return;
    }

    // destructure the required fields
    const { full_name, email, password, username, phone } = req.body;

    try {
      // hash the password
      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);

      try {
        // insert the user into the database
        await db.insert(usersTable).values({
          full_name,
          email,
          phone,
          username,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error("Insert user error:", error);
        createResponse.error({
          res,
          status: 500,
          message: "Error occurred while inserting the user",
          data: error instanceof Error ? error.message : String(error),
        });
        return;
      }


      // create user financial profile
      createResponse.success({
        res,
        message: "User registered successfully",
      });
    } catch (error) {
      createResponse.error({
        res,
        status: 500,
        message: "Error occurred while hashing the password",
      });
      return;
    }
  },

  login: async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      createResponse.error({
        res,
        status: 400,
        message: "Validation Error",
        data: errors.array(),
      });
    }

    const { password, identifier } = req.body;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\d+$/.test(identifier);
    const column = isEmail ? usersTable.email : isPhone ? usersTable.phone : usersTable.username;

    const queryUser = await db
      .select()
      .from(usersTable)
      .where(sql`${column} = ${identifier}`);

    if (queryUser.length == 0) {
      createResponse.error({
        res,
        status: 404,
        message: "User not found",
      });

      return;
    }

    const existingUser = queryUser[0];

    const existingUserPassword = existingUser.password;

    if (!existingUserPassword) {
      createResponse.error({
        res,
        status: 401,
        message: "Invalid credentials",
      });
      return;
    }

    const passwordMatch = await compare(password, existingUserPassword);

    if (!passwordMatch) {
      createResponse.error({
        res,
        status: 401,
        message: "Invalid credentials",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).send({
        error: "Internal Server Error, JWT LOM DISET COKK",
      });

      return;
    }

    try {
      const expiresIn = 604800;

      const token = jwt.sign(existingUser, jwtSecret, {
        expiresIn: expiresIn,
      });

      createResponse.success({
        res,
        message: "Login Success",
        data: {
          token,
          expiresIn,
        },
      });
    } catch (error) {
      createResponse.error({
        res,
        status: 500,
        message: "Error occurred while creating the token",
      });
      return;
    }
  },
};

export default authController;
