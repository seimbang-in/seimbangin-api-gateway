import { Router } from "express";
import validate from "../../middleware/validate";
import authDevController from "../../controllers/authDev";

const authDevRouter = Router();

authDevRouter.post("/login", validate.login, authDevController.login);
authDevRouter.post("/register", validate.register, authDevController.register);

export default authDevRouter;
