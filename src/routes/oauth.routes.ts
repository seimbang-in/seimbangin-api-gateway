import { Router } from "express";
import passport from "passport";
import oauthController from "../controllers/oauth";

const router = Router();

router.get(
  "/",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/login",
    session: false, // ⛔️ disable session kalau pakai JWT
  }),
  oauthController.handleGoogleCallback
);

export default router;
