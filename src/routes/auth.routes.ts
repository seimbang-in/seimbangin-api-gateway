import { Router } from "express";
import passport from "../config/passport";
import authController from "../controllers/auth";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

export default router;
