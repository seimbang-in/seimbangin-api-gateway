import { Router } from "express";
import authController from "../controllers/auth";
const authRouter = Router();
import validate from "../middleware/validate";

authRouter.post("/login", validate.login, authController.login);
authRouter.post("/register", validate.register, authController.register);

export default authRouter;
