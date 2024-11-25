import { Router } from "express";
import authenticateJWT from "../middleware/jwt";
import validate from "../middleware/validate";

import { financialProfileController } from "../controllers/financialProfile";

const financialProfileRouter = Router();

financialProfileRouter.put(
  "/",
  authenticateJWT,
  validate.createFinancialProfile,
  financialProfileController.update,
);

export default financialProfileRouter;
