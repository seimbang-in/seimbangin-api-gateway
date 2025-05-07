import { Router } from "express";

import { statisticController } from "../controllers/statistic";
import { authenticateJWT } from "../middleware/jwt";

const statisticRouter = Router();

statisticRouter.get("/monthly", authenticateJWT, statisticController.getTotalIncomeHistory);

export default statisticRouter;
