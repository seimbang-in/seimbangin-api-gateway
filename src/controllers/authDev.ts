import { createDecipheriv } from "crypto"; // Import decryption from Node.js
import { hash, compare, genSalt } from "bcryptjs";
import { sql } from "drizzle-orm";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import db from "../db";
import { usersTable } from "../db/schema";
import { validationResult } from "express-validator";
import { createResponse } from "../utils/response";

// Kunci dan konfigurasi untuk dekripsi (harus sesuai dengan Flutter)
const AES_KEY = "12345678901234567890123456789012"; // Panjang 32 byte
const AES_ALGORITHM = "aes-256-ecb"; // Gunakan ECB mode

function decryptPassword(encrypted: string): string {
  const decipher = createDecipheriv(AES_ALGORITHM, AES_KEY, null); // ECB tidak butuh IV
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

const authController = {
  register: async (req: Request, res: Response) => {
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

    const { full_name, username, email, password, age } = req.body;

    try {
      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt); // Hash sebelum disimpan

      await db.insert(usersTable).values({
        full_name,
        username,
        email,
        age,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createResponse.success({
        res,
        message: "User registered successfully",
      });
    } catch (error) {
      createResponse.error({
        res,
        status: 500,
        message: "Error occurred while processing the request",
      });
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
      return;
    }

    const { password: encryptedPassword, email } = req.body;

    // Dekripsi password yang diterima dari Flutter
    let decryptedPassword: string;
    try {
      decryptedPassword = decryptPassword(encryptedPassword);
    } catch (error) {
      createResponse.error({
        res,
        status: 400,
        message: "Invalid password format",
      });
      return;
    }

    const queryUser = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.email} = ${email}`);

    if (queryUser.length === 0) {
      createResponse.error({
        res,
        status: 404,
        message: "User not found",
      });
      return;
    }

    const existingUser = queryUser[0];

    // Cek kecocokan password dengan hash
    const passwordMatch = await compare(decryptedPassword, existingUser.password);

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
        error: "Internal Server Error, JWT_SECRET not set",
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
    }
  },
};

export default authController;
