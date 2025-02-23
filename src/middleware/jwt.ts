import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createResponse } from "../utils/response";

const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    createResponse.error({
      res,
      status: 401,
      message: "Unauthorized",
    });
    return; // ⬅️ Pastikan ada return di sini
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      status: "error",
      message: "Internal Server Error, JWT_SECRET belum diatur",
    });
    return; // ⬅️ Pastikan ada return di sini
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      createResponse.error({
        res,
        status: 403,
        message: "Forbidden",
      });
      return; // ⬅️ Pastikan ada return di sini
    }

    req.user = user;
    next();
  });
};

export default authenticateJWT;
