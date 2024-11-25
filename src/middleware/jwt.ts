import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createResponse } from "../utils/response";

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    createResponse.error({
      res,
      status: 401,
      message: "Unauthorized",
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

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      createResponse.error({
        res,
        status: 403,
        message: "Forbidden",
      });

      return;
    }

    req.user = user;
    next();
  });
};

export default authenticateJWT;
