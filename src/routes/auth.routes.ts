import { Router } from "express";
import authController from "../controllers/auth";
import devAuthController from "../controllers/authDev";

const authRouter = Router();
const devAuthRouter = Router();

import validate from "../middleware/validate";

authRouter.post("/login", validate.login, authController.login);
authRouter.post("/register", validate.register, authController.register);

authRouter.post("/dev/login", validate.login, devAuthController.login);
authRouter.post("/dev/register", validate.register, devAuthController.register);

export default authRouter;
