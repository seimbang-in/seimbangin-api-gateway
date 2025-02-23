import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createResponse } from "../utils/response";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return createResponse.error({
      res,
      status: 401,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not set" });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return createResponse.error({
        res,
        status: 403,
        message: "Forbidden: Invalid Token",
      });
    }
    req.user = user;
    next();
  });
};
