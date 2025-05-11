import { Router } from "express";

import { statisticController } from "../controllers/statistic";
import { authenticateJWT } from "../middleware/jwt";

const statisticRouter = Router();

statisticRouter.get(
  "/monthly",
  authenticateJWT,
  statisticController.getTotalIncomeHistory,
);
statisticRouter.get(
  "/category-item",
  authenticateJWT,
  statisticController.getCategoryItem,
);
statisticRouter.get(
  "/category-transaction",
  authenticateJWT,
  statisticController.getCategoryTransaction,
);

export default statisticRouter;
