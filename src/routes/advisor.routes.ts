import { Router } from "express";

import authenticateJWT from "../middleware/jwt";
import { advisorController } from "../controllers/advisor";

const advisorRouter = Router();

advisorRouter.get("/", authenticateJWT, advisorController.getAdvice);

export default advisorRouter;
