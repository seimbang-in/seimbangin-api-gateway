import { Router } from "express";

import { advisorController } from "../controllers/advisor";
import { authenticateJWT } from "../middleware/jwt";

const advisorRouter = Router();

advisorRouter.get("/", authenticateJWT, advisorController.getAdvice);

export default advisorRouter;
