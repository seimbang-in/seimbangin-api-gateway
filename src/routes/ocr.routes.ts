import { Router } from "express";

import authenticateJWT from "../middleware/jwt";
import ocrController from "../controllers/ocr";
import { multerUpload } from "../utils/googleCloudStorageHelper";

const ocrRouter = Router();

ocrRouter.post(
  "/",
  authenticateJWT,
  multerUpload.single("photo"),
  ocrController.post,
);

export default ocrRouter;
