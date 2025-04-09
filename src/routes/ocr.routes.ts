import { Router } from "express";

import ocrController from "../controllers/ocr";
import { authenticateJWT } from "../middleware/jwt";
import { multerUpload } from "../utils/googleCloudStorageHelper";

const ocrRouter = Router();

ocrRouter.post(
  "/",
  authenticateJWT,
  multerUpload.single("photo"),
  ocrController.post,
);

export default ocrRouter;
