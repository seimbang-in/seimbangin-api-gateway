import { Router, Request, Response } from "express";
import passport from "../middleware/passport";
import jwt from "jsonwebtoken";

const OauthRouter = Router();

OauthRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

OauthRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: Request, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables.");
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    const user = req.user as { id: number };

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  }
);

export default OauthRouter;
